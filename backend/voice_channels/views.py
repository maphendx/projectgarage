from django.shortcuts import render

from rest_framework.response import Response
from voice_channels.models import VoiceChannel
from voice_channels.serializers import InvitationSerializer, VoiceChannelSerializer
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

# Create your views here.
class oneVoice_channelView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            channel = VoiceChannel.objects.get(pk=pk)
            ret = VoiceChannelSerializer(channel)
            return Response(ret.data)
        except VoiceChannel.DoesNotExist:
            return Response({"detail": "Голосовий канал не знайдено"}, status=status.HTTP_404_NOT_FOUND)

class voice_channelView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = VoiceChannelSerializer(data=request.data)
        if serializer.is_valid():
            channel = serializer.save(creator=request.user)
            returning = VoiceChannelSerializer(channel)
            return Response(returning.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        list = VoiceChannel.objects.all()
        jsoned = VoiceChannelSerializer(list, many=True).data
        return Response(jsoned)
    
class voice_inviteView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InvitationSerializer(data=request.data)
        if serializer.is_valid():
            invitation = serializer.save(sender=request.user)

            channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"notifications_{post.author.id}",
                    {
                        "type": "send_notification",
                        "notification": {
                            "type": "post_like",
                            "message": f"{request.user.display_name} лайкнув ваш пост",
                            "post_id": post.id,
                        }
                    }
                )

            return Response(InvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)