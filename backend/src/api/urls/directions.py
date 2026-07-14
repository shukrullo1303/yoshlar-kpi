from django.urls import path
from src.api.views import DirectionsView

urlpatterns = [
    path('', DirectionsView.as_view(), name='directions-list'),
]
