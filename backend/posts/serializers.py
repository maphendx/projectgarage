from rest_framework import serializers
from users.models import CustomUser
from .models import Post, Comment, Hashtag, PostImage, PostVideo, PostAudio
from django.core.exceptions import ValidationError
import re

class HashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hashtag
        fields = ['id', 'name']

class CommentSerializer(serializers.ModelSerializer): 
    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at', 'updated_at']

# Серіалайзери для медіа
class PostImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    def get_image(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    class Meta:
        model = PostImage
        fields = ['id', 'image']


class PostVideoSerializer(serializers.ModelSerializer):
    video = serializers.SerializerMethodField()

    def get_video(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.video.url)
        return obj.video.url

    class Meta:
        model = PostVideo
        fields = ['id', 'video']


class PostAudioSerializer(serializers.ModelSerializer):
    audio = serializers.SerializerMethodField()

    def get_audio(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.audio.url)
        return obj.audio.url

    class Meta:
        model = PostAudio
        fields = ['id', 'audio']

class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    hashtags = serializers.CharField(write_only=True, required=False)
    hashtag_objects = HashtagSerializer(many=True, read_only=True, source='hashtags')
    images = PostImageSerializer(many=True, read_only=True)
    videos = PostVideoSerializer(many=True, read_only=True)
    audios = PostAudioSerializer(many=True, read_only=True)

    def get_author(self, obj):
        request = self.context.get('request')
        if request is None:
            return None
        
        profile_url = request.build_absolute_uri(f"api/users/profile/{obj.author.id}/")
        hashtags = obj.author.hashtags.all()[:3]
        hashtags_data = [{hashtag.name} for hashtag in hashtags]
        
        default_avatar = request.build_absolute_uri('media/default/default_avatar/g396.svg')
        photo_url = request.build_absolute_uri(obj.author.photo.url) if obj.author.photo else default_avatar
        
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

    def validate_hashtags(self, value):
        if not value:
            return value
        hashtags = value.split(',')
        for tag in hashtags:
            tag = tag.strip()
            if not tag.startswith("#"):
                raise ValidationError(f"Hashtag '{tag}' має починатися з '#'")
            if not re.match(r'^#[A-Za-z0-9]+$', tag):
                raise ValidationError(f"Hashtag '{tag}' містить недопустимі символи")
        return value

    def create(self, validated_data):
        hashtags_str = validated_data.pop('hashtags', '')
        post = Post.objects.create(**validated_data)
        if hashtags_str:
            hashtag_list = [tag.strip().lower() for tag in hashtags_str.split(',') if tag.strip()]
            hashtags = [Hashtag.objects.get_or_create(name=tag)[0] for tag in hashtag_list]
            post.hashtags.set(hashtags)
        return post

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'content', 'hashtags', 'hashtag_objects', 
            'images', 'videos', 'audios', 'likes', 'comments', 
            'created_at', 'updated_at', 'original_post', 'is_liked'
        ]
        read_only_fields = [
            'id', 'likes', 'comments', 'created_at', 
            'updated_at', 'is_liked', 'hashtag_objects',
            'images', 'videos', 'audios'
        ]