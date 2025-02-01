from django.urls import path
from .views import (
    ChatRoomView,
    MessageView,
    AddParticipantView,
    ChatRoomAvatarView,
    ReactionView,
    EmojiListView
)

urlpatterns = [
    path('chatrooms/', ChatRoomView.as_view(), name='chatrooms'),
    path('chatrooms/<int:room_id>/add_user/', AddParticipantView.as_view(), name='add-participant'),
    path('chatrooms/<int:room_id>/avatar/', ChatRoomAvatarView.as_asgi() if hasattr(ChatRoomAvatarView, 'as_asgi') else ChatRoomAvatarView.as_view(), name='chatroom-avatar'),
    path('messages/<int:room_id>/', MessageView.as_view(), name='messages'),
    path('messages/<int:message_id>/reaction/', ReactionView.as_view(), name='message-reaction'),
    path('emoji/', EmojiListView.as_view(), name='emoji-list'),
]
