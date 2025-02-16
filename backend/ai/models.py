from django.db import models

class MusicStyle(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Song(models.Model):
    task_id = models.CharField(max_length=100)
    model_name = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    audio_file = models.FileField(upload_to='ai/music/')
    photo_file = models.ImageField(upload_to='ai/photo/')
    styles = models.ManyToManyField(MusicStyle, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
