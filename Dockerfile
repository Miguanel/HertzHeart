# syntax=docker/dockerfile:1

# ---------- 1. Budowa frontendu ----------
FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
# package-lock.json powstał na Windowsie; jeśli brakuje w nim natywnych paczek dla Linuksa,
# npm install je dociągnie.
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---------- 2. Backend Django + zbudowany frontend ----------
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=10000

WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt
COPY backend/ ./
COPY --from=frontend /app/frontend/dist /app/frontend/dist

RUN DJANGO_DEBUG=false DJANGO_SECRET_KEY=tylko-na-czas-budowania python manage.py collectstatic --noinput \
    && useradd --create-home app && chown -R app /app
USER app

EXPOSE 10000
# Migracje przy starcie; konto administratora tworzone, jeśli ustawiono DJANGO_SUPERUSER_* (Render nie ma powłoki w planie free).
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py sync_library && if [ -n \"$DJANGO_SUPERUSER_PASSWORD\" ]; then python manage.py createsuperuser --noinput || true; fi && exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --workers 2 --timeout 60 --access-logfile -"]
