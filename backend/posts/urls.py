from django.urls import path
from .views import PostListView, PostDetailView, CommentListView, CommentDetailView

urlpatterns = [
    # Шляхи для постів
    path('posts/', PostListView.as_view(), name='post-list'),  # Список всіх постів
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),  # Деталі поста

    # Шляхи для коментарів
    path('comments/', CommentListView.as_view(), name='comment-list'),  # Список всіх коментарів
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),  # Деталі коментаря
]
