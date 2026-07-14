import calendar
from datetime import date as date_type
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from src.core.models import KPITask, Profile, KPIDirection


def _month_qs(qs, dir_key, month_str):
    if not month_str:
        return qs
    if dir_key == '1_ijro':
        try:
            d = date_type.fromisoformat(month_str)
            last_day = calendar.monthrange(d.year, d.month)[1]
            end = date_type(d.year, d.month, last_day)
            return qs.filter(month__gte=d, month__lte=end)
        except ValueError:
            return qs.none()
    return qs.filter(month=month_str)


class UserDashboardView(APIView):
    """Oddiy MFY user uchun — o'z KPI ballari, topshiriqlari va reytingi."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.kpi_profile
        except Exception:
            return Response({'error': 'Profil topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        month = request.query_params.get('month')
        directions = list(KPIDirection.objects.filter(is_active=True).order_by('order'))

        directions_data = []
        total_score = 0.0

        for d in directions:
            base_qs = KPITask.objects.filter(leader=profile, direction=d.key)
            yashil_qs = _month_qs(base_qs.filter(status='yashil'), d.key, month)
            sariq_qs = _month_qs(base_qs.filter(status='sariq'), d.key, month)
            qizil_qs = _month_qs(base_qs.filter(status='qizil'), d.key, month)

            approved_score = yashil_qs.aggregate(Sum('score'))['score__sum'] or 0.0
            total_score += approved_score

            directions_data.append({
                'direction': d.key,
                'label': d.label,
                'max_score': d.max_score,
                'score': round(float(approved_score), 2),
                'percentage': round((approved_score / d.max_score) * 100, 1) if d.max_score else 0,
                'pending_count': sariq_qs.count(),
                'approved_count': yashil_qs.count(),
                'rejected_count': qizil_qs.count(),
                'admin_scored': d.admin_scored,
                'is_uploadable': d.is_uploadable,
                'info': d.info,
                'how': d.how,
            })

        # Reyting hisoblash
        all_scores = []
        for p in Profile.objects.all():
            s = 0.0
            for d in directions:
                qs = _month_qs(
                    KPITask.objects.filter(leader=p, direction=d.key, status='yashil'),
                    d.key, month
                )
                s += qs.aggregate(Sum('score'))['score__sum'] or 0.0
            all_scores.append({'id': p.id, 'total': s})

        all_scores.sort(key=lambda x: x['total'], reverse=True)
        rank = next((i + 1 for i, x in enumerate(all_scores) if x['id'] == profile.id), None)
        max_total = sum(d.max_score for d in directions)

        return Response({
            'mahalla_name': profile.mahalla_name,
            'district': profile.district,
            'directions': directions_data,
            'total_score': round(total_score, 2),
            'max_total': max_total,
            'rank': rank,
            'total_profiles': len(all_scores),
        })
