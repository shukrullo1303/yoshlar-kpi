
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # Main API URLs (from src/api/main_urls.py)
    path('api/', include('src.api.main_urls')),
]

