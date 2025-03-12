from django.urls import path
from . import views

urlpatterns = [
    path('generate/audio/', views.generate_audio, name='generate_audio'),
    path('generate/extend/', views.extend_audio, name='extend_audio'),
    path('generate/lyrics/', views.generate_lyrics, name='generate_lyrics'),
    path('generate/wav/', views.generate_wav, name='generate_wav'),
    path('callback/', views.callback, name='callback'),
    path('songs/', views.list_user_songs, name='list_user_songs'),
    path('public/songs/', views.list_public_songs, name='list_public_songs'),
    path('task/', views.get_generate_record, name='get_generate_record'),
    path('lyrics-task/', views.get_lyrics_record, name='get_lyrics_record'),
    path('wav-task/', views.get_wav_record, name='get_wav_record'),
    path('credit/', views.get_credit, name='get_credit'),
    path('songs/<int:song_id>/visibility/', views.update_song_visibility, name='update_song_visibility'),
    path('lyrics/', views.list_user_lyrics, name='list_user_lyrics'),
    path('lyrics/<int:lyrics_id>/', views.get_lyrics, name='get_lyrics'),
    path('lyrics/<int:lyrics_id>/visibility/', views.update_lyrics_visibility, name='update_lyrics_visibility'),
    path('lyrics/associate/', views.associate_lyrics_with_song, name='associate_lyrics_with_song'),
    path('public/lyrics/', views.list_public_lyrics, name='list_public_lyrics'),
]