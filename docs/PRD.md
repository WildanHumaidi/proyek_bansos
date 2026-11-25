# Product Requirements Document (PRD) — Hasil Reverse-Engineering
## BANPER / BansosHub: Sistem Pendukung Keputusan Penerima Bantuan Sosial (Metode SAW)

---

## 1. Overview & Problem Statement

### 1.1 Overview Proyek
Proyek ini bernama **BANPER (Bantuan Penerima)** atau pada antarmuka pengguna diberi jenama **BansosHub**. Aplikasi ini merupakan Sistem Pendukung Keputusan (SPK) berbasis web terintegrasi yang dirancang untuk mengotomatisasi pengusulan, verifikasi, dan perankingan calon penerima bantuan sosial menggunakan algoritma **Simple Additive Weighting (SAW)**.

### 1.2 Problem Statement
- **Subjektivitas & Transparansi:** Penentuan penerima bantuan sosial di tingkat lingkungan rukun tetangga/rukun warga (khususnya studi kasus RW 08 Kelurahan Meruyung, Kota Depok [ASUMSI]) sebelumnya dilakukan secara manual atau musyawarah tanpa pembobotan kuantitatif yang baku, memicu potensi salah sasaran dan keluhan warga.
- **Fragmentasi Data:** Data warga tersebar dalam berkas fisik atau spreadsheet lepas (CSV), menyulitkan sinkronisasi status pengajuan antara Ketua RT dan Pengurus RW.
- **Ketiadaan Saluran Komunikasi Terpusat:** Warga yang ditolak atau sedang diverifikasi tidak memiliki kanal langsung untuk mengetahui alasan atau melengkapi klarifikasi berkas tanpa harus tatap muka fisik.

---

## 2. Target User (Persona & Hak Akses)

Sistem menerapkan Role-Based Access Control (RBAC) 4 tingkat:

| Peran (Role) | Target Pengguna | Tanggung Jawab & Akses Utama |
|---|---|---|
| **Warga** | Masyarakat di lingkungan RW 08 | Registrasi mandiri, pengisian formulir 10 parameter kuesioner, pemantauan timeline status (Menunggu, Disetujui, Ditolak), dan diskusi/chat dua arah dengan Ketua RT. |
| **RT (Rukun Tetangga)** | Ketua RT 001 - RT 003 [ASUMSI] | Monitoring warga di RT-nya, entri kuesioner atas nama warga (*input on behalf*), verifikasi berkas pengajuan (Approve/Reject), chat klarifikasi dengan warga, dan melihat simulasi ranking SAW lokal RT. |
| **RW (Rukun Warga)** | Ketua / Sekretaris RW 08 | Monitoring data warga se-RW, eksekusi kalkulasi algoritma SAW lintas RT, filter perankingan penerima bansos, dan cetak/ekspor laporan rekomendasi tingkat RW. |
| **Admin** | Administrator Sistem | Akses superadmin: CRUD akun sistem (Admin, RW, RT, Warga), manajemen master kriteria & sub-kriteria (bobot & benefit/cost), import data massal via CSV, eksekusi utility normalisasi ("Sapu Ajaib"), audit activity log, dan cetak matriks & ranking global. |

---

## 3. Fitur yang Sudah Ada (User Stories)

### 3.0 Halaman Publik (Landing Page) — `/`
- **US-PUB-01:** Sebagai Pengunjung (belum login), saya dapat membuka alamat utama aplikasi dan melihat halaman pengenalan (landing page) berisi profil program bansos, alur pendaftaran, manfaat sistem, syarat pendaftaran, serta FAQ.
- **US-PUB-02:** Sebagai Pengunjung, saya dapat berpindah ke halaman Masuk (`/login`) atau Daftar (`/register`) melalui tombol pada landing page.
- **US-PUB-03:** Sebagai Pengguna yang sudah login, saat membuka `/` saya tetap diarahkan otomatis ke dashboard sesuai peran (bukan landing page).

### 3.1 Autentikasi & Profil
- **US-AUTH-01:** Sebagai Warga baru, saya dapat mendaftarkan akun secara mandiri dengan mengisi Nama Lengkap, Username, Password, RT, dan Alamat agar dapat mengajukan bansos.
- **US-AUTH-02:** Sebagai Pengguna (semua peran), saya dapat masuk (login) menggunakan Username dan Password, lalu diarahkan secara otomatis ke dashboard sesuai peran saya.
- **US-AUTH-03:** Sebagai Pengguna terautentikasi, saya dapat keluar (logout) dan token sesi saya dihapus.

### 3.2 Modul Warga (Citizen Portal)
- **US-WRG-01:** Sebagai Warga, saya dapat mengisi kuesioner profil ekonomi yang mencakup 10 kriteria penilaian dalam bentuk formulir interaktif bertahap (stepper).
- **US-WRG-02:** Sebagai Warga, saya dapat memantau status pengajuan secara real-time melalui kartu status dan timeline tahapan (Menunggu Verifikasi, Disetujui, Ditolak).
- **US-WRG-03:** Sebagai Warga, saya dapat berkirim pesan langsung (chat) dengan Ketua RT terkait tindak lanjut berkas pengajuan saya.

### 3.3 Modul RT (Neighborhood Portal)
- **US-RT-01:** Sebagai Ketua RT, saya dapat melihat ringkasan statistik warga dan antrean pengajuan yang membutuhkan verifikasi di RT saya.
- **US-RT-02:** Sebagai Ketua RT, saya dapat mendaftarkan akun warga baru di lingkungan RT saya secara langsung.
- **US-RT-03:** Sebagai Ketua RT, saya dapat mengisi atau memperbarui data kuesioner 10 kriteria atas nama warga (*input on behalf*) bagi warga lansia atau yang terkendala gawai.
- **US-RT-04:** Sebagai Ketua RT, saya dapat menyetujui (*Approve*) atau menolak (*Reject*) berkas pengajuan warga, di mana persetujuan secara otomatis mengonversi jawaban mentah menjadi relasi penilaian terstruktur di database.
- **US-RT-05:** Sebagai Ketua RT, saya dapat melakukan komunikasi dua arah melalui chat terintegrasi pada modal verifikasi berkas pengajuan.
- **US-RT-06:** Sebagai Ketua RT, saya dapat melihat daftar hasil perangkingan SAW khusus untuk warga di wilayah RT saya dan mencetaknya.

### 3.4 Modul RW (Community Portal)
- **US-RW-01:** Sebagai Ketua RW, saya dapat memantau data seluruh warga yang terdaftar di seluruh RT di bawah RW 08.
- **US-RW-02:** Sebagai Ketua RW, saya dapat men-trigger eksekusi perhitungan SAW secara dinamis dari database.
- **US-RW-03:** Sebagai Ketua RW, saya dapat memfilter hasil perangkingan berdasarkan RT tertentu atau melihat urutan gabungan se-RW.
- **US-RW-04:** Sebagai Ketua RW, saya dapat mengunduh atau mencetak laporan resmi hasil rekomendasi SAW dengan format standar cetak kop dokumen.

### 3.5 Modul Administrator (Master Control)
- **US-ADM-01:** Sebagai Admin, saya dapat mengelola seluruh akun pengguna sistem (tambah, edit data/password, hapus) dengan filtering peran dan pencarian teks.
- **US-ADM-02:** Sebagai Admin, saya dapat mengimpor data kuesioner warga secara massal dari file CSV dengan penanganan pemisah kolom (koma/titik koma) otomatis.
- **US-ADM-03:** Sebagai Admin, saya dapat mengelola master data 10 Kriteria (C1-C10), mengubah jenis atribut (Benefit/Cost), menyesuaikan persentase bobot, dan memperbarui rentang nilai sub-kriteria.
- **US-ADM-04:** Sebagai Admin, saya dapat menjalankan fungsi utilitas ("Sapu Ajaib" / `fixDataMentah`) untuk membersihkan data string JSON lama dan men-generate relasi `penilaian` secara menyeluruh.
- **US-ADM-05:** Sebagai Admin, saya dapat melihat tabel matriks keputusan terformat ($X_{ij}$) yang merefleksikan nilai sub-kriteria per warga.
- **US-ADM-06:** Sebagai Admin, saya dapat memantau riwayat audit log aktivitas yang merekam tindakan seluruh pengguna sistem.

---

## 4. Functional Requirements (FR)

### FR-01: Modul Autentikasi & Akun
- **FR-01.0:** Halaman `/` (landing page) wajib dapat diakses **tanpa autentikasi** dan menampilkan konten edukasi publik (profil program, alur, syarat, FAQ) tanpa data pribadi warga.
- **FR-01.1:** Sistem wajib mengenkripsi password menggunakan `Bcrypt` (Laravel default cost: 12).
- **FR-01.2:** Endpoint `/api/login` wajib memverifikasi username & password dan mengembalikan Bearer Token via Laravel Sanctum serta objek data profil pengguna.
- **FR-01.3:** Endpoint `/api/register` wajib memvalidasi keunikan username dan menetapkan peran default sebagai `warga`.
- **FR-01.4:** Sistem frontend wajib menyimpan token & user payload di `localStorage` dan melakukan rute pengalihan cerdas (*smart routing*) berdasarkan nilai `role`.

### FR-02: Modul Manajemen Data Warga & Pengajuan
- **FR-02.1:** Sistem mendukung pencatatan 10 parameter ekonomi warga:
  1. C1: Jumlah KK dalam 1 Rumah (Benefit)
  2. C2: Jumlah Anggota Keluarga dalam 1 Rumah (Benefit)
  3. C3: Pendidikan Kepala Keluarga (Cost)
  4. C4: Jumlah Anggota Keluarga Masih Sekolah (Benefit)
  5. C5: Pengeluaran Satu Jiwa dalam Keluarga Perbulan (Cost)
  6. C6: Penghasilan Satu Jiwa dalam Keluarga Perbulan (Cost)
  7. C7: Status Kepemilikan Rumah (Cost)
  8. C8: Sumber Air Bersih (Cost)
  9. C9: Penerangan Rumah (Cost)
  10. C10: Kepemilikan Transportasi/Kendaraan (Cost)
- **FR-02.2:** Form kuesioner disimpan dalam format JSON terenkapsulasi pada kolom `pengajuan.jawaban_mentah` dengan struktur key `q1` hingga `q10`.
- **FR-02.3:** Sistem membatasi 1 pengajuan aktif per data warga (`Pengajuan::where('id_warga', $idWarga)->first()`).
- **FR-02.4:** Status pengajuan memiliki 3 status valid: `menunggu`, `disetujui`, dan `ditolak`.

### FR-03: Modul Logika Algoritma SAW (Simple Additive Weighting)
- **FR-03.1:** Algoritma SAW hanya memproses data warga dengan `pengajuan.status = 'disetujui'`.
- **FR-03.2 (Normalisasi Bobot):** Bobot kriteria dinormalisasi menjadi skala 1 jika jumlah total bobot tidak sama dengan 1:
  $$W_j^* = \frac{W_j}{\sum W_k}$$
- **FR-03.3 (Normalisasi Matriks Keputusan):**
  - Kriteria Atribut **Benefit**:
    $$r_{ij} = \frac{x_{ij}}{\max_i(x_{ij})}$$
  - Kriteria Atribut **Cost**:
    $$r_{ij} = \frac{\min_i(x_{ij})}{x_{ij}}$$
- **FR-03.4 (Nilai Preferensi):**
  $$V_i = \sum_{j=1}^{n} W_j^* \cdot r_{ij}$$
- **FR-03.5 (Perankingan):** Skor akhir diurutkan secara menurun (*descending*), dan peringkat integer 1..N ditetapkan secara berurutan.

### FR-04: Modul Komunikasi & Audit
- **FR-04.1:** Percakapan terikat pada `id_pengajuan` dan memisahkan identitas pengirim (`pengirim_role`: `warga` atau `rt`).
- **FR-04.2:** Setiap aksi kritis (tambah/update/hapus user, ubah status pengajuan, update kriteria, import data, sapu ajaib) wajib dicatat dalam tabel `activity_logs` dengan format penamaan wilayah otomatis (`[RT 00x]` atau `[RW 08]`).

---

## 5. Non-Functional Requirements (NFR)

- **NFR-01 (Keamanan Transpor Data):** Seluruh komunikasi frontend ke backend melalui protokol REST API dengan autentikasi Bearer Token (Sanctum).
- **NFR-01a (Privasi Konten Publik):** Konten yang dapat diakses tanpa login hanya boleh bersifat edukatif/informatif; data warga, skor SAW, dan daftar penerima tidak boleh diekspos melalui halaman atau endpoint publik (menindaklanjuti temuan SEC-01 di `docs/AUDIT.md`).
- **NFR-02 (Responsivitas Antarmuka):** Antarmuka dibangun menggunakan layout adaptif, tipografi standar *Plus Jakarta Sans*, dan elemen ikonik *Material Symbols Outlined*.
- **NFR-03 (Pencetakan Terstandarisasi):** Modul cetak memanfaatkan media query `@media print` CSS landscape A4, menyembunyikan navigasi interaktif, dan menghasilkan tabel dokumen formal dengan kop resmi instansi RT/RW.
- **NFR-04 (Integritas Data Transaksional):** Operasi batch kritis seperti Import CSV menggunakan `DB::beginTransaction()` dan `DB::rollback()` untuk mencegah inkonsistensi saat kegagalan parsing baris.
- **NFR-05 (Kompatibilitas Runtime):** Backend kompatibel PHP 8.2+ dan Laravel 12; Frontend kompatibel Node.js 18+ dengan Vite 8 dan React 19.
- **NFR-06 (Aksesibilitas Dasar):** Teks sekunder harus memenuhi rasio kontras WCAG AA minimum 4.5:1 (teks normal) dan 3.0:1 (teks besar ≥18,66px tebal / ikon grafis), target sentuh minimal 44px pada tampilan <900px, serta tidak ada scroll horizontal pada viewport 360px (pengguna warga dengan literasi digital rendah).

---

## 6. Batasan & Asumsi Teknis

| Kode | Kategori | Deskripsi & Bukti Temuan Kode | Status |
|---|---|---|---|
| **ASM-01** | Lingkup Wilayah | Proyek diasumsikan beroperasi spesifik untuk lingkungan RW 08 Meruyung, Depok (hardcoded nilai `rw = '08'` dan `'008'` di database & controller). | [ASUMSI] |
| **ASM-02** | Master RT | Jumlah RT yang aktif dimodelkan adalah RT 001, RT 002, dan RT 003 berdasarkan seeder dan data CSV. | [ASUMSI] |
| **ASM-03** | Pembobotan Kriteria | Default bobot masing-masing dari 10 kriteria diset sama rata yaitu 10% (total 100%), namun dapat diubah oleh Admin. | Terverifikasi di Kode |
| **ASM-04** | Dualitas Tabel `users` vs `warga` | Terdapat dua tabel berbeda untuk entitas warga: tabel `users` (untuk login kredensial) dan tabel `warga` (untuk relasi pengajuan bansos). Hubungan antartabel dilakukan berbasis kecocokan nama (`users.name = warga.nama_lengkap`), bukan relasi Foreign Key ID langsung. | [ASUMSI] Arsitektur Warisan |
| **ASM-05** | Mekanisme Pembentukan Matriks | Saat pengajuan awal diserahkan oleh Warga, data hanya masuk sebagai teks JSON di `jawaban_mentah`. Matriks baru terurai menjadi relasi `penilaian` ketika RT menyetujui atau Admin menjalankan "Sapu Ajaib". | Terverifikasi di Kode |
| **ASM-06** | Skala Nilai Sub-Kriteria | Sub-kriteria terstandarisasi memiliki 4 opsi per kriteria dengan bobot kuantitatif 10, 7.5, 5, dan 2.5. | Terverifikasi di Kode |

---

## 7. Fitur Setengah Jadi, Belum Selesai, & Technical Debt (WIP)

Berdasarkan audit mendalam terhadap seluruh berkas kode sumber, ditemukan sejumlah celah teknis dan fitur yang belum tuntas:

> **Catatan status (2026-11-24):** banyak butir pada bagian 7 sudah dibereskan pada gelombang audit Nov 2026 (rincian lengkap & bukti di `docs/AUDIT.md`): middleware peran `role:*` sudah dipasang di seluruh rute privat, rate limiter `/login` aktif (`throttle:10,1`), dead controllers & model ganda dihapus, interceptor 401 terstandarkan pada `src/services/api.js`, serta duplikasi konstanta & komponen yatim dibersihkan. Butir tersisa yang masih berlaku ditandai **[BERLAKU]**. Bagian 7 dipertahankan sebagai riwayat temuan; matriks status resmi ada di `docs/AUDIT.md` dan kartu kanban.
>
> **Catatan status (2026-11-25):** gelombang remediasi kedua (basis `RE_AUDIT_BANSOS_HUB_REPORT.md`) menutup lapisan transformasi data yang tidak pernah disentuh audit sebelumnya — pemetaan jawaban CSV, status impor, scope ranking, dan ekspor laporan. Rincian lengkap, bukti test, dan daftar yang sengaja belum dikerjakan ada di **`FIX_IMPLEMENTATION_REPORT.md`**. Perubahan kontrak API yang berdampak ke frontend tercatat di §7.3.

### 7.1 Backend Gaps & Dead Code
1. **[SELESAI 2026-11-25] Konversi String RT:** Penomoran RT dulu disimpan bercampur antara integer (`1`) dan string tiga digit (`'001'`), memaksa setiap controller dan halaman menormalkan sendiri. Sekarang jalur tulis backend dipusatkan di `App\Services\RtFormatter` (`formatRt()` menyimpan tiga digit, `intValue()` untuk perbandingan sehingga data lama `'1'` tetap terbaca) dan frontend memakai satu helper `src/lib/rt.js` (`rtInt`, `rtKode`, `rtNomor`, `rtLabel`, `rtSama`). Nilai `<select>` RT di form warga/registrasi kini mengirim `001`/`002`/`003`, dan seluruh label wilayah memakai dua digit. Dijaga `tests/Unit/RtFormatterTest` (5 test) dan `docs/uat/guard_rt_kanonik.mjs`.

### 7.2 Frontend Gaps & Dead Artifacts
1. **[SELESAI 2026-11-25] Injeksi Desain Dinamis Runtime:** Tidak ada lagi injeksi runtime. Tailwind CDN dihapus (praktis tidak dipakai: dari 64 token `className` unik, 63 kelas custom dan hanya `select-none` utilitas Tailwind — kini CSS biasa di `src/index.css`). Google Fonts kini di-host sendiri dari `public/fonts/` lewat `src/fonts.css`, dengan Material Symbols disubset dari 4 MB menjadi 66 KB. `useDesign()` tinggal mengurus print stylesheet.
2. **[SELESAI 2026-11-25] UI pengaduan:** backend `pengaduan` + `pengaduan_riwayat` sudah berjalan dengan 11 test; panel `src/components/PengaduanPanel.jsx` sekarang dipasang di keempat dashboard (warga kirim & pantau miliknya, RT menindaklanjuti wilayahnya, RW/admin melihat semua dan dapat mengambil alih). Dijaga `docs/uat/guard_pengaduan.mjs` termasuk uji isolasi wilayah.
3. **[SELESAI 2026-11-25] Kontras halaman ranking:** audit tambahan menemukan teks di bawah ambang WCAG AA pada halaman ranking (Admin: tombol "Hitung Ulang" `#059669` + putih = 3.77; header tabel 4.38. RW: 2.49–2.56. RT: 4.38). Seluruh temuan sudah diperbaiki dan dijaga oleh `docs/uat/guard_kontras_ranking.mjs` (RT/RW/Admin: 0 gagal kontras, 0 target sentuh < 40px). Palet pengganti: teks sekunder `#94a3b8`/`#64748b` → `#475569`, amber `#ca8a04`/`#d97706` → `#a16207`/`#b45309`, merah `#dc2626` → `#b91c1c`, hijau tombol `#059669` → `#047857`, ikon centang `#22c55e` → `#15803d`, cyan `#0891b2` → `#0e7490`.

### 7.3 Kontrak API yang Berubah (2026-11-25)

Perubahan ini wajib diketahui sebelum mengubah frontend atau integrasi lain.

| Endpoint | Perubahan |
|---|---|
| `GET /api/saw/hitung` | Untuk peran `rt`, respons **hanya** berisi alternatif RT tersebut (`scope_rt` terisi) dan `ranking` dimulai dari 1. Field baru: `ranking_rt` (posisi dalam RT sendiri), `dilewati[]` (`id_pengajuan`, `nama_warga`, `rt`, `alasan`), `kriteria_tanpa_variasi[]`, `scope_rt`. Bila tidak ada alternatif eligible → `404` dengan `success:false` + `dilewati`. |
| `GET /api/saw/report/export?format=csv\|tsv` | **Baru.** Mengembalikan file (`Content-Disposition: attachment`) berisi `Nama Warga;RT;Skor;Ranking;Ranking RT;Keterangan`, mengikuti scope peran dan nilai yang sama dengan `/saw/hitung`. Format lain → `422`. |
| `POST /api/admin/pengajuan/import` | Status hasil impor **selalu** `menunggu`. Respons memuat laporan per baris (ditolak/di-skip + alasan). Satu baris gagal → seluruh impor rollback. |
| `POST /api/admin/fix-data` | Default `mode=dry-run` (tidak mengubah apa pun). Perubahan hanya terjadi dengan `mode=apply` eksplisit. |
| `GET/POST /api/pengaduan`, `PUT /api/pengaduan/{id}` | **Baru.** Warga mengirim & melihat miliknya; RT menindaklanjuti wilayahnya; admin dapat mengambil alih. |
| `GET /api/chat/{id}/belum-dibaca`, `PUT /api/chat/{id}/baca` | **Baru.** Jumlah pesan lawan bicara yang belum dibaca / tandai sudah dibaca. `GET` bersifat read-only — tidak menandai apa pun. |
| `POST /api/register`, `POST /api/warga/pengajuan`, `POST /api/admin/users` | Field `rt` kini **menolak `"0"`/`"00"`/`"000"`** dengan `422` (sebelumnya lolos validasi lalu menjadi `500`). Nilai `"1"` dan `"001"` sama-sama diterima dan dinormalkan ke `"001"`. |

### 7.4 Ketergantungan (Dependency) — status 2026-11-25

`composer audit` dan `npm audit` bersih (**0 advisory** di kedua sisi). Pembaruan
dilakukan dalam batas constraint yang sudah ada, sehingga **`composer.json` dan
`package.json` tidak berubah** — hanya lockfile:

| Sisi | Paket utama | Sebelum → Sesudah |
|---|---|---|
| Backend | `laravel/framework` | 12.58.0 → **12.74.0** (menutup 1 critical: TokenGuard auth bypass) |
| Backend | `laravel/sanctum` | 4.3.1 → **4.5.0** |
| Backend | `symfony/*` | 7.4.8 → **7.4.24** |
| Backend | `guzzlehttp/guzzle` | 7.10.0 → **7.17.0** |
| Backend | `league/commonmark` | 2.8.2 → **2.10.8** |
| Frontend | `axios` | 1.15.2 → **1.21.1** |
| Frontend | `react-router-dom` | 7.14.2 → **7.18.7** |
| Frontend | `vite` | 8.0.10 → **8.3.8** |

Regresi sesudah upgrade: 132 test backend hijau, ESLint bersih, build sukses, dan
enam guard UAT lolos.

---

## 8. Dual-Stack Inventory

### 8.1 Backend (Laravel 12)
```
bansos-backend/
├── app/
│   ├── Http/Controllers/Api/
│   │   ├── AuthController.php          [Aktif: Login, Register, Logout]
│   │   ├── UserController.php          [Aktif: CRUD users via User model]
│   │   ├── AdminRtController.php       [Aktif: Pengajuan, User, Import CSV, Sapu Ajaib]
│   │   ├── WargaController.php         [Aktif: Pengajuan warga, store RT, status]
│   │   ├── SawController.php           [Aktif: hitungRanking, getDataset]
│   │   ├── KriteriaController.php      [Aktif: CRUD kriteria & sub-kriteria]
│   │   ├── LogController.php           [Aktif: Activity log fetch & audit recording]
│   │   ├── ChatController.php          [Aktif: Pesan dua arah warga-RT]
│   │   └── PengaduanController.php     [Aktif: pengaduan warga/RT/admin]
│   ├── Services/                       [SSOT — ditambahkan 2026-11-25]
│   │   ├── RtFormatter.php             [format & validasi RT kanonik]
│   │   ├── JawabanMapper.php           [jawaban → sub-kriteria, tanpa fallback]
│   │   ├── PenilaianAssembler.php      [pembentukan baris penilaian]
│   │   ├── JawabanTidakDikenalException.php
│   │   ├── CsvImporter.php             [import CSV atomik, status menunggu]
│   │   └── SawCalculator.php           [ranking & dataset, scope per peran]
│   └── Models/
│       ├── User.php
│       ├── Warga.php
│       ├── Kriteria.php
│       ├── SubKriteria.php
│       ├── Pengajuan.php
│       ├── PengajuanRiwayat.php        [arsip jawaban saat pengajuan ulang]
│       ├── Penilaian.php
│       ├── Pengaduan.php
│       ├── PengaduanRiwayat.php
│       ├── PesanChat.php
│       └── ActivityLog.php
├── database/
│   ├── migrations/ (20 migration files)
│   ├── seeders/    (UserSeeder, KriteriaSeeder, ImportWargaSeeder, DatabaseSeeder)
│   └── data/data_warga.csv
└── routes/
    └── api.php                         [Definisi 42 endpoint aktif]
```

### 8.2 Frontend (React 19 + Vite)
```
bansos-frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx            [Aktif: /, halaman publik tanpa login]
│   │   ├── Login.jsx                   [Aktif: /login, auth redirect]
│   │   ├── RegisterWarga.jsx           [Aktif: /register]
│   │   ├── WargaDashboard.jsx          [Aktif: /warga, portal warga]
│   │   ├── RtDashboard.jsx             [Aktif: /rt, portal ketua RT]
│   │   ├── RwDashboard.jsx             [Aktif: /rw, portal ketua RW]
│   │   ├── AdminDashboard.jsx          [Aktif: /dashboard, admin super control]
│   │   └── DiagnosaKoneksi.jsx         [Aktif: /diagnosa, cek konektivitas API]
│   ├── components/
│   │   └── RankingWarnings.jsx         [Banner dilewati / kriteria konstan / error SAW]
│   ├── services/
│   │   └── api.js                      [Axios instance + 401 interceptor + helper auth]
│   ├── lib/
│   │   ├── api.js                      [Re-export shim untuk App.jsx & LandingPage]
│   │   └── report.js                   [unduhLaporanSaw → GET /saw/report/export]
│   ├── App.jsx                         [Router & role guard]
│   └── main.jsx
```

---

## 9. Rekomendasi Roadmap Perbaikan

> **Catatan status (2026-11-24):** prioritas 1 & 2 di bawah sudah tuntas pada gelombang audit Nov 2026 — middleware role, rate limiter, penghapusan dead controller/model ganda/komponen yatim, dan konsolidasi client API. Rincian & bukti: `docs/AUDIT.md`, kartu kanban `it-engineering`.
>
> **Catatan status (2026-11-25):** prioritas 3 tertutup — jalur tulis RT dipusatkan ke `App\Services\RtFormatter` dan frontend memakai `src/lib/rt.js`, sehingga satu wilayah tidak lagi tampil sebagai `1`, `01`, dan `001` di tempat berbeda. Prioritas 4 (dependensi styling runtime) juga tertutup — Tailwind CDN dihapus dan Google Fonts kini di-host sendiri dari `public/fonts/`. Lihat `FIX_IMPLEMENTATION_REPORT.md` §8c dan §8d.

1. **Security Hardening (Prioritas 1) — [SELESAI 2026-11]:**
   - Middleware peran `role:admin` / `role:rt` / `role:rw` sudah dipasang pada seluruh rute privat di `api.php`.
   - Rate limiter `/login` aktif (`throttle:10,1`).
2. **Pembersihan Arsitektur & Dead Code (Prioritas 2) — [SELESAI 2026-11]:**
   - `RtController.php` & `PengajuanController.php` dihapus; `PengajuanDetail.php` (model ganda) disatukan ke `Penilaian.php`.
   - Komponen yatim `Components.jsx` dan duplikasi konstanta (`src/lib/constants.js`, `src/service/shared.js`) dibersihkan; client HTTP distandarkan ke `src/services/api.js` (interceptor 401).
3. **Refaktorisasi Basis Data (Prioritas 3) — [TERBUKA]:**
   - Migrasikan relasi `users` dan `warga` menjadi relasi relasional formal (`user_id` foreign key) untuk mencegah kegagalan pencocokan data jika terjadi pengubahan nama warga.
   - Buat format kolom `rt` konsisten integer atau string 3 digit di seluruh skema (konsolidasi dari normalisasi lokal `fmtNum` saat ini).
4. **Dependensi Styling Runtime (Prioritas 4) — [SELESAI 2026-11-25]:**
   - **Tailwind CDN: dihapus.** Tidak ada lagi permintaan ke `cdn.tailwindcss.com`; satu-satunya utilitas yang dipakai (`select-none`) kini CSS biasa di `src/index.css`.
   - **Google Fonts: di-host sendiri.** Berkas font ada di `public/fonts/` dan dimuat lewat `src/fonts.css`. Material Symbols memakai subset 66 KB (64 ikon) alih-alih 4 MB versi penuh. `index.html` bersih dari `preconnect`/`<link>` Google, `useDesign()` tidak lagi menyuntik apa pun, dan `Inter` (dipakai 1 baris) dihapus.
   - **Konsekuensi:** styling tidak lagi bergantung koneksi internet. Catatan operasional: menambah ikon baru **wajib** memperbarui subset — caranya di `docs/uat/README.md`.
