from django.db import models
from users.models import CustomUser
from django.core.exceptions import ValidationError
from django.utils.timezone import now
import os

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

def validate_image_file_size(value):
    validate_file_size(value, 'image')

def validate_image_file_extension(value):
    validate_file_extension(value, 'image')

def validate_video_file_size(value):
    validate_file_size(value, 'video')

def validate_video_file_extension(value):
    validate_file_extension(value, 'video')

def validate_audio_file_size(value):
    validate_file_size(value, 'audio')

def validate_audio_file_extension(value):
    validate_file_extension(value, 'audio')

def validate_file_size(value, file_type):
    filesize = value.size
    
    if file_type == 'image' and filesize > 10 * 1024 * 1024:
        raise ValidationError("Максимальний розмір зображення - 10MB")
    elif file_type == 'video' and filesize > 500 * 1024 * 1024:
        raise ValidationError("Максимальний розмір відео - 500MB")
    elif file_type == 'audio' and filesize > 20 * 1024 * 1024:
        raise ValidationError("Максимальний розмір аудіо - 20MB")

def validate_file_extension(value, file_type):
    ext = os.path.splitext(value.name)[1]
    
    valid_image_extensions = ['.jpg', '.jpeg', '.png', '.gif']
    valid_video_extensions = ['.mp4', '.mov', '.avi']
    valid_audio_extensions = ['.mp3', '.wav', '.ogg']
    
    if file_type == 'image' and ext.lower() not in valid_image_extensions:
        raise ValidationError('Підтримуються формати: ' + ', '.join(valid_image_extensions))
    elif file_type == 'video' and ext.lower() not in valid_video_extensions:
        raise ValidationError('Підтримуються формати: ' + ', '.join(valid_video_extensions))
    elif file_type == 'audio' and ext.lower() not in valid_audio_extensions:
        raise ValidationError('Підтримуються формати: ' + ', '.join(valid_audio_extensions))

# Модель для постів
class Post(models.Model):
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(blank=True)
    image = models.ImageField(
        upload_to='posts/images/', 
        blank=True, 
        validators=[validate_image_file_size, validate_image_file_extension]
    )
    video = models.FileField(
        upload_to='posts/videos/', 
        blank=True, 
        validators=[validate_video_file_size, validate_video_file_extension]
    )
    audio = models.FileField(
        upload_to='posts/audio/', 
        blank=True, 
        validators=[validate_audio_file_size, validate_audio_file_extension]
    )
    hashtags = models.ManyToManyField('Hashtag', blank=False)
    likes = models.ManyToManyField(CustomUser, through='Like', related_name='liked_posts')
    comments = models.ManyToManyField('Comment', blank=True, related_name='commented_posts')  # Змінив related_name
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    original_post = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    video_thumbnail = models.ImageField(upload_to='posts/video_thumbnails/', blank=True, null=True)

    def __str__(self):
        if self.original_post:
            return f'Repost of {self.original_post.id} by {self.author.display_name}'
        return f'Post {self.id} by {self.author.display_name}'

    def clean(self):
        # """Перевірка на кількість хештегів."""
        # if not (1 <= self.hashtags.count() <= 50):
        #     raise ValidationError("Кількість хештегів має бути в межах від 1 до 50.")
        pass

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