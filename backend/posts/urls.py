from django.urls import path
<<<<<<< HEAD
from .views import PostListView, PostDetailView, CommentListView, CommentDetailView, RecommendedPostsView, RecentLikesView, LikeView
from django.conf import settings
from django.conf.urls.static import static
=======
from .views import PostListView, PostDetailView, CommentListView, CommentDetailView
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f

urlpatterns = [
    # Шляхи для постів
    path('posts/', PostListView.as_view(), name='post-list'),  # Список всіх постів
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),  # Деталі поста
<<<<<<< HEAD
    path('posts/recomendations/', RecommendedPostsView.as_view(), name='post-recommendation'),  # Рекомендації

    # Шляхи для коментарів
    path('posts/<int:post_id>/comments/', CommentListView.as_view(), name='comment-list'),  # Список всіх коментарів
    path('posts/<int:post_id>/comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),  # Деталі коментаря
    
    # Шляхи для історії лайкнутого
    path('history/likes/', RecentLikesView.as_view(), name='like-list'),
    # Шлях для лайкування поста
    path('posts/<int:post_id>/like/', LikeView.as_view(), name='post-like'),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)  
=======

    # Шляхи для коментарів
    path('comments/', CommentListView.as_view(), name='comment-list'),  # Список всіх коментарів
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),  # Деталі коментаря
]
>>>>>>> 097572a9b26d0de8d5f2cac76cb8430959a6088f
