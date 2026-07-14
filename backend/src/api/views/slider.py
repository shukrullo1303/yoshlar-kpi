from rest_framework.response import Response
from rest_framework import status
from src.core.models import KPITask, KPIDirection
from src.api.serializer.slider import KPITaskSliderSerializer
from .base import BaseAdminAPIView


class AdminTaskSliderView(BaseAdminAPIView):
    """Tanlangan yo'nalish bo'yicha topshiriqlarni qaytaradi."""

    def get(self, request, direction):
        if not KPIDirection.objects.filter(key=direction, is_active=True).exists():
            valid = list(KPIDirection.objects.filter(is_active=True).values_list('key', flat=True))
            return Response(
                {"error": f"Noto'g'ri yo'nalish. To'g'ri qiymatlar: {valid}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task_status = request.query_params.get('status', 'sariq')
        valid_statuses = [key for key, _ in KPITask.STATUS_CHOICES]
        if task_status not in valid_statuses:
            return Response(
                {"error": f"Noto'g'ri status. To'g'ri qiymatlar: {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tasks = KPITask.objects.filter(direction=direction, status=task_status)
        month = request.query_params.get('month')
        if month:
            tasks = tasks.filter(month=month)

        tasks = tasks.order_by('created_at')
        serializer = KPITaskSliderSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
