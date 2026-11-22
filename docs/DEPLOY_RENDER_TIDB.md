# ==========================================================================
# DEPLOY GRATIS — Render (backend) + TiDB Cloud (MySQL) + Vercel (frontend)
# Tanpa kartu kredit. Tidak ada perubahan logika aplikasi.
# ==========================================================================

Kenapa stack ini (hasil verifikasi langsung, bukan dari blog):
  Render signup      -> email/password atau GitHub. TIDAK ada field kartu.
  Render free        -> 750 jam/bulan, RAM 512 MB, sleep 15 menit idle.
  Render DB free     -> HANYA Postgres, dan kedaluwarsa 30 hari.
  TiDB signup        -> Google/GitHub/Microsoft/email. TIDAK ada field kartu.
  TiDB Starter       -> MySQL-compatible, 5 GiB, gratis untuk 5 instance pertama.
  alwaysdata         -> GUGUR: signup wajib validasi kartu.
  Railway            -> GUGUR: trial habis, upgrade butuh kartu.


## 1. TiDB Cloud — buat database

  1. https://tidbcloud.com -> Sign In -> Continue with GitHub
  2. Create Cluster -> pilih **Starter** (jangan Dedicated, itu berbayar)
  3. Region: **Singapore** (terdekat ke Render Singapore)
  4. Tunggu provisioning (~1-2 menit)
  5. Klik **Connect** -> pilih **General** / Public endpoint
  6. Catat 5 nilai ini:

       Host        : gateway01.ap-southeast-1.prod.aws.tidbcloud.com
       Port        : 4000
       User        : xxxxxxxx.root
       Password    : (klik "Generate Password" lalu simpan)
       Database    : test            <- GANTI, buat database sendiri

  Buat database khusus (lewat SQL Editor di dashboard TiDB):

       CREATE DATABASE bansos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  Catatan TLS: TiDB WAJIB koneksi terenkripsi. Aplikasi harus diberi
  MYSQL_ATTR_SSL_CA. Di image PHP resmi, CA bundle ada di
  /etc/ssl/certs/ca-certificates.crt — sudah saya set di env Render di bawah.


## 2. Import data ke TiDB

  Dari laptop (PowerShell), di folder proyek:

       cd E:\Projects\proyek_bansos\bansos-backend

       C:\xampp\mysql\bin\mysqldump.exe -uroot --no-tablespaces ^
         --skip-add-locks --default-character-set=utf8mb4 ^
         db_bansos_saw > deploy_bansos.sql

       C:\xampp\mysql\bin\mysql.exe -h <HOST-TIDB> -P 4000 -u <USER-TIDB> -p ^
         --ssl-mode=REQUIRED bansos < deploy_bansos.sql

  Dump berisi 13 migration yang sudah tercatat, jadi `php artisan migrate`
  di Render TIDAK akan menjalankan ulang apa pun — hanya memverifikasi.

  JANGAN jalankan `php artisan db:seed` di produksi: akan menduplikasi
  90 warga yang sudah diimport.


## 3. Render — deploy backend

  1. Dashboard Render -> **New +** -> **Web Service**
  2. Connect repo: **WildanHumaidi/proyek_bansos**
  3. Isi:

       Name            : bansos-api
       Region          : Singapore
       Branch          : main
       Root Directory  : bansos-backend          <- PENTING
       Runtime         : Docker
       Instance Type   : Free
       Health Check    : /up

  4. **Environment Variables** (Advanced -> Add Environment Variable):

       APP_NAME                 BansosHub
       APP_ENV                  production
       APP_DEBUG                false
       APP_KEY                  <hasil php artisan key:generate --show>
       APP_URL                  https://bansos-api.onrender.com
       APP_LOCALE               id
       LOG_CHANNEL              stack
       LOG_LEVEL                error

       DB_CONNECTION            mysql
       DB_HOST                  <HOST-TIDB>
       DB_PORT                  4000
       DB_DATABASE              bansos
       DB_USERNAME              <USER-TIDB>
       DB_PASSWORD              <PASSWORD-TIDB>
       MYSQL_ATTR_SSL_CA        /etc/ssl/certs/ca-certificates.crt

       SESSION_DRIVER           file
       CACHE_STORE              file
       QUEUE_CONNECTION         sync

       CORS_ALLOWED_ORIGINS     https://<proyek>.vercel.app
       SANCTUM_STATEFUL_DOMAINS <proyek>.vercel.app
       SANCTUM_EXPIRATION       1440

  5. Create Web Service -> tunggu build (~3-5 menit untuk build pertama)

  Render otomatis: build image -> jalankan config:cache -> apache hidup.
  Migrasi TIDAK dijalankan otomatis (sengaja) — data sudah diimport manual.


## 4. Verifikasi backend

       curl -s -o /dev/null -w '%{http_code}\n' https://bansos-api.onrender.com/up
       -> 200

       curl -s -X POST https://bansos-api.onrender.com/api/login ^
         -H "Content-Type: application/json" ^
         -H "Accept: application/json" ^
         -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
       -> harus mengembalikan token

  Kalau 500: Render -> Logs. Cek storage/logs/laravel.log lewat shell.
  Penyebab paling umum: MYSQL_ATTR_SSL_CA belum diisi, atau DB_HOST salah.


## 5. Vercel — deploy frontend

  1. https://vercel.com/new -> import repo yang sama
  2. Root Directory : bansos-frontend
  3. Framework      : Vite
  4. Build Command  : npm run build
  5. Output Dir     : dist
  6. Environment Variable (Production):
       VITE_API_URL = https://bansos-api.onrender.com/api
  7. Deploy

  VITE_API_URL di-inline saat build. Kalau diubah, WAJIB redeploy.

  Setelah dapat domain Vercel, kembali ke langkah 3 dan perbarui
  CORS_ALLOWED_ORIGINS + SANCTUM_STATEFUL_DOMAINS, lalu Render -> Manual Deploy.


## 6. Checklist setelah live

  [ ] /up mengembalikan 200
  [ ] Login admin berhasil dari domain Vercel
  [ ] Dashboard memuat 90 warga
  [ ] Menu Matriks SAW menampilkan nilai (bukan "—")
  [ ] Hasil Keputusan menampilkan ranking (rank 1 = basuki, skor 0.925)
  [ ] Ganti password admin/admin123
  [ ] Login RT 001, coba buka pengajuan RT 002 -> harus 403
  [ ] Kirim 1 pesan chat sebagai admin -> tidak 500 (uji ENUM pengirim_role)
  [ ] https://bansos-api.onrender.com/.env -> 404, BUKAN isi file


## Catatan operasional

  Sleep: service tidur setelah 15 menit tanpa traffic. Request pertama
  setelah tidur butuh 30-60 detik. Ini batasan Render free, bukan bug.

  Kuota: 750 jam/bulan. Service yang tidur TIDAK memakan kuota, jadi
  aman untuk pemakaian wajar.

  Update aplikasi: git push ke main -> Render auto-deploy.

  Migrasi baru: Render -> Shell -> `php artisan migrate --force`.

  Backup database: dari laptop
       mysqldump -h <HOST-TIDB> -P 4000 -u <USER-TIDB> -p ^
         --ssl-mode=REQUIRED bansos > backup.sql
