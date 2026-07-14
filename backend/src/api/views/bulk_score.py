import calendar
from datetime import date
from rest_framework.response import Response
from rest_framework import status
from src.core.models import KPITask, Profile, KPIDirection
from .base import BaseAdminAPIView


def workdays_in_month(year, month):
    """Count Mon-Fri days in a given year/month."""
    _, days = calendar.monthrange(year, month)
    return sum(
        1 for d in range(1, days + 1)
        if date(year, month, d).weekday() < 5
    )


def score_per_workday(year, month, total_score=20):
    wdays = workdays_in_month(year, month)
    if wdays == 0:
        return 0
    return round(total_score / wdays, 4)


class AdminBulkScoreView(BaseAdminAPIView):
    """
    GET  ?direction=1_ijro&date=2026-07-14
    POST {direction, date, scores: [{profile_id, score}]}

    For 1_ijro: score is 0 or 1 (attendance). Backend converts 1 → score_per_workday.
    For other admin_scored directions: score is a raw numeric value.
    """

    def get(self, request):
        direction = request.query_params.get('direction')
        date_str = request.query_params.get('date')

        if not direction or not date_str:
            return Response({'error': 'direction va date kerak'}, status=status.HTTP_400_BAD_REQUEST)

        profiles = Profile.objects.all().order_by('mahalla_name')
        result = []

        extra = {}
        if direction == '1_ijro':
            try:
                y, m, _ = date_str.split('-')
                spd = score_per_workday(int(y), int(m))
                wdays = workdays_in_month(int(y), int(m))
                extra = {'score_per_day': spd, 'workdays': wdays}
            except Exception:
                pass

        for p in profiles:
            task = KPITask.objects.filter(leader=p, direction=direction, month=date_str).first()
            entry = {
                'profile_id': p.id,
                'mahalla_name': p.mahalla_name,
                'task_id': task.id if task else None,
            }
            if direction == '1_ijro':
                if task:
                    spd = extra.get('score_per_day', 0)
                    entry['score'] = 1 if (task.score or 0) > 0 else 0
                else:
                    entry['score'] = None
            else:
                entry['score'] = task.score if task else None
            result.append(entry)

        return Response({'rows': result, **extra})

    def post(self, request):
        direction = request.data.get('direction')
        date_str = request.data.get('date')
        scores = request.data.get('scores', [])

        if not direction or not date_str:
            return Response({'error': 'direction va date kerak'}, status=status.HTTP_400_BAD_REQUEST)

        if direction == '1_ijro':
            try:
                y, m, _ = date_str.split('-')
                spd = score_per_workday(int(y), int(m))
            except Exception:
                spd = 0
            max_score_per_entry = spd
        else:
            try:
                dir_obj = KPIDirection.objects.get(key=direction, is_active=True)
                max_score_per_entry = dir_obj.max_score
            except KPIDirection.DoesNotExist:
                max_score_per_entry = 10

        saved = 0
        for item in scores:
            pid = item.get('profile_id')
            try:
                raw = float(item.get('score', 0))
            except (TypeError, ValueError):
                raw = 0

            if direction == '1_ijro':
                # raw is 0 or 1 (attendance flag)
                actual_score = spd if raw == 1 else 0
            else:
                actual_score = max(0.0, min(float(max_score_per_entry), raw))

            try:
                profile = Profile.objects.get(id=pid)
                KPITask.objects.update_or_create(
                    leader=profile,
                    direction=direction,
                    month=date_str,
                    defaults={'score': actual_score, 'status': 'yashil', 'admin_comment': None}
                )
                saved += 1
            except Profile.DoesNotExist:
                pass

        return Response({'message': f'{saved} ta natija saqlandi'})
