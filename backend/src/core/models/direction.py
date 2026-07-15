from src.core.models.base import *


class KPIDirection(BaseModel):
    key = models.CharField(max_length=50, unique=True, verbose_name="Kalit (masalan: 1_ijro)")
    label = models.CharField(max_length=200, verbose_name="Yo'nalish nomi")
    max_score = models.PositiveIntegerField(verbose_name="Maksimal ball")
    order = models.PositiveSmallIntegerField(default=0, verbose_name="Tartib raqami")
    admin_scored = models.BooleanField(default=False, verbose_name="Admin tomonidan baholanadi")
    is_uploadable = models.BooleanField(default=True, verbose_name="Foydalanuvchi fayl yuklashi mumkin")
    info = models.TextField(blank=True, verbose_name="Qisqacha ma'lumot")
    how = models.TextField(blank=True, verbose_name="Qanday bajarish kerak")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    default_target = models.PositiveIntegerField(
        default=0, blank=True,
        verbose_name="Oylik reja default soni",
        help_text="0 = default yo'q. Reja sahifasida boshlang'ich qiymat sifatida ishlatiladi.",
    )

    class Meta:
        ordering = ['order']
        verbose_name = "KPI Yo'nalish"
        verbose_name_plural = "KPI Yo'nalishlar"

    def __str__(self):
        return f"{self.order}. {self.label} (max: {self.max_score} ball)"
