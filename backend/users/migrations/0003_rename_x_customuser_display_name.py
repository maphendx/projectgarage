# Generated by Django 5.1.4 on 2024-12-12 12:59

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_rename_display_name_customuser_x_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='customuser',
            old_name='x',
            new_name='display_name',
        ),
    ]
