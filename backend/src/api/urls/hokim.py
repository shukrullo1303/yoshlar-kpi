from django.urls import path
from src.api.views.hokim import HokimRankingView

urlpatterns = [
    path('ranking/', HokimRankingView.as_view()),
]
