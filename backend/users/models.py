from django.db import models
from django.contrib.auth.models import BaseUserManager
from django.contrib.auth.hashers import make_password, check_password
from django.apps import apps # для одержання класів моделей

class CustomUserManager(BaseUserManager):
    def create_user(self, email, display_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Користувач повинен мати електронну пошту')
        email = self.normalize_email(email)
        user = self.model(email=email, display_name=display_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, display_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, display_name, password, **extra_fields)

class CustomUser(models.Model):
    email = models.EmailField(unique=True)  # Унікальна електронна пошта для авторизації
    full_name = models.CharField(max_length=100, blank=True, null=True)  # ПІБ
    display_name = models.CharField(max_length=50, unique=True)  # Ім'я, яке бачать інші
    password = models.CharField(max_length=128)  # Пароль (буде хешуватись)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    subscriptions_count = models.PositiveIntegerField(default=0)  # Кількість підписок
    subscribers_count = models.PositiveIntegerField(default=0)  # Кількість підписаних
    total_likes = models.PositiveIntegerField(default=0)  # Кількість лайків за весь час
    photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)  # Фото
    bio = models.TextField(blank=True, null=True)  # Коротке біо
    hashtags = models.ManyToManyField("posts.Hashtag") # Хештеги

    objects = CustomUserManager()  # Використовуємо кастомний менеджер для створення користувачів

    REQUIRED_FIELDS = ['display_name', 'password']  # Вказуємо обов'язкові поля
    USERNAME_FIELD = 'email'  # Використовуємо email для автентифікації користувачів

    def __str__(self):
        return self.display_name

    def set_password(self, raw_password):
        """Хешуємо пароль."""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Перевірка паролю."""
        return check_password(raw_password, self.password)

    @property
    def is_authenticated(self):
        """Завжди повертає True для кастомної моделі користувача."""
        return True

    @property
    def is_anonymous(self):
        """Завжди повертає False для кастомної моделі користувача."""
        return False

    @property
    def hashtags_list(self):
        """Повертає список хештегів тільки для аутентифікованих користувачів."""
        if not self.is_authenticated or not self.hashtags:
            return []
        
        hashSet = self.hashtags.all()
        from posts.serializers import HashtagSerializer
        serializer = HashtagSerializer(hashSet, many=True)
        return serializer.data

    def add_hashtag(self, hashtag):
        """Додає новий хештег до користувача, тільки якщо користувач аутентифікований."""
        if not self.is_authenticated:
            raise PermissionError("Тільки аутентифіковані користувачі можуть додавати хештеги.")
        self.hashtags.get_or_create(name=hashtag)

    def remove_hashtag(self, hashtag):
        """Видаляє хештег з користувача, тільки якщо користувач аутентифікований."""
        if not self.is_authenticated:
            raise PermissionError("Тільки аутентифіковані користувачі можуть видаляти хештеги.")
        
        hashtags = self.hashtags_list
        if hashtag in hashtags:
            hashtags.remove(hashtag)
            self.hashtags = ','.join(hashtags)
            self.save()

    class Meta:
        verbose_name = 'Користувач'
        verbose_name_plural = 'Користувачі'
