import json
import random
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

# Глобальний словник для збереження підключених користувачів для сигналізації
connected_peers = {}

# Новий консюмер для сигналізації, адаптований з Java-коду
class VoiceSignalingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"voice_{self.room_name}"
        self.my_id = None
        # Використовуємо sync_to_async для перевірки існування запису в БД
        chat_exists = await sync_to_async(self.scope["user"].voice_chats.filter(pk=self.room_name).exists)()

        if chat_exists:
            if self.room_group_name not in connected_peers:
                connected_peers[self.room_group_name] = {}
            # Приєднання до групи
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            print("Підключення встановлено (сигналізація)")
        else:
            print("X")
            await self.close()

    async def disconnect(self, close_code):
        # При відключенні видаляємо користувача зі списку
        if self.my_id is not None:
            if self.my_id in connected_peers[self.room_group_name]:
                del connected_peers[self.room_group_name][self.my_id]
            print(f"Користувач {self.my_id} відключився (сигналізація)")
        else:
            print("Підключення сигналізації завершено без приєднання")
        
    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")
        
        print("ПЕРЕСИЛКА ЛИСТА", text_data)
        #print("ПОТОЧНА БАЗА БАЗОВАНА: ", connected_peers)

        if msg_type == "join":
            # Якщо користувач вже приєднався, ігноруємо повторне приєднання
            if self.my_id is not None:
                return
            # Призначення унікального ідентифікатора (використовуємо випадкове число)
            self.my_id = self.scope["user"].id
            connected_peers[self.room_group_name][self.my_id] = self.channel_name
            # Повертаємо список інших підключених користувачів
            user_list = [peer for peer in connected_peers[self.room_group_name].keys() if peer != self.my_id]
            response = {
                "type": "user-list",
                "users": user_list
            }
            await self.send(text_data=json.dumps(response))
            print(f"Користувач {self.my_id} приєднався. Інші користувачі: {user_list}")
            
        elif msg_type in ("offer", "answer", "candidate", "leave"):
            # Обробка сигналізаційних повідомлень: offer, answer, candidate
            target_id = data.get("to")
            if target_id is None:
                # Якщо не зазначено отримувача, ігноруємо повідомлення
                return
            # ########
            # print("ПОТОЧНА БАЗА БАЗОВАНА: ", connected_peers[self.room_group_name])
            # print(f"🔎 Шукаємо {target_id} серед {connected_peers[self.room_group_name].keys()}")
            # print(f"📊 Тип target_id: {type(target_id)}")
            target_channel = connected_peers[self.room_group_name].get(int(target_id))
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