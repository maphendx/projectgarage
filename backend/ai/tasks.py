# ai/tasks.py

from celery import shared_task
import numpy as np
from .models import Recommendation, TrainingData
from users.models import CustomUser
from .recommendation_model import RecommendationModel
import json


@shared_task
def generate_recommendations_periodically():
    users = CustomUser.objects.all()
    for user in users:
        # Отримати дані для тренування
        training_data = TrainingData.objects.filter(user=user).last()
        if not training_data:
            continue

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