"""
ASGI config for social_network_project project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django

# Встановлюємо змінну середовища для налаштувань Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_network_project.settings')
django.setup()  # Ініціалізація Django (завантаження додатків)

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from .jwt_auth import JWTAuthMiddleware  # замініть шлях на відповідний
import messaging.routing
import posts.routing
import voice_channels.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(
            messaging.routing.websocket_urlpatterns + posts.routing.websocket_urlpatterns + voice_channels.routing.websocket_urlpatterns
        )
    ),
})