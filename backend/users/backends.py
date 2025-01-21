from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
<<<<<<< HEAD
import nltk
from nltk.metrics import jaccard_distance
from django.db.models import Q
from users.models import CustomUser
=======
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f

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
<<<<<<< HEAD



=======
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
