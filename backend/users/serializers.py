from rest_framework import serializers
from .models import CustomUser, UserHashtag
from django.contrib.auth.password_validation import validate_password
from posts.serializers import PostSerializer

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    photo = serializers.ImageField(required=False)

    class Meta:
        model = CustomUser
        fields = ['email', 'display_name', 'full_name', 'password', 'password2', 'photo']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Паролі не співпадають."})
        return attrs

    def create(self, validated_data):
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
        
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class UserHashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserHashtag
        fields = ['name']

class UserProfileSerializer(serializers.ModelSerializer):
    posts = PostSerializer(many=True, read_only=True)
    hashtags = UserHashtagSerializer(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = ['email', 'full_name', 'display_name', 'bio', 'photo', 'hashtags', 'subscriptions_count', 'subscribers_count', 'total_likes', 'posts']
        read_only_fields = ['subscriptions_count', 'subscribers_count', 'total_likes']


class SubscribeSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        if value == self.context['request'].user.id:
            raise serializers.ValidationError("Не можна підписатися на самого себе.")
        return value
    class Meta:
        model = CustomUser
        fields = ['id', 'display_name', 'photo']

class GoogleAuthResponseSerializer(serializers.Serializer):
    """
    Серіалізатор для перевірки даних, отриманих від Google.
    Поля залежать від відповіді API Google.
    """
    # "sub": Унікальний ідентифікатор користувача, що пропонується Google.
    sub = serializers.CharField(required=False)# Це поле не є обов'язковим, оскільки може відсутнє в деяких відповідях.
    # "email": Електронна адреса користувача. Поле обов'язкове,
    email = serializers.EmailField(required=True)# оскільки електронна адреса є критичною для аутентифікації чи створення облікового запису.
    # "email_verified": Логічне поле, яке вказує чи була електронна адреса підтверджена.
    email_verified = serializers.BooleanField(required=False)# Це поле не є обов'язковим.
    # "name": Повне ім'я користувача, як воно надане Google.
    name = serializers.CharField(required=False)# Не обов'язкове, оскільки в деяких відповідях це поле може бути відсутнє.
    # "given_name": Ім'я користувача.
    given_name = serializers.CharField(required=True)# Це обов'язкове поле, яке повинне містити ім'я, отримане від Google.
    # "family_name": Прізвище користувача.
    family_name = serializers.CharField(required=False, allow_blank=True)# Поле не є обов'язковим та дозволяє порожнє значення, якщо Google не надає інформацію.
    # "picture": URL зображення профілю користувача.
    picture = serializers.URLField(required=False)# Це поле не є обов'язковим, але в разі наявності має бути дійсною URL-адресою.
    # "aud": Аудиторія або ідентифікатор клієнта, який отримує дані від Google.
    aud = serializers.CharField(required=False)# Не є обов'язковим, використовується для перевірки відповідності клієнта.