from django.db import models
from django.conf import settings

class MusicStyle(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class GenerationTask(models.Model):
    REQUEST_TYPES = (
        ('audio', 'Audio Generation'),
        ('extend', 'Audio Extension'),
        ('lyrics', 'Lyrics Generation'),
        ('wav', 'WAV Generation'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,  related_name="generation_tasks", null=True, blank=True)
    task_id = models.CharField(max_length=255, blank=True, null=True)
    request_type = models.CharField(max_length=50, choices=REQUEST_TYPES)
    example = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, default="pending")
    result = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Task {self.id}"

class Song(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="songs",
        null=True,
        blank=True
    )
    task_id = models.CharField(max_length=255)
    model_name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    audio_file = models.CharField(max_length=255)
    photo_file = models.CharField(max_length=255)
    example = models.CharField(max_length=255, blank=True, null=True)
    styles = models.ManyToManyField(MusicStyle, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)  # Додано поле для публічності

    def __str__(self):
        return f"{self.title} ({self.model_name})"