# Product Requirements Document (PRD)

## 1. Pendahuluan
### 1.1 Nama Proyek
**BANPER (Bantuan Penerima)**: Sistem Pendukung Keputusan Berbasis Web untuk Rekomendasi Penerima Bantuan Sosial Menggunakan Metode SAW.

### 1.2 Latar Belakang
Proses penentuan penerima bantuan sosial di lingkungan RW 08 Kelurahan Meruyung, Depok, masih menghadapi berbagai kendala pada tahap pendataan dan penentuan prioritas. Proses yang masih manual menyebabkan kurangnya pembaruan data, potensi kesalahan, serta banyaknya keluhan warga terkait transparansi penerima bantuan. Oleh karena itu, dibutuhkan sebuah Sistem Pendukung Keputusan (SPK) untuk membantu pihak pengurus (RT/RW/Admin) dalam menentukan prioritas penerima bantuan secara objektif, akurat, dan transparan.

### 1.3 Tujuan Proyek
1. Mengembangkan sistem pendukung keputusan berbasis web untuk membantu RT/RW dalam mengusulkan calon penerima bantuan sosial.
2. Menerapkan algoritma **Simple Additive Weighting (SAW)** untuk memberikan rekomendasi berdasarkan kriteria yang telah ditentukan.
3. Menyediakan wadah terkomputerisasi untuk pengelolaan data warga, kriteria, penilaian, dan pelaporan keluhan.
4. Menghasilkan rekomendasi yang dapat diunduh/dicetak sebagai bahan pertimbangan keputusan.

---

## 2. Arsitektur dan Teknologi
Proyek ini dibangun dengan arsitektur **Client-Server (Monolithic Terpisah)** berbasis API.
- **Backend (API & Logika Bisnis):** Laravel v12 (PHP 8.2+), menggunakan Laravel Sanctum untuk autentikasi.
- **Frontend (User Interface):** React v19, Vite, React Router v7, TailwindCSS (Utility classes), dan Axios.
- **Database:** MySQL / MariaDB.
- **Metode Pengambilan Keputusan:** Simple Additive Weighting (SAW).
- **Metodologi Pengembangan:** Agile Scrum.

---

## 3. Ruang Lingkup Pengguna (Role-Based Access Control)
Sistem memiliki 4 (empat) jenis pengguna dengan hak akses yang berbeda:

### 3.1 Warga
- Dapat melakukan registrasi akun dan login ke dalam sistem.
- Dapat mengajukan kuesioner/keluhan terkait permintaan bantuan sosial.
- Dapat melihat status pengajuan keluhan (Pending, Diterima, Ditolak).
- Dapat melihat riwayat keluhan dan pesan tanggapan dari RT/Admin.

### 3.2 RT (Rukun Tetangga)
- Dapat melakukan login ke sistem.
- Dapat mengelola data warga khusus di wilayah RT-nya.
- Dapat menginput data kuesioner warga berdasarkan kriteria.
- Dapat mengelola dan memverifikasi keluhan/pengajuan warga di wilayahnya (mengubah status menjadi Diterima/Ditolak beserta pesan tanggapan).
- Dapat melihat hasil rekomendasi perankingan di wilayahnya.
- Dapat mengunduh laporan rekomendasi untuk wilayahnya.

### 3.3 RW (Rukun Warga)
- Dapat melakukan login ke sistem.
- Dapat melihat seluruh data warga di lingkup RW.
- Dapat menjalankan (men-trigger) proses perhitungan metode SAW.
- Dapat melihat hasil perankingan penerima bantuan sosial secara global.
- Dapat mengunduh/mencetak laporan hasil rekomendasi sebagai bahan diskusi tingkat RW.

### 3.4 Admin (Administrator Sistem)
- Memiliki akses penuh terhadap seluruh fitur sistem.
- Dapat mengelola data pengguna (Warga, RT, RW, dan sesama Admin).
- Dapat mengelola master data **Kriteria** dan **Sub-Kriteria** (termasuk bobot dan tipe Benefit/Cost).
- Dapat mengunggah (import) data warga secara massal melalui file CSV.
- Dapat memverifikasi keluhan warga secara langsung jika diperlukan (sebagai backup RT).
- Dapat menjalankan proses kalkulasi SAW dan mencetak laporan keseluruhan.
- Dapat melihat Log Aktivitas (Activity Log) dari seluruh pengguna sistem.

---

## 4. Kebutuhan Fungsional Utama (Fitur)

### 4.1 Modul Autentikasi
- **Login:** Autentikasi menggunakan Username dan Password (terenkripsi *Bcrypt*). Redirect cerdas ke dashboard masing-masing sesuai *role*.
- **Registrasi Warga:** Form pendaftaran mandiri bagi warga baru (memasukkan Nama, NIK/Username, Password, Alamat, dan RT).

### 4.2 Modul Pengelolaan Data Kriteria (Khusus Admin)
- Menampilkan daftar 10 Kriteria (C1 - C10) beserta atribut (Benefit/Cost) dan Bobot persentase.
- Kriteria meliputi: Jumlah KK dalam 1 rumah, Jumlah anggota keluarga, Pendidikan kepala keluarga, Pengeluaran, Penghasilan, Status rumah, Sumber air, dsb.
- Modifikasi Bobot dan Kriteria untuk menyesuaikan kebijakan baru.

### 4.3 Modul Pengajuan & Keluhan (Kuesioner)
- Form input 10 parameter kuesioner sesuai kriteria SAW.
- Fitur *Submit* pengajuan oleh Warga.
- Fitur *Input on behalf* (RT mengisikan data warga yang tidak paham teknologi).
- Fitur Verifikasi Pengajuan oleh RT/Admin beserta fitur *chat/feedback* status.

### 4.4 Modul SPK (Simple Additive Weighting)
- **Fase Ekstraksi Data:** Mengambil seluruh data pengajuan warga yang berstatus **"Disetujui"**.
- **Fase Normalisasi:** Membentuk matriks keputusan dan melakukan normalisasi berdasarkan atribut kriteria (*Benefit*: $X/Max$, *Cost*: $Min/X$).
- **Fase Preferensi:** Mengalikan nilai normalisasi dengan bobot kriteria yang telah dinormalisasi.
- **Fase Perankingan:** Mengurutkan skor akhir (V) dari yang tertinggi hingga terendah.

### 4.5 Modul Laporan & Ekspor
- Menampilkan tabel matriks keputusan dan hasil perankingan.
- Tombol cetak PDF (*Client-side* menggunakan `jsPDF` / print browser native) untuk mengunduh laporan rekomendasi.

---

## 5. Kebutuhan Non-Fungsional
1. **Keamanan:** Keamanan endpoint API dilindungi oleh Laravel Sanctum Middleware. Password disimpan menggunakan algoritma Hash.
2. **Performa:** Perhitungan algoritma SAW berjalan efisien secara dinamis ketika dipanggil tanpa memberatkan *database* dengan tabel sementara yang tidak perlu.
3. **Usability:** Antarmuka (UI) responsif, intuitif, dan *user-friendly* menggunakan prinsip *Material Design* dan Tipografi modern (Plus Jakarta Sans).

---

## 6. Penutup
Dokumen PRD ini disusun sebagai acuan utama dalam memahami tujuan, cakupan, arsitektur, dan fitur dari proyek **Sistem Pendukung Keputusan Bantuan Sosial (BANPER)**. Sistem ini diharapkan mampu menjadi solusi terkomputerisasi yang transparan dan akurat bagi pengurus lingkungan RW 08 Meruyung, Depok.
