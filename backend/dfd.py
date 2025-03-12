from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import User
from diagrams.onprem.database import PostgreSQL
from diagrams.onprem.inmemory import Redis
from diagrams.onprem.queue import RabbitMQ
from diagrams.aws.network import APIGateway
from diagrams.custom import Custom
from diagrams.onprem.network import Nginx

# ✨ Налаштування стилів ✨
graph_attr = {
    "fontsize": "20",
    "bgcolor": "#F5F5F5",
    "pad": "0.5",
    "splines": "spline",
}

node_attr = {
    "fontsize": "14",           # Шрифт для видимості
    "style": "rounded,filled",
    "fillcolor": "#FFFFFF",
    "width": "2.0",             # Компактна ширина
    "height": "1.2",            # Висота для вертикального центрування
    "fixedsize": "true",        # Фіксований розмір вузлів
}

# 🌟 Діаграма 🌟
with Diagram(
    "Детальна DFD рівня 1",
    show=False,
    direction="TB",
    filename="dfd_level_1_vertical_center",
    graph_attr=graph_attr,
    node_attr=node_attr
):
    # 🌍 Зовнішні сутності
    user = User("Користувач", fillcolor="#FFD700")
    suno_api = Custom("Suno API", "./suno_icon.png", fillcolor="#87CEEB")

    # 🚀 Проксі
    nginx = Nginx("Nginx", fillcolor="#98FB98")

    # 🗄️ Сховища
    db = PostgreSQL("PostgreSQL", fillcolor="#FF6347")
    redis = Redis("Redis", fillcolor="#FFA500")
    rabbitmq = RabbitMQ("RabbitMQ", fillcolor="#DDA0DD")

    # ⚙️ Django додаток
    with Cluster("Django", graph_attr={"bgcolor": "#E6E6FA"}):
        # 👤 Користувачі
        with Cluster("Користувачі", graph_attr={"bgcolor": "#ADD8E6"}):
            auth = APIGateway("Auth", fillcolor="#4682B4")
            profile = APIGateway("Профіль", fillcolor="#4682B4")
            hashtags = APIGateway("Хештеги", fillcolor="#4682B4")

        # 📝 Контент
        with Cluster("Контент", graph_attr={"bgcolor": "#90EE90"}):
            posts = APIGateway("Пости", fillcolor="#32CD32")
            comments = APIGateway("Коментарі", fillcolor="#32CD32")
            likes = APIGateway("Лайки", fillcolor="#32CD32")

        # 🎙️ Голосові канали
        with Cluster("Голос", graph_attr={"bgcolor": "#FFB6C1"}):
            voice = APIGateway("Канали", fillcolor="#FF69B4")
            invites = APIGateway("Запрошення", fillcolor="#FF69B4")

        # 💬 Чати
        with Cluster("Чати", graph_attr={"bgcolor": "#D3D3D3"}):
            chats = APIGateway("Чат", fillcolor="#808080")
            reactions = APIGateway("Реакції", fillcolor="#808080")

        # 🎵 Музика
        with Cluster("Музика", graph_attr={"bgcolor": "#FFFFE0"}):
            music = APIGateway("Генерація", fillcolor="#FFD700")
            callback = APIGateway("Callback", fillcolor="#FFD700")
            songs = APIGateway("Пісні", fillcolor="#FFD700")

    # 🌐 Потоки даних
    user >> Edge(label="Запити", color="#0000FF", style="bold") >> nginx
    nginx >> Edge(label="Маршрути", color="#0000FF", style="bold") >> [auth, profile, posts, voice, chats, music]

    # 👤 Користувачі
    user >> Edge(label="Логін", color="#4682B4") >> auth >> Edge(label="Токени", color="#4682B4") >> user
    auth >> Edge(label="Дані", color="#FF6347") >> db
    user >> Edge(label="Профіль", color="#4682B4") >> profile >> Edge(label="Дані", color="#4682B4") >> user
    profile >> Edge(label="Підписки", color="#FF6347") >> db
    user >> Edge(label="Хештеги", color="#4682B4") >> hashtags >> Edge(label="Список", color="#4682B4") >> user
    hashtags >> Edge(label="Дані", color="#FF6347") >> db

    # 📝 Контент
    user >> Edge(label="Пости", color="#32CD32") >> posts >> Edge(label="Дані", color="#32CD32") >> user
    posts >> Edge(label="Дані", color="#FF6347") >> db
    user >> Edge(label="Коментарі", color="#32CD32") >> comments >> Edge(label="Список", color="#32CD32") >> user
    comments >> Edge(label="Дані", color="#FF6347") >> db
    user >> Edge(label="Лайки", color="#32CD32") >> likes >> Edge(label="Кількість", color="#32CD32") >> user
    likes >> Edge(label="Дані", color="#FF6347") >> db
    likes >> Edge(label="Сповіщення", color="#FFA500") >> redis >> Edge(label="WebSocket", color="#FFA500") >> user

    # 🎙️ Голосові канали
    user >> Edge(label="Канали", color="#FF69B4") >> voice >> Edge(label="Дані", color="#FF69B4") >> user
    voice >> Edge(label="Дані", color="#FF6347") >> db
    voice >> Edge(label="Сповіщення", color="#FFA500") >> redis >> Edge(label="WebSocket", color="#FFA500") >> user
    user >> Edge(label="Запрошення", color="#FF69B4") >> invites >> Edge(label="Статус", color="#FF69B4") >> user
    invites >> Edge(label="Дані", color="#FF6347") >> db
    invites >> Edge(label="Сповіщення", color="#FFA500") >> redis

    # 💬 Чати
    user >> Edge(label="Повідомлення", color="#808080") >> chats >> Edge(label="Дані", color="#808080") >> user
    chats >> Edge(label="Дані", color="#FF6347") >> db
    chats >> Edge(label="Чат", color="#FFA500") >> redis >> Edge(label="WebSocket", color="#FFA500") >> user
    user >> Edge(label="Реакції", color="#808080") >> reactions >> Edge(label="Список", color="#808080") >> user
    reactions >> Edge(label="Дані", color="#FF6347") >> db

    # 🎵 Музика
    user >> Edge(label="Генерація", color="#FFD700") >> music >> Edge(label="Task ID", color="#FFD700") >> user
    music >> Edge(label="Дані", color="#FF6347") >> db
    music >> Edge(label="Запит", color="#87CEEB") >> suno_api
    suno_api >> Edge(label="Callback", color="#87CEEB") >> callback
    callback >> Edge(label="Пісні", color="#FF6347") >> db
    user >> Edge(label="Пісні", color="#FFD700") >> songs >> Edge(label="Дані", color="#FFD700") >> user
    songs >> Edge(label="Видимість", color="#FF6347") >> db
    music >> Edge(label="Задачі", color="#DDA0DD") >> rabbitmq >> Edge(label="Обробка", color="#DDA0DD") >> callback

    # Зворотні зв’язки
    db >> Edge(label="Дані", color="#FF6347", style="dashed") >> [
        auth, profile, posts, comments, likes, voice, invites, chats, reactions, songs
    ]
    redis >> Edge(label="Сповіщення", color="#FFA500", style="dashed") >> user

# 🎉 Завершення
print("✨ Діаграма готова: dfd_level_1_vertical_center.png ✨")