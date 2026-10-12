import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

/* ─── Design Bootstrap ───────────────────────────────────────────────────── */
function useDesign() {
  useEffect(() => {
    if (!document.getElementById('tw-cdn')) {
      const s = document.createElement('script');
      s.id = 'tw-cdn';
      s.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
      document.head.appendChild(s);
    }
    if (!document.getElementById('gf-plus')) {
      const l = document.createElement('link');
      l.id = 'gf-plus';
      l.rel = 'stylesheet';
      l.href =
        'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(l);
    }
    if (!document.getElementById('mat-sym')) {
      const l = document.createElement('link');
      l.id = 'mat-sym';
      l.rel = 'stylesheet';
      l.href =
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
      document.head.appendChild(l);
    }
    if (!document.getElementById('rt-print')) {
      const st = document.createElement('style');
      st.id = 'rt-print';
      st.innerHTML = `
        @media print {
          @page { size: A4 landscape; margin: 10mm 12mm; }
          html,body { height:auto!important; overflow:visible!important; background:#fff!important; font-size:10px!important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          .no-print,aside,header,button,input,select,textarea { display:none!important; }
          main { display:block!important; width:100%!important; height:auto!important; overflow:visible!important; padding:0!important; background:#fff!important; }
          div,section { overflow:visible!important; height:auto!important; max-height:none!important; }
          .print-header { display:block!important; text-align:center; margin-bottom:14px; padding-bottom:8px; border-bottom:2px solid #000; }
          .print-header h2 { font-size:13px!important; font-weight:700; text-transform:uppercase; }
          .print-header p { font-size:10px!important; color:#444; }
          table { width:100%!important; border-collapse:collapse!important; font-size:8.5px!important; }
          th,td { padding:4px 7px!important; border:1px solid #9ca3af!important; word-break:break-word!important; }
          th { background:#dbeafe!important; font-weight:700!important; }
          tr { page-break-inside:avoid; }
          .badge-screen { display:none!important; }
          .print-status { display:inline!important; font-weight:700!important; font-size:8.5px!important; }
          img,.material-symbols-outlined { display:none!important; }
        }
        .print-status { display:none; }
        .badge-screen { display:inline-flex; }
      `;
      document.head.appendChild(st);
    }
    document.body.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    document.body.style.background = '#F0F6FF';
  }, []);
}

/* ─── Icon ───────────────────────────────────────────────────────────────── */
const MI = ({ name, fill = false, size = 20, style: s = {}, className = '' }) => (
  <span
    className={`material-symbols-outlined select-none ${className}`}
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

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmtDate = (s) =>
  s
    ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';
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

const statusCfg = (st) => {
  const s = String(st || '').toLowerCase();
  if (s === 'disetujui')
    return { label: 'DITERIMA', bg: '#dcfce7', color: '#15803d', dot: '#22c55e' };
  if (s === 'ditolak') return { label: 'DITOLAK', bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' };
  return { label: 'PENDING', bg: '#fef9c3', color: '#ca8a04', dot: '#f59e0b' };
};

const Badge = ({ status }) => {
  const c = statusCfg(status);
  return (
    <>
      <span
        className="badge-screen"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          background: c.bg,
          color: c.color,
        }}
      >
        <span
          style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }}
        />
        {c.label}
      </span>
      <span className="print-status" style={{ color: c.color }}>
        {c.label}
      </span>
    </>
  );
};

/* ─── Kuesioner Data ─────────────────────────────────────────────────────── */
const OPSI = {
  q1: ['> 3 KK', '3 KK', '2 KK', '1 KK'],
  q2: ['>= 6 ORANG', '5 ORANG', '4 ORANG', '<= 3 ORANG'],
  q3: ['TIDAK SEKOLAH', 'SEKOLAH DASAR (SD)', 'SEKOLAH MENENGAH PERTAMA (SMP)', 'SMA / SARJANA'],
  q4: ['>= 3 ORANG', '2 ORANG', '1 ORANG', 'TIDAK ADA'],
  q5: [
    '< Rp. 1.500.000',
    'Rp. 1.500.000 - Rp. 3.000.000',
    'RP. 3.000.000 - Rp. 5.000.000',
    '> RP. 5.000.000',
  ],
  q6: [
    '< Rp. 1.500.000',
    'Rp. 1.500.000 - Rp. 3.000.000',
    'RP. 3.000.000 - Rp. 5.000.000',
    '> RP. 5.000.000',
  ],
  q7: ['MENUMPANG', 'SEWA / KONTRAK', 'MILIK ORANG TUA/ SAUDARA /KELUARGA', 'MILIK SENDIRI'],
  q8: ['SUNGAI / MATA AIR', 'SUMUR (BOR/GALI)', 'PDAM', 'KEMASAN / ISI ULANG'],
  q9: ['TIDAK ADA / LAMPU TEMPEL', 'LISTRIK 450 WATT', 'LISTRIK 900 WATT', 'LISTRIK  > 900 WATT'],
  q10: [
    'JALAN KAKI / SEPEDA / SEPEDA MOTOR SEADANYA / TRANSPORTASI UMUM',
    'SEPEDA MOTOR 1 UNIT KONDISI BAIK',
    'SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK',
    'MOBIL',
  ],
};

const LABELS = [
  'Jumlah KK dalam 1 Rumah',
  'Jumlah Anggota Keluarga',
  'Pendidikan Kepala Keluarga',
  'Jumlah Tanggungan Sekolah',
  'Rata-rata Pengeluaran / Bulan',
  'Rata-rata Penghasilan / Bulan',
  'Status Kepemilikan Rumah',
  'Sumber Air Bersih',
  'Sumber Penerangan',
  'Kepemilikan Kendaraan',
];

const KOSONG_JAWABAN = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`q${i + 1}`, '']));

const parseJawaban = (raw) => {
  if (!raw) return null;
  let p = raw;
  for (let i = 0; i < 3; i++) {
    if (typeof p === 'string') {
      try {
        p = JSON.parse(p);
      } catch {
        break;
      }
    } else break;
  }
  return typeof p === 'object' && p !== null ? p : null;
};

const konversiSubkriteria = (jawaban) => {
  if (!jawaban) return {};
  const norm = (s) => String(s).replace(/\s+/g, '').toLowerCase();
  const hasil = {};
  for (let i = 1; i <= 10; i++) {
    const idx = (OPSI[`q${i}`] || []).findIndex((o) => norm(o) === norm(jawaban[`q${i}`] || ''));
    hasil[i] = idx !== -1 ? (i - 1) * 4 + idx + 1 : (i - 1) * 4 + 1;
  }
  return hasil;
};

/* ─── Shared UI ──────────────────────────────────────────────────────────── */
const Overlay = ({ children, onClose }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'rgba(2,6,23,.6)',
      backdropFilter: 'blur(4px)',
    }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════ */
export default function RtDashboard() {
  useDesign();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [userData] = useState(() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : { name: 'Ketua RT', role: 'rt', rt: '-' };
    } catch {
      return { name: 'Ketua RT', role: 'rt', rt: '-' };
    }
  });
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [loading, setLoading] = useState(false);

  const [wargaList, setWargaList] = useState([]);
  const [pengajuanList, setPengajuanList] = useState([]);
  const [rankingAll, setRankingAll] = useState([]);
  const [rankingScope, setRankingScope] = useState('rt');

  /* Modal states */
  const [modalWarga, setModalWarga] = useState(false);
  const [formWarga, setFormWarga] = useState({ name: '', username: '', password: '', alamat: '' });
  const [modalKuesioner, setModalKuesioner] = useState(false);
  const [targetWarga, setTargetWarga] = useState(null);
  const [formJawaban, setFormJawaban] = useState(KOSONG_JAWABAN);
  const [formDataDiri, setFormDataDiri] = useState({ nama_lengkap: '', alamat: '', rt: '' });
  const [modalVerif, setModalVerif] = useState(false);
  const [selectedP, setSelectedP] = useState(null);
  const [pesanList, setPesanList] = useState([]);
  const [pesanBaru, setPesanBaru] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── Auth ── */
  useEffect(() => {
    const s = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (!s || !t) {
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(s);
      if (u.role !== 'rt') {
        navigate('/login');
      }
    } catch {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);

  const fetchData = useCallback(
    async (token, rt) => {
      setLoading(true);
      const rtNum = Number(rt);
      try {
        if (['beranda', 'warga', 'kuesioner'].includes(activeMenu)) {
          const r = await axios.get(`${API}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setWargaList(
            (r.data.data || []).filter((u) => u.role === 'warga' && Number(u.rt) === rtNum)
          );
        }
        if (['beranda', 'verifikasi'].includes(activeMenu)) {
          const r = await axios.get(`${API}/admin/pengajuan`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPengajuanList((r.data.data || []).filter((p) => Number(p.warga?.rt) === rtNum));
        }
        if (['beranda', 'ranking'].includes(activeMenu)) {
          const r = await axios.get(`${API}/saw/hitung?t=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRankingAll((r.data.data || []).map((x, i) => ({ ...x, rank_global: i + 1 })));
        }
      } catch (e) {
        console.error('Gagal memuat data RT:', e);
      } finally {
        setLoading(false);
      }
    },
    [activeMenu]
  );

  /* ── Fetch ── */
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t || !userData.rt || userData.rt === '-') return;
    const timer = setTimeout(() => {
      fetchData(t, userData.rt);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData, userData.rt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pesanList]);

  /* ── Warga actions ── */
  const simpanWarga = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/admin/users`,
        { ...formWarga, role: 'warga', rt: userData.rt },
        { headers: authH() }
      );
      setModalWarga(false);
      setFormWarga({ name: '', username: '', password: '', alamat: '' });
      fetchData(localStorage.getItem('token'), userData.rt);
      showToast('Warga berhasil ditambahkan.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menambahkan warga.', 'error');
    }
  };

  /* ── Kuesioner actions ── */
  const bukaKuesioner = (warga) => {
    setTargetWarga(warga);
    setFormDataDiri({ nama_lengkap: warga.name, alamat: warga.alamat || '', rt: userData.rt });
    const existing = pengajuanList.find(
      (p) => (p.warga?.name || p.warga?.nama_lengkap) === warga.name
    );
    setFormJawaban(
      existing?.jawaban_mentah
        ? parseJawaban(existing.jawaban_mentah) || KOSONG_JAWABAN
        : KOSONG_JAWABAN
    );
    setModalKuesioner(true);
  };

  const submitKuesioner = async (e) => {
    e.preventDefault();
    if (Object.values(formJawaban).some((v) => !v)) {
      showToast('Mohon jawab seluruh 10 pertanyaan kuesioner.', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const existing = pengajuanList.find(
        (p) => (p.warga?.name || p.warga?.nama_lengkap) === targetWarga.name
      );
      if (existing) {
        const payload = { jawaban_mentah: formJawaban };
        if (existing.status === 'disetujui') payload.jawaban = konversiSubkriteria(formJawaban);
        await axios.put(`${API}/admin/pengajuan/${existing.id_pengajuan}/kuesioner`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast('Data kuesioner berhasil diperbarui.');
      } else {
        await axios.post(
          `${API}/warga/pengajuan-rt`,
          { ...formDataDiri, jawaban_mentah: formJawaban },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast('Data kuesioner baru berhasil disimpan.');
      }
      setModalKuesioner(false);
      fetchData(token, userData.rt);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Verifikasi actions ── */
  const bukaVerifikasi = async (p) => {
    setSelectedP(p);
    setPesanList([]);
    setModalVerif(true);
    try {
      const r = await axios.get(`${API}/chat/${p.id_pengajuan}`, { headers: authH() });
      setPesanList(r.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil pesan:', err);
    }
  };

  const ubahStatus = async (status_baru) => {
    try {
      await axios.put(
        `${API}/admin/pengajuan/${selectedP.id_pengajuan}/status`,
        { status: status_baru },
        { headers: authH() }
      );
      if (status_baru === 'disetujui') {
        await axios.put(
          `${API}/admin/pengajuan/${selectedP.id_pengajuan}/kuesioner`,
          { jawaban: konversiSubkriteria(parseJawaban(selectedP.jawaban_mentah)) },
          { headers: authH() }
        );
      }
      setSelectedP((prev) => ({ ...prev, status: status_baru }));
      fetchData(localStorage.getItem('token'), userData.rt);
      showToast(`Status diubah ke ${status_baru === 'disetujui' ? 'Diterima' : 'Ditolak'}.`);
    } catch {
      showToast('Gagal mengubah status.', 'error');
    }
  };

  const kirimPesan = async (e) => {
    e.preventDefault();
    if (!pesanBaru.trim() || !selectedP) return;
    const teks = pesanBaru;
    setPesanList((p) => [
      ...p,
      { pengirim_role: 'rt', isi_pesan: teks, created_at: new Date().toISOString() },
    ]);
    setPesanBaru('');
    try {
      await axios.post(
        `${API}/chat/${selectedP.id_pengajuan}`,
        { isi_pesan: teks, pengirim_role: 'rt' },
        { headers: authH() }
      );
    } catch (err) {
      console.error('Gagal mengirim pesan chat:', err);
      showToast('Gagal mengirim pesan chat.', 'error');
    }
  };

  /* ── Computed ── */
  const rtNum = Number(userData.rt);
  const rankingRT = rankingAll.filter((r) => Number(r.rt) === rtNum);
  const rankingView = rankingScope === 'rt' ? rankingRT : rankingAll;
  const pendingCt = pengajuanList.filter((p) => !p.status || p.status === 'menunggu').length;
  const diterimaCt = pengajuanList.filter((p) => p.status === 'disetujui').length;
  const rankTop = rankingRT.length > 0 ? Math.min(...rankingRT.map((r) => r.rank_global)) : null;

  const navItems = [
    { key: 'beranda', icon: 'dashboard', label: 'Beranda' },
    { key: 'warga', icon: 'group', label: `Data Warga RT ${userData.rt}` },
    { key: 'kuesioner', icon: 'assignment', label: 'Input Kuesioner' },
    { key: 'verifikasi', icon: 'fact_check', label: 'Verifikasi', badge: pendingCt },
    { key: 'ranking', icon: 'leaderboard', label: 'Hasil Rekomendasi' },
  ];

  const pageTitle = {
    beranda: 'Monitor Wilayah',
    warga: `Database Warga RT ${userData.rt}`,
    kuesioner: 'Input & Edit Kuesioner',
    verifikasi: 'Verifikasi Berkas & Diskusi',
    ranking: 'Hasil Keputusan SAW',
  }[activeMenu];

  /* ── Inline input styles ── */
  const inpStyle = {
    width: '100%',
    padding: '10px 13px',
    borderRadius: 9,
    border: '1.5px solid #C6DCFF',
    background: '#FAFCFF',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13.5,
    color: '#0f172a',
    outline: 'none',
  };

  /* ══ RENDER ════════════════════════════════════════════════════════════ */
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: '#F0F6FF',
        color: '#0f172a',
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 20px',
            borderRadius: 12,
            background: toast.type === 'error' ? '#dc2626' : '#1A56DB',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,.2)',
            animation: 'fadeUp .2s ease',
            maxWidth: 320,
          }}
        >
          <MI name={toast.type === 'error' ? 'error' : 'check_circle'} fill size={17} />
          {toast.msg}
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className="no-print"
        style={{
          width: 248,
          flexShrink: 0,
          background: '#EBF3FF',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRight: '1px solid #C6DCFF',
        }}
      >
        {/* Brand (Diseragamkan dengan Admin/RW) */}
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid #C6DCFF',
            background: 'linear-gradient(135deg, #1A56DB 0%, #1e40af 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -18,
              right: -18,
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.12)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.08)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(255,255,255,.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MI name="hub" fill size={20} style={{ color: '#93c5fd' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-.3px' }}>
                BANSOS<span style={{ color: '#93c5fd' }}>HUB</span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,.6)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                }}
              >
                Portal Ketua RT
              </div>
            </div>
          </div>
        </div>

        {/* User chip */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #C6DCFF' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              background: '#D6E9FF',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: '#1A56DB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {userData.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userData.name}
              </div>
              <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>
                Ketua RT {userData.rt}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              padding: '4px 8px 10px',
            }}
          >
            Menu Utama
          </div>
          {navItems.map(({ key, icon, label, badge }) => {
            const active = activeMenu === key;
            return (
              <button
                key={key}
                onClick={() => setActiveMenu(key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 9,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 2,
                  background: active ? '#1A56DB' : 'transparent',
                  color: active ? '#fff' : '#374151',
                  transition: '.15s',
                  borderLeft: `2px solid ${active ? '#1A56DB' : 'transparent'}`,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = '#C6DCFF';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <MI name={icon} fill={active} size={18} />
                <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                {badge > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 10,
                      lineHeight: 1.6,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px', borderTop: '1px solid #C6DCFF' }}>
          <button
            onClick={() => window.print()}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '9px',
              borderRadius: 9,
              border: '1px solid #C6DCFF',
              background: 'transparent',
              color: '#374151',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#C6DCFF')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <MI name="download" size={15} /> Unduh Laporan
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '9px',
              borderRadius: 9,
              border: 'none',
              background: 'rgba(239,68,68,.1)',
              color: '#f87171',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,.1)')}
          >
            <MI name="logout" size={15} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header
          className="no-print"
          style={{
            height: 64,
            flexShrink: 0,
            background: '#fff',
            borderBottom: '1px solid #DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
          }}
        >
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {pageTitle}
            </h1>
            {loading && <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Memuat data...</p>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {activeMenu === 'warga' && (
              <button
                onClick={() => setModalWarga(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 16px',
                  background: '#1A56DB',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <MI name="person_add" size={16} /> Tambah Warga
              </button>
            )}
            {activeMenu === 'ranking' && (
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 16px',
                  background: '#FAFCFF',
                  color: '#475569',
                  border: '1px solid #DBEAFE',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <MI name="print" size={16} /> Cetak Laporan
              </button>
            )}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#F0F6FF' }}>
          {/* ════ BERANDA ════ */}
          {activeMenu === 'beranda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {[
                  {
                    label: 'Total Warga',
                    value: wargaList.length,
                    icon: 'group',
                    color: '#1d4ed8',
                    bg: '#eff6ff',
                    sub: `Terdaftar di RT ${userData.rt}`,
                  },
                  {
                    label: 'Perlu Verifikasi',
                    value: pendingCt,
                    icon: 'pending_actions',
                    color: '#ca8a04',
                    bg: '#fef9c3',
                    sub: 'Pengajuan pending',
                  },
                  {
                    label: 'Warga Disetujui',
                    value: diterimaCt,
                    icon: 'verified',
                    color: '#059669',
                    bg: '#ecfdf5',
                    sub: 'Sudah terverifikasi',
                  },
                  {
                    label: 'Rank Global Terbaik',
                    value: rankTop ? `#${rankTop}` : '-',
                    icon: 'emoji_events',
                    color: '#7c3aed',
                    bg: '#f5f3ff',
                    sub: rankTop
                      ? `${rankingRT[0]?.nama_warga?.split(' ')[0] || ''}...`
                      : 'Belum ada data',
                  },
                ].map(({ label, value, icon, color, bg, sub }) => (
                  <div
                    key={label}
                    style={{
                      background: '#fff',
                      borderRadius: 14,
                      padding: '20px 22px',
                      border: '1px solid #DBEAFE',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 11,
                          background: bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MI name={icon} fill size={21} style={{ color }} />
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#94a3b8',
                          background: '#FAFCFF',
                          padding: '3px 8px',
                          borderRadius: 5,
                          border: '1px solid #DBEAFE',
                        }}
                      >
                        Live
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{label}</div>
                      <div
                        style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}
                      >
                        {value}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#94a3b8',
                          marginTop: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Banner */}
              <div
                style={{
                  borderRadius: 16,
                  padding: '26px 32px',
                  background: 'linear-gradient(135deg, #1A56DB 0%, #1e40af 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ maxWidth: '60%' }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#000000',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                      marginBottom: 8,
                    }}
                  >
                    Pusat Kendali RT {userData.rt}
                  </div>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#fff',
                      margin: '0 0 8px',
                      lineHeight: 1.3,
                    }}
                  >
                    Verifikasi &amp; Kelola Data Warga
                  </h2>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: 'rgba(255,255,255,.9)',
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    Pastikan setiap kuesioner warga terisi dan terverifikasi. Terdapat{' '}
                    <strong style={{ color: '#fff' }}>{pendingCt} pengajuan</strong> yang menunggu
                    tindakan Anda.
                  </p>
                </div>
                <button
                  onClick={() => setActiveMenu('verifikasi')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 22px',
                    background: '#fff',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <MI name="fact_check" fill size={18} /> Buka Verifikasi
                </button>
              </div>

              {/* Two columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {/* Pengajuan terbaru */}
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    border: '1px solid #DBEAFE',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        Pengajuan Masuk
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        {pengajuanList.length} total dari wilayah Anda
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveMenu('verifikasi')}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#1A56DB',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Semua
                    </button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F0F6FF', borderBottom: '1px solid #DBEAFE' }}>
                        {['Nama Warga', 'Status', 'Aksi'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '9px 16px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#64748b',
                              textAlign: 'left',
                              textTransform: 'uppercase',
                              letterSpacing: '.06em',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pengajuanList.slice(0, 6).map((p, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: '1px solid #EBF3FF' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '10px 16px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                              {p.warga?.nama_lengkap || p.warga?.name || '-'}
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>
                              {fmtDate(p.created_at)}
                            </div>
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <Badge status={p.status} />
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <button
                              onClick={() => bukaVerifikasi(p)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: '#EBF3FF',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#1A56DB',
                              }}
                            >
                              <MI name="open_in_new" size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pengajuanList.length === 0 && (
                        <tr>
                          <td
                            colSpan="3"
                            style={{
                              padding: '32px',
                              textAlign: 'center',
                              color: '#94a3b8',
                              fontSize: 13,
                            }}
                          >
                            Belum ada pengajuan masuk.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Antrian verifikasi */}
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    border: '1px solid #DBEAFE',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      Antrian Verifikasi
                    </div>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {pendingCt}
                    </span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {pengajuanList
                      .filter((p) => !p.status || p.status === 'menunggu')
                      .slice(0, 4)
                      .map((p, i) => (
                        <div
                          key={i}
                          onClick={() => bukaVerifikasi(p)}
                          style={{
                            display: 'flex',
                            gap: 12,
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: '1px solid #DBEAFE',
                            cursor: 'pointer',
                            transition: '.15s',
                            background: '#FAFCFF',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#1A56DB';
                            e.currentTarget.style.background = '#f0f7ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#C6DCFF';
                            e.currentTarget.style.background = '#f8fafc';
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 9,
                              background: '#fef2f2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <MI name="gpp_maybe" fill size={18} style={{ color: '#dc2626' }} />
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#0f172a',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {p.warga?.nama_lengkap || p.warga?.name || 'Warga'}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                              Menunggu persetujuan &bull; {fmtDate(p.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    {pendingCt === 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '32px 0',
                          gap: 8,
                        }}
                      >
                        <MI name="check_circle" fill size={36} style={{ color: '#22c55e' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                          Semua telah diverifikasi
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderTop: '1px solid #f1f5f9',
                      textAlign: 'center',
                    }}
                  >
                    <button
                      onClick={() => setActiveMenu('verifikasi')}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#1A56DB',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Lihat Semua
                    </button>
                  </div>
                </div>
              </div>

              {/* Top 5 RT */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #DBEAFE',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '16px 22px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    Top 5 Peringkat RT {userData.rt}
                  </div>
                  <button
                    onClick={() => setActiveMenu('ranking')}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#1A56DB',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Selengkapnya
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F0F6FF', borderBottom: '1px solid #DBEAFE' }}>
                      {['Peringkat Global', 'Nama Warga', 'Nilai (V)'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 18px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#64748b',
                            textAlign: 'left',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rankingRT.slice(0, 5).map((r, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: '1px solid #EBF3FF' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '11px 18px' }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: r.rank_global <= 3 ? '#0051d5' : '#f1f5f9',
                              color: r.rank_global <= 3 ? '#fff' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            {r.rank_global}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '11px 18px',
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: '#0f172a',
                          }}
                        >
                          {r.nama_warga}
                        </td>
                        <td
                          style={{
                            padding: '11px 18px',
                            fontSize: 14,
                            fontWeight: 800,
                            color: '#1A56DB',
                            fontFamily: 'monospace',
                          }}
                        >
                          {Number(r.skor_saw).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                    {rankingRT.length === 0 && (
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            padding: '32px',
                            textAlign: 'center',
                            color: '#94a3b8',
                            fontSize: 13,
                          }}
                        >
                          Belum ada data peringkat. Admin perlu menjalankan kalkulasi SAW.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ DATA WARGA ════ */}
          {activeMenu === 'warga' && (
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                border: '1px solid #DBEAFE',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 22px',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#FAFCFF',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Data Warga RT {userData.rt}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                  {wargaList.length} warga terdaftar di wilayah Anda
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F0F6FF', borderBottom: '1px solid #DBEAFE' }}>
                    {['No', 'Nama Lengkap', 'Alamat Domisili', 'Status Kuesioner', 'Aksi'].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: '11px 18px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#64748b',
                            textAlign: 'left',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {wargaList.map((w, i) => {
                    const sudahAda = pengajuanList.some(
                      (p) => (p.warga?.name || p.warga?.nama_lengkap) === w.name
                    );
                    return (
                      <tr
                        key={w.id}
                        style={{ borderBottom: '1px solid #EBF3FF' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td
                          style={{
                            padding: '13px 18px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#94a3b8',
                          }}
                        >
                          {i + 1}
                        </td>
                        <td style={{ padding: '13px 18px' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                            {w.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#94a3b8',
                              marginTop: 2,
                              fontFamily: 'monospace',
                            }}
                          >
                            {w.username}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '13px 18px',
                            fontSize: 12.5,
                            color: '#64748b',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={w.alamat}
                        >
                          {w.alamat || '-'}
                        </td>
                        <td style={{ padding: '13px 18px' }}>
                          {sudahAda ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 700,
                                background: '#dcfce7',
                                color: '#15803d',
                              }}
                            >
                              <MI name="check_circle" fill size={12} /> Sudah Diisi
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 700,
                                background: '#fef9c3',
                                color: '#a16207',
                              }}
                            >
                              <MI name="schedule" size={12} /> Belum Diisi
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '13px 18px' }}>
                          <button
                            onClick={() => bukaKuesioner(w)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '7px 14px',
                              borderRadius: 8,
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 700,
                              background: sudahAda ? '#f0fdf4' : '#eff6ff',
                              color: sudahAda ? '#15803d' : '#0051d5',
                              transition: '.15s',
                            }}
                          >
                            <MI name={sudahAda ? 'edit_document' : 'assignment_add'} size={15} />
                            {sudahAda ? 'Edit Kuesioner' : 'Isi Kuesioner'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {wargaList.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          padding: '48px',
                          textAlign: 'center',
                          color: '#94a3b8',
                          fontSize: 13,
                        }}
                      >
                        Belum ada warga terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ════ KUESIONER ════ */}
          {activeMenu === 'kuesioner' && (
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                border: '1px solid #DBEAFE',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 22px',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#FAFCFF',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Manajemen Kuesioner
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                  Pilih warga untuk mengisi atau mengedit data kuesioner
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F0F6FF', borderBottom: '1px solid #DBEAFE' }}>
                    {['No', 'Nama Warga', 'Progres Kuesioner', 'Aksi'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '11px 18px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#64748b',
                          textAlign: 'left',
                          textTransform: 'uppercase',
                          letterSpacing: '.06em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wargaList.map((w, i) => {
                    const p = pengajuanList.find(
                      (x) => (x.warga?.name || x.warga?.nama_lengkap) === w.name
                    );
                    const sudah = !!p;
                    const jawObj = p ? parseJawaban(p.jawaban_mentah) : null;
                    const pct = jawObj
                      ? Object.values(jawObj).filter((v) => v && v !== '-').length
                      : 0;
                    return (
                      <tr
                        key={w.id}
                        style={{ borderBottom: '1px solid #EBF3FF' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td
                          style={{
                            padding: '14px 18px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#94a3b8',
                          }}
                        >
                          {i + 1}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                            {w.name}
                          </div>
                          {p && (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                              Status:{' '}
                              <span style={{ fontWeight: 600, color: statusCfg(p.status).color }}>
                                {statusCfg(p.status).label}
                              </span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {sudah ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  height: 6,
                                  width: 100,
                                  borderRadius: 4,
                                  background: '#e2e8f0',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    borderRadius: 4,
                                    background: pct === 10 ? '#22c55e' : '#0051d5',
                                    width: `${(pct / 10) * 100}%`,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: pct === 10 ? '#15803d' : '#0f172a',
                                }}
                              >
                                {pct}/10
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>Belum ada data</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <button
                            onClick={() => bukaKuesioner(w)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 16px',
                              borderRadius: 9,
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 700,
                              background: sudah ? '#f1f5f9' : '#0051d5',
                              color: sudah ? '#0f172a' : '#fff',
                              transition: '.15s',
                            }}
                          >
                            <MI name={sudah ? 'edit' : 'add'} size={15} />
                            {sudah ? 'Perbarui Data' : 'Isi Sekarang'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {wargaList.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          padding: '48px',
                          textAlign: 'center',
                          color: '#94a3b8',
                          fontSize: 13,
                        }}
                      >
                        Belum ada warga. Tambahkan warga terlebih dahulu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ════ VERIFIKASI ════ */}
          {activeMenu === 'verifikasi' && (
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                border: '1px solid #DBEAFE',
                overflow: 'hidden',
              }}
            >
              <div className="print-header" style={{ display: 'none' }}>
                <h2>LAPORAN VERIFIKASI — RT {userData.rt}</h2>
                <p>
                  Dicetak: {new Date().toLocaleString('id-ID')} &nbsp;|&nbsp; Oleh: {userData.name}
                </p>
              </div>
              <div
                style={{
                  padding: '16px 22px',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#FAFCFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    Daftar Pengajuan Masuk
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                    Klik "Tinjau" untuk membuka detail dan chat
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    fontSize: 12,
                    color: '#64748b',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: '#fef9c3',
                      color: '#a16207',
                    }}
                  >
                    {pendingCt} Pending
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: '#dcfce7',
                      color: '#15803d',
                    }}
                  >
                    {diterimaCt} Diterima
                  </span>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F0F6FF', borderBottom: '1px solid #DBEAFE' }}>
                    {['No', 'Nama Pengaju', 'Tanggal Masuk', 'Status', 'Aksi'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '11px 18px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#64748b',
                          textAlign: 'left',
                          textTransform: 'uppercase',
                          letterSpacing: '.06em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pengajuanList.map((p, i) => (
                    <tr
                      key={p.id_pengajuan}
                      style={{ borderBottom: '1px solid #EBF3FF' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td
                        style={{
                          padding: '13px 18px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#94a3b8',
                        }}
                      >
                        {i + 1}
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                          {p.warga?.nama_lengkap || p.warga?.name || '-'}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                          RT {p.warga?.rt || userData.rt}
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 12.5, color: '#64748b' }}>
                        {fmtDate(p.created_at)}
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <Badge status={p.status} />
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <button
                          onClick={() => bukaVerifikasi(p)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '7px 14px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 700,
                            background: '#EBF3FF',
                            color: '#1A56DB',
                          }}
                        >
                          <MI name="visibility" size={15} /> Tinjau
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pengajuanList.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          padding: '48px',
                          textAlign: 'center',
                          color: '#94a3b8',
                          fontSize: 13,
                        }}
                      >
                        Belum ada pengajuan dari wilayah Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ════ RANKING ════ */}
          {activeMenu === 'ranking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="print-header" style={{ display: 'none' }}>
                <h2>HASIL REKOMENDASI SAW — RT {userData.rt}</h2>
                <p>
                  Dicetak: {new Date().toLocaleString('id-ID')} &nbsp;|&nbsp; Oleh: {userData.name}
                </p>
              </div>

              {/* Scope toggle */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { key: 'rt', icon: 'home', label: `Wilayah RT ${userData.rt}` },
                  { key: 'global', icon: 'public', label: 'Seluruh Wilayah' },
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setRankingScope(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '9px 18px',
                      borderRadius: 10,
                      border: `1.5px solid ${rankingScope === key ? '#0051d5' : '#e2e8f0'}`,
                      background: rankingScope === key ? '#0051d5' : '#fff',
                      color: rankingScope === key ? '#fff' : '#475569',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: '.15s',
                    }}
                  >
                    <MI name={icon} size={16} /> {label}
                  </button>
                ))}
              </div>

              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #DBEAFE',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '18px 22px',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#FAFCFF',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    Peringkat Prioritas Penerima Bansos —{' '}
                    {rankingScope === 'rt' ? `RT ${userData.rt}` : 'Global'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                    Nilai tertinggi = prioritas utama penerima
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F0F6FF', borderBottom: '1px solid #DBEAFE' }}>
                      {['Peringkat', 'Nama Warga', 'RT', 'Nilai Preferensi (V)'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '11px 18px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#64748b',
                            textAlign: 'left',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rankingView.map((r, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: '1px solid #EBF3FF' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '13px 18px' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: r.rank_global <= 3 ? '#0051d5' : '#f1f5f9',
                              color: r.rank_global <= 3 ? '#fff' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                            }}
                          >
                            {r.rank_global}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '13px 18px',
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: '#0f172a',
                          }}
                        >
                          {r.nama_warga}
                        </td>
                        <td style={{ padding: '13px 18px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '3px 9px',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: '#EBF3FF',
                              color: '#1d4ed8',
                            }}
                          >
                            RT {r.rt}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '13px 18px',
                            fontSize: 15,
                            fontWeight: 800,
                            color: r.rank_global <= 3 ? '#0051d5' : '#334155',
                            fontFamily: 'monospace',
                          }}
                        >
                          {Number(r.skor_saw).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                    {rankingView.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          style={{
                            padding: '48px',
                            textAlign: 'center',
                            color: '#94a3b8',
                            fontSize: 13,
                          }}
                        >
                          Belum ada data. Admin perlu menjalankan kalkulasi SAW.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div
                  style={{
                    padding: '12px 22px',
                    borderTop: '1px solid #f1f5f9',
                    background: '#FAFCFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    Menampilkan {rankingView.length} data
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL: TAMBAH WARGA ── */}
      {modalWarga && (
        <Overlay onClose={() => setModalWarga(false)}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 24px 48px rgba(0,0,0,.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #DBEAFE',
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  Tambah Warga Baru
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Warga akan otomatis masuk ke RT {userData.rt}
                </div>
              </div>
              <button
                onClick={() => setModalWarga(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: '#F0F6FF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MI name="close" size={18} style={{ color: '#64748b' }} />
              </button>
            </div>
            <form
              onSubmit={simpanWarga}
              style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {[
                { label: 'Nama Lengkap', key: 'name', type: 'text', ph: 'Nama lengkap' },
                { label: 'Username', key: 'username', type: 'text', ph: 'username_akses' },
                { label: 'Password', key: 'password', type: 'password', ph: 'Min. 6 karakter' },
              ].map(({ label, key, type, ph }) => (
                <div key={key}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      marginBottom: 6,
                    }}
                  >
                    {label} *
                  </label>
                  <input
                    type={type}
                    required
                    placeholder={ph}
                    value={formWarga[key]}
                    onChange={(e) => setFormWarga({ ...formWarga, [key]: e.target.value })}
                    style={{ ...inpStyle }}
                    onFocus={(e) => (e.target.style.borderColor = '#1A56DB')}
                    onBlur={(e) => (e.target.style.borderColor = '#C6DCFF')}
                  />
                </div>
              ))}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    marginBottom: 6,
                  }}
                >
                  Alamat Domisili
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap"
                  value={formWarga.alamat}
                  onChange={(e) => setFormWarga({ ...formWarga, alamat: e.target.value })}
                  style={{ ...inpStyle, resize: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = '#1A56DB')}
                  onBlur={(e) => (e.target.style.borderColor = '#C6DCFF')}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setModalWarga(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 9,
                    border: '1.5px solid #C6DCFF',
                    background: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    borderRadius: 9,
                    border: 'none',
                    background: '#1A56DB',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#fff',
                  }}
                >
                  Simpan Warga
                </button>
              </div>
            </form>
          </div>
        </Overlay>
      )}

      {/* ── MODAL: KUESIONER ── */}
      {modalKuesioner && targetWarga && (
        <Overlay onClose={() => setModalKuesioner(false)}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0,0,0,.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #DBEAFE',
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  Kuesioner: {targetWarga.name}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {Object.values(formJawaban).filter(Boolean).length}/10 pertanyaan terjawab
                </div>
              </div>
              <button
                onClick={() => setModalKuesioner(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: '#F0F6FF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MI name="close" size={18} style={{ color: '#64748b' }} />
              </button>
            </div>
            <div
              style={{
                overflowY: 'auto',
                padding: '20px 24px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              {LABELS.map((label, idx) => {
                const key = `q${idx + 1}`;
                return (
                  <div
                    key={key}
                    style={{
                      padding: '18px 20px',
                      borderRadius: 12,
                      border: `1.5px solid ${formJawaban[key] ? '#bfdbfe' : '#e2e8f0'}`,
                      background: formJawaban[key] ? '#f0f9ff' : '#fff',
                      transition: '.15s',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}
                    >
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 700,
                          background: formJawaban[key] ? '#0051d5' : '#e2e8f0',
                          color: formJawaban[key] ? '#fff' : '#94a3b8',
                          transition: '.15s',
                        }}
                      >
                        C{idx + 1}
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', flex: 1 }}>
                        {label}
                      </span>
                      {formJawaban[key] && (
                        <MI name="check_circle" fill size={16} style={{ color: '#22c55e' }} />
                      )}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))',
                        gap: 8,
                      }}
                    >
                      {(OPSI[key] || []).map((opt) => (
                        <div
                          key={opt}
                          onClick={() => setFormJawaban({ ...formJawaban, [key]: opt })}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '10px 13px',
                            borderRadius: 9,
                            border: `1.5px solid ${formJawaban[key] === opt ? '#0051d5' : '#e2e8f0'}`,
                            background: formJawaban[key] === opt ? '#eff6ff' : '#f8fafc',
                            cursor: 'pointer',
                            transition: '.12s',
                          }}
                        >
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              border: `2px solid ${formJawaban[key] === opt ? '#0051d5' : '#cbd5e1'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            {formJawaban[key] === opt && (
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
                              color: formJawaban[key] === opt ? '#1d4ed8' : '#475569',
                              lineHeight: 1.45,
                              fontWeight: formJawaban[key] === opt ? 600 : 400,
                            }}
                          >
                            {opt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Terjawab:{' '}
                <strong
                  style={{
                    color:
                      Object.values(formJawaban).filter(Boolean).length === 10
                        ? '#15803d'
                        : '#0f172a',
                  }}
                >
                  {Object.values(formJawaban).filter(Boolean).length}
                </strong>
                /10
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setModalKuesioner(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 9,
                    border: '1.5px solid #C6DCFF',
                    background: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={submitKuesioner}
                  disabled={loading}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 9,
                    border: 'none',
                    background: loading ? '#93c5fd' : '#0051d5',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading ? 'default' : 'pointer',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <MI name={loading ? 'hourglass_empty' : 'save'} size={16} />
                  {loading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── MODAL: VERIFIKASI + CHAT ── */}
      {modalVerif && selectedP && (
        <Overlay onClose={() => setModalVerif(false)}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 940,
              height: '88vh',
              display: 'flex',
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(0,0,0,.2)',
            }}
          >
            {/* Kiri: Detail jawaban */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{ padding: '18px 22px', borderBottom: '1px solid #DBEAFE', flexShrink: 0 }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  {selectedP.warga?.nama_lengkap || selectedP.warga?.name || '-'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                  RT {selectedP.warga?.rt || userData.rt} &bull; Masuk{' '}
                  {fmtDate(selectedP.created_at)} &bull; <Badge status={selectedP.status} />
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {LABELS.map((label, idx) => {
                  const obj = parseJawaban(selectedP.jawaban_mentah);
                  const val = obj?.[`q${idx + 1}`] || '-';
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: '#FAFCFF',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: '#6B7280',
                          textTransform: 'uppercase',
                          letterSpacing: '.06em',
                          marginBottom: 3,
                        }}
                      >
                        C{idx + 1} &mdash; {label}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{val}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kanan: Verifikasi & chat */}
            <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid #DBEAFE',
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  Verifikasi &amp; Chat
                </div>
                <button
                  onClick={() => setModalVerif(false)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    border: 'none',
                    background: '#F0F6FF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MI name="close" size={17} style={{ color: '#64748b' }} />
                </button>
              </div>

              {/* Tombol keputusan */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #DBEAFE',
                  flexShrink: 0,
                  display: 'flex',
                  gap: 10,
                }}
              >
                <button
                  onClick={() => ubahStatus('disetujui')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 9,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                    background: selectedP.status === 'disetujui' ? '#15803d' : '#dcfce7',
                    color: selectedP.status === 'disetujui' ? '#fff' : '#15803d',
                    transition: '.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <MI name="check_circle" fill size={16} /> Terima
                </button>
                <button
                  onClick={() => ubahStatus('ditolak')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 9,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                    background: selectedP.status === 'ditolak' ? '#dc2626' : '#fee2e2',
                    color: selectedP.status === 'ditolak' ? '#fff' : '#dc2626',
                    transition: '.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <MI name="cancel" fill size={16} /> Tolak
                </button>
              </div>

              {/* Chat area */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  background: '#fafcff',
                }}
              >
                {pesanList.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
                    <MI
                      name="chat_bubble_outline"
                      size={32}
                      style={{ display: 'block', margin: '0 auto 10px', opacity: 0.4 }}
                    />
                    <div style={{ fontSize: 12.5 }}>Belum ada pesan.</div>
                  </div>
                ) : (
                  pesanList.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: m.pengirim_role === 'rt' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#94a3b8',
                          marginBottom: 3,
                          textAlign: m.pengirim_role === 'rt' ? 'right' : 'left',
                        }}
                      >
                        {m.pengirim_role === 'rt' ? 'ANDA (RT)' : 'WARGA'}
                      </div>
                      <div
                        style={{
                          padding: '10px 13px',
                          borderRadius: 12,
                          background: m.pengirim_role === 'rt' ? '#0051d5' : '#fff',
                          color: m.pengirim_role === 'rt' ? '#fff' : '#0f172a',
                          fontSize: 13,
                          lineHeight: 1.5,
                          border: m.pengirim_role !== 'rt' ? '1px solid #e2e8f0' : 'none',
                          boxShadow: '0 1px 3px rgba(0,0,0,.05)',
                          borderBottomRightRadius: m.pengirim_role === 'rt' ? 3 : 12,
                          borderBottomLeftRadius: m.pengirim_role !== 'rt' ? 3 : 12,
                        }}
                      >
                        {m.isi_pesan}
                        <div
                          style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}
                        >
                          {fmtTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input chat */}
              <form
                onSubmit={kirimPesan}
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '12px 16px',
                  borderTop: '1px solid #e2e8f0',
                  flexShrink: 0,
                  background: '#fff',
                }}
              >
                <input
                  value={pesanBaru}
                  onChange={(e) => setPesanBaru(e.target.value)}
                  placeholder="Tulis balasan untuk warga..."
                  style={{
                    flex: 1,
                    padding: '10px 13px',
                    borderRadius: 9,
                    border: '1.5px solid #C6DCFF',
                    background: '#FAFCFF',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13,
                    color: '#0f172a',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1A56DB')}
                  onBlur={(e) => (e.target.style.borderColor = '#C6DCFF')}
                />
                <button
                  type="submit"
                  disabled={!pesanBaru.trim()}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 9,
                    border: 'none',
                    background: pesanBaru.trim() ? '#0051d5' : '#e2e8f0',
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
          </div>
        </Overlay>
      )}
    </div>
  );
}
