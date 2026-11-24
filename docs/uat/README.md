# UAT Otomatis — Portal Warga BansosHub

Empat skrip penjaga (regression guard) untuk UI mobile. Semuanya menguji aplikasi
yang sedang berjalan (bukan unit test) lewat Playwright + Chromium yang sudah ada
di mesin, jadi tidak perlu `npm install` tambahan.

## Persiapan

1. Backend: `cd bansos-backend && php artisan serve --host=127.0.0.1 --port=8000`
2. Frontend: `cd bansos-frontend && npm run dev -- --host 127.0.0.1 --port 5173`
3. Pastikan `bansos-frontend/.env` menunjuk ke `http://127.0.0.1:8000/api`
   (kalau tidak, login akan gagal karena CORS/base URL salah).
4. Data demo: `php artisan migrate:fresh --seed` — akun uji:
   `admin/admin123`, `rw08/rw123`, `rt001/rt123`, `warga01/warga123`.

Playwright-core dipakai dari cache Hermes; set `CHROME_PATH` ke Chromium lokal:

```
CHROME_PATH="C:\Users\<user>\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe"
```

## Skrip

| Skrip | Yang dijaga | Kriteria lulus |
|---|---|---|
| `guard_overflow_mobile.mjs` | Tidak ada scroll horizontal di 360px pada 9 halaman lintas peran (login, register, warga beranda/kuesioner/status/diskusi, RT, RW, admin) | `0 overflow` |
| `guard_sidebar_mobile.mjs` | Sidebar RT/RW/Admin sembunyi di HP, terbuka lewat tombol hamburger, ada penggelap, ketuk luar menutup | semua cek `PASS` |
| `guard_kontras_wcag.mjs` | Kontras teks (WCAG AA 4.5 / 3.0 utk teks besar) + target sentuh >=40px | `0 gagal kontras`, `0 target < 40px` |
| `guard_scroll_font_race.mjs` | Halaman login tidak melebar saat font web masih dimuat (FOIT race) | `scrollW=360` di semua titik waktu |

## Menjalankan

```
cd docs/uat
CHROME_PATH="<path chrome>" node guard_overflow_mobile.mjs
CHROME_PATH="<path chrome>" node guard_kontras_wcag.mjs
```

Catatan: `guard_kontras_wcag.mjs` melewatkan elemen berlatar gradien karena
kontrasnya tidak bisa dihitung andal dari computed style; bagian itu diperiksa manual
lewat screenshot di `docs/screenshots/uat_*.png`.
