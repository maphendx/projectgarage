import json
from channels.generic.websocket import AsyncWebsocketConsumer

class VoiceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"voice_{self.room_name}"
        
        # Приєднання до групи
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Вихід з групи
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Отримання повідомлення з WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")
        payload = data.get("payload")

        # Відправка отриманого повідомлення всім учасникам кімнати
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "voice_message",
                "message": {
                    "type": message_type,
                    "payload": payload,
                },
                "sender_channel": self.channel_name,
            }
        )

    # Обробка повідомлення від групи
    async def voice_message(self, event):
        if self.channel_name == event.get("sender_channel"):
            return

        message = event.get("message")
        # Відправка повідомлення через WebSocket клієнту
        await self.send(text_data=json.dumps(message))