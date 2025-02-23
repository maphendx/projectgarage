from django.urls import path
from .views import (
                    TokenRefreshView, 
                    UserRegistrationView, 
                    UserLoginView, 
                    UserProfileView, 
                    UserLogoutView, 
                    UserDeleteView, 
                    HashtagView, 
                    SubscriptionsView, 
                    UserSubscriptionsView, 
                    UserProfileDetailView, 
                    SearchView, 
                    GoogleAuthView,
                    RecommendedUsersView,
                    IgnoreUserView
                    )
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),  # Свій профіль
    path('profile/<int:pk>/', UserProfileDetailView.as_view(), name='user-profile-detail'),  # Чужий профіль  
    path('logout/', UserLogoutView.as_view(), name='user-logout'),  # Вихід з акаунту
    path('delete/', UserDeleteView.as_view(), name='user-delete'),  # Видалення акаунту
    path('hashtags/', HashtagView.as_view(), name='hashtag-view'),
    path('subscriptions/<int:user_id>/', SubscriptionsView.as_view(), name='subscribe-view'),
    path('subscriptions/<int:user_id>/delete/', SubscriptionsView.as_view(), name='unsubscribe-view'),  # Додано маршрут для відписки
    path('subscriptions/<int:user_id>/list/', UserSubscriptionsView.as_view(), name='user-subscribers-view'),
    path('search/', SearchView.as_view(), name='search'),
    path('search/users/', SearchView.as_view(), name='search-users'),
    path('search/posts/', SearchView.as_view(), name='search-posts'),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/Recommendation/', RecommendedUsersView.as_view(), name='Users-Recommendation'),
    path('ignore/<int:user_id>/', IgnoreUserView.as_view(), name='ignore-user'),  # Додано маршрут для ігнорування
]

# Додавання статичних файлів (зображення)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)