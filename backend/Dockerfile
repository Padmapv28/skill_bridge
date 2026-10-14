# Build from the backend/ folder (contains main.py, app/, requirements.txt).
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt requirements.extra.txt ./
RUN pip install -r requirements.txt -r requirements.extra.txt

COPY . .

RUN useradd --create-home --uid 10001 appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

# PORT is injected by Render/Railway/Fly-style platforms. APP_MODULE defaults to main:app.
CMD ["sh", "-c", "exec gunicorn ${APP_MODULE:-main:app} -k uvicorn.workers.UvicornWorker -w ${WEB_CONCURRENCY:-1} -b 0.0.0.0:${PORT:-8000} --timeout ${GUNICORN_TIMEOUT:-120} --access-logfile -"]
