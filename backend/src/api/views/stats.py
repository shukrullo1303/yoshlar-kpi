from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg
from src.core.models import KPITask
from .base import BaseAdminAPIView

MAX_SCORES = {
    '1_ijro': 20, '2_balans': 5, '3_bandlik': 15, '4_bosh_vaqt': 15,
    '5_profilaktika': 10, '6_murojaat': 5, '7_brend': 10, '8_talim': 5,
    '9_startap': 5, '10_nomenklatura': 10,
}


class AdminDashboardStatsView(BaseAdminAPIView):
    """10 ta yo'nalish bo'yicha reyting foizlarini qaytaradi.
    Query param: ?month=YYYY-MM-DD (ixtiyoriy)
    """

    def get(self, request):
        month = request.query_params.get('month')

        stats = []
        for dir_key, dir_label in KPITask.DIRECTION_CHOICES:
            tasks = KPITask.objects.filter(direction=dir_key)
            if month:
                tasks = tasks.filter(month=month)

            max_score = MAX_SCORES.get(dir_key, 10)
            avg_score = tasks.filter(status='yashil').aggregate(Avg('score'))['score__avg'] or 0
            percentage = round((avg_score / max_score) * 100, 1) if max_score else 0

            if percentage >= 80:
                indicator = 'yashil'
            elif percentage >= 50:
                indicator = 'sariq'
            else:
                indicator = 'qizil'

            stats.append({
                'direction': dir_key,
                'label': dir_label,
                'max_score': max_score,
                'avg_score': round(avg_score, 2),
                'percentage': percentage,
                'indicator': indicator,
                'sariq_count': tasks.filter(status='sariq').count(),
                'yashil_count': tasks.filter(status='yashil').count(),
                'qizil_count': tasks.filter(status='qizil').count(),
            })

        return Response(stats, status=status.HTTP_200_OK)
