from rest_framework.response import Response
from rest_framework import status
from src.core.models import KPITask, KPIDirection, KPIMonthPlan
from .base import BaseAdminAPIView


def _auto_score(task, given_score, max_score):
    """
    Reja mavjud → max_per_task = max_score / target_count
    Reja yo'q   → direction.default_target fallback
    Returns (final_score, error_message).
    """
    plan = KPIMonthPlan.objects.filter(
        direction_key=task.direction,
        month=task.month,
    ).first()

    if plan and plan.target_count > 0:
        max_per_task = round(float(max_score) / plan.target_count, 2)
    else:
        # Fall back to direction's default_target
        try:
            dt = KPIDirection.objects.get(key=task.direction).default_target
            max_per_task = round(float(max_score) / dt, 2) if dt > 0 else None
        except KPIDirection.DoesNotExist:
            max_per_task = None

    if max_per_task is None:
        if given_score is not None:
            return min(float(given_score), float(max_score)), None
        return None, "Bu yo'nalish uchun reja yoki default qo'yilmagan. Ballni qo'lda kiriting."

    final = min(float(given_score), max_per_task) if given_score is not None else max_per_task
    return final, None


class AdminReviewTaskView(BaseAdminAPIView):
    """Bitta topshiriqni tasdiqlash yoki rad etish."""

    def post(self, request, task_id):
        try:
            task = KPITask.objects.get(id=task_id)
        except KPITask.DoesNotExist:
            return Response({"error": "Topshiriq topilmadi"}, status=status.HTTP_404_NOT_FOUND)

        if task.status != 'sariq':
            return Response(
                {"error": "Faqat kutilayotgan (sariq) topshiriqlarni ko'rib chiqish mumkin"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action = request.data.get('action')

        if action == 'tasdiqlash':
            raw_score = request.data.get('score')
            try:
                given_score = float(raw_score) if raw_score not in (None, '') else None
            except (TypeError, ValueError):
                return Response({"error": "Ball son bo'lishi kerak"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                direction = KPIDirection.objects.get(key=task.direction)
                max_score = direction.max_score
            except KPIDirection.DoesNotExist:
                max_score = 10

            final_score, score_err = _auto_score(task, given_score, max_score)
            if score_err:
                return Response({"error": score_err}, status=status.HTTP_400_BAD_REQUEST)

            if final_score < 0 or final_score > max_score + 0.01:
                return Response(
                    {"error": f"Ball 0 dan {max_score} gacha bo'lishi kerak"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            task.status = 'yashil'
            task.score = final_score
            task.admin_comment = None

        elif action == 'rad_etish':
            comment = request.data.get('admin_comment', '').strip()
            if not comment:
                return Response(
                    {"error": "Rad etish sababini kiriting (admin_comment)"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            task.status = 'qizil'
            task.score = 0
            task.admin_comment = comment

        else:
            return Response(
                {"error": "Noto'g'ri amal. 'tasdiqlash' yoki 'rad_etish' bo'lishi kerak"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task.save()
        return Response(
            {
                "message": f"Topshiriq '{task.get_status_display()}' holatiga o'tkazildi",
                "score": task.score,
            },
            status=status.HTTP_200_OK,
        )


class AdminBulkReviewView(BaseAdminAPIView):
    """
    Bir vaqtda bir nechta topshiriqni tasdiqlash yoki rad etish.
    POST {task_ids: [1,2,3], action: 'tasdiqlash', score: 3.75}
         {task_ids: [4,5],   action: 'rad_etish',  admin_comment: '...'}
    """

    def post(self, request):
        task_ids = request.data.get('task_ids', [])
        action = request.data.get('action')

        if not task_ids:
            return Response({"error": "task_ids kerak"}, status=status.HTTP_400_BAD_REQUEST)

        tasks = KPITask.objects.filter(id__in=task_ids, status='sariq')
        if not tasks.exists():
            return Response({"error": "Kutilayotgan topshiriqlar topilmadi"}, status=status.HTTP_404_NOT_FOUND)

        updated = 0

        if action == 'tasdiqlash':
            raw_score = request.data.get('score')
            try:
                given_score = float(raw_score) if raw_score not in (None, '') else None
            except (TypeError, ValueError):
                return Response({"error": "Ball son bo'lishi kerak"}, status=status.HTTP_400_BAD_REQUEST)

            for task in tasks:
                try:
                    direction = KPIDirection.objects.get(key=task.direction)
                    max_score = direction.max_score
                except KPIDirection.DoesNotExist:
                    max_score = 10

                final_score, score_err = _auto_score(task, given_score, max_score)
                if score_err:
                    return Response({"error": score_err}, status=status.HTTP_400_BAD_REQUEST)

                task.status = 'yashil'
                task.score = final_score
                task.admin_comment = None
                task.save()
                updated += 1

        elif action == 'rad_etish':
            comment = request.data.get('admin_comment', '').strip()
            if not comment:
                return Response({"error": "Rad etish sababini kiriting"}, status=status.HTTP_400_BAD_REQUEST)
            tasks.update(status='qizil', score=0, admin_comment=comment)
            updated = tasks.count()

        else:
            return Response({"error": "Noto'g'ri amal"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": f"{updated} ta topshiriq bajarildi", "updated": updated})
