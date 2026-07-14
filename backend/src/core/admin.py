from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.db.models import Sum, Count, Q

from src.core.models import Profile, KPITask, TaskAttachment, KPIDirection, KPIMonthPlan


# ─── Inline: Profile ichida User ─────────────────────────────────────────────

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name = "MFY Profili"
    verbose_name_plural = "MFY Profili"
    fields = ('mahalla_name', 'district')
    extra = 0


class UserAdmin(BaseUserAdmin):
    inlines = [ProfileInline]
    list_display = ['username', 'get_mahalla', 'get_district', 'is_staff', 'is_active', 'date_joined']
    list_filter = ['is_staff', 'is_superuser', 'is_active']
    search_fields = ['username', 'first_name', 'last_name', 'kpi_profile__mahalla_name']
    ordering = ['username']

    @admin.display(description="Mahalla")
    def get_mahalla(self, obj):
        try:
            return obj.kpi_profile.mahalla_name
        except Profile.DoesNotExist:
            return '—'

    @admin.display(description="Tuman")
    def get_district(self, obj):
        try:
            return obj.kpi_profile.district
        except Profile.DoesNotExist:
            return '—'


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


# ─── KPIDirection ─────────────────────────────────────────────────────────────

@admin.register(KPIDirection)
class KPIDirectionAdmin(admin.ModelAdmin):
    list_display = ['order', 'key', 'label', 'max_score', 'get_flags', 'is_active']
    list_display_links = ['key']
    list_editable = ['label', 'max_score', 'order', 'is_active']
    ordering = ['order']
    search_fields = ['key', 'label']
    save_on_top = True
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

    @admin.display(description="Belgilar")
    def get_flags(self, obj):
        flags = []
        if obj.admin_scored:
            flags.append('<span style="background:#2563eb;color:#fff;padding:1px 6px;border-radius:4px;font-size:11px;">Admin</span>')
        if obj.is_uploadable:
            flags.append('<span style="background:#16a34a;color:#fff;padding:1px 6px;border-radius:4px;font-size:11px;">Upload</span>')
        return mark_safe(' '.join(flags)) if flags else '—'


# ─── KPITask ──────────────────────────────────────────────────────────────────

class TaskAttachmentInline(admin.TabularInline):
    model = TaskAttachment
    extra = 0
    readonly_fields = ['get_preview', 'is_image', 'created_at']
    fields = ['file', 'get_preview', 'is_image']

    @admin.display(description="Ko'rinish")
    def get_preview(self, obj):
        if not obj.pk:
            return '—'
        if obj.is_image:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" style="max-height:60px;max-width:120px;border-radius:4px;" /></a>',
                obj.file.url, obj.file.url
            )
        return format_html('<a href="{}" target="_blank">📄 Fayl</a>', obj.file.url)


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


def make_approve(score_val):
    def approve(modeladmin, request, queryset):
        updated = queryset.filter(status='sariq').update(status='yashil', score=score_val)
        modeladmin.message_user(request, f"{updated} ta topshiriq tasdiqlandi ({score_val} ball)")
    approve.short_description = f"✅ Tanlanganni tasdiqlash ({score_val} ball)"
    approve.__name__ = f"approve_{score_val}"
    return approve


def action_reject(modeladmin, request, queryset):
    updated = queryset.filter(status='sariq').update(
        status='qizil', admin_comment='Admin tomonidan rad etildi'
    )
    modeladmin.message_user(request, f"{updated} ta topshiriq rad etildi")
action_reject.short_description = "❌ Tanlanganni rad etish"


@admin.register(KPITask)
class KPITaskAdmin(admin.ModelAdmin):
    form = KPITaskAdminForm
    inlines = [TaskAttachmentInline]
    save_on_top = True

    list_display = [
        'get_mahalla', 'get_direction_label', 'get_status_badge',
        'score', 'month', 'get_attachments_count', 'created_at'
    ]
    list_display_links = ['get_mahalla']
    list_editable = ['score']
    list_filter = ['direction', 'status', 'month', 'leader__district']
    search_fields = ['leader__mahalla_name', 'leader__user__username', 'event_name', 'startup_name']
    date_hierarchy = 'month'
    ordering = ['-created_at']
    actions = [
        make_approve(1), make_approve(3), make_approve(5),
        make_approve(10), make_approve(15), make_approve(20),
        action_reject,
    ]

    fieldsets = (
        ("Asosiy", {
            'fields': ('leader', 'direction', 'month', 'status', 'score', 'admin_comment')
        }),
        ("Qo'shimcha ma'lumotlar", {
            'fields': ('text_comment',),
            'classes': ('collapse',),
        }),
        ("4-yo'nalish: Bo'sh vaqt", {
            'fields': ('event_name', 'event_type', 'youth_count', 'location', 'event_time'),
            'classes': ('collapse',),
        }),
        ("5-yo'nalish: Profilaktika", {
            'fields': ('profilaktika_type',),
            'classes': ('collapse',),
        }),
        ("8-yo'nalish: Ta'lim", {
            'fields': ('student_fio',),
            'classes': ('collapse',),
        }),
        ("9-yo'nalish: Startap", {
            'fields': ('startup_name', 'startup_owner_fio'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description="MFY", ordering='leader__mahalla_name')
    def get_mahalla(self, obj):
        return f"{obj.leader.mahalla_name} MFY"

    @admin.display(description="Yo'nalish")
    def get_direction_label(self, obj):
        try:
            d = KPIDirection.objects.get(key=obj.direction)
            return f"{d.order}. {d.label}"
        except KPIDirection.DoesNotExist:
            return obj.direction

    @admin.display(description="Holat")
    def get_status_badge(self, obj):
        colors = {
            'sariq':  ('#92400e', '#fef3c7'),
            'yashil': ('#14532d', '#dcfce7'),
            'qizil':  ('#7f1d1d', '#fee2e2'),
        }
        labels = {
            'sariq': 'Kutilmoqda', 'yashil': 'Tasdiqlangan', 'qizil': 'Rad etilgan'
        }
        color, bg = colors.get(obj.status, ('#333', '#eee'))
        label = labels.get(obj.status, obj.status)
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            bg, color, label
        )

    @admin.display(description="Fayllar")
    def get_attachments_count(self, obj):
        n = obj.attachments.count()
        return f"{n} ta" if n else '—'


# ─── Profile ──────────────────────────────────────────────────────────────────

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['mahalla_name', 'district', 'get_username', 'get_full_name', 'get_total_score']
    list_display_links = ['mahalla_name']
    list_filter = ['district']
    search_fields = ['mahalla_name', 'user__username', 'user__first_name', 'user__last_name']
    ordering = ['mahalla_name']
    raw_id_fields = ['user']
    save_on_top = True

    @admin.display(description="Login", ordering='user__username')
    def get_username(self, obj):
        return obj.user.username

    @admin.display(description="Ism Familiya")
    def get_full_name(self, obj):
        return obj.user.get_full_name() or '—'

    @admin.display(description="Jami ball")
    def get_total_score(self, obj):
        total = KPITask.objects.filter(leader=obj, status='yashil').aggregate(
            s=Sum('score')
        )['s'] or 0
        return round(float(total), 1)


# ─── TaskAttachment ───────────────────────────────────────────────────────────

@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ['get_mahalla', 'get_direction', 'is_image', 'get_preview', 'created_at']
    list_filter = ['is_image', 'task__direction']
    search_fields = ['task__leader__mahalla_name']
    readonly_fields = ['get_preview', 'created_at']
    ordering = ['-created_at']

    @admin.display(description="MFY")
    def get_mahalla(self, obj):
        return obj.task.leader.mahalla_name

    @admin.display(description="Yo'nalish")
    def get_direction(self, obj):
        return obj.task.direction

    @admin.display(description="Ko'rinish")
    def get_preview(self, obj):
        if not obj.pk:
            return '—'
        if obj.is_image:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" style="max-height:80px;border-radius:6px;" /></a>',
                obj.file.url, obj.file.url
            )
        return format_html('<a href="{}" target="_blank">📄 {}</a>', obj.file.url, obj.file.name.split('/')[-1])


# ─── KPIMonthPlan ─────────────────────────────────────────────────────────────

@admin.register(KPIMonthPlan)
class KPIMonthPlanAdmin(admin.ModelAdmin):
    list_display = ['get_direction_label', 'month', 'target_count', 'get_max_per_item', 'created_at']
    list_display_links = ['get_direction_label']
    list_editable = ['target_count']
    list_filter = ['month', 'direction_key']
    ordering = ['-month', 'direction_key']
    save_on_top = True

    @admin.display(description="Yo'nalish")
    def get_direction_label(self, obj):
        try:
            d = KPIDirection.objects.get(key=obj.direction_key)
            return f"{d.order}. {d.label}"
        except KPIDirection.DoesNotExist:
            return obj.direction_key

    @admin.display(description="Item uchun max ball")
    def get_max_per_item(self, obj):
        try:
            d = KPIDirection.objects.get(key=obj.direction_key)
            if obj.target_count:
                val = round(d.max_score / obj.target_count, 2)
                return f"{val} ball"
        except KPIDirection.DoesNotExist:
            pass
        return '—'


# ─── Admin sayt sarlavhasi ────────────────────────────────────────────────────

admin.site.site_header = "Yoshlar KPI — Boshqaruv Paneli"
admin.site.site_title = "Yoshlar KPI Admin"
admin.site.index_title = "Boshqaruv Paneli"
