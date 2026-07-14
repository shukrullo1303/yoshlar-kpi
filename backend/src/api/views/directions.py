from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from src.core.models import KPIDirection


class DirectionsView(APIView):
    """Barcha faol yo'nalishlar ro'yxatini qaytaradi."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        directions = KPIDirection.objects.filter(is_active=True).order_by('order')
        data = [
            {
                'key': d.key,
                'label': d.label,
                'max_score': d.max_score,
                'order': d.order,
                'admin_scored': d.admin_scored,
                'is_uploadable': d.is_uploadable,
                'info': d.info,
                'how': d.how,
            }
            for d in directions
        ]
        return Response(data, status=status.HTTP_200_OK)
