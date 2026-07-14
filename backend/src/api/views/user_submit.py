from datetime import date, datetime, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from src.core.models import KPITask, TaskAttachment, KPIDirection

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}


def _read_exif_date(file_obj):
    """JPEG/PNG faylidan EXIF DateTimeOriginal ni o'qiydi. None qaytaradi agar topilmasa."""
    try:
        from PIL import Image, ExifTags
        file_obj.seek(0)
        img = Image.open(file_obj)
        exif_data = img._getexif() if hasattr(img, '_getexif') else None
        if not exif_data:
            return None
        tag_map = {v: k for k, v in ExifTags.TAGS.items()}
        for tag_name in ('DateTimeOriginal', 'DateTimeDigitized', 'DateTime'):
            tag_id = tag_map.get(tag_name)
            if tag_id and tag_id in exif_data:
                raw = exif_data[tag_id]
                try:
                    return datetime.strptime(raw, '%Y:%m:%d %H:%M:%S').replace(tzinfo=timezone.utc)
                except ValueError:
                    pass
        return None
    except Exception:
        return None


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

        files = request.FILES.getlist('files')
        if not files:
            return Response({'error': 'Kamida bitta fayl (rasm yoki PDF) yuklash majburiy'}, status=status.HTTP_400_BAD_REQUEST)

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

        for f in files:
            ext = '.' + f.name.rsplit('.', 1)[-1].lower() if '.' in f.name else ''
            is_img = ext in IMAGE_EXTS
            photo_taken_at = _read_exif_date(f) if is_img else None
            f.seek(0)
            TaskAttachment.objects.create(
                task=task,
                file=f,
                is_image=is_img,
                photo_taken_at=photo_taken_at,
            )

        return Response({'message': 'Topshiriq yuborildi', 'task_id': task.id}, status=status.HTTP_201_CREATED)
