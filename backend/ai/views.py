# ai/views.py

import json
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Recommendation, TrainingData
from .serializers import RecommendationSerializer, TrainingDataSerializer
from users.models import CustomUser
from django.utils import timezone
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from .recommendation_model import RecommendationModel

class RecommendationListView(generics.ListAPIView):
    serializer_class = RecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Recommendation.objects.filter(user=user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        user = request.user
        recommendations = self.generate_recommendations(user)
        serializer = self.get_serializer(recommendations, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def generate_recommendations(self, user):
        # Отримати дані для тренування
        training_data = TrainingData.objects.filter(user=user).last()
        if not training_data:
            return []

        data = json.loads(training_data.data)
        labels = json.loads(training_data.labels)

        # Тренувати модель
        model = RecommendationModel()
        model.train(data, labels)

        # Генерувати рекомендації
        user_data = np.array(data[-1]).reshape(1, -1)
        predictions = model.predict(user_data)

        # Створити рекомендації
        recommendations = []
        for score in predictions:
            recommended_user = CustomUser.objects.order_by('?').first()  # Випадковий користувач для прикладу
            recommendations.append(Recommendation(user=user, recommended_user=recommended_user, score=score))

        # Зберегти рекомендації
        Recommendation.objects.bulk_create(recommendations, ignore_conflicts=True)

        return recommendations

class TrainingDataView(generics.CreateAPIView):
    serializer_class = TrainingDataSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RecommendationView(generics.ListAPIView):
    serializer_class = RecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Повертає список рекомендацій для поточного користувача.
        """
        user = self.request.user
        return Recommendation.objects.filter(user=user).select_related('recommended_user')

    def list(self, request, *args, **kwargs):
        """
        Обробляє GET-запит для отримання списку рекомендацій.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)