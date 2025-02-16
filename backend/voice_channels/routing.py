from django.urls import path
from .consumers import VoiceSignalingConsumer

websocket_urlpatterns = [
    path('ws/voice/<str:room_name>/', VoiceSignalingConsumer.as_asgi()),
]