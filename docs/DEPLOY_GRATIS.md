# ==========================================================================
# DEPLOY GRATIS — alwaysdata (backend) + Vercel (frontend)
# Tanpa Docker. Tidak ada perubahan logika aplikasi.
# ==========================================================================

Stack:
  Backend   alwaysdata free plan (PHP native, always-on, SSH)
  Database  MySQL di alwaysdata (satu panel, tanpa layanan terpisah)
  Frontend  Vercel (SPA statis)

Yang perlu di-upload: ~57 MB (vendor 54.5 MB). Kuota gratis 1 GB — lega.


## 0. Verifikasi lokal (sudah lulus saat dokumen ini dibuat)

  php artisan test            -> 56 passed (197 assertions)
  vendor/bin/pint --test      -> passed
  npm run lint (eslint)       -> clean
  npm run build (vite)        -> 473 kB, sukses

  Dump database: 11 tabel, 90 warga / 90 pengajuan / 900 penilaian,
  utf8mb4_unicode_ci, InnoDB, tanpa DEFINER/trigger/view.
  Aman untuk shared hosting dan MySQL 8.


## 1. Daftar alwaysdata

  1. https://www.alwaysdata.com/en/signup/
  2. Pilih paket **Free** (0 €, selalu gratis, tanpa kartu kredit)
  3. Verifikasi email
  4. Catat dari panel:
       - username      (mis. wildan)
       - SSH host      ssh-wildan.alwaysdata.net
       - URL situs     https://wildan.alwaysdata.net

  Catatan: alwaysdata butuh verifikasi identitas ringan untuk aktivasi.
  Akun gratis dibatasi 1 GB disk / 256 MB RAM / 10 GB bandwidth per bulan.


## 2. Buat database MySQL

  Panel -> Databases -> MySQL -> Add

    Name      : bansos
    Permission: semua (read/write)
    Password  : buat password kuat, CATAT

  Hasilnya (nama lengkap otomatis diberi prefix username):

    DB_DATABASE = wildan_bansos
    DB_USERNAME = wildan
    DB_HOST     = mysql-wildan.alwaysdata.net
    DB_PORT     = 3306


## 3. Deploy backend

  Dari laptop:

    ssh wildan@ssh-wildan.alwaysdata.net

  Di server:

    bash <(curl -s https://raw.githubusercontent.com/WildanHumaidi/proyek_bansos/main/bansos-backend/setup-alwaysdata.sh)

  Atau kalau skrip belum ada di GitHub:

    git clone https://github.com/WildanHumaidi/proyek_bansos.git ~/www/app
    bash ~/www/app/bansos-backend/setup-alwaysdata.sh

  Lalu isi .env:

    nano ~/www/app/bansos-backend/.env

  Nilai yang WAJIB diganti:
    APP_URL                  https://wildan.alwaysdata.net
    DB_HOST / DB_DATABASE / DB_USERNAME / DB_PASSWORD
    CORS_ALLOWED_ORIGINS     https://<proyek>.vercel.app
    SANCTUM_STATEFUL_DOMAINS <proyek>.vercel.app


## 4. Set web root  ← LANGKAH PALING SERING SALAH

  Panel -> Web -> Sites -> Add

    Type           : PHP
    Addresses      : wildan.alwaysdata.net
    Root directory : /www/app/bansos-backend/public

  Kenapa `public/`: index.php Laravel ada di situ. Kalau root diarahkan ke
  folder `bansos-backend`, maka `.env` bisa dibaca lewat browser
  (https://.../.env) — kebocoran kredensial database.


## 5. Import data dari laptop

    cd E:\Projects\proyek_bansos\bansos-backend

    C:\xampp\mysql\bin\mysqldump.exe -uroot --no-tablespaces ^
      --skip-add-locks --default-character-set=utf8mb4 ^
      db_bansos_saw > deploy_bansos.sql

    mysql -h mysql-wildan.alwaysdata.net -u wildan -p wildan_bansos < deploy_bansos.sql

  (kalau `mysql` tidak ada di PATH, pakai
   C:\xampp\mysql\bin\mysql.exe dengan perintah yang sama)

  JANGAN jalankan `php artisan db:seed` di produksi — akan menduplikasi
  data warga yang sudah diimport.


## 6. Verifikasi backend

    curl -s -o /dev/null -w '%{http_code}\n' https://wildan.alwaysdata.net/api/login

    405 / 422  -> backend hidup (GET ditolak, endpoint hanya POST)
    500        -> ada error; cek ~/www/app/bansos-backend/storage/logs/laravel.log

  Uji login sungguhan:

    curl -s -X POST https://wildan.alwaysdata.net/api/login \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d '{"username":"admin","password":"admin123"}'

  Harus mengembalikan token. Segera ganti password admin setelah ini.


## 7. Deploy frontend ke Vercel

  1. https://vercel.com/new -> import repo WildanHumaidi/proyek_bansos
  2. Root Directory : bansos-frontend
  3. Framework      : Vite
  4. Build Command  : npm run build
  5. Output Dir     : dist
  6. Environment Variable (Production):
       VITE_API_URL = https://wildan.alwaysdata.net/api

  Penting: VITE_API_URL di-inline saat build. Setelah mengubahnya,
  WAJIB redeploy (bukan cuma restart) agar nilai baru terpakai.

  Setelah dapat domain Vercel (mis. bansos-hub.vercel.app), kembali ke
  langkah 3 dan isi CORS_ALLOWED_ORIGINS + SANCTUM_STATEFUL_DOMAINS,
  lalu di server:

    cd ~/www/app/bansos-backend
    php artisan config:cache


## 8. Checklist setelah live

  [ ] Login admin berhasil dari domain Vercel
  [ ] Dashboard admin memuat daftar 90 warga
  [ ] Menu Matriks SAW menampilkan nilai (bukan "—")
  [ ] Hasil Keputusan menampilkan ranking
  [ ] Ganti password admin/admin123
  [ ] Login RT 001 dan coba buka pengajuan RT 002 -> harus ditolak
  [ ] Kirim 1 pesan chat sebagai admin -> tidak 500 (uji ENUM pengirim_role)
  [ ] https://wildan.alwaysdata.net/.env -> harus 403/404, BUKAN isi file


## Catatan operasional

  Update aplikasi:
    ssh wildan@ssh-wildan.alwaysdata.net
    cd ~/www/app && git pull
    cd bansos-backend && composer install --no-dev -o
    php artisan migrate --force && php artisan config:cache

  Backup database (dari laptop):
    mysqldump -h mysql-wildan.alwaysdata.net -u wildan -p wildan_bansos > backup.sql

  Log error:
    tail -50 ~/www/app/bansos-backend/storage/logs/laravel.log

  Batas paket gratis: 1 GB disk. Setelah beberapa bulan log bisa menumpuk —
    truncate ~/www/app/bansos-backend/storage/logs/laravel.log bila perlu.
