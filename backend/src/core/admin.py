from django import forms
from django.contrib import admin
from src.core.models import Profile, KPITask, TaskAttachment, KPIDirection


@admin.register(KPIDirection)
class KPIDirectionAdmin(admin.ModelAdmin):
    list_display = ['order', 'key', 'label', 'max_score', 'admin_scored', 'is_uploadable', 'is_active']
    list_editable = ['label', 'max_score', 'order', 'is_active']
    list_display_links = ['key']
    ordering = ['order']
    fieldsets = (
        (None, {
            'fields': ('key', 'label', 'max_score', 'order', 'is_active')
        }),
        ("Xususiyatlar", {
            'fields': ('admin_scored', 'is_uploadable')
        }),
        ("Ko'rsatma matnlari", {
            'fields': ('info', 'how'),
            'classes': ('collapse',),
        }),
    )


class KPITaskAdminForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        choices = [('', '---------')] + [
            (d.key, f"{d.order}. {d.label}")
            for d in KPIDirection.objects.filter(is_active=True).order_by('order')
        ]
        self.fields['direction'].widget = forms.Select(choices=choices)

    class Meta:
        model = KPITask
        fields = '__all__'


@admin.register(KPITask)
class KPITaskAdmin(admin.ModelAdmin):
    form = KPITaskAdminForm
    list_display = ['leader', 'direction', 'status', 'score', 'month', 'created_at']
    list_filter = ['direction', 'status', 'month']
    search_fields = ['leader__mahalla_name']


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['mahalla_name', 'district', 'user']
    search_fields = ['mahalla_name', 'user__first_name', 'user__last_name']


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ['task', 'file', 'is_image']
