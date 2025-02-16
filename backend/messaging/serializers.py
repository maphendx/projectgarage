from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message, Reaction

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = User
        fields = ('id', 'photo', 'display_name')

class ChatRoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatRoom
        fields = '__all__'

class ReactionSerializer(serializers.ModelSerializer):
    reaction = serializers.CharField(
        required=True,
        error_messages={'required': 'Поле "reaction" є обов\'язковим.'}
    )
    
    class Meta:
        model = Reaction
        fields = '__all__'
    
    def validate_reaction(self, value):
        valid_reactions = ["like", "love", "laugh", "wow", "sad", "angry"]
        if value not in valid_reactions:
            raise serializers.ValidationError(
                f"Невірна реакція. Допустимі значення: {', '.join(valid_reactions)}."
            )
        return value

class MessageSerializer(serializers.ModelSerializer):
    reactions = ReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = '__all__'

class ChatRoomAvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = ['avatar']