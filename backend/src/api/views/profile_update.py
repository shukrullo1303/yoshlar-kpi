from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status


class UserProfileUpdateView(APIView):
    """Foydalanuvchi o'z ismini va parolini yangilaydi."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')

        updated = []

        if first_name or last_name:
            if first_name:
                user.first_name = first_name
            if last_name:
                user.last_name = last_name
            updated.append('ism-familiya')

        if new_password:
            if not old_password:
                return Response({'error': 'Eski parolni kiriting'}, status=status.HTTP_400_BAD_REQUEST)
            if not user.check_password(old_password):
                return Response({'error': 'Eski parol noto\'g\'ri'}, status=status.HTTP_400_BAD_REQUEST)
            if len(new_password) < 6:
                return Response({'error': 'Yangi parol kamida 6 ta belgi bo\'lishi kerak'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            updated.append('parol')

        if not updated:
            return Response({'error': 'Hech narsa o\'zgarmadi'}, status=status.HTTP_400_BAD_REQUEST)

        user.save()
        return Response({
            'message': f"{', '.join(updated)} yangilandi",
            'full_name': user.get_full_name(),
        })
