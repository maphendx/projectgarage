from rest_framework import serializers
from .models import MusicFile

class MusicFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MusicFile
        fields = ['id', 'file', 'uploaded_at', 'processed', 'result_data']
