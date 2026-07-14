from src.core.models.base import *
from src.core.models.profile import Profile


class KPITask(BaseModel):
    """10 ta yo'nalish bo'yicha topshiriqlar va KPI baholash tizimi"""
    
    DIRECTION_CHOICES = [
        ('1_ijro', '1. Ijro intizomi (Max: 20 ball)'),
        ('2_balans', '2. Yoshlar balansi (Max: 5 ball)'),
        ('3_bandlik', '3. Yoshlar bandligini ta’minlash (Max: 15 ball)'),
        ('4_bosh_vaqt', '4. Yoshlarning bo‘sh vaqtini mazmunli tashkil etish (Max: 15 ball)'),
        ('5_profilaktika', '5. Ijtimoiy profilaktika tadbirlari (Max: 10 ball)'),
        ('6_murojaat', '6. Murojaatlar bilan ishlash (Max: 5 ball)'),
        ('7_brend', '7. Brend loyihalar va Shaxsiy rivojlanish (Max: 10 ball)'),
        ('8_talim', '8. Ta’lim muassasalaridagi yoshlar bilan ishlash (Max: 5 ball)'),
        ('9_startap', '9. Zamonaviy kasblar va startap loyihalar (Max: 5 ball)'),
        ('10_nomenklatura', '10. Nomenklatura hujjatlar (Max: 10 ball)'),
    ]

    STATUS_CHOICES = [
        ('sariq', 'Kutilmoqda (Sariq)'),
        ('yashil', 'Tasdiqlandi (Yashil)'),
        ('qizil', 'Rad etildi (Qizil)'),
    ]

    EVENT_TYPES = [
        ('sport', 'Sport'),
        ('kibersport', 'Kibersport'),
        ('musiqa', 'Musiqa'),
        ('manaviy', 'Ma’naviy-ma’rifiy'),
        ('boshqa', 'Boshqa'),
    ]

    PROFILAKTIKA_TYPES = [
        ('suhbat', 'Profilaktik suhbat'),
        ('pq1', 'PQ-1 hujjat kiritish'),
    ]

    # Umumiy majburiy maydonlar
    leader = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='tasks', verbose_name="Yetakchi")
    direction = models.CharField(max_length=50, verbose_name="Yo'nalish turi")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sariq', verbose_name="Status")
    score = models.FloatField(default=0.0, verbose_name="Berilgan ball")
    admin_comment = models.TextField(blank=True, null=True, verbose_name="Admin izohi (Rad etish sababi)")
    month = models.DateField(help_text="Reyting hisoblanayotgan oy (masalan, 2026-07-01)", verbose_name="Hisobot oyi")

    # 2-Yo'nalish va boshqalar uchun umumiy matn maydoni
    text_comment = models.TextField(blank=True, null=True, verbose_name="Qo'shimcha izoh (Text field)")

    # 4-Yo'nalish: Bo'sh vaqt tadbirlari uchun maxsus maydonlar
    event_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Tadbir nomi")
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES, blank=True, null=True, verbose_name="Tadbir turi")
    youth_count = models.IntegerField(blank=True, null=True, verbose_name="Qatnashgan yoshlar soni")
    location = models.CharField(max_length=255, blank=True, null=True, verbose_name="Joy nomi")
    event_time = models.DateTimeField(blank=True, null=True, verbose_name="Tadbir vaqti")

    # 5-Yo'nalish: Ijtimoiy profilaktika uchun maxsus maydonlar
    profilaktika_type = models.CharField(max_length=50, choices=PROFILAKTIKA_TYPES, blank=True, null=True, verbose_name="Profilaktika turi")

    # 8-Yo'nalish: Ta'lim muassasalari uchun maxsus maydonlar
    student_fio = models.CharField(max_length=255, blank=True, null=True, verbose_name="O'quvchining Ism Familiyasi")

    # 9-Yo'nalish: Startap loyihalar uchun maxsus maydonlar (StartupAndijonBot integratsiyasi uchun)
    startup_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Startap nomi")
    startup_owner_fio = models.CharField(max_length=255, blank=True, null=True, verbose_name="Startapchi F.I.O")

    def __str__(self):
        return f"{self.leader.mahalla_name} - {self.get_direction_display()} ({self.get_status_display()})"

    class Meta:
        verbose_name = "KPI Topshiriq"
        verbose_name_plural = "KPI Topshiriqlari"
        ordering = ['-created_at']