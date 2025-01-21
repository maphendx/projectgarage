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
<<<<<<< HEAD
    author = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()  
    comments = serializers.SerializerMethodField()

    def get_author(self, obj):
        request = self.context.get('request')
        if request is None:
            return None
        
        profile_url = request.build_absolute_uri(f"api/users/profile/{obj.author.id}/")
        hashtags = obj.author.hashtags.all()[:3]
        hashtags_data = [{"id": hashtag.id, "name": hashtag.name} for hashtag in hashtags]
        
        # Дефолтна SVG картинка
        default_avatar = request.build_absolute_uri('media/default/default_avatar/g396.svg')
        
        # Використовуємо фото користувача або дефолтну SVG
        photo_url = obj.author.photo.url if obj.author.photo else default_avatar
        
        return {
            "id": obj.author.id,
            "photo": photo_url,
            "hashtags": hashtags_data,
            "display_name": obj.author.display_name,
            "profile_url": profile_url
        }

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_comments(self, obj):
        return obj.post_comments.count()

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'image', 'video', 'audio', 'hashtags', 'likes', 'comments', 'created_at', 'updated_at', 'original_post', 'is_liked']
=======
    comments = CommentSerializer(many=True, read_only=True)  # Додаємо коментарі до поста

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'image', 'video', 'hashtags', 'likes', 'comments', 'created_at', 'updated_at']
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
