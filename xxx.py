import os

# Список папок, вміст яких слід ігнорувати
IGNORED_FOLDERS = {'.venv', 'node_modules', 'staticfiles', 'migrations', '__pycache__', 'venv', 'client', '.git'}

def print_tree(start_path, prefix=""):
    # Перевірка, чи існує шлях
    if not os.path.exists(start_path):
        print(f"Error: Path '{start_path}' does not exist.")
        return

    # Отримання списку файлів і папок
    items = os.listdir(start_path)
    for index, item in enumerate(items):
        path = os.path.join(start_path, item)
        connector = "└── " if index == len(items) - 1 else "├── "
        print(prefix + connector + item)

        # Перевірка, чи це каталог, і чи його вміст потрібно ігнорувати
        if os.path.isdir(path):
            if item in IGNORED_FOLDERS:
                print(prefix + ("    " if index == len(items) - 1 else "│   ") + "[IGNORED]")
            else:
                print_tree(path, prefix + ("    " if index == len(items) - 1 else "│   "))

# Отримання поточного шляху до скрипта
current_directory = os.path.dirname(os.path.abspath(__file__))

# Виклик функції для виводу дерева
print_tree(current_directory)
