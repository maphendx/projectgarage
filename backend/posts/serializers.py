from rest_framework import serializers
from users.models import CustomUser
from .models import Post, Comment, Hashtag
from django.core.exceptions import ValidationError

class HashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hashtag
        fields = ['name']

class CommentSerializer(serializers.ModelSerializer): 
    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at', 'updated_at']

class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    hashtags = serializers.CharField(required=False, allow_blank=True)
    hashtags_info = serializers.SerializerMethodField(read_only=True)
    
    image = serializers.ImageField(required=False, allow_null=True)
    video = serializers.FileField(required=False, allow_null=True)
    audio = serializers.FileField(required=False, allow_null=True)

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

    def get_hashtags_info(self, obj):
        return [{"id": hashtag.id, "name": hashtag.name} for hashtag in obj.hashtags.all()]

    def validate_hashtags(self, value):
        if not (1 <= len(value) <= 50):
            raise serializers.ValidationError("Кількість хештегів має бути від 1 до 50.")
        return value

    def validate_image(self, value):
        if value and value.size > 10 * 1024 * 1024:
            raise ValidationError("Максимальний розмір зображення - 10MB")
        return value

    def validate_video(self, value):
        if value and value.size > 500 * 1024 * 1024:
            raise ValidationError("Максимальний розмір відео - 500MB")
        return value

    def validate_audio(self, value):
        if value and value.size > 20 * 1024 * 1024:
            raise ValidationError("Максимальний розмір аудіо - 20MB")
        return value

    def validate_hashtags(self, value):
        """
        Розбиває вхідний рядок на хештеги, видаляє # і пробіли, перевіряє кількість.
        """
        if not value:
            return []
            
        # Розділяємо рядок на теги, ігноруючи порожні
        tags = [tag.strip().lstrip('#').lower() for tag in value.split() if tag.strip()]
        
        # Видаляємо дублікати
        unique_tags = list(set(tags))
        
        # Перевірка кількості
        if not (1 <= len(unique_tags) <= 50):
            raise serializers.ValidationError("Кількість хештегів має бути від 1 до 50.")
        
        return unique_tags

    def create(self, validated_data):
        # Отримуємо список хештегів після валідації
        hashtags_data = validated_data.pop('hashtags', [])
        post = Post.objects.create(**validated_data)

        hashtags = []
        for tag_name in hashtags_data:
            if tag_name:  # Переконуємося, що тег не порожній
                hashtag, created = Hashtag.objects.get_or_create(name=tag_name)
                hashtags.append(hashtag)
        
        post.hashtags.set(hashtags)
        return post

    def update(self, instance, validated_data):
        hashtags_data = validated_data.pop('hashtags', [])
        instance = super().update(instance, validated_data)

        hashtags = []
        for tag_name in hashtags_data:
            if tag_name:
                hashtag, created = Hashtag.objects.get_or_create(name=tag_name)
                hashtags.append(hashtag)
        
        instance.hashtags.set(hashtags)
        return instance

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'image', 'video', 'audio', 'hashtags', 'hashtags_info', 'likes', 'comments', 'created_at', 'updated_at', 'original_post', 'is_liked']