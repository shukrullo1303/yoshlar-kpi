from django.contrib import admin
from src.core.models import Profile, KPITask, TaskAttachment


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['mahalla_name', 'district', 'user']
    search_fields = ['mahalla_name', 'user__first_name', 'user__last_name']


@admin.register(KPITask)
class KPITaskAdmin(admin.ModelAdmin):
    list_display = ['leader', 'direction', 'status', 'score', 'month', 'created_at']
    list_filter = ['direction', 'status', 'month']
    search_fields = ['leader__mahalla_name']


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ['task', 'file', 'is_image']
