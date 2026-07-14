from django.urls import path
from src.api.views import AdminDashboardStatsView, AdminTaskSliderView, AdminReviewTaskView, AdminDistrictsRankingView, AdminBulkScoreView

app_name = 'kpi_admin'

urlpatterns = [
    path('dashboard/', AdminDashboardStatsView.as_view(), name='dashboard-stats'),
    path('slider/<str:direction>/', AdminTaskSliderView.as_view(), name='slider-tasks'),
    path('review/<int:task_id>/', AdminReviewTaskView.as_view(), name='review-task'),
    path('districts/', AdminDistrictsRankingView.as_view(), name='districts-ranking'),
    path('bulk-score/', AdminBulkScoreView.as_view(), name='bulk-score'),
]
