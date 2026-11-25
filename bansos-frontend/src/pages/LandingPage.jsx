import { Navigate, useNavigate } from 'react-router-dom';
import { getUser } from '../lib/api';

/* ─── Design Bootstrap (sama seperti halaman lain di proyek ini) ─────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { font-family: 'Plus Jakarta Sans', sans-serif; background: #F0F6FF; color: #0f172a; -webkit-font-smoothing: antialiased; }
  .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-style: normal; display: inline-block; line-height: 1; text-transform: none; letter-spacing: normal; white-space: nowrap; }

  .ld-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 11px 22px; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: .15s; text-decoration: none; }
  .ld-btn-primary { background: #1A56DB; color: #fff; border: 1.5px solid #1A56DB; }
  .ld-btn-primary:hover { background: #1649C4; border-color: #1649C4; }
  .ld-btn-ghost { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,.55); }
  .ld-btn-ghost:hover { background: rgba(255,255,255,.1); border-color: #fff; }
  .ld-btn-light { background: #fff; color: #1A56DB; border: 1.5px solid #C6DCFF; }
  .ld-btn-light:hover { background: #EBF3FF; }

  .ld-faq summary { cursor: pointer; list-style: none; display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14.5px; color: #0f172a; padding: 14px 16px; }
  .ld-faq summary::-webkit-details-marker { display: none; }
  .ld-faq[open] summary .mi-chev { transform: rotate(180deg); }
  .ld-faq .mi-chev { transition: transform .18s ease; color: #1A56DB; flex-shrink: 0; }
  .ld-faq-body { padding: 0 16px 16px; font-size: 13.5px; line-height: 1.7; color: #526078; }
  @keyframes ldFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 900px) {
    .ld-hero { grid-template-columns: 1fr !important; }
    .ld-hero-side { min-height: 0 !important; padding: 26px 24px !important; }
    .ld-steps { grid-template-columns: 1fr !important; }
    .ld-feats { grid-template-columns: 1fr !important; }
    .ld-nav { padding: 12px 16px !important; gap: 8px !important; }
    .ld-container { padding-left: 18px !important; padding-right: 18px !important; }
  }
`;

/* ─── Icon ──────────────────────────────────────────────────────────────── */
const MI = ({ name, fill = false, size = 20, style: s = {} }) => (
  <span
    className="material-symbols-outlined"
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

const FAQS = [
  {
    q: 'Apakah data saya aman?',
    a: 'Data hanya dipakai untuk penilaian bantuan sosial dan hanya bisa dilihat oleh petugas yang berwenang (Ketua RT, Ketua RW, dan Admin).',
  },
  {
    q: 'Berapa lama prosesnya?',
    a: 'Setelah kuesioner dikirim, Ketua RT akan memverifikasi. Anda bisa memantau perkembangannya kapan saja lewat tab Status di akun Anda.',
  },
  {
    q: 'Saya butuh bantuan mengisi form, bagaimana?',
    a: 'Hubungi Ketua RT di wilayah Anda. Petugas dapat membantu Anda mendaftar dan mengisi kuesioner.',
  },
  {
    q: 'Bagaimana jika lupa kata sandi?',
    a: 'Minta bantuan Ketua RT — beliau dapat mengatur ulang kata sandi Anda.',
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
    <>
      <style>{CSS}</style>

      {/* ── NAV ── */}
      <header
        className="ld-nav no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(255,255,255,.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #DBEAFE',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg,#1A56DB 0%,#1e40af 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MI name="hub" fill size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-.3px' }}>
                BANSOS<span style={{ color: '#1A56DB' }}>HUB</span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#526078',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                }}
              >
                Portal Bantuan Sosial RW 08
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ld-btn ld-btn-light" onClick={goLogin} style={{ padding: '9px 18px' }}>
              <MI name="login" size={16} /> Masuk
            </button>
            <button className="ld-btn ld-btn-primary" onClick={goRegister} style={{ padding: '9px 18px' }}>
              <MI name="person_add" size={16} /> Daftar
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        className="ld-hero"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          maxWidth: 1100,
          margin: '0 auto',
          padding: '48px 24px 0',
        }}
      >
        <div style={{ animation: 'ldFadeUp .35s ease' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12,
              fontWeight: 700,
              color: '#1A56DB',
              background: '#EBF3FF',
              border: '1px solid #C6DCFF',
              padding: '6px 12px',
              borderRadius: 999,
              marginBottom: 18,
            }}
          >
            <MI name="verified_user" size={15} fill /> Bantuan Sosial, Tepat Sasaran
          </span>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.18,
              letterSpacing: '-.6px',
              marginBottom: 16,
            }}
          >
            Pendaftaran Bansos
            <br />
            Kini Lebih Mudah &amp; Transparan
          </h1>
          <p style={{ fontSize: 15.5, color: '#526078', lineHeight: 1.75, marginBottom: 26, maxWidth: 520 }}>
            Warga RW 08 bisa mendaftar lewat HP, mengisi 10 pertanyaan sederhana, lalu memantau
            sendiri hasil penilaiannya — tanpa harus berulang kali bertanya ke Ketua RT.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="ld-btn ld-btn-primary" onClick={goRegister}>
              <MI name="person_add" size={17} /> Daftar sebagai Warga Baru
            </button>
            <button className="ld-btn ld-btn-light" onClick={goLogin}>
              Saya sudah punya akun
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#526078', marginTop: 14 }}>
            Butuh bantuan? Hubungi Ketua RT di wilayah Anda.
          </p>
        </div>

        {/* Panel biru ringkas */}
        <div
          className="ld-hero-side"
          style={{
            background: 'linear-gradient(155deg, #0C2D6B 0%, #1A56DB 60%, #3B82F6 100%)',
            borderRadius: 18,
            padding: '32px 30px',
            minHeight: 280,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.12)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
            <MI name="how_to_reg" size={18} fill /> Alur Pendaftaran
          </div>
          {[
            { step: '01', title: 'Lengkapi Data Diri', desc: 'Nama, alamat, dan RT sesuai KTP.' },
            { step: '02', title: 'Isi Kuesioner', desc: '10 pertanyaan sederhana tentang kondisi rumah tangga.' },
            { step: '03', title: 'Verifikasi & Hasil', desc: 'Ketua RT memeriksa, sistem menghitung, hasil bisa dipantau.' },
          ].map((s) => (
            <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16, position: 'relative' }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: '#D6E9FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#1e40af',
                }}
              >
                {s.step}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MANFAAT ── */}
      <section className="ld-container" style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 24px 8px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Kenapa lewat BansosHub?</h2>
        <p style={{ fontSize: 14, color: '#526078', marginBottom: 24 }}>Sistem yang dipakai petugas di wilayah Anda.</p>
        <div className="ld-feats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { icon: 'fact_check', color: '#1d4ed8', bg: '#dbeafe', t: 'Penilaian Objektif', d: '10 kriteria terukur — penghasilan, pengeluaran, rumah, dan lainnya. Bukan subjektif.' },
            { icon: 'verified_user', color: '#047857', bg: '#dcfce7', t: 'Verifikasi Berjenjang', d: 'Ketua RT memeriksa, Ketua RW mengawasi, Admin mengelola data.' },
            { icon: 'devices', color: '#155e75', bg: '#cffafe', t: 'Bisa dari HP', d: 'Cukup pakai HP apa pun. Kalau kesulitan, Ketua RT siap membantu.' },
          ].map((f) => (
            <div
              key={f.t}
              style={{
                background: '#fff',
                border: '1px solid #DBEAFE',
                borderRadius: 14,
                padding: '22px 24px',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: f.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <MI name={f.icon} fill size={21} style={{ color: f.color }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{f.t}</div>
              <div style={{ fontSize: 13.5, color: '#526078', lineHeight: 1.65 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SYARAT ── */}
      <section className="ld-container" style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 24px 8px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg,#1A56DB 0%,#1e40af 100%)',
            borderRadius: 18,
            padding: '30px 34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 22,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ color: '#fff', maxWidth: 640 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, display: 'flex', gap: 9, alignItems: 'center' }}>
              <MI name="how_to_reg" size={20} fill /> Siapa yang Bisa Mendaftar?
            </div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.8)', lineHeight: 1.7 }}>
              Warga berdomisili di wilayah RW 08 yang belum memiliki akun. Pendaftaran gratis dan
              bisa dilakukan sendiri atau dibantu Ketua RT.
            </div>
          </div>
          <button className="ld-btn ld-btn-primary" onClick={goRegister} style={{ background: '#fff', borderColor: '#fff' }}>
            <MI name="person_add" size={16} style={{ color: '#1A56DB' }} />
            <span style={{ color: '#1A56DB' }}>Daftar Sekarang</span>
          </button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="ld-container" style={{ maxWidth: 900, margin: '0 auto', padding: '44px 24px 8px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Pertanyaan yang Sering Diajukan</h2>
        <p style={{ fontSize: 14, color: '#526078', marginBottom: 22 }}>Jawaban singkat untuk pertanyaan umum warga.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map((f) => (
            <details key={f.q} className="ld-faq" style={{ background: '#fff', border: '1px solid #DBEAFE', borderRadius: 12 }}>
              <summary>
                <span>{f.q}</span>
                <MI name="expand_more" size={18} className="mi-chev" style={{ marginLeft: 'auto' }} />
              </summary>
              <div className="ld-faq-body">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          marginTop: 48,
          borderTop: '1px solid #DBEAFE',
          background: '#fff',
          padding: '22px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 13, color: '#526078', lineHeight: 1.7 }}>
          BansosHub — Sistem Pendukung Keputusan Bantuan Sosial (Metode SAW) · RW 08
          <br />
          <span style={{ fontSize: 12.5 }}>
            Butuh bantuan? Hubungi Ketua RT di wilayah Anda.
          </span>
        </div>
      </footer>
    </>
  );
}