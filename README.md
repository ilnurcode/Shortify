## Shortify

Сервис для создания коротких ссылок и QR-кодов.
Использует FastAPI, PostgreSQL, Redis и Alembic для миграций.

---

### Содержание

1) Описание
2) Функционал
3) Технологии
4) Установка и запуск
5) Docker
6) Миграции
7) Тестирование
8) Лицензия

---

### Описание

Shortify - это сервис для генерации коротких ссылок и qr-кодов с учетом пользователя и автоматической очисткой старых
ссылок

- Короткие ссылки создаются с уникальным кодом
- Поддержка авторизации пользователей
- Очистка ссылок неиспользуемых более 30 дней
- Асинхронная работа с базой данных

---

### Функционал

- Регистрация и авторизация пользователей
- Создание коротких ссылок
- Создание qr-кодов
- Автоматическая очистка неиспользуемых ссылок
- Использование Redis для лимитов

---

### Технологии

- Python 3.14
- FastAPI
- PostgreSQL 15
- Redis 8
- SQLAlchemy (Async)
- Alembic
- APScheduler
- Docker & Docker Compose

---

### Установка и запуск

1) Клонируем репозиторий:

```
git clone https://github.com/ilnurcode/shortify
cd shortify
```

2) Создаем .env.docker с конфигурацией (пример ниже)
3) Собираем и запускаем проект через Docker Compose:

```
docker compose up --build
```

4) Доступ к приложению:

```
http://localhost:8000
```

---

### Docker

- web - FastAPI приложение
- db - PostgreSQL
- redis_container - Redis
  Все зависимости подтягиваются через Docker
  Скрипт entrypoint.sh ждет готовности PostgreSQL и Redis перед запуском приложения

---

### Переменные окружения

Пример .env.docker:

```
DB_USERNAME=shortify_user  
DB_PASSWORD=secret_password
DB_PORT=5432
DB_HOST=db
DB_NAME=shortify

SECRET_KEY=secret_key
ALGORITHM=HS256 
BASE_URL=localhost:8000

REDIS_URL=redis_container
REDIS_PORT=6379
```

---

### Миграции

Для применения миграций:

```
docker compose exec web alembic upgrade head
```

Для создания новой миграции

```
docker compose exec web alembic revision --autogenerate -m "Описание миграции"
```

---

### Тестирование

Запуск pytest:

```
docker compose exec web pytest -v
```

Предусмотрены юнит-тесты для сервисов ссылок, авторизации, регистрации, Redis-лимитов


---

### Лицензия

MIT License