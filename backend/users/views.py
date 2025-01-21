from django.http import JsonResponse
import json
from django.views import View 
<<<<<<< HEAD
from rest_framework import generics, status, serializers
=======
from rest_framework import generics, status
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from .models import CustomUser
<<<<<<< HEAD
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer, SubscribeSerializer
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from nltk.metrics import jaccard_distance
from django.db.models import Q
from users.models import CustomUser
from posts.models import Post
from posts.serializers import PostSerializer

=======
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f


# Реєстрація користувача
class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

# Вхід користувача
from rest_framework.authtoken.models import Token

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
                # Create or get a token for the user
                token, created = Token.objects.get_or_create(user=user)
                
                # Include the `display_name` in the response
                display_name = user.display_name  # Replace `display_name` with the correct field in your model

                return Response({
                    "message": "Успішний вхід!",
                    "token": token.key,
                    "display_name": display_name
                }, status=status.HTTP_200_OK)
            else:
                return Response({"message": "Невірний пароль!"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Профіль користувача
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
<<<<<<< HEAD
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
=======
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated]  # Перевірка на аутентифікацію

    def get_object(self):
        return self.request.user  # Отримуємо профіль аутентифікованого користувача
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f

    def perform_update(self, serializer):
        user = self.get_object()
        if 'password' in self.request.data:
            password = self.request.data['password']
<<<<<<< HEAD
            if not password:  # перевірка на пустий пароль
                raise serializers.ValidationError({"password": "Пароль не може бути пустим"})
            
            user.set_password(password)
            user.save()
            
            # Створюємо новий токен замість видалення всіх
            Token.objects.filter(user=user).delete()
            Token.objects.create(user=user)
            
        serializer.save()


class UserProfileDetailView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Отримання постів для конкретного користувача за його ID."""
        user_id = self.kwargs['user_id']
        return Post.objects.filter(author__id=user_id).order_by('-created_at')


=======
            user.set_password(password)  # Якщо пароль змінюється
        serializer.save()

>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
# Вихід з акаунту (інвалідизація токену)
class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

<<<<<<< HEAD
    def post(self, request, *args, **kwargs): 
=======
    def post(self, request, *args, **kwargs):
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
        try:
            # Отримуємо токен, пов'язаний з користувачем
            token = Token.objects.get(user=request.user)
            token.delete()  # Видаляємо токен для завершення сесії
            return Response({"message": "Вихід успішний!"}, status=status.HTTP_200_OK)
        except Token.DoesNotExist:
            return Response({"message": "Токен не знайдений."}, status=status.HTTP_400_BAD_REQUEST)

# Видалення акаунту
class UserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        user.delete()  # Видаляємо користувача
<<<<<<< HEAD
        token = Token.objects.get(user=request.user)
        token.delete()  # Видаляємо токен для завершення сесії
=======
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
        return Response({"message": "Ваш акаунт був успішно видалений!"}, status=status.HTTP_204_NO_CONTENT)


class HashtagView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
<<<<<<< HEAD
        return Response(user.hashtags_list, status=status.HTTP_200_OK)
=======
        return Response(user.hashtags_list)
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f

    def post(self, request):
        user = request.user
        hashtag = request.data.get('hashtag')  # Changed from request.POST to request.data
        
        if not hashtag:
<<<<<<< HEAD
            return Response({'error': 'Хештег не вказаний'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.is_authenticated:
            return Response({'error': 'Тільки аутентифіковані користувачі можуть додавати хештеги.'}, status=status.HTTP_403_FORBIDDEN)
    
        try:
            user.add_hashtag(hashtag)
            return Response({'message': 'Хештег додано успішно'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': f'{e}'}, status=status.HTTP_400_BAD_REQUEST)
=======
            return JsonResponse({'error': 'Хештег не вказаний'}, status=400)
        
        if not user.is_authenticated:
            return JsonResponse({'error': 'Тільки аутентифіковані користувачі можуть додавати хештеги.'}, status=403)
    
        try:
            user.add_hashtag(hashtag)
            return JsonResponse({'message': 'Хештег додано успішно'}, status=200)
        except Exception as e:
            return JsonResponse({'error': f'{e}'}, status=400)
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f

    def delete(self, request):
        user = request.user
        hashtag = request.data.get('hashtag')  
        
<<<<<<< HEAD
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
            user_to_follow = CustomUser.objects.get(id = user_id)
            request.user.subscribe(user_to_follow)
            return Response({"message": f"Ви підписались на {user_to_follow.username}"}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"message": "Користувача не знайдено"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, user_id):
        try:
            user_to_unfollow = CustomUser.objects.get(id=user_id) 
            request.user.unsubscribe(user_to_unfollow)
            return Response({"message": f"Ви відписались від {user_to_unfollow.username}"}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"message": "Користувача не знайдено"}, status=status.HTTP_404_NOT_FOUND)

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



class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Повертає список рекомендованих користувачів для поточного користувача на основі схожості їхніх інтересів та інших факторів.

        :param запит: об'єкт запиту
        :return: Список об'єктів користувача, серіалізованих як JSON, з кодом статусу 200
        """
        current_user = request.user
        recommendations = RecommendationService.recommend_users(current_user, threshold=0.7) #Якщо користувачі мають невелику кількість спільних хештегів, великий поріг може призвести до порожніх рекомендацій.
        serializer = UserProfileSerializer(recommendations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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
=======
        
        if not hashtag:
            return JsonResponse({'error': 'Хештег не вказаний'}, status=400)

        if not user.is_authenticated:
            return JsonResponse({'error': 'Тільки аутентифіковані користувачі можуть видаляти хештеги.'}, status=403)

        try:
            user.remove_hashtag(hashtag)
            return JsonResponse({'message': 'Хештег видалено успішно'}, status=200)
        except PermissionError as e:
            return JsonResponse({'error': str(e)}, status=403)
        except Exception as e:
            return JsonResponse({'error': f'{e}'}, status=400)
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
