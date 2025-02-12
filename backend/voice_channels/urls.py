

from django.urls import path

from voice_channels.views import oneVoice_channelView, voice_channelView, voice_inviteView


urlpatterns = [
    path("voice_channels/", voice_channelView.as_view()),
    path("voice_channels/<int:pk>/", oneVoice_channelView.as_view()),
    path("invite/", voice_inviteView.as_view())
]