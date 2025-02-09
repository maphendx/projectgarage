from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/voice/<str:room_name>/', consumers.VoiceConsumer.as_asgi()),
]