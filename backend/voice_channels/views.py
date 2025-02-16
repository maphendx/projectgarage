from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
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
        channels = VoiceChannel.objects.all()
        channels_data = VoiceChannelSerializer(channels, many=True).data
        return Response(channels_data)
    
class voice_inviteView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InvitationSerializer(data=request.data)
        if serializer.is_valid():
            invitation = serializer.save(sender=request.user)

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"notifications_{invitation.recipient.id}",
                {
                    "type": "send_notification",
                    "notification": {
                        "type": "voice_invite",
                        "message": f"{invitation.sender.display_name} запрошує вас в голосовий канал",
                        "invitation_id": invitation.id,
                        "channel_id": invitation.voice_channel.id
                    }
                }
            )

            return Response(InvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)