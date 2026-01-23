from python:3.14.2

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends build-essential gcc libpq-dev postgresql-client redis-tools

RUN rm -rf /var/lib/apt/lists/*

COPY . .

RUN pip install -r requirements.txt

ENV PYTHONPATH=/app

RUN chmod +x  /app/scripts/entrypoint.sh

ENTRYPOINT ["/app/scripts/entrypoint.sh"]

CMD ["uvicorn", "src.main.py", "--host", "0.0.0.0", "--port", "8000"]