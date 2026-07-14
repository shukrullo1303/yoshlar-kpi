from django.db import models
from src.core.models.base import BaseModel


class KPIMonthPlan(BaseModel):
    direction_key = models.CharField(max_length=30)
    month = models.DateField()  # YYYY-MM-01
    target_count = models.PositiveIntegerField(default=1)
    plan_dates = models.JSONField(default=list, blank=True)  # ["YYYY-MM-DD", ...]

    class Meta:
        unique_together = ('direction_key', 'month')
        ordering = ['month', 'direction_key']
        verbose_name = 'Oylik Reja'
        verbose_name_plural = 'Oylik Rejalar'

    def __str__(self):
        return f"{self.direction_key} | {self.month} | {self.target_count} ta"
