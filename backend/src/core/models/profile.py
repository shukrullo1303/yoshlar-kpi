from src.core.models.base import *



class Profile(BaseModel):
    """76 ta mahalla yoshlar yetakchilari ma'lumotlari"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='kpi_profile')
    mahalla_name = models.CharField(max_length=255, verbose_name="Mahalla nomi")
    district = models.CharField(max_length=100, default="Asaka", verbose_name="Tuman")
    
    def __str__(self):
        return f"{self.mahalla_name} - {self.user.get_full_name()}"

    class Meta:
        verbose_name = "Yetakchi profili"
        verbose_name_plural = "Yetakchilar profillari"


