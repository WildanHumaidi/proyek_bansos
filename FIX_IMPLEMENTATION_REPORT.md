# FIX IMPLEMENTATION REPORT — BANSOS HUB

**Tanggal:** 25 November 2026
**Basis:** `RE_AUDIT_BANSOS_HUB_REPORT.md` (re-audit jurnal-grounded, 2026-11-25)
**Branch:** `main` @ `62663e9`
**Sifat pekerjaan:** IMPLEMENTASI (kode, migrasi, test, frontend) — bukan audit read-only

---

## 1. Ringkasan Eksekutif

Re-audit menyimpulkan satu kalimat: **mesin SAW-nya benar, tetapi sistem yang
memberi makan mesin itu tidak.** Laporan ini mencatat apa yang sudah diperbaiki,
apa yang dibuktikan, dan apa yang sengaja belum disentuh.

Hasil akhir gelombang ini:

| Metrik | Sebelum | Sesudah |
|---|---|---|
| Sel CSV terpetakan benar | 44,3 % (501 dari 900 sel fallback ke skor terendah; C3/C5/C6 100 % gagal) | **100 % (900/900, 0 fallback)** |
| Status hasil impor | `disetujui` (auto-approve) | **`menunggu`**, approval manual aktor berwenang |
| Kebocoran lintas RT di `/saw/hitung` | Ya (RT 001 lihat 90 warga semua RT) | **Tidak** (scope di backend, 35 baris RT 001 saja) |
| Ranking yang ditampilkan ke RT | Rank global (`i+1` di klien) | **`ranking_rt` dari server, mulai 1** |
| `dilewati` (warga tak masuk ranking) | Dihitung backend, tidak pernah tampil | **Banner di RT, RW, Admin** |
| "Unduh Laporan" | `window.print()` | **`GET /saw/report/export` → file CSV nyata** |
| Test suite backend | 56 test | **136 test / 3031 assertions, semua hijau** |

**Batas keamanan data:** seluruh verifikasi memakai SQLite sementara. Database
MySQL live `db_bansos_saw` **nol write** — tidak ada `migrate:fresh`, tidak ada
`db:seed`, tidak ada migrasi baru yang dieksekusi ke live.

---

## 2. Fondasi: Enam Service SSOT

Akar masalah audit bukan bug tunggal, melainkan **logika yang terduplikasi dengan
perilaku berbeda** di tiap jalur (seeder vs endpoint, warga vs RT, dataset vs
ranking). Perbaikannya adalah memaksakan satu jalur tunggal.

| Service | Baris | Menggantikan | Bug yang ditutup |
|---|---:|---|---|
| `app/Services/RtFormatter.php` | 76 | normalisasi RT ad-hoc di controller & frontend | BUG-18, BUG-22 |
| `app/Services/JawabanMapper.php` | 181 | heuristic LIKE + `str_contains` dua arah + fallback skor minimum | BUG-01, BUG-05 |
| `app/Services/PenilaianAssembler.php` | 73 | pembentukan `penilaian` per pemanggil | BUG-06, BUG-16 |
| `app/Services/JawabanTidakDikenalException.php` | 27 | kegagalan senyap | BUG-01 |
| `app/Services/CsvImporter.php` | 336 | `ImportWargaSeeder` + `AdminRtController::importCsv` | BUG-03, BUG-04, BUG-11, BUG-12, BUG-17, BUG-18 |
| `app/Services/SawCalculator.php` | 272 | `hitungRanking` + `getDataset` dengan kriteria berbeda | BUG-07, BUG-08, BUG-09, BUG-14, BUG-19 |

Prinsip yang dipakai konsisten: **tidak ada fallback diam-diam.** Jawaban yang
tidak dikenal menghasilkan error terstruktur (kode kriteria, jawaban asli,
alasan, nomor baris), bukan skor minimum.

---

## 3. P0 — Blocking (selesai, terbukti)

Gate: `tests/Feature/P0RemediationTest.php` — 10 test, dijalankan terhadap
pipeline nyata (CSV asli → parser → mapper → penilaian → `menunggu` → approval →
SAW → API ranking), bukan matriks dengan nilai expected yang sudah diketahui.

| # | Tindakan audit | Implementasi | Bukti |
|---:|---|---|---|
| 1 | Mapper gagal keras, bukan fallback; satukan seeder & endpoint; kamus CSV eksplisit | `JawabanMapper` + kamus alias terverifikasi | `test_csv_asli_900_sel_terpetakan_semuanya_tanpa_fallback` — 900 sel, 0 unmapped, tiap sel menunjuk kriteria benar |
| 2 | Rekonsiliasi matriks vs jurnal | `docs/SAW_JOURNAL_RECONCILIATION.md` | Tabel 4.3 jurnal → A1=0.892, A2=0.683, A3=0.725 **benar**; yang salah derivasi Tabel 4.4 di PDF (0.800/0.608/0.596, denominator keliru) |
| 3 | Identitas rumah tangga, bukan nama | dedup ter-normalisasi (nama + RT + alamat) | `test_import_dua_nama_sama_rt_berbeda_menghasilkan_dua_record`, `test_import_ulang_csv_yang_sama_tidak_menggandakan` (skip 90, tidak menggandakan) |
| 4 | Impor sebagai `menunggu`; approval sebelum SAW | `CsvImporter` selalu `menunggu` | `test_import_csv_asli_status_menunggu_dan_tidak_masuk_ranking_sebelum_approval`, `test_approval_memunculkan_pengajuan_di_ranking` |
| 5 | Validasi `id_subkriteria` terhadap `id_kriteria` | `PenilaianAssembler` strict | `test_update_kuesioner_pasangan_kriteria_subkriteria_silang_ditolak_422` (tanpa partial write) |
| 6 | Scope `/saw/hitung` per RT + `ranking_rt` server-side | `SawCalculator::hitung` | `test_rt_hanya_melihat_wilayahnya_dan_ranking_mulai_dari_1` |
| 7 | Regression test import CSV asli cell-by-cell + `fallback_count === 0` | `P0RemediationTest` | `test_pipeline_end_to_end_csv_ke_ranking` |

---

## 4. P1 — High (selesai, terbukti)

Gate: `tests/Feature/P1RemediationTest.php` — 10 test.

| # | Tindakan audit | Implementasi | Bukti |
|---:|---|---|---|
| 8 | Surface `dilewati` di tiga dashboard | `RankingWarnings.jsx` dipasang di RT/RW/Admin | verifikasi browser (bagian 8) |
| 9 | Buat baris `warga` berpasangan saat RT/admin membuat akun | `AdminRtController::storeUser` dalam transaksi + `id_warga` | `test_rt_membuat_akun_warga_langsung_tertaut_ke_identitas_warga` |
| 10 | Validasi jawaban terhadap kosakata kriteria | 422 + rincian per jawaban | `test_submit_jawaban_tidak_dikenal_ditolak_422_dengan_rincian`, `test_submit_jawaban_kurang_dari_10_ditolak_422` |
| 11 | Assert matriks lengkap saat approval, rollback bila parsial | `PenilaianAssembler` + transaksi | `test_approval_jawaban_tidak_lengkap_dirollback_dan_422` |
| 12 | Parse header CSV jadi map nama→indeks, tolak kolom hilang | `CsvImporter` | `test_csv_header_rt_hilang_menghasilkan_error_clear`, `test_csv_dengan_urutan_kolom_diacak_tetap_benar` |
| 13 | Izinkan pengajuan ulang setelah `ditolak` | `pengajuan_riwayat` (migrasi baru) | `test_warga_ditolak_dapat_mengajukan_ulang_dengan_histori` |
| 14 | Hapus kredensial default / paksa ganti password | **PARSIAL** — seeder dibuat idempoten + didokumentasikan dev-only; belum ada force-change | lihat §9 |
| 15 | Bungkus `kirimPengajuan`/`store` dalam transaksi | `DB::transaction` + rollback | `test_pengajuan_gagal_tidak_menyisakan_record_parsial` |

Tambahan: `test_warga_dengan_pengajuan_menunggu_tidak_bisa_menggandakan`,
`test_csv_rt_invalid_tidak_di_coerce_ke_rt001` (BUG-18).

---

## 5. P2 — Medium (inti selesai, sebagian)

| # | Tindakan audit | Status | Bukti |
|---:|---|---|---|
| 16 | Entitas `pengaduan` + riwayat status | **Selesai (backend + frontend)** | `PengaduanTest.php` — 11 test; panel dipasang di 4 dashboard; `guard_pengaduan.mjs` |
| 17 | `/admin/fix-data` jadi dry-run + konfirmasi | Selesai | `mode=dry-run` default, `mode=apply` eksplisit; mode tak dikenal → 422 |
| 18 | Export laporan server-side | Selesai | `test_export_report_csv_mengikuti_scope_dan_nilai_api` |
| 19 | Validasi RT saat impor, kanonikalisasi saat tulis | **Selesai** | `RtFormatter` + `src/lib/rt.js`; `test_csv_rt_invalid_tidak_di_coerce_ke_rt001`, `RtFormatterTest` (5 test), `guard_rt_kanonik.mjs` |
| 20 | Eligibility bersama `/saw/dataset` ↔ `/saw/hitung` | Selesai | `test_dataset_dan_ranking_setuju_perihal_alternatif_eligible` (BUG-19) |
| 21 | Banner error + retry di RT/RW | Selesai (banner; tombol retry sengaja tidak dipakai) | verifikasi browser §8 |
| 22 | Skip & laporkan baris nama kosong | Selesai | `CsvImporter` menolak + mencatat nomor baris (BUG-11) |
| 23 | Unique `(id_pengajuan, id_kriteria)` | Selesai | `2026_11_25_000003_add_unique_penilaian_pengajuan_kriteria.php` |
| 24 | Snapshot konsisten saat SAW membaca | Selesai | `test_perhitungan_saw_membaca_satu_snapshot_kriteria_dan_penilaian` (P2-09) |
| 25 | Restorasi 29 test case jurnal + 17 tipe test hilang | **Selesai (pemetaan 8 kelompok)** | `JurnalKelompokTest.php` — 26 test memetakan 8 kelompok jurnal ke perilaku nyata, termasuk 3 kelompok yang dulu absen total (cetak laporan) |

---

## 6. P3 — Hygiene (sebagian)

| # | Tindakan | Status |
|---:|---|---|
| 26 | Buang `warga.password` | **Selesai** — migrasi `2026_11_25_000005_drop_warga_password_column`; `P3HygieneTest` memverifikasi kolom tidak ada dan pembuatan warga tetap jalan |
| 27 | Seeder idempoten | Selesai (`UserSeeder`, `KriteriaSeeder`) |
| 28 | Buang dead code (`cekStatus`, `Penilaian::kriteria`, `PesanChat`, `lib/api.js`) | **Selesai (3 dari 4)** — `cekStatus` & `Penilaian::kriteria` dihapus; `PesanChat` kini dipakai `ChatController`; `src/lib/api.js` sengaja dipertahankan sebagai shim re-export yang dipakai `App.jsx` & `LandingPage` |
| 29 | Satukan dua API user & dua jalur kuesioner | Belum |
| 30 | Unread state + polling chat | **Selesai** — kolom `pesan_chat.dibaca_pada`, endpoint `GET /chat/{id}/belum-dibaca` & `PUT /chat/{id}/baca`, badge di tab Diskusi, **plus polling 15 s** di sisi warga & RT (berhenti saat tab tidak terlihat) |
| 31 | UI kuesioner diturunkan dari `/kriteria` | Belum |
| 32 | Rate limit import/SAW/chat | **Selesai** — limiter `saw` 60/menit, `import` 10/menit, `chat` 30/menit, dihitung per pengguna; `P3HygieneTest` membuktikan panggilan ke-61/ke-31 → 429 dan pesan ditolak tidak tersimpan |
| 33 | `composer audit` / `npm audit`, index `pengajuan.status` | **Selesai** — 53 advisory backend → **0**, 17 advisory frontend → **0**, index `pengajuan_status_index` ditambahkan (migrasi `2026_11_25_000007`) |

---

## 7. Migrasi Baru (SUDAH dijalankan ke live 2026-11-26 — lihat §8e)

Semua punya `down()` dan sudah diuji naik-turun di SQLite sementara.

| Berkas | Isi |
|---|---|
| `2026_11_25_000001_create_pengajuan_riwayat_table.php` | arsip jawaban lama saat pengajuan ulang setelah ditolak |
| `2026_11_25_000002_warga_password_nullable.php` | `warga.password` nullable (P3-01) |
| `2026_11_25_000003_add_unique_penilaian_pengajuan_kriteria.php` | unique `(id_pengajuan, id_kriteria)` (SI-01) |
| `2026_11_25_000004_create_pengaduan_tables.php` | `pengaduan` + `pengaduan_riwayat` (P2-01) |
| `2026_11_25_000005_drop_warga_password_column.php` | hapus `warga.password` — kredensial mati (P3-26) |
| `2026_11_25_000006_add_dibaca_pada_to_pesan_chat.php` | `pesan_chat.dibaca_pada` + index belum-dibaca (P3-30) |
| `2026_11_25_000007_add_status_index_to_pengajuan_table.php` | index `pengajuan.status` untuk filter SAW (P3-33) |

**Peringatan:** migrasi 003 bisa gagal di data live bila sudah ada duplikat
`(id_pengajuan, id_kriteria)`. Dry-check **sudah dijalankan 2026-11-26: 0 duplikat**,
sehingga migrasi berhasil. Perintah di bawah disimpan untuk referensi:

```sql
SELECT id_pengajuan, id_kriteria, COUNT(*) FROM penilaian
GROUP BY id_pengajuan, id_kriteria HAVING COUNT(*) > 1;
```

Migrasi 005 **menghapus kolom permanen**. Sebelum dijalankan sudah dipastikan
tidak ada skrip luar yang membaca `warga.password` (di repo tidak ada: autentikasi
memakai `users`), dan isinya (95 baris) tercakup backup. Migrasi 006 menambah kolom
nullable, jadi aman untuk data yang sudah ada.

---

## 8. Perubahan Frontend

| Berkas | Perubahan |
|---|---|
| `src/components/RankingWarnings.jsx` (baru) | Banner tiga kondisi: gagal muat, daftar `dilewati`, kriteria tanpa variasi |
| `src/lib/report.js` (baru) | `unduhLaporanSaw()` → `GET /saw/report/export`, blob → file |
| `src/pages/RtDashboard.jsx` | Buang `rank_global: i+1` klien; pakai `ranking`/`ranking_rt` server; buang filter klien; toggle "Seluruh Wilayah" dihapus (dulu menyembunyikan kebocoran); kartu "Rank Global Terbaik" → "Prioritas Utama"; dua tombol laporan jadi unduh CSV; palet kontras diperbaiki |
| `src/pages/RwDashboard.jsx` | State + banner; tombol "Unduh" baru di header; chip filter RT `minHeight: 40`; palet kontras diperbaiki |
| `src/pages/AdminDashboard.jsx` | State + banner; kolom header "Kelayakan" dihapus (tidak punya `<td>` — tabel misaligned); `colSpan` 6→5; tombol unduh; tangga warna peringkat 2–3 diganti; palet kontras diperbaiki |
| `src/components/PengaduanPanel.jsx` (baru) | Panel pengaduan satu komponen untuk 4 peran (kirim/pantau/tindak lanjut) |
| `docs/uat/guard_kontras_ranking.mjs` (baru) | Guard kontras + target sentuh + overflow khusus halaman ranking |
| `docs/uat/guard_pengaduan.mjs` (baru) | Guard panel pengaduan 4 peran + uji isolasi wilayah |
| `src/lib/rt.js` (baru) | Helper RT kanonik: `rtInt`, `rtKode`, `rtNomor`, `rtLabel`, `rtSama` |
| `docs/uat/guard_rt_kanonik.mjs` (baru) | Guard label RT dua digit + nilai select tiga digit |

### Bukti eksekusi

- `npx eslint src --max-warnings=0` → bersih
- `npx vite build` → sukses (497 kB / gzip 135 kB)
- Browser RT (`rt001`): 35 baris, semua `RT 001`, nomor 1..35 dari server
- Klik "Unduh Laporan" → blob 1458 byte, file CSV `laporan-saw-2026-11-25-*.csv`
- Data rusak disuntik (matriks 4/10 + nama kosong) → banner:
  *"2 warga tidak masuk peringkat … Uji Matriks Kurang — matriks penilaian belum
  lengkap / Pengajuan #92 — nama warga kosong"*
- Admin: 90 baris, header 5 kolom, unduh → blob 3589 byte
- Error state (endpoint diblokir): *"Gagal memuat hasil SAW. Server tidak
  merespons. Muat ulang halaman atau jalankan kalkulasi lagi."*

### UAT guard (docs/uat/)

| Skrip | Hasil |
|---|---|
| `guard_overflow_mobile.mjs` | 9 halaman, **0 overflow** (semua 360/360) |
| `guard_sidebar_mobile.mjs` | RT/RW/Admin semua **PASS** |
| `guard_kontras_wcag.mjs` | 159 teks, **0 gagal kontras**, 0 target < 40px |
| `guard_kontras_ranking.mjs` (baru) | RT 156 teks / RW 381 / Admin 464 — **0 gagal kontras, 0 target < 40px** |
| `guard_pengaduan.mjs` (baru) | 4 peran — **0 gagal kontras, 0 target < 40px, 0 overflow, isolasi RT terjaga** |
| `guard_rt_kanonik.mjs` (baru) | 8 pemeriksaan — label RT dua digit, nilai select tiga digit |
| `guard_chat_belum_dibaca.mjs` (baru) | 5 pemeriksaan — badge muncul, hilang, dan tetap nol setelah reload |
| `guard_scroll_font_race.mjs` | scrollW=360 di semua titik waktu |

### Perbaikan kontras (temuan tambahan)

Guard repo hanya menyapu Beranda, sehingga halaman ranking tidak pernah diperiksa.
Audit terpisah menemukan 136 teks di bawah ambang WCAG AA. Setelah perbaikan palet:

| Halaman | Sebelum | Sesudah |
|---|---:|---:|
| RT ranking | 37 gagal | **0** |
| RW ranking | 3 gagal | **0** |
| Admin ranking | 96 gagal | **0** |
| Admin seluruh menu (6) | 130 gagal | **0** |
| RT seluruh menu (4) | 4 gagal | **0** |
| RW seluruh menu (2) | 3 gagal | **0** |

Pasangan warna pengganti (semua terukur ≥ 4.5:1):

| Peran | Lama | Baru | Rasio |
|---|---|---|---|
| Teks sekunder | `#94a3b8` (2.34–2.56) | `#475569` | 6.15–7.58 |
| Teks tabel | `#64748b` (3.86–4.38) | `#475569` | 6.15–6.98 |
| Amber status | `#ca8a04` (2.74–2.94) | `#a16207` | 4.58–4.92 |
| Amber "belum dinilai" | `#d97706` (2.86–3.19) | `#b45309` | 4.51–4.89 |
| Merah | `#dc2626` (3.95) | `#b91c1c` | 5.30 |
| Tombol hijau | `#059669` (3.77) | `#047857` | 5.48 |
| Ikon centang | `#22c55e` (2.28) | `#15803d` | 5.02 |
| Ikon cyan | `#0891b2` (3.54) | `#0e7490` | 5.15 |
| Placeholder em dash | `#cbd5e1` (1.48) | `#64748b` | 4.76 |
| Badge notifikasi | `#ef4444` (3.76) | `#dc2626` | 4.83 |
| Tangga peringkat 2–3 | `#3b82f6`/`#93c5fd` (3.68/1.80) | `#2563eb`/`#bfdbfe`+teks `#1e3a8a` | 5.17/7.29 |

---

## 8b. Polling Chat

Sebelum ini pesan hanya dimuat **sekali** saat halaman/modal dibuka, sehingga
balasan baru terlihat hanya setelah reload manual — atau, di sisi RT, setelah
modal verifikasi ditutup dan dibuka ulang. Sekarang keduanya melakukan polling.

| Sisi | Kapan polling hidup | Interval | Berhenti saat |
|---|---|---|---|
| Warga (`WargaDashboard.jsx`) | selama ada `id_pengajuan` | 15 s | tab tidak terlihat (`visibilitychange`), atau 401/403/404 |
| RT (`RtDashboard.jsx`) | selama modal verifikasi terbuka | 15 s | modal ditutup, tab tidak terlihat, atau 401/403/404 |

Detail yang menentukan benar-tidaknya implementasi:

1. **Tidak menimpa pesan yang sedang dikirim.** Pesan yang baru diketik ada di
   state dengan `temp_id` dan belum ada di server. Polling mempertahankan entri
   ber-`temp_id` dan hanya mengganti sisanya dengan data server.
2. **Tidak render ulang kalau tidak berubah.** Perbandingan dilakukan per indeks
   pada `id_pesan`; bila sama dan tidak ada pesan lokal, state lama dikembalikan
   apa adanya sehingga daftar tidak berkedip dan posisi scroll tidak melompat.
   (Efek auto-scroll juga diubah dari `[pesanList]` ke `[pesanList.length]` supaya
   tidak menyeret layar setiap kali polling mengembalikan data identik.)
3. **Badge tidak berkedip.** Saat pengguna sedang di tab Diskusi, hasil polling
   yang masih "belum dibaca" langsung ditandai dibaca dan badge diset 0 — bukan
   dibiarkan muncul sesaat lalu hilang.
4. **Duplikat dihilangkan di sumbernya.** Setelah `POST /chat/{id}` sukses, klien
   mengambil ulang daftar dari server, bukan hanya menandai entri lokal sebagai
   `sent`. Sebelum perbaikan ini, pesan yang baru dikirim tetap membawa `temp_id`,
   sehingga polling berikutnya menampilkan **versi ganda** (satu dari server, satu
   dari state lokal). Guard menangkapnya: `pesan tidak terduplikasi setelah polling
   — muncul 1×`.

Bukti:

| Pemeriksaan | Hasil |
|---|---|
| `guard_chat_polling.mjs` | 8/8 PASS — pesan RT muncul **tanpa reload** dalam 14.8 s, URL tetap `/warga`, badge muncul lalu hilang, tanpa duplikat |
| `guard_chat_polling_rt.mjs` | 6/6 PASS — pesan warga muncul di modal dalam 14.5 s, modal tetap utuh, RT masih bisa mengirim, pesan tersimpan di server |
| `tests/Feature/ChatPollingTest.php` | 4 test / 18 assertion — `GET` tidak menandai terbaca, urutan pesan deterministik, pesan baru terlihat pada polling berikutnya, polling warga lain tetap 403 |

---

## 8c. Tailwind CDN Dihapus

Tiga dashboard (`RtDashboard`, `RwDashboard`, `AdminDashboard`) menyuntik
`https://cdn.tailwindcss.com?plugins=forms,container-queries` saat mount. Itu
berarti aplikasi menarik ~120 kB JavaScript **dan** menjalankan compiler Tailwind
di browser pengguna, hanya untuk menebak kelas mana yang dipakai.

Yang ditemukan setelah diperiksa: **CDN itu praktis tidak dipakai.**

| Pemeriksaan | Hasil |
|---|---|
| Token `className` unik di seluruh `src/` | 64 |
| Di antaranya kelas custom yang didefinisikan sendiri di `<style>` per halaman | 63 |
| Kelas utilitas Tailwind yang benar-benar dipakai | **1** — `select-none` |

Semua `rt-main`, `rw-header`, `ld-btn`, `card`, `inp`, `btn-blue`, `warna-tabs`,
dan seterusnya didefinisikan sebagai CSS biasa di blok `<style>` masing-masing
halaman. Tidak ada satu pun `flex`, `p-4`, `text-sm`, `gap-2`, atau kelas responsif
`md:` yang dipakai.

Perubahan:

1. Blok injeksi CDN dihapus dari `useDesign()` di ketiga dashboard.
2. `select-none` dipindahkan ke `src/index.css` sebagai aturan biasa
   (`user-select: none`), jadi satu-satunya ketergantungan Tailwind hilang.
3. `src/index.css` sudah di-import `main.jsx`, jadi berlaku di semua halaman.

Bukti:

| Pemeriksaan | Hasil |
|---|---|
| `guard_tanpa_tailwind_cdn.mjs` (baru) | 7/7 PASS — 0 permintaan ke CDN di landing/warga/rt/rw/admin, 0 kelas berpola utilitas Tailwind, `user-select: none` tetap berlaku |
| Guard visual lama | overflow 9 halaman/0, kontras 204 teks/0 gagal, kontras ranking 3/0, RT kanonik 8/0, pengaduan 4/0, chat 5/0 + 8/0 + 6/0 |
| Bundle CSS | 1,26 kB → **1,32 kB** gzip 0,63 → 0,65 kB (hanya `select-none`) |

Dua bug di guard itu sendiri yang ikut ditemukan dan diperbaiki saat menulisnya:

- Versi pertama memeriksa "kelas yang tidak punya aturan CSS" dan melaporkan 5
  halaman gagal — padahal `select-none` jelas berfungsi. Penyebabnya: di Chromium
  modern `CSSStyleRule` **juga** punya `.cssRules` (CSS Nesting), sehingga logika
  `r.cssRules ? [...] : [r]` melewati rule itu sendiri. Diperbaiki dengan memeriksa
  `selectorText` lebih dulu, lalu menelusuri `.cssRules` hanya bila ada isinya.
- Pendekatan "tidak punya aturan CSS" juga salah sasaran: `no-print` hanya ada di
  dalam `@media print`, dan `rt-sidebar-brand`/`rw-sidebar-brand`/
  `admin-sidebar-brand` memang kelas mati yang sudah ada sebelum perubahan ini.
  Guard sekarang memeriksa **pola kelas utilitas Tailwind**, yaitu hal yang benar-
  benar akan rusak bila CDN hilang.

---

## 8d. Google Fonts Di-host Sendiri

Sebelumnya font diambil runtime dari `fonts.googleapis.com` di **empat** tempat:

| Lokasi | Cara |
|---|---|
| `index.html` | dua `<link rel="stylesheet">` + dua `<link rel="preconnect">` |
| `LandingPage`, `Login`, `RegisterWarga`, `WargaDashboard` | `@import url(...)` di blok `<style>` |
| `useDesign()` di `Rt/Rw/AdminDashboard` | injeksi `<link>` lewat `document.createElement` saat mount |

Selain itu `index.html` meminta **Material Symbols versi penuh**: 4.026.236 byte
(4 MB) untuk ~3.500 ikon, padahal aplikasi ini memakai 64 ikon. Dan `Inter`
diminta padahal hanya dipakai satu baris di `DiagnosaKoneksi.jsx`.

### Perubahan

1. Ketiga berkas font diunduh sekali ke `bansos-frontend/public/fonts/`:

   | Berkas | Ukuran | Isi |
   |---|---:|---|
   | `plus-jakarta-sans-latin.woff2` | 27 KB | variable font, weight 200–800 |
   | `plus-jakarta-sans-latin-ext.woff2` | 21 KB | nama dengan diakritik |
   | `material-symbols-subset.woff2` | 66 KB | 64 ikon yang dipakai |

2. `src/fonts.css` baru memuat semua `@font-face` + definisi
   `.material-symbols-outlined`, di-import dari `main.jsx`. Berlaku di semua
   halaman, termasuk yang dulu punya `@import` sendiri.
3. Semua injeksi runtime dan `@import` dihapus; `index.html` bersih dari
   `preconnect` dan `<link>` Google.
4. `Inter` dihapus (tidak lagi diminta) dan satu pemakaiannya di
   `DiagnosaKoneksi.jsx` dialihkan ke Plus Jakarta Sans.

**Total font turun dari 4 MB + 2 × CSS Google menjadi 114 KB dari origin sendiri.**

### Bukti

| Pemeriksaan | Hasil |
|---|---|
| `guard_font_self_hosted.mjs` (baru) | 18/18 PASS — 0 permintaan ke Google di 5 halaman, kedua font `status: loaded`, glyph ikon 24 px (bukan teks melebar) |
| Uji negatif (font sengaja dipotong 2 KB) | **13 kegagalan** — ikon dilaporkan sebagai teks sampai 128 px. Guard terbukti bisa gagal, bukan hijau palsu. |
| Guard visual lama (10 skrip) | overflow 9/0, kontras 222 teks/0, ranking 3/0, RT kanonik 8/0, Tailwind 7/0, pengaduan 4/0, chat 5/0 + 8/0 + 6/0 |
| `php artisan test` | 136 passed (3031 assertions) |
| `npx vite build` | sukses, CSS 2,48 kB (gzip 1,06 kB) |

### Tiga bug di guard yang ikut ditemukan

Menulis guard ini memunculkan tiga kesalahan berturut-turut, masing-masing
dilaporkan sebagai "produk rusak" padahal guard-nya yang salah:

1. **Daftar ikon tidak lengkap.** Versi pertama hanya mengumpulkan `name="…"`,
   padahal ikon juga dipakai lewat `icon: '…'` di array menu. Guard langsung
   menangkap akibatnya: `dashboard` selebar 162 px, `manage_accounts` 270 px —
   teks, bukan ikon. Daftar dikumpulkan ulang dari tiga pola → 64 ikon.
2. **Font dimuat lazy.** `document.fonts` melaporkan `unloaded` kalau tidak ada
   teks yang memakainya, sehingga pengukuran jatuh ke font fallback. Guard kini
   memanggil `document.fonts.load()` eksplisit sebelum mengukur.
3. **Probe tanpa font-size.** Beberapa halaman meng-override
   `.material-symbols-outlined` jadi 20 px, sehingga probe mewarisi ukuran lain
   dan perbandingan lebar tidak bermakna. Probe kini menetapkan `font-size: 24px`
   dan pembanding memakai rasio lebar/font-size, bukan ambang px tetap.

---

## 8e. Migrasi ke Database Live (2026-11-26)

Tujuh migrasi baru dijalankan ke `db_bansos_saw` (MariaDB 10.4.32). Prosedurnya
sengaja berurutan dan setiap langkah diverifikasi sebelum lanjut.

### Persiapan

| Langkah | Hasil |
|---|---|
| Backup penuh (`mysqldump --single-transaction --routines --triggers`) | `docs/archive/db_bansos_saw_backup_20261126_010427.sql`, 108.562 byte, 8 tabel berisi data |
| Dry-check duplikat `(id_pengajuan, id_kriteria)` | **0 baris** — unique constraint migrasi 000003 aman |
| Prekondisi lain | `dibaca_pada` belum ada, `pengajuan_status_index` belum ada, `warga.password` masih ada |
| Isi `warga.password` | 95 baris, semua terisi — kolom mati (auth memakai tabel `users`), ter-backup |

### Eksekusi

`php artisan migrate --force` → 7 migrasi, semua `DONE` dalam < 0,5 s:

```
2026_11_25_000001_create_pengajuan_riwayat_table ......... 250.73ms DONE
2026_11_25_000002_warga_password_nullable ................. 95.69ms DONE
2026_11_25_000003_add_unique_penilaian_pengajuan_kriteria . 56.82ms DONE
2026_11_25_000004_create_pengaduan_tables ................ 449.58ms DONE
2026_11_25_000005_drop_warga_password_column .............. 43.86ms DONE
2026_11_25_000006_add_dibaca_pada_to_pesan_chat ........... 77.73ms DONE
2026_11_25_000007_add_status_index_to_pengajuan_table ..... 31.26ms DONE
```

### Verifikasi pasca-migrasi

| Pemeriksaan | Hasil |
|---|---|
| Jumlah baris data | warga **95**, pengajuan **94**, penilaian **940**, users **6** — **tidak berubah** |
| Tabel baru | `pengaduan`, `pengaduan_riwayat`, `pengajuan_riwayat` ada, FK benar (`ON DELETE CASCADE` / `SET NULL`) |
| Index baru | `penilaian_pengajuan_kriteria_unique`, `pengajuan_status_index`, `pesan_chat_belum_dibaca_index` |
| `warga.password` | kolom hilang |
| `GET /api/saw/hitung` | **90 warga diranking**, skor 0,575–0,950, **31 nilai unik** — tidak ada gejala fallback massal |
| Sebaran RT | 001: 35, 002: 27, 003: 28 |
| `GET /api/saw/report/export?format=csv` | 200, 1.458 byte, header `Nama Warga;RT;Skor;Ranking;Ranking RT;Keterangan` |
| `GET /api/pengaduan` (RT) | 200 |
| Isolasi chat | `GET /chat/31` (milik RT 001) → 200; `GET /chat/10` (milik RT 003) → **403** |
| `php artisan test` | 136 passed (3031 assertions) |

### Rollback diuji, bukan diasumsikan

Di salinan SQLite terpisah (bukan live): `migrate` penuh lalu
`migrate:rollback --step=7`. Hasil: ketiga tabel baru hilang, `pesan_chat.dibaca_pada`
hilang, dan `warga.password` **kembali** — artinya `down()` benar-benar bekerja dan
migrasi ini reversibel.

### Temuan data yang BUKAN akibat migrasi

`GET /api/saw/hitung` melaporkan 4 warga dilewati dengan alasan *"nama warga kosong"*,
dan 3 kriteria tanpa variasi. Setelah diperiksa di database:

| id_warga | nama_lengkap | rt | alamat | pengajuan | status | jawaban_mentah |
|---|---|---|---|---|---|---|
| 92–95 | (kosong) | `000` | (kosong) | #91–#94 | `disetujui` | **NULL** |

Ini **data sampah yang sudah ada sebelumnya** — migrasi hanya mengubah struktur, tidak
pernah menyentuh baris `warga`/`pengajuan`. Empat baris ini tidak punya nama, RT, alamat,
maupun jawaban kuesioner, tetapi berstatus `disetujui` dan punya 10 baris `penilaian`
masing-masing.

**Tidak dihapus.** Penghapusan data pengguna berada di luar mandat, dan
`RE_AUDIT_BANSOS_HUB_REPORT.md` mencatat "Rekonsiliasi 94 data live (menunggu
verifikasi RT)". Perlu keputusan pemilik data. Untuk membersihkan (setelah disetujui):

```sql
-- dry-run dulu: lihat apa yang akan hilang
SELECT p.id_pengajuan, p.id_warga, p.status
FROM pengajuan p JOIN warga w ON w.id_warga = p.id_warga
WHERE TRIM(COALESCE(w.nama_lengkap,'')) = '' AND p.jawaban_mentah IS NULL;
```

Dampak saat ini: ranking tetap benar untuk 90 warga sah; 4 baris itu hanya muncul di
daftar `dilewati[]` yang sekarang terlihat di UI, bukan disembunyikan.

### Temuan kedua: `warga01` tidak punya pengajuan di live

Guard UAT chat gagal dengan *"tidak ada pengajuan untuk warga01"*. Setelah diperiksa:

| Fakta | Nilai |
|---|---|
| `users.warga01` → `id_warga` | **1** (Budi Santoso, RT 001) |
| Pengajuan pertama di live | `id_pengajuan 1` → **`id_warga 2`** |
| Warga sah yang punya pengajuan | 90 |
| Warga sah **tanpa** pengajuan | **1** — tepatnya warga #1 / `warga01` |

Artinya data live **bukan** salinan seed demo: pengajuan dimulai dari `id_warga 2`,
sementara akun demo menunjuk `id_warga 1`. Akun `warga01` satu-satunya warga sah yang
belum pernah mengisi kuesioner.

Ini bukan efek migrasi. Perbaikan dilakukan di sisi guard: ketiga guard chat sekarang
**melewati** (exit 0) dengan pesan eksplisit alih-alih gagal, karena prasyaratnya adalah
data seed demo, bukan kondisi produk:

```
LEWATI  prasyarat tidak terpenuhi: akun warga01 tidak punya pengajuan di database ini
        (guard ini butuh data seed demo; jalankan terhadap DB uji, bukan live)
RINGKAS: 0 pemeriksaan, 0 gagal, 1 dilewati (prasyarat)
```

Chat tetap **dibuktikan bekerja di live** lewat API langsung dengan akun RT (yang punya
akses ke 35 pengajuan RT 001): `POST /chat/31` → pesan tersimpan, `GET /chat/31` →
1 pesan, `GET /chat/31/belum-dibaca` → `jumlah:0` (pesan sendiri tidak dihitung),
`PUT /chat/31/baca` → sukses. Pesan uji kemudian dihapus sehingga `pesan_chat` kembali
0 baris.

### Tindak lanjut: kuesioner `warga01` diisi (keputusan pemilik data)

Atas permintaan pemilik data, akun demo dilengkapi — **bukan** dengan `INSERT` manual,
tetapi melalui alur aplikasi yang sesungguhnya agar matriks dibangun `PenilaianAssembler`:

| Langkah | Hasil |
|---|---|
| `POST /api/warga/pengajuan` sebagai `warga01` | `success: true`, pengajuan **#95** dibuat, status `menunggu` |
| `PUT /api/admin/pengajuan/95/status` sebagai `rt001` | `success: true`, status → `disetujui` |
| Matriks penilaian | **10 baris** terbentuk (940 → 950) |
| `jawaban_mentah` | tersimpan, 230 byte |

Jawaban yang diisi (kategori paling rentan, agar berbeda dari mayoritas):
`1 KK` · `4 Orang` · `SMP` · `1 Orang` · `400 - 700 Ribu` · `400 - 700 Ribu` ·
`Magersari / Pakai Gratis` · `Sumur Milik Tetangga` · `Listrik 450 watt` ·
`Jalan Kaki / Sepeda / Motor Seadanya`.

Dampak terukur:

| Sebelum | Sesudah |
|---|---|
| 90 warga diranking | **91** |
| `kriteria_tanpa_variasi`: 3 kriteria | **0** (kosong) |
| 3 guard chat: dilewati (prasyarat) | **5/5 + 8/8 + 6/6 PASS** |

Budi Santoso: skor `0,641667`, ranking global 85, ranking RT 35 — masuk akal untuk
profil paling rentan, dan menandakan matriksnya benar-benar berbeda dari warga lain
(bukan fallback ke skor seragam).

Pesan uji yang dibuat guard selama verifikasi (6 baris) dihapus; `pesan_chat` kembali
0 baris.

---

## 9. Status Item Terbuka

Daftar ini eksplisit supaya tidak ada klaim "selesai" yang berlebihan. Butir yang
sudah ditutup **tetap dicantumkan** dengan tanda `[SELESAI]` beserta buktinya, agar
pembaca bisa melacak apa yang berubah dan kapan — bukan supaya terlihat penuh.

### 9a. Bug baru yang ditemukan saat menulis test jurnal

**RT `"0"` menghasilkan HTTP 500, bukan 422.** `RtFormatter::rule()` memakai pola
`^[0-9]{1,3}$` yang meloloskan `"0"`, lalu `formatRt()` melempar
`InvalidArgumentException` dan controller menangkapnya sebagai error umum → 500.
Ditemukan saat menulis test "registrasi RT tidak sah" (P2-10), bukan dari audit.
Diperbaiki: pola menjadi `^(?!0+$)[0-9]{1,3}$` sehingga `"0"`, `"00"`, `"000"`
ditolak di lapisan validasi (422). Dijaga
`RtFormatterTest::test_rule_menolak_nol_sehingga_tidak_jadi_500`.

### 9b. Daftar butir

1. **Frontend pengaduan (P2-01) — [SELESAI 2026-11-25].** Panel
   `src/components/PengaduanPanel.jsx` dipasang di keempat dashboard: warga
   mengirim & memantau miliknya, RT menindaklanjuti wilayahnya, RW/admin melihat
   semua dan dapat mengambil alih. Test backend bertambah 5 → 11 (isolasi
   wilayah, status valid, isi kosong, akun tanpa identitas, riwayat lengkap).
   Dijaga `docs/uat/guard_pengaduan.mjs` (4 peran, termasuk uji isolasi RT).
2. **Kontras WCAG halaman ranking — [SELESAI 2026-11-25].** Guard repo hanya
   menguji Beranda. Audit tambahan menemukan: Admin 96 teks gagal (tombol "Hitung
   Ulang" `#059669` + putih = 3.77 vs 4.5; header tabel `#64748b`/`#F0F6FF` = 4.38),
   RW 3 gagal (2.49–2.56), RT 37 gagal. Semua sudah diperbaiki; sapuan lanjutan
   seluruh menu Admin/RT/RW menunjukkan 0 gagal. Dijaga oleh
   `docs/uat/guard_kontras_ranking.mjs`.
3. **Force password change (P1-07).** Seeder sudah idempoten dan
   didokumentasikan dev-only; paksaan ganti password belum ada.
4. **Restorasi 29 test case jurnal (P2-10) — [SELESAI 2026-11-25].**
   `tests/Feature/JurnalKelompokTest.php` memetakan delapan kelompok jurnal ke
   pengujian API nyata (26 test). Tiga kelompok yang dulu hilang — terutama cetak
   laporan — kini punya test: isi CSV, scope peran, dan struktur activity log.
   Penutupan ini juga menemukan bug nyata: RT `"0"` menghasilkan **500**, bukan
   422 (lihat §9a).
5. **Konsolidasi dua API user & dua jalur kuesioner (P3-29).**
6. **Dead code P3-28 — [SELESAI sebagian].** `cekStatus` dan `Penilaian::kriteria`
   dihapus; `PesanChat` sekarang benar-benar dipakai `ChatController` (status baca).
   `src/lib/api.js` dipertahankan karena masih diimpor `App.jsx` dan
   `LandingPage.jsx` sebagai shim re-export — menghapusnya berarti menyentuh
   import di dua berkas hanya demi kerapian, tanpa manfaat fungsional.
7. **Rate limit import/SAW/chat — [SELESAI 2026-11-25].** `AppServiceProvider`
   mendaftarkan limiter `saw` (60/menit), `import` (10/menit), `chat` (30/menit),
   per pengguna. `P3HygieneTest` membuktikan panggilan ke-61 pada `/saw/hitung`
   dan ke-31 pada `POST /chat` dibalas 429, dan pesan yang ditolak tidak tersimpan.
8. **Dependency audit (P3-33) — [SELESAI 2026-11-25].** `composer audit` menemukan
   53 advisory pada 12 paket (1 critical, 15 high) — termasuk **Laravel TokenGuard
   auth bypass** dan CRLF injection di rule `email`, yang langsung relevan karena
   sistem ini memakai token auth. `npm audit` menemukan 17 advisory (12 high),
   termasuk axios dan react-router-dom yang dipakai runtime. Semua ditutup dengan
   `composer update --with-dependencies` dan `npm audit fix` — **tanpa mengubah
   `composer.json`/`package.json`** (tidak ada major bump). Sesudahnya: 0 advisory
   di kedua sisi. Lihat §8a.
9. **Index `pengajuan.status` — [SELESAI].** Migrasi `2026_11_25_000007`. Satu-satunya
   query yang memindai seluruh tabel `pengajuan` adalah filter
   `status = 'disetujui'` di `SawCalculator::ambilDataEligible()`. Diverifikasi:
   index terbentuk di SQLite, `migrate:rollback --step=2` menghapusnya bersih, dan
   `migrate` ulang mengembalikannya.
8. **Rekonsiliasi 94 data live.** Butuh verifikasi RT secara manual — sengaja
   tidak diotomasi.
9. **Pemindahan Tailwind CDN → bundle Vite** untuk dashboard Admin/RT/RW.
10. **Menjalankan migrasi baru ke MySQL live.** Belum, dan harus setelah
    dry-check duplikat di §7.

---

## 10. Catatan Metodologis (bukan bug)

Dipisahkan sesuai brief §14. Poin-poin ini melemahkan klaim paper, bukan kode.

1. Bobot 10 % sama rata tidak pernah divalidasi (tidak ada AHP, tidak ada
   sensitivity analysis).
2. Tidak ada validasi akurasi terhadap data lapangan — ranking belum pernah
   dibandingkan dengan daftar penerima riil.
3. Worked example hanya 3 alternatif; normalisasi max/min sangat sensitif pada n.
4. Contoh di jurnal tidak konsisten secara internal (MISMATCH-02): Tabel 2→3
   menghasilkan 0.858, bukan 0.892 yang dicetak.
5. Tidak ada pengujian keamanan, performa, maupun usability.
6. Skala ordinal (2.5/5/7.5/10) diperlakukan sebagai interval.
7. Tabel 1 jurnal misaligned di PDF hasil ekstraksi.
8. Lingkup satu RW, 90 rumah tangga, 3 RT — tidak bisa digeneralisasi.

**Koreksi terhadap audit:** `RE_AUDIT` menyebut derivasi Tabel 4.4 jurnal
menghasilkan 0.800/0.608/0.596. Setelah dihitung ulang dari matriks Tabel 4.3
dengan formula jurnal sendiri, hasilnya 0.892/0.683/0.725 — sama persis dengan
engine. Rincian di `docs/SAW_JOURNAL_RECONCILIATION.md`.

---

## 11. Cara Mereproduksi

```bash
# Backend — suite penuh
cd bansos-backend && php artisan test
# → 136 passed (3031 assertions)

# Frontend
cd bansos-frontend && npx eslint src --max-warnings=0 && npx vite build

# UAT guard (butuh playwright-core; lihat docs/uat/README.md)
cd docs/uat
CHROME_PATH="<path chrome>" node guard_overflow_mobile.mjs
CHROME_PATH="<path chrome>" node guard_kontras_wcag.mjs
CHROME_PATH="<path chrome>" node guard_kontras_ranking.mjs
CHROME_PATH="<path chrome>" node guard_pengaduan.mjs
CHROME_PATH="<path chrome>" node guard_rt_kanonik.mjs
```

---

## 8a. Dependency Audit (P3-33)

Dijalankan dengan `composer audit` dan `npm audit` pada 2026-11-25.

### Backend — 53 advisory pada 12 paket → **0**

| Paket | Sebelum | Sesudah | Catatan |
|---|---|---|---|
| `laravel/framework` | v12.58.0 (1 critical, 2 high, 2 medium, 2 low) | **v12.74.0** | critical: *TokenGuard authentication bypass through non-string API credentials* — langsung relevan, sistem ini memakai token auth. Juga CRLF injection di rule `email`. |
| `laravel/sanctum` | v4.3.1 | **v4.5.0** | — |
| `league/commonmark` | 2.8.2 (9 high) | **2.10.8** | seluruhnya DoS/XSS di parser Markdown; tidak dipakai untuk input pengguna, tapi tetap ditutup |
| `guzzlehttp/guzzle` | 7.10.0 (1 high, 8 medium) | **7.17.0** | host-check bypass |
| `guzzlehttp/psr7` | 2.9.0 | **2.13.6** | — |
| `symfony/http-foundation` | v7.4.8 (1 high) | **v7.4.24** | ReDoS di `HeaderUtils::split` |
| `symfony/http-kernel` | v7.4.8 (1 high) | **v7.4.24** | — |
| `symfony/mime` | v7.4.8 (1 high) | **v7.4.24** | CRLF/SMTP command injection |
| `symfony/routing` | v7.4.8 | **v7.4.24** | — |
| `symfony/yaml` | v7.4.8 (1 high) | **v7.4.24** | — |

Perintah: `composer update --with-dependencies`. **`composer.json` tidak diubah** —
semua versi baru masih di dalam constraint yang ada (`^12.0`, `^4.0`, `^8.2`), jadi
tidak ada major bump dan tidak ada perubahan kode aplikasi.

### Frontend — 17 advisory (12 high) → **0**

| Paket | Sebelum | Sesudah | Catatan |
|---|---|---|---|
| `axios` | 1.15.2 (24 advisory) | **1.21.1** | dipakai runtime di seluruh dashboard |
| `react-router-dom` / `react-router` | 7.14.2 (8 advisory) | **7.18.7** | dipakai runtime (routing & `useNavigate`) |
| `vite` | 8.0.10 (7 advisory) | **8.3.8** | termasuk RCE lewat `launch-editor` di Windows |
| `postcss` | 8.5.22 | **8.5.33** | path traversal |
| `nanoid`, `form-data`, `follow-redirects`, `brace-expansion`, `minimatch`, `browserslist`, `zod`, `source-map-js`, `@babel/core` | versi terdampak | ter-update | — |

Perintah: `npm audit fix`. **`package.json` tidak diubah** — semua tetap memakai
caret range yang sama; hanya `package-lock.json` yang bergerak.

### Verifikasi sesudah upgrade

| Pemeriksaan | Hasil |
|---|---|
| `php artisan test` | **132 passed (3013 assertions)** |
| `npx eslint src --max-warnings=0` | bersih |
| `npx vite build` | sukses (524 kB / gzip 143 kB) |
| `composer audit` | **0 advisory** |
| `npm audit` | **0 vulnerabilities** |
| 6 guard UAT (overflow, kontras ×2, RT kanonik, chat, pengaduan) | semua hijau |

---

## 12. Verdict

Sistem ini sekarang **layak dipakai sebagai artefak portofolio dan demo teknis**,
dan **jauh lebih aman** daripada titik awal: tidak ada lagi auto-approve massal,
tidak ada kebocoran lintas RT, tidak ada sel CSV yang salah-petakan diam-diam,
dan setiap angka yang tampil di layar bisa ditelusuri ke satu jalur perhitungan.

Sistem ini **belum layak dipakai untuk memilih penerima bantuan riil** sebelum:
migrasi dijalankan dengan aman, frontend pengaduan selesai, kredensial default
dicabut, dan ranking divalidasi terhadap data lapangan.
