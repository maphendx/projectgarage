from django.urls import path
from .views import UserRegistrationView, UserLoginView, UserProfileView, UserLogoutView, UserDeleteView, HashtagView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('logout/', UserLogoutView.as_view(), name='user-logout'),  # Вихід з акаунту
    path('delete/', UserDeleteView.as_view(), name='user-delete'),  # Видалення акаунту
    path('hashtags/', HashtagView.as_view(), name='hashtag-view'),
]


# If you're serving media files in development:
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)