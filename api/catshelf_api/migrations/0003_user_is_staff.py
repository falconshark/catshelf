# Generated by Django 5.1.7 on 2025-03-25 03:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catshelf_api', '0002_remove_user_is_admin_user_is_active_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_staff',
            field=models.BooleanField(default=False, verbose_name='is_staff'),
        ),
    ]
