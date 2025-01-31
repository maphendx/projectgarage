from django.urls import path
from .views import ChatRoomView, MessageView

urlpatterns = [
    path('chatrooms/', ChatRoomView.as_view(), name='chatrooms'),
    path('messages/<int:room_id>/', MessageView.as_view(), name='messages'),
]