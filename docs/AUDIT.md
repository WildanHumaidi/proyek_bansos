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

---

## Gelombang Remediasi Kedua (2026-11-25) — Basis RE_AUDIT

Audit di atas menutup lapisan **keamanan, otorisasi, dan arsitektur**, tetapi tidak
pernah mencapai lapisan **transformasi data** — tempat seluruh temuan CRITICAL
berada. Re-audit jurnal-grounded (`RE_AUDIT_BANSOS_HUB_REPORT.md`) menemukan bahwa
mesin SAW-nya benar secara aritmetika, sementara data yang masuk ke mesin itu salah
secara senyap.

Ringkasan apa yang ditutup pada gelombang ini (rincian + bukti test di
`FIX_IMPLEMENTATION_REPORT.md`):

| Kelas masalah | Sebelum | Sesudah |
|---|---|---|
| Pemetaan jawaban CSV → sub-kriteria | 501 dari 900 sel fallback ke skor terendah (C3/C5/C6 100 % gagal) | 900/900 benar, 0 fallback, gagal = error terstruktur |
| Status hasil impor | `disetujui` otomatis (tanpa akuntabilitas manusia) | `menunggu`, approval manual aktor berwenang |
| Identitas rumah tangga | `updateOrCreate` by nama → rumah tangga tertimpa | dedup nama+RT+alamat; nama kembar RT beda = dua record |
| Scope ranking RT | Seluruh RW bocor, rank global | Scope di backend, `ranking_rt` dari server mulai 1 |
| Warga yang tidak masuk ranking | Dihitung backend, tidak pernah tampil | Banner `dilewati` di RT/RW/Admin |
| "Unduh Laporan" | `window.print()` | `GET /saw/report/export` → file CSV nyata |
| Konsistensi dataset ↔ ranking | Dua jalur eligibility berbeda | Satu `SawCalculator::ambilDataEligible` |

Perubahan ini **tidak membatalkan** temuan SML-06/SML-07 di atas: dashboard masih
monolitik dan masih memakai Tailwind CDN, dan keduanya tetap tercatat sebagai
teknis-debt terbuka.

---

## Gelombang Kontras WCAG (2026-11-25)

Guard UAT sebelumnya hanya menyapu halaman Beranda. Sapuan seluruh menu per peran
menemukan 136 teks di bawah ambang WCAG AA (rasio terburuk 1.48:1 pada placeholder
`#cbd5e1` di atas putih). Semua sudah diperbaiki dan diukur ulang:

| Halaman | Sebelum | Sesudah |
|---|---:|---:|
| Admin ranking | 96 gagal | 0 |
| Admin menu lain (kuesioner, matriks, kriteria, users, log) | 130 gagal | 0 |
| RT ranking | 37 gagal | 0 |
| RT menu lain (beranda, warga, kuesioner, verifikasi) | 4 gagal | 0 |
| RW ranking + beranda | 6 gagal | 0 |

Pasangan warna pengganti (terukur ≥ 4.5:1): teks sekunder `#94a3b8`/`#64748b` →
`#475569`; amber `#ca8a04`/`#d97706` → `#a16207`/`#b45309`; merah `#dc2626` →
`#b91c1c`; tombol hijau `#059669` → `#047857`; ikon centang `#22c55e` → `#15803d`;
cyan `#0891b2` → `#0e7490`; placeholder `#cbd5e1` → `#64748b`; badge `#ef4444` →
`#dc2626`; tangga peringkat 2–3 `#3b82f6`/`#93c5fd` → `#2563eb`/`#bfdbfe` +
teks `#1e3a8a`.

Regresi dijaga oleh `docs/uat/guard_kontras_ranking.mjs` (baru) yang memeriksa
halaman ranking RT/RW/Admin — celah yang membuat temuan ini lolos dari
`guard_kontras_wcag.mjs`.

---

## Gelombang UI Pengaduan (2026-11-25)

Backend `pengaduan`/`pengaduan_riwayat` sudah ada sejak gelombang P2, tetapi belum
punya antarmuka — warga tidak bisa mengadu, RT tidak bisa menindaklanjuti dari
layar. Ditutup dengan satu komponen `src/components/PengaduanPanel.jsx` yang
dipasang di keempat dashboard (warga, RT, RW, admin).

Pembagian kewenangan tetap 100  0i server; UI tidak memfilter sendiri:

| Peran | Yang tampil |
|---|---|
| Warga | Form kirim (kategori + isi) dan daftar pengaduan **miliknya** saja |
| RT | Pengaduan wilayahnya saja; tombol Terima/Tolak + kolom tanggapan |
| RW / Admin | Seluruh RT; dapat mengambil alih bila RT tidak tersedia |

Test backend bertambah dari 5 → **11** (`PengaduanTest`): isolasi wilayah pada
daftar, kompatibilitas format RT lama (`1` vs `001`), status di luar daftar
→ 422, isi kosong → 422, akun warga tanpa `id_warga` → 403, dan riwayat yang
mencatat setiap transisi status.

UI dijaga `docs/uat/guard_pengaduan.mjs`: 4 peran, kontras WCAG AA, target sentuh
≥ 40px, tanpa overflow 360px, dan asersi bahwa RT 001 **tidak** melihat pengaduan
RT 003.

---

## Gelombang Kanonikalisasi RT (2026-11-25)

Sebelumnya setiap halaman menormalkan RT dengan caranya sendiri: `padStart(2,'0')`
di RW, `Number(rt)` di filter, `String(Number(...))` di perbandingan, dan
`value="1"` pada `<select>` RT di form warga. Akibatnya satu wilayah bisa muncul
sebagai `1`, `01`, dan `001` pada layar yang berbeda, dan filter berbasis string
bisa tidak cocok dengan data yang tersimpan tiga digit.

Penutupnya satu helper bersama `src/lib/rt.js`:

| Fungsi | Kegunaan |
|---|---|
| `rtInt(v)` | nilai integer RT, `null` bila bukan RT sah |
| `rtKode(v)` | RT kanonik tiga digit untuk dikirim ke API |
| `rtNomor(v)` | label dua digit (`01`) |
| `rtLabel(v)` | label siap pakai (`RT 01`) |
| `rtSama(a,b)` | perbandingan wilayah yang tahan format lama |

Yang berubah: seluruh label wilayah di dashboard RT/RW/Admin memakai `rtLabel`;
perbandingan filter memakai `rtInt` (bukan `Number()`/string compare); nilai
`<select>` RT di `WargaDashboard` dan `RegisterWarga` mengirim `001/002/003`
(bukan `1/2/3`); helper `fmtNum` lokal di RW dihapus.

Regresi dijaga dua lapis: `tests/Unit/RtFormatterTest` (6 test, 40 assertion) untuk
kontrak backend, dan `docs/uat/guard_rt_kanonik.mjs` yang memeriksa seluruh label
RT di UI harus dua digit dan nilai select harus tiga digit (8 pemeriksaan, 0 gagal).

---

## Gelombang Test Jurnal (P2-10, 2026-11-25)

Audit §17.2 mencatat jurnal mengklaim "29/29 test case lulus", tetapi repo hanya
menutup ~19 padanan dan tiga kelompok hilang total — terutama **cetak laporan**,
yang sama sekali tidak punya test sehingga `window.print()` palsu (BUG-23) lolos.

`tests/Feature/JurnalKelompokTest.php` (26 test) memetakan delapan kelompok jurnal
ke perilaku API yang benar-benar menjaga klaim tersebut:

| Kelompok jurnal | Test | Yang dijaga |
|---|---:|---|
| 1. Autentikasi | 4 | login valid mengembalikan peran+RT, login salah 401 tanpa bocor alasan, rute privat 401 JSON (bukan redirect HTML), logout mencabut token |
| 2. Registrasi warga | 4 | identitas warga tertaut, username duplikat 422, password pendek 422, RT tidak sah 422 |
| 3. Pengajuan kuesioner | 3 | submit menyimpan jawaban mentah + status `menunggu` (matriks baru dibentuk saat approval), pengajuan kedua 400, warga melihat statusnya sendiri |
| 4. Verifikasi & akses RT | 4 | approve membentuk 10 penilaian, reject, filter wilayah, edit jawaban |
| 5. Perhitungan SAW | 4 | urutan ranking, matriks keputusan `/saw/dataset` lengkap 10 kolom, kriteria konstan dilaporkan, kriteria bervariasi tidak |
| 6. Import CSV | 1 | CSV asli → 90 warga, 90 pengajuan `menunggu`, 900 penilaian |
| 7. Manajemen akun | 2 | tambah/edit/hapus, username duplikat 422 |
| 8. Cetak laporan | 4 | isi CSV ranking, scope peran pada ekspor, struktur activity log, format tak dikenal 422 |

**Bug nyata yang ditemukan gelombang ini:** `RtFormatter::rule()` memakai pola
`^[0-9]{1,3}$` yang meloloskan `"0"`; `formatRt()` lalu melempar exception dan
endpoint membalas **500** alih-alih **422**. Pola diperbaiki menjadi
`^(?!0+$)[0-9]{1,3}$` dan dijaga `RtFormatterTest`.

---

## Gelombang Higiene P3 (2026-11-25)

Tiga temuan §21/§22.3 ditutup sekaligus, masing-masing dengan bukti test.

### P3-26 — kolom `warga.password` dihapus

Kolom ini ditulis tiga jalur (`AuthController`, `ImportWargaSeeder`,
`AdminRtController`) tetapi **tidak pernah dibaca**: autentikasi memakai tabel
`users`. Migrasi `2026_11_25_000005` menghapusnya. `P3HygieneTest` memverifikasi
`Schema::hasColumn(warga,password) === false` dan bahwa pembuatan warga tetap
berjalan tanpa kolom itu.

### P3-30 — status baca chat

Sebelumnya tidak ada status apa pun, sehingga badge "ada pesan baru" dihitung
dari panjang array — ikut menghitung pesan sendiri dan tidak pernah kembali ke
nol. Sekarang:

| Bagian | Perubahan |
|---|---|
| Skema | `pesan_chat.dibaca_pada` (nullable) + index `(id_pengajuan, dibaca_pada)` |
| API | `GET /chat/{id}/belum-dibaca` → `{jumlah}`; `PUT /chat/{id}/baca` → tandai semua pesan lawan bicara |
| UI | Badge tab Diskusi & titik merah kartu beranda memakai `jumlah` dari server; dibuka → ditandai dibaca |

`P3HygieneTest` (4 test) dan `docs/uat/guard_chat_belum_dibaca.mjs` (5 pemeriksaan)
menjaga: pesan sendiri tidak dihitung, badge muncul lalu hilang, status tetap nol
setelah reload (tersimpan di DB), dan penandaan baca **tidak bocor** ke pengajuan
warga lain.

### P3-32 — pembatas laju endpoint berat

Hanya `/login` & `/register` yang dibatasi sebelumnya. `AppServiceProvider` kini
mendaftarkan tiga limiter, dihitung **per pengguna** (bukan per IP, karena beberapa
RT bisa berbagi satu IP kantor):

| Limiter | Endpoint | Batas |
|---|---|---|
| `saw` | `GET /saw/hitung`, `/saw/report/export` | 60/menit |
| `import` | `POST /admin/pengajuan/import`, `/admin/fix-data` | 10/menit |
| `chat` | `POST /chat/{id}` | 30/menit |

`P3HygieneTest` membuktikan panggilan ke-61 ke `/saw/hitung` dan ke-31 ke
`POST /chat` dibalas **429**, dan pesan yang ditolak tidak tersimpan di database.

### P3-28 — dead code

`WargaController::cekStatus` dan `Penilaian::kriteria()` dihapus (tidak pernah
dipanggil). `PesanChat` dipertahankan karena sekarang dipakai `ChatController`.
`src/lib/api.js` dipertahankan sebagai shim re-export yang masih diimpor `App.jsx`
dan `LandingPage.jsx`.

### Catatan operasional: batas login menipu guard UAT

`guard_pengaduan.mjs` sempat tampak flaky (1 dari 3–5 run gagal dengan pesan
"panel pengaduan tidak muncul"). Penyebabnya bukan UI: skrip login 4× per run,
sementara `/api/login` dibatasi 10/menit, sehingga run ketiga dalam satu menit
mendapat **429** dan halaman berhenti di form login. Perbaikan: token diambil
sekali per peran lewat API lalu disuntik ke `localStorage`, dan skrip mencetak
pesan eksplisit bila batas tercapai. Sesudah perbaikan, run berurutan hijau
selama batas login belum tercapai (2 run berturut-turut tanpa jeda, lalu hijau
lagi setelah jeda ~60 detik).

---

## Gelombang Dependency Audit (P3-33, 2026-11-25)

Dua audit dijalankan dan seluruh temuannya ditutup.

### Backend: 53 advisory (12 paket) → 0

`composer audit` menemukan **1 critical, 15 high, 22 medium, 7 low** (8 tanpa label).
Yang paling relevan untuk sistem ini:

| Advisory | Paket | Relevansi |
|---|---|---|
| *TokenGuard authentication bypass through non-string API credentials* (CVE-2026-114509, **critical**) | `laravel/framework` < 12.68.0 | **langsung** — sistem memakai Sanctum token auth |
| *CRLF injection in default email rule* (CVE-2026-48019) | `laravel/framework` < 12.60.0 | relevan bila validasi `email` dipakai |
| *Noncanonical host can bypass host-based checks* (CVE-2026-69246) | `guzzlehttp/guzzle` < 7.15.2 | tidak dipakai runtime, tetap ditutup |
| 9 advisory DoS/XSS `league/commonmark` | 2.8.2 | tidak dipakai untuk input pengguna |

Ditutup dengan `composer update --with-dependencies`: `laravel/framework`
12.58.0 → **12.74.0**, `sanctum` 4.3.1 → **4.5.0**, `symfony/*` 7.4.8 → **7.4.24**,
`guzzle` 7.10.0 → **7.17.0**, `commonmark` 2.8.2 → **2.10.8**.
**`composer.json` tidak diubah** — semua masih dalam constraint yang ada.

### Frontend: 17 advisory (12 high) → 0

| Paket | Sebelum | Sesudah |
|---|---|---|
| `axios` | 1.15.2 (24 advisory, termasuk ReDoS & prototype pollution) | **1.21.1** |
| `react-router-dom` | 7.14.2 (8 advisory, termasuk open redirect & CSRF) | **7.18.7** |
| `vite` | 8.0.10 (7 advisory, termasuk RCE via `launch-editor` di Windows) | **8.3.8** |
| `postcss` | 8.5.22 | **8.5.33** |

`npm audit fix` — **`package.json` tidak diubah**, hanya `package-lock.json`.

### Verifikasi

| Pemeriksaan | Hasil |
|---|---|
| `php artisan test` | 132 passed (3013 assertions) |
| `eslint` / `vite build` | bersih / sukses |
| `composer audit` | 0 advisory |
| `npm audit` | 0 vulnerabilities |
| 6 guard UAT | semua hijau |

**Catatan lingkungan:** `composer` di mesin ini terpasang sebagai skrip shell di
`C:\Program Files\composer` yang memanggil `composer.phar`; memanggil `composer`
langsung gagal (`Could not open input file`). Yang bekerja:
`/c/xampp/php/php.exe "C:/Program Files/composer.phar" <perintah>`.

### Index `pengajuan.status`

Satu-satunya query yang memindai seluruh tabel `pengajuan` adalah filter
`status = 'disetujui'` di `SawCalculator::ambilDataEligible()` — tanpa index,
setiap kalkulasi SAW melakukan full table scan. Migrasi
`2026_11_25_000007_add_status_index_to_pengajuan_table` menambah
`pengajuan_status_index`.

Verifikasi di SQLite kosong: 20 migrasi berjalan, index terbentuk
(`pengajuan.pengajuan_status_index`), `migrate:rollback --step=2` menghapusnya
bersih (index `pengajuan` kembali 1: hanya `pengajuan_id_warga_unique`), dan
`migrate` ulang mengembalikannya.

---

## Gelombang Polling Chat (P3-30 lanjutan, 2026-11-25)

Status baca sudah tersimpan server sejak gelombang sebelumnya, tetapi pesan masih
hanya dimuat **sekali**: balasan RT baru terlihat setelah reload manual, dan balasan
warga baru terlihat di sisi RT setelah modal verifikasi ditutup lalu dibuka ulang.

### Implementasi

| Sisi | Polling hidup saat | Interval | Berhenti saat |
|---|---|---|---|
| Warga | ada `id_pengajuan` | 15 s | tab tidak terlihat, atau 401/403/404 |
| RT | modal verifikasi terbuka | 15 s | modal ditutup, tab tidak terlihat, atau 401/403/404 |

Empat detail yang menentukan:

1. **Pesan lokal dipertahankan.** Entri ber-`temp_id` (masih dikirim) tidak
   ditimpa hasil polling, karena belum ada di server.
2. **Tanpa render ulang bila identik.** Perbandingan per indeks pada `id_pesan`;
   bila sama, state lama dikembalikan sehingga daftar tidak berkedip. Efek
   auto-scroll diubah dari `[pesanList]` ke `[pesanList.length]`.
3. **Badge tidak berkedip.** Bila pengguna sedang di tab Diskusi, hasil polling
   yang masih "belum dibaca" langsung ditandai dibaca.
4. **Duplikat dihilangkan di sumbernya.** Setelah `POST /chat/{id}` sukses klien
   mengambil ulang daftar dari server. Sebelum ini, pesan yang baru dikirim tetap
   membawa `temp_id` sehingga polling berikutnya menampilkan versi ganda.

### Bukti

| Pemeriksaan | Hasil |
|---|---|
| `guard_chat_polling.mjs` (baru) | 8/8 PASS — pesan RT muncul tanpa reload dalam 14.8 s, URL tetap `/warga`, badge muncul lalu hilang, pesan tidak terduplikasi |
| `guard_chat_polling_rt.mjs` (baru) | 6/6 PASS — pesan warga muncul di modal dalam 14.5 s, modal tetap utuh, RT masih bisa mengirim, pesan tersimpan |
| `tests/Feature/ChatPollingTest.php` (baru) | 4 test / 18 assertion — `GET` tidak menandai terbaca, urutan deterministik, pesan baru terlihat di polling berikutnya, warga lain tetap 403 |
| Total suite backend | 136 test / 3031 assertion |

### Guard lama yang ikut diperbaiki

`guard_chat_belum_dibaca.mjs` sempat gagal 4 dari 5 pemeriksaan setelah polling
masuk. Penyebabnya bukan regresi produk: skrip itu login lewat form lalu menebak
waktu tunggu (`waitForTimeout(3500)`), sehingga kadang membaca tab sebelum
`fetchStatus` selesai. Sekarang token disuntik ke `localStorage` dan semua
penantian memakai `waitForFunction` (badge benar-benar muncul/hilang). Sesudah
perbaikan: 5/5 PASS.

**Catatan batas login.** `guard_chat_polling*.mjs` butuh 2 login per run dan
`guard_pengaduan.mjs` 4 login per run, sementara `/api/login` dibatasi 10/menit.
Menjalankan guard berturut-turut tanpa jeda akan kena 429; beri jeda ~60 detik.

---

## Gelombang Hapus Tailwind CDN (2026-11-25)

Tiga dashboard menyuntik `cdn.tailwindcss.com` saat mount — ~120 kB JavaScript plus
compiler Tailwind yang jalan di browser pengguna, untuk menebak kelas mana yang
dipakai. Setelah diperiksa, CDN itu **praktis tidak dipakai**.

### Temuan

| Pemeriksaan | Hasil |
|---|---|
| Token `className` unik di seluruh `src/` | 64 |
| Kelas custom, didefinisikan sendiri di `<style>` per halaman | 63 |
| Utilitas Tailwind yang benar-benar dipakai | **1** — `select-none` |

Semua `rt-main`, `rw-header`, `ld-btn`, `card`, `inp`, `btn-blue`, `warga-tabs`,
`badge-screen` dan seterusnya adalah CSS biasa di blok `<style>` masing-masing
halaman. Tidak ada `flex`, `p-4`, `text-sm`, `gap-2`, atau `md:` sama sekali.

### Perubahan

1. Blok injeksi CDN dihapus dari `useDesign()` di `RtDashboard`, `RwDashboard`,
   `AdminDashboard`.
2. `select-none` dipindahkan ke `src/index.css` sebagai aturan biasa
   (`user-select: none` + prefiks `-webkit-`). `index.css` sudah di-import
   `main.jsx`, jadi berlaku di semua halaman.
3. Tidak ada perubahan tampilan: semua kelas lain sudah punya aturannya sendiri.

### Bukti

| Pemeriksaan | Hasil |
|---|---|
| `guard_tanpa_tailwind_cdn.mjs` (baru) | 7/7 PASS — 0 permintaan ke CDN di 5 halaman, 0 kelas berpola utilitas Tailwind, `user-select: none` tetap berlaku |
| `guard_overflow_mobile.mjs` | 9 halaman, 0 overflow |
| `guard_kontras_wcag.mjs` | 204 teks, 0 gagal kontras |
| `guard_kontras_ranking.mjs` | 3 halaman, 0 gagal |
| `guard_rt_kanonik.mjs` | 8 pemeriksaan, 0 gagal |
| `guard_pengaduan.mjs` | 4 halaman, 0 gagal |
| `guard_chat_belum_dibaca.mjs` | 5 pemeriksaan, 0 gagal |
| `guard_chat_polling.mjs` / `_rt.mjs` | 8/8 dan 6/6 PASS |
| `npx eslint src --max-warnings=0` | bersih |
| `npx vite build` | sukses, CSS 1,32 kB (gzip 0,65 kB) |

### Dua bug di guard yang ikut ditemukan

1. Versi pertama memeriksa "kelas tanpa aturan CSS" dan melaporkan 5 halaman gagal
   padahal `select-none` jelas berfungsi. Penyebab: di Chromium modern
   `CSSStyleRule` **juga** punya `.cssRules` (CSS Nesting), sehingga logika
   `r.cssRules ? [...r.cssRules] : [r]` melewati rule itu sendiri dan selalu
   kosong. Diperbaiki: periksa `selectorText` dulu, telusuri `.cssRules` hanya bila
   ada isinya.
2. Pendekatan itu juga salah sasaran: `no-print` hanya ada di dalam `@media print`,
   dan `*-sidebar-brand` adalah kelas mati yang sudah ada sejak sebelumnya. Guard
   sekarang memeriksa **pola kelas utilitas Tailwind** — hal yang benar-benar akan
   rusak bila CDN hilang.

---

## Gelombang Font Self-Hosted (2026-11-25)

Font diambil runtime dari `fonts.googleapis.com` di empat tempat: dua `<link>` +
dua `preconnect` di `index.html`, `@import` di Landing/Login/Register/Warga, dan
injeksi `<link>` lewat `document.createElement` di `useDesign()` dashboard.

### Yang ditemukan

| Temuan | Angka |
|---|---|
| Material Symbols versi penuh yang diminta `index.html` | **4.026.236 byte** untuk ~3.500 ikon |
| Ikon yang benar-benar dipakai aplikasi | **64** |
| `Inter` yang diminta | dipakai **1 baris** di `DiagnosaKoneksi.jsx` |

Jadi yang diunduh pengguna setiap kali membuka halaman: font 4 MB, padahal yang
terpakai 66 KB.

### Perubahan

Berkas font diunduh sekali ke `bansos-frontend/public/fonts/`:

| Berkas | Ukuran |
|---|---:|
| `plus-jakarta-sans-latin.woff2` | 27 KB (variable font 200–800) |
| `plus-jakarta-sans-latin-ext.woff2` | 21 KB |
| `material-symbols-subset.woff2` | 66 KB (64 ikon) |

`src/fonts.css` memuat semua `@font-face` + `.material-symbols-outlined`, di-import
`main.jsx`. Semua injeksi runtime dan `@import` dihapus; `index.html` bersih dari
`preconnect`/`<link>` Google. `Inter` dihapus, satu pemakaiannya dialihkan ke
Plus Jakarta Sans.

**Total: 4 MB + 2 × CSS Google → 114 KB dari origin sendiri.**

### Bukti

| Pemeriksaan | Hasil |
|---|---|
| `guard_font_self_hosted.mjs` (baru) | 18/18 PASS — 0 permintaan ke Google di 5 halaman, kedua font `loaded`, glyph ikon 24 px |
| **Uji negatif** (font dipotong jadi 2 KB) | **13 kegagalan** — ikon jadi teks sampai 128 px. Guard terbukti bisa gagal. |
| 10 guard visual lama | semua hijau |
| `php artisan test` | 136 passed (3031 assertions) |
| `npx vite build` | sukses, CSS 2,48 kB gzip 1,06 kB |

### Tiga bug di guard yang ikut ditemukan

1. **Daftar ikon tidak lengkap.** Versi pertama hanya mengumpulkan `name="…"`,
   padahal ikon juga dipakai lewat `icon: '…'` di array menu. Akibatnya
   `dashboard` selebar 162 px dan `manage_accounts` 270 px — teks, bukan ikon.
   Daftar dikumpulkan ulang dari tiga pola → 64 ikon.
2. **Font dimuat lazy.** `document.fonts` melaporkan `unloaded` bila tidak ada teks
   yang memakainya, sehingga pengukuran jatuh ke font fallback. Guard kini
   memanggil `document.fonts.load()` eksplisit sebelum mengukur.
3. **Probe tanpa font-size.** Beberapa halaman meng-override
   `.material-symbols-outlined` jadi 20 px sehingga probe mewarisi ukuran lain.
   Probe kini menetapkan `font-size: 24px`, dan pembanding memakai rasio
   lebar/font-size, bukan ambang px tetap.

**Cara memperbarui subset ikon** didokumentasikan di `docs/uat/README.md` — penting,
karena menambah ikon tanpa memperbarui subset akan menampilkan teks alih-alih ikon,
dan teks di sekitarnya tetap normal sehingga mudah lolos dari pemeriksaan manual.

---

## Gelombang Migrasi Live (2026-11-26)

Tujuh migrasi baru dijalankan ke `db_bansos_saw` (MariaDB 10.4.32). Sebelumnya
database live masih di 13 migrasi lama — kode sudah memakai `pengaduan`,
`pengajuan_riwayat`, `pesan_chat.dibaca_pada`, dan index status, sehingga live
akan gagal pada endpoint tersebut.

### Persiapan (semua diverifikasi, bukan diasumsikan)

| Langkah | Hasil |
|---|---|
| Backup `mysqldump --single-transaction --routines --triggers` | `docs/archive/db_bansos_saw_backup_20261126_010427.sql` (108.562 byte) |
| Dry-check duplikat `(id_pengajuan, id_kriteria)` | **0 baris** — unique constraint 000003 aman |
| Prekondisi | `dibaca_pada` belum ada, `pengajuan_status_index` belum ada, `warga.password` ada (95 baris terisi) |

### Eksekusi & verifikasi

Semua 7 migrasi `DONE` dalam < 0,5 s. Data tidak berubah: warga 95, pengajuan 94,
penilaian 940, users 6. Tabel `pengaduan`/`pengaduan_riwayat`/`pengajuan_riwayat`
terbentuk dengan FK benar; tiga index baru terpasang; `warga.password` hilang.

Uji API hidup:

| Endpoint | Hasil |
|---|---|
| `GET /api/saw/hitung` | 90 warga diranking, skor 0,575–0,950, **31 nilai unik** (bukan fallback massal) |
| Sebaran RT | 001: 35, 002: 27, 003: 28 |
| `GET /api/saw/report/export?format=csv` | 200, 1.458 byte, header benar |
| `GET /api/pengaduan` | 200 |
| Isolasi chat | `GET /chat/31` (RT 001) 200 · `GET /chat/10` (RT 003) **403** |
| `php artisan test` | 136 passed (3031 assertions) |

### Rollback diuji di salinan terpisah

`migrate` penuh lalu `migrate:rollback --step=7` pada SQLite scratch: ketiga tabel
baru hilang, `dibaca_pada` hilang, dan `warga.password` **kembali**. Migrasi ini
reversibel, bukan jalan satu arah.

### Temuan data sampah (BUKAN akibat migrasi)

4 warga (id 92–95) dengan `nama_lengkap` kosong, `rt='000'`, alamat kosong, punya
pengajuan #91–#94 berstatus `disetujui` dengan `jawaban_mentah` **NULL**, plus 10
baris `penilaian` masing-masing. Muncul di respons sebagai `dilewati[]` dengan alasan
"nama warga kosong".

Migrasi hanya mengubah struktur — tidak pernah menyentuh baris `warga`/`pengajuan`.
Baris ini sudah ada sebelumnya. **Tidak dihapus**: penghapusan data pengguna di luar
mandat, dan `RE_AUDIT_BANSOS_HUB_REPORT.md` mencatat rekonsiliasi 94 data live masih
menunggu verifikasi RT. Perlu keputusan pemilik data; query dry-run ada di
`FIX_IMPLEMENTATION_REPORT.md` §8e.

Dampak: ranking 90 warga sah tetap benar, dan 4 baris itu kini **terlihat** di UI
lewat banner `dilewati[]` alih-alih disembunyikan diam-diam.

### Temuan kedua: data live bukan salinan seed demo

Guard UAT chat gagal dengan *"tidak ada pengajuan untuk warga01"*. Setelah diperiksa:

| Fakta | Nilai |
|---|---|
| `users.warga01` → `id_warga` | **1** (Budi Santoso, RT 001) |
| Pengajuan pertama di live | `id_pengajuan 1` → **`id_warga 2`** |
| Warga sah tanpa pengajuan | **1** — warga #1 / `warga01` |

Pengajuan live dimulai dari `id_warga 2`, sedangkan akun demo menunjuk `id_warga 1`.
Jadi `warga01` adalah satu-satunya warga sah yang belum pernah mengisi kuesioner.

Bukan efek migrasi. Ketiga guard chat kini **melewati** dengan pesan eksplisit
(exit 0) karena prasyaratnya data seed demo, bukan kondisi produk — sebelumnya
dilaporkan sebagai kegagalan, yang menyesatkan.

Chat tetap dibuktikan bekerja di live lewat API dengan akun RT: `POST /chat/31` →
tersimpan, `GET /chat/31` → 1 pesan, `GET /chat/31/belum-dibaca` → `jumlah:0`
(pesan sendiri tidak dihitung), `PUT /chat/31/baca` → sukses. Pesan uji lalu dihapus
(`pesan_chat` kembali 0 baris).

### Tindak lanjut: kuesioner `warga01` diisi

Atas permintaan pemilik data, akun demo dilengkapi lewat **alur aplikasi**, bukan
`INSERT` manual — supaya matriks dibangun `PenilaianAssembler` (SSOT):

`POST /api/warga/pengajuan` sebagai `warga01` → pengajuan **#95** (`menunggu`) →
`PUT /api/admin/pengajuan/95/status` sebagai `rt001` → `disetujui` → **10 baris
penilaian** terbentuk (940 → 950). `jawaban_mentah` tersimpan 230 byte.

Dampak terukur:

| Sebelum | Sesudah |
|---|---|
| 90 warga diranking | **91** |
| `kriteria_tanpa_variasi`: 3 kriteria | **0** |
| 3 guard chat dilewati | **5/5 + 8/8 + 6/6 PASS** |

Budi Santoso: skor `0,641667`, ranking global 85, ranking RT 35 — konsisten dengan
profil paling rentan, dan membuktikan matriksnya berbeda dari warga lain (bukan
fallback seragam).

### Keadaan akhir live

| Item | Nilai |
|---|---|
| Migrasi | **20/20 `Ran`** (batch 2 = 7 migrasi baru) |
| warga / pengajuan / penilaian / users | 95 / 95 / 950 / 6 |
| `pesan_chat` / `pengaduan` / `pengajuan_riwayat` | 0 / 0 / 0 (bersih, pesan uji dihapus) |
| Guard UAT terhadap live | overflow 9/0, kontras 116 teks/0, ranking 3/0, RT kanonik 8/0, Tailwind 7/0, font 18/0, pengaduan 4/0, chat 5/0 + 8/0 + 6/0 — **semua hijau** |
