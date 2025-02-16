import os
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message, Reaction
from .serializers import ChatRoomSerializer, MessageSerializer, ChatRoomAvatarSerializer, ReactionSerializer
from rest_framework.permissions import IsAuthenticated
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class ChatRoomView(APIView):
    permission_classes = [IsAuthenticated]  # Доступ лише для автентифікованих користувачів

    def get(self, request):
        # Повертаємо лише ті чати, у яких поточний користувач є учасником
        rooms = ChatRoom.objects.filter(participants=request.user)
        serializer = ChatRoomSerializer(rooms, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()

        # Вилучаємо поле "participants", яке є обов'язковим у запиті, але не використовується
        data.pop('participants', None)
        
        # Обробка користувачів за display_name
        display_names = data.pop('participants_display_names', None)
        User = get_user_model()
        if display_names:
            if not isinstance(display_names, list):
                display_names = [display_names]
            users = User.objects.filter(display_name__in=display_names)
            if not users.exists():
                return Response({'error': 'Користувач(і) не знайдені.'}, status=status.HTTP_404_NOT_FOUND)
            # Заповнюємо поле participants із id користувачів
            data['participants'] = list(users.values_list('id', flat=True))

        serializer = ChatRoomSerializer(data=data)
        if serializer.is_valid():
            chat_room = serializer.save()
            # Якщо display_names були передані, переконуємось, що учасники додані
            if display_names:
                chat_room.participants.set(users)
            # Автоматично додаємо творця чату, якщо він автентифікований
            if request.user.is_authenticated:
                chat_room.participants.add(request.user)
            final_serializer = ChatRoomSerializer(chat_room)
            return Response(final_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AddParticipantView(APIView): 
    permission_classes = [IsAuthenticated]  # Додано перевірку автентифікації

    def post(self, request, room_id):
        try:
            chat_room = ChatRoom.objects.get(pk=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Чат не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        # Очікуємо, що користувач завжди передасть масив через ключ 'user_display_names'
        display_names = request.data.get('user_display_names')
        if not display_names:
            return Response({'error': 'Не вказано user_display_names.'}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(display_names, list):
            display_names = [display_names]

        User = get_user_model()
        participants = User.objects.filter(display_name__in=display_names)
        found_display_names = {user.display_name for user in participants}
        missing = [name for name in display_names if name not in found_display_names]
        if missing:
            return Response(
                {'error': f'Не знайдено користувача(ів) з user_display_names: {", ".join(missing)}.'},
                status=status.HTTP_404_NOT_FOUND
            )

        for user in participants:
            chat_room.participants.add(user)
        chat_room.save()

        serializer = ChatRoomSerializer(chat_room)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ChatRoomAvatarView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def patch(self, request, room_id):
        try:
            chat_room = ChatRoom.objects.get(pk=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Чат не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        # Перевірка: чи є запитувач учасником даного чату
        if not chat_room.participants.filter(pk=request.user.pk).exists():
            return Response({'error': 'Ви не є учасником цього чату.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ChatRoomAvatarSerializer(chat_room, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, room_id):
        try:
            chat_room = ChatRoom.objects.get(pk=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Чат не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ChatRoomAvatarSerializer(chat_room)
        return Response(serializer.data, status=status.HTTP_200_OK)

class MessageView(APIView):
    permission_classes = [IsAuthenticated]  # Захищаємо шлях для автентифікованих користувачів

    def get(self, request, room_id):
        messages = Message.objects.filter(chat_id=room_id).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, room_id):
        try:
            chat_room = ChatRoom.objects.get(pk=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Чат не знайдено.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Перевірка: користувач має бути учасником даного чату
        if not chat_room.participants.filter(pk=request.user.pk).exists():
            return Response({'error': 'Ви не є учасником цього чату.'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['chat'] = room_id
        # Виключаємо поле "sender" із запиту та привʼязуємо повідомлення до request.user 
        data['sender'] = request.user.pk
        
        serializer = MessageSerializer(data=data)
        if serializer.is_valid():
            message_obj = serializer.save()
            
            #ЦЕ ДЛЯ БЕКЕНДЕРОВ
            # Підрахунок кількості непрочитаних повідомлень.
            # Поточна реалізація рахує всі повідомлення в чаті,
            # окрім повідомлень, надісланих поточним користувачем.
            # При необхідності, варто імплементувати механізм відстеження прочитаних повідомлень.
            unread_count = Message.objects.filter(chat=chat_room).exclude(sender=request.user).count()
            
            # Надсилання створеного повідомлення через веб-сокети.
            # Використовуємо channel layer і групу з іменем "chat_<room_id>".
            channel_layer = get_channel_layer()
            group_name = f"chat_{chat_room.pk}"
            
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'chat_message',
                    'message': message_obj.content,
                    'sender': request.user.display_name,
                    'unread_count': unread_count,
                }
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReactionView(APIView):
    permission_classes = [IsAuthenticated]  # Додано перевірку автентифікації
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
        if not reaction_value or not reaction_value.strip():
            return Response({'error': 'Поле "reaction" є обов\'язковим.'}, status=status.HTTP_400_BAD_REQUEST)
        
        valid_reactions = ["like", "love", "laugh", "wow", "sad", "angry"]
        if reaction_value not in valid_reactions:
            return Response(
                {'error': f'Невірна реакція. Допустимі значення: {", ".join(valid_reactions)}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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

class ChatRoomDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, room_id):
        try:
            chat_room = ChatRoom.objects.get(pk=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Чат не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        # Перевіряємо, чи є запитувач учасником цього чату
        if not chat_room.participants.filter(pk=request.user.pk).exists():
            return Response({'error': 'Ви не є учасником цього чату.'}, status=status.HTTP_403_FORBIDDEN)

        chat_room.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class MessageDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, message_id):
        try:
            message = Message.objects.get(pk=message_id)
        except Message.DoesNotExist:
            return Response({'error': 'Повідомлення не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        # Переконуємося, що користувач є автором повідомлення
        if message.sender != request.user:
            return Response({'error': 'Ви не маєте дозволу видалити це повідомлення.'}, status=status.HTTP_403_FORBIDDEN)

        message.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)