from rest_framework import serializers
from users.models import CustomUser
from .models import Post, Comment, Hashtag
from django.core.exceptions import ValidationError
from django.db import transaction

class HashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hashtag
        fields = ['id', 'name']

class CommentSerializer(serializers.ModelSerializer): 
    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at', 'updated_at']

class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    hashtags = serializers.ListField(
        child=serializers.CharField(max_length=255),
        write_only=True,
        required=False
    )
    hashtag_objects = HashtagSerializer(many=True, read_only=True, source='hashtags')

    def get_author(self, obj):
        request = self.context.get('request')
        if request is None:
            return None
        
        profile_url = request.build_absolute_uri(f"api/users/profile/{obj.author.id}/")
        hashtags = obj.author.hashtags.all()[:3]
        hashtags_data = [{hashtag.name} for hashtag in hashtags]
        
        #  SVG 
        default_avatar = request.build_absolute_uri('media/default/default_avatar/g396.svg')
        
        #      SVG
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

    def validate_image(self, value):
        if value and value.size > 10 * 1024 * 1024:
            raise ValidationError("Image size should not exceed 10MB")
        return value

    def validate_video(self, value):
        if value and value.size > 500 * 1024 * 1024:
            raise ValidationError("Video size should not exceed 500MB")
        return value

    def validate_audio(self, value):
        if value and value.size > 20 * 1024 * 1024:
            raise ValidationError("Audio size should not exceed 20MB")
        return value

    def validate_hashtags(self, value):
        if not value:
            return value
        for tag in value:
            if not tag.startswith("#"):
                raise ValidationError(f"Hashtag '{tag}' should start with '#'")
        return value

    def create_hashtags(self, hashtags):
        hashtag_objects = []
        for tag in hashtags:
            hashtag, created = Hashtag.objects.get_or_create(name=tag.lower())
            hashtag_objects.append(hashtag)
        return hashtag_objects

    def create(self, validated_data):
        hashtags_data = validated_data.pop('hashtags', [])
        with transaction.atomic():
            hashtags = self.create_hashtags(hashtags_data)
            post = Post.objects.create(**validated_data)
            post.hashtags.set(hashtags)
            return post

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'image', 'video', 'audio', 'likes', 'comments', 'created_at', 'updated_at', 'original_post', 'is_liked', 'hashtags', 'hashtag_objects']
        read_only_fields = ['id', 'likes', 'comments', 'created_at', 'updated_at', 'is_liked', 'hashtag_objects']