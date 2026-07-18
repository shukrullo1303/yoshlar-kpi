from django.urls import path
from src.api.views.superadmin import (
    SuperAdminUserListView, SuperAdminUserDetailView, SuperAdminScoreView,
)

app_name = 'superadmin'

urlpatterns = [
    path('users/', SuperAdminUserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', SuperAdminUserDetailView.as_view(), name='user-detail'),
    path('scores/', SuperAdminScoreView.as_view(), name='scores'),
]
