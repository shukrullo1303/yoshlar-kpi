import calendar
from datetime import date as date_type
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg
from src.core.models import KPITask, KPIDirection
from .base import BaseAdminAPIView


def _last_day(dt):
    return date_type(dt.year, dt.month, calendar.monthrange(dt.year, dt.month)[1])


def _apply_month_filter(qs, direction_key, month_from, month_to):
    if not month_from and not month_to:
        return qs
    try:
        if direction_key == '1_ijro':
            if month_from:
                qs = qs.filter(month__gte=date_type.fromisoformat(month_from))
            if month_to:
                qs = qs.filter(month__lte=_last_day(date_type.fromisoformat(month_to)))
        else:
            if month_from:
                qs = qs.filter(month__gte=month_from)
            if month_to:
                qs = qs.filter(month__lte=month_to)
    except ValueError:
        return qs.none()
    return qs


class AdminDashboardStatsView(BaseAdminAPIView):
    """
    10 ta yo'nalish bo'yicha reyting foizlarini qaytaradi.
    Query params:
      ?month=YYYY-MM-01                         single month (legacy)
      ?month_from=YYYY-MM-01&month_to=YYYY-MM-01  date range
    """

    def get(self, request):
        month_str = request.query_params.get('month')
        month_from = request.query_params.get('month_from') or month_str
        month_to = request.query_params.get('month_to') or month_str

        directions = KPIDirection.objects.filter(is_active=True).order_by('order')
        stats = []

        for d in directions:
            tasks = KPITask.objects.filter(direction=d.key)
            tasks = _apply_month_filter(tasks, d.key, month_from, month_to)

            avg_score = tasks.filter(status='yashil').aggregate(Avg('score'))['score__avg'] or 0
            percentage = round((avg_score / d.max_score) * 100, 1) if d.max_score else 0

            if percentage >= 80:
                indicator = 'yashil'
            elif percentage >= 50:
                indicator = 'sariq'
            else:
                indicator = 'qizil'

            stats.append({
                'direction': d.key,
                'label': d.label,
                'max_score': d.max_score,
                'admin_scored': d.admin_scored,
                'avg_score': round(avg_score, 2),
                'percentage': percentage,
                'indicator': indicator,
                'sariq_count': tasks.filter(status='sariq').count(),
                'yashil_count': tasks.filter(status='yashil').count(),
                'qizil_count': tasks.filter(status='qizil').count(),
            })

        return Response(stats, status=status.HTTP_200_OK)
