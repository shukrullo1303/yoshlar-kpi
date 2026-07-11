from src.api.serializer.base import *

class NewsSerializer(BaseSerializer):
    class Meta:
        model = models.News
        fields = '__all__'