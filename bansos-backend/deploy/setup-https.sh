#!/usr/bin/env bash
# HTTPS BansosHub lewat domain publik.
#
# Kondisi host ini: IP publik dipakai bersama, tapi panel provider punya fitur
# "Domain (proxy 80/443)" — setelah domain didaftarkan di tab Domain dan A
# record-nya mengarah ke 31.59.119.233, edge provider meneruskan 80 dan 443 ke
# VPS. Jadi HTTP-01 bisa jalan dan URL-nya bersih tanpa :8080.
#
# Skrip ini mengulang seluruh pemasangan dari nol (aman dijalankan ulang):
#   vhost :80 (ACME + redirect) -> sertifikat Let's Encrypt -> vhost :443
#   -> APP_URL/CORS/Sanctum -> verifikasi.
#
# Pemakaian, di VPS sebagai root:
#   /usr/local/bin/bansos-setup-https.sh bansoshub.duckdns.org
#
# Prasyarat di luar server (tidak bisa diotomasi):
#   1. A record domain -> 31.59.119.233 (DuckDNS: add domain + isi current ip)
#   2. Domain terdaftar di panel provider (detail VPS -> Domain), kalau tidak
#      edge menjawab 503 "No server is available".
set -euo pipefail

DOMAIN="${1:?pakai: bansos-setup-https.sh <domain>}"
APP=/var/www/bansos/bansos-backend
FRONT=/var/www/bansos/frontend
ACME_ROOT=/var/www/acme
CERT_DIR=/etc/ssl/bansos
ACME=/root/.acme.sh/acme.sh

log() { printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"; }

# 0. DNS harus sudah mengarah ke IP ini, kalau tidak sertifikat akan gagal.
log "cek DNS $DOMAIN"
IP_DNS=$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}')
[ -n "$IP_DNS" ] || { log "GAGAL: $DOMAIN belum resolve"; exit 1; }
log "DNS -> $IP_DNS"

# 1. acme.sh (klon, bukan curl | sh)
if [ ! -x "$ACME" ]; then
    log "pasang acme.sh"
    git clone --depth 1 -q https://github.com/acmesh-official/acme.sh.git /root/acme.sh-src
    ( cd /root/acme.sh-src && ./acme.sh --install -m "admin@${DOMAIN#*.}" >/dev/null )
fi

mkdir -p "$ACME_ROOT/.well-known/acme-challenge" "$CERT_DIR"
chown -R www-data:www-data "$ACME_ROOT"

# 2. vhost :80 dulu — HTTP-01 butuh /.well-known/acme-challenge/ terjangkau.
log "tulis vhost :80"
cat > /etc/nginx/sites-available/bansos-domain <<CONF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    server_tokens off;

    location ^~ /.well-known/acme-challenge/ {
        root ${ACME_ROOT};
        default_type text/plain;
        try_files \$uri =404;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
CONF
ln -sf /etc/nginx/sites-available/bansos-domain /etc/nginx/sites-enabled/bansos-domain
nginx -t && systemctl reload nginx

# 3. sertifikat
log "minta sertifikat Let's Encrypt (HTTP-01, webroot)"
"$ACME" --issue --server letsencrypt -d "$DOMAIN" --webroot "$ACME_ROOT" --keylength ec-256
"$ACME" --install-cert -d "$DOMAIN" --ecc \
    --key-file "$CERT_DIR/privkey.pem" \
    --fullchain-file "$CERT_DIR/fullchain.pem" \
    --reloadcmd "systemctl reload nginx"
chmod 600 "$CERT_DIR/privkey.pem"

# 4. vhost :443
log "tulis vhost :443"
cat > /etc/nginx/sites-available/bansos-domain <<CONF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    server_tokens off;

    location ^~ /.well-known/acme-challenge/ {
        root ${ACME_ROOT};
        default_type text/plain;
        try_files \$uri =404;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name ${DOMAIN};
    server_tokens off;

    ssl_certificate     ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;

    root ${FRONT};
    index index.html;

    charset utf-8;
    client_max_body_size 8M;

    gzip on;
    gzip_comp_level 5;
    gzip_min_length 512;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location ^~ /api/ {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME ${APP}/public/index.php;
        fastcgi_param SCRIPT_NAME /index.php;
        fastcgi_param DOCUMENT_ROOT ${APP}/public;
        fastcgi_read_timeout 120;
    }

    location = /up {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME ${APP}/public/index.php;
        fastcgi_param SCRIPT_NAME /index.php;
        fastcgi_param DOCUMENT_ROOT ${APP}/public;
    }

    # Jangan pernah eksekusi PHP dari folder SPA / sajikan file tersembunyi.
    location ~ \.php\$ { return 404; }
    location ~ /\. { deny all; access_log off; log_not_found off; }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
CONF
nginx -t && systemctl reload nginx

# 5. Laravel
log "perbarui .env"
cp "$APP/.env" "/root/.env.bak-$(date +%s)"
cd "$APP"
sed -i -E "s|^APP_URL=.*|APP_URL=https://${DOMAIN}|" .env
sed -i -E "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=https://${DOMAIN},http://31.59.119.233:8080|" .env
sed -i -E "s|^SANCTUM_STATEFUL_DOMAINS=.*|SANCTUM_STATEFUL_DOMAINS=${DOMAIN},31.59.119.233:8080|" .env
php artisan optimize:clear >/dev/null
php artisan config:cache >/dev/null
chown -R www-data:www-data bootstrap/cache storage
systemctl reload php8.3-fpm

# 6. bukti
log "verifikasi"
printf 'https://%s/           -> ' "$DOMAIN"
curl -s -o /dev/null -w '%{http_code}\n' "https://${DOMAIN}/"
printf 'http redirect         -> '
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "http://${DOMAIN}/"
printf 'api tanpa token       -> '
curl -s -o /dev/null -w '%{http_code}\n' "https://${DOMAIN}/api/kriteria"
printf 'sertifikat            -> '
echo | openssl s_client -connect "127.0.0.1:443" -servername "$DOMAIN" 2>/dev/null \
    | openssl x509 -noout -subject -issuer -dates | tr '\n' ' '
echo
log "selesai. perpanjangan otomatis oleh cron acme.sh."