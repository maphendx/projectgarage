from rest_framework import serializers

from users.models import CustomUser
from users.serializers import UserProfileSerializer
from voice_channels.models import Invitation, VoiceChannel

class UserDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['email', 'display_name']


class MicroUser(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["display_name"]

class DisplayNameRelatedField(serializers.PrimaryKeyRelatedField): # говнокод
    def get_queryset(self): # говнокод
        return CustomUser.objects.all() # говнокод

    def to_internal_value(self, data): # говнокод
        try: # говнокод
            user = CustomUser.objects.get(display_name=data) # говнокод
            return user # говнокод
        except CustomUser.DoesNotExist: # говнокод
            raise serializers.ValidationError(f"Користувач з display_name '{data}' не знайдений.") # говнокод

class VoiceChannelSerializer(serializers.ModelSerializer):
    creator = UserDataSerializer(read_only=True)
    participants = DisplayNameRelatedField(queryset=CustomUser.objects.all(), many=True, required=False, write_only=True)
    participants_list = MicroUser(read_only=True, many=True)

    class Meta:
        model = VoiceChannel
        #fields = '__all__'
        fields = ['id', 'creator', 'participants', 'participants_list', 'name', 'created_at'] 

    def create(self, validated_data): # говнокод
        participants_data = validated_data.pop('participants', []) # говнокод
        channel = VoiceChannel.objects.create(**validated_data) # говнокод

        if participants_data: # говнокод
            channel.participants.add(*participants_data) # говнокод

        return channel # говнокод
    
    def to_representation(self, instance): # говнокод
        """ # говнокод
        Цей метод змінює представлення даних для коректного виведення списку учасників. # говнокод
        """ 
        representation = super().to_representation(instance) # говнокод
        
        # Додаємо participants_list в представлення # говнокод
        representation['participants_list'] = MicroUser(instance.participants.all(), many=True).data # говнокод
        
        return representation # говнокод


class InvitationSerializer(serializers.ModelSerializer):
    sender = UserDataSerializer(read_only=True)
    recipient = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), 
        source='addressee'
    )
    voice_channel = VoiceChannelSerializer(read_only=True)

    class Meta:
        model = Invitation
        fields = ['id', 'sender', 'recipient', 'voice_channel', 'created_at']

