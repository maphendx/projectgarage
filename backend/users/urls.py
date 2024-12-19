from django.urls import path
from .views import UserRegistrationView, UserLoginView, UserProfileView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
	path('profile/', UserProfileView.as_view(), name='user-profile'), 
]

# If you're serving media files in development:
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)