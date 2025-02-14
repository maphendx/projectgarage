from rest_framework import serializers

from users.models import CustomUser
from users.serializers import UserProfileSerializer
from voice_channels.models import Invitation, VoiceChannel, VoiceParticipant

class UserDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['email', 'display_name']

class VoiceParticipantSerializer(serializers.ModelSerializer):
    subject = UserDataSerializer(read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=VoiceParticipant.objects.all(),  # Приймає ID при створенні
        source='subject',  
        write_only=True  # Тільки для запису
    )

    class Meta:
        model = VoiceParticipant
        fields = '__all__'


class VoiceChannelSerializer(serializers.ModelSerializer):
    creator = UserDataSerializer(read_only=True)
    participants = VoiceParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = VoiceChannel
        fields = '__all__'

class InvitationSerializer(serializers.ModelSerializer):
    sender = UserDataSerializer(read_only=True)
    recipient = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), 
        source='addressee'
    )
    voice_channel = VoiceChannelSerializer(read_only=True)
    voice_channel_id = serializers.PrimaryKeyRelatedField(
        queryset=VoiceChannel.objects.all(),  # Приймає ID при створенні
        source='voice_channel',  
        write_only=True  # Тільки для запису
    )
    class Meta:
        model = Invitation
        fields = ['id', 'sender', 'recipient', 'voice_channel', 'created_at']



