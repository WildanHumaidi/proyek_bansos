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
- **NFR-02 (Responsivitas Antarmuka):** Antarmuka dibangun menggunakan layout adaptif, tipografi standar *Plus Jakarta Sans*, dan elemen ikonik *Material Symbols Outlined*.
- **NFR-03 (Pencetakan Terstandarisasi):** Modul cetak memanfaatkan media query `@media print` CSS landscape A4, menyembunyikan navigasi interaktif, dan menghasilkan tabel dokumen formal dengan kop resmi instansi RT/RW.
- **NFR-04 (Integritas Data Transaksional):** Operasi batch kritis seperti Import CSV menggunakan `DB::beginTransaction()` dan `DB::rollback()` untuk mencegah inkonsistensi saat kegagalan parsing baris.
- **NFR-05 (Kompatibilitas Runtime):** Backend kompatibel PHP 8.2+ dan Laravel 12; Frontend kompatibel Node.js 18+ dengan Vite 8 dan React 19.

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

### 7.1 Backend Gaps & Dead Code
1. **Otorisasi Role di API Routes Terbuka (Security Loophole):**
   - Di `routes/api.php`, seluruh rute privat hanya dilindungi oleh middleware `auth:sanctum`.
   - Tidak ada middleware peran (seperti `role:admin`, `role:rt`, `role:rw`). Pengguna dengan role `warga` yang memiliki token secara teknis dapat melakukan request HTTP langsung ke endpoint mutasi Admin seperti `DELETE /api/users/{id}`, `PUT /api/kriteria/{id}`, atau `POST /api/admin/pengajuan/import`.
2. **Controller Mati / Tidak Terdaftar (Dead Controllers):**
   - Berkas `app/Http/Controllers/Api/RtController.php` tidak pernah di-import atau dipanggil dalam `routes/api.php` (fungsinya terduplikasi ke `AdminRtController` dan `ChatController`).
   - Berkas `app/Http/Controllers/Api/PengajuanController.php` tidak terdaftar di rute mana pun; alur pengajuan dialihkan ke `WargaController` dan `AdminRtController`.
3. **Duplikasi Model Eloquent:**
   - Model `App\Models\Penilaian` dan `App\Models\PengajuanDetail` menunjuk ke tabel fisik yang persis sama (`penilaian`).
4. **Ketiadaan Rate Limiting pada Auth:**
   - Rute `/login` dan `/register` belum dilengkapi middleware `throttle:login` atau pembatas frekuensi request brute-force.
5. **Konversi String RT:**
   - Penomoran RT disimpan bercampur antara format integer (`1`, `2`, `3`) dan string tiga digit ber-padding nol (`'001'`, `'002'`, `'003'`), memaksa banyak baris kode controller dan frontend melakukan normalisasi regex/pad manual.

### 7.2 Frontend Gaps & Dead Artifacts
1. **Komponen Yatim / Tak Terpakai (Orphan Components):**
   - `src/Components.jsx` tidak pernah di-import oleh halaman mana pun. File ini bahkan memiliki bug impor internal (`import ... from './shared'` yang seharusnya `./service/shared`).
   - `src/service/Diagnosakoneksi.jsx` merupakan utility pengujian koneksi yang lengkap tetapi tidak didaftarkan pada `App.jsx`.
2. **Duplikasi File Service API & Helper:**
   - Ada dua client API: `src/lib/api.js` dan `src/service/api.js` (yang memiliki 401 interceptor). Namun, sebagian besar halaman dashboard meng-import `axios` langsung secara mandiri dengan baseURL ter-hardcode.
   - Konstanta opsi kuesioner terduplikasi di `src/lib/constants.js` dan `src/service/shared.js`.
3. **Injeksi Desain Dinamis Runtime:**
   - Halaman menggunakan hook/fungsi `useDesign` yang menyuntikkan script tag Tailwind CDN dan link Google Fonts langsung ke elemen `<head>` DOM browser pada setiap mount komponen, alih-alih di-bundle via PostCSS/Vite.

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
│   │   ├── RtController.php            [DEAD / UNROUTED]
│   │   └── PengajuanController.php     [DEAD / UNROUTED]
│   └── Models/
│       ├── User.php
│       ├── Warga.php
│       ├── Kriteria.php
│       ├── SubKriteria.php
│       ├── Pengajuan.php
│       ├── Penilaian.php               [Duplikat target tabel]
│       ├── PengajuanDetail.php         [Duplikat target tabel]
│       ├── PesanChat.php
│       └── ActivityLog.php
├── database/
│   ├── migrations/ (9 migration files)
│   ├── seeders/    (UserSeeder, KriteriaSeeder, ImportWargaSeeder, DatabaseSeeder)
│   └── data/data_warga.csv
└── routes/
    └── api.php                         [Definisi 20+ endpoint aktif]
```

### 8.2 Frontend (React 19 + Vite)
```
bansos-frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx                   [Aktif: /login, auth redirect]
│   │   ├── RegisterWarga.jsx           [Aktif: /register]
│   │   ├── WargaDashboard.jsx          [Aktif: /warga, portal warga]
│   │   ├── RtDashboard.jsx             [Aktif: /rt, portal ketua RT]
│   │   ├── RwDashboard.jsx             [Aktif: /rw, portal ketua RW]
│   │   └── AdminDashboard.jsx          [Aktif: /dashboard, admin super control]
│   ├── service/
│   │   ├── api.js                      [Duplikat/Parsial: Axios instance + 401 interceptor]
│   │   ├── shared.js                   [Helper formatting, konstanta opsi, print CSS]
│   │   └── Diagnosakoneksi.jsx         [ORPHAN: Diagnostic test page, unrouted]
│   ├── lib/
│   │   ├── api.js                      [Aktif parsial: getUser helper untuk App.jsx]
│   │   └── constants.js                [Duplikat helper & DAFTAR_OPSI]
│   ├── Components.jsx                  [ORPHAN: Tak terpakai di komponen mana pun]
│   ├── App.jsx                         [Router & role guard]
│   └── main.jsx
```

---

## 9. Rekomendasi Roadmap Perbaikan

1. **Security Hardening (Prioritas 1):**
   - Tambahkan middleware role backend (misal: `EnsureUserHasRole:admin`) pada rute sensitif di `api.php`.
   - Terapkan rate limiter pada rute `/login`.
2. **Pembersihan Arsitektur & Dead Code (Prioritas 2):**
   - Hapus atau satukan `RtController.php` dan `PengajuanController.php`.
   - Hapus model ganda `PengajuanDetail.php` dan standarkan penggunaan pada `Penilaian.php`.
   - Hapus komponen yatim `Components.jsx` atau refaktorisasi komponen UI dashboard untuk menggunakannya.
   - Satukan `src/lib/api.js` dan `src/service/api.js` menjadi satu client HTTP tunggal yang di-import seragam oleh seluruh halaman.
3. **Refaktorisasi Basis Data (Prioritas 3):**
   - Migrasikan relasi `users` dan `warga` menjadi relasi relasional formal (`user_id` foreign key) untuk mencegah kegagalan pencocokan data jika terjadi pengubahan nama warga.
   - Buat format kolom `rt` konsisten integer atau string 3 digit di seluruh skema.
