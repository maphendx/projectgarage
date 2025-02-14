from django.db import models
from users.models import CustomUser
from django.core.exceptions import ValidationError
from django.utils.timezone import now
import os
from django.conf import settings

# Модель для хештегів
class Hashtag(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

# Модель для коментарів - тут використовується ForeignKey до Post
class Comment(models.Model):
    post = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='post_comments')
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

# Модель для постів без полів для медіа та ManyToManyField для коментарів
class Post(models.Model):
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(blank=True)
    hashtags = models.ManyToManyField('Hashtag', blank=True)
    likes = models.ManyToManyField(CustomUser, through='Like', related_name='liked_posts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    original_post = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    video_thumbnail = models.ImageField(upload_to='posts/video_thumbnails/', blank=True, null=True)

    def __str__(self):
        if self.original_post:
            return f'Repost of {self.original_post.id} by {self.author.display_name}'
        return f'Post {self.id} by {self.author.display_name}'

    def clean(self):
        # Додаткові перевірки для поста, якщо потрібно
        pass

    def save(self, *args, **kwargs):
        self.full_clean()  # Викликає clean()
        super().save(*args, **kwargs)

# Моделі для медіа – кожна медіа має відношення ForeignKey до Post
class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='posts/images/', validators=[validate_image_file_size, validate_image_file_extension])

class PostVideo(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='videos')
    video = models.FileField(upload_to='posts/videos/', validators=[validate_video_file_size, validate_video_file_extension])

class PostAudio(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='audios')
    audio = models.FileField(upload_to='posts/audio/', validators=[validate_audio_file_size, validate_audio_file_extension])

class Like(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='liked_by')
    liked_at = models.DateTimeField(default=now)

    class Meta:
        unique_together = ('user', 'post')

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('new_post', 'Новий пост'),
        ('new_subscription', 'Нова підписка'),
        ('post_like', 'Пост лайкнуто'),
        ('post_repost', 'Пост репостнуто'),
        ('new_comment', 'Новий коментар'),
        ('voice_invite','Запрошення в голосовий канал'),
        ('chat_message','Повідомлення в чаті')
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notifications_from'
    )
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    post = models.ForeignKey('posts.Post', on_delete=models.CASCADE, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification ({self.notification_type}): {self.actor} -> {self.recipient}"