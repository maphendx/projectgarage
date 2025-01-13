from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
import nltk
from nltk.metrics import jaccard_distance
from django.db.models import Q
from users.models import CustomUser

User = get_user_model()

class EmailBackend(BaseBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None

        if user.check_password(password):
            return user
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None


class RecommendationService:
    @staticmethod
    def recommend_users(current_user, threshold=0.6):
        recommended_users = []

        # 1. Схожість хештегів
        current_user_tags = set(tag.name for tag in current_user.hashtags.all())
        for user in CustomUser.objects.exclude(id=current_user.id):
            user_tags = set(tag.name for tag in user.hashtags.all())
            if len(user_tags) == 0:
                continue
            similarity = 1 - jaccard_distance(current_user_tags, user_tags)
            if similarity >= threshold:
                recommended_users.append(user)

        # 2. Активність
        recommended_users.extend(
            CustomUser.objects.filter(total_likes__gte=current_user.total_likes).exclude(id=current_user.id)
        )

        # 3. Взаємний пошук
        recommended_users.extend(
            CustomUser.objects.filter(
                subscriptions__in=current_user.subscriptions.all(),
                subscribers__in=current_user.subscribers.all()
            ).exclude(id=current_user.id)
        )

        # 4. Географічний принцип
        recommended_users.extend(
            CustomUser.objects.filter(
                Q(location__icontains=current_user.location)
            ).exclude(id=current_user.id)
        )

        # Видалення дублікатів
        recommended_users = list(set(recommended_users))
        return recommended_users
