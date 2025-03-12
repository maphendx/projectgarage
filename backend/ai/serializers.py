from rest_framework import serializers
from .models import MusicStyle, GenerationTask, Song, Lyrics

class MusicStyleSerializer(serializers.ModelSerializer):
    """
    Серіалізатор для моделі MusicStyle.
    Дозволяє конвертувати об'єкти MusicStyle у JSON і навпаки.
    """
    class Meta:
        model = MusicStyle
        fields = ['id', 'name']

class GenerationTaskSerializer(serializers.ModelSerializer):
    """
    Серіалізатор для моделі GenerationTask.
    Дозволяє конвертувати об'єкти GenerationTask у JSON і навпаки.
    """
    class Meta:
        model = GenerationTask
        fields = ['id', 'task_id', 'request_type', 'example', 'status', 'result', 'created_at']
        read_only_fields = ['id', 'task_id', 'status', 'result', 'created_at']

class LyricsSerializer(serializers.ModelSerializer):
    """
    Серіалізатор для моделі Lyrics.
    Дозволяє конвертувати об'єкти Lyrics у JSON і навпаки.
    """
    class Meta:
        model = Lyrics
        fields = ['id', 'task_id', 'title', 'content', 'created_at', 'is_public', 'song']
        read_only_fields = ['id', 'task_id', 'created_at']

class SongSerializer(serializers.ModelSerializer):
    """
    Серіалізатор для моделі Song.
    Включає вкладений серіалізатор для поля styles.
    """
    styles = MusicStyleSerializer(many=True, read_only=True)
    lyrics = LyricsSerializer(read_only=True)
    
    class Meta:
        model = Song
        fields = ['id', 'task_id', 'model_name', 'title', 'audio_file', 'photo_file', 'example', 'styles', 'created_at', 'is_public', 'lyrics']
        read_only_fields = ['id', 'task_id', 'created_at']