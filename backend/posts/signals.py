from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Post, Notification
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(post_save, sender=Post)
def notify_subscribers_on_new_post(sender, instance, created, **kwargs):
    if created:
        author = instance.author
        # Припускаємо, що у вас є поле (наприклад, subscribers)
        # яке повертає всіх користувачів, що підписані на автора.
        subscribers = author.subscribers.all()
        channel_layer = get_channel_layer()
        
        for subscriber in subscribers:
            # Створення запису повідомлення в базі даних
            Notification.objects.create(
                recipient=subscriber,
                actor=author,
                notification_type='new_post',
                post=instance
            )
            # Надсилання сповіщення через Channels (для real-time повідомлень)
            async_to_sync(channel_layer.group_send)(
                f"notifications_{subscriber.id}",
                {
                    "type": "send_notification",
                    "notification": {
                        "type": "new_post",
                        "message": f"{author.display_name} створив новий пост",
                        "post_id": instance.id,
                    }
                }
            )