from django.db import models

from users.models import CustomUser

# Create your models here.
class VoiceChannel(models.Model):
    name = models.CharField(max_length=255, unique=True)
    creator = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
    
class Invitation(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="sent_voice_invitations") # надсилач
    addressee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="getted_voice_invitations") # отримувач
    voice_channel = models.ForeignKey(VoiceChannel, on_delete=models.CASCADE, related_name="inner_invitations")
    
class VoiceParticipant(models.Model):
    # is_creator = models.models.BooleanField()
    subject = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="as_participant_voices")
    channel = models.ForeignKey(VoiceChannel, on_delete=models.CASCADE, related_name="sent_invitations")