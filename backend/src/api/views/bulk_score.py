from rest_framework.response import Response
from rest_framework import status
from src.core.models import KPITask, Profile, KPIDirection
from .base import BaseAdminAPIView


class AdminBulkScoreView(BaseAdminAPIView):
    """
    GET  ?direction=1_ijro&date=2026-07-14
    POST {direction, date, scores: [{profile_id, score}]}
    """

    def get(self, request):
        direction = request.query_params.get('direction')
        date_str = request.query_params.get('date')

        if not direction or not date_str:
            return Response({'error': 'direction va date kerak'}, status=status.HTTP_400_BAD_REQUEST)

        profiles = Profile.objects.all().order_by('mahalla_name')
        result = []
        for p in profiles:
            task = KPITask.objects.filter(leader=p, direction=direction, month=date_str).first()
            result.append({
                'profile_id': p.id,
                'mahalla_name': p.mahalla_name,
                'score': task.score if task else None,
                'task_id': task.id if task else None,
            })
        return Response(result)

    def post(self, request):
        direction = request.data.get('direction')
        date_str = request.data.get('date')
        scores = request.data.get('scores', [])

        if not direction or not date_str:
            return Response({'error': 'direction va date kerak'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dir_obj = KPIDirection.objects.get(key=direction, is_active=True)
            max_score_per_entry = dir_obj.max_score
        except KPIDirection.DoesNotExist:
            max_score_per_entry = 10

        if direction == '1_ijro':
            max_score_per_entry = 1

        saved = 0
        for item in scores:
            pid = item.get('profile_id')
            try:
                score = float(item.get('score', 0))
            except (TypeError, ValueError):
                score = 0
            score = max(0.0, min(float(max_score_per_entry), score))
            try:
                profile = Profile.objects.get(id=pid)
                KPITask.objects.update_or_create(
                    leader=profile,
                    direction=direction,
                    month=date_str,
                    defaults={'score': score, 'status': 'yashil', 'admin_comment': None}
                )
                saved += 1
            except Profile.DoesNotExist:
                pass

        return Response({'message': f'{saved} ta natija saqlandi'})
