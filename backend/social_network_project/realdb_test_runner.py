from django.test.runner import DiscoverRunner

class RealDBTestRunner(DiscoverRunner):
    def setup_databases(self, **kwargs):
        # Повертаємо порожній словник, щоб Django використовувала реальну базу даних,
        # а не створювала тимчасову тестову базу.
        return {}

    def teardown_databases(self, old_config, **kwargs):
        # Не видаляємо базу після тестів, залишаючи всі створені дані.
        pass