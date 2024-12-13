from django.urls import path
from .views import UserRegistrationView, UserLoginView
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)    