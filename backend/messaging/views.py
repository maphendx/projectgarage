import os
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message, Reaction
from .serializers import (
    ChatRoomSerializer,
    MessageSerializer,
    ChatRoomAvatarSerializer,
    ReactionSerializer
)
from rest_framework.permissions import IsAuthenticated

class ChatRoomView(APIView):
    def get(self, request):
        rooms = ChatRoom.objects.all()
        serializer = ChatRoomSerializer(rooms, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ChatRoomSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AddParticipantView(APIView):
    def post(self, request, room_id):
        try:
            chat_room = ChatRoom.objects.get(pk=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Чат не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        user_ids = request.data.get('user_ids')
        if not user_ids:
            user_id = request.data.get('user_id')
            if not user_id:
                return Response({'error': 'Не вказано ідентифікатор користувача.'}, status=status.HTTP_400_BAD_REQUEST)
            user_ids = [user_id]
        if not isinstance(user_ids, list):
            user_ids = [user_ids]

        User = get_user_model()
        participants = User.objects.filter(id__in=user_ids)
        if not participants.exists():
            return Response({'error': 'Користувача не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        for user in participants:
            chat_room.participants.add(user)
        chat_room.save()

        serializer = ChatRoomSerializer(chat_room)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ChatRoomAvatarView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, room_id):
        try:
            chat_room = ChatRoom.objects.get(pk=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Чат не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ChatRoomAvatarSerializer(chat_room, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MessageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        messages = Message.objects.filter(chat_id=room_id)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, room_id=None):
        data = request.data.copy()
        data['sender'] = request.user.id
        
        serializer = MessageSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReactionView(APIView):
    """
    GET: Повертає всі реакції для заданого повідомлення.
    POST: Додає або оновлює реакцію поточного користувача.
    DELETE: Видаляє реакцію поточного користувача для повідомлення.
    """
    def get(self, request, message_id):
        try:
            message = Message.objects.get(pk=message_id)
        except Message.DoesNotExist:
            return Response({'error': 'Повідомлення не знайдено.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ReactionSerializer(message.reactions.all(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, message_id):
        try:
            message = Message.objects.get(pk=message_id)
        except Message.DoesNotExist:
            return Response({'error': 'Повідомлення не знайдено.'}, status=status.HTTP_404_NOT_FOUND)
        
        reaction_value = request.data.get('reaction')
        if not reaction_value:
            return Response({'error': 'Не вказано реакцію.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        reaction, created = Reaction.objects.update_or_create(
            message=message,
            user=user,
            defaults={'reaction': reaction_value}
        )
        serializer = ReactionSerializer(reaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    def delete(self, request, message_id):
        try:
            reaction = Reaction.objects.get(message_id=message_id, user=request.user)
        except Reaction.DoesNotExist:
            return Response({'error': 'Реакція не знайдена.'}, status=status.HTTP_404_NOT_FOUND)
        reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class EmojiListView(APIView):
    """
    GET: Повертає список доступних емодзі (реакцій) із файлу reaction_list.json,
    розташованого за шляхом backend/media/massang/emoji/reaction_list.json.
    """
    def get(self, request):
        emoji_file_path = os.path.join(settings.BASE_DIR, 'backend', 'media', 'massang', 'emoji', 'reaction_list.json')
        try:
            with open(emoji_file_path, 'r', encoding='utf-8') as f:
                emoji_data = json.load(f)
        except FileNotFoundError:
            return Response({'error': 'База реакцій не знайдена.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(emoji_data, status=status.HTTP_200_OK)