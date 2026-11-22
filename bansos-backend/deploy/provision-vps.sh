#!/usr/bin/env bash
#
# provision-vps.sh — setup BansosHub di VPS Ubuntu 24.04 (RAM 1 GB)
#
# Jalankan sebagai root di VPS yang baru aktif:
#   ssh root@<IP-VPS>
#   bash provision-vps.sh
#
# Yang dilakukan:
#   1. Swap 2 GB  (WAJIB di RAM 1 GB — composer install Laravel butuh >1 GB)
#   2. Install Nginx, PHP 8.3, MySQL, Composer, Certbot
#   3. Tuning MySQL untuk RAM kecil
#   4. Buat database + user
#   5. Clone repo, composer install --no-dev
#   6. .env, APP_KEY, migrate
#   7. Nginx vhost (root ke public/, .env diblokir)
#   8. Firewall dasar
#
# Yang TIDAK dilakukan (butuh keputusanmu):
#   - mengisi password database (ditanyakan interaktif)
#   - import data warga (dijalankan terpisah)
#   - SSL (dijalankan setelah domain mengarah ke IP ini)
#
set -euo pipefail

DOMAIN="${DOMAIN:-}"
DB_NAME="bansos"
DB_USER="bansos"
APP_DIR="/var/www/bansos"
REPO_URL="https://github.com/WildanHumaidi/proyek_bansos.git"

log() { echo -e "\n\033[1;36m==> $*\033[0m"; }
warn() { echo -e "\033[1;33m[!] $*\033[0m"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Jalankan sebagai root: sudo bash $0"; exit 1
fi

# ── 1. Swap 2 GB ──────────────────────────────────────────────────────────
log "1/8 Swap 2 GB (kritis untuk RAM 1 GB)"
if swapon --show | grep -q '/swapfile'; then
  warn "swap sudah ada, dilewati"
else
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # swappiness rendah: pakai RAM dulu, swap hanya saat darurat
  sysctl -w vm.swappiness=10
  grep -q 'vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi
free -h

# ── 2. Paket dasar ────────────────────────────────────────────────────────
log "2/8 Install Nginx, PHP 8.3, MySQL, Composer, Certbot"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  nginx mysql-server git unzip curl ufw \
  php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring php8.3-xml \
  php8.3-curl php8.3-zip php8.3-bcmath php8.3-intl php8.3-gd \
  certbot python3-certbot-nginx

if ! command -v composer >/dev/null 2>&1; then
  curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi
composer --version

# Naikkan memory_limit PHP untuk CLI (composer) — FPM tetap 256M
sed -i 's/^memory_limit.*/memory_limit = 512M/' /etc/php/8.3/cli/php.ini || true

# ── 3. Tuning MySQL untuk RAM kecil ───────────────────────────────────────
log "3/8 Tuning MySQL untuk RAM 1 GB"
cat > /etc/mysql/mysql.conf.d/zz-bansos.cnf <<'EOF'
[mysqld]
# Server 1 GB: buffer pool kecil, hindari OOM
innodb_buffer_pool_size = 128M
innodb_log_file_size    = 32M
innodb_flush_method     = O_DIRECT
max_connections         = 25
performance_schema      = OFF
table_open_cache        = 200
tmp_table_size          = 16M
max_heap_table_size     = 16M
EOF
systemctl restart mysql
systemctl is-active mysql

# ── 4. Database ───────────────────────────────────────────────────────────
log "4/8 Buat database & user"
if [ -z "${DB_PASS:-}" ]; then
  read -rsp "Password untuk user MySQL '$DB_USER': " DB_PASS; echo
fi
mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost'; FLUSH PRIVILEGES;"
echo "    database '${DB_NAME}' siap"

# ── 5. Aplikasi ───────────────────────────────────────────────────────────
log "5/8 Clone repo & composer install (--no-dev)"
mkdir -p /var/www
if [ -d "$APP_DIR/.git" ]; then
  warn "repo sudah ada, menarik pembaruan"
  git -C "$APP_DIR" pull --ff-only
else
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR/bansos-backend"
composer install --no-dev --optimize-autoloader --no-interaction

# ── 6. .env ───────────────────────────────────────────────────────────────
log "6/8 Konfigurasi .env"
if [ -f .env ]; then
  warn ".env sudah ada, tidak ditimpa"
else
  cp .env.production.example .env
  sed -i "s|^DB_DATABASE=.*|DB_DATABASE=${DB_NAME}|"   .env
  sed -i "s|^DB_USERNAME=.*|DB_USERNAME=${DB_USER}|"   .env
  sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|"   .env
  sed -i "s|^DB_HOST=.*|DB_HOST=127.0.0.1|"            .env
  sed -i "s|^DB_PORT=.*|DB_PORT=3306|"                 .env
  if [ -n "$DOMAIN" ]; then
    sed -i "s|^APP_URL=.*|APP_URL=https://${DOMAIN}|" .env
  else
    IP=$(curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')
    sed -i "s|^APP_URL=.*|APP_URL=http://${IP}|" .env
  fi
  php artisan key:generate --force
fi

php artisan config:clear
php artisan migrate --force

chown -R www-data:www-data "$APP_DIR/bansos-backend/storage" "$APP_DIR/bansos-backend/bootstrap/cache"
chmod -R 775 "$APP_DIR/bansos-backend/storage" "$APP_DIR/bansos-backend/bootstrap/cache"

# ── 7. Nginx ──────────────────────────────────────────────────────────────
log "7/8 Konfigurasi Nginx"
SERVER_NAME="${DOMAIN:-_}"
cat > /etc/nginx/sites-available/bansos <<EOF
server {
    listen 80;
    server_name ${SERVER_NAME};
    root ${APP_DIR}/bansos-backend/public;

    index index.php;
    charset utf-8;
    client_max_body_size 8M;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php\$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Jangan pernah sajikan file tersembunyi (.env, .git, dll)
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~* \.(env|log|sql|md|json)\$ {
        deny all;
    }
}
EOF

ln -sf /etc/nginx/sites-available/bansos /etc/nginx/sites-enabled/bansos
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 8. Firewall ───────────────────────────────────────────────────────────
log "8/8 Firewall"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status

echo
echo "=============================================================="
echo " Selesai."
echo
echo " Uji:"
echo "   curl -s -o /dev/null -w '%{http_code}\\n' http://${SERVER_NAME}/up"
echo "   curl -s -o /dev/null -w '%{http_code}\\n' http://${SERVER_NAME}/.env"
echo "   (yang kedua HARUS 403/404)"
echo
echo " Import data warga (dari laptop):"
echo "   scp deploy_bansos.sql root@<IP>:/root/"
echo "   ssh root@<IP> 'mysql -u ${DB_USER} -p ${DB_NAME} < /root/deploy_bansos.sql'"
echo
echo " SSL setelah domain mengarah ke IP ini:"
echo "   certbot --nginx -d <domain> --non-interactive --agree-tos -m <email>"
echo "=============================================================="
