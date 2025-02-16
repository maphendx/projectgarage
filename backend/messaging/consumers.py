import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        # Приєднання до групи
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Вихід із групи
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Обробка повідомлення
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        sender = self.scope["user"].display_name
        # Отримання URL фото користувача (якщо фото існує)
        sender_photo = self.scope["user"].photo.url if self.scope["user"].photo else ""

        # Відправка повідомлення в групу з фото відправника
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': sender,
                'sender_photo': sender_photo,
            }
        )

    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']
        sender_photo = event.get('sender_photo', "")

        # Відправка повідомлення у WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
            'sender_photo': sender_photo,
        }))
