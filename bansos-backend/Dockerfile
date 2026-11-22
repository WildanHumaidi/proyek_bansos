# ==========================================================================
# Dockerfile — BansosHub backend (Laravel 12 / PHP 8.2)
# Untuk Render. Tidak mengubah logika aplikasi.
# ==========================================================================
FROM php:8.2-apache

# Ekstensi yang dibutuhkan Laravel + MySQL
RUN apt-get update && apt-get install -y --no-install-recommends \
        libzip-dev libpng-dev libonig-dev unzip git \
    && docker-php-ext-install pdo pdo_mysql zip mbstring bcmath \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Salin dependency lebih dulu agar layer cache composer tetap valid
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction

COPY . .
RUN composer dump-autoload --optimize --no-dev

# Arahkan document root Apache ke public/ — kalau salah, .env bisa diakses browser
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Render memberi PORT lewat env; Apache default 80 sudah sesuai.
EXPOSE 80

# Cache config dijalankan saat start (setelah env var Render tersedia)
CMD ["sh", "-c", "php artisan config:cache && php artisan route:cache && apache2-foreground"]
