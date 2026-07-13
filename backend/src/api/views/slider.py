from rest_framework.response import Response
from rest_framework import status
from src.core.models import KPITask
from src.api.serializer.slider import KPITaskSliderSerializer
from .base import BaseAdminAPIView


class AdminTaskSliderView(BaseAdminAPIView):
    """Tanlangan yo'nalish bo'yicha kutilayotgan (sariq) topshiriqlarni qaytaradi.
    Query param: ?month=YYYY-MM-DD (ixtiyoriy)
    """

    def get(self, request, direction):
        valid_directions = [key for key, _ in KPITask.DIRECTION_CHOICES]
        if direction not in valid_directions:
            return Response(
                {"error": f"Noto'g'ri yo'nalish. To'g'ri qiymatlar: {valid_directions}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tasks = KPITask.objects.filter(direction=direction, status='sariq')

        month = request.query_params.get('month')
        if month:
            tasks = tasks.filter(month=month)

        tasks = tasks.order_by('created_at')
        serializer = KPITaskSliderSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
