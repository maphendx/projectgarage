from rest_framework import serializers
<<<<<<< HEAD
from .models import CustomUser, UserHashtag
from django.contrib.auth.password_validation import validate_password
from posts.serializers import PostSerializer
=======
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
<<<<<<< HEAD
    photo = serializers.ImageField(required=False)

    class Meta:
        model = CustomUser
        fields = ['email', 'display_name', 'full_name', 'password', 'password2', 'photo']
=======

    class Meta:
        model = CustomUser
        fields = ['email', 'display_name', 'full_name', 'password', 'password2']
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Паролі не співпадають."})
        return attrs

    def create(self, validated_data):
<<<<<<< HEAD
        # Видаляємо підтвердження паролю
        validated_data.pop('password2', None)
        # Зберігаємо пароль
        password = validated_data.pop('password', None)
        
        # Видаляємо фото з validated_data, якщо воно не було надано
        # Це дозволить використати дефолтне значення з моделі
        if 'photo' not in validated_data or not validated_data['photo']:
            validated_data.pop('photo', None)
            
        # Створюємо користувача
        user = self.Meta.model(**validated_data)
        
        # Встановлюємо пароль
        if password is not None:
            user.set_password(password)
            
        # Зберігаємо користувача
        user.save()
        
=======
        validated_data.pop('password2', None)
        password = validated_data.pop('password', None)
        user = self.Meta.model(**validated_data)
        if password is not None:
            user.set_password(password)  # Хешування паролю
        user.save()
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class UserProfileSerializer(serializers.ModelSerializer):
<<<<<<< HEAD
    posts = PostSerializer(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = ['email', 'full_name', 'display_name', 'bio', 'photo', 'hashtags', 'subscriptions_count', 'subscribers_count', 'total_likes', 'posts']
        read_only_fields = ['subscriptions_count', 'subscribers_count', 'total_likes']


class SubscribeSerializer(serializers.Serializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'display_name', 'photo']

class UserHashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserHashtag
        fields = ['name']
=======
    class Meta:
        model = CustomUser
        fields = ['email', 'full_name', 'display_name', 'bio', 'photo', 'hashtags', 'subscriptions_count', 'subscribers_count', 'total_likes']
        read_only_fields = ['subscriptions_count', 'subscribers_count', 'total_likes']
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
