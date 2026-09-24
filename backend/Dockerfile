FROM php:8.2-cli

# Extension nécessaire pour PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# Render/Railway fournissent le port à écouter via $PORT
ENV PORT=8000
EXPOSE 8000

CMD php -S 0.0.0.0:${PORT} -t public
