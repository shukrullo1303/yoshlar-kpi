import src.core.models as models
from src.api.serializer.base import BaseSerializer
from src.api.serializer.attachment import AttachmentSerializer
from src.api.serializer.admin_profile import AdminProfileSerializer
from rest_framework import serializers


class KPITaskSliderSerializer(BaseSerializer):
    """Admin slayd-shou ko'rinishida topshiriqlarni tekshirishi uchun serializer"""
    leader = AdminProfileSerializer(read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    direction_display = serializers.CharField(source='get_direction_display', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    profilaktika_type_display = serializers.CharField(source='get_profilaktika_type_display', read_only=True)

    class Meta:
        model = models.KPITask
        fields = [
            'id', 'leader', 'direction', 'direction_display', 'status',
            'score', 'admin_comment', 'month', 'text_comment',
            'event_name', 'event_type', 'event_type_display', 'youth_count', 'location', 'event_time',
            'profilaktika_type', 'profilaktika_type_display', 'student_fio',
            'startup_name', 'startup_owner_fio',
            'attachments', 'created_at', 'updated_at',
        ]
