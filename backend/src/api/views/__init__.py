from src.api.views.base import BaseAdminAPIView
from src.api.views.stats import AdminDashboardStatsView
from src.api.views.slider import AdminTaskSliderView
from src.api.views.review import AdminReviewTaskView, AdminBulkReviewView
from src.api.views.auth import CsrfView, LoginView, LogoutView, MeView
from src.api.views.districts import AdminDistrictsRankingView
from src.api.views.bulk_score import AdminBulkScoreView
from src.api.views.directions import DirectionsView
from src.api.views.month_plan import AdminMonthPlanView
from src.api.views.mfy_status import AdminMFYStatusView
