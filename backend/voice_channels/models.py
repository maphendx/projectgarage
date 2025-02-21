from django.conf import settings
from django.db import models
from django.utils import timezone

from users.models import CustomUser

# Create your models here.
class VoiceChannel(models.Model):
    name = models.CharField(max_length=255)
    creator = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="voice_chats")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
class Invitation(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[("pending", "Pending"), ("accepted", "Accepted"), ("rejected", "Rejected")])
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="sent_voice_invitations") # надсилач
    addressee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="getted_voice_invitations") # отримувач
    voice_channel = models.ForeignKey(VoiceChannel, on_delete=models.CASCADE, related_name="inner_invitations")