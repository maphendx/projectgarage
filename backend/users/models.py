from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)                                          # Унікальна електронна пошта для авторизації
    full_name = models.CharField(max_length=100, blank=True, null=True)             # ПІБ
    display_name = models.CharField(max_length=50, unique=True)                     # Ім'я яке бачать інші
    subscriptions_count = models.PositiveIntegerField(default=0)                    # Кількість підписок
    subscribers_count = models.PositiveIntegerField(default=0)                      # Кількість підписаних
    total_likes = models.PositiveIntegerField(default=0)                            # Кількість лайків за весь час
    photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)   # Фотографія
    bio = models.TextField(blank=True, null=True)                                   # Коротке біо
    hashtags = models.CharField(max_length=255, blank=True, null=True)              # Хештеги для музикантів через кому (наприклад: #гітара, #басист)
    username = models.CharField(max_length=150, blank=True, null=True, unique=True)  # Додано
    def __str__(self):
        return self.display_name