from rest_framework.response import Response
from rest_framework import status
from src.core.models import KPITask
from src.api.views.stats import MAX_SCORES
from .base import BaseAdminAPIView


class AdminReviewTaskView(BaseAdminAPIView):
    """Topshiriqni tasdiqlash yoki rad etish.
    POST body: { "action": "tasdiqlash" | "rad_etish", "score": float, "admin_comment": str }
    """

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
            try:
                given_score = float(request.data.get('score', 0))
            except (TypeError, ValueError):
                return Response({"error": "Ball son bo'lishi kerak"}, status=status.HTTP_400_BAD_REQUEST)

            max_score = MAX_SCORES.get(task.direction, 10)
            if given_score < 0 or given_score > max_score:
                return Response(
                    {"error": f"Ball 0 dan {max_score} gacha bo'lishi kerak"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            task.status = 'yashil'
            task.score = given_score
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
            {"message": f"Topshiriq '{task.get_status_display()}' holatiga o'tkazildi"},
            status=status.HTTP_200_OK,
        )
