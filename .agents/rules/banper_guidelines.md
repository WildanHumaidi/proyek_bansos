---
description: Aturan utama pengembangan proyek BANPER (Bantuan Sosial SAW) untuk menjaga konsistensi desain dan kesesuaian dengan PRD.
---

# BANPER Project Guidelines

Aturan-aturan berikut **WAJIB** diikuti oleh AI Agent saat melakukan perubahan, penambahan fitur, atau refaktorisasi pada proyek BANPER.

## 1. Kepatuhan Ketat pada PRD (Strict PRD Adherence)
- **Hanya Berdasarkan PRD:** Selalu jadikan `PRD_Banper_Bansos_SAW.md` sebagai acuan utama (Source of Truth). 
- **Dilarang Menghayal/Asumsi:** Jangan menambahkan fitur baru, role baru, atau logika bisnis yang tidak tercantum di dalam PRD kecuali diminta secara spesifik dan eksplisit oleh pengguna.
- **Fokus pada Scope:** Pastikan setiap solusi yang diberikan tetap berada dalam ruang lingkup (scope) yang sudah ditetapkan di PRD. Jangan memperlebar cakupan proyek.

## 2. Konsistensi Desain (Design Consistency)
- **Pertahankan Desain Saat Ini:** Desain antarmuka (UI/UX) yang sudah ada saat ini adalah standar acuan mutlak.
- **Dilarang Mengubah Gaya Visual:** Jangan mengubah tema warna, struktur layout, font (Plus Jakarta Sans), ikon (Material Symbols/Lucide React), atau arsitektur CSS yang sudah ditetapkan, kecuali pengguna secara eksplisit meminta perbaikan *styling*.
- **Gunakan Komponen yang Ada:** Jika membuat elemen atau halaman baru, selalu periksa halaman yang sudah ada (seperti `AdminDashboard.jsx` atau `WargaDashboard.jsx`) dan gunakan pola styling yang sama (Tailwind classes, animasi CSS, dll).

## 3. Aturan Logika SAW
- **Dilarang Mengubah Algoritma Utama:** Algoritma Simple Additive Weighting (SAW) di backend (khususnya pada `SawController.php`) sudah final. Jangan mengubah logika matematika dan normalisasinya, kecuali untuk tujuan *bug-fixing* yang terbukti secara matematis.

## 4. Penggunaan Alat (Tools)
- Sebelum menulis kode baru, selalu gunakan kemampuan Anda untuk membaca kode yang sudah ada untuk memastikan pola yang digunakan sejalan dengan standar proyek ini.
