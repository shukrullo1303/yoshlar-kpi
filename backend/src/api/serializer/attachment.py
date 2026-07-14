import src.core.models as models
from src.api.serializer.base import BaseSerializer


class AttachmentSerializer(BaseSerializer):
    class Meta:
        model = models.TaskAttachment
        fields = ['id', 'file', 'is_image', 'photo_taken_at', 'created_at', 'updated_at']
