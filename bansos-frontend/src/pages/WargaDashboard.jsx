import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

const PERTANYAAN = [
  { id: 'q1', label: 'Jumlah KK dalam Satu Rumah', opts: ['> 3 KK', '3 KK', '2 KK', '1 KK'] },
  {
    id: 'q2',
    label: 'Jumlah Anggota Keluarga',
    opts: ['>= 6 ORANG', '5 ORANG', '4 ORANG', '<= 3 ORANG'],
  },
  {
    id: 'q3',
    label: 'Pendidikan Kepala Keluarga',
    opts: [
      'TIDAK SEKOLAH',
      'SEKOLAH DASAR (SD)',
      'SEKOLAH MENENGAH PERTAMA (SMP)',
      'SMA / SARJANA',
    ],
  },
  {
    id: 'q4',
    label: 'Jumlah Anggota yang Bersekolah',
    opts: ['>= 3 ORANG', '2 ORANG', '1 ORANG', 'TIDAK ADA'],
  },
  {
    id: 'q5',
    label: 'Rata-rata Pengeluaran per Bulan',
    opts: [
      '< Rp 1.500.000',
      'Rp 1.500.000 – Rp 3.000.000',
      'Rp 3.000.000 – Rp 5.000.000',
      '> Rp 5.000.000',
    ],
  },
  {
    id: 'q6',
    label: 'Rata-rata Penghasilan per Bulan',
    opts: [
      '< Rp 1.500.000',
      'Rp 1.500.000 – Rp 3.000.000',
      'Rp 3.000.000 – Rp 5.000.000',
      '> Rp 5.000.000',
    ],
  },
  {
    id: 'q7',
    label: 'Status Kepemilikan Rumah',
    opts: ['MENUMPANG', 'SEWA / KONTRAK', 'MILIK ORANG TUA / SAUDARA / KELUARGA', 'MILIK SENDIRI'],
  },
  {
    id: 'q8',
    label: 'Sumber Air Bersih',
    opts: ['SUNGAI / MATA AIR', 'SUMUR (BOR/GALI)', 'PDAM', 'KEMASAN / ISI ULANG'],
  },
  {
    id: 'q9',
    label: 'Sumber Penerangan / Listrik',
    opts: [
      'TIDAK ADA / LAMPU TEMPEL',
      'LISTRIK 450 WATT',
      'LISTRIK 900 WATT',
      'LISTRIK > 900 WATT',
    ],
  },
  {
    id: 'q10',
    label: 'Kepemilikan Kendaraan',
    opts: [
      'JALAN KAKI / SEPEDA / MOTOR SEADANYA / TRANSPORTASI UMUM',
      'SEPEDA MOTOR 1 UNIT (KONDISI BAIK)',
      'SEPEDA MOTOR LEBIH DARI 1 UNIT (KONDISI BAIK)',
      'MOBIL',
    ],
  },
];

const KOSONG_JAWABAN = Object.fromEntries(PERTANYAAN.map((p) => [p.id, '']));

const fmtTime = (s) =>
  s
    ? new Date(s).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' WIB'
    : '';
const fmtDate = (s) =>
  s
    ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

/* ─── Design Bootstrap ───────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { font-family: 'Plus Jakarta Sans', sans-serif; background: #F0F6FF; color: #0f172a; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #C6DCFF; border-radius: 6px; }
  .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-style: normal; display: inline-block; line-height: 1; text-transform: none; letter-spacing: normal; white-space: nowrap; }

  .nav-tab { background: none; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; font-weight: 600; padding: 12px 20px; color: #374151; border-bottom: 2px solid transparent; transition: .15s; white-space: nowrap; }
  .nav-tab:hover { color: #1A56DB; }
  .nav-tab.active { color: #1A56DB; border-bottom-color: #1A56DB; }

  .inp-field { width: 100%; padding: 11px 14px; border-radius: 9px; border: 1.5px solid #C6DCFF; background: #FAFCFF; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; color: #0f172a; outline: none; transition: .15s; }
  .inp-field:focus { border-color: #1A56DB; background: #fff; box-shadow: 0 0 0 3px rgba(26,86,219,.08); }

  .opt-card { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border: 1.5px solid #DBEAFE; border-radius: 9px; cursor: pointer; transition: .12s; background: #fff; }
  .opt-card:hover { border-color: #93c5fd; background: #F0F6FF; }
  .opt-card.sel { border-color: #1A56DB; background: #EBF3FF; }

  .btn-blue { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 11px 22px; background: #1A56DB; color: #fff; border: none; border-radius: 9px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: .15s; }
  .btn-blue:hover:not(:disabled) { background: #1649C4; }
  .btn-blue:disabled { opacity: .6; cursor: not-allowed; }

  .btn-ghost { display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px; background: #fff; color: #374151; border: 1.5px solid #C6DCFF; border-radius: 9px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: .15s; }
  .btn-ghost:hover { background: #EBF3FF; border-color: #93C5FD; color: #1A56DB; }

  .card { background: #fff; border-radius: 14px; border: 1px solid #DBEAFE; }

  @keyframes fadeUp  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @media print { .no-print { display: none !important; } }
`;

/* ─── Icon ───────────────────────────────────────────────────────────────── */
const MI = ({ name, fill = false, size = 20, style: s = {}, className = '' }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{
      fontSize: size,
      fontVariationSettings: fill
        ? "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24"
        : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
      ...s,
    }}
  >
    {name}
  </span>
);

/* ─── Status ─────────────────────────────────────────────────────────────── */
const statusCfg = (st) => {
  const s = String(st || '').toLowerCase();
  if (s === 'disetujui' || s.includes('setuju'))
    return {
      label: 'Disetujui',
      color: '#15803d',
      bg: '#dcfce7',
      dot: '#22c55e',
      icon: 'check_circle',
      step: 2,
    };
  if (s === 'ditolak' || s.includes('tolak'))
    return {
      label: 'Ditolak',
      color: '#dc2626',
      bg: '#fee2e2',
      dot: '#ef4444',
      icon: 'cancel',
      step: -1,
    };
  return {
    label: 'Menunggu Verifikasi',
    color: '#ca8a04',
    bg: '#fef9c3',
    dot: '#f59e0b',
    icon: 'schedule',
    step: 1,
  };
};

/* ══════════════════════════════════════════════════════════════════════════ */
export default function WargaDashboard() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [userData] = useState(() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [statusBansos, setStatusBansos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeNav, setActiveNav] = useState('beranda');
  const [pesanList, setPesanList] = useState([]);
  const [pesanBaru, setPesanBaru] = useState('');
  const [formDiri, setFormDiri] = useState(() => {
    try {
      const s = localStorage.getItem('user');
      const u = s ? JSON.parse(s) : null;
      return { nama_lengkap: u?.name || '', alamat: u?.alamat || '', rt: u?.rt || '' };
    } catch {
      return { nama_lengkap: '', alamat: '', rt: '' };
    }
  });
  const [jawaban, setJawaban] = useState(KOSONG_JAWABAN);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const fetchStatus = useCallback(async (token) => {
    try {
      const h = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API}/warga/status`, { headers: h });
      if (res.data.success && res.data.data) {
        setStatusBansos(res.data.data);
        if (res.data.data.id_pengajuan) {
          try {
            const chat = await axios.get(`${API}/chat/${res.data.data.id_pengajuan}`, {
              headers: h,
            });
            setPesanList(chat.data.data || []);
          } catch (chatErr) {
            console.error('Gagal memuat pesan:', chatErr);
          }
        }
      } else {
        setStatusBansos(null);
      }
    } catch (err) {
      console.error('Gagal memuat status pengajuan:', err);
      setStatusBansos(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!userData || !t) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => {
      fetchStatus(t);
    }, 0);
    return () => clearTimeout(timer);
  }, [userData, fetchStatus, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pesanList]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!formDiri.nama_lengkap || !formDiri.alamat || !formDiri.rt) {
      setError('Lengkapi data diri terlebih dahulu.');
      setStep(0);
      return;
    }
    const kosong = PERTANYAAN.filter((p) => !jawaban[p.id]);
    if (kosong.length > 0) {
      setError(`${kosong.length} pertanyaan belum dijawab.`);
      return;
    }
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/warga/pengajuan`,
        { ...formDiri, jawaban_mentah: jawaban },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStatus(token);
      setActiveNav('status');
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleKirimPesan = async (e) => {
    e.preventDefault();
    if (!pesanBaru.trim() || !statusBansos) return;
    const token = localStorage.getItem('token'),
      teks = pesanBaru;
    setPesanList((p) => [
      ...p,
      { pengirim_role: 'warga', isi_pesan: teks, created_at: new Date().toISOString() },
    ]);
    setPesanBaru('');
    try {
      await axios.post(
        `${API}/chat/${statusBansos.id_pengajuan}`,
        { isi_pesan: teks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Gagal mengirim pesan chat:', err);
      setError('Gagal mengirim pesan chat.');
    }
  };

  const sw = statusBansos ? statusCfg(statusBansos.status) : null;
  const pct = PERTANYAAN.filter((p) => jawaban[p.id]).length;
  const navItems = [
    { key: 'beranda', label: 'Beranda', icon: 'home' },
    { key: 'kuesioner', label: 'Kuesioner', icon: 'edit_document' },
    { key: 'status', label: 'Status', icon: 'pending_actions' },
    { key: 'diskusi', label: 'Diskusi', icon: 'forum' },
  ];

  if (loading)
    return (
      <>
        <style>{CSS}</style>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F0F6FF',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: '3px solid #DBEAFE',
                borderTopColor: '#1A56DB',
                borderRadius: '50%',
                margin: '0 auto 14px',
                animation: 'spin .8s linear infinite',
              }}
            />
            <div style={{ color: '#64748b', fontSize: 14 }}>Memuat data pengajuan...</div>
          </div>
        </div>
      </>
    );

  return (
    <>
      <style>{CSS}</style>

      {/* ══ NAVBAR ══ */}
      <nav
        className="no-print"
        style={{
          background: '#fff',
          borderBottom: '1px solid #DBEAFE',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 62,
          }}
        >
          {/* Brand - Diubah dengan dekorasi lingkaran agar persis seperti Admin/RW/RT */}
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
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,.12)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,.08)',
                  pointerEvents: 'none',
                }}
              />
              <MI name="hub" fill size={20} style={{ color: '#93c5fd', position: 'relative' }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-.3px',
                  lineHeight: 1.1,
                }}
              >
                BANSOS<span style={{ color: '#1A56DB' }}>HUB</span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                }}
              >
                Portal Warga
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {navItems.map(({ key, label }) => (
              <button
                key={key}
                className={`nav-tab ${activeNav === key ? 'active' : ''}`}
                onClick={() => setActiveNav(key)}
              >
                {label}
                {key === 'diskusi' && pesanList.length > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: '#1A56DB',
                      color: '#fff',
                      borderRadius: '50%',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                    }}
                  >
                    {pesanList.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '6px 10px',
                borderRadius: 9,
                background: '#EBF3FF',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: '#1A56DB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {userData?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {userData?.name}
                </div>
                <div style={{ fontSize: 10.5, color: '#1A56DB', fontWeight: 600 }}>
                  Warga · RT {userData?.rt || '—'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                navigate('/login');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                background: '#fff',
                color: '#374151',
                border: '1.5px solid #C6DCFF',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: '.12s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EBF3FF';
                e.currentTarget.style.color = '#1A56DB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#374151';
              }}
            >
              <MI name="logout" size={15} /> Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* ══ CONTENT ══ */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        {/* ── BERANDA ── */}
        {activeNav === 'beranda' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              animation: 'fadeUp .25s ease',
            }}
          >
            {/* Hero */}
            <div
              className="card"
              style={{ overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 300px' }}
            >
              <div style={{ padding: '36px 40px' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#1A56DB',
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#1A56DB' }}
                  />{' '}
                  Sesi Aktif
                </div>
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: '#0f172a',
                    lineHeight: 1.3,
                    marginBottom: 10,
                  }}
                >
                  Selamat datang, {userData?.name}
                </h1>
                <p
                  style={{
                    fontSize: 14.5,
                    color: '#475569',
                    lineHeight: 1.7,
                    maxWidth: 480,
                    marginBottom: 26,
                  }}
                >
                  Akses ringkasan pengajuan, lengkapi kuesioner, dan pantau proses verifikasi
                  bantuan sosial Anda secara real-time.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {!statusBansos ? (
                    <button className="btn-blue" onClick={() => setActiveNav('kuesioner')}>
                      <MI name="edit_document" size={16} fill /> Isi Kuesioner Sekarang
                    </button>
                  ) : (
                    <button className="btn-blue" onClick={() => setActiveNav('status')}>
                      <MI name="pending_actions" size={16} fill /> Lihat Status Pengajuan
                    </button>
                  )}
                  <button className="btn-ghost" onClick={() => setActiveNav('diskusi')}>
                    <MI name="forum" size={16} /> Diskusi dengan RT
                  </button>
                </div>
              </div>
              <div
                style={{
                  background: 'linear-gradient(135deg,#1A56DB 0%,#1e40af 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '32px 28px',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,.55)',
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    marginBottom: 16,
                  }}
                >
                  Status Pengajuan
                </div>
                {sw ? (
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        borderRadius: 9,
                        background: 'rgba(255,255,255,.12)',
                        marginBottom: 12,
                      }}
                    >
                      <MI name={sw.icon} fill size={18} style={{ color: sw.dot }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        {sw.label}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.65 }}
                    >
                      {sw.step === 2 &&
                        'Pengajuan Anda disetujui. Tunggu instruksi pencairan dari RT.'}
                      {sw.step === 1 && 'Berkas Anda sedang ditinjau oleh Ketua RT.'}
                      {sw.step === -1 && 'Pengajuan tidak memenuhi kuota periode ini.'}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                      Belum Ada Data
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
                      Isi kuesioner untuk memulai proses pengajuan.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alur pengajuan */}
            <div className="card" style={{ padding: '28px 32px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 28,
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    Alur Pengajuan Bantuan
                  </div>
                  <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>
                    Pantau tahapan dokumen Anda saat ini
                  </div>
                </div>
                {sw && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: sw.color,
                      background: sw.bg,
                      padding: '5px 12px',
                      borderRadius: 20,
                    }}
                  >
                    {sw.label}
                  </span>
                )}
              </div>
              <div
                style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 19,
                    left: '10%',
                    right: '10%',
                    height: 2,
                    background: '#DBEAFE',
                    zIndex: 0,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 19,
                    left: '10%',
                    height: 2,
                    background: '#1A56DB',
                    zIndex: 1,
                    transition: 'width .5s',
                    width: !sw ? '0%' : sw.step === 2 ? '80%' : sw.step === 1 ? '40%' : '0%',
                  }}
                />
                {[
                  {
                    label: 'Kuesioner',
                    sub: 'Data ekonomi keluarga',
                    done: !!statusBansos,
                    active: !statusBansos,
                  },
                  {
                    label: 'Verifikasi RT',
                    sub: 'Ditinjau Ketua RT',
                    done: sw && sw.step >= 2,
                    active: sw && sw.step === 1,
                  },
                  {
                    label: 'Keputusan',
                    sub: 'Hasil akhir penetapan',
                    done: sw && sw.step === 2,
                    active: sw && sw.step === -1,
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: s.done ? '#1A56DB' : s.active ? '#EBF3FF' : '#f1f5f9',
                        border: `2px solid ${s.done ? '#1A56DB' : s.active ? '#1A56DB' : '#DBEAFE'}`,
                        boxShadow: s.active ? '0 0 0 4px rgba(26,86,219,.12)' : 'none',
                        transition: '.3s',
                      }}
                    >
                      {s.done ? (
                        <MI name="check" fill size={20} style={{ color: '#fff' }} />
                      ) : (
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: s.active ? '#1A56DB' : '#94a3b8',
                          }}
                        >
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: s.done || s.active ? '#0f172a' : '#94a3b8',
                        }}
                      >
                        {s.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              {sw && (
                <div
                  style={{
                    marginTop: 28,
                    padding: '14px 18px',
                    borderRadius: 10,
                    background: sw.bg,
                    border: `1px solid ${sw.dot}30`,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <MI
                    name={sw.icon}
                    fill
                    size={20}
                    style={{ color: sw.color, flexShrink: 0, marginTop: 1 }}
                  />
                  <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.65 }}>
                    {sw.step === 2 &&
                      'Selamat — pengajuan Anda disetujui. Harap menunggu instruksi lebih lanjut dari Ketua RT.'}
                    {sw.step === 1 &&
                      'Data kuesioner Anda telah diterima. Ketua RT sedang melakukan verifikasi. Gunakan fitur Diskusi jika ada pertanyaan.'}
                    {sw.step === -1 &&
                      'Mohon maaf, tingkat prioritas Anda belum memenuhi kuota penerima periode ini. Hubungi Ketua RT untuk informasi lebih lanjut.'}
                  </div>
                </div>
              )}
            </div>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              <div className="card" style={{ padding: '22px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#EBF3FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MI name="fact_check" fill size={20} style={{ color: '#1A56DB' }} />
                  </div>
                  {sw && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 5,
                        background: sw.bg,
                        color: sw.color,
                      }}
                    >
                      {sw.label}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  Status Kuesioner
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {statusBansos ? sw?.label || 'Terkirim' : 'Belum Diisi'}
                </div>
                {statusBansos?.created_at && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Dikirim: {fmtDate(statusBansos.created_at)}
                  </div>
                )}
              </div>

              <div
                className="card"
                style={{ padding: '22px 24px', cursor: 'pointer' }}
                onClick={() => setActiveNav('diskusi')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <MI name="forum" fill size={20} style={{ color: '#059669' }} />
                    {pesanList.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          width: 9,
                          height: 9,
                          background: '#ef4444',
                          borderRadius: '50%',
                          border: '1.5px solid #fff',
                        }}
                      />
                    )}
                  </div>
                  <MI name="arrow_forward" size={16} style={{ color: '#94a3b8' }} />
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  Diskusi dengan RT
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {pesanList.length} Pesan
                </div>
                <div style={{ fontSize: 11, color: '#1A56DB', marginTop: 4, fontWeight: 600 }}>
                  Buka ruang diskusi
                </div>
              </div>

              <div
                className="card"
                style={{ padding: '22px 24px', background: '#EBF3FF', border: '1px solid #C6DCFF' }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#D6E9FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <MI name="location_city" fill size={20} style={{ color: '#1d4ed8' }} />
                </div>
                <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>Wilayah Anda</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  RT {userData?.rt || '—'} / RW 08
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Data dapat diperbarui oleh RT
                </div>
              </div>
            </div>

            {/* Info penting */}
            <div className="card" style={{ padding: '22px 26px', borderLeft: '4px solid #1A56DB' }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <MI
                  name="info"
                  fill
                  size={20}
                  style={{ color: '#1A56DB', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                    Informasi Penting
                  </div>
                  <ul
                    style={{
                      fontSize: 13,
                      color: '#475569',
                      lineHeight: 1.8,
                      paddingLeft: 0,
                      listStyle: 'none',
                    }}
                  >
                    {[
                      'Pengisian kuesioner hanya dapat dilakukan satu kali. Pastikan data yang diisi sesuai kondisi aktual.',
                      'Sistem menggunakan metode SAW (Simple Additive Weighting) untuk menentukan prioritas penerima.',
                      'Gunakan fitur Diskusi jika ada pertanyaan atau keberatan terkait hasil verifikasi.',
                    ].map((text, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 2 ? 4 : 0 }}>
                        <span style={{ color: '#1A56DB', fontWeight: 700, flexShrink: 0 }}>
                          0{i + 1}.
                        </span>{' '}
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── KUESIONER ── */}
        {activeNav === 'kuesioner' && (
          <div style={{ animation: 'fadeUp .25s ease' }}>
            {statusBansos ? (
              <div
                className="card"
                style={{
                  padding: '56px 48px',
                  textAlign: 'center',
                  maxWidth: 560,
                  margin: '0 auto',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <MI name="check_circle" fill size={32} style={{ color: '#15803d' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                  Kuesioner Sudah Terkirim
                </h2>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 28 }}>
                  Data Anda telah terekam pada <strong>{fmtDate(statusBansos.created_at)}</strong>.
                  Pengisian ulang tidak diperkenankan untuk menjaga integritas data penilaian.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                  <button className="btn-blue" onClick={() => setActiveNav('status')}>
                    <MI name="pending_actions" size={15} /> Lihat Status
                  </button>
                  <button className="btn-ghost" onClick={() => setActiveNav('diskusi')}>
                    <MI name="forum" size={15} /> Diskusi dengan RT
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: 760, margin: '0 auto' }}>
                {/* Step header */}
                <div
                  className="card"
                  style={{
                    padding: '20px 28px',
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                      {step === 0 ? 'Bagian 1 — Data Diri' : 'Bagian 2 — Kuesioner Ekonomi'}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {step === 0
                        ? 'Isi identitas dan domisili Anda'
                        : `${pct} dari 10 pertanyaan terjawab`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        style={{
                          height: 4,
                          width: 48,
                          borderRadius: 4,
                          background: i <= step ? '#1A56DB' : '#DBEAFE',
                          transition: '.3s',
                        }}
                      />
                    ))}
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>
                      {step + 1}/2
                    </span>
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 9,
                      background: '#fee2e2',
                      border: '1px solid #fca5a5',
                      color: '#dc2626',
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 16,
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <MI name="error" fill size={16} /> {error}
                  </div>
                )}

                {step === 0 ? (
                  <div
                    className="card"
                    style={{
                      padding: '28px 32px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 20,
                    }}
                  >
                    {[
                      {
                        label: 'Nama Lengkap Sesuai KTP',
                        key: 'nama_lengkap',
                        type: 'text',
                        ph: 'Masukkan nama lengkap',
                      },
                    ].map(({ label, key, type, ph }) => (
                      <div key={key}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: '#374151',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                            marginBottom: 7,
                          }}
                        >
                          {label}
                        </label>
                        <input
                          className="inp-field"
                          type={type}
                          value={formDiri[key]}
                          onChange={(e) => setFormDiri({ ...formDiri, [key]: e.target.value })}
                          placeholder={ph}
                        />
                      </div>
                    ))}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '.06em',
                          marginBottom: 7,
                        }}
                      >
                        Alamat Domisili
                      </label>
                      <textarea
                        className="inp-field"
                        rows={3}
                        value={formDiri.alamat}
                        onChange={(e) => setFormDiri({ ...formDiri, alamat: e.target.value })}
                        placeholder="Jl. Nama Jalan No. 1, RT/RW..."
                        style={{ resize: 'none' }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '.06em',
                          marginBottom: 7,
                        }}
                      >
                        Wilayah RT
                      </label>
                      <select
                        className="inp-field"
                        value={formDiri.rt}
                        onChange={(e) => setFormDiri({ ...formDiri, rt: e.target.value })}
                        style={{ cursor: 'pointer', appearance: 'none' }}
                      >
                        <option value="" disabled>
                          Pilih RT
                        </option>
                        <option value="1">RT 01</option>
                        <option value="2">RT 02</option>
                        <option value="3">RT 03</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                      <button
                        className="btn-blue"
                        onClick={() => {
                          if (!formDiri.nama_lengkap || !formDiri.alamat || !formDiri.rt) {
                            setError('Lengkapi semua data diri terlebih dahulu.');
                            return;
                          }
                          setError('');
                          setStep(1);
                        }}
                      >
                        Lanjut ke Kuesioner <MI name="arrow_forward" size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {PERTANYAAN.map((q, idx) => (
                      <div key={q.id} className="card" style={{ padding: '20px 24px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 14,
                          }}
                        >
                          <span
                            style={{
                              background: jawaban[q.id] ? '#1A56DB' : '#DBEAFE',
                              color: jawaban[q.id] ? '#fff' : '#6B7280',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: 5,
                              transition: '.2s',
                            }}
                          >
                            C{idx + 1}
                          </span>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                            {q.label}
                          </span>
                          {jawaban[q.id] && (
                            <MI
                              name="check_circle"
                              fill
                              size={16}
                              style={{ color: '#22c55e', marginLeft: 'auto' }}
                            />
                          )}
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
                            gap: 8,
                          }}
                        >
                          {q.opts.map((opt) => (
                            <div
                              key={opt}
                              className={`opt-card ${jawaban[q.id] === opt ? 'sel' : ''}`}
                              onClick={() => setJawaban({ ...jawaban, [q.id]: opt })}
                            >
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  border: `2px solid ${jawaban[q.id] === opt ? '#1A56DB' : '#C6DCFF'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  marginTop: 1,
                                  transition: '.12s',
                                }}
                              >
                                {jawaban[q.id] === opt && (
                                  <div
                                    style={{
                                      width: 7,
                                      height: 7,
                                      borderRadius: '50%',
                                      background: '#1A56DB',
                                    }}
                                  />
                                )}
                              </div>
                              <span
                                style={{
                                  fontSize: 12.5,
                                  color: jawaban[q.id] === opt ? '#1e40af' : '#374151',
                                  lineHeight: 1.45,
                                  fontWeight: jawaban[q.id] === opt ? 600 : 400,
                                }}
                              >
                                {opt}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div
                      className="card"
                      style={{
                        padding: '18px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          className="btn-ghost"
                          onClick={() => {
                            setError('');
                            setStep(0);
                          }}
                        >
                          <MI name="arrow_back" size={15} /> Kembali
                        </button>
                        <div style={{ fontSize: 12.5, color: '#64748b' }}>
                          <strong style={{ color: pct === 10 ? '#15803d' : '#0f172a' }}>
                            {pct}
                          </strong>
                          /10 terjawab
                        </div>
                        <div
                          style={{
                            height: 6,
                            width: 120,
                            borderRadius: 4,
                            background: '#DBEAFE',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 4,
                              background: pct === 10 ? '#22c55e' : '#1A56DB',
                              width: `${(pct / 10) * 100}%`,
                              transition: '.3s',
                            }}
                          />
                        </div>
                      </div>
                      <button
                        className="btn-blue"
                        onClick={handleSubmit}
                        disabled={submitLoading || pct < 10}
                        style={{ opacity: pct < 10 ? 0.5 : 1 }}
                      >
                        <MI name={submitLoading ? 'hourglass_empty' : 'send'} size={15} />
                        {submitLoading ? 'Mengirim...' : 'Kirim Pengajuan'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STATUS ── */}
        {activeNav === 'status' && (
          <div
            style={{
              animation: 'fadeUp .25s ease',
              maxWidth: 720,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {!statusBansos ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <MI
                  name="inbox"
                  size={48}
                  style={{ color: '#C6DCFF', display: 'block', margin: '0 auto 16px' }}
                />
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Belum Ada Pengajuan
                </div>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 22 }}>
                  Anda belum pernah mengisi kuesioner. Lengkapi formulir untuk memulai proses.
                </p>
                <button className="btn-blue" onClick={() => setActiveNav('kuesioner')}>
                  <MI name="edit_document" size={15} /> Isi Kuesioner Sekarang
                </button>
              </div>
            ) : (
              <>
                <div
                  className="card"
                  style={{
                    padding: '24px 28px',
                    borderLeft: `4px solid ${sw.dot}`,
                    display: 'flex',
                    gap: 18,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: sw.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MI name={sw.icon} fill size={26} style={{ color: sw.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '.08em',
                        marginBottom: 5,
                      }}
                    >
                      Hasil Keputusan
                    </div>
                    <div
                      style={{ fontSize: 22, fontWeight: 800, color: sw.color, marginBottom: 8 }}
                    >
                      {sw.step === 2
                        ? 'Pengajuan Disetujui'
                        : sw.step === 1
                          ? 'Sedang Diverifikasi'
                          : 'Pengajuan Ditolak'}
                    </div>
                    <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.65, margin: 0 }}>
                      {sw.step === 2 &&
                        'Anda dinyatakan memenuhi syarat penerima Bantuan Sosial. Tunggu instruksi pencairan dari RT.'}
                      {sw.step === 1 &&
                        'Berkas Anda sedang dalam antrean verifikasi oleh Ketua RT. Proses biasanya 1–3 hari kerja.'}
                      {sw.step === -1 &&
                        'Mohon maaf, tingkat prioritas Anda belum memenuhi kuota penerima periode ini.'}
                    </p>
                  </div>
                </div>

                <div className="card" style={{ padding: '22px 28px' }}>
                  <div
                    style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}
                  >
                    Detail Pengajuan
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { label: 'Nomor Pengajuan', value: `#${statusBansos.id_pengajuan || '—'}` },
                      { label: 'Tanggal Dikirim', value: fmtDate(statusBansos.created_at) },
                      { label: 'Status Terkini', value: sw.label },
                      { label: 'Wilayah', value: `RT ${userData?.rt || '—'} / RW 08` },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        style={{
                          padding: '14px 18px',
                          borderRadius: 10,
                          background: '#F0F6FF',
                          border: '1px solid #DBEAFE',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                            marginBottom: 5,
                          }}
                        >
                          {label}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="btn-ghost"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => setActiveNav('diskusi')}
                >
                  <MI name="forum" size={15} /> Ada pertanyaan? Hubungi RT via Diskusi
                </button>
              </>
            )}
          </div>
        )}

        {/* ── DISKUSI ── */}
        {activeNav === 'diskusi' && (
          <div style={{ animation: 'fadeUp .25s ease', maxWidth: 680, margin: '0 auto' }}>
            {!statusBansos ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <MI
                  name="forum"
                  size={48}
                  style={{ color: '#C6DCFF', display: 'block', margin: '0 auto 16px' }}
                />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Fitur Diskusi Belum Tersedia
                </div>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 22 }}>
                  Selesaikan pengisian kuesioner terlebih dahulu.
                </p>
                <button className="btn-blue" onClick={() => setActiveNav('kuesioner')}>
                  <MI name="edit_document" size={15} /> Isi Kuesioner
                </button>
              </div>
            ) : (
              <div
                className="card"
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '18px 22px',
                    borderBottom: '1px solid #DBEAFE',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: '#EBF3FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MI name="forum" fill size={19} style={{ color: '#1A56DB' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      Diskusi dengan Ketua RT
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
                      Pengajuan #{statusBansos.id_pengajuan} · Pesan tercatat secara resmi
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: sw.bg,
                        color: sw.color,
                      }}
                    >
                      {sw.label}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div
                  style={{
                    height: 380,
                    overflowY: 'auto',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    background: '#F0F6FF',
                  }}
                >
                  {pesanList.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
                      <MI
                        name="chat_bubble_outline"
                        size={36}
                        style={{ display: 'block', margin: '0 auto 10px', opacity: 0.4 }}
                      />
                      <div style={{ fontSize: 13 }}>
                        Belum ada pesan. Sampaikan pertanyaan di sini.
                      </div>
                    </div>
                  ) : (
                    pesanList.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          alignSelf: p.pengirim_role === 'warga' ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#94a3b8',
                            marginBottom: 3,
                            textAlign: p.pengirim_role === 'warga' ? 'right' : 'left',
                          }}
                        >
                          {p.pengirim_role === 'warga' ? 'ANDA' : 'KETUA RT'}
                        </div>
                        <div
                          style={{
                            padding: '11px 15px',
                            borderRadius: 12,
                            borderBottomRightRadius: p.pengirim_role === 'warga' ? 3 : 12,
                            borderBottomLeftRadius: p.pengirim_role === 'rt' ? 3 : 12,
                            background: p.pengirim_role === 'warga' ? '#1A56DB' : '#fff',
                            color: p.pengirim_role === 'warga' ? '#fff' : '#0f172a',
                            fontSize: 13.5,
                            lineHeight: 1.55,
                            border: p.pengirim_role === 'rt' ? '1px solid #DBEAFE' : 'none',
                            boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                          }}
                        >
                          {p.isi_pesan}
                          <div
                            style={{
                              fontSize: 10,
                              opacity: 0.55,
                              marginTop: 4,
                              textAlign: 'right',
                            }}
                          >
                            {fmtTime(p.created_at)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={handleKirimPesan}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '14px 18px',
                    borderTop: '1px solid #DBEAFE',
                    background: '#fff',
                  }}
                >
                  <input
                    className="inp-field"
                    type="text"
                    value={pesanBaru}
                    onChange={(e) => setPesanBaru(e.target.value)}
                    placeholder="Tulis pertanyaan atau keterangan untuk Ketua RT..."
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    disabled={!pesanBaru.trim()}
                    style={{
                      width: 44,
                      height: 44,
                      background: pesanBaru.trim() ? '#1A56DB' : '#DBEAFE',
                      border: 'none',
                      borderRadius: 10,
                      cursor: pesanBaru.trim() ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: '.15s',
                    }}
                  >
                    <MI
                      name="send"
                      fill
                      size={17}
                      style={{ color: pesanBaru.trim() ? '#fff' : '#94a3b8' }}
                    />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
