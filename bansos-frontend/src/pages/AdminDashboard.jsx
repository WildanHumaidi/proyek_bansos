import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RankingWarnings from '../components/RankingWarnings';
import PengaduanPanel from '../components/PengaduanPanel';
import TombolExport from '../components/TombolExport';
import { rtLabel } from '../lib/rt';
import { unduhLaporanSaw } from '../lib/report';
import { pasangLabelTabel } from '../lib/mobTable';

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';
const tok = () => localStorage.getItem('token');
const authH = () => ({ Authorization: `Bearer ${tok()}` });

/* ─── Design Bootstrap ───────────────────────────────────────────────────── */
function useDesign() {
  useEffect(() => {
    if (!document.getElementById('admin-print')) {
      const st = document.createElement('style');
      st.id = 'admin-print';
      st.innerHTML = `
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes popIn  { from { opacity:0; transform:scale(.97) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }

        /* ── Responsif HP ── */
        @media (max-width: 900px) {
          .admin-sidebar {
            position: fixed !important; top: 0; left: 0; bottom: 0;
            width: 256px !important; max-width: 82vw;
            z-index: 200;
            transform: translateX(-102%);
            transition: transform .22s ease;
            box-shadow: 0 0 0 0 rgba(15,23,42,.35);
          }
          .admin-sidebar.open { transform: translateX(0); box-shadow: 0 0 0 100vmax rgba(15,23,42,.35); }
          .admin-header { padding: 8px 12px !important; height: auto !important; min-height: 56px !important; gap: 8px; flex-wrap: wrap; row-gap: 8px; }
          .admin-header-title { font-size: 14px !important; flex: 1 1 auto; min-width: 0; }
          .admin-header-actions { width: 100%; display: flex !important; gap: 8px !important; }
          .admin-header-actions:empty { display: none !important; }
          /* Cetak/Import/Hitung/Tambah Akun tadinya berdesakan di satu baris;
             sekarang turun ke baris kedua dan berbagi lebar rata. */
          .admin-header-actions > * { flex: 1 1 0; min-height: 42px; justify-content: center; padding: 8px 6px !important; font-size: 12px !important; line-height: 1.15; white-space: nowrap; }
          .admin-main-pad { padding: 16px 12px !important; }
          .admin-burger { display: inline-flex !important; width: 42px !important; height: 42px !important; }
          .mob-banner-actions { width: 100%; display: flex; gap: 8px; }
          .mob-banner-actions > * { flex: 1 1 0; justify-content: center; min-height: 42px; padding: 10px 8px !important; font-size: 12.5px !important; }
          .mob-scroll-hint { display: flex !important; }
          .mob-table .jawaban-sel { max-width: none !important; white-space: normal !important; overflow: visible !important; text-align: left; }
          .mob-table td[data-label="Aksi"] button { flex: 1 1 0; min-height: 44px; }
          /* Tombol Lihat (n) ada di kolom Sub-Kriteria, bukan Aksi. */
          .mob-table td button { min-height: 40px; }
        }
        .mob-scroll-hint { display: none; }
        @media print { .admin-burger, .admin-scrim { display:none!important; } }

        @media print {
          @page { size: A4 landscape; margin: 8mm 12mm; }

          /* ══ 1. RESET html/body ══ */
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
            color: #000 !important;
            font-size: 8px !important;
            font-family: 'Plus Jakarta Sans', sans-serif !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* ══ 2. HIDE sidebar, header, all controls — highest priority ══ */
          aside,
          header,
          .no-print,
          button,
          input,
          select,
          textarea,
          [class*="modal"],
          [class*="Modal"] {
            display: none !important;
            visibility: hidden !important;
          }

          /* ══ 3. Flatten the flex root wrapper ══ */
          #print-root {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            width: 100% !important;
          }

          /* ══ 4. Main fills full page width ══ */
          #print-main {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            flex: none !important;
          }

          /* ══ 5. All inner divs: remove overflow clipping ══ */
          div, section, article {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            box-shadow: none !important;
          }

          /* ══ 6. Print header block ══ */
          .print-header {
            display: block !important;
            margin-bottom: 10px !important;
            padding-bottom: 7px !important;
            border-bottom: 2px solid #000 !important;
          }
          .print-header h2 { font-size: 12px !important; font-weight: 700 !important; margin: 0 0 3px !important; text-transform: uppercase !important; color: #000 !important; }
          .print-header p  { font-size: 9px !important; color: #555 !important; margin: 0 !important; }

          /* ══ 7. Table base ══ */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            font-size: 7px !important;
          }
          th, td {
            padding: 3px 4px !important;
            border: 1px solid #aaa !important;
            word-break: break-word !important;
            white-space: normal !important;
            vertical-align: middle !important;
            text-align: center !important;
            position: static !important;
            background: #fff !important;
            color: #000 !important;
          }
          th {
            background: #dbeafe !important;
            font-weight: 700 !important;
            color: #000 !important;
            font-size: 6.5px !important;
            line-height: 1.3 !important;
          }
          tr { page-break-inside: avoid !important; }
          thead { display: table-header-group !important; }

          /* ══ 8. Column widths for 13-col table (No | Nama | C1-C10 | Status) ══
                  A4 landscape printable ≈ 257mm. Fixed layout so text wraps not overflows.
                  No=14 | Nama=52 | C1-C10=17 each (170) | Status=21 = 257mm total       */
          th:nth-child(1), td:nth-child(1) { width: 14mm !important; }
          th:nth-child(2), td:nth-child(2) { width: 52mm !important; text-align: left !important; }
          th:nth-child(n+3):nth-child(-n+12), td:nth-child(n+3):nth-child(-n+12) { width: 17mm !important; }
          th:nth-child(13), td:nth-child(13) { width: 21mm !important; }

          /* ══ 9. Remove box shadows only — preserve colors on screen, strip only for print cells ══ */
          * { box-shadow: none !important; }

          /* ══ 10. Matriks value spans ══ */
          .matriks-val {
            background: none !important;
            background-color: transparent !important;
            color: #000 !important;
            font-weight: 600 !important;
            font-family: monospace !important;
            font-size: 7.5px !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }

          /* ══ 11. Status column: swap select→badge ══ */
          .col-status { display: table-cell !important; }
          td.col-status select { display: none !important; }
          td.col-status .badge-print  { display: inline !important; font-weight: 700 !important; font-size: 6.5px !important; color: #000 !important; }
          td.col-status .badge-screen { display: none !important; }

          /* ══ 12. Hide action column ══ */
          .col-aksi { display: none !important; }

          /* ══ 13. Flatten gradient backgrounds ══ */
          [style*="linear-gradient"] { background: #eef3ff !important; }
        }

        /* ── Non-print defaults ── */
        .badge-print  { display: none; }
        .badge-screen { display: inline-flex; }
      `;
      document.head.appendChild(st);
    }
    document.body.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
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
const fmtDateTime = (s) =>
  s
    ? new Date(s).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

const roleCfg = (role, rt) => {
  if (role === 'admin') return { label: 'Administrator', bg: '#fef9c3', color: '#92400e' };
  if (role === 'rw') return { label: 'Ketua RW', bg: '#f3e8ff', color: '#5b21b6' };
  if (role === 'rt') return { label: `Ketua ${rtLabel(rt)}`, bg: '#dbeafe', color: '#0b3fa8' };
  return { label: 'Warga', bg: '#f1f5f9', color: '#334155' };
};

/* ─── Kuesioner constants ────────────────────────────────────────────────── */
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

const KLABEL = [
  'Jml KK',
  'Jml Anggota',
  'Pendidikan',
  'Jml Sekolah',
  'Pengeluaran',
  'Penghasilan',
  'Status Rmh',
  'Air Bersih',
  'Penerangan',
  'Transportasi',
];
const KLABEL_FULL = [
  'Jumlah KK dalam 1 Rumah',
  'Jumlah Anggota Keluarga',
  'Pendidikan Kepala Keluarga',
  'Tanggungan Masih Sekolah',
  'Rata-rata Pengeluaran / Bulan',
  'Rata-rata Penghasilan / Bulan',
  'Status Kepemilikan Rumah',
  'Sumber Air Bersih',
  'Sumber Penerangan',
  'Kepemilikan Kendaraan',
];

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

// Nilai matriks HANYA dibaca dari relasi `penilaian` di database. Jika relasi belum
// terbentuk, kembalikan null supaya UI menampilkan peringatan — jangan mensimulasikan
// angka dari `jawaban_mentah`, karena itu menyamarkan data yang belum di-generate.
const getSkor = (p, idK) => {
  const pn = p.penilaian?.find((x) => x.id_kriteria === idK);
  if (!pn) return null;
  const nilai = pn.sub_kriteria?.nilai ?? pn.nilai;
  return nilai === undefined || nilai === null ? null : nilai;
};

const punyaMatriks = (p) => (p.penilaian?.length || 0) === 10;

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
      background: 'rgba(2,6,23,.65)',
      backdropFilter: 'blur(4px)',
    }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    {children}
  </div>
);

const ModalBox = ({ children, maxW = 520, fullH = false }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 16,
      width: '100%',
      maxWidth: maxW,
      boxShadow: '0 24px 48px rgba(0,0,0,.2)',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: fullH ? '90vh' : undefined,
      animation: 'popIn .18s ease',
    }}
  >
    {children}
  </div>
);

const ModalHead = ({ title, sub, onClose }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '20px 24px',
      borderBottom: '1px solid #DBEAFE',
      flexShrink: 0,
    }}
  >
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>{sub}</div>}
    </div>
    <button
      onClick={onClose}
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
        flexShrink: 0,
      }}
    >
      <MI name="close" size={17} style={{ color: '#334155' }} />
    </button>
  </div>
);

const Lbl = ({ children, required: req }) => (
  <label
    style={{
      display: 'block',
      fontSize: 11,
      fontWeight: 700,
      color: '#334155',
      textTransform: 'uppercase',
      letterSpacing: '.07em',
      marginBottom: 6,
    }}
  >
    {children}
    {req && <span style={{ color: '#b91c1c', marginLeft: 2 }}>*</span>}
  </label>
);

const Inp = ({ style: s = {}, ...p }) => (
  <input
    style={{
      width: '100%',
      padding: '10px 13px',
      borderRadius: 9,
      border: '1.5px solid #a9c7f0',
      background: '#FAFCFF',
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      fontSize: 13.5,
      color: '#0f172a',
      outline: 'none',
      ...s,
    }}
    onFocus={(e) => (e.target.style.borderColor = '#0b3fa8')}
    onBlur={(e) => (e.target.style.borderColor = '#a9c7f0')}
    {...p}
  />
);

const Sel = ({ children, style: s = {}, ...p }) => (
  <select
    style={{
      width: '100%',
      padding: '10px 13px',
      borderRadius: 9,
      border: '1.5px solid #a9c7f0',
      background: '#FAFCFF',
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      fontSize: 13.5,
      color: '#0f172a',
      outline: 'none',
      appearance: 'none',
      cursor: 'pointer',
      ...s,
    }}
    onFocus={(e) => (e.target.style.borderColor = '#0b3fa8')}
    onBlur={(e) => (e.target.style.borderColor = '#a9c7f0')}
    {...p}
  >
    {children}
  </select>
);

const BtnPrimary = ({ children, style: s = {}, ...p }) => (
  <button
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      padding: '9px 18px',
      background: '#0b3fa8',
      color: '#fff',
      border: 'none',
      borderRadius: 9,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      transition: '.15s',
      ...s,
    }}
    onMouseEnter={(e) => {
      if (!p.disabled) e.currentTarget.style.background = '#0b3fa8';
    }}
    onMouseLeave={(e) => {
      if (!p.disabled) e.currentTarget.style.background = s.background || '#0b3fa8';
    }}
    {...p}
  >
    {children}
  </button>
);

const BtnGhost = ({ children, ...p }) => (
  <button
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
      transition: '.15s',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#93C5FD')}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#a9c7f0')}
    {...p}
  >
    {children}
  </button>
);

/* ══════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  useDesign();
  const navigate = useNavigate();

  const [userData] = useState(() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : { name: 'Admin', role: 'admin' };
    } catch {
      return { name: 'Admin', role: 'admin' };
    }
  });
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /* data */
  const [pengajuanList, setPengajuanList] = useState([]);
  const [rankingData, setRankingData] = useState([]);
  const [dilewati, setDilewati] = useState([]);
  const [kriteriaTanpaVariasi, setKriteriaTanpaVariasi] = useState([]);
  const [rankingError, setRankingError] = useState(null);
  const [userList, setUserList] = useState([]);
  const [kriteriaData, setKriteriaData] = useState([]);
  const [subKriteriaData, setSubKriteriaData] = useState([]);
  const [selectedKriteria, setSelectedKriteria] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  /* modal — kuesioner */
  const [modalEditId, setModalEditId] = useState(null);
  const [formMentah, setFormMentah] = useState({});

  /* modal — user */
  const [modalUser, setModalUser] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [formUser, setFormUser] = useState({
    name: '',
    username: '',
    password: '',
    role: 'warga',
    rt: '',
    alamat: '',
  });

  /* modal — kriteria */
  const [modalKrit, setModalKrit] = useState(null);
  const [formKrit, setFormKrit] = useState({ nama_kriteria: '', tipe: 'benefit', bobot: 10 });

  /* modal — bobot seluruh kriteria (total wajib 100%) */
  const [modalBobot, setModalBobot] = useState(false);
  const [formBobot, setFormBobot] = useState({});

  /* modal — sub-kriteria */
  const [modalSubKrit, setModalSubKrit] = useState(null);
  const [formSubKrit, setFormSubKrit] = useState({ keterangan: '', nilai: 10 });

  /* modal — laporan hasil import CSV (akun warga yang dibuat) */
  const [hasilImport, setHasilImport] = useState(null);

  /* UI */
  const [searchUser, setSearchUser] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── Auth ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const s = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (!s || !t) {
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(s);
      if (u.role !== 'admin') {
        navigate('/login');
        return;
      }
    } catch {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);

  /* ── Fetch ───────────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (['beranda', 'pengajuan', 'matriks'].includes(activeMenu)) {
        const r = await axios.get(`${API}/admin/pengajuan`, { headers: authH() });
        setPengajuanList(r.data.data || []);
      }
      if (['beranda', 'ranking'].includes(activeMenu)) {
        const r = await axios.get(`${API}/saw/hitung?t=${Date.now()}`, { headers: authH() });
        setRankingData(r.data.data || []);
        setDilewati(r.data.dilewati || []);
        setKriteriaTanpaVariasi(r.data.kriteria_tanpa_variasi || []);
        setRankingError(null);
      }
      if (['beranda', 'users'].includes(activeMenu)) {
        const r = await axios.get(`${API}/users`, { headers: authH() });
        setUserList(r.data.data || []);
      }
      if (activeMenu === 'kriteria') {
        const r = await axios.get(`${API}/kriteria`, { headers: authH() });
        setKriteriaData(r.data.data || []);
      }
      if (activeMenu === 'log') {
        const r = await axios.get(`${API}/logs`, { headers: authH() });
        setActivityLogs(r.data.data || []);
      }
    } catch (e) {
      console.error('Gagal memuat data:', e);
      if (['beranda', 'ranking'].includes(activeMenu)) {
        setRankingError(e.response?.data?.message || 'Server tidak merespons. Muat ulang halaman atau jalankan kalkulasi lagi.');
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

  /* ── Pengajuan ───────────────────────────────────────────────────────── */
  const ubahStatus = async (id, status_baru) => {
    try {
      await axios.put(
        `${API}/admin/pengajuan/${id}/status`,
        { status: status_baru },
        { headers: authH() }
      );
      fetchData();
      showToast(`Status diperbarui ke ${status_baru}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal memperbarui status', 'error');
    }
  };

  const hapusData = async (id) => {
    if (!window.confirm('Hapus permanen data kuesioner ini?')) return;
    try {
      await axios.delete(`${API}/admin/pengajuan/${id}`, { headers: authH() });
      fetchData();
      showToast('Data berhasil dihapus');
    } catch {
      showToast('Gagal menghapus data', 'error');
    }
  };

  const simpanEditKuesioner = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `${API}/admin/pengajuan/${modalEditId}/kuesioner`,
        { jawaban_mentah: formMentah },
        { headers: authH() }
      );
      setModalEditId(null);
      fetchData();
      showToast('Kuesioner berhasil diperbarui');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setLoading(true);
    try {
      const r = await axios.post(`${API}/admin/pengajuan/import`, fd, {
        headers: { ...authH(), 'Content-Type': 'multipart/form-data' },
      });
      // Laporan memuat username + password awal akun yang baru dibuat;
      // password tidak bisa dilihat lagi setelah modal ditutup.
      setHasilImport(r.data);
      showToast(r.data.message || 'Import berhasil');
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      if (data?.laporan) {
        setHasilImport(data);
        showToast(data.message || 'Import dibatalkan', 'error');
      } else {
        showToast(`Import gagal: ${data?.message || err.message}`, 'error');
      }
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const unduhAkunImport = () => {
    const baris = (hasilImport?.laporan || []).filter((b) => b.username);
    const csv = [
      'Nama,RT,Username,Password Awal',
      ...baris.map((b) =>
        [b.nama, b.rt, b.username, b.password_awal || '-']
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'akun_warga_import.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const jalankanSAW = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/saw/hitung?t=${Date.now()}`, { headers: authH() });
      if (r.data.success) {
        setRankingData(r.data.data || []);
        setDilewati(r.data.dilewati || []);
        setKriteriaTanpaVariasi(r.data.kriteria_tanpa_variasi || []);
        setRankingError(null);
        showToast(`Kalkulasi selesai — ${r.data.total} warga terhitung`);
      } else showToast('Kalkulasi SAW gagal', 'error');
    } catch (err) {
      setRankingError(err.response?.data?.message || err.message);
      showToast(`Server error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── User ────────────────────────────────────────────────────────────── */
  const bukaModalUser = (user = null) => {
    if (user) {
      setEditUserId(user.id);
      setFormUser({
        name: user.name,
        username: user.username,
        password: '',
        role: user.role,
        rt: user.rt || '',
        alamat: user.alamat || '',
      });
    } else {
      setEditUserId(null);
      setFormUser({ name: '', username: '', password: '', role: 'warga', rt: '', alamat: '' });
    }
    setModalUser(true);
  };

  const simpanUser = async (e) => {
    e.preventDefault();
    if (!formUser.name.trim()) return showToast('Nama wajib diisi', 'error');
    if (!formUser.username.trim()) return showToast('Username wajib diisi', 'error');
    if (!editUserId && !formUser.password)
      return showToast('Password wajib diisi untuk akun baru', 'error');
    const payload = {
      name: formUser.name.trim(),
      username: formUser.username.trim(),
      role: formUser.role,
      rt: formUser.rt || null,
      alamat: formUser.alamat || '',
    };
    if (formUser.password) payload.password = formUser.password;
    setLoading(true);
    try {
      if (editUserId) {
        await axios.put(`${API}/users/${editUserId}`, payload, { headers: authH() });
        showToast('Akun berhasil diperbarui');
      } else {
        await axios.post(`${API}/users`, payload, { headers: authH() });
        showToast('Akun berhasil ditambahkan');
      }
      setModalUser(false);
      fetchData();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          err.response?.data?.errors?.username?.[0] ||
          'Gagal menyimpan akun',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const hapusUser = async (id) => {
    if (!window.confirm('Yakin ingin menghapus akun ini?')) return;
    try {
      await axios.delete(`${API}/users/${id}`, { headers: authH() });
      fetchData();
      showToast('Akun berhasil dihapus');
    } catch {
      showToast('Gagal menghapus akun', 'error');
    }
  };

  /* ── Kriteria ────────────────────────────────────────────────────────── */
  const simpanKriteria = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Bobot tidak dikirim di sini: total 100% dijaga lewat modal "Atur Bobot".
      await axios.put(
        `${API}/kriteria/${modalKrit.id_kriteria}`,
        {
          nama_kriteria: formKrit.nama_kriteria,
          tipe: formKrit.tipe,
          bobot: modalKrit.bobot,
        },
        { headers: authH() }
      );
      setModalKrit(null);
      fetchData();
      showToast('Kriteria berhasil diperbarui');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const bukaModalBobot = () => {
    const awal = {};
    kriteriaData.forEach((k) => {
      awal[k.id_kriteria] = Number(k.bobot);
    });
    setFormBobot(awal);
    setModalBobot(true);
  };

  const totalBobotForm = Object.values(formBobot).reduce((s, v) => s + (Number(v) || 0), 0);

  const simpanBobot = async (e) => {
    e.preventDefault();
    if (Math.abs(totalBobotForm - 100) > 0.001) {
      showToast(`Total bobot harus tepat 100% (saat ini ${totalBobotForm}%).`, 'error');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API}/admin/kriteria/bobot`, { bobot: formBobot }, { headers: authH() });
      setModalBobot(false);
      fetchData();
      showToast('Bobot kriteria berhasil diperbarui');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan bobot', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSubKriteria = async (k) => {
    setSelectedKriteria(k);
    setSubKriteriaData([]);
    try {
      const r = await axios.get(`${API}/kriteria/${k.id_kriteria}/subkriteria`, {
        headers: authH(),
      });
      setSubKriteriaData(r.data.data || []);
    } catch {
      showToast('Gagal memuat sub-kriteria', 'error');
    }
  };

  const simpanSubKriteria = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/admin/subkriteria/${modalSubKrit.id_subkriteria}`, formSubKrit, {
        headers: authH(),
      });
      setModalSubKrit(null);
      loadSubKriteria(selectedKriteria);
      showToast('Sub-kriteria berhasil diperbarui');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Computed ────────────────────────────────────────────────────────── */
  const countPending = pengajuanList.filter((p) => !p.status || p.status === 'menunggu').length;
  const countDiterima = pengajuanList.filter((p) => p.status === 'disetujui').length;
  const countDitolak = pengajuanList.filter((p) => p.status === 'ditolak').length;

  const filteredUsers = userList.filter((u) => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchSearch =
      !searchUser ||
      u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchUser.toLowerCase());
    return matchRole && matchSearch;
  });

  const filteredPengajuan =
    filterStatus === 'all'
      ? pengajuanList
      : pengajuanList.filter((p) =>
          filterStatus === 'menunggu'
            ? !p.status || p.status === 'menunggu'
            : p.status === filterStatus
        );

  // Tabel berubah jadi kartu di HP dan butuh label kolom di tiap sel.
  useEffect(() => {
    pasangLabelTabel();
  });

  /* ── Nav ─────────────────────────────────────────────────────────────── */
  const navGroups = [
    {
      label: 'Data & Laporan',
      items: [
        { key: 'beranda', icon: 'dashboard', label: 'Beranda' },
        { key: 'pengajuan', icon: 'description', label: 'Data Kuesioner', badge: countPending },
        { key: 'matriks', icon: 'grid_view', label: 'Matriks SAW' },
        { key: 'pengaduan', icon: 'campaign', label: 'Pengaduan' },
        { key: 'ranking', icon: 'leaderboard', label: 'Hasil Keputusan' },
      ],
    },
    {
      label: 'Pengaturan',
      items: [
        { key: 'kriteria', icon: 'tune', label: 'Kelola Kriteria' },
        { key: 'users', icon: 'manage_accounts', label: 'Kelola Akun' },
        { key: 'log', icon: 'history', label: 'Activity Log' },
      ],
    },
  ];

  const pageTitle =
    {
      beranda: 'Dashboard Administrator',
      pengajuan: 'Manajemen Kuesioner Warga',
      matriks: 'Matriks Nilai SAW',
      pengaduan: 'Pengaduan Warga',
      ranking: 'Hasil Keputusan SAW',
      kriteria: 'Kelola Kriteria & Bobot',
      users: 'Manajemen Akun Sistem',
      log: 'Activity Log Sistem',
    }[activeMenu] || '';

  /* ── Inline styles ───────────────────────────────────────────────────── */
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

  /* ══ RENDER ════════════════════════════════════════════════════════════ */
  return (
    <div
      id="print-root"
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
            minWidth: 200,
          }}
        >
          <MI name={toast.type === 'error' ? 'error' : 'check_circle'} fill size={17} />
          {toast.msg}
        </div>
      )}

      {/* ════════ SIDEBAR ════════ */}
      <aside
        className={`no-print admin-sidebar ${sidebarOpen ? 'open' : ''}`}
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
          className="admin-sidebar-brand"
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid #a9c7f0',
            background: 'linear-gradient(135deg, #0b3fa8 0%, #062b6e 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circles like Login */}
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
                SPK SAW Engine
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
              <div style={{ fontSize: 11, color: '#0b3fa8', fontWeight: 600 }}>Administrator</div>
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
                {group.items.map(({ key, icon, label, badge }) => {
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
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div
          style={{
            padding: '12px 12px 16px',
            borderTop: '1px solid rgba(255,255,255,.07)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
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
              transition: '.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            <MI name="logout" size={15} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* ════════ MAIN ════════ */}
      <div className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header
          className="no-print admin-header"
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
            className="admin-burger no-print"
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
          <div className="admin-header-title" style={{ display: 'flex', align: 'center', gap: 12 }}>
            <div>
              <h1
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {pageTitle}
              </h1>
              {loading && (
                <p style={{ fontSize: 11, color: '#334155', margin: 0 }}>Memuat data...</p>
              )}
            </div>
          </div>

          <div
            className="admin-header-actions"
            style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}
          >
            {['pengajuan', 'matriks', 'ranking', 'log'].includes(activeMenu) && (
              <BtnGhost onClick={() => window.print()}>
                <MI name="print" size={15} /> Cetak
              </BtnGhost>
            )}
            {activeMenu === 'pengajuan' && (
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 18px',
                  background: '#5b21b6',
                  color: '#fff',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: '.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#4c1d95')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#5b21b6')}
              >
                <MI name="upload_file" size={15} />
                {loading ? 'Memproses...' : 'Import CSV/XLSX'}
                <input
                  type="file"
                  accept=".csv,.txt,.xlsx"
                  style={{ display: 'none' }}
                  onChange={handleImportCSV}
                  disabled={loading}
                />
              </label>
            )}
            {activeMenu === 'ranking' && (
              <BtnPrimary
                onClick={jalankanSAW}
                disabled={loading}
                style={{ background: '#065f46' }}
              >
                <MI name="calculate" size={15} />
                {loading ? 'Menghitung...' : 'Hitung Ulang SAW'}
              </BtnPrimary>
            )}
            {activeMenu === 'users' && (
              <BtnPrimary onClick={() => bukaModalUser(null)}>
                <MI name="person_add" size={15} /> Tambah Akun
              </BtnPrimary>
            )}
          </div>
        </header>

        <main
          id="print-main"
          className="admin-main-pad"
          style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#F0F6FF' }}
        >
          {/* ══════ BERANDA ══════ */}
          {activeMenu === 'beranda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Stat cards */}
              <div className="mob-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {[
                  {
                    label: 'Total Akun Sistem',
                    value: userList.length,
                    icon: 'group',
                    color: '#0b3fa8',
                    bg: '#dbeafe',
                    sub: 'Admin, RW, RT, Warga',
                  },
                  {
                    label: 'Total Kuesioner',
                    value: pengajuanList.length,
                    icon: 'fact_check',
                    color: '#5b21b6',
                    bg: '#f3e8ff',
                    sub: 'Semua status',
                  },
                  {
                    label: 'Warga Disetujui',
                    value: countDiterima,
                    icon: 'verified',
                    color: '#065f46',
                    bg: '#dcfce7',
                    sub: 'Siap kalkulasi SAW',
                  },
                  {
                    label: 'Menunggu Verifikasi',
                    value: countPending,
                    icon: 'pending_actions',
                    color: '#92400e',
                    bg: '#fef9c3',
                    sub: 'Perlu tindakan',
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
                    <div style={{ fontSize: 11, color: '#334155', marginTop: 5 }}>{sub}</div>
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
                    Pusat Kendali Administrator
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
                    Import Data Massal atau Jalankan Kalkulasi SAW
                  </h2>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: 'rgba(255,255,255,.9)',
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    Data CSV diproses menjadi data warga + pengajuan baru dengan status{' '}
                    <strong style={{ color: '#ffffff' }}>menunggu</strong>, lalu diverifikasi RT
                    wilayahnya. Setelah ada yang disetujui, jalankan kalkulasi SAW untuk
                    mendapatkan peringkat terbaru.
                  </p>
                </div>
                <div className="mob-banner-actions" style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 22px',
                      background: '#fff',
                      color: '#0f172a',
                      borderRadius: 10,
                      fontSize: 13.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: '.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <MI name="upload_file" size={18} /> Import CSV/XLSX
                    <input
                      type="file"
                      accept=".csv,.txt,.xlsx"
                      style={{ display: 'none' }}
                      onChange={handleImportCSV}
                      disabled={loading}
                    />
                  </label>
                  <button
                    onClick={jalankanSAW}
                    disabled={loading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 22px',
                      background: '#065f46',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 13.5,
                      fontWeight: 800,
                      cursor: loading ? 'default' : 'pointer',
                    }}
                  >
                    <MI name="calculate" size={18} />
                    {loading ? 'Menghitung...' : 'Kalkulasi SAW'}
                  </button>
                </div>
              </div>

              {/* Bottom grid */}
              <div className="mob-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {/* Top 5 Ranking */}
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
                      padding: '16px 22px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      Top 5 Peringkat Global
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
                      Selengkapnya
                    </button>
                  </div>
                  <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Rank', 'Nama Warga', 'RT', 'Skor (V)'].map((h) => (
                          <th key={h} style={tblTh}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rankingData.slice(0, 5).map((r, i) => (
                        <tr
                          key={i}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ ...tblTd, width: 52 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: i === 0 ? '#0b3fa8' : '#f1f5f9',
                                color: i === 0 ? '#fff' : '#334155',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              {r.ranking || i + 1}
                            </div>
                          </td>
                          <td style={{ ...tblTd, fontWeight: 600 }}>{r.nama_warga}</td>
                          <td style={{ ...tblTd, fontSize: 12 }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 5,
                                background: '#F0F6FF',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#334155',
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
                            Belum ada data. Jalankan Kalkulasi SAW.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Statistik */}
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    border: '1px solid #DBEAFE',
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    Statistik Status Pengajuan
                  </div>
                  {[
                    {
                      label: 'Disetujui',
                      count: countDiterima,
                      color: '#065f46',
                      track: '#dcfce7',
                    },
                    { label: 'Ditolak', count: countDitolak, color: '#b91c1c', track: '#fee2e2' },
                    { label: 'Pending', count: countPending, color: '#92400e', track: '#fef9c3' },
                  ].map(({ label, count, color, track }) => {
                    const total = pengajuanList.length;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={label}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 13,
                            fontWeight: 600,
                            marginBottom: 7,
                          }}
                        >
                          <span style={{ color: '#0f172a' }}>{label}</span>
                          <span style={{ color }}>
                            {count} warga{' '}
                            <span style={{ color: '#334155', fontWeight: 400 }}>({pct}%)</span>
                          </span>
                        </div>
                        <div
                          style={{
                            height: 7,
                            borderRadius: 4,
                            background: track,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 4,
                              background: color,
                              width: `${pct}%`,
                              transition: 'width .5s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div
                    style={{
                      paddingTop: 8,
                      borderTop: '1px solid #f1f5f9',
                      fontSize: 12.5,
                      color: '#334155',
                    }}
                  >
                    Total pengajuan:{' '}
                    <strong style={{ color: '#0f172a' }}>{pengajuanList.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════ PENGAJUAN & MATRIKS ══════ */}
          {(activeMenu === 'pengajuan' || activeMenu === 'matriks') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Print header */}
              <div className="print-header" style={{ display: 'none' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700 }}>
                  {activeMenu === 'matriks' ? 'MATRIKS NILAI SAW' : 'DATA KUESIONER WARGA'}
                </h2>
                <p>
                  Dicetak: {new Date().toLocaleString('id-ID')} &nbsp;|&nbsp; Oleh: {userData.name}
                </p>
              </div>

              {/* Filter bar */}
              {activeMenu === 'pengajuan' && (
                <div
                  className="no-print"
                  style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
                >
                  {['all', 'menunggu', 'disetujui', 'ditolak'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: `1.5px solid ${filterStatus === s ? '#0b3fa8' : '#cbd5e1'}`,
                        background: filterStatus === s ? '#0b3fa8' : '#fff',
                        color: filterStatus === s ? '#fff' : '#334155',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: '.12s',
                      }}
                    >
                      {s === 'all'
                        ? 'Semua'
                        : s === 'menunggu'
                          ? 'Pending'
                          : s === 'disetujui'
                            ? 'Diterima'
                            : 'Ditolak'}
                      {s !== 'all' && (
                        <span style={{ marginLeft: 6, opacity: 0.8 }}>
                          (
                          {s === 'menunggu'
                            ? countPending
                            : s === 'disetujui'
                              ? countDiterima
                              : countDitolak}
                          )
                        </span>
                      )}
                    </button>
                  ))}
                  <span
                    style={{ marginLeft: 'auto', fontSize: 12, color: '#334155', fontWeight: 600 }}
                  >
                    {filteredPengajuan.length} dari {pengajuanList.length} data
                  </span>
                </div>
              )}

              {/* Peringatan matriks belum lengkap */}
              {activeMenu === 'matriks' &&
                pengajuanList.some(
                  (p) => p.status === 'disetujui' && !punyaMatriks(p)
                ) && (
                  <div
                    className="no-print"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: '#fef3c7',
                      border: '1px solid #fcd34d',
                      color: '#92400e',
                      fontSize: 12.5,
                      fontWeight: 600,
                    }}
                  >
                    <MI name="warning" size={18} style={{ color: '#92400e' }} />
                    <span>
                      Sebagian warga belum punya matriks penilaian lengkap (10 kriteria). Baris
                      bertanda “—” belum dihitung SAW. Jalankan “Sapu Ajaib” atau setujui ulang
                      pengajuannya.
                    </span>
                  </div>
                )}

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
                      {activeMenu === 'matriks'
                        ? `Matriks Nilai SAW — ${pengajuanList.filter((p) => p.status === 'disetujui').length} warga disetujui`
                        : `Total ${filteredPengajuan.length} Kuesioner`}
                    </div>
                    <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                      {activeMenu === 'matriks'
                        ? 'Nilai rij dari sub-kriteria masing-masing warga'
                        : 'Data kuesioner dari seluruh wilayah RT'}
                    </div>
                  </div>
                {activeMenu === 'pengajuan' && (
                  <TombolExport jenis="pengajuan" label="data pengajuan" onInfo={showToast} />
                )}
                {activeMenu === 'matriks' && (
                  <div className="matriks-aksi">
                    <div className="mob-scroll-hint">
                      <MI name="info" size={15} /> Geser tabel ke samping untuk melihat semua kriteria.
                    </div>
                    <TombolExport jenis="saw" label="matriks & ranking SAW" onInfo={showToast} />
                  </div>
                )}
                </div>
                <table
                  className={activeMenu === 'pengajuan' ? 'mob-table' : undefined}
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: activeMenu === 'matriks' ? 900 : undefined,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={tblTh}>No</th>
                      <th style={{ ...tblTh, minWidth: 160 }}>Nama Warga</th>
                      {Array.from({ length: 10 }, (_, i) => (
                        <th key={i} style={{ ...tblTh, minWidth: 68, textAlign: 'center' }}>
                          <span style={{ color: '#0b3fa8' }}>C{i + 1}</span>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: 9.5,
                              color: '#334155',
                              marginTop: 1,
                            }}
                          >
                            {activeMenu === 'matriks' ? 'Nilai' : KLABEL[i]}
                          </div>
                        </th>
                      ))}
                      <th
                        className="col-status"
                        style={{ ...tblTh, textAlign: 'center', minWidth: 80 }}
                      >
                        Status
                      </th>
                      {activeMenu === 'pengajuan' && (
                        <th className="col-aksi" style={{ ...tblTh, textAlign: 'center' }}>
                          Aksi
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(activeMenu === 'matriks'
                      ? pengajuanList.filter((p) => p.status === 'disetujui')
                      : filteredPengajuan
                    ).map((p, i) => {
                      const jObj = parseJawaban(p.jawaban_mentah);
                      return (
                        <tr
                          key={p.id_pengajuan || i}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ ...tblTd, fontWeight: 700, color: '#334155', width: 44 }}>
                            {i + 1}
                          </td>
                          <td style={tblTd}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>
                              {p.warga?.nama_lengkap || p.warga?.name || 'Tanpa Nama'}
                            </div>
                            <div style={{ fontSize: 11, color: '#334155', marginTop: 1 }}>
                              {rtLabel(p.warga?.rt)}
                            </div>
                          </td>
                          {Array.from({ length: 10 }, (_, k) => (
                            <td
                              key={k}
                              style={{ ...tblTd, textAlign: 'center', padding: '13px 8px' }}
                            >
                              {activeMenu === 'matriks' ? (
                                <span
                                  className="matriks-val"
                                  title={
                                    getSkor(p, k + 1) === null
                                      ? 'Matriks belum di-generate untuk kriteria ini'
                                      : undefined
                                  }
                                  style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: getSkor(p, k + 1) === null ? '#92400e' : '#111827',
                                  }}
                                >
                                  {getSkor(p, k + 1) ?? '—'}
                                </span>
                              ) : (
                                <span
                                  className="jawaban-sel"
                                  style={{
                                    fontSize: 11,
                                    color: '#334155',
                                    lineHeight: 1.4,
                                    display: 'block',
                                    maxWidth: 70,
                                    margin: '0 auto',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={jObj?.[`q${k + 1}`]}
                                >
                                  {jObj?.[`q${k + 1}`] || '-'}
                                </span>
                              )}
                            </td>
                          ))}
                          <td
                            className="col-status"
                            style={{ ...tblTd, textAlign: 'center', padding: '10px 12px' }}
                          >
                            <select
                              value={p.status || 'menunggu'}
                              onChange={(e) => ubahStatus(p.id_pengajuan, e.target.value)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: 8,
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                outline: 'none',
                                background:
                                  p.status === 'disetujui'
                                    ? '#dcfce7'
                                    : p.status === 'ditolak'
                                      ? '#fee2e2'
                                      : '#fef9c3',
                                color:
                                  p.status === 'disetujui'
                                    ? '#166534'
                                    : p.status === 'ditolak'
                                      ? '#b91c1c'
                                      : '#92400e',
                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                              }}
                            >
                              <option value="menunggu">PENDING</option>
                              <option value="disetujui">DITERIMA</option>
                              <option value="ditolak">DITOLAK</option>
                            </select>
                          </td>
                          {activeMenu === 'pengajuan' && (
                            <td className="col-aksi" style={{ ...tblTd, padding: '10px 14px' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                <button
                                  onClick={() => {
                                    setModalEditId(p.id_pengajuan);
                                    setFormMentah(jObj || {});
                                  }}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#EBF3FF',
                                    color: '#0b3fa8',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <MI name="edit" size={15} />
                                </button>
                                <button
                                  onClick={() => hapusData(p.id_pengajuan)}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <MI name="delete" size={15} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {pengajuanList.length === 0 && (
                      <tr>
                        <td
                          colSpan="14"
                          style={{
                            padding: '48px',
                            textAlign: 'center',
                            color: '#334155',
                            fontSize: 13,
                          }}
                        >
                          Belum ada data kuesioner.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════ PENGADUAN ══════ */}
          {activeMenu === 'pengaduan' && <PengaduanPanel role="admin" />}

          {/* ══════ RANKING ══════ */}
          {activeMenu === 'ranking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="print-header" style={{ display: 'none' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700 }}>
                  HASIL KEPUTUSAN SAW — PERINGKAT PRIORITAS GLOBAL
                </h2>
                <p>
                  Dicetak: {new Date().toLocaleString('id-ID')} &nbsp;|&nbsp; Oleh: {userData.name}
                </p>
              </div>

              {/* Info bar */}
              <div
                className="mob-card-head"
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '14px 20px',
                  border: '1px solid #DBEAFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 auto' }}>
                  <MI name="info" fill size={18} style={{ color: '#0b3fa8', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#334155', minWidth: 0 }}>
                    Total <strong style={{ color: '#0f172a' }}>{rankingData.length}</strong> warga
                    terhitung berdasarkan bobot dan nilai sub-kriteria aktif. Nilai V dihitung
                    menggunakan metode SAW di sisi server (PHP).
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', maxWidth: '100%' }}>
                  <BtnPrimary
                    onClick={jalankanSAW}
                    disabled={loading}
                    style={{ background: '#065f46', minHeight: 40 }}
                  >
                    <MI name="refresh" size={15} />
                    {loading ? 'Menghitung...' : 'Hitung Ulang'}
                  </BtnPrimary>
                  <TombolExport jenis="saw" label="hasil perangkingan SAW" onInfo={showToast} />
                </div>
              </div>

              {/* Status ranking: warga terlewat & kriteria konstan (BUG-09/BUG-05) */}
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
                <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {[
                        'Peringkat',
                        'Nama Warga',
                        'Alamat',
                        'RT',
                        'Nilai Preferensi (V)',
                      ].map((h) => (
                        <th key={h} style={tblTh}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rankingData.map((w, i) => (
                      <tr
                        key={i}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ ...tblTd, width: 70 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              // Tangga warna: putih di atas biru gelap hanya lolos
                              // WCAG AA sampai #2563eb; peringkat 3 memakai latar
                              // terang + teks gelap agar tetap terbaca.
                              background:
                                i === 0
                                  ? '#0b3fa8'
                                  : i === 1
                                    ? '#2563eb'
                                    : i === 2
                                      ? '#bfdbfe'
                                      : '#f1f5f9',
                              color: i === 2 ? '#1e3a8a' : i < 2 ? '#fff' : '#334155',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                            }}
                          >
                            {w.ranking || i + 1}
                          </div>
                        </td>
                        <td style={{ ...tblTd, fontWeight: 700 }}>{w.nama_warga}</td>
                        <td
                          style={{
                            ...tblTd,
                            fontSize: 12.5,
                            color: '#334155',
                            maxWidth: 180,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={w.alamat}
                        >
                          {w.alamat || '-'}
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
                        <td
                          style={{
                            ...tblTd,
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: 15,
                            color: i === 0 ? '#0b3fa8' : '#334155',
                          }}
                        >
                          {Number(w.skor_saw).toFixed(6)}
                        </td>
                      </tr>
                    ))}
                    {rankingData.length === 0 && (
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
                          Belum ada hasil. Klik "Hitung Ulang" untuk memulai kalkulasi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════ KRITERIA ══════ */}
          {activeMenu === 'kriteria' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #DBEAFE',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="mob-card-head"
                  style={{
                    padding: '18px 22px',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#FAFCFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      Daftar Kriteria SAW
                    </div>
                    <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                      Normalisasi bobot dilakukan otomatis oleh SawController (bobot / totalBobot)
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '7px 14px',
                        borderRadius: 9,
                        background:
                          Math.abs(
                            kriteriaData.reduce((s, k) => s + Number(k.bobot), 0) - 100
                          ) < 0.001
                            ? '#EBF3FF'
                            : '#fef3c7',
                      }}
                    >
                      <MI name="calculate" size={15} style={{ color: '#0b3fa8' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0b3fa8' }}>
                        Total Bobot: {kriteriaData.reduce((s, k) => s + Number(k.bobot), 0)}%
                      </span>
                    </div>
                    <button
                      onClick={bukaModalBobot}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 9,
                        border: 'none',
                        background: '#0b3fa8',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <MI name="tune" size={15} /> Atur Bobot
                    </button>
                  </div>
                </div>
                <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['No', 'Kode', 'Nama Kriteria', 'Tipe', 'Bobot', 'Sub-Kriteria', 'Aksi'].map(
                        (h) => (
                          <th key={h} style={tblTh}>
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {kriteriaData.length > 0 ? (
                      kriteriaData.map((k, i) => (
                        <tr
                          key={k.id_kriteria}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ ...tblTd, fontWeight: 700, color: '#334155', width: 44 }}>
                            {i + 1}
                          </td>
                          <td style={tblTd}>
                            <span
                              style={{
                                padding: '3px 9px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                background: '#EBF3FF',
                                color: '#0b3fa8',
                              }}
                            >
                              C{k.id_kriteria}
                            </span>
                          </td>
                          <td style={{ ...tblTd, fontWeight: 600 }}>{k.nama_kriteria}</td>
                          <td style={tblTd}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 700,
                                background: k.tipe === 'benefit' ? '#dcfce7' : '#fee2e2',
                                color: k.tipe === 'benefit' ? '#166534' : '#b91c1c',
                              }}
                            >
                              {k.tipe === 'benefit' ? 'Benefit' : 'Cost'}
                            </span>
                          </td>
                          <td style={tblTd}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  height: 6,
                                  width: 80,
                                  borderRadius: 4,
                                  background: '#cbd5e1',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    borderRadius: 4,
                                    background: '#0b3fa8',
                                    width: `${Math.min(k.bobot, 100)}%`,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: '#0b3fa8',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {k.bobot}
                              </span>
                            </div>
                          </td>
                          <td style={tblTd}>
                            <button
                              onClick={() => loadSubKriteria(k)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 7,
                                border: 'none',
                                background: '#F0F6FF',
                                color: '#0b3fa8',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <MI name="list" size={14} /> Lihat ({k.sub_kriteria_count || 4})
                            </button>
                          </td>
                          <td style={tblTd}>
                            <button
                              onClick={() => {
                                setModalKrit(k);
                                setFormKrit({
                                  nama_kriteria: k.nama_kriteria,
                                  tipe: k.tipe,
                                  bobot: k.bobot,
                                });
                              }}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: 'none',
                                background: '#EBF3FF',
                                color: '#0b3fa8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <MI name="edit" size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          style={{
                            padding: '48px',
                            textAlign: 'center',
                            color: '#334155',
                            fontSize: 13,
                          }}
                        >
                          Belum ada data kriteria. Pastikan endpoint GET /api/kriteria tersedia.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sub-kriteria panel */}
              {selectedKriteria && (
                <div
                  className="tabel-scroll"

                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    border: '1px solid #bfdbfe',

                  }}

                >
                  <div
                    className="mob-card-head"
                    style={{
                      padding: '16px 22px',
                      borderBottom: '1px solid #e0f2fe',
                      background: '#f0f9ff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        Sub-Kriteria: {selectedKriteria.nama_kriteria} (C
                        {selectedKriteria.id_kriteria})
                      </div>
                      <div style={{ fontSize: 12, color: '#0b3fa8', marginTop: 2 }}>
                        Nilai ini dipakai SawController sebagai input matriks keputusan
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedKriteria(null)}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#334155',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        minHeight: 40,
                        padding: '0 6px',
                      }}
                    >
                      Tutup
                    </button>
                  </div>
                  <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['No', 'Keterangan / Pilihan Jawaban', 'Nilai (rij)', 'Aksi'].map((h) => (
                          <th key={h} style={tblTh}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {subKriteriaData.map((sk, i) => (
                        <tr
                          key={sk.id_subkriteria}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ ...tblTd, fontWeight: 700, color: '#334155', width: 44 }}>
                            {i + 1}
                          </td>
                          <td style={tblTd}>{sk.keterangan}</td>
                          <td style={tblTd}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: 7,
                                fontSize: 13,
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                background:
                                  sk.nilai >= 7.5
                                    ? '#dcfce7'
                                    : sk.nilai >= 5
                                      ? '#fef9c3'
                                      : '#fee2e2',
                                color:
                                  sk.nilai >= 7.5
                                    ? '#166534'
                                    : sk.nilai >= 5
                                      ? '#92400e'
                                      : '#b91c1c',
                              }}
                            >
                              {sk.nilai}
                            </span>
                          </td>
                          <td style={tblTd}>
                            <button
                              onClick={() => {
                                setModalSubKrit(sk);
                                setFormSubKrit({ keterangan: sk.keterangan, nilai: sk.nilai });
                              }}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: 'none',
                                background: '#EBF3FF',
                                color: '#0b3fa8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <MI name="edit" size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {subKriteriaData.length === 0 && (
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
                            Klik "Lihat" pada tabel kriteria untuk memuat sub-kriteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════ USERS ══════ */}
          {activeMenu === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}
                className="no-print"
              >
                <div style={{ position: 'relative' }}>
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
                    style={{
                      paddingLeft: 36,
                      paddingRight: 14,
                      height: 38,
                      borderRadius: 9,
                      border: '1.5px solid #a9c7f0',
                      background: '#fff',
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                      fontSize: 13,
                      color: '#0f172a',
                      outline: 'none',
                      width: 240,
                    }}
                    placeholder="Cari nama atau username..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = '#0b3fa8')}
                    onBlur={(e) => (e.target.style.borderColor = '#a9c7f0')}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['all', 'admin', 'rw', 'rt', 'warga'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilterRole(r)}
                      style={{
                        padding: '7px 13px',
                        borderRadius: 8,
                        border: `1.5px solid ${filterRole === r ? '#0b3fa8' : '#cbd5e1'}`,
                        background: filterRole === r ? '#0b3fa8' : '#fff',
                        color: filterRole === r ? '#fff' : '#334155',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: '.12s',
                      }}
                    >
                      {r === 'all' ? 'Semua' : r.toUpperCase()}
                    </button>
                  ))}
                </div>
                <span
                  style={{ marginLeft: 'auto', fontSize: 12, color: '#334155', fontWeight: 600 }}
                >
                  {filteredUsers.length} akun
                </span>
                <TombolExport jenis="users" label="daftar akun" onInfo={showToast} />
              </div>

              <div
                className="tabel-scroll"
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #DBEAFE',
                }}
              >
                <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {[
                        'No',
                        'Profil & Nama',
                        'Username',
                        'RT',
                        'Tautan Warga',
                        'Alamat',
                        'Hak Akses',
                        'Aksi',
                      ].map(
                        (h) => (
                          <th key={h} style={tblTh}>
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => {
                      const rc = roleCfg(u.role, u.rt);
                      return (
                        <tr
                          key={u.id}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ ...tblTd, fontWeight: 700, color: '#334155', width: 44 }}>
                            {i + 1}
                          </td>
                          <td style={tblTd}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                                {u.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</span>
                            </div>
                          </td>
                          <td
                            style={{
                              ...tblTd,
                              fontFamily: 'monospace',
                              fontSize: 12.5,
                              color: '#334155',
                            }}
                          >
                            {u.username}
                          </td>
                          <td style={{ ...tblTd, textAlign: 'center', fontSize: 12.5 }}>
                            {u.rt ? rtLabel(u.rt) : '-'}
                          </td>
                          <td style={tblTd}>
                            {u.role !== 'warga' ? (
                              <span style={{ color: '#475569', fontSize: 12 }}>—</span>
                            ) : u.id_warga ? (
                              <span
                                title={`Tertaut ke warga #${u.id_warga}`}
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: '#d1fae5',
                                  color: '#065f46',
                                }}
                              >
                                ✓ #{u.id_warga}
                              </span>
                            ) : (
                              <span
                                title="Akun belum tertaut ke data warga, jadi tidak bisa mengajukan. Tautkan lewat tombol edit."
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: '#fef3c7',
                                  color: '#92400e',
                                }}
                              >
                                ⚠ belum
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              ...tblTd,
                              fontSize: 12.5,
                              color: '#334155',
                              maxWidth: 160,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={u.alamat}
                          >
                            {u.alamat || '-'}
                          </td>
                          <td style={tblTd}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: rc.bg,
                                color: rc.color,
                              }}
                            >
                              {rc.label}
                            </span>
                          </td>
                          <td style={tblTd}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => bukaModalUser(u)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: 'none',
                                  background: '#EBF3FF',
                                  color: '#0b3fa8',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <MI name="edit" size={15} />
                              </button>
                              <button
                                onClick={() => hapusUser(u.id)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: 'none',
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <MI name="delete" size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan="7"
                          style={{
                            padding: '48px',
                            textAlign: 'center',
                            color: '#334155',
                            fontSize: 13,
                          }}
                        >
                          Tidak ada akun yang sesuai filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════ ACTIVITY LOG ══════ */}
          {activeMenu === 'log' && (
            <div
              className="tabel-scroll"

              style={{
                background: '#fff',
                borderRadius: 14,
                border: '1px solid #DBEAFE',

              }}

            >
              <div className="print-header" style={{ display: 'none' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700 }}>ACTIVITY LOG SISTEM</h2>
                <p>
                  Dicetak: {new Date().toLocaleString('id-ID')} &nbsp;|&nbsp; Oleh: {userData.name}
                </p>
              </div>
              <div
                className="mob-card-head"
                style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#FAFCFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    Riwayat Aktivitas Sistem
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                    Menampilkan 500 aktivitas terbaru — endpoint: GET /api/logs
                  </div>
                </div>
                <span
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    background: '#F0F6FF',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#334155',
                  }}
                >
                  {activityLogs.length} entri
                </span>
              </div>
              {activityLogs.length > 0 ? (
                <table className="mob-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['No', 'Waktu', 'Pengguna', 'Hak Akses', 'Deskripsi Aktivitas'].map((h) => (
                        <th key={h} style={tblTh}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log, i) => {
                      const rc = roleCfg(log.role, null);
                      return (
                        <tr
                          key={log.id || i}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ ...tblTd, fontWeight: 700, color: '#334155', width: 44 }}>
                            {i + 1}
                          </td>
                          <td
                            style={{
                              ...tblTd,
                              fontFamily: 'monospace',
                              fontSize: 12,
                              color: '#334155',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {fmtDateTime(log.created_at)}
                          </td>
                          <td style={{ ...tblTd, fontWeight: 700 }}>{log.user_name}</td>
                          <td style={tblTd}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: rc.bg,
                                color: rc.color,
                              }}
                            >
                              {rc.label}
                            </span>
                          </td>
                          <td style={{ ...tblTd, fontSize: 13, color: '#334155' }}>{log.aksi}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '64px 32px',
                    gap: 12,
                  }}
                >
                  <MI name="history" size={48} style={{ color: '#475569' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                    Belum ada aktivitas tercatat
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: '#334155',
                      textAlign: 'center',
                      lineHeight: 1.6,
                    }}
                  >
                    Activity log akan terisi otomatis saat admin, RT, atau RW melakukan aksi di
                    sistem.
                    <br />
                    Pastikan{' '}
                    <code style={{ background: '#F0F6FF', padding: '1px 5px', borderRadius: 4 }}>
                      LogController::catatLog()
                    </code>{' '}
                    dipanggil di setiap controller.
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ════ MODAL: Edit Kuesioner ════ */}
      {modalEditId && (
        <Overlay onClose={() => setModalEditId(null)}>
          <ModalBox maxW={740} fullH>
            <ModalHead
              title="Edit Jawaban Kuesioner"
              sub={`ID Pengajuan #${modalEditId}`}
              onClose={() => setModalEditId(null)}
            />
            <form
              onSubmit={simpanEditKuesioner}
              style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}
            >
              <div
                className="mob-two-col"
                style={{
                  overflowY: 'auto',
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                  flex: 1,
                }}
              >
                {KLABEL_FULL.map((h, i) => {
                  const key = `q${i + 1}`;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 12,
                        border: `1.5px solid ${formMentah[key] ? '#bfdbfe' : '#cbd5e1'}`,
                        background: formMentah[key] ? '#f0f9ff' : '#f8fafc',
                        transition: '.15s',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#334155',
                          textTransform: 'uppercase',
                          letterSpacing: '.07em',
                          marginBottom: 10,
                        }}
                      >
                        <span style={{ color: '#0b3fa8', marginRight: 4 }}>C{i + 1}</span>
                        {h}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <Sel
                          required
                          value={formMentah[key] || ''}
                          onChange={(e) => setFormMentah({ ...formMentah, [key]: e.target.value })}
                        >
                          <option value="" disabled>
                            Pilih jawaban
                          </option>
                          {(OPSI[key] || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </Sel>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  padding: '16px 24px',
                  borderTop: '1px solid #cbd5e1',
                  flexShrink: 0,
                }}
              >
                <BtnGhost onClick={() => setModalEditId(null)}>Batal</BtnGhost>
                <BtnPrimary type="submit" disabled={loading}>
                  <MI name={loading ? 'hourglass_empty' : 'save'} size={15} />
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </BtnPrimary>
              </div>
            </form>
          </ModalBox>
        </Overlay>
      )}

      {/* ════ MODAL: Tambah/Edit User ════ */}
      {modalUser && (
        <Overlay onClose={() => setModalUser(false)}>
          <ModalBox maxW={520}>
            <ModalHead
              title={editUserId ? 'Edit Akun Sistem' : 'Tambah Akun Baru'}
              sub={
                editUserId
                  ? 'Kosongkan password jika tidak ingin mengubahnya'
                  : 'Buat akun baru untuk Admin, RW, RT, atau Warga'
              }
              onClose={() => setModalUser(false)}
            />
            <form
              onSubmit={simpanUser}
              style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div className="mob-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <Lbl required>Nama Lengkap</Lbl>
                  <Inp
                    required
                    placeholder="Nama lengkap"
                    value={formUser.name}
                    onChange={(e) => setFormUser({ ...formUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <Lbl required>Username</Lbl>
                  <Inp
                    required
                    placeholder="username_unik"
                    value={formUser.username}
                    onChange={(e) => setFormUser({ ...formUser, username: e.target.value })}
                  />
                </div>
                <div>
                  <Lbl required={!editUserId}>Password</Lbl>
                  <Inp
                    type="password"
                    required={!editUserId}
                    placeholder={editUserId ? 'Kosongkan jika tidak diubah' : 'Min. 6 karakter'}
                    value={formUser.password}
                    onChange={(e) => setFormUser({ ...formUser, password: e.target.value })}
                  />
                </div>
                <div>
                  <Lbl required>Hak Akses</Lbl>
                  <div style={{ position: 'relative' }}>
                    <Sel
                      required
                      value={formUser.role}
                      onChange={(e) => setFormUser({ ...formUser, role: e.target.value })}
                    >
                      <option value="warga">Warga</option>
                      <option value="rt">Ketua RT</option>
                      <option value="rw">Ketua RW</option>
                      <option value="admin">Administrator</option>
                    </Sel>
                  </div>
                </div>
                {['rt', 'warga'].includes(formUser.role) && (
                  <div>
                    <Lbl>Nomor RT</Lbl>
                    <Inp
                      placeholder="Contoh: 1"
                      value={formUser.rt}
                      onChange={(e) => setFormUser({ ...formUser, rt: e.target.value })}
                    />
                  </div>
                )}
                <div style={{ gridColumn: '1/-1' }}>
                  <Lbl>Alamat Domisili</Lbl>
                  <textarea
                    rows={2}
                    placeholder="Alamat lengkap"
                    value={formUser.alamat}
                    onChange={(e) => setFormUser({ ...formUser, alamat: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 13px',
                      borderRadius: 9,
                      border: '1.5px solid #a9c7f0',
                      background: '#FAFCFF',
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                      fontSize: 13.5,
                      color: '#0f172a',
                      outline: 'none',
                      resize: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0b3fa8')}
                    onBlur={(e) => (e.target.style.borderColor = '#a9c7f0')}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <BtnGhost onClick={() => setModalUser(false)}>Batal</BtnGhost>
                <BtnPrimary type="submit" disabled={loading}>
                  <MI
                    name={loading ? 'hourglass_empty' : editUserId ? 'save' : 'person_add'}
                    size={15}
                  />
                  {loading ? 'Menyimpan...' : editUserId ? 'Perbarui Akun' : 'Simpan Akun'}
                </BtnPrimary>
              </div>
            </form>
          </ModalBox>
        </Overlay>
      )}

      {/* ════ MODAL: Edit Kriteria ════ */}
      {modalKrit && (
        <Overlay onClose={() => setModalKrit(null)}>
          <ModalBox maxW={460}>
            <ModalHead
              title={`Edit Kriteria C${modalKrit.id_kriteria}`}
              sub={modalKrit.nama_kriteria}
              onClose={() => setModalKrit(null)}
            />
            <form
              onSubmit={simpanKriteria}
              style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <Lbl required>Nama Kriteria</Lbl>
                <Inp
                  required
                  value={formKrit.nama_kriteria}
                  onChange={(e) => setFormKrit({ ...formKrit, nama_kriteria: e.target.value })}
                />
              </div>
              <div>
                <Lbl required>Tipe Kriteria</Lbl>
                <div style={{ position: 'relative' }}>
                  <Sel
                    required
                    value={formKrit.tipe}
                    onChange={(e) => setFormKrit({ ...formKrit, tipe: e.target.value })}
                  >
                    <option value="benefit">Benefit — semakin tinggi nilai = semakin baik</option>
                    <option value="cost">Cost — semakin rendah nilai = semakin baik</option>
                  </Sel>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 13px',
                  borderRadius: 9,
                  background: '#F0F6FF',
                  fontSize: 11.5,
                  color: '#334155',
                }}
              >
                <MI name="info" size={15} style={{ color: '#0b3fa8' }} />
                <span>
                  Bobot C{modalKrit.id_kriteria} saat ini <b>{modalKrit.bobot}%</b>. Total bobot
                  seluruh kriteria wajib 100%, jadi bobot diubah serentak lewat tombol{' '}
                  <b>Atur Bobot</b>.
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <BtnGhost onClick={() => setModalKrit(null)}>Batal</BtnGhost>
                <BtnPrimary type="submit" disabled={loading}>
                  <MI name="save" size={15} />
                  {loading ? 'Menyimpan...' : 'Simpan Kriteria'}
                </BtnPrimary>
              </div>
            </form>
          </ModalBox>
        </Overlay>
      )}

      {/* ════ MODAL: Atur Bobot Seluruh Kriteria ════ */}
      {modalBobot && (
        <Overlay onClose={() => setModalBobot(false)}>
          <ModalBox maxW={560} fullH>
            <ModalHead
              title="Atur Bobot Kriteria"
              sub="Total seluruh bobot wajib tepat 100%"
              onClose={() => setModalBobot(false)}
            />
            <form
              onSubmit={simpanBobot}
              style={{
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                overflowY: 'auto',
              }}
            >
              {kriteriaData.map((k) => (
                <div key={k.id_kriteria} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      padding: '3px 9px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      background: '#EBF3FF',
                      color: '#0b3fa8',
                    }}
                  >
                    C{k.id_kriteria}
                  </span>
                  <span style={{ flex: 1, fontSize: 12.5, color: '#0f172a', fontWeight: 600 }}>
                    {k.nama_kriteria}
                  </span>
                  <div style={{ position: 'relative', width: 92, flexShrink: 0 }}>
                    <Inp
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      required
                      value={formBobot[k.id_kriteria] ?? ''}
                      onChange={(e) =>
                        setFormBobot({ ...formBobot, [k.id_kriteria]: e.target.value })
                      }
                      style={{ paddingRight: 26, textAlign: 'right' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 11,
                        color: '#334155',
                        pointerEvents: 'none',
                      }}
                    >
                      %
                    </span>
                  </div>
                </div>
              ))}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: 9,
                  background:
                    Math.abs(totalBobotForm - 100) < 0.001 ? '#d1fae5' : '#ffdad6',
                  color: Math.abs(totalBobotForm - 100) < 0.001 ? '#065f46' : '#991b1b',
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                <span>Total bobot</span>
                <span>
                  {Number(totalBobotForm.toFixed(2))}%{' '}
                  {Math.abs(totalBobotForm - 100) < 0.001 ? '✓' : '(harus 100%)'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <BtnGhost onClick={() => setModalBobot(false)}>Batal</BtnGhost>
                <BtnPrimary
                  type="submit"
                  disabled={loading || Math.abs(totalBobotForm - 100) > 0.001}
                >
                  <MI name="save" size={15} />
                  {loading ? 'Menyimpan...' : 'Simpan Bobot'}
                </BtnPrimary>
              </div>
            </form>
          </ModalBox>
        </Overlay>
      )}

      {/* ════ MODAL: Edit Sub-Kriteria ════ */}
      {modalSubKrit && (
        <Overlay onClose={() => setModalSubKrit(null)}>
          <ModalBox maxW={440}>
            <ModalHead
              title="Edit Sub-Kriteria"
              sub={`C${selectedKriteria?.id_kriteria} — ${selectedKriteria?.nama_kriteria}`}
              onClose={() => setModalSubKrit(null)}
            />
            <form
              onSubmit={simpanSubKriteria}
              style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <Lbl required>Keterangan / Pilihan Jawaban</Lbl>
                <textarea
                  required
                  rows={3}
                  value={formSubKrit.keterangan}
                  onChange={(e) => setFormSubKrit({ ...formSubKrit, keterangan: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 13px',
                    borderRadius: 9,
                    border: '1.5px solid #a9c7f0',
                    background: '#FAFCFF',
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    fontSize: 13.5,
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0b3fa8')}
                  onBlur={(e) => (e.target.style.borderColor = '#a9c7f0')}
                />
              </div>
              <div>
                <Lbl required>Nilai (rij) — dipakai dalam matriks SAW</Lbl>
                <div style={{ position: 'relative' }}>
                  <Sel
                    required
                    value={formSubKrit.nilai}
                    onChange={(e) =>
                      setFormSubKrit({ ...formSubKrit, nilai: Number(e.target.value) })
                    }
                  >
                    <option value={10}>10 — Sangat Tinggi</option>
                    <option value={7.5}>7.5 — Tinggi</option>
                    <option value={5}>5 — Rendah</option>
                    <option value={2.5}>2.5 — Sangat Rendah</option>
                  </Sel>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <BtnGhost onClick={() => setModalSubKrit(null)}>Batal</BtnGhost>
                <BtnPrimary type="submit" disabled={loading}>
                  <MI name="save" size={15} />
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </BtnPrimary>
              </div>
            </form>
          </ModalBox>
        </Overlay>
      )}

      {/* ════ MODAL: Hasil Import CSV (akun warga) ════ */}
      {hasilImport && (
        <Overlay onClose={() => setHasilImport(null)}>
          <ModalBox maxW={760} fullH>
            <ModalHead
              title="Hasil Import Data Warga"
              sub={`${hasilImport.banyak_import ?? 0} data masuk · ${hasilImport.banyak_akun ?? 0} akun dibuat · ${hasilImport.banyak_skip ?? 0} dilewati · ${hasilImport.banyak_gagal ?? 0} gagal`}
              onClose={() => setHasilImport(null)}
            />
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  gap: 9,
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  marginBottom: 14,
                }}
              >
                <MI name="info" fill size={17} style={{ color: '#0b3fa8', marginTop: 1 }} />
                <span style={{ fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.55 }}>
                  Tiap warga hasil import otomatis punya akun login: username = nama
                  depan, password awal = nama depan + 123 (nama depan kembar diberi
                  huruf, mis. budia). Password hanya ditampilkan sekali di sini —
                  unduh CSV-nya dan teruskan ke warga masing-masing.
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      {['Nama', 'RT', 'Username', 'Password Awal', 'Keterangan'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '9px 10px',
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: '#334155',
                            textTransform: 'uppercase',
                            letterSpacing: '.05em',
                            background: '#F0F6FF',
                            borderBottom: '1px solid #DBEAFE',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(hasilImport.laporan || []).map((b, i) => (
                      <tr key={i}>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid #EBF3FF', fontWeight: 600 }}>
                          {b.nama || '—'}
                        </td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid #EBF3FF', whiteSpace: 'nowrap' }}>
                          {b.rt || '—'}
                        </td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid #EBF3FF', fontFamily: 'monospace', fontSize: 11.5, color: '#334155', whiteSpace: 'nowrap' }}>
                          {b.username || '—'}
                        </td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid #EBF3FF', fontFamily: 'monospace', fontSize: 11.5, fontWeight: 700, color: b.password_awal ? '#065f46' : '#475569', whiteSpace: 'nowrap' }}>
                          {b.password_awal || '—'}
                        </td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid #EBF3FF', fontSize: 11.5, color: b.status === 'gagal' ? '#b91c1c' : '#334155', maxWidth: 230 }}>
                          {b.detail || b.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '1px solid #DBEAFE', flexShrink: 0 }}>
              <BtnGhost onClick={() => setHasilImport(null)}>Tutup</BtnGhost>
              {(hasilImport.laporan || []).some((b) => b.username) && (
                <BtnPrimary onClick={unduhAkunImport}>
                  <MI name="download" size={15} /> Unduh CSV Akun
                </BtnPrimary>
              )}
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* Scrim mobile — tutup sidebar saat diketuk */}
      <div
        className="admin-scrim no-print"
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
