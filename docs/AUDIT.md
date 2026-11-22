# Comprehensive Code Audit Report
## Proyek BANPER / BansosHub (Sistem Pendukung Keputusan Penerima Bantuan Sosial SAW)

---

## Ringkasan Eksekutif & Matriks Temuan

Berdasarkan analisis statis dan penelusuran alur eksekusi (tracing) terhadap seluruh berkas kode backend (Laravel 12) dan frontend (React 19), ditemukan **35 temuan audit** yang dikelompokkan ke dalam 4 pilar utama:

| Pilar Audit | Critical | High | Medium | Low | Total |
|---|:---:|:---:|:---:|:---:|:---:|
| **1. Bugs & Edge Cases (BUG)** | 3 | 6 | 2 | 1 | **12** |
| **2. Loophole Keamanan (SEC)** | 3 | 4 | 4 | 0 | **11** |
| **3. Loophole Logika Bisnis (LOG)** | 1 | 2 | 2 | 0 | **5** |
| **4. Code Smells & Arsitektur (SML)** | 0 | 2 | 3 | 2 | **7** |
| **TOTAL** | **7** | **14** | **11** | **3** | **35** |

---

## Pilar 1: Bugs & Edge Cases (BUG)

### BUG-01: [SELESAI] Schema Drift & Inkonsistensi Kolom pada Migration Laravel
- **Lokasi:** 
  - `bansos-backend/database/migrations/2026_04_29_051400_create_pengajuan_table.php` (Baris 14–15)
  - `bansos-backend/database/migrations/0001_01_01_000000_create_users_table.php` (Baris 16–17)
- **Tingkat Keparahan:** **CRITICAL**
- **Penjelasan:**
  Terdapat ketidaksinkronan fatal antara berkas migration resmi dengan struktur database riil (`db_bansos_saw.sql`):
  1. Pada migration `pengajuan`, kolom `jawaban_mentah` (TEXT) sama sekali tidak ada. Nilai default enum `status` pada migration adalah `menunggu_verifikasi`, sedangkan seluruh controller dan frontend mengharapkan nilai `'menunggu'`.
  2. Pada migration `users`, kolom `alamat` tidak ada, dan enum `role` hanya mencakup `['admin', 'rw', 'rt']` tanpa nilai `'warga'`.
  Jika developer atau lingkungan server menjalankan perintah `php artisan migrate:fresh`, migrasi akan berhasil dibuat namun aplikasi langsung **CRASH total** (SQL Exception: Column not found: `jawaban_mentah` & Data truncated for column `role`). Database saat ini adalah hasil modifikasi manual di phpMyAdmin tanpa versi migration.
- **Saran Perbaikan:**
  Buat migration penyesuaian atau perbarui file migration awal agar mencakup:
  - Kolom `text('jawaban_mentah')` pada tabel `pengajuan`, serta perbaiki enum status menjadi `['menunggu', 'disetujui', 'ditolak']`.
  - Kolom `text('alamat')->nullable()` dan tambahkan `'warga'` ke dalam enum `role` tabel `users`.

---

### BUG-02: [SELESAI] Potensi Kolisi Username & Kegagalan Transaksi pada Import CSV
- **Lokasi:** `bansos-backend/app/Http/Controllers/Api/AdminRtController.php` (Baris 256–263)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  Pada fungsi `importCsv`, pembuatan username otomatis warga menggunakan formula:
  `$username = strtolower(preg_replace('/[^a-z0-9]/i', '', $nama)) . rand(10, 99);`
  Rentang angka acak hanya 10–99 (90 variasi). Jika dalam file CSV terdapat nama warga yang serupa atau file berisi ratusan baris, kemungkinan terjadinya duplikasi username sangat tinggi. Karena kolom `users.username` memiliki indeks `UNIQUE`, operasi `User::firstOrCreate` akan melempar `QueryException: Duplicate entry for key 'users_username_unique'`. Karena seluruh proses dibungkus transaksi, seluruh proses import gagal total dan ter-rollback akibat 1 tabrakan username.
- **Saran Perbaikan:**
  Gunakan penomoran unik berbasis counter incremental atau kombinasi ID unik:
  `$username = strtolower(preg_replace('/[^a-z0-9]/i', '', $nama)) . '_' . substr(uniqid(), -5);`
  serta bungkus pengecekan duplikasi dalam fungsi helper yang me-regenerasi username jika sudah ada di database.

---

### BUG-03: [SELESAI] Formula ID Sub-Kriteria Hardcoded pada Utilitas "Sapu Ajaib"
- **Lokasi:** `bansos-backend/app/Http/Controllers/Api/AdminRtController.php` (Baris 366–367)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  Pada method `fixDataMentah`, penentuan ID sub-kriteria di-generate menggunakan formula matematika kaku:
  `'id_subkriteria' => (($i - 1) * 4) + $indexOpsi + 1`
  Formula ini berasumsi mutlak bahwa primary key `id_subkriteria` pada tabel `sub_kriteria` harus selalu berurutan dari 1 sampai 40 tanpa celah. Jika tabel `sub_kriteria` pernah mengalami penambahan data, penghapusan baris, atau re-seeding yang membuat auto-increment melompat (misal: ID dimulai dari 41), formula ini akan menghasilkan ID yang salah atau memicu foreign key constraint violation.
- **Saran Perbaikan:**
  Lakukan pencarian record `sub_kriteria` secara relasional berbasis nama opsi:
  ```php
  $sub = SubKriteria::where('id_kriteria', $i)
      ->where('keterangan', $daftarOpsi[$key][$indexOpsi])
      ->first();
  $idSub = $sub ? $sub->id_subkriteria : ...;
  ```

---

### BUG-04: [SELESAI] Inkonsistensi Atribut Kriteria C5 Antara Seeder dan Logika SAW
- **Lokasi:** `bansos-backend/database/seeders/KriteriaSeeder.php` (Baris 60) vs `db_bansos_saw.sql` (Baris 82)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  Kriteria C5 (*Pengeluaran Satu Jiwa dalam Keluarga Perbulan*) pada `KriteriaSeeder.php` didefinisikan dengan `'tipe' => 'benefit'`. Sebaliknya, pada database aktif `db_bansos_saw.sql` dan dokumen PRD, C5 didefinisikan sebagai `'cost'`.
  Jika developer menjalankan `php artisan db:seed --class=KriteriaSeeder`, kriteria C5 akan berubah menjadi `benefit`. Ini akan membalikkan seluruh logika normalisasi SAW ($X / \max$ bukan $\min / X$), di mana warga dengan pengeluaran terbesar justru mendapat skor prioritas tertinggi (salah sasaran penerima bantuan).
- **Saran Perbaikan:**
  Koreksi baris 60 pada `KriteriaSeeder.php` dari `'tipe' => 'benefit'` menjadi `'tipe' => 'cost'`.

---

### BUG-05: [SELESAI] Simulasi Matriks di Frontend Menyamarkan Data Database yang Kosong
- **Lokasi:** `bansos-frontend/src/pages/AdminDashboard.jsx` (Baris 242–252)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**
  Pada fungsi `getSkor(p, idK)`, jika relasi `p.penilaian` kosong di database, frontend melakukan fallback dengan mem-parsing string `p.jawaban_mentah` dan mengembalikan nilai hardcoded `[10, 7.5, 5, 2.5][idx]`.
  Dampaknya, Administrator melihat tabel Matriks Nilai SAW terisi angka lengkap di layar UI, padahal tabel fisik `penilaian` di database MySQL kosong melompong (misalnya tepat setelah CSV di-import). Saat Admin mengklik tombol "Hitung Ulang SAW", backend memanggil `SawController::hitungRanking` yang membaca tabel fisik `penilaian` dan melempar error 404 (*"Tidak ada data penilaian yang valid"*).
- **Saran Perbaikan:**
  Pastikan pembentukan relasi `penilaian` selalu terjadi di backend saat import atau pengajuan, bukan disimulasikan secara parsial di frontend. Jika `p.penilaian` kosong, frontend harus menampilkan indikator peringatan bahwa data matriks belum di-generate.

- **Resolusi:** `getSkor()` di `AdminDashboard.jsx` kini hanya membaca relasi `penilaian` dan mengembalikan `null` bila belum terbentuk (UI menampilkan `—` + banner peringatan). Jalur konversi ganda dari frontend (`konversiSubkriteria`) dihapus dari AdminDashboard dan RtDashboard; backend kini membangun matriks sendiri di `updateKuesioner`.

---

### BUG-06: [SELESAI] State Chat Optimistik Tanpa Rollback Saat Request Gagal
- **Lokasi:** `bansos-frontend/src/pages/WargaDashboard.jsx` (Baris 131–138)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**
  Pada fungsi `handleKirimPesan`, pesan baru langsung ditambahkan ke state UI:
  `setPesanList(p => [...p, { pengirim_role: 'warga', isi_pesan: teks, ... }]);`
  Pemanggilan API `axios.post(`${API}/chat/...`)` dilakukan di dalam blok `try ... catch { }` yang mengabaikan error tanpa rollback state dan tanpa notifikasi pesan gagal. Jika koneksi terputus atau server mengembalikan error 500, warga mengira pesannya telah terkirim padahal data tidak tersimpan di database.
- **Saran Perbaikan:**
  Tampilkan status pengiriman (pending/failed), dan hapus pesan dari UI atau beri tanda seru merah jika request HTTP gagal.

- **Resolusi:** Pesan optimistik diberi `temp_id` + `status_kirim` (`pending`/`sent`/`failed`). Saat request gagal, pesan ditandai `⚠ gagal` dan bisa dihapus dari layar, sehingga UI tidak lagi mengklaim terkirim. Diterapkan di `WargaDashboard.jsx` dan `RtDashboard.jsx`.

---

### BUG-07: [SELESAI] Perankingan SAW Non-Deterministik pada Nilai Skor Imbang (Tie Break)
- **Lokasi:** `bansos-backend/app/Http/Controllers/Api/SawController.php` (Baris 135–140)
- **Tingkat Keparahan:** **LOW**
- **Penjelasan:**
  Fungsi pengurutan ranking hanya mengandalkan pembanding skor float:
  `usort($hasil, fn($a, $b) => $b['skor_saw'] <=> $a['skor_saw']);`
  Jika terdapat 2 atau lebih warga yang memiliki nilai kuesioner identik sehingga menghasilkan `skor_saw` yang persis sama, PHP `usort` tidak menjamin stabilitas urutan (*unstable sort*). Peringkat warga (misal Rank 1 vs Rank 2) dapat berubah-ubah secara acak setiap kali API dipanggil ulang.
- **Saran Perbaikan:**
  Tambahkan tie-breaker sekunder deterministik, misalnya kriteria ekonomi terendah (kriteria penghasilan C6) atau tanggal pengajuan paling awal (`created_at ASC`):
  ```php
  usort($hasil, function($a, $b) {
      if ($b['skor_saw'] === $a['skor_saw']) {
          return $a['id_pengajuan'] <=> $b['id_pengajuan'];
      }
      return $b['skor_saw'] <=> $a['skor_saw'];
  });
  ```

- **Resolusi:** `usort` diberi tie-breaker deterministik `id_pengajuan` sehingga urutan skor identik stabil antar pemanggilan. Dikunci oleh `SawRankingTest::test_skor_imbang_diurutkan_stabil_berdasarkan_id_pengajuan`.

### BUG-08: [SELESAI] Skala Nilai Sub-Kriteria Cost Terbalik — Penerima Bantuan Salah Sasaran
- **Lokasi:**
  - `bansos-backend/database/seeders/KriteriaSeeder.php`
  - Data live `sub_kriteria` id 9-40 (hasil import manual)
  - `bansos-backend/app/Http/Controllers/Api/SawController.php` (Baris 128-137)
- **Tingkat Keparahan:** **CRITICAL**
- **Penjelasan:**
  Normalisasi SAW memakai `benefit: x/max` dan `cost: min/x` (sesuai jurnal acuan,
  §2.4). Pada database live, tujuh kriteria cost (C3, C5-C10) justru memiliki skala
  TERBALIK: kondisi paling membutuhkan diberi nilai 10 dan paling sejahtera 2.5.
  Akibatnya `min/x` membalik lagi arah prioritas — warga paling sejahtera mendapat
  skor tertinggi. Diukur pada data nyata: rumah dengan seluruh indikator terbaik
  memperoleh V = 0.775, sedangkan yang paling membutuhkan hanya 0.475, sehingga
  peringkat 1 jatuh ke warga paling mampu. Ini membatalkan seluruh tujuan sistem.
- **Resolusi:**
  Skala diselaraskan dengan jurnal Tabel 2 & 3 (cost: sejahtera = 10, butuh = 2.5)
  melalui migrasi idempoten `2026_11_22_180000_fix_skala_nilai_sub_kriteria_cost`
  dan `KriteriaSeeder` diperbaiki. Rumus `SawController` tidak diubah karena sudah
  cocok dengan jurnal. Dikunci oleh `SubKriteriaArahNilaiTest`, yang mereproduksi
  worked example jurnal: A1 = 0.892 (rank 1), A3 = 0.725 (rank 2), A2 = 0.683 (rank 3).
- **Catatan penting:** jangan membalik urutan nilai sub-kriteria tanpa ikut mengubah
  rumus normalisasi, dan sebaliknya.

  **Invarian skor maksimum:** `V = 1.0` hanya tercapai bila SELURUH kriteria berada di
  kondisi paling membutuhkan, yaitu benefit = 10 dan cost = 2.5:

  ```
  nilai = [10, 10, 2.5, 10, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5]  →  V = 1.0
  ```

  Kebalikannya (benefit 2.5, cost 10) menghasilkan `V = 0.25` — skor terendah. Satu
  kriteria saja meleset (mis. C10 = 5) menurunkan V menjadi 0.95, jadi tidak ada
  kombinasi lain yang bisa mencapai 1.0. Dikunci oleh
  `SubKriteriaArahNilaiTest::test_skor_sempurna_hanya_untuk_kondisi_paling_membutuhkan`.

---

### BUG-09: [SELESAI] Label Opsi Kuesioner Frontend Tidak Cocok dengan `sub_kriteria.keterangan`
- **Lokasi:**
  - `bansos-frontend/src/services/constants.js`, `src/pages/{Admin,Rt,Warga}Dashboard.jsx`
  - `bansos-backend/app/Http/Controllers/Api/AdminRtController.php::sinkronkanPenilaianDariJawaban`
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  Backend mencocokkan jawaban warga ke baris `sub_kriteria` berdasarkan teks, tetapi
  label di frontend berbeda dari teks database (mis. `SEKOLAH DASAR (SD)` vs `SD`,
  `5 ORANG` vs `5 Orang`, `SEWA / KONTRAK` vs `Sewa < 1 Juta`). Setiap jawaban yang
  tidak cocok diam-diam jatuh ke `indexOpsi = 2` (nilai tengah), sehingga skor warga
  salah tanpa ada error apa pun. Selain itu daftar opsi di-hardcode terpisah di empat
  tempat dan sudah menyimpang satu sama lain.
- **Resolusi:**
  Semua label diselaraskan dengan `sub_kriteria.keterangan`. Pencocokan di backend
  ditulis ulang menjadi data-driven: membaca baris sub-kriteria milik kriteria itu
  sendiri, mencoba exact match lalu partial match, dan mengembalikan daftar kriteria
  yang tidak dikenali alih-alih memakai nilai default diam-diam.

---

### BUG-10: [SELESAI] Baris Tanpa Identitas Warga Masuk Perankingan dan Menempati Rank 1
- **Lokasi:** `bansos-backend/app/Http/Controllers/Api/SawController.php` (Baris 65-96)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  Terdapat 4 baris `warga` dengan `nama_lengkap` kosong dan `rt = '000'` (hasil import
  yang tidak bersih). Keempatnya berstatus `disetujui` dengan matriks penilaian lengkap
  dan seluruh nilai terbaik, sehingga memperoleh `skor_saw = 1.0` dan menduduki
  peringkat 1-4. Laporan rekomendasi menjadi tidak bisa ditindaklanjuti.
- **Resolusi:**
  `SawController` kini melewati pengajuan yang warganya tanpa nama atau yang matriks
  penilaiannya tidak lengkap, dan mengembalikan daftar `dilewati` beserta alasannya
  agar dapat ditindaklanjuti admin. Dikunci oleh dua test di `SawRankingTest`.

---

## Pilar 2: Loophole Keamanan (SEC)

### SEC-01: [SELESAI] Kebocoran Data Sensitif Warga (PII Leak) pada Endpoint Publik
- **Lokasi:** 
  - `bansos-backend/routes/api.php` (Baris 24)
  - `bansos-backend/app/Http/Controllers/Api/SawController.php` (Baris 151–188)
- **Tingkat Keparahan:** **CRITICAL**
- **Penjelasan:**
  Rute `GET /api/saw/dataset` didaftarkan di luar middleware `auth:sanctum` (rute publik terbuka tanpa autentikasi). Method `getDataset` mengembalikan array berisi `id_pengajuan`, `nama_warga`, `alamat` (alamat rumah lengkap), nomor `rt`, serta seluruh nilai parameter ekonomi C1–C10.
  Siapa pun di internet tanpa login dapat mengakses endpoint ini untuk mengikis (scraping) seluruh data pribadi kependudukan warga RW 08.
- **Saran Perbaikan:**
  Pindahkan rute `/saw/dataset` ke dalam grup `middleware('auth:sanctum')` dan batasi aksesnya hanya untuk peran Admin dan RW.

---

### SEC-02: [SELESAI] Ketiadaan Otorisasi Berbasis Peran di Backend (Broken Access Control)
- **Lokasi:** `bansos-backend/routes/api.php` (Baris 27–85) & `bansos-frontend/src/App.jsx` (Baris 19–24)
- **Tingkat Keparahan:** **CRITICAL**
- **Penjelasan:**
  Seluruh 18 rute privat di `routes/api.php` hanya diproteksi oleh `auth:sanctum` tanpa ada middleware pengecekan peran (Role-Based Access Control). Pengecekan role saat ini **HANYA dilakukan di sisi klien (React)** melalui komponen `<Protected roles={['admin']}>` yang membaca data tidak aman dari `localStorage.getItem('user')`.
  **Skenario Serangan:**
  1. Seorang pengguna mendaftar sebagai `warga` biasa dan mendapatkan Bearer token valid.
  2. Pengguna tersebut dapat langsung mengirim request HTTP (menggunakan curl/Postman) ke:
     - `DELETE /api/users/{id}` (Menghapus akun Ketua RT atau Admin).
     - `DELETE /api/admin/pengajuan/{id}` (Menghapus berkas bansos warga lain).
     - `PUT /api/kriteria/{id}` (Mengubah bobot dan tipe kriteria sesuka hati).
     - `POST /api/admin/pengajuan/import` (Mengunggah file CSV baru).
  3. Pengguna juga dapat membuka browser DevTools, mengubah `localStorage.setItem('user', JSON.stringify({role: 'admin'}))`, dan langsung membuka antarmuka `/dashboard` karena backend menerima token-nya tanpa memvalidasi role.
- **Saran Perbaikan:**
  Buat middleware Laravel `CheckRole` (misal: `EnsureRole::class`) dan terapkan secara ketat pada grup rute di `routes/api.php`:
  ```php
  Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
      Route::apiResource('users', UserController::class);
      Route::put('/kriteria/{id}', [KriteriaController::class, 'update']);
  });
  ```

---

### SEC-03: [SELESAI] Insecure Direct Object References (IDOR) pada Modul Chat
- **Lokasi:** 
  - `bansos-backend/routes/api.php` (Baris 83–84)
  - `bansos-backend/app/Http/Controllers/Api/ChatController.php` (Baris 12–37)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  Pada endpoint `GET /api/chat/{id}` dan `POST /api/chat/{id}`, parameter `{id}` adalah ID pengajuan bansos. Controller sama sekali tidak memeriksa apakah pengguna yang sedang login (`$request->user()`) memiliki keterkaitan dengan pengajuan tersebut:
  - Warga A dapat membaca riwayat percakapan pribadi antara Warga B dan Ketua RT-nya dengan mengganti ID pada URL.
  - Warga A dapat mengirimkan pesan palsu mengatasnamakan pengaju lain ke sembarang ID pengajuan.
  - Ketua RT dari RT 001 dapat membaca dan membalas percakapan warga yang berada di wilayah RT 002.
- **Saran Perbaikan:**
  Tambahkan validasi kepemilikan berkas pengajuan:
  ```php
  $pengajuan = Pengajuan::with('warga')->findOrFail($id_pengajuan);
  $user = $request->user();
  if ($user->role === 'warga' && $pengajuan->warga->nama_lengkap !== $user->name) {
      return response()->json(['message' => 'Unauthorized'], 403);
  }
  if ($user->role === 'rt' && (int)$pengajuan->warga->rt !== (int)$user->rt) {
      return response()->json(['message' => 'Unauthorized'], 403);
  }
  ```

---

### SEC-04: [SELESAI] Penggunaan Password Default Lemah & Terbuka (Hardcoded Secrets)
- **Lokasi:**
  - `bansos-backend/app/Http/Controllers/Api/WargaController.php` (Baris 74, Baris 122)
  - `bansos-backend/app/Http/Controllers/Api/AdminRtController.php` (Baris 246–247)
  - `bansos-backend/database/seeders/UserSeeder.php` (Baris 17, 25, 35)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  1. Pada `WargaController`, pembuatan entri warga secara otomatis meng-hash kata sandi default `'123'`.
  2. Pada import CSV, password akun di-set ke `'warga123'` dan `'123'`.
  3. Pada seeder resmi, akun Admin (`admin`), RW (`rw08`), dan RT (`rt001`-`rt003`) menggunakan password tebakan mudah: `admin123`, `rw123`, dan `rt123`.
- **Saran Perbaikan:**
  Hapus hardcoded password lemah. Wajibkan pembuatan password acak yang dikirimkan melalui jalur terverifikasi atau paksa pengguna untuk mengganti password (*force password reset*) saat login pertama kali.

---

### SEC-05: [SELESAI] Ketiadaan Rate Limiting pada Endpoint Login & Registrasi
- **Lokasi:** `bansos-backend/routes/api.php` (Baris 20–21)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  Rute `/api/login` dan `/api/register` tidak diproteksi oleh middleware rate limiting Laravel (`throttle:login` atau `throttle:5,1`). Aplikasi rentan terhadap serangan otomatis brute-force kata sandi dan registrasi akun sampah (Denial of Service).
- **Saran Perbaikan:**
  Terapkan throttle middleware bawaan Laravel:
  `Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');`

---

### SEC-06: [SELESAI] Masa Berlaku Token Akses Sanctum Tidak Terbatas (Infinite Lifespan)
- **Lokasi:** `bansos-backend/config/sanctum.php` (Baris 50)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**
  Konfigurasi `'expiration' => null` menyebabkan Personal Access Token Sanctum berlaku selamanya. Jika perangkat warga atau pengurus terinfeksi malware atau token di `localStorage` tercuri (XSS), token tersebut dapat disalahgunakan tanpa batas waktu.
- **Saran Perbaikan:**
  Tetapkan batas masa aktif token yang wajar, misalnya 8 jam atau 24 jam:
  `'expiration' => 480, // dalam menit`

---

### SEC-07: [SELESAI] Validasi Input Kurang Ketat pada File Upload dan Mutasi Status
- **Lokasi:** 
  - `bansos-backend/app/Http/Controllers/Api/AdminRtController.php` (Baris 160–165, Baris 234)
  - `bansos-backend/app/Http/Controllers/Api/ChatController.php` (Baris 23–34)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**
  1. Pada `ubahStatusPengajuan`: `$pengajuan->update(['status' => $request->status]);` dijalankan tanpa validasi format input. Nilai string acak atau SQL error dapat terjadi jika dikirim nilai di luar enum.
  2. Pada `importCsv`: Validasi file hanya `required|file` tanpa memvalidasi ekstensi dan tipe MIME (`mimes:csv,txt`). File berbahaya atau file binary berukuran sangat besar dapat diunggah.
  3. Pada `storePesan`: `$request->isi_pesan` tidak divalidasi `required|string|max:1000`. Payload kosong atau data non-string dapat diinjeksi.
- **Saran Perbaikan:**
  Terapkan validasi FormRequest yang ketat pada seluruh endpoint mutasi data.

- **Resolusi:** Upload CSV divalidasi `mimes:csv,txt|max:5120` (diuji: upload PDF → HTTP 422). `isi_pesan` sudah divalidasi `required|string|max:1000`. Status pengajuan divalidasi `in:menunggu,disetujui,ditolak`. Selain itu `ValidationException` tidak lagi tertelan `catch (\Exception)` yang mengubah 422 menjadi 500.

---

## Pilar 3: Loophole Logika Bisnis (LOG)

### LOG-01: [SELESAI] Logika Pembentukan Relasi Matriks SAW Didelegasikan ke Frontend
- **Lokasi:** 
  - `bansos-frontend/src/pages/RtDashboard.jsx` (Baris 276–279)
  - `bansos-frontend/src/pages/AdminDashboard.jsx` (Baris 425–430)
  - `bansos-backend/app/Http/Controllers/Api/AdminRtController.php` (Baris 160–176)
- **Tingkat Keparahan:** **CRITICAL**
- **Penjelasan:**
  Terdapat cacat desain bisnis yang sangat berisiko:
  Saat status pengajuan disetujui, controller backend `ubahStatusPengajuan` **HANYA** mengupdate kolom `status` di tabel `pengajuan`. Konversi dari teks `jawaban_mentah` menjadi 10 baris relasi pada tabel `penilaian` sepenuhnya diserahkan kepada panggilan API sekunder yang dijalankan oleh browser React:
  `await axios.put(`${API}/admin/pengajuan/${id}/kuesioner`, { jawaban: konversiSubkriteria(...) });`
  **Dampak Bisnis:**
  - Jika koneksi internet pengguna terputus setelah panggilan pertama sukses tetapi sebelum panggilan kedua selesai, status warga sudah "Disetujui" tetapi nilai matriksnya tidak pernah terbentuk di database.
  - Jika status diubah langsung oleh sistem atau script lain, tabel `penilaian` akan kosong, mengakibatkan warga tersebut diabaikan oleh kalkulasi ranking SAW.
- **Saran Perbaikan:**
  Pindahkan logika konversi kuesioner ke dalam backend service dalam satu database transaction `DB::transaction()` saat status pengajuan diubah menjadi `disetujui`.

---

### LOG-02: [SELESAI] Mutasi Data Masif Bersifat Destruktif Melalui Request HTTP GET
- **Lokasi:** 
  - `bansos-backend/routes/api.php` (Baris 75)
  - `bansos-backend/app/Http/Controllers/Api/AdminRtController.php` (Baris 323–385)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  Rute `/admin/fix-data` didefinisikan dengan metode `GET`. Padahal fungsi `fixDataMentah` ("Sapu Ajaib") menjalankan operasi mutasi sangat besar: menghapus seluruh baris di tabel `penilaian` (`PengajuanDetail::where(...)->delete()`) dan membuat ulang ratusan baris data baru.
  Sesuai spesifikasi HTTP RFC 7231, metode `GET` harus bersifat aman (*safe*) dan idempoten. Menggunakan `GET` untuk mutasi database destruktif sangat berbahaya karena dapat terpicu secara tidak sengaja oleh browser pre-fetching, akselerator unduhan, atau robot perayap web (crawler).
- **Saran Perbaikan:**
  Ubah metode rute menjadi `POST /admin/fix-data` dan tambahkan konfirmasi otorisasi Admin yang jelas.

---

### LOG-03: [SELESAI] Ketiadaan Database Transaction pada Pembaruan Penilaian
- **Lokasi:** `bansos-backend/app/Http/Controllers/Api/AdminRtController.php` (Baris 191–200)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  Pada method `updateKuesioner`:
  ```php
  PengajuanDetail::where('id_pengajuan', $id)->delete();
  foreach ($request->jawaban as $id_kriteria => $id_sub) {
      PengajuanDetail::create([...]);
  }
  ```
  Operasi penghapusan dan penulisan ulang ini tidak dibungkus dalam `DB::beginTransaction()` dan `DB::commit()`. Jika server mengalami error di tengah loop `foreach` (misalnya pada kriteria ke-7), data penilaian lama sudah terlanjur terhapus permanen dan data baru hanya tersimpan separuh (korupsi data penilaian).
- **Saran Perbaikan:**
  Bungkus operasi dengan `DB::transaction(function () use (...) { ... });`.

---

### LOG-04: [SELESAI] Kondisi Balapan (Race Condition) pada Pembatasan 1 Pengajuan Per Warga
- **Lokasi:** `bansos-backend/app/Http/Controllers/Api/WargaController.php` (Baris 80–86, 128–134)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**
  Pengecekan apakah warga sudah pernah mengajukan bantuan dilakukan dengan query:
  `$cek = Pengajuan::where('id_warga', $idWarga)->first();`
  Di sisi database, kolom `id_warga` pada tabel `pengajuan` **TIDAK memiliki indeks UNIQUE**.
  Jika seorang warga mengklik tombol *Submit* secara cepat berulang kali (*double click*) atau mengirim 2 request bersamaan dalam interval milidetik, kedua request akan lolos pengecekan `where` secara bersamaan, menghasilkan 2 baris pengajuan aktif untuk 1 warga yang sama.
- **Saran Perbaikan:**
  Tambahkan constraint indeks unik pada tabel pengajuan:
  `$table->unique('id_warga');`

- **Resolusi:** Unique index `pengajuan_id_warga_unique` ditambahkan (migrasi `2026_11_22_170000`), dan `WargaController` menangkap `UniqueConstraintViolationException` untuk mengembalikan 400 yang jelas saat submit balapan.

---

### LOG-05: [SELESAI] Modifikasi Bobot Kriteria Tanpa Validasi Total Persentase 100%
- **Lokasi:** `bansos-backend/app/Http/Controllers/Api/KriteriaController.php` (Baris 24–29)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**
  Saat Admin memperbarui bobot salah satu kriteria melalui `PUT /api/kriteria/{id}`, sistem hanya memvalidasi bahwa nilai bobot berada di antara 0 dan 100. Sistem tidak memvalidasi apakah jumlah total bobot seluruh 10 kriteria tetap bernilai 100%.
  Meskipun algoritma SAW di backend melakukan normalisasi bobot dinamis ($W_j / \sum W$), antarmuka pengguna di frontend menampilkan bobot dalam format persentase visual. Ini memicu kebingungan bagi pemangku kepentingan RW jika total akumulasi bobot di layar berjumlah 180% atau 30%.
- **Saran Perbaikan:**
  Sediakan endpoint bulk update bobot yang memverifikasi bahwa total pembobotan tepat 100, atau berikan kalkulasi recalibrate otomatis di backend.

- **Resolusi:** Dua lapis pengaman.
  1. `PUT /api/kriteria/{id}` menolak (422) perubahan yang membuat total bobot ≠ 100,
     dengan pesan yang menyebut total hasilnya.
  2. Endpoint baru `PUT /api/admin/kriteria/bobot` menyimpan bobot seluruh kriteria
     sekaligus dalam satu transaksi. Endpoint ini mewajibkan semua kriteria disertakan
     (kalau tidak, total 100 bisa dicapai dengan mengabaikan kriteria tertentu) dan
     menolak total ≠ 100.

  Di UI, input bobot dihapus dari modal "Edit Kriteria" dan diganti tombol **Atur Bobot**
  yang membuka editor 10 kriteria sekaligus dengan penghitung total langsung — tombol
  simpan nonaktif sampai total tepat 100. Setiap perubahan dicatat di activity log.
  Dikunci oleh `BobotKriteriaTest` (5 test).

---

## Pilar 5: Temuan Audit Lanjutan (Audit Ulang)

Audit ulang menyeluruh menemukan satu cacat desain yang menjadi akar beberapa
kebocoran sekaligus: `users` dan `warga` tidak pernah dihubungkan lewat ID.

### SEC-08: [SELESAI] Identitas Warga Dicocokkan Lewat Nama — IDOR Lintas Warga
- **Lokasi:**
  - `app/Http/Controllers/Api/ChatController.php` (Baris 27)
  - `app/Http/Controllers/Api/WargaController.php` (Baris 51, 107, 140)
  - `app/Models/User.php`
- **Tingkat Keparahan:** **CRITICAL**
- **Penjelasan:**
  Seluruh pencocokan akun ke data warga memakai `warga.nama_lengkap = users.name`.
  Nama bukan identitas unik: pada data nyata terdapat 6 nama duplikat (LISA, basuki,
  ARIF HIDAYAT, MISLENA, NURYATI, MUANIH). Dampaknya terbukti lewat test:
  1. **IDOR baca chat** — cukup mendaftar dengan nama orang lain, akun baru dapat
     membaca dan mengirim pesan pada pengajuan orang tersebut (HTTP 200, seharusnya 403).
  2. **Kebocoran status** — `GET /api/warga/status` mengembalikan status pengajuan
     orang lain (HTTP 200, seharusnya 404).
  3. **Data tertimpa** — `Warga::updateOrCreate(['nama_lengkap' => ...])` saat submit
     mengubah alamat/RT baris warga orang lain yang kebetulan bernama sama.
- **Resolusi:**
  Kolom `users.id_warga` ditambahkan (unique, FK, `ON DELETE SET NULL`) lewat migrasi
  `2026_11_22_190000`, dengan backfill hanya untuk nama yang unik — nama duplikat
  sengaja dibiarkan `NULL` agar tidak salah pasang. Seluruh otorisasi kini memakai
  `users.id_warga`:
  - `ChatController` menolak bila `id_warga` akun ≠ `id_warga` pemilik pengajuan.
  - `WargaController::getStatus` membaca relasi `$user->warga`.
  - `WargaController::kirimPengajuan` hanya memperbarui baris miliknya sendiri, dan
    menolak (409) bila akun belum tertaut.
  - `AuthController::register` membuat baris warga baru + tautan dalam satu transaksi.
  - Endpoint `PUT /api/admin/users/{id}/taut-warga` untuk menautkan akun yang namanya
    duplikat, dengan validasi RT harus sama dan satu baris warga hanya boleh satu akun.
  - UI "Kelola Akun" menampilkan kolom **Tautan Warga** (`✓ #id` atau `⚠ belum`).
- **Bukti:** `IdentitasWargaTest` (11 test). Diuji juga lewat HTTP nyata: akun bernama
  sama ditolak 403 saat membaca chat, 404 saat melihat status, dan 409 saat mengajukan.

### SEC-09: [SELESAI] Peran Pengirim Chat Salah — Admin/RW Tercatat sebagai Warga
- **Lokasi:** `app/Http/Controllers/Api/ChatController.php` (Baris 70)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**
  `$role = $request->user()->role === 'rt' ? 'rt' : 'warga';` membuat pesan dari admin
  dan RW tersimpan dengan `pengirim_role = 'warga'`. Jejak audit jadi menyesatkan dan
  pesan pengawas tampak sebagai pesan warga.
  Lebih lanjut, enum `pesan_chat.pengirim_role` hanya mengizinkan `('warga','rt')`,
  sehingga perbaikan controller saja akan memicu 500.
- **Resolusi:**
  Peran disimpan apa adanya (divalidasi ke daftar peran yang dikenal), dan enum
  diperluas lewat migrasi `2026_11_22_190500_perluas_enum_pengirim_role_pesan_chat`
  (menangani MySQL dan SQLite).

### SEC-10: [SELESAI] RT Dapat Menginput Kuesioner untuk Warga di Luar Wilayahnya
- **Lokasi:** `app/Http/Controllers/Api/WargaController.php::store`
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  `POST /api/warga/pengajuan-rt` menerima `rt` dari request tanpa membandingkannya
  dengan RT si ketua RT. RT 001 bisa menginput warga RT 002/003, melewati batas
  wilayah yang justru menjadi inti pembagian tugas sistem ini.
  Endpoint ini juga menerima `nama_lengkap` kosong sehingga bisa membuat baris warga
  tanpa identitas (penyebab 4 baris hantu yang sebelumnya masuk perankingan).
- **Resolusi:**
  RT hanya boleh menginput warga dengan `rt` sama dengan `rt` akunnya (403), nama
  kosong ditolak (422), dan pencarian warga memakai `firstOrCreate` berbasis
  `nama_lengkap + rt` agar tidak menimpa warga bernama sama di RT lain.

### SEC-11: [SELESAI] Admin Dapat Menghapus Akunnya Sendiri
- **Lokasi:** `app/Http/Controllers/Api/AdminRtController.php::deleteUser`
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**
  Tidak ada penjagaan terhadap akun sendiri. Satu administrator yang menghapus akunnya
  akan terkunci di luar sistem tanpa jalan pemulihan lewat UI.
- **Resolusi:** Ditolak (422) bila `auth()->id()` sama dengan target.

---

## Pilar 4: Code Smells & Arsitektur (SML)

### SML-01: [SELESAI] Dead Service Controllers (Kode Mati di Backend)
- **Lokasi:** 
  - `bansos-backend/app/Http/Controllers/Api/RtController.php` (44 baris)
  - `bansos-backend/app/Http/Controllers/Api/PengajuanController.php` (66 baris)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  Kedua controller ini berisi implementasi usang dari penanganan pesan chat dan submit pengajuan kuesioner. Keduanya sama sekali tidak didaftarkan di `routes/api.php` dan tidak pernah dipanggil. Keberadaan controller mati ini membingungkan pengembang baru dan berisiko menjadi sarang bug jika tidak sengaja diaktifkan.
- **Saran Perbaikan:**
  Hapus kedua berkas controller tersebut dari repositori.

---

### SML-02: [SELESAI] Komponen Frontend Yatim (Orphan Components)
- **Lokasi:** 
  - `bansos-frontend/src/Components.jsx` (264 baris)
  - `bansos-frontend/src/service/Diagnosakoneksi.jsx` (153 baris)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**
  1. `Components.jsx` berisi pustaka komponen UI (Button, Modal, Input, Badge) tetapi tidak pernah di-import oleh halaman mana pun. Berkas ini bahkan memiliki kesalahan sintaks impor internal: `import { statusStyle, roleInfo } from './shared'` yang gagal karena file aslinya terletak di `./service/shared`.
  2. `Diagnosakoneksi.jsx` adalah modul pengujian konektivitas yang dibuat dengan baik, namun tidak didaftarkan pada rute `App.jsx`.
- **Saran Perbaikan:**
  Hapus `Components.jsx` jika halaman dashboard tetap menggunakan komponen inline, atau refaktorisasi dashboard agar menggunakannya. Daftarkan `Diagnosakoneksi.jsx` ke rute `/diagnosa` jika ingin dipertahankan sebagai alat uji.

---

### SML-03: [SELESAI] Model Ganda Menunjuk ke Tabel Fisik yang Sama
- **Lokasi:** 
  - `bansos-backend/app/Models/Penilaian.php`
  - `bansos-backend/app/Models/PengajuanDetail.php`
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**
  Kedua model Eloquent ini sama-sama menunjuk ke tabel fisik `penilaian` dengan primary key `id_penilaian`. Model `Pengajuan` memanggil relasi ke `PengajuanDetail`, sementara beberapa controller memanggil `Penilaian`.
- **Saran Perbaikan:**
  Hapus model `PengajuanDetail` dan standarkan seluruh relasi dan controller untuk menggunakan model tunggal `Penilaian`.

---

### SML-04: [SELESAI] Redundansi Klien API & Pengabaian Interceptor Axios
- **Lokasi:** 
  - `bansos-frontend/src/lib/api.js`
  - `bansos-frontend/src/service/api.js`
  - Seluruh berkas di `bansos-frontend/src/pages/*.jsx`
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**
  Proyek memiliki 2 file konfigurasi Axios terpisah. Berkas `src/service/api.js` telah dilengkapi interceptor penanganan error 401 (auto logout/redirect). Namun, seluruh halaman dashboard (`AdminDashboard.jsx`, `RtDashboard.jsx`, dll.) justru meng-import library raw `axios` secara langsung dan mendefinisikan konstanta URL `const API = 'http://127.0.0.1:8000/api'` secara berulang-ulang di setiap file, sehingga interceptor 401 tidak pernah bekerja.
- **Saran Perbaikan:**
  Satukan client HTTP ke dalam satu file (misal: `src/services/api.js`), dan refaktorisasi seluruh halaman agar mengimpor instance tersebut.

---

### SML-05: [SELESAI] N+1 Query Problem pada Pengambilan Data Pengguna
- **Lokasi:** `bansos-backend/app/Http/Controllers/Api/AdminRtController.php` (Baris 20–44)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**
  Pada method `getUsers`:
  ```php
  $users = DB::table('users')->get();
  $usersDenganAlamat = $users->map(function ($user) {
      ...
      $warga = DB::table('warga')->where('nama_lengkap', $user->name)->first();
      ...
  });
  ```
  Untuk setiap user di dalam tabel `users`, sistem menjalankan query individual ke tabel `warga`. Jika terdapat 500 user, endpoint ini akan mengeksekusi 501 query database terpisah, memperlambat response time secara drastis.
- **Saran Perbaikan:**
  Gunakan SQL JOIN tunggal:
  ```php
  $users = DB::table('users')
      ->leftJoin('warga', 'users.name', '=', 'warga.nama_lengkap')
      ->select('users.*', DB::raw('COALESCE(NULLIF(users.alamat, ""), warga.alamat) as alamat'))
      ->get();
  ```

---

### SML-06: File Monolitik Raksasa pada Antarmuka Frontend
- **Lokasi:** 
  - `bansos-frontend/src/pages/AdminDashboard.jsx` (1.419 baris)
  - `bansos-frontend/src/pages/RtDashboard.jsx` (1.015 baris)
- **Tingkat Keparahan:** **LOW**
- **Penjelasan:**
  Satu berkas file JSX menampung seluruh logika manajemen state, 5 modal form dialog, template cetak CSS, manipulasi DOM, pemanggilan 8 endpoint API, dan rendering tabel multi-tab. Kode sangat sulit untuk diuji, dibaca, dan dikembangkan secara modular.
- **Saran Perbaikan:**
  Pecah komponen halaman menjadi sub-komponen modular terpisah: `AdminHeader`, `Sidebar`, `MatriksTable`, `KriteriaModal`, `UserModal`, dan `ActivityLogTable`.

---

### SML-07: Injeksi Script Eksternal Dinamis pada DOM Runtime
- **Lokasi:**
  - `bansos-frontend/src/pages/RtDashboard.jsx` (Baris 9–56)
  - `bansos-frontend/src/pages/RwDashboard.jsx` (Baris 10–52)
  - `bansos-frontend/src/pages/AdminDashboard.jsx` (Baris 10–53)
- **Tingkat Keparahan:** **LOW**
- **Penjelasan:**
  Setiap kali dashboard di-mount, fungsi `useDesign` membuat elemen tag `<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries">` dan elemen `<link>` Google Fonts langsung ke dalam `document.head`.
  Ini menyebabkan *Flash of Unstyled Content* (FOUC), ketergantungan mutlak pada koneksi internet publik (aplikasi tidak dapat berjalan di jaringan intranet/offline), dan peringatan performa di browser modern.
- **Saran Perbaikan:**
  Install Tailwind CSS secara lokal melalui npm (`npm install -D tailwindcss postcss autoprefixer`) dan compile styling secara native melalui pipeline Vite.

---

## Matriks Prioritas & Urutan Remediasi

Untuk memulihkan stabilitas dan keamanan aplikasi secara disiplin, urutan perbaikan yang disarankan adalah:

### Tahap 1: Keamanan & Integritas Data (Immediate - Critical/High)
1. **[SEC-01] [SELESAI]** Amankan endpoint `/api/saw/dataset` ke dalam middleware terproteksi.
2. **[SEC-02] [SELESAI]** Buat middleware peran (`role:admin`, `role:rt`, `role:rw`) di Laravel dan terapkan pada seluruh rute API.
3. **[SEC-03] [SELESAI]** Tambahkan pengecekan otorisasi kepemilikan pengajuan pada `ChatController`.
4. **[BUG-01] [SELESAI]** Sinkronkan migration Laravel (`users` & `pengajuan`) dengan struktur database riil.
5. **[LOG-01] [SELESAI]** Pindahkan logika pembentukan relasi matriks `penilaian` ke dalam transaksi backend saat pengajuan disetujui.

### Tahap 2: Logika Bisnis & Perbaikan Algoritma (High/Medium)
6. **[BUG-04] [SELESAI]** Koreksi tipe kriteria C5 pada `KriteriaSeeder.php` menjadi `cost`.
7. **[BUG-02] [SELESAI]** Perbaiki generator username warga pada `importCsv` untuk mencegah SQL unique collision.
8. **[LOG-02] [SELESAI]** Ubah rute utilitas "Sapu Ajaib" dari `GET` menjadi `POST`.
9. **[LOG-03] [SELESAI]** Tambahkan transaksi database pada `updateKuesioner`.
10. **[SEC-05] [SELESAI]** Pasang rate limiting pada rute `/login`.
16. **[BUG-08] [SELESAI]** Selaraskan skala nilai sub-kriteria cost dengan acuan jurnal.
17. **[BUG-09] [SELESAI]** Selaraskan label opsi kuesioner dengan `sub_kriteria.keterangan`.
18. **[BUG-10] [SELESAI]** Keluarkan baris tanpa identitas warga dari perankingan.
19. **[LOG-05] [SELESAI]** Validasi total bobot kriteria = 100% lewat endpoint bulk.
20. **[SEC-08] [SELESAI]** Ganti pencocokan identitas warga dari nama ke `users.id_warga`.
21. **[SEC-09] [SELESAI]** Perbaiki peran pengirim chat + perluas enum `pengirim_role`.
22. **[SEC-10] [SELESAI]** Tegakkan batas wilayah RT saat input kuesioner.
23. **[SEC-11] [SELESAI]** Cegah admin menghapus akunnya sendiri.

### Tahap 3: Pembersihan Kode & Performa Arsitektur (Medium/Low)
11. **[SML-01] [SELESAI]** Hapus controller mati `RtController.php` dan `PengajuanController.php`.
12. **[SML-03] [SELESAI]** Konsolidasikan model `PengajuanDetail` ke dalam `Penilaian`.
13. **[SML-04] [SELESAI]** Standarkan penggunaan instance Axios tunggal di frontend.
14. **[SML-05] [SELESAI]** Optimalkan query N+1 pada `getUsers` menggunakan SQL Join.
15. **[SML-02 & SML-06] [SELESAI]** Bersihkan komponen yatim dan daftarkan `DiagnosaKoneksi`.
