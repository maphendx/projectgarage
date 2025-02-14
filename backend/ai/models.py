from django.db import models

class MusicFile(models.Model):
    file = models.FileField(upload_to='music/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    result_data = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"MusicFile {self.id}"
