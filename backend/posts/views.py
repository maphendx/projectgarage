from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Post, Comment
from rest_framework import status
from .serializers import PostSerializer, CommentSerializer

# Пост: список та деталі
class PostListView(APIView):
    permission_classes = (IsAuthenticated,)  # Доступ лише для авторизованих користувачів

    def get(self, request):
        posts = Post.objects.all()  # Отримуємо всі пости
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)

    def post(self, request):    
        serializer = PostSerializer(data=request.data)    
        if serializer.is_valid():    
            serializer.save()  # Створюємо новий пост
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Пост: деталі, оновлення, видалення
class PostDetailView(APIView):    
    def get(self, request, pk):    
        post = Post.objects.get(pk=pk)  # Отримуємо пост за ID
        serializer = PostSerializer(post)    
        return Response(serializer.data)

    def put(self, request, pk):    
        post = Post.objects.get(pk=pk)  # Оновлюємо пост
        serializer = PostSerializer(post, data=request.data)    
        if serializer.is_valid():    
            serializer.save()        
            return Response(serializer.data)
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
        return Response(serializer.data)

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
        return Response(serializer.data)

    def put(self, request, pk):
        comment = Comment.objects.get(pk=pk)  # Оновлюємо коментар
        serializer = CommentSerializer(comment, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        comment = Comment.objects.get(pk=pk)  # Видаляємо коментар
        comment.delete()
        return Response({"detail": "Коментар успішно видалено."}, status=status.HTTP_204_NO_CONTENT)
