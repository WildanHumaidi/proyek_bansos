# SAW — JOURNAL RECONCILIATION (P0-02)

Dokumen ini merekonsiliasi hasil perhitungan SAW antara acuan jurnal
("Web-Based Decision Support System for Recommending Social Assistance
Recipients using the SAW Method", Vol. 6 No. 1, Oct 2026), CSV produksi, dan
implementasi di repository. Disusun sebagai bukti yang dapat diverifikasi
kembali (setiap angka di bawah dapat direproduksi dengan skrip yang dicantumkan).

---

## 1. Verifikasi Aritmetika SAW (bagian A — formula)

Input: matriks keputusan persis sebagaimana ditulis jurnal pada halaman 21
(Tabel 4.3 "Nilai Numerik data warga"):

```
          C1   C2   C3   C4   C5   C6   C7   C8   C9   C10
          Ben  Ben  Cost Ben  Cost Cost Cost Cost Cost Cost
A1 Dwi    2,5  7,5  2,5  5,0  2,5  2,5  2,5  5,0  2,5  2,5
A2 Iwan   5,0  10,0 7,5  7,5  5,0  5,0  10,0 5,0  10,0 2,5
A3 Rizqi  5,0  7,5  7,5  2,5  2,5  2,5  5,0  5,0  7,5  2,5
```

Formula (sesuai FR-03 PRD dan jurnal):

- Benefit: r_ij = x_ij / max(x_ij) — max diambil atas kolom matriks.
- Cost:    r_ij = min(x_ij) / x_ij — min diambil atas kolom matriks.
- V_i = Σ (w_j / Σw) × r_ij — bobot semula 10% × 10 kriteria, ternormalisasi 0.1.

Hasil komputasi (skrip `saw_check.php`, PHP 8.2, perhitungan float murni):

```
Max per kriteria (dari matriks): 5, 10, 7.5, 7.5, 5, 5, 10, 5, 10, 2.5
Min per kriteria (dari matriks): 2.5, 7.5, 2.5, 2.5, 2.5, 2.5, 2.5, 5, 2.5, 2.5

A1: V = 0.892   (r: 0.5, 0.75, 1, 0.667, 1, 1, 1, 1, 1, 1)
A2: V = 0.683   (r: 1, 1, 0.333, 1, 0.5, 0.5, 0.25, 1, 0.25, 1)
A3: V = 0.725   (r: 1, 0.75, 0.333, 0.333, 1, 1, 0.5, 1, 0.333, 1)
```

**Hasil: A1 = 0.892, A2 = 0.683, A3 = 0.725; urutan A1 (1), A3 (2), A2 (3).**

- [x] Formula SAW yang diimplementasikan di `SawCalculator`/`SawController`
      menghasilkan nilai yang sama persis (dibuktikan regression test
      `SubKriteriaArahNilaiTest::test_worked_example_jurnal_tabel_2_dan_3_tereproduksi`
      yang melewati matriks jurnal ke engine nyata).
- [x] Skala sub-kriteria di `KriteriaSeeder` (benefit: besar→prioritas; cost:
      kecil→prioritas) konsisten dengan arah matriks jurnal.

### 1.1 Koreksi terhadap laporan audit

Laporan RE-AUDIT menyatakan bekerjaan "the 'expected' value is itself
suspect" (MISMATCH-02) dan bahwa reproduksi worked example hanya terjadi
melalui test yang me-insert matriks sendiri (BUG-28). Verifikasi di atas
membuktikan:

- Matriks Tabel 4.3 jurnal **valid secara aritmetika**: 0.892/0.683/0.725
  muncul dari matriks itu dengan formula standar SAW — bukan hasil karangan.
- Yang **tidak valid di dalam PDF jurnal** adalah Tabel 4.4 & derivasi
  langkah-per-langkah (halaman 22-23): di sana jurnal menulis
  A1 = 0.800, A2 = 0.608, A3 = 0.596 dengan denominator yang keliru
  (C1 dipakai 10 padahal max kolom = 5; C4 dipakai 10 padahal max kolom = 7,5).
  Artinya dokumen jurnal tidak konsisten dengan dirinya sendiri: satu bagian
  menyatakan 0.892/0.683/0.725, bagian lain menurunkan 0.800/0.608/0.596.
- Kesimpulan audit → **dikoreksi**: "journal's own Table 2→3 derivation yields
  0.858, not 0.892" tidak berlaku untuk matriks yang benar; dengan matriks
  Tabel 4.3 yang ada di PDF, hasil benar = 0.892. Ketidaksesuaian hanya ada
  pada teks derivasi jurnal, bukan pada angka referensi 0.892/0.683/0.725.

## 2. Verifikasi Pipeline CSV (bagian B — pembentukan matriks)

### 2.1 Dwi Purnomo dari CSV produksi

CSV `database/data/data_warga.csv` (baris 2) menjawab:

```
1 KK; 5 ORANG; SMA / SMK / S1; 1 ORANG; > RP. 5.000.000; > RP. 5.000.000;
MILIK SENDIRI; PDAM; LISTRIK > 900 WATT; SEPEDA MOTOR LEBIH DARI 1 UNIT
→ mapping (JawabanMapper, nilai): [2.5, 7.5, 10, 5, 10, 10, 10, 7.5, 10, 7.5]
```

Matriks jurnal untuk A1 **berbeda** dari matriks hasil CSV:

```
Jurnal A1: [2.5, 7.5, 2.5, 5.0, 2.5, 2.5, 2.5, 5.0, 2.5, 2.5]
CSV   A1: [2.5, 7.5, 10,  5.0, 10,  10,  10,  7.5, 10,  7.5]
```

Perbedaan berasal dari JAWABAN, bukan dari kesalahan sistem:

- C3: CSV menjawab "SMA / SMK / S1" (pendidikan tinggi) → 10; jurnal memakai
  "Tidak Sekolah" → 2.5.
- C5/C6: CSV menjawab pengeluaran & penghasilan "> RP. 5.000.000" → 10;
  jurnal memakai 2.5.
- C7: CSV "MILIK SENDIRI" → 10 (jurnal 2.5).
- C8: CSV "PDAM" → 7.5 (jurnal 5.0).
- C10: CSV ">1 unit motor" → 7.5 (jurnal 2.5).

**Kesimpulan:** worked example jurnal adalah contoh manual yang memakai
jawaban warga yang TIDAK sama dengan isi CSV saat ini. Bukan bug sistem;
keduanya sah secara independen. Sistem TIDAK BOLEH (dan tidak akan)
memodifikasi skor/jawaban untuk memaksa hasil 0.892 dari data yang berbeda —
itu akan menjadi data fabrication.

### 2.2 Ranking penuh dari pipeline

Setelah impor + approval seluruh pengajuan, ranking API menghasilkan skor
berdasarkan matriks yang benar-benar terbentuk dari CSV (lihat
`P0RemediationTest::test_pipeline_end_to_end_csv_ke_ranking`). Skor Dwi
purnomo dalam kumpulan 90 alternatif tidak sama dengan 0.892 — dan itu
diharapkan, karena kumpulan alternatif, normalisasi (max/min per kolom), dan
jawabannya berbeda. Reproducibility dijaga: urutan & skor deterministik
(tie-break id_pengajuan), dapat dihitung ulang kapan pun.

## 3. Rekomendasi untuk naskah jurnal/penelitian

1. Regenerasi Tabel 4.4 (hasil perankingan) dari pipeline sistem yang sudah
   benar ini, bukan dari derivasi manual halaman 22-23.
2. Perbaiki teks derivasi jurnal: C1 denominator = 5, C4 denominator = 7,5
   (max dari matriks), bukan 10.
3. Nyatakan secara eksplisit bahwa worked example (0.892/0.683/0.725) dihitung
   pada matriks contoh (3 sampel), terpisah dari data CSV produksi — sama
   seperti jurnal aslinya yang menyebut "dikutip dari sampel responden".
4. CF ini tidak mengubah formula, CSV, maupun skor — sesuai mandat P0-02.

## 4. Bukti skrip

Skrip verifikasi disimpan di scratch (tidak dikomit): `saw_check.php`.
Reproduksi:

```bash
php saw_check.php
# Max per kriteria (dari matriks): 5, 10, 7.5, 7.5, 5, 5, 10, 5, 10, 2.5
# A1: V = 0.892  ... A2: V = 0.683  ... A3: V = 0.725
```

Regression test sistem:

```bash
php artisan test --filter=SubKriteriaArahNilaiTest
# ✓ worked example jurnal tabel 2 dan 3 tereproduksi
```