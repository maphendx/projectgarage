import json
import os
import uuid
import requests
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from .models import Song, MusicStyle, GenerationTask

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
def generate_audio(request):
    """
    Ендпоінт для створення завдання генерації аудіо.
    Записує id користувача та example (якщо передано), створює запис GenerationTask,
    пересилає запит до Suno API та оновлює task_id після отримання відповіді.
    """
    payload = request.data
    example = payload.get("example", "")
    # Зберігаємо дані запиту із id користувача і example
    task_record = GenerationTask.objects.create(user=request.user, request_type="audio", example=example, status="pending")
    resp = requests.post(f"{SUNO_BASE_URL}/api/v1/generate", json=payload, headers=HEADERS)
    response_data = resp.json()
    # Оновлюємо запис завдання, якщо отримано taskId
    if resp.status_code == 200:
        task_id = response_data.get("data", {}).get("taskId")
        if task_id:
            task_record.task_id = task_id
            task_record.save()
    return Response(response_data, status=resp.status_code)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extend_audio(request):
    """
    Ендпоінт для розширення аудіо.
    Записує id користувача та example, створює запис GenerationTask типу extend,
    пересилає запит до Suno API та оновлює task_id після отримання відповіді.
    """
    payload = request.data
    example = payload.get("example", "")
    task_record = GenerationTask.objects.create(user=request.user, request_type="extend", example=example, status="pending")
    resp = requests.post(f"{SUNO_BASE_URL}/api/v1/generate/extend", json=payload, headers=HEADERS)
    response_data = resp.json()
    if resp.status_code == 200:
        task_id = response_data.get("data", {}).get("taskId")
        if task_id:
            task_record.task_id = task_id
            task_record.save()
    return Response(response_data, status=resp.status_code)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_lyrics(request):
    """
    Ендпоінт для генерації тексту (lyrics).
    Записує id користувача та example, створює запис GenerationTask типу lyrics,
    пересилає запит до Suno API та оновлює task_id після отримання відповіді.
    """
    payload = request.data
    example = payload.get("example", "")
    task_record = GenerationTask.objects.create(user=request.user, request_type="lyrics", example=example, status="pending")
    resp = requests.post(f"{SUNO_BASE_URL}/api/v1/lyrics", json=payload, headers=HEADERS)
    response_data = resp.json()
    if resp.status_code == 200:
        task_id = response_data.get("data", {}).get("taskId")
        if task_id:
            task_record.task_id = task_id
            task_record.save()
    return Response(response_data, status=resp.status_code)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_wav(request):
    """
    Ендпоінт для генерації аудіо у WAV форматі.
    Записує id користувача та example, створює запис GenerationTask типу wav,
    пересилає запит до Suno API та оновлює task_id після отримання відповіді.
    """
    payload = request.data
    example = payload.get("example", "")
    task_record = GenerationTask.objects.create(user=request.user, request_type="wav", example=example, status="pending")
    resp = requests.post(f"{SUNO_BASE_URL}/api/v1/wav/generate", json=payload, headers=HEADERS)
    response_data = resp.json()
    if resp.status_code == 200:
        task_id = response_data.get("data", {}).get("taskId")
        if task_id:
            task_record.task_id = task_id
            task_record.save()
    return Response(response_data, status=resp.status_code)

@csrf_exempt
@api_view(['POST'])
@permission_classes([])  # Відключаємо перевірку автентифікації для callback
def callback(request):
    """
    Загальний callback для обробки відповідей від Suno API.
    Залежно від типу завдання (audio/extend, lyrics, wav):
    - Для аудіо (audio/extend) завантажуються аудіо та зображення, створюється запис Song.
    - Для lyrics оновлюється запис GenerationTask з отриманими текстовими даними.
    - Для wav завантажується WAV файл та оновлюється GenerationTask.
    """
    try:
        data = request.data
    except Exception:
        return Response({"msg": "Невірний формат JSON"}, status=400)

    # Запис логів callback
    with open("callback_log.json", "a", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=4) + "\n")

    if data.get("code") != 200:
        return Response({"msg": "Callback з помилкою"}, status=400)

    callback_data = data.get("data", {})
    task_id = callback_data.get("task_id") or callback_data.get("taskId")
    if not task_id:
        return Response({"msg": "task_id відсутній"}, status=400)

    # Спроба отримати запис завдання
    try:
        task_record = GenerationTask.objects.get(task_id=task_id)
    except GenerationTask.DoesNotExist:
        task_record = None

    songs_list = []

    # Обробка callback залежно від структури даних
    if "lyricsData" in callback_data:
        # Callback для генерації тексту (lyrics)
        lyrics_data = callback_data.get("lyricsData", [])
        if task_record:
            task_record.status = "completed"
            task_record.result = {"lyricsData": lyrics_data}
            task_record.save()
        # Можна повернути дані або повідомлення про успішну генерацію
    elif "audio_wav_url" in callback_data:
        # Callback для генерації WAV файлу
        audio_wav_url = callback_data.get("audio_wav_url")
        wav_file_path = download_file(audio_wav_url, "ai/wav", task_id)
        if task_record:
            task_record.status = "completed"
            task_record.result = {"audio_wav_file": wav_file_path}
            task_record.save()
    else:
        # Callback для аудіо генерації (як для generate_audio, так і extend_audio)
        track_list = callback_data.get("data", [])
        for track in track_list:
            audio_url = track.get("audio_url")
            image_url = track.get("image_url")
            title = track.get("title")
            model_name = track.get("model_name")
            tags = track.get("tags", "")
            audio_file_path = download_file(audio_url, "ai/music", task_id)
            photo_file_path = download_file(image_url, "ai/photo", task_id)
            style_names = [s.strip() for s in tags.split(",") if s.strip()]
            
            # Створення запису Song із прив'язкою до користувача (якщо є)
            song = Song.objects.create(
                user=task_record.user if task_record else None,  # Прив'язка до користувача
                task_id=task_id,
                model_name=model_name,
                title=title,
                audio_file=audio_file_path,
                photo_file=photo_file_path,
                example=task_record.example if task_record else "",
                is_public=False  # Встановлюємо за замовчуванням на приватну
            )
            for style_name in style_names:
                style_obj, _ = MusicStyle.objects.get_or_create(name=style_name)
                song.styles.add(style_obj)
            
            songs_list.append({
                "audio_file": audio_file_path,
                "photo_file": photo_file_path,
                "tags": style_names,
                "model_name": model_name,
                "title": title
            })
        if task_record:
            task_record.status = "completed"
            task_record.result = {"songs": songs_list}
            task_record.save()
    return Response({"songs": songs_list}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_songs(request):
    """
    Ендпоінт для отримання всіх пісень, згенерованих поточним користувачем.
    Повертає JSON-список з даними про пісні, включаючи id, назву, модель, шляхи до аудіо та фото файлів,
    example і список стилів.
    """
    songs = Song.objects.filter(user=request.user)
    songs_list = []
    for song in songs:
        songs_list.append({
            "id": song.id,
            "title": song.title,
            "model_name": song.model_name,
            "audio_file": song.audio_file,
            "photo_file": song.photo_file,
            "example": song.example,
            "styles": [style.name for style in song.styles.all()],
            "created_at": song.created_at
        })
    return Response({"songs": songs_list}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_generate_record(request):
    """
    Ендпоінт для отримання інформації про завдання генерації аудіо.
    Повертає деталі завдання, включаючи статус та результати.
    """
    task_id = request.query_params.get("taskId")
    if not task_id:
        return Response({"msg": "taskId є обов'язковим"}, status=400)

    try:
        task_record = GenerationTask.objects.get(task_id=task_id, user=request.user)
        return Response({
            "taskId": task_record.task_id,
            "status": task_record.status,
            "result": task_record.result,
            "example": task_record.example,
            "created_at": task_record.created_at
        }, status=200)
    except GenerationTask.DoesNotExist:
        return Response({"msg": "Завдання не знайдено"}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_credit(request):
    """
    Ендпоінт для перевірки кількості залишкових кредитів.
    Повертає кількість кредитів, доступних для користувача.
    """
    # Припустимо, що у вас є модель User з полем credits
    credits = request.user.credits  # або інший спосіб отримання кредитів
    return Response({"credits": credits}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lyrics_record(request):
    """
    Ендпоінт для отримання інформації про завдання генерації текстів.
    Повертає деталі завдання, включаючи статус та результати.
    """
    task_id = request.query_params.get("taskId")
    if not task_id:
        return Response({"msg": "taskId є обов'язковим"}, status=400)

    try:
        task_record = GenerationTask.objects.get(task_id=task_id, user=request.user)
        return Response({
            "taskId": task_record.task_id,
            "status": task_record.status,
            "result": task_record.result,
            "example": task_record.example,
            "created_at": task_record.created_at
        }, status=200)
    except GenerationTask.DoesNotExist:
        return Response({"msg": "Завдання не знайдено"}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wav_record(request):
    """
    Ендпоінт для отримання інформації про завдання генерації WAV.
    Повертає деталі завдання, включаючи статус та результати.
    """
    task_id = request.query_params.get("taskId")
    if not task_id:
        return Response({"msg": "taskId є обов'язковим"}, status=400)

    try:
        task_record = GenerationTask.objects.get(task_id=task_id, user=request.user)
        return Response({
            "taskId": task_record.task_id,
            "status": task_record.status,
            "result": task_record.result,
            "example": task_record.example,
            "created_at": task_record.created_at
        }, status=200)
    except GenerationTask.DoesNotExist:
        return Response({"msg": "Завдання не знайдено"}, status=404)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_song_visibility(request, song_id):
    """
    Ендпоінт для оновлення видимості пісні (публічна/приватна).
    """
    try:
        song = Song.objects.get(id=song_id, user=request.user)
    except Song.DoesNotExist:
        return Response({"msg": "Пісня не знайдена"}, status=404)

    is_public = request.data.get("is_public")
    if is_public is not None:
        song.is_public = is_public
        song.save()
        return Response({"msg": "Статус пісні оновлено", "is_public": song.is_public}, status=200)
    
    return Response({"msg": "Необхідно вказати is_public"}, status=400)

@api_view(['GET'])
def list_public_songs(request):
    """
    Ендпоінт для отримання всіх публічних пісень, згенерованих усіма користувачами.
    Повертає JSON-список з даними про пісні, включаючи id, назву, модель, шляхи до аудіо та фото файлів,
    example і список стилів.
    """
    songs = Song.objects.filter(is_public=True).order_by('?')  # Вибірка публічних пісень у випадковому порядку
    songs_list = []
    for song in songs:
        songs_list.append({
            "id": song.id,
            "title": song.title,
            "model_name": song.model_name,
            "audio_file": song.audio_file,
            "photo_file": song.photo_file,
            "example": song.example,
            "styles": [style.name for style in song.styles.all()],
            "created_at": song.created_at
        })
    return Response({"songs": songs_list}, status=200)