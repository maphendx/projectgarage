"""
URL configuration for social_network_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls), # адмінка ТРЕБА ПЕРЕРОБИТИ НА КАСТОМНИЙ
    path('api/users/', include('users.urls')),
    path('api/posts/', include('posts.urls')),
    path('api/messaging/', include('messaging.urls')),
    #path('api/voice-channels/', include('voice_channels.urls')),
    #path('api/ai/', include('ai.urls')),
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)    
