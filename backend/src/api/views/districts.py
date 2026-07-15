import calendar
from datetime import date
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from src.core.models import KPITask, Profile, KPIDirection
from .base import BaseAdminAPIView


def _last_day(dt):
    return date(dt.year, dt.month, calendar.monthrange(dt.year, dt.month)[1])


def _apply_month_filter(qs, direction_key, month_from, month_to):
    if not month_from and not month_to:
        return qs
    try:
        if direction_key == '1_ijro':
            # day-level records; filter by exact day range
            if month_from:
                dt_from = date.fromisoformat(month_from)
                qs = qs.filter(month__gte=dt_from)
            if month_to:
                dt_to = date.fromisoformat(month_to)
                qs = qs.filter(month__lte=_last_day(dt_to))
        else:
            # month-level records stored as YYYY-MM-01
            if month_from:
                qs = qs.filter(month__gte=month_from)
            if month_to:
                qs = qs.filter(month__lte=month_to)
    except ValueError:
        return qs.none()
    return qs


class AdminDistrictsRankingView(BaseAdminAPIView):
    """
    Barcha mahallalar uchun yo'nalishlar bo'yicha yig'ilgan ballarni qaytaradi.
    Query params:
      ?month=YYYY-MM-01                       single month (legacy)
      ?month_from=YYYY-MM-01&month_to=YYYY-MM-01  date range
    """

    def get(self, request):
        # Support both single month and range
        month_str = request.query_params.get('month')
        month_from = request.query_params.get('month_from') or month_str
        month_to = request.query_params.get('month_to') or month_str

        profiles = Profile.objects.select_related('user').all()
        directions = list(KPIDirection.objects.filter(is_active=True).order_by('order'))
        result = []

        for profile in profiles:
            scores = []
            for d in directions:
                qs = KPITask.objects.filter(leader=profile, direction=d.key, status='yashil')
                qs = _apply_month_filter(qs, d.key, month_from, month_to)
                total = min(qs.aggregate(Sum('score'))['score__sum'] or 0, d.max_score)
                scores.append(round(float(total), 2))

            result.append({
                'id': profile.id,
                'name': profile.mahalla_name,
                'full_name': profile.user.get_full_name(),
                'district': profile.district,
                'scores': scores,
                'total': round(sum(scores), 2),
            })

        result.sort(key=lambda x: x['total'], reverse=True)
        return Response(result, status=status.HTTP_200_OK)
