import logging
from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import CustomUser
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer, SubscribeSerializer, GoogleAuthResponseSerializer
from nltk.metrics import jaccard_distance
from django.db.models import Q
from users.models import CustomUser
from posts.models import Post
from posts.serializers import PostSerializer
from rest_framework_simplejwt.tokens import RefreshToken  
import random  
import string  
import requests  
from django.conf import settings  
from django.db import transaction
from django.contrib.auth.models import BaseUserManager 
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict
import json
import os


# Реєстрація користувача
class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

# Вхід користувача
class UserLoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data['email'])
            except CustomUser.DoesNotExist:
                return Response({"message": "Користувача не знайдено!"}, status=status.HTTP_400_BAD_REQUEST)

            if user.check_password(serializer.validated_data['password']):
                # Генеруємо JWT токени для користувача
                tokens = get_tokens_for_user(user)
                return Response({
                    "message": "Успішний вхід!",
                    "tokens": tokens,
                    "display_name": user.display_name
                }, status=status.HTTP_200_OK)
            else:
                return Response({"message": "Невірний пароль!"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Профіль користувача
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]  # Доступ тільки для авторизованих користувачів

    def get_object(self):
        """
        Повертає профіль поточного авторизованого користувача.
        """
        return self.request.user

    def get(self, request, *args, **kwargs):
        """
        Обробляє GET-запит і повертає профіль користувача разом із його постами.
        """
        user = self.get_object()
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    def perform_update(self, serializer):
        user = self.get_object()
        if 'password' in self.request.data:
            password = self.request.data['password']
            if not password:  # перевірка на пустий пароль
                raise serializers.ValidationError({"password": "Пароль не може бути пустим"})
            
            user.set_password(password)
            user.save()
            
        serializer.save()


class UserProfileDetailView(generics.GenericAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Отримання постів для конкретного користувача за його ID."""
        #user_id = self.kwargs['user_id']
        serializer = self.get_serializer(CustomUser.objects.get(pk=pk))
        return Response(serializer.data)


# Вихід з акаунту (інвалідизація токену)
class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response({"message": "Не вказано refresh_token."}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Успішний вихід!"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Видалення акаунту
class UserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        user.delete()  # Видаляємо користувача
        return Response({"message": "Ваш акаунт був успішно видалений!"}, status=status.HTTP_204_NO_CONTENT)

class HashtagView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response(user.hashtags_list, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        hashtag = request.data.get('hashtag')  # Changed from request.POST to request.data
        
        if not hashtag:
            return Response({'error': 'Хештег не вказаний'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.is_authenticated:
            return Response({'error': 'Тільки аутентифіковані користувачі можуть додавати хештеги.'}, status=status.HTTP_403_FORBIDDEN)
    
        try:
            user.add_hashtag(hashtag)
            return Response({'message': 'Хештег додано успішно'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': f'{e}'}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        hashtag = request.data.get('hashtag')  
        
        if not hashtag:
            return Response({'error': 'Хештег не вказаний'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_authenticated:
            return Response({'error': 'Тільки аутентифіковані користувачі можуть видаляти хештеги.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            user.remove_hashtag(hashtag)
            return Response({'message': 'Хештег видалено успішно'}, status=status.HTTP_200_OK)
        except PermissionError as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'error': f'{e}'}, status=status.HTTP_400_BAD_REQUEST)

class SubscriptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        try:
            user_to_follow = CustomUser.objects.get(id=user_id)
            request.user.subscribe(user_to_follow)
            return Response({"message": f"Ви підписались на {user_to_follow.display_name}"}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"message": "Користувача не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user_id):
        try:
            user_to_unfollow = CustomUser.objects.get(id=user_id) 
            request.user.unsubscribe(user_to_unfollow)
            return Response({"message": f"Ви відписались від {user_to_unfollow.display_name}"}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"message": "Користувача не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UserSubscriptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):

        try:
            user = CustomUser.objects.get(id=user_id)
            subscriptions = user.subscriptions.all()
            serializer = SubscribeSerializer(subscriptions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"message": "Користувача не знайдено"}, status=status.HTTP_404_NOT_FOUND)

class UserSubscribersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)
            subscribers = user.subscribers.all()
            serializer = SubscribeSerializer(subscribers, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"message": "Користувача не зндено"}, status=status.HTTP_404_NOT_FOUND)

class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get('query', '')
        search_type = request.GET.get('type', 'all')
        response_data = {}
        
        if search_type in ['all', 'users']:
            users = CustomUser.objects.filter(Q(display_name__icontains=query) | Q(full_name__icontains=query) | Q(hashtags__name__icontains=query)).distinct()
            
            hashtag_query = request.GET.get('user_hashtag')
            if hashtag_query:
                users = users.filter(hashtags__name__icontains=hashtag_query)
                
            response_data['users'] = UserProfileSerializer(users, many=True, context={'request': request}).data
        
        if search_type in ['all', 'posts']:
            posts = Post.objects.filter(Q(content__icontains=query) | Q(hashtags__name__icontains=query)).distinct()
            
            hashtag_query = request.GET.get('post_hashtag')
            if hashtag_query:
                posts = posts.filter(hashtags__name__icontains=hashtag_query)
                
            response_data['posts'] = PostSerializer(posts, many=True, context={'request': request}).data
        
        # Перевірка на відсутність результатів
        if (search_type == 'all' and not response_data.get('users') and not response_data.get('posts')) or (search_type == 'users' and not response_data.get('users')) or (search_type == 'posts' and not response_data.get('posts')):
            return Response({
                "message": "Наша мережа не настільки популярна щоб тут було це. Шукайте це деінде, або ж створіть свій пост!",
                "metadata": {
                    'query': query,
                    'search_type': search_type,
                    'total_users': 0,
                    'total_posts': 0,
                }
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Додавання метаданих про результати пошуку
        response_data['metadata'] = {
            'query': query,
            'search_type': search_type,
            'total_users': len(response_data.get('users', [])),
            'total_posts': len(response_data.get('posts', [])),
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

logger = logging.getLogger(__file__)

def get_tokens_for_user(user):
    """
    Генерує пару JWT-токенів (refresh та access) для користувача.
    """
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

def create_display_name(email):
    """
    Генерує унікальний display_name для користувача на основі email.
    """
    total_retries = 5
    email_part = email.split("@")[0][:20]
    clean_email_part = ''.join(char for char in email_part if char.isalnum())
    for i in range(total_retries):
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
        display_name = f"{clean_email_part}_{random_suffix}"
        if not CustomUser.objects.filter(display_name=display_name).exists():
            return display_name
    raise Exception("Перевищено кількість спроб створити унікальний display_name.")


class TokenRefreshView(generics.GenericAPIView):
    serializer_class = TokenRefreshSerializer
    permission_classes = [AllowAny]  # Дозволяємо доступ без автентифікації

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Повертаємо новий access токен (а також refresh токен, якщо потрібно)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

class GoogleAuthView(GenericAPIView):
    """
    View для авторизації через Google.
    Приймає POST-запит із token, отриманим від Google.
    """
    # Використовуємо серіалізатор профілю користувача для відповіді
    response_serializer_class = UserProfileSerializer

    def post(self, request, *args, **kwargs):
        token = request.data.get('token')
        if not token:
            return Response({
                "status": "error",
                "message": "Не передано token"
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Запит до Google API для отримання інформації про користувача
            response = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo', 
                headers={"Authorization": f"Bearer {token}"}
            )
            response_data = response.json()
            logger.info("Відповідь від Google при аутентифікації", extra={"response_data": response_data})
            if 'error' in response_data:
                logger.error("Невірний Google token або він закінчився.", exc_info=True)
                return Response({
                    "status": "error",
                    "message": "Невірний Google token або він закінчився.",
                    "payload": {}
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.error("Несподівана помилка при зверненні до Google API", exc_info=True)
            return Response({
                "status": "error",
                "message": "Несподівана помилка, зверніться до підтримки",
                "payload": {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Перевірка даних, отриманих від Google, за допомогою серіалізатора
        google_serializer = GoogleAuthResponseSerializer(data=response_data)
        if not google_serializer.is_valid():
            logger.error("Невірні дані отримані від Google", exc_info=True)
            return Response({
                "status": "error",
                "message": "Невірні дані отримані від Google",
                "payload": {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        validated_data = google_serializer.validated_data
        
        email = validated_data.get('email').lower()
        given_name = validated_data.get("given_name")
        family_name = validated_data.get("family_name", "")
        picture = validated_data.get("picture")
        # Якщо в даних є ключ "aud", перевіряємо його
        if 'aud' in validated_data and validated_data['aud'] != settings.GOOGLE_CLIENT_ID:
            logger.error("Невірний аудиторський ідентифікатор Google")
            return Response({
                "status": "error",
                "message": "Невірний Google token",
                "payload": {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        is_new_user = False
        with transaction.atomic():
            user = CustomUser.objects.filter(email=email).first()
            if user is None:
                is_new_user = True
                display_name = create_display_name(email)
                full_name = f"{given_name} {family_name}".strip()
                # Генерувати випадковий пароль для нового користувача
                password = BaseUserManager().make_random_password()
                user = CustomUser.objects.create_user(
                    email=email, 
                    display_name=display_name,
                    password=password,
                    full_name=full_name,
                    # За потреби можна додати: photo=<завантаження з URL picture>
                )
            if not user.is_active:
                user.is_active = True
                user.save()
            # Якщо потрібно, тут можна встановити прапорець google_auth_enabled, якщо така логіка потрібна

        serializer_data = self.response_serializer_class(user, context={"request": request}).data
        return Response({
            "status": "success",
            "message": "Успішний вхід через Google",
            "payload": serializer_data,
            "token": get_tokens_for_user(user),
        }, status=status.HTTP_200_OK)

# Налаштування логування
log_file_path = os.path.join(settings.BASE_DIR, 'logs', 'recommendations.log')
os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
file_handler = logging.FileHandler(log_file_path)
formatter = logging.Formatter('%(asctime)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

class RecommendedUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Отримуємо всіх користувачів, окрім самого себе, тих, на яких підписаний, та ігнорованих
        users = CustomUser.objects.exclude(id=user.id).exclude(subscriptions=user).exclude(ignored_users=user)

        recommendations = []
        for potential_user in users:
            score = 0

            # Критерій 1: Використання хештегів
            user_hashtags = set(user.hashtags.values_list('name', flat=True))
            potential_user_hashtags = set(potential_user.hashtags.values_list('name', flat=True))
            if user_hashtags and potential_user_hashtags:
                # Порівняння хештегів за допомогою NLTK
                similarity = 0
                for user_hashtag in user_hashtags:
                    for potential_user_hashtag in potential_user_hashtags:
                        current_similarity = 1 - jaccard_distance(set(user_hashtag), set(potential_user_hashtag))
                        if current_similarity > similarity:
                            similarity = current_similarity
                if similarity >= 0.5:  # Мінімум 50% схожості
                    score += 0.25 * similarity

            # Критерій 2: Спільні підписки
            common_subscriptions = user.subscriptions.filter(id__in=potential_user.subscriptions.all()).count()
            if common_subscriptions > 0:
                score += 0.25 * (common_subscriptions / user.subscriptions.count())

            # Критерій 3: Взаємодії (лайки, коментарі, репости)
            interactions = self.calculate_interactions(user, potential_user)
            score += 0.35 * interactions

            # Критерій 4: Схожість інтересів
            interest_similarity = self.calculate_interest_similarity(user, potential_user)
            if interest_similarity > 0.7:
                score += 0.15

            # Логування рекомендацій у JSON форматі
            log_data = {
                "requesting_user": user.display_name,
                "recommended_user": potential_user.display_name,
                "score": score,
                "criteria": {
                    "hashtag_similarity": 0.25 * similarity if user_hashtags and potential_user_hashtags else 0,
                    "common_subscriptions": 0.25 * (common_subscriptions / user.subscriptions.count()) if common_subscriptions > 0 else 0,
                    "interactions": 0.35 * interactions,
                    "interest_similarity": 0.15 if interest_similarity > 0.7 else 0
                }
            }
            logger.info(json.dumps(log_data))

            recommendations.append((potential_user, score))

        # Сортуємо рекомендації за оцінкою від 1 до 0
        recommendations.sort(key=lambda x: x[1], reverse=True)

        # Повертаємо лише 15 користувачів з найвищими оцінками
        recommended_users = [user for user, score in recommendations[:15]]
        serializer = UserProfileSerializer(recommended_users, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def calculate_interactions(self, user, potential_user):
        # Логіка для обчислення взаємодій (лайки, коментарі, репости)
        user_likes = user.likes.count()
        potential_user_likes = potential_user.likes.count()
        user_comments = user.comments.count()
        potential_user_comments = potential_user.comments.count()
        user_reposts = user.posts.filter(original_post__isnull=False).count()
        potential_user_reposts = potential_user.posts.filter(original_post__isnull=False).count()

        total_interactions = (user_likes + user_comments + user_reposts)
        potential_interactions = (potential_user_likes + potential_user_comments + potential_user_reposts)

        if total_interactions == 0:
            return 0

        return min(total_interactions, potential_interactions) / total_interactions

    def calculate_interest_similarity(self, user, potential_user):
        # Логіка для обчислення схожості інтересів на основі історії лайків
        user_liked_posts = set(user.likes.values_list('id', flat=True))
        potential_user_liked_posts = set(potential_user.likes.values_list('id', flat=True))

        if not user_liked_posts or not potential_user_liked_posts:
            return 0

        intersection = user_liked_posts.intersection(potential_user_liked_posts)
        return len(intersection) / len(user_liked_posts)

class IgnoreUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        try:
            user_to_ignore = CustomUser.objects.get(id=user_id)
            request.user.ignored_users.add(user_to_ignore)
            return Response({"message": f"Ви ігноруєте {user_to_ignore.display_name}"}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"message": "Користувача не знайдено"}, status=status.HTTP_404_NOT_FOUND)