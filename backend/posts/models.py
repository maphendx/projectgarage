from django.db import models
from users.models import CustomUser

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
        return f'Comment {self.id} on post {self.post.id} by {self.author.username}'

# Модель для постів
class Post(models.Model):
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(blank=True)
    image = models.ImageField(upload_to='posts/images/', blank=True)
    video = models.FileField(upload_to='posts/videos/', blank=True)
    hashtags = models.ManyToManyField('Hashtag', blank=True)
    likes = models.ManyToManyField(CustomUser, related_name='liked_posts', blank=True)
    comments = models.ManyToManyField('Comment', blank=True, related_name='commented_posts')  # Змінив related_name
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Post {self.id} by {self.author.username}'
