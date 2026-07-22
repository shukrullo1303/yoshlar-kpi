from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'detail': 'CSRF cookie set'})


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {'error': 'Username va parol kiritish shart'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {'error': "Username yoki parol noto'g'ri"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)

        profile = None
        try:
            profile = user.kpi_profile
        except Exception:
            pass

        return Response({
            'id': user.id,
            'username': user.username,
            'full_name': user.get_full_name(),
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'is_hokim': profile.is_hokim if profile else False,
            'mahalla_name': profile.mahalla_name if profile else None,
            'district': profile.district if profile else None,
        })


@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        request.session.flush()
        return Response({'detail': 'Chiqildi'})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = None
        try:
            profile = user.kpi_profile
        except Exception:
            pass

        return Response({
            'id': user.id,
            'username': user.username,
            'full_name': user.get_full_name(),
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'is_hokim': profile.is_hokim if profile else False,
            'mahalla_name': profile.mahalla_name if profile else None,
            'district': profile.district if profile else None,
        })
