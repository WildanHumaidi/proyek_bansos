#!/usr/bin/env bash
#
# setup-alwaysdata.sh — jalankan DI SERVER alwaysdata (via SSH), bukan di laptop.
#
#   ssh <username>@ssh-<username>.alwaysdata.net
#   bash ~/setup-alwaysdata.sh
#
# Skrip ini TIDAK mengubah kode aplikasi. Yang dilakukan hanya:
#   1. clone/pull repo ke ~/www/app
#   2. composer install --no-dev
#   3. siapkan .env dari .env.production.example
#   4. generate APP_KEY, cache config/route, set permission storage
#
# Yang TIDAK dilakukan skrip ini (sengaja, butuh keputusanmu):
#   - mengisi kredensial database  → isi manual di .env
#   - membuat database             → lewat panel alwaysdata
#   - import dump SQL              → dijalankan dari laptop
#
set -euo pipefail

REPO_URL="https://github.com/WildanHumaidi/proyek_bansos.git"
APP_DIR="$HOME/www/app"
BACKEND_DIR="$APP_DIR/bansos-backend"

echo "==> 1/6 Menyiapkan direktori"
mkdir -p "$HOME/www"
if [ -d "$APP_DIR/.git" ]; then
  echo "    repo sudah ada, menarik pembaruan"
  git -C "$APP_DIR" pull --ff-only
else
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi

cd "$BACKEND_DIR"

echo "==> 2/6 composer install (tanpa dev)"
if command -v composer >/dev/null 2>&1; then
  composer install --no-dev --optimize-autoloader --no-interaction
else
  echo "    composer tidak ditemukan. Install dulu:"
  echo "    curl -sS https://getcomposer.org/installer | php"
  echo "    lalu jalankan: php composer.phar install --no-dev --optimize-autoloader"
  exit 1
fi

echo "==> 3/6 Menyiapkan .env"
if [ -f .env ]; then
  echo "    .env sudah ada, tidak ditimpa"
else
  cp .env.production.example .env
  echo "    .env dibuat dari template — ISI DULU nilai <...> sebelum lanjut:"
  echo "      nano $BACKEND_DIR/.env"
fi

echo "==> 4/6 Permission storage & cache"
chmod -R 775 storage bootstrap/cache

echo "==> 5/6 APP_KEY"
if grep -q '^APP_KEY=$' .env; then
  php artisan key:generate --force
  echo "    APP_KEY dibuat"
else
  echo "    APP_KEY sudah terisi, dilewati"
fi

echo "==> 6/6 Cache konfigurasi"
php artisan config:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache

echo
echo "=============================================================="
echo " Selesai. Sisa langkah MANUAL:"
echo "   1. Isi kredensial DB di .env  (nano $BACKEND_DIR/.env)"
echo "   2. Set web root di panel alwaysdata:"
echo "        $BACKEND_DIR/public"
echo "   3. Import data dari laptop:"
echo "        mysql -h <host> -u <user> -p <db> < deploy_bansos.sql"
echo "   4. Uji:"
echo "        curl -s -o /dev/null -w '%{http_code}\\n' https://<username>.alwaysdata.net/api/login"
echo "        (405 atau 422 = backend hidup; 500 = ada masalah, cek storage/logs)"
echo "=============================================================="
