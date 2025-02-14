from django.urls import re_path
from .consumers import VoiceConsumer, VoiceSignalingConsumer

websocket_urlpatterns = [
    re_path(r'ws/voice/(?P<room_name>\w+)/$', VoiceConsumer.as_asgi()),
    re_path(r'ws/signaling/$', VoiceSignalingConsumer.as_asgi()),
]