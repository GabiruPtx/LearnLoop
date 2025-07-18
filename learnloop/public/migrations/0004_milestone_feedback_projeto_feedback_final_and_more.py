# Generated by Django 5.2.1 on 2025-06-25 06:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('public', '0003_milestone_nota'),
    ]

    operations = [
        migrations.AddField(
            model_name='milestone',
            name='feedback',
            field=models.TextField(blank=True, help_text='Feedback do professor sobre o milestone.', null=True),
        ),
        migrations.AddField(
            model_name='projeto',
            name='feedback_final',
            field=models.TextField(blank=True, help_text='Feedback final do professor sobre o projeto.', null=True),
        ),
        migrations.AlterField(
            model_name='milestone',
            name='nota',
            field=models.IntegerField(blank=True, help_text='Nota inteira atribuída ao milestone, de 0 a 10.', null=True),
        ),
    ]
