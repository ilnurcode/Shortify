#!/bin/sh
set -e
echo "Ожидаем PostgreSQL"
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" >/dev/null 2>&1; do
  sleep 1
done
echo "PostgreSQL готов"
echo "Ожидаем Redis"
until redis-cli -h "$REDIS_URL" -p "$REDIS_PORT" ping >/dev/null 2>&1; do
  sleep 1
done
echo "Redis готов"
alembic upgrade head

exec "$@"