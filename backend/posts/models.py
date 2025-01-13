from django.db import models
from users.models import CustomUser
from django.core.exceptions import ValidationError
from django.utils.timezone import now


# Модель для хештегів
class Hashtag(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

# Модель для коментарів
class Comment(models.Model):
    post = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='post_comments')  # Змінив related_name
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Comment {self.id} on post {self.post.id} by {self.author.display_name}'

# Модель для постів
class Post(models.Model):
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(blank=True)
    image = models.ImageField(upload_to='posts/images/', blank=True)
    video = models.FileField(upload_to='posts/videos/', blank=True)
    hashtags = models.ManyToManyField('Hashtag', blank=False)
    likes = models.ManyToManyField(CustomUser, through='Like', related_name='liked_posts')
    comments = models.ManyToManyField('Comment', blank=True, related_name='commented_posts')  # Змінив related_name
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    original_post = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        if self.original_post:
            return f'Repost of {self.original_post.id} by {self.author.display_name}'
        return f'Post {self.id} by {self.author.display_name}'

    def clean(self):
        """Перевірка на кількість хештегів."""
        if not (1 <= self.hashtags.count() <= 50):
            raise ValidationError("Кількість хештегів має бути в межах від 1 до 50.")

    def save(self, *args, **kwargs):
        """Перевіряємо обмеження перед збереженням."""
        self.full_clean()  # Викликає метод clean()
        super().save(*args, **kwargs)

class Like(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='liked_by')
    liked_at = models.DateTimeField(default=now)  # Час лайку

    class Meta:
        unique_together = ('user', 'post')  # Уникальність для пари (користувач, пост)