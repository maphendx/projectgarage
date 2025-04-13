from django.test import TransactionTestCase

class PersistentTestCase(TransactionTestCase):
    # Використовуємо TransactionTestCase, щоб не використовувати автоматичну обгортку кожного тесту у транзакцію,
    # що дозволяє зберегти зміни після тестів.
    reset_sequences = True

    @classmethod
    def _fixture_teardown(cls):
        # Перевизначення методу для запобігання очищенню бази даних після завершення тестів.
        pass 