from rest_framework.views import APIView
from rest_framework import permissions


class BaseAdminAPIView(APIView):
    """Barcha Admin API'lari uchun asos"""
    permission_classes = [permissions.IsAdminUser]
