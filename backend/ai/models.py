from django.db import models
from django.conf import settings

class MusicStyle(models.Model):
    """
    Модель для зберігання стилів музики.
    """
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class GenerationTask(models.Model):
    """
    Модель для зберігання завдань генерації.
    """
    REQUEST_TYPES = (
        ('audio', 'Audio Generation'),
        ('extend', 'Audio Extension'),
        ('lyrics', 'Lyrics Generation'),
        ('wav', 'WAV Generation'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="generation_tasks", null=True, blank=True)
    task_id = models.CharField(max_length=255, blank=True, null=True)
    request_type = models.CharField(max_length=50, choices=REQUEST_TYPES)
    example = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, default="pending")
    result = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Task {self.id}"

class Song(models.Model):
    """
    Модель для зберігання згенерованих пісень.
    За замовчуванням пісня не є публічною (is_public=False).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="songs",
        null=True,
        blank=True
    )
    task_id = models.CharField(max_length=255)
    audio_id = models.CharField(max_length=255, blank=True, null=True)  # Додане поле для зберігання audio_id
    model_name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    audio_file = models.CharField(max_length=255)
    photo_file = models.CharField(max_length=255)
    example = models.CharField(max_length=255, blank=True, null=True)
    styles = models.ManyToManyField(MusicStyle, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)  # За замовчуванням не публічна

    def __str__(self):
        return f"{self.title} ({self.model_name})"

class Lyrics(models.Model):
    """
    Модель для зберігання текстів пісень.
    Пов'язана з GenerationTask, якщо текст був створений через API,
    або може існувати незалежно, якщо текст був введений вручну.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lyrics",
        null=True,
        blank=True
    )
    task_id = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=255)
    content = models.TextField()  # Зберігання тексту пісні
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)  # За замовчуванням не публічна
    song = models.OneToOneField(
        Song, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='lyrics'
    )  # Пов'язана пісня, якщо є

    def __str__(self):
        return f"{self.title}"

    class Meta:
        verbose_name = "Lyrics"
        verbose_name_plural = "Lyrics"