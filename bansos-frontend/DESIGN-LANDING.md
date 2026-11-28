# DESIGN-LANDING.md — BansosHub landing page

Dokumen ini mencatat keputusan visual halaman publik `/` dan alasannya. Ditulis
setelah halaman jadi, dari hasil yang benar-benar dibangun dan diukur, bukan
sebelum. Kalau halaman berubah, dokumen ini ikut berubah; kalau keduanya
berbeda, yang benar adalah kodenya.

Halaman ini hanya menyentuh `/`. Dashboard RT/RW/Admin tidak berubah: seluruh
gaya hidup di `src/landing/landing.css` dengan awalan `.ld-page`/`.ld-`, bukan di
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

## Palet: putih + biru, sama dengan dashboard

Palet ini **bukan pilihan estetis bebas**. Dashboard RT/RW/Admin sudah putih dan
biru; landing yang emas + biru malam membuat satu aplikasi terlihat seperti dua
produk berbeda, dan warga yang pindah dari landing ke dashboard merasa sedang
membuka situs lain.

| Peran | Nilai | Kenapa |
|---|---|---|
| Tinta | `#0f172a` | Teks utama. Warna yang sama dengan teks dashboard. |
| Kertas | `#ffffff` | Dasar bagian isi. Putih bersih, sama dengan kartu dashboard. |
| Permukaan | `#f0f6ff` | Dasar hero, rail langkah, dan footer. Biru sangat muda, warna latar dashboard. |
| Aksen | `#0b3fa8` | Satu-satunya aksen. Biru aksi dashboard. Dipakai untuk tombol utama, judul yang ditekankan, dan penanda posisi. Teks di atasnya putih. |

Tiga aturan yang mengikuti dari palet ini:

- **Aksen tidak dipakai untuk nomor urut kriteria.** Biru di atas putih hanya
  mencapai sekitar 4.0:1 pada ukuran teks kecil; nomor urut memakai tinta.
- **Tidak ada warna hangat.** Glow krem-kuning pada versi pertama dihapus
  seluruhnya. Di tengah sistem putih-biru, kuning terbaca sebagai warna asing.
  Diukur dari render: 0 piksel kekuningan.
- **Tirai tidak boleh menutupi artwork.** Di tema terang, scrim putih pekat
  menghapus ilustrasi sampai jadi noda (terukur: std 4 di area yang seharusnya
  bergambar). Scrim sekarang hanya pekat di kolom teks lalu hilang sebelum
  tengah layar.

## Huruf: satu display, satu teks

- **Bricolage Grotesque** untuk display. Ketebalannya bisa dipakai sebagai
  poster, dan bentuknya tidak termasuk deret yang selalu keluar untuk "terlihat
  dirancang" (Inter, Geist, Space Grotesk, DM Sans). Subset latin + latin-ext,
  di-host sendiri di `public/fonts/`.
- **Plus Jakarta Sans** untuk teks isi, karena sudah dipakai seluruh aplikasi.

Tidak ada huruf ketiga. Huruf mono tidak dipakai sebagai kostum "teknis".

## Skala dan satuan: `1rem = 14px`

`index.css` mengatur `:root { font: 14px }`. Artinya **1rem = 14px, bukan 16px**.
Ini pernah membuat semua perhitungan lebar dan jarak meleset, dan gejalanya
menyesatkan: nilai CSS terlihat benar tetapi hasil terukurnya berbeda. Setiap
perhitungan berbasis rem di halaman ini harus memakai 14.

Tinggi judul hero: `clamp(2.5rem, 1.4rem + 5.4vw, 5.4rem)`.

## Hero: ilusi pagi, tiga bidang

Hero adalah satu ilustrasi yang dipisah menjadi tiga bidang: langit + ridge,
deretan rumah, dan dedaunan depan. Ketiganya bergeser dengan laju berbeda
(2.2 / 1.1 / −0.45) sementara teks berjalan 1x. Versi siang dipakai karena
halaman ini putih; versi malam tidak mungkin ditempel di atas putih.

- **Kenapa ilustrasi, bukan foto.** Tidak ada foto asli kampung RW 08 yang boleh
  dipakai, dan gambar buatan model yang dipajang sebagai "potret warga" adalah
  klaim palsu. Ilustrasi jelas terbaca sebagai gambar, bukan sebagai bukti.
- **Kenapa atap seng, bukan genteng.** Genteng terbaca Mediterania. Yang
  membuat adegan terbaca "kampung" adalah atap seng bergelombang, tiang kayu,
  warung dengan teralis naik, jemuran, pot, motor terparkir, dan musholla dengan
  menara berkubah (bukan berspira, karena spira terbaca sebagai salib).
- **Kenapa bidangnya berlapis.** Satu gambar datar yang memudar saat di-scroll
  adalah efek, bukan kedalaman. Tiga bidang dengan selisih laju kecil terbaca
  sebagai jarak sebelum terbaca sebagai animasi.
- **Tidak memakai transform untuk memusatkan bidang.** Mesin menulis
  `transform` inline untuk parallax; `translateX(-50%)` di kelas hilang begitu
  scroll bergerak. Pemusatan memakai inset + `object-fit`.
- **Hero tidak dipaksa setinggi layar.** `min-height: 100svh` + `align-items:
  flex-end` menaruh seluruh teks di dasar dan menyisakan 306px ruang kosong di
  layar 900px. Sekarang `min-height: min(600px, 78svh)` dan hero mengalir
  setinggi isinya. Terukur: ruang navigasi-ke-eyebrow 306px → 43px.

Kontras teks hero diukur dari piksel hasil render (bukan dari nilai hex):

| Elemen | Kontras | Minimum | Hasil |
|---|---|---|---|
| Judul (H1) | 17.39:1 | 3:1 (teks besar) | lolos |
| Eyebrow | 8.90:1 | 4.5:1 | lolos |
| Paragraf pembuka | 6.55:1 | 4.5:1 | lolos |
| Catatan kecil | 10.57:1 | 4.5:1 | lolos |

Metode ukur: latar = persentil 92 luminansi wilayah teks, glyph = persentil 2.
Persentil rendah menangkap anti-aliasing dan membuat hasil tampak lebih buruk
dari kenyataan; memakai persentil 2 mengukur inti glyph.

## Jarak: `gap` pada induk, bukan `margin-top` pada anak

`reset` halaman ini memakai `.ld-page :is(h1, h2, h3, p, ol, ul, figure) { margin: 0 }`.
Karena `:is()` membawa kekhususan elemen, aturan itu **menang** atas
`.ld-hero__lede { margin-top: ... }`. Gejalanya: judul dan paragraf saling
menempel dengan jarak 0 meski CSS terlihat benar.

Karena itu setiap jarak di halaman ini ditulis salah satu dari dua cara:

- **`display: flex; gap` pada induk** (`.ld-hero__copy`, `.ld-head`, `.ld-list`).
- **`.ld-page .nama-kelas { margin-top }`** kalau harus margin, supaya
  kekhususannya di atas reset.

Jarak vertikal yang dipakai sekarang (terukur di 1440×900):

| Antara | Jarak |
|---|---|
| Navigasi → eyebrow | 43px |
| Eyebrow → judul | 16px |
| Judul → paragraf | 18px |
| Paragraf → tombol | 27px |
| Tombol → catatan | 18px |
| Catatan → akhir hero | 35px |
| Hero → judul bagian | 63px |
| Judul bagian → isinya | 130px |

Aturan umumnya: jarak antarbagian lebih besar daripada jarak di dalam bagian.
Versi sebelumnya memakai 116px untuk keduanya, jadi halaman terbaca longgar tanpa
hierarki dan tinggi dokumen 5347px; sekarang 4304px.

## Bagian isi

Urutannya mengikuti apa yang warga perlu tahu, bukan urutan template:

1. **Sepuluh kriteria** — daftar bernomor dengan garis rambut, bukan kartu.
   Sepuluh kartu identik adalah bentuk paling malas untuk daftar.
2. **Tiga langkah** — rail horizontal. Scroll vertikal menggerakkan isi ke
   samping karena tiga langkah adalah rangkaian, bukan hierarki. Satu-satunya
   bagian halaman yang bergerak ke arah selain ke atas.
3. **Syarat** — dua kolom teks, tanpa kartu.
4. **FAQ** — `<details>` asli, jadi Escape dan keyboard sudah benar tanpa JS.
5. **Penutup** — satu blok aksen penuh dengan satu tindakan.

Yang sengaja **tidak** ada: kicker/eyebrow di atas setiap judul bagian, nomor
bagian 01/02/03, "how it works" tiga kartu berikon bulat, baris logo "dipercaya
oleh", testimoni, dan angka statistik. Tidak ada datanya, jadi tidak
ditampilkan.

## Rail langkah: kenapa tiga kartu harus muat berdampingan

Ini bagian paling banyak salah hitung, jadi aturannya ditulis eksplisit.

Mesin menggeser rail sejauh `travel = scrollWidth − viewport`, dikali progres
act. Artinya **satu-satunya cara membuat ketiga kartu berhenti di tengah** adalah
membuat pusat kartu ke-n bergeser tepat satu kali jarak antar-pusat, dan travel
harus sama dengan dua kali jarak itu (`2 × (lebar kartu + gap)`).

Kalau jarak antar-pusat lebih besar dari lebar viewport, tidak ada nilai travel
yang bisa memenuhi itu: kartu kedua sudah keluar layar sebelum kartu ketiga
sampai. Karena itu **lebar kartu 34rem = 476px** (dengan 1rem = 14px), gap 31px,
tiga kartu + dua gap = 1546px di viewport 1440px.

Tiga hal yang membuat ini bekerja, dan ketiganya wajib:

1. **`padding-inline` rail = `(100vw − lebar kartu) / 2`**, supaya kartu pertama
   sudah di tengah saat act dimulai. Dengan padding selebar gutter, kartu pertama
   mulai di x=70 dan tidak pernah mencapai tengah berapa pun travel-nya.
2. **Elemen `.ld-pan__tail` selebar `2 × (kartu + gap)` dikurangi padding kanan.**
   Flexbox mengabaikan `padding-right` saat menghitung `scrollWidth`, jadi travel
   tidak bisa ditambah lewat padding; harus elemen nyata.
3. **`data-sc-pan="0"`.** Nilai ini menambah travel (`over × (1 + attr)`); dengan
   geometri di atas, travel yang dibutuhkan sudah pas, jadi tidak perlu tambahan.

Hasil terukur: kartu 1 di 720, kartu 2 di 720, kartu 3 di 720 (tengah viewport
1440 = 720), di p = 0, 0.5, dan 1.

### Penanda posisi

Rail tanpa penanda terbaca sebagai teks terpotong, bukan urutan. Tiga penanda:

- penghitung `01 / 03` di kanan atas, dihitung dari **kartu yang paling dekat ke
  tengah viewport**, bukan dari `floor(p × 3)`. Pemetaan itu pernah dipakai dan
  meleset: kartu ketiga sudah dominan sebelum p mencapai 2/3.
- tiga garis penanda, lebar sama (304px masing-masing), menyala mengikuti
  langkah yang sama. Dibaca dari indeks yang sama dengan penghitung, jadi
  keduanya tidak bisa bertentangan.
- kabut di **kedua tepi**. Kartu tetangga memang terlihat, tapi teksnya tidak
  boleh terpotong mentah di pinggir layar; itu terbaca sebagai halaman rusak.
  Kabut memudarkan kedua sisi sampai warna latar.

## Gerak

- Parallax hero: tiga bidang, laju berbeda, hanya `transform`.
- Reveal bagian kertas: `IntersectionObserver`, satu kali, 620ms, jarak 18px.
  Bukan fade-up di setiap elemen.
- Rail langkah: digerakkan mesin dari progres act.
- `prefers-reduced-motion`: semua reveal langsung terlihat, parallax berhenti,
  rail tetap bisa digeser jari karena transform rail adalah navigasinya, bukan
  hiasan. Diverifikasi: seluruh `[data-sc-cue]` dan `[data-ld-reveal]` tetap
  `opacity: 1`.

## Kepala halaman

Logo: kotak biru 38×38 dengan ikon rumah bergaris putih, lalu kata "BansosHub"
dan sub-judul wilayah. Ikon digambar sendiri dengan satu ketebalan garis, bukan
dari pustaka ikon.

**Dua tombol selalu ada, termasuk di HP:** Masuk (putih, tepi biru penuh) dan
Daftar (biru penuh). Versi sebelumnya menyembunyikan tombol Masuk di bawah 620px,
jadi warga yang sudah punya akun tidak punya jalan masuk dari halaman ini. Di
360px keduanya masih 44px dan tidak ada overflow (terukur: `scrollWidth` 360 =
`innerWidth` 360, jarak logo ke tombol 87px).

Tepi tombol sekunder memakai biru aksen penuh: biru muda gagal ambang kontras
non-teks 3:1 terhadap putih, sehingga tombolnya nyaris tidak terbaca sebagai
tombol.

## Permukaan browser

Seleksi teks, caret, cincin fokus, dan angka tabular ikut diwarnai dari palet.
Ini langkah termurah yang membedakan halaman yang dibangun dari halaman yang
dirangkai, dan paling sering dilewatkan.

## Aksesibilitas yang diverifikasi

- Tidak ada overflow horizontal di 360px (`scrollWidth === innerWidth`).
- Semua tombol ≥44px (`.ld-btn` 48px, `.ld-btn--sm` dan tombol nav 44px).
- Fokus keyboard terlihat di semua kontrol; urutan tab mengikuti urutan visual.
- FAQ bisa dibuka/tutup dengan Enter dan Escape (perilaku `<details>` bawaan).
- Teks hero lolos WCAG AA diukur dari piksel: 17.39 / 8.90 / 6.55 / 10.57.
- Tombol utama di HP berada di 703px, di atas lipatan 740px.

## Berkas

| Berkas | Isi |
|---|---|
| `src/pages/LandingPage.jsx` | Halaman, data, dan tiga efek (scroll state, reveal, penghitung langkah) |
| `src/landing/landing.css` | Seluruh gaya halaman, diawali `.ld-page` |
| `src/landing/Icons.jsx` | Enam ikon yang digambar sendiri, satu ketebalan garis |
| `src/landing/useScrollCraft.js` | Pemasangan dan pelepasan mesin scroll |
| `public/sc/scrollcraft.js` | Mesin scroll (MIT, nateherkai/scroll-craft) |
| `public/sc/hero-back-day.svg` | Langit, ridge, siluet atap jauh |
| `public/sc/hero-mid-day.svg` | Rumah, warung, musholla, motor, tiang listrik |
| `public/sc/hero-front-day.svg` | Dedaunan depan |
| `public/fonts/bricolage-*.woff2` | Huruf display |

## Kalau nanti mengubah halaman ini

1. Periksa ulang kontras dari piksel hasil render, jangan dari nilai hex. Ambil
   latar = persentil 92, glyph = persentil 2.
2. Ukur ulang di 360px: `scrollWidth` harus sama dengan `innerWidth`, kedua
   tombol nav harus tinggi ≥44px.
3. Kalau menambah bagian, pastikan komposisinya berbeda dari bagian sebelahnya.
   Deretan bagian dengan pola sama adalah tanda template, bukan desain.
4. Jangan menambah aksen kedua, dan jangan menambah warna hangat.
5. Kalau ada angka baru, pastikan sumbernya nyata. Kalau tidak ada, tidak usah
   ditampilkan.
6. Kalau menyentuh jarak: ingat `1rem = 14px`, dan `margin-top` pada kelas biasa
   kalah oleh reset. Pakai `gap` pada induk atau selektor `.ld-page .kelas`.
7. Kalau menyentuh rail langkah: hitung ulang `2 × (lebar kartu + gap)` dan
   pastikan sama dengan `scrollWidth − viewport`. Jangan menebak nilainya,
   ukur `rail.scrollWidth − innerWidth` lalu sesuaikan `.ld-pan__tail`.
