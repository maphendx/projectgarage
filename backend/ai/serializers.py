# ai/serializers.py

from rest_framework import serializers
from .models import Recommendation, TrainingData
from users.serializers import UserProfileSerializer

class RecommendationSerializer(serializers.ModelSerializer):
    recommended_user = UserProfileSerializer()

    class Meta:
        model = Recommendation
        fields = ['recommended_user', 'score']

class TrainingDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingData
        fields = ['data', 'labels']