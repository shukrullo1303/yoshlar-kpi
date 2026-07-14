from rest_framework.response import Response
from rest_framework import status
from src.core.models import KPITask, Profile
from .base import BaseAdminAPIView
from .districts import _apply_month_filter


class AdminMFYStatusView(BaseAdminAPIView):
    """
    Bitta yo'nalish bo'yicha barcha 76 MFY ning vaziyati.
    GET ?direction=4_bosh_vaqt&month_from=YYYY-MM-01&month_to=YYYY-MM-01
    """

    def get(self, request):
        direction_key = request.query_params.get('direction')
        month_str = request.query_params.get('month')
        month_from = request.query_params.get('month_from') or month_str
        month_to = request.query_params.get('month_to') or month_str

        if not direction_key:
            return Response({'error': 'direction param majburiy'}, status=status.HTTP_400_BAD_REQUEST)

        profiles = Profile.objects.select_related('user').all().order_by('mahalla_name')
        result = []

        for profile in profiles:
            qs = KPITask.objects.filter(leader=profile, direction=direction_key)
            qs = _apply_month_filter(qs, direction_key, month_from, month_to)

            tasks_qs = qs.order_by('month').values(
                'id', 'month', 'status', 'score',
                'event_name', 'admin_comment',
            )
            tasks_list = []
            for t in tasks_qs:
                tasks_list.append({
                    'id': t['id'],
                    'month': str(t['month']),
                    'status': t['status'],
                    'score': round(float(t['score'] or 0), 2),
                    'event_name': t.get('event_name') or '',
                    'admin_comment': t.get('admin_comment') or '',
                })

            approved = [t for t in tasks_list if t['status'] == 'yashil']
            pending  = [t for t in tasks_list if t['status'] == 'sariq']
            rejected = [t for t in tasks_list if t['status'] == 'qizil']

            result.append({
                'id': profile.id,
                'name': profile.mahalla_name,
                'district': profile.district,
                'full_name': profile.user.get_full_name(),
                'total_score': round(sum(t['score'] for t in approved), 2),
                'approved_count': len(approved),
                'pending_count': len(pending),
                'rejected_count': len(rejected),
                'submitted': len(tasks_list) > 0,
                'tasks': tasks_list,
            })

        return Response(result, status=status.HTTP_200_OK)
