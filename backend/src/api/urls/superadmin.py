from django.urls import path
from src.api.views.superadmin import (
    SuperAdminUserListView, SuperAdminUserDetailView, SuperAdminScoreView,
    SuperAdminDirectionView, SuperAdminDirectionDetailView, SuperAdminMediaExportView,
)

app_name = 'superadmin'

urlpatterns = [
    path('users/', SuperAdminUserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', SuperAdminUserDetailView.as_view(), name='user-detail'),
    path('scores/', SuperAdminScoreView.as_view(), name='scores'),
    path('directions/', SuperAdminDirectionView.as_view(), name='direction-list'),
    path('directions/<int:pk>/', SuperAdminDirectionDetailView.as_view(), name='direction-detail'),
    path('media-export/', SuperAdminMediaExportView.as_view(), name='media-export'),
]
