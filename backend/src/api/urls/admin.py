from django.urls import path
from src.api.views import (
    AdminDashboardStatsView, AdminTaskSliderView, AdminReviewTaskView,
    AdminDistrictsRankingView, AdminBulkScoreView, AdminMonthPlanView,
    AdminBulkReviewView, AdminMFYStatusView,
)
from src.api.views.wialon_proxy import WialonVehiclesView

app_name = 'kpi_admin'

urlpatterns = [
    path('dashboard/', AdminDashboardStatsView.as_view(), name='dashboard-stats'),
    path('slider/<str:direction>/', AdminTaskSliderView.as_view(), name='slider-tasks'),
    path('review/<int:task_id>/', AdminReviewTaskView.as_view(), name='review-task'),
    path('bulk-review/', AdminBulkReviewView.as_view(), name='bulk-review'),
    path('districts/', AdminDistrictsRankingView.as_view(), name='districts-ranking'),
    path('bulk-score/', AdminBulkScoreView.as_view(), name='bulk-score'),
    path('month-plan/', AdminMonthPlanView.as_view(), name='month-plan'),
    path('mfy-status/', AdminMFYStatusView.as_view(), name='mfy-status'),
    path('gps/vehicles/', WialonVehiclesView.as_view(), name='gps-vehicles'),
]
