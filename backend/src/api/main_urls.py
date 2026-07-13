# src/api/main_urls.py
from django.urls import path, include

app_name = 'api'

urlpatterns = [
    # Auth endpoints
    path('auth/', include('src.api.urls.auth')),

    # Admin API endpoints
    path('admin/', include('src.api.urls.admin')),

    # Health check endpoint
    path('health/', include('src.api.urls.health')),

    # API Documentation (Swagger & ReDoc)
    path('docs/', include('src.api.urls.swagger')),
]
