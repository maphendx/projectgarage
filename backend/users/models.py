from django.db import models
from django.contrib.auth.models import BaseUserManager
from django.contrib.auth.hashers import make_password, check_password
import os
import random
from django.conf import settings
from django.core.exceptions import ValidationError

def get_random_avatar():
    """Повертає випадкову аватарку з папки default_avatar"""
    avatar_dir = os.path.join(settings.MEDIA_ROOT, 'default', 'default_avatar')
    allowed_extensions = ('.png', '.jpg', '.jpeg', '.svg')
    avatars = [
        f for f in os.listdir(avatar_dir) 
        if os.path.isfile(os.path.join(avatar_dir, f)) 
        and f.lower().endswith(allowed_extensions)
    ]
    if avatars:
        return os.path.join('default', 'default_avatar', random.choice(avatars))
    return 'default/default_avatar/default.png'

class UserHashtag(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Хештег користувача'
        verbose_name_plural = 'Хештеги користувачів'

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
    photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True, default=get_random_avatar)  # Фото
    bio = models.TextField(blank=True, null=True)  # Коротке біо
    hashtags = models.ManyToManyField(UserHashtag, blank=False)  # Хештеги користувача
    objects = CustomUserManager()  # Використовуємо кастомний менеджер для створення користувачів
    subscriptions = models.ManyToManyField("self", symmetrical=False, blank=True, related_name="subscribers") # 
    ignored_users = models.ManyToManyField("self", symmetrical=False, blank=True, related_name="ignored_by")  # Додано поле для ігнорування

    REQUIRED_FIELDS = ['display_name', 'password']  # Вказуємо обов'язкові поля
    USERNAME_FIELD = 'email'  # Використовуємо email для автентифікації користувачів

    def __str__(self):
        return self.display_name

    def subscribe(self, user):
        """Підписка на користувача."""
        if user == self:
            raise Exception("Не можна підписатися на самого себе.")
        self.subscriptions.add(user)
        self.subscriptions_count  # просто викликаємо, щоб оновити значення
        self.save()
        user.save()

    def unsubscribe(self, user):
        """Відписка з користувача."""
        if user == self:
            raise Exception("Не можна відписатися від самого себе.")
        self.subscriptions.remove(user)
        self.subscriptions_count = self.subscriptions.count()  # оновлюємо кількість підписок
        user.subscribers_count = user.subscribers.count()  # оновлюємо кількість підписаних
        self.save()
        user.save()

    def set_password(self, raw_password):
        """Хешуємо пароль."""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Перевірка паролю."""
        return check_password(raw_password, self.password)

    @property
    def subscriptions_count(self):
        """Повертає кількість користувачів, на яких підписаний даний користувач."""
        return self.subscriptions.count()

    @property
    def subscribers_count(self):
        """Повертає кількість користувачів, які підписані на даного користувача."""
        return self.subscribers.count()

    @property
    def hashtagClass(self):
        return UserHashtag

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
        """Повертає список хештегів користувача."""
        if not self.is_authenticated or not self.hashtags:
            return []
        
        hashSet = self.hashtags.all()
        from users.serializers import UserHashtagSerializer
        serializer = UserHashtagSerializer(hashSet, many=True)
        return serializer.data

    def add_hashtag(self, hashtag):
        """Додає новий хештег до користувача."""
        if not self.is_authenticated:
            raise PermissionError("Тільки аутентифіковані користувачі можуть додавати хештеги.")
        if self.hashtags.filter(name=hashtag):
            raise Exception("Даний хештег вже пов'язаний з поточним користувачем.")
        try:
            self.hashtags.get_or_create(name=hashtag)
        except:  # Для випадку, якщо тег вже в БД є, але не зв'язаний з цим юзером через проміжну таблицю
            self.hashtags.add(self.hashtagClass.objects.get(name=hashtag))

    def remove_hashtag(self, hashtag):
        """Видаляє хештег з користувача."""
        if not self.is_authenticated:
            raise PermissionError("Тільки аутентифіковані користувачі можуть видаляти хештеги.")
        if not self.hashtags.filter(name=hashtag):
            raise Exception("Даний хештег не пов'язаний з поточним користувачем.")
        self.hashtags.remove(self.hashtagClass.objects.get(name=hashtag))

    class Meta:
        verbose_name = 'Користувач'
        verbose_name_plural = 'Користувачі'

    def clean(self):
        # """Перевірка на кількість хештегів."""
        # if not (5 <= self.hashtags.count() <= 30):
        #     raise ValidationError("Кількість хештегів має бути в межах від 5 до 30.")
        pass


    def save(self, *args, **kwargs):
        """Перевіряємо обмеження перед збереженням."""
        self.full_clean()  # Викликає метод clean()
        super().save(*args, **kwargs)