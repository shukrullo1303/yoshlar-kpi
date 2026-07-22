# src/api/main_urls.py
from django.urls import path, include

app_name = 'api'

urlpatterns = [
    # Auth endpoints
    path('auth/', include('src.api.urls.auth')),

    # Admin API endpoints
    path('admin/', include('src.api.urls.admin')),

    # User (MFY) API endpoints
    path('user/', include('src.api.urls.user')),

    # Directions (yo'nalishlar ro'yxati)
    path('directions/', include('src.api.urls.directions')),

    # Superadmin endpoints (faqat is_superuser uchun)
    path('superadmin/', include('src.api.urls.superadmin')),

    # Hokim dashboard endpoints
    path('hokim/', include('src.api.urls.hokim')),

    # Health check endpoint
    path('health/', include('src.api.urls.health')),

    # API Documentation (Swagger & ReDoc)
    path('docs/', include('src.api.urls.swagger')),
]
