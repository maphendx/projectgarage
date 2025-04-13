from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model

@database_sync_to_async
def get_user_from_token(token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        User = get_user_model()
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    """
    Мідлвейр для аутентифікації за допомогою JWT токена.
    Очікує, що JWT-токен буде переданий як параметр URL, наприклад:
    ws://example.com/ws/some_endpoint/?token=your_jwt_token
    """
    async def __call__(self, scope, receive, send):
        # Приклад отримання токена з заголовка sec-websocket-protocol
        token = None

        # Отримуємо токен з параметрів запиту
        query_string = parse_qs(scope['query_string'].decode())
        token = query_string.get('token', [None])[0]

        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()
        return await super().__call__(scope, receive, send)