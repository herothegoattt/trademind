FROM python:3.11-slim

WORKDIR /app

# install system deps
RUN apt-get update && apt-get install -y gcc libpq-dev

COPY pyproject.toml poetry.lock* /app/
RUN pip install --upgrade pip && \
    pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi

COPY . /app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]