import { Navigate, useNavigate } from 'react-router-dom';
import { getUser } from '../lib/api';

/* ─── Design Bootstrap ────────────────────────────────────────────────────
   Halaman publik untuk warga RW 08. Pembaca utamanya warga yang kurang akrab
   dengan gadget, jadi hierarki dibuat tegas: teks besar, warna kuat, jarak
   lega. Isi halaman memakai data nyata dari aplikasi (10 kriteria dari tabel
   `kriteria`, alur dari menu dashboard); tidak ada angka atau testimoni karangan.
   ──────────────────────────────────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #0f172a; -webkit-font-smoothing: antialiased; }
  .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-style: normal; display: inline-block; line-height: 1; text-transform: none; letter-spacing: normal; white-space: nowrap; }

  /* #root adalah flex column, jadi setiap section WAJIB width:100%.
     Tanpa itu section menyusut selebar isinya (terukur di 1440px: hero 968px,
     kriteria 1100px, FAQ 446px) dan halaman tampak miring. */
  .ld-page { width: 100%; display: block; }
  .ld-wrap { width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 24px; }

  .ld-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; padding: 12px 22px; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; cursor: pointer; transition: background .15s, border-color .15s, color .15s; text-decoration: none; border: 1.5px solid transparent; }
  .ld-btn-primary { background: #0b3fa8; color: #fff; border-color: #0b3fa8; }
  .ld-btn-primary:hover { background: #062b6e; border-color: #062b6e; }
  .ld-btn-light { background: #fff; color: #0b3fa8; border-color: #a9c7f0; }
  .ld-btn-light:hover { background: #EBF3FF; }
  .ld-btn:focus-visible { outline: 3px solid #0b3fa8; outline-offset: 2px; }

  /* ── Navigasi ── */
  .ld-nav { width: 100%; position: sticky; top: 0; z-index: 50; background: #fff; border-bottom: 1px solid #DBEAFE; }
  .ld-nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; }
  .ld-brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
  .ld-brand-icon { width: 40px; height: 40px; border-radius: 10px; background: #0b3fa8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ld-brand-name { font-size: 15.5px; font-weight: 800; letter-spacing: -.3px; color: #0f172a; }
  .ld-brand-sub { font-size: 10.5px; font-weight: 600; color: #334155; }
  .ld-nav-actions { display: flex; gap: 10px; flex-shrink: 0; }

  /* ── Hero ── */
  .ld-hero { width: 100%; border-bottom: 1px solid #DBEAFE; }
  .ld-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) 392px; gap: 48px; align-items: start; padding: 56px 0 60px; }
  .ld-h1 { font-size: 42px; line-height: 1.14; letter-spacing: -.9px; font-weight: 800; color: #0f172a; }
  .ld-h1 mark { background: none; color: #0b3fa8; }
  .ld-lead { font-size: 16px; line-height: 1.75; color: #334155; margin-top: 18px; max-width: 52ch; }
  .ld-hero-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
  .ld-note { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; line-height: 1.6; color: #334155; margin-top: 16px; }

  /* Kotak alur: satu-satunya penanda posisi di halaman publik. Pengganti panel
     gradien dekoratif, karena "saya ada di langkah mana" memang pertanyaan nyata. */
  .ld-status { background: #F0F6FF; border: 1.5px solid #a9c7f0; border-left: 5px solid #0b3fa8; border-radius: 12px; padding: 22px; }
  .ld-status h2 { font-size: 12.5px; text-transform: uppercase; letter-spacing: .07em; color: #0b3fa8; font-weight: 800; margin-bottom: 14px; }
  .ld-status ol { list-style: none; display: flex; flex-direction: column; gap: 14px; }
  .ld-status li { display: flex; gap: 11px; align-items: flex-start; font-size: 13.5px; line-height: 1.55; color: #0f172a; }
  .ld-status .n { flex: 0 0 auto; width: 24px; height: 24px; border-radius: 7px; background: #0b3fa8; color: #fff; font-size: 11.5px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .ld-status .t { font-weight: 700; }
  .ld-status-foot { margin-top: 16px; padding-top: 14px; border-top: 1px solid #cfe0f7; font-size: 12px; line-height: 1.65; color: #334155; }

  /* ── Section umum ── */
  .ld-section { width: 100%; padding: 60px 0 0; }
  .ld-label { font-size: 12px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; color: #0b3fa8; margin-bottom: 9px; }
  .ld-h2 { font-size: 27px; font-weight: 800; letter-spacing: -.4px; color: #0f172a; }
  .ld-sub { font-size: 14.5px; line-height: 1.7; color: #334155; margin-top: 9px; max-width: 68ch; }

  /* ── Kriteria ── */
  .ld-krit { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 36px; margin-top: 26px; }
  .ld-krit-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #DBEAFE; }
  .ld-krit-no { flex: 0 0 auto; width: 26px; height: 26px; border-radius: 7px; background: #EBF3FF; color: #0b3fa8; font-size: 11.5px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .ld-krit-name { flex: 1 1 auto; font-size: 13.5px; font-weight: 600; color: #0f172a; line-height: 1.4; min-width: 0; }
  .ld-tipe { flex: 0 0 auto; font-size: 10.5px; font-weight: 800; letter-spacing: .04em; padding: 3px 8px; border-radius: 5px; }
  .ld-tipe-benefit { background: #dcfce7; color: #166534; }
  .ld-tipe-cost { background: #E0E7FF; color: #3730A3; }
  .ld-krit-note { display: flex; gap: 10px; align-items: flex-start; margin-top: 22px; padding: 15px 17px; background: #F0F6FF; border: 1px solid #a9c7f0; border-radius: 10px; font-size: 13px; line-height: 1.7; color: #0f172a; }

  /* ── Alur langkah ── */
  .ld-alur { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 26px; border: 1px solid #DBEAFE; border-radius: 14px; overflow: hidden; background: #fff; }
  .ld-alur-step { padding: 26px 22px; border-right: 1px solid #DBEAFE; }
  .ld-alur-step:last-child { border-right: none; }
  .ld-alur-no { font-size: 11px; font-weight: 800; letter-spacing: .1em; color: #0b3fa8; margin-bottom: 11px; }
  .ld-alur-t { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 7px; line-height: 1.35; }
  .ld-alur-d { font-size: 13px; line-height: 1.7; color: #334155; }

  /* ── Syarat ── */
  .ld-syarat { width: 100%; background: #F0F6FF; border-top: 1px solid #DBEAFE; border-bottom: 1px solid #DBEAFE; padding: 44px 0; margin-top: 60px; }
  .ld-syarat-grid { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 32px; align-items: center; }
  .ld-syarat ul { list-style: none; display: flex; flex-direction: column; gap: 11px; margin-top: 16px; }
  .ld-syarat li { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; line-height: 1.65; color: #0f172a; }
  .ld-syarat li .material-symbols-outlined { color: #166534; flex: 0 0 auto; margin-top: 1px; }

  /* ── FAQ ── */
  .ld-faq-list { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; max-width: 820px; }
  .ld-faq { background: #fff; border: 1px solid #DBEAFE; border-radius: 12px; }
  .ld-faq summary { cursor: pointer; list-style: none; display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 14.5px; color: #0f172a; padding: 16px 18px; min-height: 44px; }
  .ld-faq summary::-webkit-details-marker { display: none; }
  .ld-faq summary:focus-visible { outline: 3px solid #0b3fa8; outline-offset: -2px; border-radius: 12px; }
  /* Rotasi dipasang di pembungkus, bukan di span ikon: span ikon sudah punya
     inline style dan inline style mengalahkan aturan kelas. */
  .ld-chev { display: inline-flex; flex-shrink: 0; margin-left: auto; transition: transform .18s ease; color: #0b3fa8; }
  .ld-faq[open] summary .ld-chev { transform: rotate(180deg); }
  .ld-faq-body { padding: 0 18px 17px; font-size: 13.5px; line-height: 1.75; color: #334155; }

  /* ── Footer ── */
  .ld-footer { width: 100%; background: #062b6e; padding: 38px 0; margin-top: 60px; }
  .ld-footer-inner { display: flex; justify-content: space-between; align-items: flex-start; gap: 26px; flex-wrap: wrap; }
  .ld-footer-brand { font-size: 15px; font-weight: 800; letter-spacing: -.2px; color: #fff; }
  .ld-footer-text { font-size: 12.5px; line-height: 1.75; color: #BFDBFE; margin-top: 7px; max-width: 48ch; }
  .ld-footer-link { display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 10px 18px; border-radius: 9px; border: 1.5px solid rgba(255,255,255,.6); color: #fff; background: transparent; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; font-weight: 700; cursor: pointer; }
  .ld-footer-link:hover { background: rgba(255,255,255,.14); border-color: #fff; }
  .ld-footer-link:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }

  /* ── Mobile ── */
  @media (max-width: 900px) {
    .ld-wrap { padding: 0 18px; }
    .ld-hero-grid { grid-template-columns: 1fr; gap: 30px; padding: 36px 0 40px; }
    .ld-h1 { font-size: 30px; letter-spacing: -.5px; }
    .ld-lead { font-size: 15px; }
    .ld-krit { grid-template-columns: 1fr; gap: 0; }
    .ld-alur { grid-template-columns: 1fr; }
    .ld-alur-step { border-right: none; border-bottom: 1px solid #DBEAFE; padding: 20px 18px; }
    .ld-alur-step:last-child { border-bottom: none; }
    .ld-syarat-grid { grid-template-columns: 1fr; }
    .ld-syarat-grid .ld-btn { width: 100%; }
    .ld-h2 { font-size: 23px; }
    .ld-section { padding: 44px 0 0; }
    .ld-syarat { margin-top: 44px; padding: 32px 0; }
    .ld-footer { margin-top: 44px; padding: 28px 0; }
    .ld-footer-inner { flex-direction: column; }
  }
  @media (max-width: 560px) {
    .ld-nav-inner { padding: 10px 0; gap: 8px; }
    .ld-brand-sub { display: none; }
    .ld-nav-actions { gap: 6px; }
    .ld-nav-actions .material-symbols-outlined { display: none; }
    .ld-nav-actions .ld-btn { padding: 9px 13px; font-size: 13.5px; min-height: 44px; }
    .ld-h1 { font-size: 26px; }
    .ld-hero-cta { gap: 10px; }
    .ld-hero-cta .ld-btn { width: 100%; }
    .ld-status { padding: 18px; }
    .ld-krit-row { gap: 10px; }
    .ld-krit-name { font-size: 13px; }
  }
`;

/* ─── Icon ──────────────────────────────────────────────────────────────── */
const MI = ({ name, fill = false, size = 20, className, style: s = {} }) => (
  <span
    className={className ? `material-symbols-outlined ${className}` : 'material-symbols-outlined'}
    style={{
      fontSize: size,
      fontVariationSettings: fill
        ? "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24"
        : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
      lineHeight: 1,
      ...s,
    }}
  >
    {name}
  </span>
);

/* Sepuluh kriteria asli dari tabel `kriteria` (bobot masing-masing 10%).
   `tipe` menentukan arah penilaian SAW, jadi labelnya ditampilkan apa adanya. */
const KRITERIA = [
  { nama: 'Jumlah KK dalam satu rumah', tipe: 'benefit' },
  { nama: 'Jumlah anggota keluarga dalam satu rumah', tipe: 'benefit' },
  { nama: 'Pendidikan kepala keluarga', tipe: 'cost' },
  { nama: 'Jumlah anggota keluarga masih sekolah', tipe: 'benefit' },
  { nama: 'Pengeluaran satu jiwa per bulan', tipe: 'cost' },
  { nama: 'Penghasilan satu jiwa per bulan', tipe: 'cost' },
  { nama: 'Status kepemilikan rumah', tipe: 'cost' },
  { nama: 'Sumber air bersih', tipe: 'cost' },
  { nama: 'Penerangan rumah', tipe: 'cost' },
  { nama: 'Transportasi yang digunakan', tipe: 'cost' },
];

const ALUR = [
  {
    t: 'Daftar dan isi data diri',
    d: 'Nama, alamat, dan RT sesuai KTP. Pendaftaran gratis dan bisa dibantu Ketua RT kalau kesulitan memakai HP.',
  },
  {
    t: 'Jawab 10 pertanyaan',
    d: 'Soal kondisi rumah tangga sehari-hari: jumlah anggota keluarga, pendidikan, penghasilan, pengeluaran, rumah, air, listrik, dan transportasi.',
  },
  {
    t: 'Ketua RT memeriksa',
    d: 'RT memverifikasi jawaban Anda di wilayahnya. Setelah disetujui, sistem menghitung prioritas dengan metode SAW.',
  },
];

const FAQS = [
  {
    q: 'Apakah data saya aman?',
    a: 'Data hanya dipakai untuk penilaian bantuan sosial. Yang bisa melihat hanya petugas berwenang di wilayah Anda: Ketua RT, Ketua RW, dan Admin.',
  },
  {
    q: 'Berapa lama prosesnya?',
    a: 'Setelah kuesioner dikirim, Ketua RT memverifikasi. Anda bisa memantau statusnya kapan saja dari akun Anda tanpa perlu bertanya berulang kali.',
  },
  {
    q: 'Saya butuh bantuan mengisi form, bagaimana?',
    a: 'Hubungi Ketua RT di wilayah Anda. Petugas bisa membantu pendaftaran dan pengisian kuesioner.',
  },
  {
    q: 'Bagaimana kalau lupa kata sandi?',
    a: 'Minta bantuan Ketua RT. Beliau dapat mengatur ulang kata sandi akun Anda.',
  },
  {
    q: 'Apakah saya harus punya HP sendiri?',
    a: 'Tidak wajib. Kalau tidak punya HP atau kesulitan memakainya, Ketua RT bisa menginput data Anda langsung dari dashboard RT.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const user = getUser();

  /* Sudah login? Langsung ke dashboard sesuai peran. */
  if (user) {
    const routes = { admin: '/dashboard', rt: '/rt', rw: '/rw', warga: '/warga' };
    return <Navigate to={routes[user.role] || '/warga'} replace />;
  }

  const goLogin = () => navigate('/login');
  const goRegister = () => navigate('/register');

  return (
    <div className="ld-page">
      <style>{CSS}</style>

      {/* ── NAV ── */}
      <header className="ld-nav no-print">
        <div className="ld-wrap">
          <div className="ld-nav-inner">
            <div className="ld-brand">
              <div className="ld-brand-icon">
                <MI name="hub" fill size={21} style={{ color: '#fff' }} />
              </div>
              <div>
                <div className="ld-brand-name">
                  BANSOS<span style={{ color: '#0b3fa8' }}>HUB</span>
                </div>
                <div className="ld-brand-sub">Portal Bantuan Sosial RW 08</div>
              </div>
            </div>

            <div className="ld-nav-actions">
              <button className="ld-btn ld-btn-light" onClick={goLogin}>
                <MI name="login" size={16} /> Masuk
              </button>
              <button className="ld-btn ld-btn-primary" onClick={goRegister}>
                <MI name="person_add" size={16} /> Daftar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO: teks kiri, kotak alur kanan ── */}
      <section className="ld-hero">
        <div className="ld-wrap">
          <div className="ld-hero-grid">
            <div>
              <h1 className="ld-h1">
                Daftar bantuan sosial
                <br />
                tanpa bolak-balik ke <mark>Ketua RT</mark>
              </h1>
              <p className="ld-lead">
                Warga RW 08 mengisi kuesioner sendiri dari HP. Sistem menghitung prioritas dengan
                sepuluh kriteria yang sama untuk semua orang, lalu Anda bisa memantau hasilnya
                kapan saja.
              </p>
              <div className="ld-hero-cta">
                <button className="ld-btn ld-btn-primary" onClick={goRegister}>
                  <MI name="person_add" size={17} /> Daftar sebagai warga baru
                </button>
                <button className="ld-btn ld-btn-light" onClick={goLogin}>
                  Saya sudah punya akun
                </button>
              </div>
              <p className="ld-note">
                <MI name="info" size={15} style={{ color: '#0b3fa8', flexShrink: 0, marginTop: 1 }} />
                Pendaftaran gratis. Kalau kesulitan memakai HP, Ketua RT bisa membantu mengisi.
              </p>
            </div>

            <aside className="ld-status">
              <h2>Alur pendaftaran</h2>
              <ol>
                {ALUR.map((a, i) => (
                  <li key={a.t}>
                    <span className="n">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="t">{a.t}</span>
                      <br />
                      {a.d}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="ld-status-foot">
                Sudah pernah mendaftar dan ingin melihat status? Masuk dengan akun Anda, status
                pengajuan tampil di halaman utama.
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── KRITERIA: isi nyata dari tabel kriteria ── */}
      <section className="ld-section">
        <div className="ld-wrap">
          <div className="ld-label">Yang dinilai</div>
          <h2 className="ld-h2">Sepuluh kriteria, bobot sama</h2>
          <p className="ld-sub">
            Setiap warga dinilai dengan kriteria yang sama. Tidak ada penilaian berdasarkan kesan
            petugas, dan tidak ada yang bisa mengubah bobot untuk satu orang saja.
          </p>

          <div className="ld-krit">
            {KRITERIA.map((k, i) => (
              <div className="ld-krit-row" key={k.nama}>
                <span className="ld-krit-no">{String(i + 1).padStart(2, '0')}</span>
                <span className="ld-krit-name">{k.nama}</span>
                <span className={k.tipe === 'benefit' ? 'ld-tipe ld-tipe-benefit' : 'ld-tipe ld-tipe-cost'}>
                  {k.tipe === 'benefit' ? 'BENEFIT' : 'COST'}
                </span>
              </div>
            ))}
          </div>

          <div className="ld-krit-note">
            <MI name="fact_check" size={18} style={{ color: '#0b3fa8', flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Benefit</strong> berarti makin besar nilainya makin diprioritaskan, misalnya
              jumlah anggota keluarga. <strong>Cost</strong> berarti makin kecil nilainya makin
              diprioritaskan, misalnya penghasilan. Perhitungannya memakai metode SAW.
            </span>
          </div>
        </div>
      </section>

      {/* ── ALUR ── */}
      <section className="ld-section">
        <div className="ld-wrap">
          <div className="ld-label">Setelah mendaftar</div>
          <h2 className="ld-h2">Tiga langkah sampai hasil keluar</h2>
          <div className="ld-alur">
            {ALUR.map((a, i) => (
              <div className="ld-alur-step" key={a.t}>
                <div className="ld-alur-no">LANGKAH {String(i + 1).padStart(2, '0')}</div>
                <div className="ld-alur-t">{a.t}</div>
                <div className="ld-alur-d">{a.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SYARAT ── */}
      <section className="ld-syarat">
        <div className="ld-wrap">
          <div className="ld-syarat-grid">
            <div>
              <h2 className="ld-h2">Siapa yang bisa mendaftar</h2>
              <ul>
                <li>
                  <MI name="check_circle" fill size={17} />
                  Berdomisili di wilayah RW 08, Depok.
                </li>
                <li>
                  <MI name="check_circle" fill size={17} />
                  Belum punya akun di BansosHub.
                </li>
                <li>
                  <MI name="check_circle" fill size={17} />
                  Mengisi data sesuai KTP dan kondisi rumah tangga sebenarnya.
                </li>
              </ul>
            </div>
            <button className="ld-btn ld-btn-primary" onClick={goRegister}>
              <MI name="person_add" size={17} /> Mulai daftar sekarang
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="ld-section">
        <div className="ld-wrap">
          <div className="ld-label">Pertanyaan umum</div>
          <h2 className="ld-h2">Hal yang sering ditanyakan warga</h2>
          <div className="ld-faq-list">
            {FAQS.map((f) => (
              <details key={f.q} className="ld-faq">
                <summary>
                  <span>{f.q}</span>
                  <span className="ld-chev">
                    <MI name="expand_more" size={19} />
                  </span>
                </summary>
                <div className="ld-faq-body">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ld-footer">
        <div className="ld-wrap">
          <div className="ld-footer-inner">
            <div>
              <div className="ld-footer-brand">BansosHub · RW 08, Depok</div>
              <div className="ld-footer-text">
                Sistem pendukung keputusan penerima bantuan sosial dengan metode Simple Additive
                Weighting. Dikelola bersama oleh Ketua RT, Ketua RW, dan Admin wilayah.
              </div>
            </div>
            <button className="ld-footer-link" onClick={goLogin}>
              <MI name="login" size={16} /> Masuk ke akun Anda
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
