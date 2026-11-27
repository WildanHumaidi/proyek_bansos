import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RankingWarnings from '../components/RankingWarnings';
import PengaduanPanel from '../components/PengaduanPanel';
import { rtLabel, rtInt } from '../lib/rt';
import { unduhLaporanSaw } from '../lib/report';
import { pasangLabelTabel } from '../lib/mobTable';

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

/* ─── Design Bootstrap ───────────────────────────────────────────────────── */
function useDesign() {
  useEffect(() => {
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
          th,td { padding:4px 7px!important; border:1px solid #475569!important; word-break:break-word!important; }
          th { background:#dbeafe!important; font-weight:700!important; }
          tr { page-break-inside:avoid; }
          .badge-screen { display:none!important; }
          .print-status { display:inline!important; font-weight:700!important; font-size:8.5px!important; }
          img,.material-symbols-outlined { display:none!important; }
        }
        .print-status { display:none; }
        .badge-screen { display:inline-flex; }
        /* ── Responsif HP: sidebar jadi overlay + konten penuh layar ── */
        @media (max-width: 900px) {
          .rt-sidebar {
            position: fixed !important; top: 0; left: 0; bottom: 0;
            width: 256px !important; max-width: 82vw;
            z-index: 200;
            transform: translateX(-102%);
            transition: transform .22s ease;
            box-shadow: 0 0 0 0 rgba(15,23,42,.35);
          }
          .rt-sidebar.open { transform: translateX(0); box-shadow: 0 0 0 100vmax rgba(15,23,42,.35); }
          .rt-main { min-height: 0; }
          .rt-header { padding: 0 12px !important; height: 56px !important; gap: 8px; }
          .rt-header-title { font-size: 14px !important; }
          .rt-main-pad { padding: 16px 12px !important; }
          .rt-burger { display: inline-flex !important; }
        }
        @media print { .rt-burger, .rt-scrim { display:none!important; } }
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
    return { label: 'DITERIMA', bg: '#dcfce7', color: '#166534', dot: '#15803d' };
  if (s === 'ditolak') return { label: 'DITOLAK', bg: '#fee2e2', color: '#b91c1c', dot: '#b91c1c' };
  return { label: 'PENDING', bg: '#fef9c3', color: '#92400e', dot: '#92400e' };
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
  q1: [
    '> 3 KK',
    '3 KK',
    '2 KK',
    '1 KK',
  ],
  q2: [
    '> 6 Orang',
    '5 Orang',
    '4 Orang',
    '1 - 3 Orang',
  ],
  q3: [
    'Tidak Sekolah / Tidak Tamat SD',
    'SD',
    'SMP',
    'SMA / SMK / PT',
  ],
  q4: [
    '> 3 Orang',
    '2 Orang',
    '1 Orang',
    'Tidak Ada',
  ],
  q5: [
    '< 400 Ribu',
    '400 - 700 Ribu',
    '700 Ribu - 1 Juta',
    '> 1 Juta',
  ],
  q6: [
    '< 400 Ribu',
    '400 - 700 Ribu',
    '700 Ribu - 1 Juta',
    '> 1 Juta',
  ],
  q7: [
    'Magersari / Pakai Gratis',
    'Sewa < 1 Juta',
    'Milik Orang Tua / Warisan',
    'Milik Sendiri / Sewa',
  ],
  q8: [
    'Sumur Milik Tetangga',
    'Sumur Milik Sendiri',
    'PDAM Terbatas',
    'PDAM Bebas / Air Kemasan',
  ],
  q9: [
    'Listrik Numpang',
    'Listrik 450 watt',
    'Listrik 900 watt',
    'Listrik > 900 watt',
  ],
  q10: [
    'Jalan Kaki / Sepeda / Motor Seadanya',
    'Sepeda Motor 1 Buah, dalam Kondisi Baik',
    'Sepeda Motor > 1 Buah, dalam Kondisi Baik',
    'Mobil',
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

/* Pengajuan lama (impor sebelum jawaban mentah disimpan) hanya punya matriks
 * penilaian. Label sub-kriteria adalah jawaban kanonik yang tercatat, jadi
 * jawaban bisa disusun ulang dari sana — bukan ditampilkan kosong. */
const jawabanDariMatriks = (pengajuan) => {
  const baris = pengajuan?.penilaian || [];
  if (baris.length !== 10) return null;
  const jawaban = {};
  for (const pn of baris) {
    const label = pn.sub_kriteria?.keterangan;
    if (!label || !pn.id_kriteria) return null;
    jawaban[`q${pn.id_kriteria}`] = label;
  }
  return jawaban;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [wargaList, setWargaList] = useState([]);
  const [pengajuanList, setPengajuanList] = useState([]);
  const [rankingAll, setRankingAll] = useState([]);
  const [dilewati, setDilewati] = useState([]);
  const [kriteriaTanpaVariasi, setKriteriaTanpaVariasi] = useState([]);
  const [rankingError, setRankingError] = useState(null);

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
      const rtNum = rtInt(rt);
      try {
        if (['beranda', 'warga', 'kuesioner'].includes(activeMenu)) {
          const r = await axios.get(`${API}/rt/warga`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setWargaList(
            (r.data.data || []).filter((w) => rtInt(w.rt) === rtNum)
          );
        }
        if (['beranda', 'verifikasi', 'warga', 'kuesioner'].includes(activeMenu)) {
          const r = await axios.get(`${API}/admin/pengajuan`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPengajuanList((r.data.data || []).filter((p) => rtInt(p.warga?.rt) === rtNum));
        }
        if (['beranda', 'ranking'].includes(activeMenu)) {
          // Backend sudah membatasi hasil ke RT ini (P0-06) dan mengirim
          // ranking_rt (BUG-08). Tidak ada lagi filter/penomoran di klien.
          const r = await axios.get(`${API}/saw/hitung?t=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRankingAll(r.data.data || []);
          setDilewati(r.data.dilewati || []);
          setKriteriaTanpaVariasi(r.data.kriteria_tanpa_variasi || []);
          setRankingError(null);
        }
      } catch (e) {
        console.error('Gagal memuat data RT:', e);
        // Token kedaluwarsa/dicabut: jangan tinggalkan data lama di layar.
        if (e.response?.status === 401) {
          localStorage.clear();
          navigate('/login', { replace: true });
          return;
        }
        if (['beranda', 'ranking'].includes(activeMenu)) {
          setRankingError(
            e.response?.data?.message || 'Server tidak merespons. Muat ulang halaman atau jalankan kalkulasi lagi.'
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [activeMenu, navigate]
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
  }, [pesanList.length]);

  /* Polling percakapan di modal verifikasi. Sebelumnya pesan hanya dimuat sekali
     saat modal dibuka, jadi balasan warga baru terlihat setelah modal ditutup dan
     dibuka ulang. Polling hanya hidup selama modal terbuka dan tab terlihat. */
  useEffect(() => {
    const idPengajuan = selectedP?.id_pengajuan;
    if (!modalVerif || !idPengajuan) return;

    let berhenti = false;

    const muatPesan = async () => {
      if (berhenti || document.visibilityState !== 'visible') return;
      try {
        const r = await axios.get(`${API}/chat/${idPengajuan}`, { headers: authH() });
        if (berhenti) return;

        const dariServer = r.data.data || [];
        setPesanList((lama) => {
          const lokal = lama.filter((m) => m.temp_id);
          const tidakBerubah =
            lokal.length === 0 &&
            lama.length === dariServer.length &&
            dariServer.every((s, i) => s.id_pesan === lama[i].id_pesan);
          return tidakBerubah ? lama : [...dariServer, ...lokal];
        });
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403 || status === 404) berhenti = true;
      }
    };

    const timer = setInterval(muatPesan, 15000);
    const saatTampil = () => {
      if (document.visibilityState === 'visible') muatPesan();
    };
    document.addEventListener('visibilitychange', saatTampil);

    return () => {
      berhenti = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', saatTampil);
    };
  }, [modalVerif, selectedP?.id_pengajuan]);

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
    const existing = pengajuanList.find((p) => Number(p.id_warga) === Number(warga.id_warga));
    setFormJawaban(
      parseJawaban(existing?.jawaban_mentah) || jawabanDariMatriks(existing) || KOSONG_JAWABAN
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
      const existing = pengajuanList.find((p) => Number(p.id_warga) === Number(targetWarga.id_warga));
      if (existing) {
        await axios.put(
          `${API}/admin/pengajuan/${existing.id_pengajuan}/kuesioner`,
          { jawaban_mentah: formJawaban },
          { headers: authH() }
        );
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
      // Backend sudah membentuk matriks penilaian di dalam transaksi yang sama
      // saat status diubah menjadi 'disetujui'.
      await axios.put(
        `${API}/admin/pengajuan/${selectedP.id_pengajuan}/status`,
        { status: status_baru },
        { headers: authH() }
      );
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
    const teks = pesanBaru,
      tempId = `pending-${Date.now()}`;
    setPesanList((p) => [
      ...p,
      {
        temp_id: tempId,
        pengirim_role: 'rt',
        isi_pesan: teks,
        created_at: new Date().toISOString(),
        status_kirim: 'pending',
      },
    ]);
    setPesanBaru('');
    try {
      await axios.post(
        `${API}/chat/${selectedP.id_pengajuan}`,
        { isi_pesan: teks },
        { headers: authH() }
      );
      // Ambil ulang dari server: pesan lokal masih bertanda `temp_id`, sehingga
      // kalau dibiarkan akan tampil ganda saat polling berikutnya.
      const r = await axios.get(`${API}/chat/${selectedP.id_pengajuan}`, { headers: authH() });
      setPesanList(r.data.data || []);
    } catch (err) {
      console.error('Gagal mengirim pesan chat:', err);
      setPesanList((p) =>
        p.map((m) => (m.temp_id === tempId ? { ...m, status_kirim: 'failed' } : m))
      );
      showToast('Gagal mengirim pesan chat.', 'error');
    }
  };

  const hapusPesanGagal = (tempId) => {
    setPesanList((p) => p.filter((m) => m.temp_id !== tempId));
  };

  /* ── Computed ── */
  const rankingRT = rankingAll;
  const rankingView = rankingAll;
  const pendingCt = pengajuanList.filter((p) => !p.status || p.status === 'menunggu').length;
  const diterimaCt = pengajuanList.filter((p) => p.status === 'disetujui').length;

  // Tabel berubah jadi kartu di HP dan butuh label kolom di tiap sel.
  useEffect(() => {
    pasangLabelTabel();
  });

  const navItems = [
    { key: 'beranda', icon: 'dashboard', label: 'Beranda' },
    { key: 'warga', icon: 'group', label: `Data Warga ${rtLabel(userData.rt)}` },
    { key: 'kuesioner', icon: 'assignment', label: 'Input Kuesioner' },
    { key: 'verifikasi', icon: 'fact_check', label: 'Verifikasi', badge: pendingCt },
    { key: 'pengaduan', icon: 'campaign', label: 'Pengaduan' },
    { key: 'ranking', icon: 'leaderboard', label: 'Hasil Rekomendasi' },
  ];

  const pageTitle = {
    beranda: 'Monitor Wilayah',
    warga: `Database Warga ${rtLabel(userData.rt)}`,
    kuesioner: 'Input & Edit Kuesioner',
    verifikasi: 'Verifikasi Berkas & Diskusi',
    pengaduan: 'Pengaduan Warga',
    ranking: 'Hasil Keputusan SAW',
  }[activeMenu];

  /* ── Inline input styles ── */
  const inpStyle = {
    width: '100%',
    padding: '10px 13px',
    borderRadius: 9,
    border: '1.5px solid #a9c7f0',
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
            background: toast.type === 'error' ? '#b91c1c' : '#0b3fa8',
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
        className={`no-print rt-sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: 248,
          flexShrink: 0,
          background: '#EBF3FF',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRight: '1px solid #a9c7f0',
        }}
      >
        {/* Brand (Diseragamkan dengan Admin/RW) */}
        <div
          className="rt-sidebar-brand"
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid #a9c7f0',
            background: 'linear-gradient(135deg, #0b3fa8 0%, #062b6e 100%)',
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
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #a9c7f0' }}>
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
                background: '#0b3fa8',
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
              <div style={{ fontSize: 11, color: '#bfdbfe', fontWeight: 600 }}>
                Ketua {rtLabel(userData.rt)}
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
              color: '#475569',
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
                onClick={() => {
                  setActiveMenu(key);
                  setSidebarOpen(false);
                }}
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
                  background: active ? '#0b3fa8' : 'transparent',
                  color: active ? '#fff' : '#374151',
                  transition: '.15s',
                  borderLeft: `2px solid ${active ? '#0b3fa8' : 'transparent'}`,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = '#a9c7f0';
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
                      background: '#b91c1c',
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
        <div style={{ padding: '12px', borderTop: '1px solid #a9c7f0' }}>
          <button
            onClick={() => unduhLaporanSaw('csv')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '9px',
              borderRadius: 9,
              border: '1px solid #a9c7f0',
              background: 'transparent',
              color: '#374151',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#a9c7f0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <MI name="download" size={15} /> Unduh Laporan
          </button>
          <button
            onClick={() => navigate('/ganti-password')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '9px',
              borderRadius: 9,
              border: '1px solid #a9c7f0',
              background: 'transparent',
              color: '#374151',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: '.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#a9c7f0';
              e.currentTarget.style.color = '#0b3fa8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#374151';
            }}
          >
            <MI name="lock" size={15} /> Ganti Password
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
              border: '1.5px solid #b91c1c',
              background: '#ffffff',
              color: '#b91c1c',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            <MI name="logout" size={15} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="rt-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header
          className="no-print rt-header"
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
          <button
            className="rt-burger no-print"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 10,
              border: '1.5px solid #a9c7f0',
              background: '#FAFCFF',
              color: '#0b3fa8',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <MI name="menu" size={20} />
          </button>
          <div className="rt-header-title">
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {pageTitle}
            </h1>
            {loading && <p style={{ fontSize: 11, color: '#334155', margin: 0 }}>Memuat data...</p>}
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
                  background: '#0b3fa8',
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
                onClick={() => unduhLaporanSaw('csv')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 16px',
                  background: '#FAFCFF',
                  color: '#334155',
                  border: '1px solid #DBEAFE',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <MI name="download" size={16} /> Unduh Laporan
              </button>
            )}
          </div>
        </header>

        <main className="rt-main-pad" style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#F0F6FF' }}>
          {/* ════ BERANDA ════ */}
          {activeMenu === 'beranda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Stat Cards */}
              <div className="mob-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {[
                  {
                    label: 'Total Warga',
                    value: wargaList.length,
                    icon: 'group',
                    color: '#0b3fa8',
                    bg: '#eff6ff',
                    sub: `Terdaftar di ${rtLabel(userData.rt)}`,
                  },
                  {
                    label: 'Perlu Verifikasi',
                    value: pendingCt,
                    icon: 'pending_actions',
                    color: '#92400e',
                    bg: '#fef9c3',
                    sub: 'Pengajuan pending',
                  },
                  {
                    label: 'Warga Disetujui',
                    value: diterimaCt,
                    icon: 'verified',
                    color: '#065f46',
                    bg: '#ecfdf5',
                    sub: 'Sudah terverifikasi',
                  },
                  {
                    label: 'Prioritas Utama',
                    value: rankingRT[0]?.nama_warga?.split(' ')[0] || '-',
                    icon: 'emoji_events',
                    color: '#5b21b6',
                    bg: '#f5f3ff',
                    sub: rankingRT[0]
                      ? `Nilai V ${Number(rankingRT[0].skor_saw).toFixed(4)}`
                      : 'Belum ada data',
                    small: true,
                  },
                ].map(({ label, value, icon, color, bg, sub, small }) => (
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
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#0f172a',
                          background: '#FFFFFF',
                          padding: '3px 8px',
                          borderRadius: 5,
                          border: '1px solid #cbd5e1',
                        }}
                      >
                        Live
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#334155', marginBottom: 2 }}>{label}</div>
                      <div
                        style={{
                          fontSize: small ? 19 : 30,
                          fontWeight: 800,
                          color: '#0f172a',
                          lineHeight: 1.15,
                        }}
                      >
                        {value}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#334155',
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
                className="mob-banner"
                style={{
                  borderRadius: 16,
                  padding: '26px 32px',
                  background: 'linear-gradient(135deg, #0b3fa8 0%, #062b6e 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div className="mob-banner-text" style={{ maxWidth: '60%' }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#bfdbfe',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                      marginBottom: 8,
                    }}
                  >
                    Pusat Kendali {rtLabel(userData.rt)}
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
              <div className="mob-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
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
                      <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                        {pengajuanList.length} total dari wilayah Anda
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveMenu('verifikasi')}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#0b3fa8',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Semua
                    </button>
                  </div>
                  <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F0F6FF', borderBottom: '1px solid #DBEAFE' }}>
                        {['Nama Warga', 'Status', 'Aksi'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '9px 16px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
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
                            <div style={{ fontSize: 11, color: '#334155' }}>
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
                                color: '#0b3fa8',
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
                              color: '#334155',
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
                        background: '#b91c1c',
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
                            e.currentTarget.style.borderColor = '#0b3fa8';
                            e.currentTarget.style.background = '#f0f7ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#a9c7f0';
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
                            <MI name="gpp_maybe" fill size={18} style={{ color: '#b91c1c' }} />
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
                            <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>
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
                        <MI name="check_circle" fill size={36} style={{ color: '#166534' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
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
                        color: '#0b3fa8',
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

              {/* Status ranking: warga terlewat & kriteria konstan (BUG-09/BUG-05) */}
              <RankingWarnings
                dilewati={dilewati}
                kriteriaTanpaVariasi={kriteriaTanpaVariasi}
                error={rankingError}
              />

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
                    Top 5 Peringkat {rtLabel(userData.rt)}
                  </div>
                  <button
                    onClick={() => setActiveMenu('ranking')}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#0b3fa8',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Selengkapnya
                  </button>
                </div>
                <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F0F6FF', borderBottom: '1px solid #DBEAFE' }}>
                      {['Peringkat RT', 'Nama Warga', 'Nilai (V)'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 18px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#334155',
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
                              background: r.ranking_rt <= 3 ? '#0b3fa8' : '#f1f5f9',
                              color: r.ranking_rt <= 3 ? '#fff' : '#334155',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            {r.ranking_rt}
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
                            color: '#0b3fa8',
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
                            color: '#334155',
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
                  Data Warga {rtLabel(userData.rt)}
                </div>
                <div style={{ fontSize: 12, color: '#334155', marginTop: 3 }}>
                  {wargaList.length} warga terdaftar di wilayah Anda
                </div>
              </div>
              <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                            color: '#334155',
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
                    // Status datang langsung dari API (pengajuan terakhir warga ini).
                    const sudahAda = !!w.id_pengajuan;
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
                            color: '#334155',
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
                              color: '#334155',
                              marginTop: 2,
                              fontFamily: 'monospace',
                            }}
                          >
                            {w.username || 'Tanpa akun'}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '13px 18px',
                            fontSize: 12.5,
                            color: '#334155',
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
                                color: '#166534',
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
                                color: '#92400e',
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
                              color: sudahAda ? '#166534' : '#0b3fa8',
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
                          color: '#334155',
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
                <div style={{ fontSize: 12, color: '#334155', marginTop: 3 }}>
                  Pilih warga untuk mengisi atau mengedit data kuesioner
                </div>
              </div>
              <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F0F6FF', borderBottom: '1px solid #DBEAFE' }}>
                    {['No', 'Nama Warga', 'Progres Kuesioner', 'Aksi'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '11px 18px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#334155',
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
                    const p = pengajuanList.find((x) => Number(x.id_warga) === Number(w.id_warga));
                    const sudah = !!p;
                    const jawObj = p ? parseJawaban(p.jawaban_mentah) : null;
                    const pctJawaban = jawObj
                      ? Object.values(jawObj).filter((v) => v && v !== '-').length
                      : 0;
                    // Pengajuan lama bisa punya matriks lengkap tanpa jawaban mentah.
                    const pct = Math.max(pctJawaban, p?.penilaian?.length || 0);
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
                            color: '#334155',
                          }}
                        >
                          {i + 1}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                            {w.name}
                          </div>
                          {p && (
                            <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>
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
                                  background: '#cbd5e1',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    borderRadius: 4,
                                    background: pct === 10 ? '#15803d' : '#0b3fa8',
                                    width: `${(pct / 10) * 100}%`,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: pct === 10 ? '#166534' : '#0f172a',
                                }}
                              >
                                {pct}/10
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: '#334155' }}>Belum ada data</span>
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
                              background: sudah ? '#f1f5f9' : '#0b3fa8',
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
                          color: '#334155',
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
                <h2>LAPORAN VERIFIKASI — {rtLabel(userData.rt)}</h2>
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
                  <div style={{ fontSize: 12, color: '#334155', marginTop: 3 }}>
                    Klik "Tinjau" untuk membuka detail dan chat
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    fontSize: 12,
                    color: '#334155',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: '#fef9c3',
                      color: '#92400e',
                    }}
                  >
                    {pendingCt} Pending
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: '#dcfce7',
                      color: '#166534',
                    }}
                  >
                    {diterimaCt} Diterima
                  </span>
                </div>
              </div>
              <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F0F6FF', borderBottom: '1px solid #DBEAFE' }}>
                    {['No', 'Nama Pengaju', 'Tanggal Masuk', 'Status', 'Aksi'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '11px 18px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#334155',
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
                          color: '#334155',
                        }}
                      >
                        {i + 1}
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                          {p.warga?.nama_lengkap || p.warga?.name || '-'}
                        </div>
                        <div style={{ fontSize: 11, color: '#334155' }}>
                          {rtLabel(p.warga?.rt ?? userData.rt)}
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 12.5, color: '#334155' }}>
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
                            color: '#0b3fa8',
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
                          color: '#334155',
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

          {/* ════ PENGADUAN ════ */}
          {activeMenu === 'pengaduan' && <PengaduanPanel role="rt" />}

          {/* ════ RANKING ════ */}
          {activeMenu === 'ranking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="print-header" style={{ display: 'none' }}>
                <h2>HASIL REKOMENDASI SAW — {rtLabel(userData.rt)}</h2>
                <p>
                  Dicetak: {new Date().toLocaleString('id-ID')} &nbsp;|&nbsp; Oleh: {userData.name}
                </p>
              </div>

              {/* Scope: backend hanya mengirim wilayah RT ini (P0-06) */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '9px 18px',
                    borderRadius: 10,
                    border: '1.5px solid #0b3fa8',
                    background: '#0b3fa8',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <MI name="home" size={16} /> Wilayah {rtLabel(userData.rt)}
                </span>
              </div>

              <RankingWarnings
                dilewati={dilewati}
                kriteriaTanpaVariasi={kriteriaTanpaVariasi}
                error={rankingError}
              />

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
                    Peringkat Prioritas Penerima Bansos — {rtLabel(userData.rt)}
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', marginTop: 3 }}>
                    Nilai tertinggi = prioritas utama penerima
                  </div>
                </div>
                <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F0F6FF', borderBottom: '1px solid #DBEAFE' }}>
                      {['Peringkat', 'Nama Warga', 'RT', 'Nilai Preferensi (V)'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '11px 18px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#334155',
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
                              background: r.ranking_rt <= 3 ? '#0b3fa8' : '#f1f5f9',
                              color: r.ranking_rt <= 3 ? '#fff' : '#334155',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                            }}
                          >
                            {r.ranking_rt}
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
                              color: '#0b3fa8',
                            }}
                          >
                            {rtLabel(r.rt)}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '13px 18px',
                            fontSize: 15,
                            fontWeight: 800,
                            color: r.ranking_rt <= 3 ? '#0b3fa8' : '#334155',
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
                            color: '#334155',
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
                  <span style={{ fontSize: 12, color: '#334155' }}>
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
                <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                  Warga akan otomatis masuk ke {rtLabel(userData.rt)}
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
                <MI name="close" size={18} style={{ color: '#334155' }} />
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
                      color: '#334155',
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
                    onFocus={(e) => (e.target.style.borderColor = '#0b3fa8')}
                    onBlur={(e) => (e.target.style.borderColor = '#a9c7f0')}
                  />
                </div>
              ))}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#334155',
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
                  onFocus={(e) => (e.target.style.borderColor = '#0b3fa8')}
                  onBlur={(e) => (e.target.style.borderColor = '#a9c7f0')}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setModalWarga(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 9,
                    border: '1.5px solid #a9c7f0',
                    background: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#334155',
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
                    background: '#0b3fa8',
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
                <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
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
                <MI name="close" size={18} style={{ color: '#334155' }} />
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
                      border: `1.5px solid ${formJawaban[key] ? '#bfdbfe' : '#cbd5e1'}`,
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
                          background: formJawaban[key] ? '#0b3fa8' : '#cbd5e1',
                          color: formJawaban[key] ? '#fff' : '#334155',
                          transition: '.15s',
                        }}
                      >
                        C{idx + 1}
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', flex: 1 }}>
                        {label}
                      </span>
                      {formJawaban[key] && (
                        <MI name="check_circle" fill size={16} style={{ color: '#166534' }} />
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
                            border: `1.5px solid ${formJawaban[key] === opt ? '#0b3fa8' : '#cbd5e1'}`,
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
                              border: `2px solid ${formJawaban[key] === opt ? '#0b3fa8' : '#cbd5e1'}`,
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
                                  background: '#0b3fa8',
                                }}
                              />
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: 12.5,
                              color: formJawaban[key] === opt ? '#0b3fa8' : '#334155',
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
                borderTop: '1px solid #cbd5e1',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 13, color: '#334155' }}>
                Terjawab:{' '}
                <strong
                  style={{
                    color:
                      Object.values(formJawaban).filter(Boolean).length === 10
                        ? '#166534'
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
                    border: '1.5px solid #a9c7f0',
                    background: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#334155',
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
                    background: loading ? '#93c5fd' : '#0b3fa8',
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
                borderRight: '1px solid #cbd5e1',
              }}
            >
              <div
                style={{ padding: '18px 22px', borderBottom: '1px solid #DBEAFE', flexShrink: 0 }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  {selectedP.warga?.nama_lengkap || selectedP.warga?.name || '-'}
                </div>
                <div style={{ fontSize: 12, color: '#334155', marginTop: 3 }}>
                  {rtLabel(selectedP.warga?.rt ?? userData.rt)} &bull; Masuk{' '}
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
                          color: '#475569',
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
                  <MI name="close" size={17} style={{ color: '#334155' }} />
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
                    background: selectedP.status === 'disetujui' ? '#166534' : '#dcfce7',
                    color: selectedP.status === 'disetujui' ? '#fff' : '#166534',
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
                    background: selectedP.status === 'ditolak' ? '#b91c1c' : '#fee2e2',
                    color: selectedP.status === 'ditolak' ? '#fff' : '#b91c1c',
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
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#334155' }}>
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
                          color: '#334155',
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
                          background: m.pengirim_role === 'rt' ? '#0b3fa8' : '#fff',
                          color: m.pengirim_role === 'rt' ? '#fff' : '#0f172a',
                          fontSize: 13,
                          lineHeight: 1.5,
                          border: m.pengirim_role !== 'rt' ? '1px solid #cbd5e1' : 'none',
                          boxShadow: '0 1px 3px rgba(0,0,0,.05)',
                          borderBottomRightRadius: m.pengirim_role === 'rt' ? 3 : 12,
                          borderBottomLeftRadius: m.pengirim_role !== 'rt' ? 3 : 12,
                        }}
                      >
                        {m.isi_pesan}
                        <div
                          style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}
                        >
                          {m.status_kirim === 'pending' && 'mengirim… '}
                          {fmtTime(m.created_at)}
                          {m.status_kirim === 'failed' && (
                            <button
                              type="button"
                              onClick={() => hapusPesanGagal(m.temp_id)}
                              title="Pesan gagal terkirim — klik untuk menghapus dari layar"
                              style={{
                                marginLeft: 6,
                                border: 'none',
                                background: 'transparent',
                                color: '#ffd0d0',
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              ⚠ gagal
                            </button>
                          )}
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
                  borderTop: '1px solid #cbd5e1',
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
                    border: '1.5px solid #a9c7f0',
                    background: '#FAFCFF',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13,
                    color: '#0f172a',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0b3fa8')}
                  onBlur={(e) => (e.target.style.borderColor = '#a9c7f0')}
                />
                <button
                  type="submit"
                  disabled={!pesanBaru.trim()}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 9,
                    border: 'none',
                    background: pesanBaru.trim() ? '#0b3fa8' : '#cbd5e1',
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
                    style={{ color: pesanBaru.trim() ? '#fff' : '#334155' }}
                  />
                </button>
              </form>
            </div>
          </div>
        </Overlay>
      )}

      {/* Scrim mobile — tutup sidebar saat diketuk */}
      <div
        className="rt-scrim no-print"
        onClick={() => setSidebarOpen(false)}
        style={{
          display: sidebarOpen ? 'block' : 'none',
          position: 'fixed',
          inset: 0,
          zIndex: 190,
          background: 'transparent',
        }}
      />
    </div>
  );
}
