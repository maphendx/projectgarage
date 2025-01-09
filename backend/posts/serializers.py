from rest_framework import serializers
from users.models import CustomUser
from .models import Post, Comment, Hashtag

class HashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hashtag
        fields = ['name']

# Сериалізатор для коментарів
class CommentSerializer(serializers.ModelSerializer): 
    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at', 'updated_at']

# Сериалізатор для постів
class PostSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)  # Додаємо коментарі до поста

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'image', 'video', 'hashtags', 'likes', 'comments', 'created_at', 'updated_at', 'original_post']
