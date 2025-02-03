from rest_framework import serializers
from .models import ChatRoom, Message, Reaction

class ChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'

class ChatRoomAvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = ['avatar']

class ReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reaction
        fields = '__all__'
        read_only_fields = ('user', 'created_at')