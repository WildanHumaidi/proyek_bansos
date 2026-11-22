# ==========================================================================
# DEPLOY KE AWARDSPACE FREE — tanpa kartu, tanpa SSH
# ==========================================================================

## Hasil pengukuran sebelum memilih platform ini (bukan asumsi)

Batasan AwardSpace free (knowledge base resmi mereka):
  Disk              : 1 GB
  MySQL             : 30 MB per database
  PHP memory_limit  : 32 MB, TIDAK bisa dinaikkan di free
  Bandwidth         : 5 GB/bulan
  PHP               : 8.4 (cukup untuk Laravel 12)
  SSH               : TIDAK ADA  -> composer install tidak bisa dijalankan

Kebutuhan aplikasi kita (diukur di mesin lokal):
  boot Laravel              : 184 ms, peak 18.0 MB
  query SAW (90 warga)      : 118 ms, peak 22.0 MB
  artisan config:cache      : jalan di 32 MB
  artisan route:cache       : jalan di 32 MB
  artisan migrate --pretend : jalan di 32 MB

  PEAK 22.0 MB dari batas 32 MB  -> MUAT, tapi mepet (sisa ~10 MB)
  vendor/   : 54.5 MB            -> muat di 1 GB
  dump SQL  : 0.15 MB            -> muat di 30 MB MySQL
  data live : ~1-2 MB            -> muat di 30 MB

Kesimpulan: layak dicoba. Risikonya bukan memori (sudah diukur), tapi
upload manual 27 MB dan tidak adanya SSH.


## 1. Daftar

  https://www.awardspace.com/free-hosting/
  -> "Register Now" -> Continue with Google (tanpa kartu)
  -> dapat subdomain <nama>.atwebpages.com
  -> catat login panel + kredensial FTP


## 2. Buat database MySQL

  Panel -> MySQL Databases -> Create
    Nama database : bansos
    Catat: host, nama db, user, password
    (AwardSpace biasanya memberi prefix, mis. 1234567_bansos)

  Kuota 30 MB. Data kita ~2 MB, aman.


## 3. Buat paket deploy (di laptop)

  cd E:\Projects\proyek_bansos\bansos-backend
  bash deploy/buat-paket-awardspace.sh

  Menghasilkan: dist-deploy/bansos-awardspace.zip  (27 MB)

  Isi paket sudah diverifikasi:
    [v] .htaccess root          (mengarahkan ke public/)
    [v] public/index.php
    [v] vendor/autoload.php     (composer sudah dijalankan lokal)
    [v] .env.example-produksi
    [v] artisan
    [v] TIDAK ada .env asli, .git, tests/, node_modules, .log


## 4. Upload

  Panel -> File Manager -> buka folder htdocs/

    1. Upload bansos-awardspace.zip
    2. Klik kanan -> Extract (di dalam htdocs/, JANGAN di subfolder)
    3. Hapus zip setelah extract (hemat kuota 27 MB)
    4. Rename .env.example-produksi menjadi .env
    5. Edit .env:

         APP_ENV=production
         APP_DEBUG=false
         APP_KEY=<lihat langkah 5>
         APP_URL=https://<nama>.atwebpages.com
         DB_CONNECTION=mysql
         DB_HOST=<dari panel>
         DB_DATABASE=<nama db>
         DB_USERNAME=<user db>
         DB_PASSWORD=<password db>
         CORS_ALLOWED_ORIGINS=https://<proyek>.vercel.app
         SANCTUM_STATEFUL_DOMAINS=<proyek>.vercel.app

  CATATAN PENTING soal .htaccess:
    File .htaccess di root mengarahkan semua request ke public/ TANPA
    mengubah kode. Kalau panel AwardSpace mengizinkan set document root
    ke /htdocs/public, pakai cara itu dan hapus .htaccess root — lebih aman.


## 5. Generate APP_KEY

  Tidak ada SSH, jadi generate di laptop lalu salin ke .env di server:

    cd E:\Projects\proyek_bansos\bansos-backend
    php artisan key:generate --show

  Nilai yang ada di laptop saat dokumen ini dibuat:
    base64:in3gbjVQvWLNe60IquuaINDdfTg5zGDWOvO9JEIhNAM=

  (Boleh pakai ini, atau generate baru. Jangan pakai APP_KEY lokal
   yang ada di .env laptop untuk produksi.)


## 6. Import data

  Panel -> phpMyAdmin -> pilih database bansos -> Import
  Upload file deploy_bansos.sql (sudah dibuat, 94 KB)

  Kalau file terlalu besar untuk upload, kompres jadi .sql.gz dulu.

  Dump berisi 13 migration yang sudah tercatat, jadi tidak perlu
  menjalankan `php artisan migrate` sama sekali.

  JANGAN jalankan seeder di produksi — akan menduplikasi 90 warga.


## 7. Verifikasi

  Buka https://<nama>.atwebpages.com/api/login (GET)
    -> 405 atau 422 = backend hidup
    -> 500          = ada error

  Kalau 500, tidak ada SSH untuk lihat log langsung. Cek lewat
  File Manager: storage/logs/laravel.log

  Uji login (PowerShell):

    curl -s -X POST https://<nama>.atwebpages.com/api/login ^
      -H "Content-Type: application/json" ^
      -H "Accept: application/json" ^
      -d "{\"username\":\"admin\",\"password\":\"admin123\"}"

  HARUS mengembalikan token. Segera ganti password admin.


## 8. Frontend ke Vercel

  https://vercel.com/new -> import repo WildanHumaidi/proyek_bansos
    Root Directory : bansos-frontend
    Framework      : Vite
    Build Command  : npm run build
    Output Dir     : dist
    Env Variable   : VITE_API_URL = https://<nama>.atwebpages.com/api

  Setelah dapat domain Vercel, perbarui CORS_ALLOWED_ORIGINS dan
  SANCTUM_STATEFUL_DOMAINS di .env server.


## 9. Checklist

  [ ] https://<nama>.atwebpages.com/api/login -> 405/422 (bukan 500)
  [ ] Login admin berhasil, dapat token
  [ ] https://<nama>.atwebpages.com/.env -> 403/404, BUKAN isi file
  [ ] Dashboard memuat 90 warga
  [ ] Matriks SAW menampilkan nilai (bukan "—")
  [ ] Hasil Keputusan: rank 1 = basuki, skor 0.925
  [ ] Ganti password admin/admin123
  [ ] Kirim 1 pesan chat sebagai admin -> tidak 500 (uji ENUM)


## Risiko yang perlu diketahui

  1. Tidak ada SSH -> setiap perubahan kode harus upload ulang lewat
     File Manager. Tidak ada `git pull`, tidak ada `artisan` jarak jauh.

  2. memory_limit 32 MB tidak bisa dinaikkan. Aplikasi muat (22 MB),
     tapi kalau data warga bertambah jadi 500+, SAW bisa melewati batas.
     Pantau: kalau muncul "Allowed memory size exhausted", itu sebabnya.

  3. AwardSpace free kadang menampilkan halaman interstitial untuk
     visitor pertama. Ini bisa mengganggu fetch() dari frontend.

  4. MySQL 30 MB. Cukup untuk sekarang, tapi bukan untuk jangka panjang.

  5. Bandwidth 5 GB/bulan. Untuk demo portfolio, cukup.

  Kalau salah satu dari 1-3 menghalangi, jalur paling realistis
  berikutnya adalah Render dengan verifikasi kartu $1 (tidak ditagih).
