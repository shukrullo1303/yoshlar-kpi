import calendar
from datetime import date
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from src.core.models import KPITask, Profile, KPIDirection
from .base import BaseAdminAPIView


class AdminDistrictsRankingView(BaseAdminAPIView):
    """Barcha mahallalar uchun yo'nalishlar bo'yicha yig'ilgan ballarni qaytaradi."""

    def get(self, request):
        month_str = request.query_params.get('month')
        profiles = Profile.objects.select_related('user').all()
        directions = list(KPIDirection.objects.filter(is_active=True).order_by('order'))
        result = []

        for profile in profiles:
            scores = []
            for d in directions:
                qs = KPITask.objects.filter(leader=profile, direction=d.key, status='yashil')
                if month_str:
                    if d.key == '1_ijro':
                        try:
                            dt = date.fromisoformat(month_str)
                            last_day = calendar.monthrange(dt.year, dt.month)[1]
                            end = date(dt.year, dt.month, last_day)
                            qs = qs.filter(month__gte=dt, month__lte=end)
                        except ValueError:
                            qs = qs.none()
                    else:
                        qs = qs.filter(month=month_str)

                total = qs.aggregate(Sum('score'))['score__sum'] or 0
                scores.append(round(float(total), 2))

            result.append({
                'id': profile.id,
                'name': profile.mahalla_name,
                'district': profile.district,
                'scores': scores,
                'total': round(sum(scores), 2),
            })

        result.sort(key=lambda x: x['total'], reverse=True)
        return Response(result, status=status.HTTP_200_OK)
