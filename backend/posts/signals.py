from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from .models import Post, Notification, Comment
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from users.models import CustomUser

@receiver(post_save, sender=Post)
def notify_subscribers_on_new_post(sender, instance, created, **kwargs):
    if created:
        author = instance.author
        # яке повертає всіх користувачів, що підписані на автора.
        subscribers = author.subscribers.all()
        channel_layer = get_channel_layer()
        
        for subscriber in subscribers:
            # Створення запису повідомлення в базі даних
            Notification.objects.create(recipient=subscriber, actor=author, notification_type='new_post',post=instance)
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

@receiver(m2m_changed, sender=CustomUser.subscribers.through)
def notify_new_subscription(sender, instance, action, pk_set, **kwargs):
    """
    instance – користувач, на якого підписуються (тобто, він отримує нового підписника),
    pk_set – набір ID користувачів, які щойно підписалися.
    """
    if action == 'post_add':
        channel_layer = get_channel_layer()
        for subscriber_id in pk_set:
            try:
                subscriber = CustomUser.objects.get(pk=subscriber_id)
            except CustomUser.DoesNotExist:
                continue  # Якщо користувача не знайдено, пропускаємо
            Notification.objects.create(recipient=instance, actor=subscriber, notification_type='new_subscription')
            async_to_sync(channel_layer.group_send)(
                f"notifications_{instance.id}",
                {
                    "type": "send_notification",
                    "notification": {
                        "type": "new_subscription",
                        "message": f"{subscriber.display_name} підписався на вас"
                    }
                }
            )

@receiver(post_save, sender=Comment)
def notify_post_author_on_new_comment(sender, instance, created, **kwargs):
    if created:
        post = instance.post
        # Не надсилаємо сповіщення, якщо автор коментаря є автором поста
        if instance.author != post.author:
            Notification.objects.create(
                recipient=post.author,
                actor=instance.author,
                notification_type='new_comment',
                post=post
            )
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"notifications_{post.author.id}",
                {
                    "type": "send_notification",
                    "notification": {
                        "type": "new_comment",
                        "message": f"{instance.author.display_name} залишив коментар до вашого поста",
                        "post_id": post.id,
                    }
                }
            )
