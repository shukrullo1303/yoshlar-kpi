from django.urls import path
from src.api.views.user_dashboard import UserDashboardView
from src.api.views.user_submit import UserSubmitTaskView

app_name = 'kpi_user'

urlpatterns = [
    path('dashboard/', UserDashboardView.as_view(), name='user-dashboard'),
    path('submit/', UserSubmitTaskView.as_view(), name='user-submit'),
]
