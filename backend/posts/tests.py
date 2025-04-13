# import json
# import os
# from faker import Faker
# from django.core.management.color import no_style
# from django.db import connection
# from users.persistent_test_case import PersistentTestCase
# from .models import CustomUser, Post, Hashtag
# from users.models import UserHashtag

# class UserPopulationTest(PersistentTestCase):
#     def setUp(self):
#         """
#         Оновлюємо послідовність id для CustomUser, Post, Hashtag та UserHashtag,
#         щоб уникнути конфліктів з первинним ключем при створенні нових записів.
#         """
#         sequence_sql = connection.ops.sequence_reset_sql(no_style(), [CustomUser, Post, Hashtag, UserHashtag])
#         with connection.cursor() as cursor:
#             for sql in sequence_sql:
#                 cursor.execute(sql)


#     def test_create_users_with_minimum_hashtags_and_posts(self):
#         """
#         Цей тест заповнює базу даних імітуючими користувачами з унікальними іменами.
#         Для кожного користувача додається мінімум 5 унікальних постів з 3 унікальними хештегами.
#         Дані, створені тестом, зберігаються в реальній базі даних після виконання тестів,
#         а також записуються у файл media/test/User.json.
#         """
#         fake = Faker()
#         num_users = 10  # Кількість користувачів для створення
#         created_users_data = []

#         for _ in range(num_users):
#             # Генерувати унікальні дані для користувача
#             email = fake.unique.email()
#             display_name = fake.unique.user_name()
#             full_name = fake.name()
#             password = "TestPassword123!"

#             # Створити користувача через кастомний менеджер
#             user = CustomUser.objects.create_user(
#                 email=email,
#                 display_name=display_name,
#                 password=password,
#                 full_name=full_name
#             )

#             # Додати мінімум 5 унікальних постів
#             for _ in range(5):
#                 post_content = fake.text(max_nb_chars=200)
#                 post = Post.objects.create(
#                     author=user,
#                     content=post_content
#                 )

#                 # Додати 3 унікальних хештеги до поста
#                 added_hashtags = set()
#                 while len(added_hashtags) < 3:
#                     hashtag_name = '#' + fake.word()
#                     if hashtag_name not in added_hashtags:
#                         added_hashtags.add(hashtag_name)
#                         # Створюємо або отримуємо хештег
#                         hashtag, created = Hashtag.objects.get_or_create(name=hashtag_name)
#                         post.hashtags.add(hashtag)  # Додаємо хештег до поста

#             # Зберігаємо інформацію про користувача для запису у файл
#             created_users_data.append({
#                 "email": email,
#                 "display_name": display_name,
#                 "full_name": full_name,
#                 "password": password,
#                 "hashtags": list(user.hashtags.values_list('name', flat=True)),
#                 "posts": list(Post.objects.filter(author=user).values('content', 'hashtags'))
#             })

#         # Додатково можна вивести кількість створених користувачів
#         total_users = CustomUser.objects.count()
#         print(f"Створено користувачів: {total_users}")

#         # Записуємо всі дані, введені в тесті, у файл media/test/User.json
#         file_path = os.path.join("media", "test", "User.json")
#         os.makedirs(os.path.dirname(file_path), exist_ok=True)
#         with open(file_path, "w", encoding="utf-8") as json_file:
#             json.dump(created_users_data, json_file, ensure_ascii=False, indent=4)
