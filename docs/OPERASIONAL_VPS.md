# Operasional VPS BansosHub

Ringkasan akses, TLS, dan backup untuk VPS produksi. Angka dan perintah di sini
sudah dijalankan dan diverifikasi, bukan rencana.

## Alamat

```
https://bansoshub.duckdns.org      domain publik (TLS, port standar)
http://31.59.119.233:8080          alamat lama, sekarang 308 redirect ke domain
root@31.59.119.233 -p 20209        SSH, key ~/.ssh/bansos_vps
```

Tidak ada lagi trafik yang dilayani lewat HTTP polos: `:8080` hanya membalas
`308` ke domain, jadi password tidak pernah lewat jaringan tanpa enkripsi. Pakai
`https://bansoshub.duckdns.org/up` untuk health check — `:8080/up` sekarang
membalas 308, bukan 200.

## Kenapa HTTPS-nya bisa di port 443

IP publik 31.59.119.233 dipakai bersama pelanggan lain. Yang membuat 80/443 bisa
masuk bukan port forwarding di VPS, tapi fitur **Domain (proxy 80/443)** di panel
provider: edge mereka membaca header Host, lalu meneruskan ke VPS ini.

Dua hal harus ada bersamaan, kalau tidak situs mati:

1. A record `bansoshub.duckdns.org` → `31.59.119.233` (DuckDNS, TTL 60s)
2. Entri domain di panel provider: detail VPS → Domain → `bansoshub.duckdns.org`

Gejala kalau salah satu hilang:

```
503 Service Unavailable — No server is available to handle this request
   -> domain belum terdaftar di panel provider
000 / connection refused
   -> DNS belum mengarah ke IP ini, atau TTL masih cache
```

## Sertifikat

Let's Encrypt, diterbitkan lewat acme.sh dengan HTTP-01 (webroot
`/var/www/acme`, dijangkau edge provider). Berlaku sampai 25 Feb 2027.

```
/root/.acme.sh/acme.sh --list                       # status + jadwal renew
/root/.acme.sh/acme.sh --renew -d bansoshub.duckdns.org --ecc --force
```

Perpanjangan otomatis oleh cron root acme.sh (tiap 6 jam, renew kalau < 30 hari),
dengan `--reloadcmd "systemctl reload nginx"`. Sertifikat aktif ada di
`/etc/ssl/bansos/`.

## Nginx

```
/etc/nginx/sites-enabled/bansos          listen 8080, 308 redirect ke domain
/etc/nginx/sites-enabled/bansos-domain   listen 80 (redirect + ACME) dan 443 (TLS)
```

Vhost 443 memuat SPA dari `/var/www/bansos/frontend` dan meneruskan `/api/*` ke
`php8.3-fpm`. `location ~ \.php$ { return 404; }` dan `location ~ /\.` wajib ada:
itu yang mencegah file unggahan dieksekusi dan `.env`/`.git` tersaji.

Vhost `:8080` sengaja memakai `308`, bukan `301`: `301` mengubah `POST` menjadi
`GET`, sehingga klien lama yang masih memanggil `/api/*` lewat IP akan kehilangan
body request. Sudah diuji — `POST http://31.59.119.233:8080/api/login` diteruskan
sebagai `POST` ke domain dan membalas `401` (kredensial salah), bukan error.

## Backup database

```
/etc/cron.d/bansos-db-backup        30 19 * * * (02:30 WIB; jam VPS UTC)
/usr/local/bin/bansos-db-backup.sh  sumber: bansos-backend/deploy/backup-db.sh
/var/backups/bansos-db/             *.sql.gz + .sha256 + .counts.txt, simpan 14 hari
/var/log/bansos-db-backup.log       satu baris per run
```

Tiap run bukan cuma dump: hasilnya di-restore ke database sementara
`bansos_restore_check`, jumlah baris tabel utama dibandingkan, lalu database uji
di-drop. Kalau ada yang tidak cocok, log menulis `GAGAL` dan file tidak dianggap
sah.

Restore manual:

```
gunzip -c /var/backups/bansos-db/bansos-YYYYmmdd-HHMMSSZ.sql.gz \
  | mysql -u root bansos
```

## Keamanan

Ringkasan kontrol yang aktif setelah audit, semua sudah diuji dari internet:

- SSH: hanya public key (`PasswordAuthentication no`, `PermitRootLogin
  prohibit-password`, `MaxAuthTries 3`). Drop-in yang menang urutan adalah
  `/etc/ssh/sshd_config.d/00-hardening.conf` — file bawaan provider
  `00-vpsmurah.conf` masih berisi `yes`, tapi dibaca setelahnya sehingga kalah.
- fail2ban aktif, jail `sshd` (4 percobaan gagal / 10 menit → ban 1 jam).
- Nginx: TLS 1.2/1.3 saja, HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy.
  `location ~ \.php$ { return 404; }` dan `deny all` untuk file titik wajib ada.
- Login: throttle 60/menit per IP edge (longgar, karena semua klien berbagi satu
  IP) ditambah batas 5 percobaan/menit **per akun** di `AuthController::login`.
  Tanpa batas per akun, satu penyerang bisa mengunci login semua orang.
- `.env` 640 `root:www-data`; dump backup 600 root di `/var/backups`.
- Repo publik tidak lagi memuat data warga: dump SQL, laporan PDF, dan CSV asli
  sudah dihapus dari seluruh history (rewrite + force push). Salinan asli ada di
  `E:\Backup\bansos-pii-20261127` **di luar** repo.

Konsekuensi yang perlu diketahui: karena edge provider tidak meneruskan
`X-Forwarded-For`, semua permintaan tercatat dari `10.10.0.1` dan log aplikasi
tidak bisa menunjukkan IP asli pengguna.

## Rollback

```
# 1. balikin vhost 8080 jadi penyaji SPA (bukan redirect)
cp /root/bansos.8080-vhost.bak-<timestamp> /etc/nginx/sites-available/bansos

# 2. lepas domain + sertifikat dari jalur publik
rm /etc/nginx/sites-enabled/bansos-domain

# 3. balikin URL aplikasi
cp /root/.env.bak-<timestamp> /var/www/bansos/bansos-backend/.env
cd /var/www/bansos/bansos-backend && php artisan optimize:clear && php artisan config:cache

nginx -t && systemctl reload nginx
```

Setelah rollback, situs kembali disajikan di `http://31.59.119.233:8080` tanpa
TLS. Jangan lupa hapus juga entri domain di panel provider kalau edge-nya ikut
bermasalah.

## Batasan yang perlu diingat

- Kontrak VPS berakhir **22 Des 2026**; setelah itu domain dan sertifikat ikut mati.
- RAM 1 GB (+2 GB swap). Jangan jalankan `composer install`, `artisan migrate`,
  dan uji browser bersamaan; cek `free -m` dan `dmesg | grep -i killed` kalau 502.
- DuckDNS gratis tanpa SLA. Kalau butuh URL yang layak masuk laporan PKL,
  domain `.my.id` berbayar murah bisa dipasang dengan langkah yang sama.
- HSTS aktif 1 tahun, jadi browser yang sudah pernah membuka domain ini akan
  memaksa HTTPS. Jangan pasang sertifikat rusak di domain ini.