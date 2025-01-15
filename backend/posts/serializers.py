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
    author = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()  # Додаємо нове поле

    def get_author(self, obj):
        request = self.context.get('request')
        if request is None:
            return None
        profile_url = request.build_absolute_uri(f"api/users/profile/{obj.author.id}/")
        hashtags = obj.author.hashtags.all()[:3]
        hashtags_data = [{"id": hashtag.id, "name": hashtag.name} for hashtag in hashtags]
        return {
            "id": obj.author.id,
            "photo": obj.author.photo.url,
            "hashtags": hashtags_data,
            "display_name": obj.author.display_name,
            "profile_url": profile_url
        }

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'image', 'video', 'audio', 'hashtags', 'likes', 'comments', 'created_at', 'updated_at', 'original_post', 'is_liked']