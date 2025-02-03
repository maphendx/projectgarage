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
    path('messages/', MessageView.as_view(), name='create-message'),  # Add this line for message creation
    path('messages/<int:room_id>/', MessageView.as_view(), name='messages'),  # GET messages
    path('messages/<int:room_id>/send/', MessageView.as_view(), name='send-message'),  # POST messages
    path('messages/<int:message_id>/reaction/', ReactionView.as_view(), name='message-reaction'),
    path('emoji/', EmojiListView.as_view(), name='emoji-list'),
]
