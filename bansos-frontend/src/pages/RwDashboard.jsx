import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RankingWarnings from '../components/RankingWarnings';
import PengaduanPanel from '../components/PengaduanPanel';
import TombolExport from '../components/TombolExport';
import { rtInt, rtLabel } from '../lib/rt';
import { pasangLabelTabel } from '../lib/mobTable';

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';
const tok = () => localStorage.getItem('token');
const authH = () => ({ Authorization: `Bearer ${tok()}` });

/* ─── Design Bootstrap ───────────────────────────────────────────────────── */
function useDesign() {
  useEffect(() => {
    if (!document.getElementById('rw-css')) {
      const st = document.createElement('style');
      st.id = 'rw-css';
      st.innerHTML = `
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)} }
        @media print {
          @page { size: A4 landscape; margin: 8mm 12mm; }
          html,body { height:auto!important; overflow:visible!important; background:#fff!important; font-size:8px!important; font-family:'Plus Jakarta Sans',sans-serif!important; -webkit-print-color-adjust:exact; print-color-adjust:exact; margin:0!important; padding:0!important; }
          aside,header,.no-print,button,input,select,textarea { display:none!important; visibility:hidden!important; }
          #rw-root { display:block!important; height:auto!important; overflow:visible!important; width:100%!important; }
          #rw-main { display:block!important; width:100%!important; max-width:100%!important; height:auto!important; overflow:visible!important; padding:0!important; margin:0!important; background:#fff!important; flex:none!important; }
          div,section { overflow:visible!important; height:auto!important; max-height:none!important; box-shadow:none!important; }
          .print-header { display:block!important; margin-bottom:10px!important; padding-bottom:7px!important; border-bottom:2px solid #000!important; }
          .print-header h2 { font-size:12px!important; font-weight:700!important; margin:0 0 3px!important; text-transform:uppercase!important; color:#000!important; }
          .print-header p  { font-size:9px!important; color:#555!important; margin:0!important; }
          table { width:100%!important; border-collapse:collapse!important; table-layout:fixed!important; font-size:7.5px!important; }
          th,td { padding:3px 5px!important; border:1px solid #aaa!important; word-break:break-word!important; white-space:normal!important; vertical-align:middle!important; background:#fff!important; color:#000!important; }
          th { background:#dbeafe!important; font-weight:700!important; font-size:7px!important; }
          tr { page-break-inside:avoid!important; }
          thead { display:table-header-group!important; }
          [style*="linear-gradient"] { background:#eef3ff!important; }
          * { box-shadow:none!important; }
        }
        .print-header { display:none; }
        /* ── Responsif HP ── */
        @media (max-width: 900px) {
          .rw-sidebar {
            position: fixed !important; top: 0; left: 0; bottom: 0;
            width: 256px !important; max-width: 82vw;
            z-index: 200;
            transform: translateX(-102%);
            transition: transform .22s ease;
            box-shadow: 0 0 0 0 rgba(15,23,42,.35);
          }
          .rw-sidebar.open { transform: translateX(0); box-shadow: 0 0 0 100vmax rgba(15,23,42,.35); }
          .rw-header { padding: 8px 12px !important; height: auto !important; min-height: 56px !important; gap: 8px; flex-wrap: wrap; row-gap: 8px; }
          .rw-header-title { font-size: 14px !important; flex: 1 1 auto; min-width: 0; }
          .rw-header-actions { width: 100%; display: flex !important; gap: 8px !important; }
          /* Tiga tombol aksi (Cetak/Unduh/Hitung) tadinya mendorong tombol
             terakhir ke luar layar (x=373 di viewport 360). Di HP mereka turun
             ke baris kedua dan berbagi lebar rata. */
          .rw-header-actions > button { flex: 1 1 0; min-height: 42px; justify-content: center; padding: 8px 6px !important; font-size: 12px !important; line-height: 1.15; }
          .rw-main-pad { padding: 16px 12px !important; }
          .rw-burger { display: inline-flex !important; width: 42px !important; height: 42px !important; }
        }
        @media print { .rw-burger, .rw-scrim { display:none!important; } }
      `;
      document.head.appendChild(st);
    }
    document.body.style.fontFamily = "'Plus Jakarta Sans',sans-serif";
    document.body.style.background = '#F0F6FF';
    document.body.style.margin = '0';
  }, []);
}

/* ─── Icon ───────────────────────────────────────────────────────────────── */
const MI = ({ name, fill = false, size = 20, style: s = {} }) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: size,
      fontVariationSettings: fill
        ? "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24"
        : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
      lineHeight: 1,
      userSelect: 'none',
      flexShrink: 0,
      ...s,
    }}
  >
    {name}
  </span>
);

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/* ─── Shared inline styles ───────────────────────────────────────────────── */
const tblTh = {
  padding: '11px 18px',
  fontSize: 11.5,
  fontWeight: 700,
  color: '#0f172a',
  textAlign: 'left',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  background: '#F0F6FF',
  borderBottom: '1px solid #DBEAFE',
};
const tblTd = {
  padding: '13px 18px',
  fontSize: 13.5,
  color: '#0f172a',
  borderBottom: '1px solid #EBF3FF',
};

/* ══════════════════════════════════════════════════════════════════════════ */
export default function RwDashboard() {
  useDesign();
  const navigate = useNavigate();

  const [userData] = useState(() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : { name: 'Ketua RW', role: 'rw' };
    } catch {
      return { name: 'Ketua RW', role: 'rw' };
    }
  });
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wargaList, setWargaList] = useState([]);
  const [rankingData, setRankingData] = useState([]);
  const [dilewati, setDilewati] = useState([]);
  const [kriteriaTanpaVariasi, setKriteriaTanpaVariasi] = useState([]);
  const [rankingError, setRankingError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRT, setFilterRT] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── Auth ── */
  useEffect(() => {
    const s = localStorage.getItem('user'),
      t = localStorage.getItem('token');
    if (!s || !t) {
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(s);
      if (u.role !== 'rw') {
        navigate('/login');
      }
    } catch {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (['beranda', 'warga'].includes(activeMenu)) {
        // Sumbernya tabel `warga`, bukan daftar akun: warga hasil impor CSV
        // tetap terhitung walau akunnya belum dibuat (dulu hanya 2 baris).
        const r = await axios.get(`${API}/rt/warga`, { headers: authH() });
        setWargaList(r.data.data || []);
      }
      if (['beranda', 'ranking'].includes(activeMenu)) {
        const r = await axios.get(`${API}/saw/hitung?t=${Date.now()}`, { headers: authH() });
        setRankingData(r.data.data || []);
        setDilewati(r.data.dilewati || []);
        setKriteriaTanpaVariasi(r.data.kriteria_tanpa_variasi || []);
        setRankingError(null);
      }
    } catch (err) {
      console.error('Gagal memuat data RW:', err);
      if (['beranda', 'ranking'].includes(activeMenu)) {
        setRankingError(err.response?.data?.message || 'Server tidak merespons. Muat ulang halaman atau jalankan kalkulasi lagi.');
      }
    } finally {
      setLoading(false);
    }
  }, [activeMenu]);

  useEffect(() => {
    if (!tok()) return;
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const jalankanSAW = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/saw/hitung?t=${Date.now()}`, { headers: authH() });
      setRankingData(r.data.data || []);
      setDilewati(r.data.dilewati || []);
      setKriteriaTanpaVariasi(r.data.kriteria_tanpa_variasi || []);
      setRankingError(null);
      showToast('Kalkulasi SAW berhasil diperbarui.');
    } catch {
      showToast('Gagal menjalankan kalkulasi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Derived ── */
  const rtGroups = [...new Set(wargaList.map((w) => rtInt(w.rt)).filter(Boolean))].sort(
    (a, b) => a - b
  );
  const topScore = rankingData[0] ? Number(rankingData[0].skor_saw).toFixed(4) : '—';
  const filteredRanking = rankingData.filter((r) => {
    const matchSearch =
      !searchQuery || r.nama_warga?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRT = filterRT === 'all' || rtInt(r.rt) === rtInt(filterRT);
    return matchSearch && matchRT;
  });

  // Tabel berubah jadi kartu di HP dan butuh label kolom di tiap sel.
  useEffect(() => {
    pasangLabelTabel();
  });

  const navGroups = [
    {
      label: 'Menu Utama',
      items: [
        { key: 'beranda', icon: 'dashboard', label: 'Beranda' },
        { key: 'warga', icon: 'group', label: 'Database Warga' },
        { key: 'pengaduan', icon: 'campaign', label: 'Pengaduan' },
        { key: 'ranking', icon: 'leaderboard', label: 'Perangkingan SAW' },
      ],
    },
  ];

  const pageTitle =
    {
      beranda: 'Monitor Wilayah RW',
      warga: 'Database Warga Global',
      pengaduan: 'Pengaduan Warga',
      ranking: 'Hasil Keputusan SAW',
    }[activeMenu] || '';

  /* ══ RENDER ════════════════════════════════════════════════════════════ */
  return (
    <div
      id="rw-root"
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans',sans-serif",
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
            boxShadow: '0 8px 32px rgba(0,0,0,.2)',
            animation: 'fadeUp .2s ease',
            maxWidth: 340,
          }}
        >
          <MI name={toast.type === 'error' ? 'error' : 'check_circle'} fill size={17} />
          {toast.msg}
        </div>
      )}

      {/* ════ SIDEBAR ════ */}
      <aside
        className={`no-print rw-sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: 252,
          flexShrink: 0,
          background: '#EBF3FF',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRight: '1px solid #a9c7f0',
          overflowY: 'auto',
        }}
      >
        {/* Brand */}
        <div
          className="rw-sidebar-brand"
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid #a9c7f0',
            background: 'linear-gradient(135deg,#0b3fa8 0%,#062b6e 100%)',
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
                Portal Ketua RW
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
              <div style={{ fontSize: 11, color: '#0b3fa8', fontWeight: 600 }}>Pimpinan RW</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {navGroups.map((group) => (
            <div key={group.label}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  padding: '0 8px',
                  marginBottom: 8,
                }}
              >
                {group.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.items.map(({ key, icon, label }) => {
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
                        fontWeight: active ? 700 : 600,
                        background: active ? '#0b3fa8' : 'transparent',
                        color: active ? '#fff' : '#374151',
                        transition: '.12s',
                        borderLeft: `2px solid ${active ? '#fff' : 'transparent'}`,
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = '#a9c7f0';
                          e.currentTarget.style.color = '#0b3fa8';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#374151';
                        }
                      }}
                    >
                      <MI name={icon} fill={active} size={18} />
                      <span style={{ flex: 1 }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div
          style={{
            padding: '12px 12px 16px',
            borderTop: '1px solid #a9c7f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
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
            <MI name="print" size={15} /> Cetak Laporan
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
              transition: '.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            <MI name="logout" size={15} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <div className="rw-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header
          className="no-print rw-header"
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
            className="rw-burger no-print"
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
          <div className="rw-header-title">
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {pageTitle}
            </h1>
            {loading && <p style={{ fontSize: 11, color: '#334155', margin: 0 }}>Memuat data...</p>}
          </div>
          <div
            className="rw-header-actions"
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}
          >
            {['ranking', 'warga'].includes(activeMenu) && (
              <button
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 18px',
                  background: '#fff',
                  color: '#334155',
                  border: '1.5px solid #a9c7f0',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <MI name="print" size={15} /> Cetak
              </button>
            )}
            {activeMenu === 'ranking' && (
              <TombolExport jenis="saw" label="hasil perangkingan SAW" onInfo={showToast} />
            )}
            {activeMenu === 'ranking' && (
              <button
                onClick={jalankanSAW}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 18px',
                  background: '#065f46',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <MI name="calculate" size={15} /> {loading ? 'Menghitung...' : 'Hitung Ulang SAW'}
              </button>
            )}
          </div>
        </header>

        <main
          id="rw-main"
          className="rw-main-pad"
          style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#F0F6FF' }}
        >
          {/* ══ BERANDA ══ */}
          {activeMenu === 'beranda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Stat cards */}
              <div className="mob-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {[
                  {
                    label: 'Total Warga',
                    value: wargaList.length,
                    icon: 'group',
                    color: '#0b3fa8',
                    bg: '#dbeafe',
                    sub: `Dari ${rtGroups.length} RT aktif`,
                  },
                  {
                    label: 'RT Aktif',
                    value: rtGroups.length,
                    icon: 'location_city',
                    color: '#0b3fa8',
                    bg: '#ecfeff',
                    sub: 'Wilayah terdata',
                  },
                  {
                    label: 'Total Kuesioner',
                    value: rankingData.length,
                    icon: 'fact_check',
                    color: '#065f46',
                    bg: '#dcfce7',
                    sub: 'Warga terhitung SAW',
                  },
                  {
                    label: 'Skor Tertinggi',
                    value: topScore,
                    icon: 'trending_up',
                    color: '#92400e',
                    bg: '#fef9c3',
                    sub: rankingData[0]?.nama_warga?.split(' ')[0] || '—',
                  },
                ].map(({ label, value, icon, color, bg, sub }) => (
                  <div
                    key={label}
                    style={{
                      background: '#fff',
                      borderRadius: 14,
                      padding: '20px 22px',
                      border: '1px solid #DBEAFE',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 14,
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
                    <div style={{ fontSize: 12, color: '#334155', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                      {value}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#334155',
                        marginTop: 5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Banner */}
              <div
                className="mob-banner"
                style={{
                  borderRadius: 16,
                  padding: '28px 36px',
                  background: 'linear-gradient(135deg,#0b3fa8 0%,#062b6e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 24,
                }}
              >
                <div className="mob-banner-text" style={{ maxWidth: '62%' }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#bfdbfe',
                      textTransform: 'uppercase',
                      letterSpacing: '.1em',
                      marginBottom: 10,
                    }}
                  >
                    Pusat Kontrol RW
                  </div>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#fff',
                      margin: '0 0 10px',
                      lineHeight: 1.3,
                    }}
                  >
                    Analisis dan Kalkulasi SAW Global
                  </h2>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: 'rgba(255,255,255,.85)',
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    Perbarui peringkat seluruh warga di semua RT. Sistem normalisasi bobot dan
                    kalkulasi nilai preferensi secara otomatis.
                  </p>
                </div>
                <button
                  onClick={jalankanSAW}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '13px 24px',
                    background: '#fff',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: loading ? 'default' : 'pointer',
                    flexShrink: 0,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  <MI name="calculate" fill size={18} />
                  {loading ? 'Mengkalkulasi...' : 'Jalankan Sekarang'}
                </button>
              </div>

              {/* Top 10 preview */}
              <RankingWarnings
                dilewati={dilewati}
                kriteriaTanpaVariasi={kriteriaTanpaVariasi}
                error={rankingError}
              />
              <div
                className="tabel-scroll"
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #DBEAFE',
                }}
              >
                <div
                  className="mob-card-head"
                  style={{
                    padding: '18px 22px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      Top 10 Peringkat Global
                    </div>
                    <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                      Hasil kalkulasi SAW terakhir — semua RT
                    </div>
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
                      minHeight: 40,
                      padding: '0 6px',
                    }}
                  >
                    Lihat Semua
                  </button>
                </div>
                <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Peringkat', 'Nama Warga', 'RT', 'Nilai (V)'].map((h) => (
                        <th key={h} style={tblTh}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rankingData.slice(0, 10).map((r, i) => (
                      <tr
                        key={i}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFCFF')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ ...tblTd, width: 70 }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: i < 3 ? '#0b3fa8' : '#F0F6FF',
                              color: i < 3 ? '#fff' : '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            {i + 1}
                          </div>
                        </td>
                        <td style={{ ...tblTd, fontWeight: 600 }}>{r.nama_warga}</td>
                        <td style={tblTd}>
                          <span
                            style={{
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
                            ...tblTd,
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#0b3fa8',
                            fontSize: 14,
                          }}
                        >
                          {Number(r.skor_saw).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                    {rankingData.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          style={{
                            padding: '32px',
                            textAlign: 'center',
                            color: '#334155',
                            fontSize: 13,
                          }}
                        >
                          Belum ada data. Klik "Jalankan Sekarang".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* RT Breakdown cards */}
              {rtGroups.length > 0 && (
                <div
                  className="mob-stat-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(rtGroups.length, 4)},1fr)`,
                    gap: 14,
                  }}
                >
                  {rtGroups.map((rt) => {
                    const total = wargaList.filter((w) => rtInt(w.rt) === rtInt(rt)).length;
                    const inRanking = rankingData.filter((r) => rtInt(r.rt) === rtInt(rt));
                    const best =
                      inRanking.length > 0
                        ? Math.min(
                            ...inRanking.map((r) => rankingData.findIndex((x) => x === r) + 1)
                          )
                        : '—';
                    return (
                      <div
                        key={rt}
                        style={{
                          background: '#fff',
                          borderRadius: 12,
                          padding: '20px 22px',
                          border: '1px solid #DBEAFE',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: 12,
                          }}
                        >
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                            {rtLabel(rt)}
                          </div>
                          <MI name="home_work" fill size={18} style={{ color: '#334155' }} />
                        </div>
                        <div style={{ fontSize: 12.5, color: '#334155', marginBottom: 2 }}>
                          {total} warga terdaftar
                        </div>
                        <div style={{ fontSize: 11.5, color: '#334155' }}>
                          Rank global terbaik: <strong style={{ color: '#0b3fa8' }}>#{best}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ WARGA ══ */}
          {activeMenu === 'warga' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="print-header">
                <h2>DATABASE WARGA — RW</h2>
                <p>
                  Dicetak: {new Date().toLocaleString('id-ID')} | Oleh: {userData.name}
                </p>
              </div>

              <div
                style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                className="no-print"
              >
                {['all', ...rtGroups.map(String)].map((rt) => (
                  <button
                    key={rt}
                    onClick={() => setFilterRT(rt)}
                    style={{
                      padding: '7px 14px',
                      minHeight: 40,
                      borderRadius: 8,
                      border: `1.5px solid ${filterRT === rt ? '#0b3fa8' : '#a9c7f0'}`,
                      background: filterRT === rt ? '#0b3fa8' : '#fff',
                      color: filterRT === rt ? '#fff' : '#374151',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: '.12s',
                    }}
                  >
                    {rt === 'all' ? 'Semua RT' : rtLabel(rt)}
                  </button>
                ))}
                <span
                  style={{ marginLeft: 'auto', fontSize: 12, color: '#334155', fontWeight: 600 }}
                >
                  {
                    wargaList.filter(
                      (w) => filterRT === 'all' || rtInt(w.rt) === rtInt(filterRT)
                    ).length
                  }{' '}
                  warga
                </span>
              </div>

              <div
                className="tabel-scroll"
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #DBEAFE',
                }}
              >
                <div
                  style={{
                    padding: '16px 22px',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#FAFCFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      Database Warga RW
                    </div>
                    <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                      {wargaList.length} warga terdaftar dari seluruh RT
                    </div>
                  </div>
                  <TombolExport jenis="warga" label="data warga" onInfo={showToast} />
                </div>
                <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['No', 'Nama Lengkap', 'Username', 'Alamat Domisili', 'Asal RT'].map((h) => (
                        <th key={h} style={tblTh}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {wargaList
                      .filter(
                        (w) =>
                          filterRT === 'all' || String(Number(w.rt)) === String(Number(filterRT))
                      )
                      .map((w, i) => (
                        <tr
                          key={w.id}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFCFF')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ ...tblTd, fontWeight: 700, color: '#334155', width: 44 }}>
                            {i + 1}
                          </td>
                          <td style={{ ...tblTd, fontWeight: 600 }}>{w.name}</td>
                          <td
                            style={{
                              ...tblTd,
                              fontFamily: 'monospace',
                              fontSize: 12.5,
                              color: '#334155',
                            }}
                          >
                            {w.username || '—'}
                          </td>
                          <td
                            style={{
                              ...tblTd,
                              fontSize: 12.5,
                              color: '#334155',
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={w.alamat}
                          >
                            {w.alamat || '—'}
                          </td>
                          <td style={tblTd}>
                            <span
                              style={{
                                padding: '3px 9px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: '#EBF3FF',
                                color: '#0b3fa8',
                              }}
                            >
                              {rtLabel(w.rt)}
                            </span>
                          </td>
                        </tr>
                      ))}
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
                          Belum ada data warga.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ PENGADUAN ══ */}
          {activeMenu === 'pengaduan' && <PengaduanPanel role="rw" />}

          {/* ══ RANKING ══ */}
          {activeMenu === 'ranking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="print-header">
                <h2>HASIL KEPUTUSAN SAW — PERINGKAT PRIORITAS GLOBAL</h2>
                <p>
                  Dicetak: {new Date().toLocaleString('id-ID')} | Oleh: {userData.name}
                </p>
              </div>

              {/* Filter bar */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '14px 18px',
                  border: '1px solid #DBEAFE',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
                className="no-print"
              >
                <div style={{ position: 'relative', flex: '1 1 220px' }}>
                  <MI
                    name="search"
                    size={17}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#334155',
                    }}
                  />
                  <input
                    placeholder="Cari nama warga..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: 9,
                      border: '1.5px solid #a9c7f0',
                      fontSize: 13,
                      outline: 'none',
                      color: '#0f172a',
                      background: '#FAFCFF',
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0b3fa8')}
                    onBlur={(e) => (e.target.style.borderColor = '#a9c7f0')}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['all', ...rtGroups.map(String)].map((rt) => (
                    <button
                      key={rt}
                      onClick={() => setFilterRT(rt)}
                      style={{
                        padding: '7px 13px',
                        minHeight: 40,
                        borderRadius: 8,
                        border: `1.5px solid ${filterRT === rt ? '#0b3fa8' : '#a9c7f0'}`,
                        background: filterRT === rt ? '#0b3fa8' : '#fff',
                        color: filterRT === rt ? '#fff' : '#374151',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: '.12s',
                      }}
                    >
                      {rt === 'all' ? 'Semua RT' : rtLabel(rt)}
                    </button>
                  ))}
                </div>
                <span
                  style={{ marginLeft: 'auto', fontSize: 12, color: '#334155', fontWeight: 600 }}
                >
                  {filteredRanking.length} dari {rankingData.length} data
                </span>
              </div>

              {/* Info bar */}
              <RankingWarnings
                dilewati={dilewati}
                kriteriaTanpaVariasi={kriteriaTanpaVariasi}
                error={rankingError}
              />
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '14px 20px',
                  border: '1px solid #DBEAFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MI name="info" fill size={18} style={{ color: '#0b3fa8' }} />
                  <span style={{ fontSize: 13, color: '#334155' }}>
                    Total <strong style={{ color: '#0f172a' }}>{rankingData.length}</strong> warga
                    terhitung. Nilai V dihitung menggunakan metode SAW di sisi server.
                  </span>
                </div>
              </div>

              <div
                className="tabel-scroll"
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #DBEAFE',
                }}
              >
                <div
                  style={{
                    padding: '16px 22px',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#FAFCFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      Peringkat Prioritas Penerima Bansos
                    </div>
                    <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                      Nilai tertinggi = prioritas utama penerima
                    </div>
                  </div>
                  <TombolExport jenis="saw" label="hasil perangkingan SAW" onInfo={showToast} />
                </div>
                <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Peringkat', 'Nama Warga', 'RT', 'Nilai Preferensi (V)'].map((h) => (
                        <th key={h} style={tblTh}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRanking.map((r, i) => (
                      <tr
                        key={i}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFCFF')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ ...tblTd, width: 70 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: i < 3 ? '#0b3fa8' : '#F0F6FF',
                              color: i < 3 ? '#fff' : '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                            }}
                          >
                            {r.ranking || i + 1}
                          </div>
                        </td>
                        <td style={{ ...tblTd, fontWeight: 700 }}>{r.nama_warga}</td>
                        <td style={tblTd}>
                          <span
                            style={{
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
                            ...tblTd,
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: 15,
                            color: i < 3 ? '#0b3fa8' : '#334155',
                          }}
                        >
                          {Number(r.skor_saw).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                    {filteredRanking.length === 0 && (
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
                          {rankingData.length === 0
                            ? 'Belum ada data. Klik "Hitung Ulang SAW".'
                            : 'Tidak ada hasil untuk filter ini.'}
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
                    Menampilkan {filteredRanking.length} data
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Scrim mobile — tutup sidebar saat diketuk */}
      <div
        className="rw-scrim no-print"
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
