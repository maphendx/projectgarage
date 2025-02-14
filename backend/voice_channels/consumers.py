import json
import random
from channels.generic.websocket import AsyncWebsocketConsumer

# Існуючий консюмер для голосових кімнат
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

    async def voice_message(self, event):
        if self.channel_name == event.get("sender_channel"):
            return
        message = event.get("message")
        await self.send(text_data=json.dumps(message))


# Глобальний словник для збереження підключених користувачів для сигналізації
connected_peers = {}

# Новий консюмер для сигналізації, адаптований з Java-коду
class VoiceSignalingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Приймаємо підключення
        await self.accept()
        self.my_id = None  # Ідентифікатор користувача, який буде встановлено під час "join"
        print("Підключення встановлено (сигналізація)")
        
    async def disconnect(self, close_code):
        # При відключенні видаляємо користувача зі списку
        if self.my_id is not None:
            if self.my_id in connected_peers:
                del connected_peers[self.my_id]
            print(f"Користувач {self.my_id} відключився (сигналізація)")
        else:
            print("Підключення сигналізації завершено без приєднання")
        
    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")
        
        if msg_type == "join":
            # Якщо користувач вже приєднався, ігноруємо повторне приєднання
            if self.my_id is not None:
                return
            # Призначення унікального ідентифікатора (використовуємо випадкове число)
            self.my_id = random.random()
            connected_peers[self.my_id] = self.channel_name
            # Повертаємо список інших підключених користувачів
            user_list = [peer for peer in connected_peers.keys() if peer != self.my_id]
            response = {
                "type": "user-list",
                "users": user_list
            }
            await self.send(text_data=json.dumps(response))
            print(f"Користувач {self.my_id} приєднався. Інші користувачі: {user_list}")
            
        elif msg_type in ("offer", "answer", "candidate"):
            # Обробка сигналізаційних повідомлень: offer, answer, candidate
            target_id = data.get("to")
            if target_id is None:
                # Якщо не зазначено отримувача, ігноруємо повідомлення
                return
            target_channel = connected_peers.get(target_id)
            if target_channel:
                # Додаємо інформацію про відправника
                data["from"] = self.my_id
                message = json.dumps(data)
                # Надсилаємо повідомлення безпосередньо потрібному користувачу через channel_layer
                await self.channel_layer.send(target_channel, {
                    "type": "signal_message",
                    "text": message
                })
                print(f"Надіслано повідомлення від {self.my_id} до {target_id}: {message}")
            else:
                # Якщо отримувача немає – повертаємо повідомлення про помилку
                error = {"type": "error", "message": "Користувача не знайдено"}
                await self.send(text_data=json.dumps(error))
                print(f"Не вдалося знайти користувача з id {target_id}")
                
        else:
            # Обробка невідомих типів повідомлень
            print("Невідомий тип повідомлення:", msg_type)
    
    async def signal_message(self, event):
        # Обробка повідомлень, отриманих через channel_layer.send() від інших користувачів
        text = event.get("text", "")
        await self.send(text_data=text)