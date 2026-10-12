# BansosHub Backend — RESTful API (Laravel 12)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PHP: >=8.2](https://img.shields.io/badge/PHP-%3E%3D8.2-777bb4.svg)](https://php.net)
[![Framework: Laravel 12](https://img.shields.io/badge/Framework-Laravel_12-red.svg)](https://laravel.com)
[![Tests: Passing](https://img.shields.io/badge/Tests-19_Passing-brightgreen.svg)](#testing)

RESTful API backend untuk sistem pendukung keputusan penyaluran bantuan sosial menggunakan metode Simple Additive Weighting (SAW). Menyediakan layanan autentikasi berbasis Sanctum, otorisasi multi-peran (Admin, RW, RT, Warga), perhitungan matriks SAW dinamis, dan sistem konsultasi per pengajuan.

---

## Fitur Utama

- **Autentikasi & Otorisasi**: Laravel Sanctum API Token dengan middleware pembatasan hak akses berbasis peran (`admin`, `rw`, `rt`, `warga`).
- **Engine Kalkulasi SAW**: Normalisasi matriks multi-kriteria 10 dimensi (Benefit vs Cost) dengan skor preferensi akhir.
- **Workflow Persetujuan Bertingkat**: RT memverifikasi pengajuan warga; persetujuan otomatis menghasilkan entri penilaian matriks.
- **Manajemen Kuesioner & Import CSV**: Dukungan impor massal data warga dari CSV.
- **Audit Logging**: Pencatatan aktivitas sensitif pengguna ke tabel `activity_logs`.

---

## Prasyarat Lingkungan

- PHP >= 8.2 (ekstensi: `pdo_sqlite`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`)
- Composer >= 2.x

---

## Langkah Instalasi

1. Salin template environment:
   ```bash
   cp .env.example .env
   ```
2. Pasang dependensi:
   ```bash
   composer install
   ```
3. Generate application key:
   ```bash
   php artisan key:generate
   ```
4. Jalankan migrasi dan seeder:
   ```bash
   php artisan migrate --seed
   ```
5. Jalankan server lokal:
   ```bash
   php artisan serve
   ```
   API aktif di `http://127.0.0.1:8000`.

---

## Testing & Linter

```bash
# Menjalankan seluruh test suite otomatis (19 tests, 48 assertions)
php artisan test

# Menjalankan linter kode Laravel Pint
composer lint

# Memformat kode otomatis
composer format
```

---

## Lisensi

[MIT License](LICENSE) (c) 2026 Wildan Humaidi
