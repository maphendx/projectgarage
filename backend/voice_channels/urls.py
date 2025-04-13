from django.urls import path

from voice_channels.views import oneVoice_channelView, voice_channelView, sendInvitationView, respondInvitationView, myVoicesView


urlpatterns = [
    path("voice_channels/", voice_channelView.as_view()),
    path("voice_channels/<int:pk>/", oneVoice_channelView.as_view()),
    path("<int:pk>/invite/", sendInvitationView.as_view()),
    path("<int:pk>/respond/", respondInvitationView.as_view()),
    path("my-channels/", myVoicesView.as_view())
]