from django.urls import path
from .views import PostListView, PostDetailView, CommentListView, CommentDetailView, RecommendedPostsView, RecentLikesView

urlpatterns = [
    # Шляхи для постів
    path('posts/', PostListView.as_view(), name='post-list'),  # Список всіх постів
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),  # Деталі поста
    path('posts/recomendations/', RecommendedPostsView.as_view(), name='post-recommendation'),  # Рекомендації

    # Шляхи для коментарів
    path('posts/<int:post_id>/comments/', CommentListView.as_view(), name='comment-list'),  # Список всіх коментарів
    path('posts/<int:post_id>/comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),  # Деталі коментаря
    
    # Шляхи для історії лайкнутого
    path('history/likes/', RecentLikesView.as_view(), name='like-list'),
]
