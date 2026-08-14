FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

COPY requirements-cloud.txt /app/requirements-cloud.txt
RUN pip install --no-cache-dir -r /app/requirements-cloud.txt

COPY ai /app/ai
COPY backend /app/backend

EXPOSE 8080

CMD ["sh", "-c", "uvicorn backend.api:app --host 0.0.0.0 --port ${PORT:-8080}"]
