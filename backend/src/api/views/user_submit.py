from datetime import date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from src.core.models import KPITask, TaskAttachment, KPIDirection

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'}


class UserSubmitTaskView(APIView):
    """MFY user yo'nalishlar uchun topshiriq yuboradi."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            profile = request.user.kpi_profile
        except Exception:
            return Response({'error': 'Profil topilmadi'}, status=status.HTTP_403_FORBIDDEN)

        direction = request.data.get('direction', '').strip()

        try:
            dir_obj = KPIDirection.objects.get(key=direction, is_active=True)
        except KPIDirection.DoesNotExist:
            return Response({'error': "Bu yo'nalish topilmadi"}, status=status.HTTP_400_BAD_REQUEST)

        if not dir_obj.is_uploadable:
            return Response({'error': "Bu yo'nalishga fayl yuborish mumkin emas"}, status=status.HTTP_400_BAD_REQUEST)

        month_str = request.data.get('month') or date.today().replace(day=1).isoformat()

        def get(field):
            v = request.data.get(field, '').strip()
            return v or None

        task = KPITask(
            leader=profile,
            direction=direction,
            month=month_str,
            status='sariq',
            score=0.0,
            text_comment=get('text_comment'),
            event_name=get('event_name'),
            event_type=get('event_type') or None,
            location=get('location'),
            profilaktika_type=get('profilaktika_type') or None,
            student_fio=get('student_fio'),
            startup_name=get('startup_name'),
            startup_owner_fio=get('startup_owner_fio'),
        )

        yc = request.data.get('youth_count')
        task.youth_count = int(yc) if yc and str(yc).isdigit() else None

        et = get('event_time')
        task.event_time = et if et else None

        task.save()

        for f in request.FILES.getlist('files'):
            ext = '.' + f.name.rsplit('.', 1)[-1].lower() if '.' in f.name else ''
            TaskAttachment.objects.create(task=task, file=f, is_image=ext in IMAGE_EXTS)

        return Response({'message': 'Topshiriq yuborildi', 'task_id': task.id}, status=status.HTTP_201_CREATED)
