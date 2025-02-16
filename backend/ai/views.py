import json
import os
import uuid
import requests
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from .models import Song, MusicStyle

# Імпортуємо необхідні модулі DRF
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Для home view – якщо хочемо обмежити доступ лише для зареєстрованих користувачів
from django.contrib.auth.decorators import login_required

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
    """
    try:
        response = requests.get(url)
        if response.status_code == 200:
            ext = os.path.splitext(url)[1] or ''
            filename = f"{prefix}_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(folder, filename)
            # Зберігаємо через систему сховища Django
            saved_path = default_storage.save(file_path, ContentFile(response.content))
            return saved_path
    except Exception as e:
        print("Помилка при завантаженні файлу:", e)
    return ""

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_audio(request):  # Відправка запиту на генерацію аудіо
    payload = request.data  # DRF автоматично розбирає JSON
    resp = requests.post(f"{SUNO_BASE_URL}/api/v1/generate", json=payload, headers=HEADERS)
    return Response(resp.json(), status=resp.status_code)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extend_audio(request):  # Відправка запиту на розширення аудіо
    """
    Відправляє запит на розширення аудіо на Suno API, використовуючи передані дані.
    :param request: запит з даними для розширення (audioId, prompt, style, title, continueAt)
    :return: відповідь Suno API
    """
    payload = request.data
    resp = requests.post(f"{SUNO_BASE_URL}/api/v1/generate/extend", json=payload, headers=HEADERS)
    return Response(resp.json(), status=resp.status_code)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_generate_record(request):  # Отримання інформації про запис
    task_id = request.query_params.get('taskId')
    if not task_id:
        return Response({"msg": "Параметр taskId є обов'язковим"}, status=400)
    params = {"taskId": task_id}
    resp = requests.get(f"{SUNO_BASE_URL}/api/v1/generate/record-info", params=params, headers=HEADERS)
    return Response(resp.json(), status=resp.status_code)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_credit(request):
    resp = requests.get(f"{SUNO_BASE_URL}/api/v1/generate/credit", headers=HEADERS)
    return Response(resp.json(), status=resp.status_code)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_lyrics(request):   # Відправка запиту на генерацію тексту
    payload = request.data
    resp = requests.post(f"{SUNO_BASE_URL}/api/v1/lyrics", json=payload, headers=HEADERS)
    return Response(resp.json(), status=resp.status_code)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lyrics_record(request):
    task_id = request.query_params.get('taskId')
    if not task_id:
        return Response({"msg": "Параметр taskId є обов'язковим"}, status=400)
    params = {"taskId": task_id}
    resp = requests.get(f"{SUNO_BASE_URL}/api/v1/lyrics/record-info", params=params, headers=HEADERS)
    return Response(resp.json(), status=resp.status_code)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_wav(request):    # Відправка запиту на генерацію WAV
    payload = request.data
    resp = requests.post(f"{SUNO_BASE_URL}/api/v1/wav/generate", json=payload, headers=HEADERS)
    return Response(resp.json(), status=resp.status_code)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wav_record(request):
    task_id = request.query_params.get('taskId')
    if not task_id:
        return Response({"msg": "Параметр taskId є обов'язковим"}, status=400)
    params = {"taskId": task_id}
    resp = requests.get(f"{SUNO_BASE_URL}/api/v1/wav/record-info", params=params, headers=HEADERS)
    return Response(resp.json(), status=resp.status_code)

# Callback-запит від Suno API – залишаємо відкритим, бо його викликає зовнішній сервіс
@csrf_exempt
@api_view(['POST'])
@permission_classes([])  # Відключаємо перевірку автентифікації для callback
def callback(request):    # Обробка callback від Suno API
    try:
        data = request.data
    except Exception:
        return Response({"msg": "Невірний формат JSON"}, status=400)

    # Запис отриманих даних у файл для логування
    with open("callback_log.json", "a", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=4) + "\n")

    # Обробка callback даних: якщо код успіху 200, оброблюємо отримані треки
    if data.get("code") == 200:
        callback_data = data.get("data", {})
        task_id = callback_data.get("task_id") or callback_data.get("taskId")
        track_list = callback_data.get("data", [])
        for track in track_list:
            audio_url = track.get("audio_url")
            image_url = track.get("image_url")
            title = track.get("title")
            model_name = track.get("model_name")
            tags = track.get("tags", "")
            # Завантаження аудіо та фото
            audio_file_path = download_file(audio_url, "ai/music", task_id)
            photo_file_path = download_file(image_url, "ai/photo", task_id)
            # Обробка стилів (розділяємо по комі)
            style_names = [s.strip() for s in tags.split(",") if s.strip()]
            song = Song.objects.create(
                task_id=task_id,
                model_name=model_name,
                title=title,
                audio_file=audio_file_path,
                photo_file=photo_file_path
            )
            for style_name in style_names:
                style_obj, _ = MusicStyle.objects.get_or_create(name=style_name)
                song.styles.add(style_obj)
    return Response({"msg": "Callback отримано успішно"}, status=200)

# Якщо потрібен доступ до домашньої сторінки лише для автентифікованих користувачів
@login_required
def home(request):
    return render(request, 'index.html')
