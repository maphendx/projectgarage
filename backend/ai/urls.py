from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.generate_audio, name='generate_audio'),
    path('generate/extend/', views.extend_audio, name='extend_audio'),
    path('generate/record-info/', views.get_generate_record, name='get_generate_record'),
    path('credit/', views.get_credit, name='get_credit'),
    path('lyrics/', views.generate_lyrics, name='generate_lyrics'),
    path('lyrics/record-info/', views.get_lyrics_record, name='get_lyrics_record'),
    path('wav/generate/', views.generate_wav, name='generate_wav'),
    path('wav/record-info/', views.get_wav_record, name='get_wav_record'),
    path('callback/', views.callback, name='callback'),
    path('', views.home, name='home'),
]