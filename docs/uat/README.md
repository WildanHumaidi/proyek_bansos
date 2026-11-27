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
| `guard_kontras_wcag.mjs` | Kontras teks (WCAG AA 4.5 / 3.0 utk teks besar) + target sentuh >=40px di halaman **Beranda** | `0 gagal kontras`, `0 target < 40px` |
| `guard_kontras_ranking.mjs` | Kontras + target sentuh + overflow di halaman **Ranking** RT/RW/Admin | semua `PASS`, exit code 0 |
| `guard_pengaduan.mjs` | Panel pengaduan di 4 peran: kontras, target sentuh, overflow, dan **isolasi wilayah** (RT 001 tidak boleh melihat pengaduan RT 003) | semua `PASS`, exit code 0 |
| `guard_rt_kanonik.mjs` | Label RT di seluruh dashboard harus `RT 01` (dua digit); nilai `<select>` RT yang dikirim ke API harus tiga digit (`001`) | semua `PASS`, exit code 0 |
| `guard_chat_belum_dibaca.mjs` | Badge pesan belum dibaca: muncul saat RT membalas, hilang setelah diskusi dibuka, dan tetap nol setelah reload (status tersimpan di server) | semua `PASS`, exit code 0 |
| `guard_chat_polling.mjs` | Balasan RT muncul di layar warga **tanpa reload** (polling 15 s), badge muncul saat di Beranda, hilang saat Diskusi dibuka, dan pesan tidak terduplikasi setelah beberapa siklus | 8 pemeriksaan, exit code 0 |
| `guard_chat_polling_rt.mjs` | Balasan warga muncul di modal verifikasi RT tanpa menutup-buka modal; RT tetap bisa mengirim pesan setelah polling berjalan | 6 pemeriksaan, exit code 0 |
| `guard_tanpa_tailwind_cdn.mjs` | Tidak ada lagi permintaan ke `cdn.tailwindcss.com`; tidak ada kelas berpola utilitas Tailwind di DOM; `select-none` tetap berlaku dari `src/index.css` | 7 pemeriksaan, exit code 0 |
| `guard_font_self_hosted.mjs` | Tidak ada permintaan ke `fonts.googleapis.com`/`fonts.gstatic.com`; Plus Jakarta Sans & Material Symbols benar-benar `loaded`; glyph ikon tergambar (bukan teks melebar) di 5 halaman | 18 pemeriksaan, exit code 0 |
| `guard_ikon_subset.mjs` | **Setiap** nama ikon di `src/` — termasuk yang dinamis seperti `name={showPw ? 'visibility' : 'visibility_off'}` — punya glyph di subset font; `/`, `/login`, `/register` bersih dari ikon yang tampil sebagai teks; tombol mata berganti ikon di kedua keadaan | 10 pemeriksaan, exit code 0 |
| `guard_rt_mobile.mjs` | Dashboard RT di HP (320/360/390px): setiap tab punya tombol yang **di dalam** layar (dulu kolom Aksi ada di x=422 sehingga Ketua RT tak bisa memverifikasi), tidak ada sel tabel terpotong, tidak ada scroll horizontal, tombol aksi minimal 40px | 24 pemeriksaan, exit code 0 |
| `guard_admin_mobile.mjs` | Dashboard Admin di HP (320/360/390px): 8 tab bersih dari scroll horizontal & teks terpotong; header Cetak/Import/Hitung/Tambah Akun turun ke baris kedua; tabel jadi kartu (thead hilang) kecuali Matriks SAW yang tetap tabel lebar dengan penggeseran di dalam kartu + petunjuk; semua target sentuh ≥40px | 38 pemeriksaan × 3 lebar, exit code 0 |
| `guard_rw_mobile.mjs` | Dashboard RW di HP (320/360/390px): tabel Beranda/Database Warga/Perangkingan berubah jadi kartu, tombol Cetak/Unduh/Hitung Ulang turun ke baris kedua (dulu tombol Hitung di x=373), tidak ada teks terpotong/scroll horizontal, semua target ≥40px | 48 pemeriksaan (16 × 3 lebar), exit code 0 |
| `guard_scroll_font_race.mjs` | Halaman login tidak melebar saat font web masih dimuat (FOIT race) | `scrollW=360` di semua titik waktu |

> **Tabel di HP = kartu.** Tabel data dashboard (`.mob-table`) berubah jadi daftar
> kartu di bawah 900px: satu `<tr>` satu kartu, tiap sel membawa label kolomnya lewat
> `data-label` yang diisi `src/lib/mobTable.js` (`pasangLabelTabel`). Aturan CSS-nya
> ada di `src/index.css`, semuanya di dalam media query sehingga desktop tidak
> berubah. Tanpa ini tabel desktop terpotong dan kolom Aksi (Tinjau / edit / hapus)
> berada di luar layar.

> Halaman ranking dipisah ke skripnya sendiri karena `guard_kontras_wcag.mjs` hanya
> menyapu Beranda — celah itulah yang dulu membiarkan 96 teks di bawah ambang WCAG
> lolos tanpa terdeteksi di dashboard Admin.


### Cara memperbarui subset ikon Material Symbols

Subset ikon di `bansos-frontend/public/fonts/material-symbols-subset.woff2` hanya
memuat ikon yang benar-benar dipakai (64 dari ~3.500). **Kalau menambah ikon baru
ke UI, subset harus dibuat ulang** — glyph yang tidak ada akan tampil sebagai teks
(tulisan `dashboard` selebar 162 px), bukan ikon. Teks di sekitarnya tetap normal,
jadi kegagalan ini mudah lolos kalau tidak diperiksa.

1. Kumpulkan semua nama ikon dari kode:

   ```bash
   cd bansos-frontend
   { grep -rho 'name="[a-z_0-9]*"' src/ --include=*.jsx | sed 's/name="//;s/"//'
     grep -rho "icon: '[a-z_0-9]*'"  src/ --include=*.jsx | sed "s/icon: '//;s/'//"
     grep -rho 'icon="[a-z_0-9]*"'   src/ --include=*.jsx | sed 's/icon="//;s/"//'
     grep -rho 'name={[^}]*}'        src/ --include=*.jsx | grep -o "'[a-z_][a-z_0-9]*'" | tr -d "'"
   } | sort -u | paste -sd, -
   ```

   Baris terakhir wajib: nama ikon yang dipilih lewat ekspresi (mis.
   `name={showPw ? 'visibility' : 'visibility_off'}`) **tidak** tertangkap pola
   `name="..."`. Karena terlewat, `visibility_off` dan `visibility` absen dari subset
   selama beberapa waktu — tombol mata di `/login` dan `/register` tampil sebagai
   tulisan sepanjang 80 px.

2. Ambil CSS + berkas font dari Google dengan parameter `icon_names`:

   ```bash
   UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
   (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
   ICONS="<hasil langkah 1>"
   curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=$ICONS&display=block" -o ms.css
   curl -s -A "$UA" -o public/fonts/material-symbols-subset.woff2 \
     "$(grep -o 'https://fonts.gstatic.com[^)]*' ms.css | head -1)"
   ```

3. Jalankan `guard_ikon_subset.mjs` **dan** `guard_font_self_hosted.mjs`. Yang pertama
   memeriksa seluruh nama ikon di sumber satu per satu (termasuk halaman publik yang
   tidak disapu guard font), yang kedua memeriksa jaringan & halaman setelah login.
   Keduanya **terbukti bisa gagal**: dengan subset lama, `guard_ikon_subset.mjs`
   melaporkan 3 nama tanpa glyph (`add`, `assignment_add`, `visibility_off`) dan
   `guard_font_self_hosted.mjs` melaporkan ikon melebar saat font dipotong 2 KB.
   Kalau semua hijau, subset lengkap.

> Ukuran referensi: 67 ikon = **70 KB**. Versi penuh = **4 MB** (~3.500 ikon).

> **Prasyarat data untuk guard chat.** Tiga guard chat (`guard_chat_belum_dibaca`,
> `guard_chat_polling`, `guard_chat_polling_rt`) memakai akun demo `warga01` dan
> membutuhkan **warga itu punya pengajuan**. Di database live `warga01` menunjuk
> `id_warga 1`, sedangkan pengajuan live dimulai dari `id_warga 2` — jadi ketiganya
> akan mencetak `LEWATI ... (prasyarat)` dan keluar dengan kode 0, bukan gagal.
> Jalankan terhadap DB uji berisi seed demo untuk pemeriksaan penuh.

> **Batas login.** `/api/login` dibatasi `throttle:10,1`. Skrip yang membuka 4 peran
> memakai 4 login per run, jadi **jangan jalankan lebih dari dua kali berturut-turut
> dalam satu menit** — run ketiga akan kena 429 dan tampak seperti kegagalan UI.
> `guard_pengaduan.mjs` mengambil token sekali per peran lewat API (bukan login di
> browser) dan mencetak pesan jelas bila batas itu tercapai.


## Menjalankan

```
cd docs/uat
CHROME_PATH="<path chrome>" node guard_overflow_mobile.mjs
CHROME_PATH="<path chrome>" node guard_kontras_wcag.mjs
CHROME_PATH="<path chrome>" node guard_kontras_ranking.mjs
CHROME_PATH="<path chrome>" node guard_pengaduan.mjs
CHROME_PATH="<path chrome>" node guard_rt_kanonik.mjs
CHROME_PATH="<path chrome>" node guard_chat_belum_dibaca.mjs
CHROME_PATH="<path chrome>" node guard_chat_polling.mjs
CHROME_PATH="<path chrome>" node guard_chat_polling_rt.mjs
CHROME_PATH="<path chrome>" node guard_tanpa_tailwind_cdn.mjs
CHROME_PATH="<path chrome>" node guard_font_self_hosted.mjs
CHROME_PATH="<path chrome>" node guard_ikon_subset.mjs
CHROME_PATH="<path chrome>" node guard_rt_mobile.mjs
CHROME_PATH="<path chrome>" UJI_LEBAR=320 node guard_rt_mobile.mjs
```

`guard_ikon_subset.mjs` membaca nama ikon dari `src/`; kalau dijalankan dari
luar folder frontend, arahkan `SRC_DIR="<repo>/bansos-frontend/src"`.

Catatan: `guard_kontras_wcag.mjs` melewatkan elemen berlatar gradien karena
kontrasnya tidak bisa dihitung andal dari computed style; bagian itu diperiksa manual
lewat screenshot di `docs/screenshots/uat_*.png`.
