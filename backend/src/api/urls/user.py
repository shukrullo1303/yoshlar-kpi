from django.urls import path
from src.api.views.user_dashboard import UserDashboardView
from src.api.views.user_submit import UserSubmitTaskView
from src.api.views.profile_update import UserProfileUpdateView

app_name = 'kpi_user'

urlpatterns = [
    path('dashboard/', UserDashboardView.as_view(), name='user-dashboard'),
    path('submit/', UserSubmitTaskView.as_view(), name='user-submit'),
    path('profile/', UserProfileUpdateView.as_view(), name='profile-update'),
]
