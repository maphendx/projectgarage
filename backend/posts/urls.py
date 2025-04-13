from django.urls import path
from .views import (
                    PostListView, 
                    PostDetailView, 
                    CommentListView, 
                    CommentDetailView, 
                    RecommendedPostsView, 
                    RecentLikesView, 
                    LikeView, 
                    MarkNotificationAsReadView, 
                    MarkAllNotificationsAsReadView
                )
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Шляхи для постів
    path('posts/', PostListView.as_view(), name='post-list'),  # Список всіх постів
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),  # Деталі поста
    
    path('posts/recomendations/post/', RecommendedPostsView.as_view(), name='post-recommendation'),  # Рекомендації

    # Шляхи для коментарів
    path('posts/<int:post_id>/comments/', CommentListView.as_view(), name='comment-list'),  # Список всіх коментарів
    path('posts/<int:post_id>/comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),  # Деталі коментаря

    # Шляхи для історії лайкнутого
    path('history/likes/', RecentLikesView.as_view(), name='like-list'),

    # Шлях для лайкування поста
    path('posts/<int:post_id>/like/', LikeView.as_view(), name='post-like'),

    # Повідомлення для користувача несистемні  
    path('notifications/<int:notification_id>/read/', MarkNotificationAsReadView.as_view(), name='mark-notification-read'),
    path('notifications/read-all/', MarkAllNotificationsAsReadView.as_view(), name='mark-all-notifications-read'),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)  