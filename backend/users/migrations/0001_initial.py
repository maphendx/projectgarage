# Generated by Django 5.1.4 on 2025-02-22 11:01

import users.models
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='UserHashtag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
            ],
            options={
                'verbose_name': 'Хештег користувача',
                'verbose_name_plural': 'Хештеги користувачів',
            },
        ),
        migrations.CreateModel(
            name='CustomUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('full_name', models.CharField(blank=True, max_length=100, null=True)),
                ('display_name', models.CharField(max_length=50, unique=True)),
                ('password', models.CharField(max_length=128)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('date_joined', models.DateTimeField(auto_now_add=True)),
                ('total_likes', models.PositiveIntegerField(default=0)),
                ('photo', models.ImageField(blank=True, default=users.models.get_random_avatar, null=True, upload_to='profile_photos/')),
                ('bio', models.TextField(blank=True, null=True)),
                ('ignored_users', models.ManyToManyField(blank=True, related_name='ignored_by', to=settings.AUTH_USER_MODEL)),
                ('subscriptions', models.ManyToManyField(blank=True, related_name='subscribers', to=settings.AUTH_USER_MODEL)),
                ('hashtags', models.ManyToManyField(to='users.userhashtag')),
            ],
            options={
                'verbose_name': 'Користувач',
                'verbose_name_plural': 'Користувачі',
            },
        ),
    ]
