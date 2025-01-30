# ai/models.py

from django.db import models
from users.models import CustomUser
from django.utils import timezone

class Recommendation(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='recommendations')
    recommended_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='recommended_to')
    score = models.FloatField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('user', 'recommended_user')

    def __str__(self):
        return f'Recommendation for {self.user.display_name} to {self.recommended_user.display_name}'

class TrainingData(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='training_data')
    data = models.TextField()  # Зберігаємо дані у текстовому форматі, можна використовувати JSON
    labels = models.TextField()  # Те саме для міток
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'Training data for {self.user.display_name}'