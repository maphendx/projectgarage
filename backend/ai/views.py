import os
import logging
import requests
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

# Використання налаштувань із файлу settings.py
MODEL_API_URL = getattr(settings, 'MODEL_API_URL', "https://api-inference.huggingface.co/models/your-model-id")
HF_API_TOKEN = getattr(settings, 'HF_API_TOKEN', "YOUR_HF_API_TOKEN")
API_HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

class UploadMusicView(APIView):
    """
    Ендпоінт для завантаження музичного файлу.
    Файл зберігається тимчасово і надсилається до API нейромережі для обробки.
    """

    def post(self, request, format=None):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'Файл не надіслано'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Збереження файлу тимчасово
        file_path = default_storage.save(file_obj.name, file_obj)
        file_full_path = os.path.join(default_storage.location, file_path)

        try:
            with open(file_full_path, "rb") as f:
                files = {"file": f}
                # Додавання timeout для запиту (наприклад, 30 секунд)
                response = requests.post(MODEL_API_URL, headers=API_HEADERS, files=files, timeout=30)
        except Exception as e:
            logger.error("Помилка при виклику нейромережевого API: %s", str(e))
            return Response({'error': 'Помилка при виклику нейромережевого API', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Видаляємо тимчасово збережений файл
            default_storage.delete(file_path)
        
        if response.status_code != 200:
            logger.error("Нейромережеве API повернуло помилку: %s", response.text)
            return Response({'error': 'Нейромережеве API повернуло помилку', 'details': response.text},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Повертаємо отриманий результат від нейромережі
        return Response({'result': response.json()}, status=status.HTTP_200_OK)


class ModifyMusicView(APIView):
    """
    Ендпоінт для модифікації вже завантаженої музики.
    Приймає JSON з параметрами:
        - music_url: URL завантаженого музичного файлу (можна зберігати його в базі або на файловому сервері)
        - instruction: інструкція для нейромережі (наприклад, "додати барабани", "змінити мелодію" тощо)
    """

    def post(self, request, format=None):
        music_url = request.data.get('music_url')
        instruction = request.data.get('instruction')
        
        if not music_url or not instruction:
            return Response({'error': 'Параметри music_url та instruction є обов’язковими'},status=status.HTTP_400_BAD_REQUEST)
        
        payload = {
            "music_url": music_url,
            "instruction": instruction
        }
        
        try:
            response = requests.post(MODEL_API_URL, headers=API_HEADERS, json=payload, timeout=30)
        except Exception as e:
            logger.error("Помилка при виклику нейромережевого API: %s", str(e))
            return Response({'error': 'Помилка при виклику нейромережевого API', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if response.status_code != 200:
            logger.error("Нейромережеве API повернуло помилку: %s", response.text)
            return Response({'error': 'Нейромережеве API повернуло помилку', 'details': response.text}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({'result': response.json()}, status=status.HTTP_200_OK)
