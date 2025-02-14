from django.urls import path
from .views import UploadMusicView, ModifyMusicView

urlpatterns = [
    path('upload/', UploadMusicView.as_view(), name='upload-music'),
    path('modify/', ModifyMusicView.as_view(), name='modify-music'),
]