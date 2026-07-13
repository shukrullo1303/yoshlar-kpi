from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response

app_name = 'health'


@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok', 'service': 'Yoshlar KPI'})


urlpatterns = [
    path('', health_check, name='check'),
]
