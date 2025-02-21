from rest_framework import views
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .models import Post, Comment, Like, PostImage, PostVideo, PostAudio, Notification
from rest_framework import status
from .serializers import PostSerializer, CommentSerializer
from django.db.models import Count 
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import timedelta
from django.utils.timezone import now
from django.db import transaction
from django.core.files.base import ContentFile
import os
import ffmpeg
from django.core.files import File
from django.core.files.storage import default_storage
import tempfile
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import random
from django.db import models
from users.models import CustomUser
from nltk.metrics import jaccard_distance
import logging
from rest_framework.generics import ListAPIView

logger = logging.getLogger(__name__)

# Пост: список та деталі
class PostListView(views.APIView):
    # permission_classes = [IsAuthenticated]  # Тільки авторизовані користувачі можуть створювати пости

    def get(self, request):
        """
        Отримання списку всіх постів.
        """
        posts = Post.objects.all().prefetch_related('hashtags', 'likes', 'post_comments', 'author')
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Створення нового поста з хештегами та медіа-файлами.
        """
        try:
            data = request.data.copy()
            data['author'] = request.user.id

            original_post_object = None  # Ініціалізуємо змінну для перевірки на оригінальність

            # Обробка репосту (якщо вказаний original_post)
            if 'original_post' in data:
                try:
                    original_post_object = Post.objects.get(pk=data['original_post'])  # Зберігаємо оригінальний пост
                    data['content'] = data.get('content', '') + f'\n\n{original_post_object.content}'
                    if original_post_object.original_post is not None:
                        return Response(
                            {"detail": "Reposting a repost is not allowed."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Post.DoesNotExist:
                    return Response(
                        {"detail": "Original post does not exist."},
                        status=status.HTTP_404_NOT_FOUND
                    )

            # Валідація даних поста (без медіа) через серіалайзер.
            serializer = PostSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                # Збереження поста (без файлів)
                post = serializer.save(author=request.user)

                # Якщо створено репост, створюємо повідомлення для автора оригінального поста
                if original_post_object and request.user != original_post_object.author:
                    Notification.objects.create(recipient=original_post_object.author, actor=request.user, notification_type='post_repost', post=original_post_object)
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f"notifications_{original_post_object.author.id}",
                        {
                            "type": "send_notification",
                            "notification": {
                                "type": "post_repost",
                                "message": f"{request.user.display_name} репостнув ваш пост",
                                "post_id": original_post_object.id,
                            }
                        }
                    )

                # Отримуємо файли і читаємо їх вміст, аби не зберігати файлові об'єкти в замиканні
                images = request.FILES.getlist('images')
                videos = request.FILES.getlist('videos')
                audios = request.FILES.getlist('audios')

                images_data = []
                for image in images:
                    image.seek(0)
                    images_data.append({'name': image.name, 'content': image.read()})

                videos_data = []
                for video in videos:
                    video.seek(0)
                    videos_data.append({'name': video.name, 'content': video.read()})

                audios_data = []
                for audio in audios:
                    audio.seek(0)
                    audios_data.append({'name': audio.name, 'content': audio.read()})

                # Функція для обробки файлів після коміту транзакції (з використанням байтів, а не файлових об'єктів)
                def process_media_files():
                    # Обробка зображень
                    for img in images_data:
                        new_image = ContentFile(img['content'], name=img['name'])
                        PostImage.objects.create(post=post, image=new_image)

                    # Обробка відео з використанням NamedTemporaryFile
                    for vid in videos_data:
                        file_ext = os.path.splitext(vid['name'])[1]
                        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_video:
                            temp_video.write(vid['content'])
                            temp_video.flush()
                            temp_video_full_path = temp_video.name

                        final_video_relative_path = os.path.join('posts/videos/', vid['name'])
                        final_video_full_path = os.path.join(default_storage.location, final_video_relative_path)
                        # Створюємо директорію, якщо вона не існує
                        os.makedirs(os.path.dirname(final_video_full_path), exist_ok=True)

                        try:
                            (
                                ffmpeg.input(temp_video_full_path).output(final_video_full_path, vcodec='copy', acodec='copy').overwrite_output().run()
                            )
                        except Exception as e:
                            # Якщо ffmpeg викликає помилку, копіюємо оригінальний файл
                            with open(temp_video_full_path, 'rb') as f_in:
                                content = f_in.read()
                            with open(final_video_full_path, 'wb') as f_out:
                                f_out.write(content)
                        finally:
                            os.remove(temp_video_full_path)

                        with open(final_video_full_path, 'rb') as f:
                            video_file = File(f, name=vid['name'])
                            PostVideo.objects.create(post=post, video=video_file)

                    # Обробка аудіо (без додаткової обробки)
                    for aud in audios_data:
                        new_audio = ContentFile(aud['content'], name=aud['name'])
                        PostAudio.objects.create(post=post, audio=new_audio)

                # Виконуємо обробку файлів після завершення транзакції
                transaction.on_commit(process_media_files)

                serializer_with_media = PostSerializer(post, context={'request': request})
                return Response(serializer_with_media.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as ve:
            return Response({"detail": ve.message}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Пост: деталі, оновлення, видалення
class PostDetailView(APIView):    
    def get(self, request, pk):    
        post = Post.objects.get(pk=pk)  # Отримуємо пост за ID
        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):    
        post = Post.objects.get(pk=pk)  # Оновлюємо пост
        serializer = PostSerializer(post, data=request.data, context={'request': request})
        if serializer.is_valid():    
            serializer.save()        
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):    
        post = Post.objects.get(pk=pk)  # Видаляємо пост
        post.delete()    
        return Response({"detail": "Пост успішно видалено."}, status=status.HTTP_204_NO_CONTENT)

# Коментарі: список та створення
class CommentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        try:
            comments = Comment.objects.filter(post_id=post_id)
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, post_id):
        try:
            # Перевіряємо чи існує пост
            post = Post.objects.get(pk=post_id)
            
            # Створюємо коментар безпосередньо
            comment = Comment.objects.create(
                post=post,  # Використовуємо об'єкт поста замість post_id
                author=request.user,
                content=request.data.get('content')
            )
            
            serializer = CommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Post.DoesNotExist:
            return Response({"detail": "Пост не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Коментарі: деталі, оновлення, видалення
class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id, pk):
        try:
            comment = Comment.objects.get(post_id=post_id, pk=pk)
            serializer = CommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Comment.DoesNotExist:
            return Response({"detail": "Коментар не знайдено"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, post_id, pk):
        try:
            comment = Comment.objects.get(post_id=post_id, pk=pk)
            
            # Перевіряємо чи користувач є автором коментаря
            if comment.author != request.user:
                return Response({"detail": "Ви не маєте прав на редагування цього коментаря"}, status=status.HTTP_403_FORBIDDEN)
            
            serializer = CommentSerializer(comment, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Comment.DoesNotExist:
            return Response({"detail": "Коментар не знайдено"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, post_id, pk):
        try:
            comment = Comment.objects.get(post_id=post_id, pk=pk)
            
            # Перевіряємо чи користувач є автором коментаря
            if comment.author != request.user:
                return Response({"detail": "Ви не маєте прав на видалення цього коментаря"}, status=status.HTTP_403_FORBIDDEN)
            
            comment.delete()
            return Response({"detail": "Коментар успішно видалено"}, status=status.HTTP_204_NO_CONTENT)
        except Comment.DoesNotExist:
            return Response({"detail": "Коментар не знайдено"}, status=status.HTTP_404_NOT_FOUND)


class RecommendedPostsView(ListAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        
        # Отримуємо підписки користувача
        subscriptions = user.subscriptions.all()
        
        # Збираємо нові пости від підписаних користувачів
        new_posts = Post.objects.filter(author__in=subscriptions).order_by('-created_at')
        
        # Отримуємо хештеги користувача
        user_hashtags = set(user.hashtags.values_list('name', flat=True))
        
        # Перевірка наявності хештегів
        if not user_hashtags:
            logger.warning(f"User {user.id} has no hashtags.")
            return Response({"message": "У вас немає хештегів для рекомендацій."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Збираємо рекомендовані пости
        recommended_posts = set()  # Використовуємо множину для унікалізації
        
        # Додаємо нові пости до рекомендованих
        recommended_posts.update(new_posts)
        
        # Пошук постів, які не в підписках, але мають спільні хештеги
        other_posts = Post.objects.exclude(author__in=subscriptions)
        
        for post in other_posts:
            post_hashtags = set(post.hashtags.values_list('name', flat=True))
            # Перевіряємо наявність спільних хештегів за допомогою Jaccard distance
            similarity = jaccard_distance(user_hashtags, post_hashtags)
            if similarity < 0.5:  # Поріг схожості
                recommended_posts.add(post)  # Додаємо лише ті пости, які відповідають порогу
        
        # Додаємо популярні пости (з найбільшою кількістю лайків)
        popular_posts = Post.objects.annotate(likes_count=models.Count('likes')).order_by('-likes_count')[:5]
        recommended_posts.update(popular_posts)
        
        # Додаємо нещодавні пости (наприклад, за останні 7 днів)
        recent_posts = Post.objects.filter(created_at__gte=now() - timedelta(days=7)).exclude(author__in=subscriptions)
        recommended_posts.update(recent_posts)
        
        # Додаємо випадковий пост, якщо є доступні пости
        all_posts = Post.objects.all()
        if all_posts.exists():
            random_post = random.choice(all_posts)
            recommended_posts.add(random_post)
        
        # Перетворюємо множину назад у список для серіалізації
        recommended_posts = list(recommended_posts)
        
        # Серіалізуємо дані постів
        serializer = PostSerializer(recommended_posts, many=True, context={'request': request})
        
        return Response(serializer.data, status=status.HTTP_200_OK)


class RecentLikesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        '''
        Повертає список недавніх лайків користувача
        '''
        recent_likes = Like.objects.filter(
            liked_at__gte=now() - timedelta(days=7),
            user=request.user
        ).select_related('post')
        
        posts = [like.post for like in recent_likes]
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(pk=post_id)
            
            # Перевіряємо, чи користувач вже лайкнув цей пост
            like, created = Like.objects.get_or_create(user=request.user, post=post)
            
            if not created:
                # Якщо лайк уже існує - видаляємо його (тобто "знімаємо" лайк)
                like.delete()
                return Response({
                    "detail": "Лайк видалено",
                    "likes_count": post.likes.count()
                }, status=status.HTTP_200_OK)
            
            # Якщо лайк додано вперше, створюємо повідомлення для автора поста
            # Переконуємося, що автор не став лайкати власний пост
            if request.user != post.author:
                # Створення запису повідомлення в базі даних
                Notification.objects.create(recipient=post.author, actor=request.user, notification_type='post_like', post=post)
                # Надсилання повідомлення через Channels (real-time сповіщення)
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"notifications_{post.author.id}",
                    {
                        "type": "send_notification",
                        "notification": {
                            "type": "post_like",
                            "message": f"{request.user.display_name} лайкнув ваш пост",
                            "post_id": post.id,
                        }
                    }
                )
            
            return Response({
                "detail": "Лайк додано",
                "likes_count": post.likes.count()
            }, status=status.HTTP_201_CREATED)
            
        except Post.DoesNotExist:
            return Response(
                {"detail": "Пост не знайдено"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class MarkNotificationAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, recipient=request.user)
        except Notification.DoesNotExist:
            return Response({"error": "Повідомлення не знайдено."}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save()

        return Response({"message": "Повідомлення відзначене як прочитане."}, status=status.HTTP_200_OK)

class MarkAllNotificationsAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        notifications = Notification.objects.filter(recipient=request.user, is_read=False)
        notifications.update(is_read=True)
        return Response({"message": "Усі повідомлення відзначені як прочитані."}, status=status.HTTP_200_OK)