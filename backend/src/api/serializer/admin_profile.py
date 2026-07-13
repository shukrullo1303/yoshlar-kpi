from rest_framework import serializers
import src.core.models as models
from src.api.serializer.base import BaseSerializer


class AdminProfileSerializer(BaseSerializer):
    leader_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = models.Profile
        fields = ['id', 'mahalla_name', 'district', 'leader_name', 'created_at', 'updated_at']
