from PIL import Image
from moviepy import VideoFileClip
from pydub import AudioSegment
import os
from django.conf import settings
import io
from django.core.files import File

class MediaProcessor:
    def __init__(self):
        self.image_max_size = (1920, 1080)  # максимальний розмір зображення
        self.image_quality = 85  # якість стиснення JPEG
        self.video_max_size = (1280, 720)  # максимальна роздільна здатність відео
        self.audio_format = 'mp3'  # формат для конвертації аудіо
        self.audio_bitrate = '192k'  # бітрейт аудіо

    def process_image(self, image_file):
        """Обробка зображення: зміна розміру та стиснення"""
        try:
            img = Image.open(image_file)
            
            # Конвертуємо в RGB якщо потрібно
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Змінюємо розмір зі збереженням пропорцій
            img.thumbnail(self.image_max_size, Image.LANCZOS)
            
            # Зберігаємо оброблене зображення
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=self.image_quality, optimize=True)
            
            # Повертаємо як Django File об'єкт
            return File(output, name=os.path.splitext(image_file.name)[0] + '.jpg')
        except Exception as e:
            raise Exception(f"Помилка обробки зображення: {str(e)}")

    def process_video(self, video_file):
        """Обробка відео: створення превью та оптимізація"""
        try:
            temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', video_file.name)
            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            
            # Зберігаємо тимчасовий файл
            with open(temp_path, 'wb+') as destination:
                for chunk in video_file.chunks():
                    destination.write(chunk)
            
            # Обробляємо відео
            video = VideoFileClip(temp_path)
            
            # Створюємо превью
            thumbnail_path = os.path.splitext(temp_path)[0] + '_thumb.jpg'
            video.save_frame(thumbnail_path, t=1.0)  # Зберігаємо кадр на 1-й секунді
            
            # Змінюємо розмір відео якщо потрібно
            if video.size > self.video_max_size:
                video = video.resize(self.video_max_size)
            
            # Зберігаємо оброблене відео
            output_path = os.path.splitext(temp_path)[0] + '_processed.mp4'
            video.write_videofile(output_path, 
                                codec='libx264', 
                                audio_codec='aac',
                                preset='medium')
            
            # Очищаємо ресурси
            video.close()
            
            # Повертаємо оброблене відео та превью
            with open(output_path, 'rb') as video_file, open(thumbnail_path, 'rb') as thumb_file:
                processed_video = File(video_file)
                thumbnail = File(thumb_file)
                return processed_video, thumbnail
                
        except Exception as e:
            raise Exception(f"Помилка обробки відео: {str(e)}")
        finally:
            # Очищаємо тимчасові файли
            if os.path.exists(temp_path):
                os.remove(temp_path)
            if os.path.exists(output_path):
                os.remove(output_path)
            if os.path.exists(thumbnail_path):
                os.remove(thumbnail_path)

    def process_audio(self, audio_file):
        """Конвертація аудіо в MP3"""
        try:
            temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', audio_file.name)
            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            
            # Зберігаємо тимчасовий файл
            with open(temp_path, 'wb+') as destination:
                for chunk in audio_file.chunks():
                    destination.write(chunk)
            
            # Конвертуємо в MP3
            audio = AudioSegment.from_file(temp_path)
            output_path = os.path.splitext(temp_path)[0] + '.mp3'
            
            audio.export(output_path, 
                        format=self.audio_format,
                        bitrate=self.audio_bitrate)
            
            # Повертаємо оброблений аудіофайл
            with open(output_path, 'rb') as audio_file:
                return File(audio_file)
                
        except Exception as e:
            raise Exception(f"Помилка обробки аудіо: {str(e)}")
        finally:
            # Очищаємо тимчасові файли
            if os.path.exists(temp_path):
                os.remove(temp_path)
            if os.path.exists(output_path):
                os.remove(output_path)