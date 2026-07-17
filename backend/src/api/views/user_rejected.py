from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from src.core.models import KPITask


class UserRejectedTasksView(APIView):
    """Foydalanuvchining rad etilgan topshiriqlari — eng yangilaridan."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.kpi_profile
        except Exception:
            return Response({'error': 'Profil topilmadi'}, status=404)

        direction = request.query_params.get('direction')
        month = request.query_params.get('month')

        qs = KPITask.objects.filter(leader=profile, status='qizil')
        if direction:
            qs = qs.filter(direction=direction)
        if month:
            qs = qs.filter(month=month)

        qs = qs.prefetch_related('attachments').order_by('-created_at')

        results = []
        for task in qs:
            attachments = [
                {
                    'file': request.build_absolute_uri(a.file.url) if a.file else None,
                    'is_image': a.is_image,
                }
                for a in task.attachments.all()
            ]
            results.append({
                'id': task.id,
                'direction': task.direction,
                'month': str(task.month),
                'admin_comment': task.admin_comment or '',
                'created_at': task.created_at.strftime('%Y-%m-%d %H:%M'),
                'attachments': attachments,
            })

        return Response(results)
