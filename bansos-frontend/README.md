# BansosHub Frontend — Single Page Application (React 19 + Vite)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React: 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Vite: 8](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev)
[![Lint: Clean](https://img.shields.io/badge/ESLint-0_Warnings-brightgreen.svg)](#code-quality)

Aplikasi antarmuka pengguna (Single Page Application) untuk platform BansosHub SPK SAW, dibangun menggunakan React 19, Vite, dan Tailwind CSS. Menyediakan dashboard khusus untuk setiap peran: Administrator, Ketua RW, Ketua RT, dan Warga.

---

## Fitur Berdasarkan Peran

- **Dashboard Admin**: Ringkasan statistik sistem, matriks nilai, kuesioner, kalibrasi kriteria & sub-kriteria, log aktivitas.
- **Dashboard RW**: Monitoring agregat lintas RT, perankingan global SAW, dan cetak laporan.
- **Dashboard RT**: Verifikasi pengajuan warga wilayahnya, input kuesioner warga, dan ruang diskusi chat langsung.
- **Portal Warga**: Pengisian kuesioner 10 butir dengan pelacakan progres, status pengajuan real-time, dan konsultasi interaktif.
- **Diagnosa Koneksi**: Halaman diagnostik jaringan internal (`/diagnosa`) untuk memvalidasi status backend & CORS.

---

## Prasyarat Lingkungan

- Node.js >= 20.x
- npm >= 10.x

---

## Langkah Instalasi

1. Salin template environment:
   ```bash
   cp .env.example .env
   ```
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
   Aplikasi aktif di `http://localhost:5173`.

---

## Code Quality & Build

```bash
# Linter ESLint (0 errors, 0 warnings)
npm run lint

# Formatter Prettier
npm run format

# Production Build
npm run build
```

---

## Lisensi

[MIT License](LICENSE) (c) 2026 Wildan Humaidi
