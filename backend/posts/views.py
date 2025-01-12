from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Post, Comment, Like
from rest_framework import status
from .serializers import PostSerializer, CommentSerializer
from django.db.models import Q, Count 
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import timedelta
from django.utils.timezone import now
from users.models import CustomUser

# Пост: список та деталі
class PostListView(APIView):
    permission_classes = (IsAuthenticated,)  # Доступ лише для авторизованих користувачів

    def get(self, request):
        posts = Post.objects.all()  # Отримуємо всі пости
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data , status=status.HTTP_200_OK)

    def post(self, request):    
        data = request.data.copy()  # Копіюємо дані з запиту
        data['author'] = request.user.id  # Додаємо ID автора (я тут протупив,без цих двох рядків програма на бачила який користувач створив пост)
        
        if 'original_post' in data:  # Перевіряємо, чи є ID оригінального поста
            try:
                original_post = Post.objects.get(pk=data['original_post'])
                data ['content'] = data.get('content', '') + f'\n\nОригінальний пост: {original_post.content}'
            except Post.DoesNotExist:
                return Response({"detail": "Оригінальний пост не знайдено."}, status=status.HTTP_404_NOT_FOUND)
            # Перевіряємо, чи це не оригінальний пост
            if original_post.original_post is not None:
                return Response({"detail": "Це не оригінальний пост."}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = PostSerializer(data=request.data)    
        if serializer.is_valid():    
            serializer.save()  # Створюємо новий пост
            return Response(serializer.data , status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Пост: деталі, оновлення, видалення
class PostDetailView(APIView):    
    def get(self, request, pk):    
        post = Post.objects.get(pk=pk)  # Отримуємо пост за ID
        serializer = PostSerializer(post)    
        return Response(serializer.data , status=status.HTTP_200_OK)

    def put(self, request, pk):    
        post = Post.objects.get(pk=pk)  # Оновлюємо пост
        serializer = PostSerializer(post, data=request.data)    
        if serializer.is_valid():    
            serializer.save()        
            return Response(serializer.data , status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):    
        post = Post.objects.get(pk=pk)  # Видаляємо пост
        post.delete()    
        return Response({"detail": "Пост успішно видалено."}, status=status.HTTP_204_NO_CONTENT)

# Коментарі: список та створення
class CommentListView(APIView):
    def get(self, request):
        comments = Comment.objects.all()  # Отримуємо всі коментарі
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data , status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CommentSerializer(data=request.data)  # Створюємо новий коментар
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Коментарі: деталі, оновлення, видалення
class CommentDetailView(APIView):
    def get(self, request, pk):
        comment = Comment.objects.get(pk=pk)  # Отримуємо коментар
        serializer = CommentSerializer(comment)
        return Response(serializer.data , status=status.HTTP_200_OK)

    def put(self, request, pk):
        comment = Comment.objects.get(pk=pk)  # Оновлюємо коментар
        serializer = CommentSerializer(comment, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data , status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        comment = Comment.objects.get(pk=pk)  # Видаляємо коментар
        comment.delete()
        return Response({"detail": "Коментар успішно видалено."}, status=status.HTTP_204_NO_CONTENT)


class RecommendedPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def calculate_content_similarity(self, post_content, user_interests):
        """Підрахунок схожості контенту постів і інтересів користувача."""
        vectorizer = TfidfVectorizer()
        vectors = vectorizer.fit_transform([post_content] + user_interests)
        similarity = cosine_similarity(vectors[0:1], vectors[1:])
        return similarity.mean()

    def get(self, request):
        """
        Повертає список рекомендованих постів для користувача, складений з репостів від підписок,
        популярних постів, постів з релевантними хештегами та адаптивних рекомендацій на основі текстової схожості.
        """
        user = request.CustomUser

        # Отримуємо підписки користувача
        subscriptions = user.subscriptions.all()

        # Репости від підписок
        reposts_from_subscriptions = Post.objects.filter(
            original_post__isnull=False,
            author__in=subscriptions
        )

        # Популярні пости (на основі взаємодій)
        popular_posts = Post.objects.annotate(
            engagement_score=(Count('likes') + Count('post_comments') * 2 + Count('original_post') * 3)
        ).filter(engagement_score__gte=50).order_by('-engagement_score')

        # Пости з релевантними хештегами
        relevant_hashtags = user.hashtags.all()
        posts_with_relevant_hashtags = Post.objects.filter(hashtags__in=relevant_hashtags)

        # Адаптивні рекомендації на основі текстової схожості
        user_interests = [tag.name for tag in relevant_hashtags]
        adaptive_recommendations = []
        for post in Post.objects.all():
            similarity_score = self.calculate_content_similarity(post.content, user_interests)
            if similarity_score > 0.3:  # Поріг схожості (бажано ставити більше, але поки це тестова система буде така)
                adaptive_recommendations.append(post)

        # Об'єднання всіх рекомендацій
        recommended_posts = (reposts_from_subscriptions | popular_posts | posts_with_relevant_hashtags | Post.objects.filter(id__in=[post.id for post in adaptive_recommendations])).distinct()

        # Сериалізація та повернення результату
        serializer = PostSerializer(recommended_posts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK) 


class RecentLikesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        recent_likes = Like.objects.filter(
            liked_at__gte=now() - timedelta(days=7),
            user=request.user
        ).select_related('post')
        
        posts = [like.post for like in recent_likes]
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)