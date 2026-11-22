# ==========================================================================
# DEPLOY BansosHub ke VPS Indonesia — paket Mikro (1 vCPU, 1 GB, 20 GB NVMe)
# Rp25.000/bulan, bayar QRIS. Ubuntu 24.04.
# ==========================================================================

## Kenapa Mikro dan bukan Nano

  Nano  512 MB  -> OOM saat composer install & artisan migrate
  Mikro   1 GB  -> cukup DENGAN swap 2 GB (dipasang otomatis oleh skrip)
  Mini    2 GB  -> ideal, Rp40.000

  1 GB + swap 2 GB terbukti cukup: aplikasi hanya 57 MB, dan peak runtime
  Laravel+SAW terukur 22 MB (lihat docs/DEPLOY_AWARDSPACE.md).


## Langkah 1 — Pesan VPS

  https://www.vpsindonesia.co.id/paket/mikro

  Paket          : Mikro                     Rp25.000
  Hostname       : bansos
  Sistem operasi : Ubuntu 24.04
  Durasi         : 1 Bulan                  (jangan langsung tahunan)
  IP Dedicated   : JANGAN                   (IPv4 publik sudah termasuk)
  Backup Otomatis: JANGAN (+Rp10.000, kita backup sendiri)
  Install Aplikasi: KOSONGKAN -> "Tidak ada"

  Total Rp25.000, bayar QRIS, aktif otomatis.

  PENTING: Langkah 3 (Install aplikasi & control panel) WAJIB dikosongkan.
  HestiaCP memakan ~400 MB RAM; di 1 GB sisa untuk Laravel+MySQL tidak cukup.


## Langkah 2 — Catat kredensial

  Setelah aktif, dari panel VPS catat:

    IP publik      : xxx.xxx.xxx.xxx
    User           : root
    Password root  : (dikirim via email/panel)


## Langkah 3 — Jalankan provisioning

  Dari laptop (Git Bash):

    cd E:\Projects\proyek_bansos\bansos-backend
    scp deploy/provision-vps.sh root@<IP>:/root/
    ssh root@<IP>

  Di VPS:

    bash /root/provision-vps.sh

  Skrip menanyakan password MySQL yang mau dibuat, lalu mengerjakan:

    1. Swap 2 GB + swappiness 10
    2. Nginx, PHP 8.3 (+fpm), MySQL, Composer, Certbot, UFW
    3. Tuning MySQL untuk RAM 1 GB (buffer pool 128M, performance_schema OFF)
    4. Database `bansos` + user `bansos`
    5. Clone repo, composer install --no-dev
    6. .env dari template, APP_KEY, migrate
    7. Nginx vhost: root ke public/, blokir .env/.git/*.sql/*.log
    8. Firewall: hanya SSH + HTTP/HTTPS

  Durasi: 5-10 menit (paling lama di composer install).


## Langkah 4 — Import data warga

  Dari laptop:

    cd E:\Projects\proyek_bansos\bansos-backend
    scp deploy_bansos.sql root@<IP>:/root/
    ssh root@<IP>

  Di VPS:

    mysql -u bansos -p bansos < /root/deploy_bansos.sql

  Dump berisi 13 migration yang sudah tercatat + 90 warga, 90 pengajuan,
  900 penilaian, 10 kriteria, 40 sub-kriteria.

  JANGAN jalankan `php artisan db:seed` — akan menduplikasi data.


## Langkah 5 — Verifikasi

  Dari laptop:

    curl -s -o /dev/null -w '%{http_code}\n' http://<IP>/up
      -> 200

    curl -s -o /dev/null -w '%{http_code}\n' http://<IP>/.env
      -> 403 atau 404  (KALAU 200, ADA MASALAH BESAR — .env bocor)

    curl -s -X POST http://<IP>/api/login \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d '{"username":"admin","password":"admin123"}'
      -> harus mengembalikan token

  Segera ganti password admin setelah login berhasil.


## Langkah 6 — Domain & SSL (opsional tapi disarankan)

  Tanpa domain, API jalan di http://<IP>/api. Tapi:
    - browser bisa memblokir mixed content kalau frontend di HTTPS
    - Sanctum lebih aman di HTTPS

  Kalau punya domain (atau beli .my.id ~Rp15.000/tahun):

    A record  ->  <IP VPS>

  Lalu di VPS:

    DOMAIN=bansos.domainmu.my.id bash /root/provision-vps.sh
    # atau langsung:
    certbot --nginx -d bansos.domainmu.my.id \
      --non-interactive --agree-tos -m email@kamu.com

  Certbot otomatis memperbarui sertifikat tiap 90 hari.


## Langkah 7 — Frontend ke Vercel

  https://vercel.com/new -> import WildanHumaidi/proyek_bansos

    Root Directory : bansos-frontend
    Framework      : Vite
    Build Command  : npm run build
    Output Dir     : dist
    Env Variable   : VITE_API_URL = https://bansos.domainmu.my.id/api
                     (atau http://<IP>/api kalau belum pakai domain)

  VITE_API_URL di-inline saat build — kalau diubah, WAJIB redeploy.

  Setelah dapat domain Vercel, di VPS:

    cd /var/www/bansos/bansos-backend
    nano .env
      CORS_ALLOWED_ORIGINS=https://<proyek>.vercel.app
      SANCTUM_STATEFUL_DOMAINS=<proyek>.vercel.app
    php artisan config:cache


## Langkah 8 — Checklist akhir

  [ ] http://<IP>/up -> 200
  [ ] http://<IP>/.env -> 403/404
  [ ] Login admin dapat token
  [ ] Dashboard memuat 90 warga
  [ ] Matriks SAW menampilkan nilai
  [ ] Hasil Keputusan: rank 1 = basuki, skor 0.925
  [ ] Ganti password admin/admin123
  [ ] Login RT 001, buka pengajuan RT 002 -> 403
  [ ] Kirim pesan chat sebagai admin -> tidak 500
  [ ] free -h menunjukkan swap 2 GB aktif


## Operasional harian

  Update kode (setelah git push):

    ssh root@<IP>
    cd /var/www/bansos && git pull
    cd bansos-backend && composer install --no-dev -o
    php artisan migrate --force && php artisan config:cache
    systemctl reload php8.3-fpm

  Lihat log:

    tail -f /var/www/bansos/bansos-backend/storage/logs/laravel.log
    tail -f /var/log/nginx/error.log

  Restart layanan:

    systemctl restart nginx php8.3-fpm mysql

  Cek memori (penting di 1 GB):

    free -h
    htop   # apt install htop

  Backup database (dari laptop):

    ssh root@<IP> "mysqldump -u bansos -p bansos" > backup-$(date +%F).sql


## Kalau kehabisan RAM

  Gejala: composer install mati, atau 502 Bad Gateway, atau OOM killer
  membunuh mysql/php-fpm.

  Cek:

    dmesg | grep -i "killed process"
    free -h

  Solusi cepat:
    1. Pastikan swap aktif: swapon --show
    2. Kurangi worker php-fpm: edit /etc/php/8.3/fpm/pool.d/www.conf
         pm = ondemand
         pm.max_children = 5
       lalu systemctl restart php8.3-fpm
    3. Kalau masih, upgrade ke paket Mini (2 GB, Rp40.000) — panel VPS
       mendukung upgrade tanpa instal ulang.
