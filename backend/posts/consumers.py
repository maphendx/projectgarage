import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.group_name = f"notifications_{self.user.id}"
        if self.scope["user"].is_anonymous:
            # Відхиляємо підключення неавторизованих користувачів
            await self.close()
        else:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        # Метод, який надсилає повідомлення клієнту
        await self.send(text_data=json.dumps(event["notification"]))