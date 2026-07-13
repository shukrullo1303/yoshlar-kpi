from src.core.models.base import *


class TaskAttachment(BaseModel):
    """Topshiriqlarga biriktiriladigan bir nechta rasm yoki PDF fayllar (Slideshow va yuklamalar uchun)"""
    task = models.ForeignKey('KPITask', on_delete=models.CASCADE, related_name='attachments', verbose_name="Topshiriq")
    file = models.FileField(upload_to='kpi_uploads/%Y/%m/', verbose_name="Fayl yoki Rasm (PDF/JPG/PNG)")
    is_image = models.BooleanField(default=False, verbose_name="Bu rasmmi?")

    def __str__(self):
        return f"{self.task.id}-topshiriq fayli"

    class Meta:
        verbose_name = "Ilova fayl"
        verbose_name_plural = "Ilova fayllari"