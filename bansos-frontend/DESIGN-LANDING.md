# DESIGN-LANDING.md — BansosHub landing page

Dokumen ini mencatat keputusan visual halaman publik `/` dan alasannya. Ditulis
setelah halaman jadi, dari hasil yang benar-benar dibangun, bukan sebelum. Kalau
halaman berubah, dokumen ini ikut berubah; kalau keduanya berbeda, yang benar
adalah kodenya.

Halaman ini hanya menyentuh `/`. Dashboard RT/RW/Admin tidak berubah: seluruh
gaya baru hidup di `src/landing/landing.css` dengan awalan `.ld-`, bukan di
`index.css`. Satu-satunya tambahan global adalah dua `@font-face` Bricolage di
`src/fonts.css`.

## Dua baris: apa ini dan untuk siapa

Halaman pendaftaran bansos untuk warga RW 08, Depok. Pembacanya warga biasa,
sebagian besar tidak akrab dengan aplikasi, sering membuka dari HP dengan sinyal
seadanya. Sasarannya satu tindakan: daftar. Mode permukaan: **Persuade**.

- Dial: **ENERGY 3 / RHYTHM 3 / MOTION 2**.
- Alasan tiap angka: poster warga yang berani (3), tiap bagian punya komposisi
  berbeda dan bukan deretan kartu yang sama (3), gerak sinematik tapi berhenti
  sebelum mengganggu keterbacaan (2). MOTION bukan 3 karena pembacanya bukan
  pengguna yang mengejar efek, dan HP kelas bawah tidak boleh dipaksa.

## Palet: tiga warna inti + satu aksen

| Peran | Nilai | Kenapa |
|---|---|---|
| Tinta | `#071322` | Teks utama di atas kertas. Nyaris hitam kebiruan, senada dengan langit hero. |
| Kertas | `#f2ece1` | Dasar bagian isi. Krem hangat, bukan putih: putih murni di bawah matahari HP terbaca menyilaukan. |
| Malam | `#0a1a2e` | Dasar hero, rail langkah, dan footer. Warna yang sama dengan langit fajar paling gelap, jadi hero menyatu dengan halaman, bukan ditempel. |
| Aksen | `#ffb52e` | Satu-satunya aksen. Kuning lampu jalan. Dipakai untuk aksi utama dan penanda posisi, tidak untuk dekorasi. |

Aksen tidak dipakai untuk nomor urut kriteria di atas kertas: kontrasnya hanya
sekitar 2:1 di sana dan nomornya jadi tidak terbaca. Nomor urut memakai tinta,
aksen tetap memegang perannya sebagai penanda bagian.

## Huruf: satu display, satu teks

- **Bricolage Grotesque** untuk display. Ketebalannya bisa dipakai sebagai
  poster, dan bentuknya tidak termasuk deret yang selalu keluar untuk "terlihat
  dirancang" (Inter, Geist, Space Grotesk, DM Sans). Hanya subset latin + latin-ext,
  di-host sendiri di `public/fonts/`.
- **Plus Jakarta Sans** untuk teks isi, karena sudah dipakai seluruh aplikasi.
  Warga yang pindah dari dashboard ke halaman ini tidak perlu mengenali huruf baru.

Tidak ada huruf ketiga. Huruf mono tidak dipakai sebagai kostum "teknis".

## Hero: tiga bidang yang bergerak sendiri-sendiri

Hero adalah satu ilustrasi yang dipisah menjadi tiga bidang: langit + ridge,
deretan rumah, dan dedaunan depan. Ketiganya bergeser dengan laju berbeda
(2.2 / 1.1 / −0.45) sementara teks berjalan 1x.

- **Kenapa ilustrasi, bukan foto.** Tidak ada foto asli kampung RW 08 yang boleh
  dipakai, dan gambar yang dihasilkan model lalu dipajang sebagai "potret warga"
  adalah klaim palsu. Ilustrasi jelas terbaca sebagai gambar, bukan sebagai bukti.
- **Kenapa atap seng, bukan genteng.** Genteng terbaca Mediterania. Yang
  membuat sebuah adegan terbaca "kampung" adalah atap seng bergelombang, tiang
  kayu, warung dengan teralis naik, jemuran, pot, dan motor terparkir.
- **Kenapa bidangnya berlapis.** Satu gambar datar yang memudar saat di-scroll
  adalah efek, bukan kedalaman. Tiga bidang dengan selisih laju kecil terbaca
  sebagai jarak sebelum terbaca sebagai animasi.
- **Selisih laju sengaja kecil.** Selisih besar berhenti terbaca sebagai
  kedalaman dan mulai terbaca sebagai gambar yang bergeser sendiri.
- **Tidak memakai transform untuk memusatkan bidang.** Mesin menulis
  `transform` inline untuk parallax; `translateX(-50%)` di kelas akan hilang
  begitu scroll bergerak. Pemusatan dilakukan dengan inset + `object-fit`, dan
  tinggi bidang diberi kelonggaran supaya pergeseran tidak membuka celah.

Kontras teks hero diukur dari piksel hasil render, bukan diperkirakan:

| Elemen | Kontras | Minimum | Hasil |
|---|---|---|---|
| Judul (H1) | 8.84:1 | 4.5:1 | lolos |
| Eyebrow | 7.95:1 | 4.5:1 | lolos |
| Paragraf pembuka | 10.14:1 | 4.5:1 | lolos |
| Catatan kecil | 6.17:1 | 4.5:1 | lolos |
| Di HP 360px: H1 / lede / note | 8.58 / 9.05 / 6.50 | 4.5:1 | lolos |

## Bagian isi

Urutannya mengikuti apa yang warga perlu tahu, bukan urutan template:

1. **Sepuluh kriteria** — daftar bernomor dengan garis rambut, bukan kartu.
   Sepuluh kartu identik adalah bentuk paling malas untuk daftar.
2. **Tiga langkah** — rail horizontal. Di sini scroll vertikal menggerakkan isi
   ke samping karena tiga langkah adalah rangkaian, bukan hierarki. Satu-satunya
   bagian halaman yang bergerak ke arah selain ke atas.
3. **Syarat** — dua kolom teks, tanpa kartu.
4. **FAQ** — `<details>` asli, jadi Escape dan keyboard sudah benar tanpa JS.
5. **Penutup** — satu blok aksen penuh dengan satu tindakan.

Yang sengaja **tidak** ada: kicker/eyebrow di atas setiap judul bagian, nomor
bagian 01/02/03, "how it works" tiga kartu berikon bulat, baris logo "dipercaya
oleh", testimoni, dan angka statistik. Tidak ada datanya, jadi tidak
ditampilkan. Eyebrow hanya muncul sekali di hero, dan itu nama wilayah, bukan
label kategori yang mengulang judul.

## Penanda posisi di rail langkah

Rail tanpa penanda terbaca sebagai teks yang terpotong, bukan sebagai urutan.
Karena itu ada tiga hal:

- penghitung `01 / 03` di kanan atas, diperbarui dari kartu yang paling dekat ke
  tengah viewport;
- tiga garis penanda di bawah rail, menyala mengikuti langkah yang sama;
- kabut tipis di tepi kanan supaya kartu berikutnya terlihat masih ada.

Penghitung dan penanda dibaca dari satu sumber (indeks kartu aktif), jadi
keduanya tidak bisa saling bertentangan. Pemetaan `floor(p * 3)` pernah dipakai
dan salah: kartu ketiga sudah dominan sebelum p mencapai 2/3.

Satu kartu selebar satu layar. Dengan kartu lebih sempit, rail hanya sedikit
lebih panjang dari viewport, kartu ketiga tidak pernah sampai ke tengah, dan
penghitung berhenti di "02".

## Gerak

- Parallax hero: tiga bidang, laju berbeda, hanya `transform`.
- Reveal bagian kertas: `IntersectionObserver`, satu kali, 620ms, jarak 18px.
  Bukan fade-up di setiap elemen.
- Rail langkah: digerakkan mesin dari progres act.
- `prefers-reduced-motion`: semua reveal langsung terlihat, parallax berhenti,
  rail tetap bisa digeser jari karena transform rail adalah navigasinya, bukan
  hiasan. Diverifikasi: dengan reduced-motion aktif, seluruh elemen
  `[data-sc-cue]` dan `[data-ld-reveal]` tetap `opacity: 1`.

## Permukaan browser

Seleksi teks, caret, cincin fokus, dan angka tabular ikut diwarnai dari palet.
Ini langkah termurah yang membedakan halaman yang dibangun dari halaman yang
dirangkai, dan paling sering dilewatkan.

## Aksesibilitas yang diverifikasi

- Tidak ada overflow horizontal di 360px (`scrollWidth === innerWidth`).
- Semua tombol ≥44px (`.ld-btn` 48px, `.ld-btn--sm` 44px).
- Fokus keyboard terlihat di semua kontrol; urutan tab mengikuti urutan visual.
- FAQ bisa dibuka/tutup dengan Enter dan Escape (perilaku `<details>` bawaan).
- FAQ diuji: klik membuka (`open: false → true`).

## Berkas

| Berkas | Isi |
|---|---|
| `src/pages/LandingPage.jsx` | Halaman, data, dan tiga efek (scroll state, reveal, penghitung langkah) |
| `src/landing/landing.css` | Seluruh gaya halaman, diawali `.ld-page` |
| `src/landing/Icons.jsx` | Enam ikon yang digambar sendiri, satu ketebalan garis |
| `src/landing/useScrollCraft.js` | Pemasangan dan pelepasan mesin scroll |
| `public/sc/scrollcraft.js` | Mesin scroll (MIT, nateherkai/scroll-craft) |
| `public/sc/hero-*.svg` | Tiga bidang ilustrasi hero |
| `public/fonts/bricolage-*.woff2` | Huruf display |

## Kalau nanti mengubah halaman ini

1. Periksa ulang kontras dari piksel hasil render, jangan dari nilai hex.
2. Ukur ulang di 360px: `scrollWidth` harus sama dengan `innerWidth`.
3. Kalau menambah bagian, pastikan komposisinya berbeda dari bagian sebelahnya.
   Deretan bagian dengan pola sama adalah tanda template, bukan desain.
4. Jangan menambah aksen kedua.
5. Kalau ada angka baru, pastikan sumbernya nyata. Kalau tidak ada, tidak usah
   ditampilkan.
