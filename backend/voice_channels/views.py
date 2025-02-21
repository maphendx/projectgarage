from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.response import Response
from voice_channels.models import Invitation, VoiceChannel
from voice_channels.serializers import InvitationSerializer, VoiceChannelSerializer
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

# Create your views here.
class oneVoice_channelView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            channel = request.user.voice_chats.get(pk=pk)
            ret = VoiceChannelSerializer(channel)
            return Response(ret.data)
        except VoiceChannel.DoesNotExist:
            return Response({"detail": "Голосовий канал не знайдено, або вас до нього не додано"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            channel = request.user.voice_chats.get(pk=pk)
            if channel.creator == request.user:
                channel.delete()
                return Response({"message": "Голосовий канал успішно видалено!"})
            else:
                raise VoiceChannel.DoesNotExist
        except VoiceChannel.DoesNotExist:
            return Response({"detail": "Голосовий канал не знайдено, або у вас недостатньо прав для цієї дії"}, status=status.HTTP_404_NOT_FOUND)

class myVoicesView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            voices = request.user.voice_chats.all()
            voices_data = VoiceChannelSerializer(voices, many=True).data
            return Response(voices_data)
        except VoiceChannel.DoesNotExist:
            return Response({"detail": "Помилка!"}, status=status.HTTP_400_BAD_REQUEST)

class voice_channelView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = VoiceChannelSerializer(data=request.data)
        if serializer.is_valid():
            channel = serializer.save(creator=request.user)
            channel.participants.add(request.user)
            returning = VoiceChannelSerializer(channel)
            return Response(returning.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        channels = request.user.voice_chats
        channels_data = VoiceChannelSerializer(channels, many=True).data
        return Response(channels_data)        

class invitationView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invitations = Invitation.objects.all()
        channels_data = InvitationSerializer(invitations, many=True).data
        return Response(channels_data)
    

class oneInvitationView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            channel = Invitation.objects.get(pk=pk)
            ret = InvitationSerializer(channel)
            return Response(ret.data)
        except Invitation.DoesNotExist:
            return Response({"detail": "Запрошення не знайдено"}, status=status.HTTP_404_NOT_FOUND)


class respondInvitationView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            invitation = Invitation.objects.get(pk=pk)
            if invitation.status == "pending":
                if request.data["status"] == "accepted":    
                    invitation.status = "accepted"
                    voice_channel = invitation.voice_channel
                    user = request.user
                    voice_channel.participants.add(user)
                    return Response({"detail": "Запрошення успішно прийнято"})
                elif request.data["status"] == "rejected":    
                    invitation.status = "rejected"
                    return Response({"detail": "Запрошення успішно відхилено"})
            else:
                return Response({"detail": "Запрошення уже відхилено"}, status=status.HTTP_400_BAD_REQUEST)
        except Invitation.DoesNotExist:
            return Response({"detail": "Запрошення не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        
class sendInvitationView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            voice_channel = request.user.voice_chats.get(pk=pk)
            serializer = InvitationSerializer(data=request.data)
            if serializer.is_valid():
                invitation = serializer.save(sender=request.user, voice_channel=voice_channel)

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
        except VoiceChannel.DoesNotExist:
            return Response({"detail": "Ви не можете запросити користувача до голосового чату, до якого не належите"}, status=status.HTTP_400_BAD_REQUEST)