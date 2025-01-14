from django.urls import path
from .views import UserRegistrationView, UserLoginView, UserProfileView, UserLogoutView, UserDeleteView, HashtagView, SubscriptionsView, UserSubscriptionsView, RecommendationView, UserProfileDetailView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('profile/', UserProfileView.as_view(), name='user-profile'), # свій профіль
    path('users/profile/<int:user_id>/', UserProfileDetailView.as_view(), name='user-profile-detail'), # чужий профіль  
    path('logout/', UserLogoutView.as_view(), name='user-logout'),  # Вихід з акаунту
    path('delete/', UserDeleteView.as_view(), name='user-delete'),  # Видалення акаунту
    path('hashtags/', HashtagView.as_view(), name='hashtag-view'),
    path('subscriptions/<int:user_id>', SubscriptionsView.as_view(), name='subscribe-view'),
    path('subscriptions/<int:user_id>/list/', UserSubscriptionsView.as_view(), name='user-subscribers-view'),
    path('recommendations/', RecommendationView.as_view(), name='user-recommendations'),
]

# Додавання статичних файлів (зображення)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)