import calendar
from datetime import date as date_type
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg
from src.core.models import KPITask, KPIDirection
from .base import BaseAdminAPIView


class AdminDashboardStatsView(BaseAdminAPIView):
    """10 ta yo'nalish bo'yicha reyting foizlarini qaytaradi.
    Query param: ?month=YYYY-MM-01 (ixtiyoriy)
    """

    def get(self, request):
        month = request.query_params.get('month')
        directions = KPIDirection.objects.filter(is_active=True).order_by('order')

        stats = []
        for d in directions:
            tasks = KPITask.objects.filter(direction=d.key)

            if month:
                if d.key == '1_ijro':
                    try:
                        dt = date_type.fromisoformat(month)
                        last_day = calendar.monthrange(dt.year, dt.month)[1]
                        end = date_type(dt.year, dt.month, last_day)
                        tasks = tasks.filter(month__gte=dt, month__lte=end)
                    except ValueError:
                        tasks = tasks.none()
                else:
                    tasks = tasks.filter(month=month)

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
                'avg_score': round(avg_score, 2),
                'percentage': percentage,
                'indicator': indicator,
                'sariq_count': tasks.filter(status='sariq').count(),
                'yashil_count': tasks.filter(status='yashil').count(),
                'qizil_count': tasks.filter(status='qizil').count(),
            })

        return Response(stats, status=status.HTTP_200_OK)
