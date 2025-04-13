import json
import os
import uuid
import logging
import requests
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.urls import reverse

from .models import Lyrics, Song, MusicStyle, GenerationTask
from .serializers import LyricsSerializer, SongSerializer, GenerationTaskSerializer, MusicStyleSerializer

# Імпортуємо необхідні модулі DRF
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# Налаштування логування
logger = logging.getLogger(__name__)

# Конфігурація для Suno API
SUNO_API_KEY = os.environ.get("SUNO_API_KEY")
SUNO_BASE_URL = "https://apibox.erweima.ai"

HEADERS = {
    "Authorization": f"Bearer {SUNO_API_KEY}",
    "Content-Type": "application/json"
}

def download_file(url, folder, prefix):
    """
    Завантажує файл з URL та зберігає його у вказану папку (відносно MEDIA_ROOT).
    Повертає шлях до збереженого файлу.
    
    Args:
        url (str): URL для завантаження файлу
        folder (str): Папка для збереження (відносно MEDIA_ROOT)
        prefix (str): Префікс для імені файлу
        
    Returns:
        str: Шлях до збереженого файлу або порожній рядок у випадку помилки
    """
    # Перевіряємо, чи URL не порожній
    if not url:
        logger.warning(f"Порожній URL для завантаження у папку {folder}")
        return ""
        
    try:
        response = requests.get(url)
        if response.status_code == 200:
            # Отримуємо розширення з URL або використовуємо порожній рядок
            ext = os.path.splitext(url)[1] or ''
            # Створюємо унікальне ім'я файлу
            filename = f"{prefix}_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(folder, filename)
            
            # Переконуємося, що директорія існує
            os.makedirs(os.path.dirname(default_storage.path(file_path)), exist_ok=True)
            
            # Зберігаємо через систему сховища Django
            saved_path = default_storage.save(file_path, ContentFile(response.content))
            logger.info(f"Файл успішно завантажено: {saved_path}")
            return saved_path
        else:
            logger.error(f"Помилка завантаження файлу. Статус: {response.status_code}")
    except Exception as e:
        logger.exception(f"Помилка при завантаженні файлу: {e}")
    return ""

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_audio(request):
    """
    Ендпоінт для створення завдання генерації аудіо.
    
    Метод отримує дані для генерації аудіо, створює запис у базі даних,
    та пересилає запит до Suno API. Зберігає task_id для подальшого використання.
    
    Args:
        request: HTTP запит з даними для генерації
        
    Returns:
        Response: Відповідь з даними про створене завдання
    """
    try:
        # Отримуємо дані запиту
        payload = request.data
        example = payload.get("example", "")
        
        # Перевіряємо обов'язкові поля
        required_fields = ["customMode", "instrumental", "model"]
        for field in required_fields:
            if field not in payload:
                return Response(
                    {"error": f"Поле {field} є обов'язковим"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        # Налаштовуємо callback URL, якщо він не наданий
        if not payload.get("callBackUrl"):
            # Встановлюємо URL для колбеку на наш сервер
            payload["callBackUrl"] = request.build_absolute_uri(reverse('callback'))
        
        # Зберігаємо дані запиту із id користувача і example
        task_record = GenerationTask.objects.create(
            user=request.user, 
            request_type="audio", 
            example=example, 
            status="pending"
        )
        
        logger.info(f"Створено завдання генерації аудіо: {task_record.id}")
        
        # Виконуємо запит до Suno API
        resp = requests.post(f"{SUNO_BASE_URL}/api/v1/generate", json=payload, headers=HEADERS)
        response_data = resp.json()
        
        # Перевіряємо успішність запиту
        if resp.status_code == 200:
            task_id = response_data.get("data", {}).get("taskId")
            if task_id:
                task_record.task_id = task_id
                task_record.save()
                logger.info(f"Завдання {task_record.id} успішно відправлено, отримано task_id: {task_id}")
                
                # Повертаємо успішну відповідь з task_id
                return Response({
                    "success": True,
                    "message": "Завдання виконано успішно",
                    "taskId": task_id,
                    "status": "pending"
                }, status=status.HTTP_200_OK)
        else:
            # Якщо запит не успішний, оновлюємо статус завдання
            task_record.status = "failed"
            task_record.result = {"error": response_data.get("msg", "Невідома помилка")}
            task_record.save()
            logger.error(f"Помилка при створенні завдання {task_record.id}: {response_data}")
        
        return Response(response_data, status=resp.status_code)
        
    except Exception as e:
        # Логуємо помилку
        logger.exception(f"Помилка при створенні завдання: {e}")
        return Response(
            {"error": f"Виникла помилка: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extend_audio(request):
    """
    Ендпоінт для розширення існуючого аудіо.
    
    Метод отримує дані для розширення аудіо, створює запис у базі даних,
    та пересилає запит до Suno API. Зберігає task_id для подальшого використання.
    
    Args:
        request: HTTP запит з даними для розширення
        
    Returns:
        Response: Відповідь з даними про створене завдання
    """
    try:
        # Отримуємо дані запиту
        payload = request.data
        example = payload.get("example", "")
        
        # Перевіряємо обов'язкові поля
        if "defaultParamFlag" not in payload:
            return Response(
                {"error": "Поле defaultParamFlag є обов'язковим"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not payload.get("audioId"):
            return Response(
                {"error": "Поле audioId є обов'язковим"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not payload.get("model"):
            return Response(
                {"error": "Поле model є обов'язковим"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Якщо defaultParamFlag=true, потрібно вказати continueAt
        if payload.get("defaultParamFlag") and "continueAt" not in payload:
            return Response(
                {"error": "Поле continueAt є обов'язковим, коли defaultParamFlag=true"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Налаштовуємо callback URL, якщо він не наданий
        if not payload.get("callBackUrl"):
            payload["callBackUrl"] = request.build_absolute_uri(reverse('callback'))
        
        # Зберігаємо дані запиту із id користувача і example
        task_record = GenerationTask.objects.create(
            user=request.user, 
            request_type="extend", 
            example=example, 
            status="pending"
        )
        
        logger.info(f"Створено завдання розширення аудіо: {task_record.id}")
        
        # Виконуємо запит до Suno API
        resp = requests.post(f"{SUNO_BASE_URL}/api/v1/generate/extend", json=payload, headers=HEADERS)
        response_data = resp.json()
        
        # Перевіряємо успішність запиту
        if resp.status_code == 200:
            task_id = response_data.get("data", {}).get("taskId")
            if task_id:
                task_record.task_id = task_id
                task_record.save()
                logger.info(f"Завдання {task_record.id} успішно відправлено, отримано task_id: {task_id}")
                
                # Повертаємо успішну відповідь з task_id
                return Response({
                    "success": True,
                    "message": "Завдання виконано успішно",
                    "taskId": task_id,
                    "status": "pending"
                }, status=status.HTTP_200_OK)
        else:
            # Якщо запит не успішний, оновлюємо статус завдання
            task_record.status = "failed"
            task_record.result = {"error": response_data.get("msg", "Невідома помилка")}
            task_record.save()
            logger.error(f"Помилка при створенні завдання {task_record.id}: {response_data}")
        
        return Response(response_data, status=resp.status_code)
        
    except Exception as e:
        # Логуємо помилку
        logger.exception(f"Помилка при створенні завдання розширення аудіо: {e}")
        return Response(
            {"error": f"Виникла помилка: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_lyrics(request):
    """
    Ендпоінт для генерації тексту пісні (lyrics).
    
    Метод отримує дані для генерації тексту, створює запис у базі даних,
    та пересилає запит до Suno API. Зберігає task_id для подальшого використання.
    
    Args:
        request: HTTP запит з даними для генерації
        
    Returns:
        Response: Відповідь з даними про створене завдання
    """
    try:
        # Отримуємо дані запиту
        payload = request.data
        example = payload.get("example", "")
        
        # Перевіряємо обов'язкові поля
        if not payload.get("prompt"):
            return Response(
                {"error": "Поле prompt є обов'язковим"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Налаштовуємо callback URL, якщо він не наданий
        if not payload.get("callBackUrl"):
            payload["callBackUrl"] = request.build_absolute_uri(reverse('callback'))
        
        # Зберігаємо дані запиту із id користувача і example
        task_record = GenerationTask.objects.create(
            user=request.user, 
            request_type="lyrics", 
            example=example, 
            status="pending"
        )
        
        logger.info(f"Створено завдання генерації тексту: {task_record.id}")
        
        # Виконуємо запит до Suno API
        resp = requests.post(f"{SUNO_BASE_URL}/api/v1/lyrics", json=payload, headers=HEADERS)
        response_data = resp.json()
        
        # Перевіряємо успішність запиту
        if resp.status_code == 200:
            task_id = response_data.get("data", {}).get("taskId")
            if task_id:
                task_record.task_id = task_id
                task_record.save()
                logger.info(f"Завдання {task_record.id} успішно відправлено, отримано task_id: {task_id}")
                
                # Повертаємо успішну відповідь з task_id
                return Response({
                    "success": True,
                    "message": "Завдання виконано успішно",
                    "taskId": task_id,
                    "status": "pending"
                }, status=status.HTTP_200_OK)
        else:
            # Якщо запит не успішний, оновлюємо статус завдання
            task_record.status = "failed"
            task_record.result = {"error": response_data.get("msg", "Невідома помилка")}
            task_record.save()
            logger.error(f"Помилка при створенні завдання {task_record.id}: {response_data}")
        
        return Response(response_data, status=resp.status_code)
        
    except Exception as e:
        # Логуємо помилку
        logger.exception(f"Помилка при створенні завдання генерації тексту: {e}")
        return Response(
            {"error": f"Виникла помилка: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_wav(request):
    """
    Ендпоінт для генерації аудіо у WAV форматі.
    
    Метод отримує дані для генерації WAV, створює запис у базі даних,
    та пересилає запит до Suno API. Зберігає task_id для подальшого використання.
    
    Args:
        request: HTTP запит з даними для генерації
        
    Returns:
        Response: Відповідь з даними про створене завдання
    """
    try:
        # Отримуємо дані запиту
        payload = request.data
        example = payload.get("example", "")
        
        # Логуємо вхідні дані для дебагу
        logger.info(f"Вхідні дані WAV: {payload}")
        
        # Перевіряємо, щоб був вказаний хоча б один з обов'язкових ідентифікаторів
        if not payload.get("taskId") and not payload.get("audioId"):
            return Response(
                {"error": "Поле taskId або audioId є обов'язковим"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Налаштовуємо callback URL, якщо він не наданий
        if not payload.get("callBackUrl"):
            payload["callBackUrl"] = request.build_absolute_uri(reverse('callback'))
        
        # Зберігаємо дані запиту із id користувача і example
        task_record = GenerationTask.objects.create(
            user=request.user, 
            request_type="wav", 
            example=example, 
            status="pending"
        )
        
        logger.info(f"Створено завдання генерації WAV: {task_record.id}")
        
        # Виконуємо запит до Suno API
        try:
            resp = requests.post(f"{SUNO_BASE_URL}/api/v1/wav/generate", json=payload, headers=HEADERS)
            logger.info(f"Відповідь від API: статус {resp.status_code}")
            
            # Логуємо тіло відповіді для дебагу
            try:
                logger.info(f"Тіло відповіді: {resp.text[:500]}")  # Перші 500 символів для безпеки
            except Exception as e:
                logger.warning(f"Не вдалося логувати тіло відповіді: {e}")
                
        except requests.RequestException as e:
            logger.error(f"Помилка запиту до API: {e}")
            task_record.status = "failed"
            task_record.result = {"error": f"Помилка запиту до API: {str(e)}"}
            task_record.save()
            return Response(
                {"error": f"Помилка запиту до API: {str(e)}"}, 
                status=status.HTTP_502_BAD_GATEWAY
            )
        
        # Перевіряємо статус відповіді
        if resp.status_code != 200:
            task_record.status = "failed"
            task_record.result = {"error": f"API повернуло помилку: {resp.status_code}"}
            task_record.save()
            return Response(
                {"error": f"API повернуло помилку: {resp.status_code}"}, 
                status=resp.status_code
            )
            
        # Парсимо відповідь
        try:
            response_data = resp.json()
            logger.info(f"Розпарсені дані відповіді: {response_data}")
        except ValueError as e:
            logger.error(f"Не вдалося розпарсити JSON: {e}")
            task_record.status = "failed"
            task_record.result = {"error": f"Не вдалося розпарсити відповідь API: {str(e)}"}
            task_record.save()
            return Response(
                {"error": f"Не вдалося розпарсити відповідь API: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Перевіряємо структуру відповіді - захищаємо від None
        if not response_data:
            # Якщо відповідь порожня, використовуємо task_id з запиту
            logger.warning("API повернуло порожню відповідь, використовуємо task_id з запиту")
            task_id = payload.get("taskId")
            
            if not task_id:
                # Якщо немає task_id у запиті, генеруємо свій для відстеження
                task_id = f"wav_{uuid.uuid4().hex}"
                logger.warning(f"Створено тимчасовий task_id: {task_id}")
            
            task_record.task_id = task_id
            task_record.save()
            
            return Response({
                "success": True,
                "message": "Завдання відправлено, очікуємо колбек",
                "taskId": task_id,
                "status": "pending"
            }, status=status.HTTP_200_OK)
        
        # Перевіряємо наявність поля data
        data = response_data.get("data")
        if not data:
            logger.warning("Відсутнє поле 'data' у відповіді")
            
            # Перевіряємо інші можливі місця для task_id
            task_id = response_data.get("taskId")
            
            if not task_id:
                # Якщо немає task_id у відповіді, використовуємо з запиту або генеруємо свій
                task_id = payload.get("taskId")
                
                if not task_id:
                    task_id = f"wav_{uuid.uuid4().hex}"
                    logger.warning(f"Створено тимчасовий task_id: {task_id}")
            
            task_record.task_id = task_id
            task_record.status = "pending"
            task_record.result = response_data
            task_record.save()
            
            return Response({
                "success": True,
                "message": "Завдання відправлено з нестандартною відповіддю",
                "taskId": task_id,
                "status": "pending"
            }, status=status.HTTP_200_OK)
        
        # Якщо data є словником, пробуємо отримати task_id
        if isinstance(data, dict):
            task_id = data.get("taskId")
            if task_id:
                task_record.task_id = task_id
                task_record.save()
                logger.info(f"Завдання {task_record.id} успішно відправлено, отримано task_id: {task_id}")
                
                return Response({
                    "success": True,
                    "message": "Завдання виконано успішно",
                    "taskId": task_id,
                    "status": "pending"
                }, status=status.HTTP_200_OK)
        
        # Якщо це масив, або немає task_id, обробляємо нестандартний випадок
        logger.warning(f"Нестандартна структура відповіді: {type(data)}")
        
        # Використовуємо task_id з запиту або ID завдання в базі
        task_id = payload.get("taskId") or f"wav_task_{task_record.id}"
        task_record.task_id = task_id
        task_record.result = response_data
        task_record.save()
        
        return Response({
            "success": True,
            "message": "Завдання відправлено з нестандартною відповіддю",
            "taskId": task_id,
            "status": "pending"
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        # Логуємо помилку
        logger.exception(f"Помилка при створенні завдання генерації WAV: {e}")
        return Response(
            {"error": f"Виникла помилка: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Допоміжні функції для callback

def log_callback_data(data):
    """Логує отримані дані колбеку в файл та в логи системи."""
    try:
        with open("callback_log.json", "a", encoding="utf-8") as f:
            f.write(json.dumps(data, ensure_ascii=False, indent=4) + "\n")
        logger.info("Отримано колбек: %s", json.dumps(data, ensure_ascii=False))
    except Exception as e:
        logger.error(f"Не вдалося записати лог колбеку: {e}")

def get_task_record(task_id):
    """Отримує запис завдання за task_id."""
    try:
        task_record = GenerationTask.objects.get(task_id=task_id)
        logger.info(f"Знайдено завдання {task_record.id} для task_id={task_id}")
        return task_record
    except GenerationTask.DoesNotExist:
        logger.warning(f"Завдання з task_id={task_id} не знайдено в базі")
        return None

def update_task_status(task_record, status, result=None):
    """Оновлює статус та результат завдання."""
    if not task_record:
        return
        
    task_record.status = status
    if result:
        task_record.result = result
    task_record.save()
    logger.info(f"Завдання {task_record.id} оновлено зі статусом {status}")

def process_track(track, task_record, task_id):
    """Обробляє один трек з колбеку генерації аудіо."""
    # Отримуємо дані треку
    audio_id = track.get("id")
    audio_url = track.get("audio_url") or track.get("source_audio_url", "")
    image_url = track.get("image_url") or track.get("source_image_url", "")
    title = track.get("title", "Без назви")
    model_name = track.get("model_name", "")
    tags = track.get("tags", "")
    prompt = track.get("prompt", "")
    duration = track.get("duration", 0)
    
    logger.info(f"Обробка треку: {title} (ID: {audio_id})")
    
    if not audio_id:
        logger.warning("Пропущено трек без audio_id")
        return None
        
    # Завантажуємо файли тільки якщо вони вказані у респонсі
    audio_file_path = download_file(audio_url, "ai/music", task_id) if audio_url else ""
    photo_file_path = download_file(image_url, "ai/photo", task_id) if image_url else ""
    
    try:
        # Спочатку перевіряємо, чи існує пісня з таким audio_id
        existing_song = Song.objects.filter(audio_id=audio_id).first()
        
        if existing_song:
            # Якщо пісня існує, оновлюємо її поля
            logger.info(f"Знайдено існуючу пісню ID: {existing_song.id}, Audio ID: {audio_id}. Оновлюємо...")
            
            # Оновлюємо аудіо і фото, якщо вони є
            if audio_file_path:
                existing_song.audio_file = audio_file_path
            if photo_file_path:
                existing_song.photo_file = photo_file_path
                
            # Оновлюємо інші поля, тільки якщо вони мають значення
            if title:
                existing_song.title = title
            if model_name:
                existing_song.model_name = model_name
                
            existing_song.save()
            song = existing_song
            
        else:
            # Розділяємо теги на список
            style_names = [s.strip() for s in tags.split(",") if s.strip()]
            
            # Створюємо новий запис Song, якщо пісня не існує
            song = Song.objects.create(
                user=task_record.user if task_record else None,
                task_id=task_id,
                audio_id=audio_id,  
                model_name=model_name,
                title=title,
                audio_file=audio_file_path,
                photo_file=photo_file_path,
                example=task_record.example if task_record else "",
                is_public=False  # За замовчуванням не публічна
            )
            
            # Додаємо стилі до пісні
            for style_name in style_names:
                style_obj, created = MusicStyle.objects.get_or_create(name=style_name)
                song.styles.add(style_obj)
            
            logger.info(f"Створено новий запис пісні ID: {song.id}, Audio ID: {audio_id}")
            
        # Повертаємо дані пісні
        return {
            "id": song.id,
            "audio_id": audio_id,
            "audio_file": song.audio_file,  # Використовуємо поле з БД, воно може бути оновлене
            "photo_file": song.photo_file,  # Використовуємо поле з БД, воно може бути оновлене
            "title": title,
            "model_name": model_name,
            "tags": [s.strip() for s in tags.split(",") if s.strip()],
            "prompt": prompt,
            "duration": duration
        }
    except Exception as e:
        logger.exception(f"Помилка при створенні/оновленні запису пісні: {e}")
    
    return None
# обробники колбеків для різних типів

def process_lyrics_callback(callback_data, task_record):
    """Обробляє колбек для генерації тексту пісні."""
    # Перевіряємо різні формати даних для lyrics
    if "lyricsData" in callback_data:
        lyrics_data = callback_data.get("lyricsData", [])
    elif "data" in callback_data and isinstance(callback_data.get("data"), list):
        lyrics_data = callback_data.get("data", [])
    else:
        lyrics_data = []
    
    logger.info(f"Обробка колбеку для генерації тексту пісні. Знайдено {len(lyrics_data)} варіантів")
    
    # Зберігаємо оригінальні результати у завданні
    update_task_status(task_record, "completed", callback_data)
    
    # Створюємо записи в базі даних для кожного варіанту тексту
    saved_lyrics = []
    for idx, lyric_item in enumerate(lyrics_data):
        try:
            # Визначаємо title і content в залежності від формату даних
            title = lyric_item.get("title", f"Generated Lyrics {idx+1}")
            content = lyric_item.get("lyrics") or lyric_item.get("text", "")
            
            if not content:
                logger.warning(f"Пропущено запис тексту пісні - порожній вміст")
                continue
            
            # Створюємо запис тексту
            lyrics = Lyrics.objects.create(
                user=task_record.user if task_record else None,
                task_id=task_record.task_id if task_record else None,
                title=title,
                content=content,
                is_public=False  # За замовчуванням не публічний
            )
            
            logger.info(f"Створено запис тексту пісні ID: {lyrics.id}")
            saved_lyrics.append({
                "id": lyrics.id,
                "title": lyrics.title
            })
        except Exception as e:
            logger.exception(f"Помилка при створенні запису тексту пісні: {e}")
    
    return Response({"success": True, "lyrics": saved_lyrics}, status=status.HTTP_200_OK)

def process_wav_callback(callback_data, task_record):
    """Обробляє колбек для генерації WAV файлу."""
    logger.info(f"Обробка колбеку для генерації WAV файлу. Дані: {callback_data}")
    
    # Валідація вхідних даних
    if not callback_data:
        logger.error("Отримано порожні дані колбеку для WAV")
        return Response(
            {"error": "Отримано порожні дані колбеку"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Перевірка наявності audio_wav_url з безпечним доступом через get
    audio_wav_url = callback_data.get("audio_wav_url", "")
    if not audio_wav_url:
        logger.warning("Відсутній URL WAV-файлу в колбеку")
    
    task_id = None
    # Пробуємо отримати task_id з різних джерел
    if task_record:
        task_id = task_record.task_id
    elif "task_id" in callback_data:
        task_id = callback_data.get("task_id")
    elif "taskId" in callback_data:
        task_id = callback_data.get("taskId")
    
    if not task_id:
        logger.error("Неможливо визначити task_id для WAV колбеку")
        return Response(
            {"error": "Неможливо визначити task_id"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    logger.info(f"Обробка колбеку для генерації WAV файлу. URL: {audio_wav_url}, Task ID: {task_id}")
    
    # Завантажуємо WAV файл, якщо є URL
    wav_file_path = ""
    if audio_wav_url:
        wav_file_path = download_file(audio_wav_url, "ai/wav", task_id)
    
    # Оновлюємо статус завдання
    if task_record:
        update_task_status(task_record, "completed", {
            "audio_wav_file": wav_file_path,
            "original_callback_data": callback_data
        })
    
    return Response({
        "success": True, 
        "wav_file": wav_file_path,
        "task_id": task_id
    }, status=status.HTTP_200_OK)

def process_audio_text_callback(callback_data, task_record):
    """Обробляє колбек типу "text" для генерації аудіо."""
    # Зберігаємо оригінальні результати у завданні
    update_task_status(task_record, "text_generated", callback_data)
    
    # Екстрактимо ID аудіо з даних колбеку
    audio_ids = []
    tracks_data = []
    if "data" in callback_data and isinstance(callback_data.get("data"), list):
        tracks_data = callback_data.get("data", [])
        
        for track in tracks_data:
            if "id" in track:
                audio_ids.append(track["id"])
    
    # Якщо є задача, зберігаємо аудіо ID для подальшого використання
    if task_record and audio_ids:
        # Переконаємось, що result - це словник
        if not task_record.result or not isinstance(task_record.result, dict):
            task_record.result = {}
        
        # Зберігаємо audio_ids окремо для зручного доступу
        task_record.result["audio_ids"] = audio_ids
        task_record.save()
        
        logger.info(f"Збережено {len(audio_ids)} audio_ids в задачі {task_record.id}: {audio_ids}")
    
    # Створюємо мінімальні записи пісень з доступною інформацією
    songs_list = []
    for track in tracks_data:
        track_id = track.get("id")
        if not track_id:
            continue
            
        # Отримуємо базову інформацію
        title = track.get("title", "Без назви")
        model_name = track.get("model_name", "")
        image_url = track.get("image_url") or track.get("source_image_url", "")
        
        # Завантажуємо тільки фото, оскільки аудіо ще не доступне
        photo_file_path = ""
        task_id = task_record.task_id if task_record else None
        
        if image_url:
            photo_file_path = download_file(image_url, "ai/photo", task_id or track_id)
        
        try:
            # Перевіряємо, чи існує вже пісня з таким audio_id
            existing_song = Song.objects.filter(audio_id=track_id).first()
            
            if existing_song:
                # Якщо пісня існує, оновлюємо її поля
                logger.info(f"Знайдено існуючу пісню ID: {existing_song.id}, Audio ID: {track_id}. Оновлюємо...")
                
                if photo_file_path:
                    existing_song.photo_file = photo_file_path
                    
                # Оновлюємо інші поля, тільки якщо вони мають значення
                if title:
                    existing_song.title = title
                if model_name:
                    existing_song.model_name = model_name
                    
                existing_song.save()
                song = existing_song
                
            else:
                # Створюємо попередній запис пісні з доступними даними
                song = Song.objects.create(
                    user=task_record.user if task_record else None,
                    task_id=task_id,
                    audio_id=track_id,  # Важливо: тут зберігаємо ID з колбеку
                    model_name=model_name,
                    title=title,
                    audio_file="",  # Аудіо буде додане пізніше
                    photo_file=photo_file_path,
                    example=task_record.example if task_record else "",
                    is_public=False
                )
                
                logger.info(f"Створено попередній запис пісні ID: {song.id}, Audio ID: {track_id}")
            
            # Додаємо стилі, якщо є
            tags = track.get("tags", "")
            if tags:
                style_names = [s.strip() for s in tags.split(",") if s.strip()]
                for style_name in style_names:
                    style_obj, created = MusicStyle.objects.get_or_create(name=style_name)
                    song.styles.add(style_obj)
            
            songs_list.append({
                "id": song.id,
                "audio_id": track_id,
                "title": title,
                "model_name": model_name
            })
            
        except Exception as e:
            logger.exception(f"Помилка при створенні/оновленні попереднього запису пісні: {e}")
    
    # В наступних колбеках можна буде оновити ці записи
    if songs_list:
        if task_record:
            task_record.result["songs"] = songs_list
            task_record.save()
    
    return Response({"success": True, "message": "Текст згенеровано", "songs": songs_list}, status=status.HTTP_200_OK)

def process_audio_first_callback(callback_data, task_record):
    """Обробляє колбек типу "first" для генерації аудіо."""
    update_task_status(task_record, "first_audio_generated")
    return Response({"success": True, "message": "Перший аудіотрек згенеровано"}, status=status.HTTP_200_OK)

def process_audio_complete_callback(callback_data, task_record):
    """Обробляє колбек типу "complete" для генерації аудіо."""
    task_id = task_record.task_id if task_record else callback_data.get("task_id")
    logger.info(f"Обробка фінального колбеку для завдання {task_id}")
    
    # Читаємо дані треків
    track_list = callback_data.get("data", [])
    logger.info(f"Отримано дані для {len(track_list)} аудіотреків")
    
    # Обробляємо кожен трек і збираємо результати
    songs_list = [result for result in [process_track(track, task_record, task_id) for track in track_list] if result]
    
    # Оновлюємо запис завдання
    update_task_status(task_record, "completed", {"songs": songs_list})
    
    return Response({ "success": True, "songs": songs_list }, status=status.HTTP_200_OK)

def process_unknown_callback(callback_data, task_record):
    """Обробляє невідомий тип колбеку."""
    callback_type = callback_data.get("callbackType", "unknown")
    logger.warning(f"Отримано невідомий тип колбеку: {callback_type}")
    update_task_status(task_record, "received", callback_data)
    
    return Response(
        {"warning": f"Невідомий тип колбеку: {callback_type}", "data": callback_data}, 
        status=status.HTTP_200_OK
    )

# словники 

# Обробники для аудіо-колбеків за типами
AUDIO_CALLBACK_TYPE_HANDLERS = {
    "text": process_audio_text_callback,
    "first": process_audio_first_callback,
    "complete": process_audio_complete_callback,
    # Для невідомих типів
    None: process_unknown_callback
}

# Функція для обробки аудіо-колбеків з диспетчеризацією за типом
def process_audio_callback(callback_data, task_record):
    """Обробляє колбек для генерації аудіо, розподіляючи за типом колбеку."""
    callback_type = callback_data.get("callbackType")
    handler = AUDIO_CALLBACK_TYPE_HANDLERS.get(callback_type, AUDIO_CALLBACK_TYPE_HANDLERS[None])
    return handler(callback_data, task_record)

# Визначення типу запиту за даними колбеку
def determine_request_type(task_record, callback_data):
    """Визначає тип запиту за структурою даних колбеку."""
    # Спершу спробуємо отримати з бази даних
    request_type = task_record.request_type if task_record else None
    
    # Перевіряємо наявність даних про тексти пісень в колбеку
    if "data" in callback_data and callback_data.get("data") and isinstance(callback_data.get("data"), list):
        for item in callback_data.get("data"):
            if item.get("text") and item.get("title"):
                return "lyrics"
    
    # Перевіряємо конкретний об'єкт lyricsData
    if "lyricsData" in callback_data:
        return "lyrics"
    
    # Перевіряємо наявність WAV URL
    if "audio_wav_url" in callback_data:
        return "wav"
    
    # Якщо тип визначено в базі, використовуємо його
    if request_type in ["audio", "extend", "lyrics", "wav"]:
        return request_type
    
    # За замовчуванням - аудіо
    return "audio"

# Диспетчеризація обробників за типом запиту
REQUEST_TYPE_HANDLERS = {
    "lyrics": process_lyrics_callback,
    "wav": process_wav_callback,
    "audio": process_audio_callback,
    "extend": process_audio_callback,
    # Для невідомих типів
    None: process_unknown_callback
}

# Функція для перевірки успішності колбеку
def validate_callback(data):
    """Перевіряє базову валідність колбеку і повертає результат перевірки."""
    # Перевірка коду
    if data.get("code") != 200:
        error_msg = data.get("msg", "невідома помилка")
        logger.error(f"Колбек містить помилку: {error_msg}")
        return False, Response(
            {"error": f"Колбек містить помилку: {error_msg}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Перевірка наявності даних
    callback_data = data.get("data", {})
    task_id = callback_data.get("task_id") or callback_data.get("taskId")
    
    if not task_id:
        logger.error("task_id відсутній у колбеку")
        return False, Response(
            {"error": "task_id відсутній у колбеку"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return True, callback_data, task_id

@csrf_exempt
@api_view(['POST'])
@permission_classes([])  # Відключаємо перевірку автентифікації для callback
def callback(request):
    """Універсальний callback для обробки всіх типів відповідей від Suno API."""
    try:
        data = request.data
        
        # Логуємо отримані дані
        log_callback_data(data)
        
        # Валідуємо колбек
        validation_result = validate_callback(data)
        if not validation_result[0]:
            return validation_result[1]  # Повертаємо помилку
        
        callback_data, task_id = validation_result[1], validation_result[2]
        
        # Отримуємо запис завдання
        task_record = get_task_record(task_id)
        
        # Визначаємо тип запиту і отримуємо відповідний обробник
        request_type = determine_request_type(task_record, callback_data)
        handler = REQUEST_TYPE_HANDLERS.get(request_type, REQUEST_TYPE_HANDLERS[None])
        
        # Викликаємо обробник і повертаємо відповідь
        return handler(callback_data, task_record)
        
    except Exception as e:
        # Логуємо помилку
        logger.exception(f"Помилка при обробці колбеку: {e}")
        return Response(
            {"error": f"Виникла помилка при обробці колбеку: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_songs(request):
    """
    Ендпоінт для отримання всіх пісень, згенерованих поточним користувачем.
    
    Повертає JSON-список з даними про пісні, включаючи id, назву, модель, 
    шляхи до аудіо та фото файлів, example і список стилів.
    
    Args:
        request: HTTP запит
        
    Returns:
        Response: JSON-відповідь зі списком пісень користувача
    """
    try:
        # Отримуємо пісні поточного користувача
        songs = Song.objects.filter(user=request.user).order_by('-created_at')
        logger.info(f"Запит на отримання пісень користувача {request.user.id}. Знайдено: {songs.count()}")
        
        # Серіалізуємо пісні
        serializer = SongSerializer(songs, many=True)
        
        return Response(
            {"success": True, "songs": serializer.data}, 
            status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.exception(f"Помилка при отриманні списку пісень: {e}")
        return Response(
            {"error": f"Помилка при отриманні списку пісень: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_generate_record(request):
    """
    Ендпоінт для отримання інформації про завдання генерації аудіо.
    
    Повертає деталі завдання, включаючи статус та результати.
    
    Args:
        request: HTTP запит з taskId у параметрах запиту
        
    Returns:
        Response: JSON-відповідь з деталями завдання
    """
    try:
        task_id = request.query_params.get("taskId")
        if not task_id:
            return Response(
                {"error": "Параметр taskId є обов'язковим"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Отримуємо запис завдання для поточного користувача
            task_record = GenerationTask.objects.get(task_id=task_id, user=request.user)
            logger.info(f"Запит на отримання інформації про завдання {task_record.id}")
            
            # Якщо завдання було успішно завершено, отримуємо згенеровані пісні
            songs = []
            if task_record.status == "completed" and task_record.request_type in ["audio", "extend"]:
                songs = Song.objects.filter(task_id=task_id, user=request.user)
                songs_serializer = SongSerializer(songs, many=True)
                songs = songs_serializer.data
                logger.info(f"Для завдання {task_record.id} знайдено {len(songs)} пісень")
            
            # Серіалізуємо завдання
            task_serializer = GenerationTaskSerializer(task_record)
            
            return Response({
                "success": True,
                "task": task_serializer.data,
                "songs": songs
            }, status=status.HTTP_200_OK)
            
        except GenerationTask.DoesNotExist:
            logger.warning(f"Завдання з task_id={task_id} не знайдено для користувача {request.user.id}")
            return Response(
                {"error": "Завдання не знайдено"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        logger.exception(f"Помилка при отриманні інформації про завдання: {e}")
        return Response(
            {"error": f"Помилка при отриманні інформації про завдання: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_credit(request):
    """
    Ендпоінт для перевірки залишку кредитів користувача.
    
    Повертає кількість доступних кредитів для користувача.
    
    Args:
        request: HTTP запит
        
    Returns:
        Response: JSON-відповідь з кількістю кредитів
    """
    try:
        # Отримуємо кредити користувача через запит до Suno API
        logger.info(f"Запит на отримання кредитів для користувача {request.user.id}")
        resp = requests.get(f"{SUNO_BASE_URL}/api/v1/generate/credit", headers=HEADERS)
        response_data = resp.json()
        
        if resp.status_code == 200:
            credits = response_data.get("data", 0)
            logger.info(f"Отримано кредитів: {credits}")
            return Response(
                {"success": True, "credits": credits}, 
                status=status.HTTP_200_OK
            )
        
        logger.error(f"Помилка при отриманні кредитів: {response_data}")    
        return Response(
            {"error": response_data.get("msg", "Невідома помилка")}, 
            status=resp.status_code
        )
            
    except Exception as e:
        logger.exception(f"Помилка при отриманні кредитів: {e}")
        return Response(
            {"error": f"Помилка при отриманні кредитів: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lyrics_record(request):
    """
    Ендпоінт для отримання інформації про завдання генерації текстів.
    
    Повертає деталі завдання, включаючи статус та результати.
    
    Args:
        request: HTTP запит з taskId у параметрах запиту
        
    Returns:
        Response: JSON-відповідь з деталями завдання
    """
    try:
        task_id = request.query_params.get("taskId")
        if not task_id:
            return Response(
                {"error": "Параметр taskId є обов'язковим"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Отримуємо запис завдання для поточного користувача
            task_record = GenerationTask.objects.get(task_id=task_id, user=request.user)
            logger.info(f"Запит на отримання інформації про завдання lyrics {task_record.id}")
            
            # Серіалізуємо завдання
            task_serializer = GenerationTaskSerializer(task_record)
            
            return Response({
                "success": True,
                "task": task_serializer.data
            }, status=status.HTTP_200_OK)
            
        except GenerationTask.DoesNotExist:
            logger.warning(f"Завдання lyrics з task_id={task_id} не знайдено для користувача {request.user.id}")
            return Response(
                {"error": "Завдання не знайдено"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        logger.exception(f"Помилка при отриманні інформації про завдання lyrics: {e}")
        return Response(
            {"error": f"Помилка при отриманні інформації про завдання: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wav_record(request):
    """
    Ендпоінт для отримання інформації про завдання генерації WAV.
    
    Повертає деталі завдання, включаючи статус та результати.
    
    Args:
        request: HTTP запит з taskId у параметрах запиту
        
    Returns:
        Response: JSON-відповідь з деталями завдання
    """
    try:
        task_id = request.query_params.get("taskId")
        if not task_id:
            return Response(
                {"error": "Параметр taskId є обов'язковим"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Отримуємо запис завдання для поточного користувача
            task_record = GenerationTask.objects.get(task_id=task_id, user=request.user)
            logger.info(f"Запит на отримання інформації про завдання WAV {task_record.id}")
            
            # Серіалізуємо завдання
            task_serializer = GenerationTaskSerializer(task_record)
            
            return Response({
                "success": True,
                "task": task_serializer.data
            }, status=status.HTTP_200_OK)
            
        except GenerationTask.DoesNotExist:
            logger.warning(f"Завдання WAV з task_id={task_id} не знайдено для користувача {request.user.id}")
            return Response(
                {"error": "Завдання не знайдено"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    except Exception as e:
        logger.exception(f"Помилка при отриманні інформації про завдання WAV: {e}")
        return Response(
            {"error": f"Помилка при отриманні інформації про завдання: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_song_visibility(request, song_id):
    """
    Ендпоінт для оновлення видимості пісні (публічна/приватна).
    
    Args:
        request: HTTP запит з is_public у тілі запиту
        song_id: ID пісні для оновлення
        
    Returns:
        Response: JSON-відповідь зі статусом оновлення
    """
    try:
        try:
            # Отримуємо пісню поточного користувача
            song = Song.objects.get(id=song_id, user=request.user)
            logger.info(f"Запит на зміну видимості пісні {song.id} користувачем {request.user.id}")
        except Song.DoesNotExist:
            logger.warning(f"Пісня {song_id} не знайдена для користувача {request.user.id}")
            return Response(
                {"error": "Пісня не знайдена"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Перевіряємо параметр is_public
        is_public = request.data.get("is_public")
        if is_public is None:
            return Response(
                {"error": "Параметр is_public є обов'язковим"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Оновлюємо видимість пісні
        song.is_public = is_public
        song.save()
        logger.info(f"Оновлено видимість пісні {song.id} на {is_public}")
        
        return Response({
            "success": True, 
            "message": "Статус пісні оновлено", 
            "is_public": song.is_public
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.exception(f"Помилка при оновленні видимості пісні: {e}")
        return Response(
            {"error": f"Помилка при оновленні видимості пісні: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def list_public_songs(request):
    """
    Ендпоінт для отримання публічних пісень з пагінацією.
    
    Повертає JSON-список з даними про публічні пісні та інформацією
    про пагінацію (всього записів, поточна сторінка, розмір сторінки).
    
    Args:
        request: HTTP запит з параметрами page і page_size
        
    Returns:
        Response: JSON-відповідь зі списком публічних пісень та інформацією про пагінацію
    """
    try:
        # Отримуємо параметри пагінації
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        
        # Валідація параметрів
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 50
        
        # Обчислюємо offset для пагінації
        offset = (page - 1) * page_size
        
        # Отримуємо всі публічні пісні, сортовані за датою створення (від найновіших)
        # Застосовуємо ліміт і оффсет для пагінації
        songs = Song.objects.filter(is_public=True).order_by('-created_at')[offset:offset+page_size]
        
        # Отримуємо загальну кількість публічних пісень
        total_songs = Song.objects.filter(is_public=True).count()
        
        # Обчислюємо загальну кількість сторінок
        total_pages = (total_songs + page_size - 1) // page_size if total_songs > 0 else 1
        
        logger.info(f"Запит на отримання списку публічних пісень. Сторінка {page}, розмір {page_size}. Знайдено: {songs.count()}")
        
        # Серіалізуємо пісні
        serializer = SongSerializer(songs, many=True)
        
        return Response({
            "success": True, 
            "songs": serializer.data,
            "pagination": {
                "total": total_songs,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception(f"Помилка при отриманні списку публічних пісень: {e}")
        return Response(
            {"error": f"Помилка при отриманні списку публічних пісень: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_lyrics(request):
    """
    Ендпоінт для отримання всіх текстів пісень, створених поточним користувачем.
    
    Повертає JSON-список з даними про тексти.
    
    Args:
        request: HTTP запит
        
    Returns:
        Response: JSON-відповідь зі списком текстів пісень користувача
    """
    try:
        # Отримуємо тексти пісень поточного користувача
        lyrics = Lyrics.objects.filter(user=request.user).order_by('-created_at')
        logger.info(f"Запит на отримання текстів пісень користувача {request.user.id}. Знайдено: {lyrics.count()}")
        
        # Серіалізуємо тексти
        serializer = LyricsSerializer(lyrics, many=True)
        
        return Response(
            {"success": True, "lyrics": serializer.data}, 
            status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.exception(f"Помилка при отриманні списку текстів пісень: {e}")
        return Response(
            {"error": f"Помилка при отриманні списку текстів пісень: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_lyrics(request, lyrics_id):
    """
    Ендпоінт для отримання тексту пісні за id.
    
    Повертає деталі тексту, включаючи зміст. Доступний для публічних текстів
    або для автора тексту.
    
    Args:
        request: HTTP запит
        lyrics_id: ID тексту пісні
        
    Returns:
        Response: JSON-відповідь з деталями тексту пісні
    """
    try:
        try:
            # Спершу шукаємо текст пісні
            lyrics = Lyrics.objects.get(id=lyrics_id)
            
            # Перевіряємо доступ: або текст публічний, або це власник
            if not lyrics.is_public and (not request.user.is_authenticated or lyrics.user != request.user):
                logger.warning(f"Спроба доступу до приватного тексту пісні {lyrics_id}")
                return Response(
                    {"error": "У вас немає доступу до цього тексту пісні"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Серіалізуємо текст
            serializer = LyricsSerializer(lyrics)
            
            return Response(
                {"success": True, "lyrics": serializer.data}, 
                status=status.HTTP_200_OK
            )
            
        except Lyrics.DoesNotExist:
            logger.warning(f"Текст пісні з id={lyrics_id} не знайдено")
            return Response(
                {"error": "Текст пісні не знайдено"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        logger.exception(f"Помилка при отриманні тексту пісні: {e}")
        return Response(
            {"error": f"Помилка при отриманні тексту пісні: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_lyrics_visibility(request, lyrics_id):
    """
    Ендпоінт для оновлення видимості тексту пісні (публічний/приватний).
    
    Args:
        request: HTTP запит з is_public у тілі запиту
        lyrics_id: ID тексту пісні для оновлення
        
    Returns:
        Response: JSON-відповідь зі статусом оновлення
    """
    try:
        try:
            # Отримуємо текст пісні поточного користувача
            lyrics = Lyrics.objects.get(id=lyrics_id, user=request.user)
            logger.info(f"Запит на зміну видимості тексту пісні {lyrics.id} користувачем {request.user.id}")
        except Lyrics.DoesNotExist:
            logger.warning(f"Текст пісні {lyrics_id} не знайдений для користувача {request.user.id}")
            return Response(
                {"error": "Текст пісні не знайдено"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Перевіряємо параметр is_public
        is_public = request.data.get("is_public")
        if is_public is None:
            return Response(
                {"error": "Параметр is_public є обов'язковим"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Оновлюємо видимість тексту пісні
        lyrics.is_public = is_public
        lyrics.save()
        logger.info(f"Оновлено видимість тексту пісні {lyrics.id} на {is_public}")
        
        return Response({
            "success": True, 
            "message": "Статус тексту пісні оновлено", 
            "is_public": lyrics.is_public
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.exception(f"Помилка при оновленні видимості тексту пісні: {e}")
        return Response(
            {"error": f"Помилка при оновленні видимості тексту пісні: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def associate_lyrics_with_song(request):
    """
    Ендпоінт для прив'язки тексту пісні до пісні.
    
    Args:
        request: HTTP запит з lyrics_id та song_id у тілі запиту
        
    Returns:
        Response: JSON-відповідь зі статусом оновлення
    """
    try:
        # Перевіряємо параметри
        lyrics_id = request.data.get("lyrics_id")
        song_id = request.data.get("song_id")
        
        if not lyrics_id or not song_id:
            return Response(
                {"error": "Параметри lyrics_id та song_id є обов'язковими"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Отримуємо текст пісні та пісню
        try:
            lyrics = Lyrics.objects.get(id=lyrics_id, user=request.user)
        except Lyrics.DoesNotExist:
            return Response(
                {"error": "Текст пісні не знайдено"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        try:
            song = Song.objects.get(id=song_id, user=request.user)
        except Song.DoesNotExist:
            return Response(
                {"error": "Пісню не знайдено"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Прив'язуємо текст до пісні
        lyrics.song = song
        lyrics.save()
        logger.info(f"Текст пісні {lyrics.id} прив'язано до пісні {song.id}")
        
        return Response({
            "success": True, 
            "message": "Текст пісні успішно прив'язано до пісні"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.exception(f"Помилка при прив'язці тексту пісні: {e}")
        return Response(
            {"error": f"Помилка при прив'язці тексту пісні: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def list_public_lyrics(request):
    """
    Ендпоінт для отримання публічних текстів пісень з пагінацією.
    
    Повертає JSON-список з даними про публічні тексти та інформацією
    про пагінацію (всього записів, поточна сторінка, розмір сторінки).
    
    Args:
        request: HTTP запит з параметрами page і page_size
        
    Returns:
        Response: JSON-відповідь зі списком публічних текстів пісень та інформацією про пагінацію
    """
    try:
        # Отримуємо параметри пагінації
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        
        # Валідація параметрів
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 50
        
        # Обчислюємо offset для пагінації
        offset = (page - 1) * page_size
        
        # Отримуємо всі публічні тексти, сортовані за датою створення (від найновіших)
        # Застосовуємо ліміт і оффсет для пагінації
        lyrics = Lyrics.objects.filter(is_public=True).order_by('-created_at')[offset:offset+page_size]
        
        # Отримуємо загальну кількість публічних текстів
        total_lyrics = Lyrics.objects.filter(is_public=True).count()
        
        # Обчислюємо загальну кількість сторінок
        total_pages = (total_lyrics + page_size - 1) // page_size if total_lyrics > 0 else 1
        
        logger.info(f"Запит на отримання списку публічних текстів пісень. Сторінка {page}, розмір {page_size}. Знайдено: {lyrics.count()}")
        
        # Серіалізуємо тексти
        serializer = LyricsSerializer(lyrics, many=True)
        
        return Response({
            "success": True, 
            "lyrics": serializer.data,
            "pagination": {
                "total": total_lyrics,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception(f"Помилка при отриманні списку публічних текстів пісень: {e}")
        return Response(
            {"error": f"Помилка при отриманні списку публічних текстів пісень: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )