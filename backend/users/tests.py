from faker import Faker
from django.core.management.color import no_style
from django.db import connection
from .persistent_test_case import PersistentTestCase
from .models import CustomUser

class UserPopulationTest(PersistentTestCase):
    def setUp(self):
        """
        Оновлюємо послідовність id для CustomUser,
        щоб уникнути конфліктів з первинним ключем при створенні нових записів.
        """
        sequence_sql = connection.ops.sequence_reset_sql(no_style(), [CustomUser])
        with connection.cursor() as cursor:
            for sql in sequence_sql:
                cursor.execute(sql)

    def test_create_users_with_minimum_hashtags(self):
        """
        Цей тест заповнює базу даних імітуючими користувачами з унікальними іменами.
        Для кожного користувача додається мінімум 5 унікальних хештегів (з початковим символом '#').
        Дані, створені тестом, зберігаються в реальній базі даних після виконання тестів.
        """
        fake = Faker()
        num_users = 100  # Кількість користувачів для створення

        for _ in range(num_users):
            # Генерувати унікальні дані для користувача
            email = fake.unique.email()
            display_name = fake.unique.user_name()
            full_name = fake.name()
            password = "TestPassword123!"

            # Створити користувача через кастомний менеджер
            user = CustomUser.objects.create_user(
                email=email,
                display_name=display_name,
                password=password,
                full_name=full_name
            )

            # Додати мінімум 5 унікальних хештегів, які починаються з '#'
            added_hashtags = set()
            while len(added_hashtags) < 5:
                hashtag = '#' + fake.word()
                if hashtag not in added_hashtags:
                    try:
                        user.add_hashtag(hashtag)
                        added_hashtags.add(hashtag)
                    except Exception:
                        # Якщо хештег вже додано до користувача,
                        # продовжуємо генерацію наступного хештегу.
                        continue

            # Перевірка, що користувач має щонайменше 5 хештегів
            assert user.hashtags.count() >= 5, "Користувач повинен мати мінімум 5 хештегів."
            # Збереження користувача (якщо потрібно)
            user.save()

        # Додатково можна вивести кількість створених користувачів
        total_users = CustomUser.objects.count()
        print(f"Створено користувачів: {total_users}")