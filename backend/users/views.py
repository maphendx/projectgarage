from django.http import JsonResponse
import json
from django.views import View 
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from .models import CustomUser
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator


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
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated]  # Перевірка на аутентифікацію

    def get_object(self):
        return self.request.user  # Отримуємо профіль аутентифікованого користувача

    def perform_update(self, serializer):
        user = self.get_object()
        if 'password' in self.request.data:
            password = self.request.data['password']
            user.set_password(password)  # Якщо пароль змінюється
        serializer.save()

# Вихід з акаунту (інвалідизація токену)
class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
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
        return Response({"message": "Ваш акаунт був успішно видалений!"}, status=status.HTTP_204_NO_CONTENT)


class HashtagView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response(user.hashtags_list)

    def post(self, request):
        user = request.user
        hashtag = request.data.get('hashtag')  # Changed from request.POST to request.data
        
        if not hashtag:
            return JsonResponse({'error': 'Хештег не вказаний'}, status=400)
        
        if not user.is_authenticated:
            return JsonResponse({'error': 'Тільки аутентифіковані користувачі можуть додавати хештеги.'}, status=403)
    
        try:
            user.add_hashtag(hashtag)
            return JsonResponse({'message': 'Хештег додано успішно'}, status=200)
        except Exception as e:
            return JsonResponse({'error': f'{e}'}, status=400)

    def delete(self, request):
        user = request.user
        hashtag = request.data.get('hashtag')  
        
        
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