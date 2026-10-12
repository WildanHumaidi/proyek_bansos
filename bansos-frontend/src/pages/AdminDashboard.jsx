import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';
const tok = () => localStorage.getItem('token');
const authH = () => ({ Authorization: `Bearer ${tok()}` });

/* ─── Design Bootstrap ───────────────────────────────────────────────────── */
function useDesign() {
  useEffect(() => {
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
    if (!document.getElementById('admin-print')) {
      const st = document.createElement('style');
      st.id = 'admin-print';
      st.innerHTML = `
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes popIn  { from { opacity:0; transform:scale(.97) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }

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
  if (role === 'admin') return { label: 'Administrator', bg: '#fef9c3', color: '#a16207' };
  if (role === 'rw') return { label: 'Ketua RW', bg: '#f3e8ff', color: '#7c3aed' };
  if (role === 'rt') return { label: `Ketua RT ${rt || '-'}`, bg: '#dbeafe', color: '#1d4ed8' };
  return { label: 'Warga', bg: '#f1f5f9', color: '#475569' };
};

/* ─── Kuesioner constants ────────────────────────────────────────────────── */
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

const konversiSubkriteria = (raw) => {
  const obj = parseJawaban(raw);
  if (!obj) return {};
  const norm = (s) => String(s).replace(/\s+/g, '').toLowerCase();
  const hasil = {};
  for (let i = 1; i <= 10; i++) {
    const idx = (OPSI[`q${i}`] || []).findIndex((o) => norm(o) === norm(obj[`q${i}`] || ''));
    hasil[i] = idx !== -1 ? (i - 1) * 4 + idx + 1 : (i - 1) * 4 + 1;
  }
  return hasil;
};

const getSkor = (p, idK) => {
  if (p.penilaian?.length) {
    const pn = p.penilaian.find((x) => x.id_kriteria === idK);
    if (pn) return pn.sub_kriteria?.nilai ?? pn.nilai ?? '-';
  }
  const obj = parseJawaban(p.jawaban_mentah);
  if (!obj) return '-';
  const norm = (s) => String(s).replace(/\s+/g, '').toLowerCase();
  const idx = (OPSI[`q${idK}`] || []).findIndex((o) => norm(o) === norm(obj[`q${idK}`] || ''));
  return idx === -1 ? '-' : [10, 7.5, 5, 2.5][idx];
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
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
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
      <MI name="close" size={17} style={{ color: '#64748b' }} />
    </button>
  </div>
);

const Lbl = ({ children, required: req }) => (
  <label
    style={{
      display: 'block',
      fontSize: 11,
      fontWeight: 700,
      color: '#475569',
      textTransform: 'uppercase',
      letterSpacing: '.07em',
      marginBottom: 6,
    }}
  >
    {children}
    {req && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
  </label>
);

const Inp = ({ style: s = {}, ...p }) => (
  <input
    style={{
      width: '100%',
      padding: '10px 13px',
      borderRadius: 9,
      border: '1.5px solid #C6DCFF',
      background: '#FAFCFF',
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      fontSize: 13.5,
      color: '#0f172a',
      outline: 'none',
      ...s,
    }}
    onFocus={(e) => (e.target.style.borderColor = '#1A56DB')}
    onBlur={(e) => (e.target.style.borderColor = '#C6DCFF')}
    {...p}
  />
);

const Sel = ({ children, style: s = {}, ...p }) => (
  <select
    style={{
      width: '100%',
      padding: '10px 13px',
      borderRadius: 9,
      border: '1.5px solid #C6DCFF',
      background: '#FAFCFF',
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      fontSize: 13.5,
      color: '#0f172a',
      outline: 'none',
      appearance: 'none',
      cursor: 'pointer',
      ...s,
    }}
    onFocus={(e) => (e.target.style.borderColor = '#1A56DB')}
    onBlur={(e) => (e.target.style.borderColor = '#C6DCFF')}
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
      background: '#1A56DB',
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
      if (!p.disabled) e.currentTarget.style.background = '#1649C4';
    }}
    onMouseLeave={(e) => {
      if (!p.disabled) e.currentTarget.style.background = s.background || '#0051d5';
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
      color: '#475569',
      border: '1.5px solid #C6DCFF',
      borderRadius: 9,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      transition: '.15s',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#93C5FD')}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#C6DCFF')}
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
  const [loading, setLoading] = useState(false);

  /* data */
  const [pengajuanList, setPengajuanList] = useState([]);
  const [rankingData, setRankingData] = useState([]);
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

  /* modal — sub-kriteria */
  const [modalSubKrit, setModalSubKrit] = useState(null);
  const [formSubKrit, setFormSubKrit] = useState({ keterangan: '', nilai: 10 });

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
      if (status_baru === 'disetujui') {
        const p = pengajuanList.find((x) => x.id_pengajuan === id);
        if (p?.jawaban_mentah) {
          await axios.put(
            `${API}/admin/pengajuan/${id}/kuesioner`,
            { jawaban: konversiSubkriteria(p.jawaban_mentah) },
            { headers: authH() }
          );
        }
      }
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
      const p = pengajuanList.find((x) => x.id_pengajuan === modalEditId);
      const payload = { jawaban_mentah: formMentah };
      if (p?.status === 'disetujui') payload.jawaban = konversiSubkriteria(formMentah);
      await axios.put(`${API}/admin/pengajuan/${modalEditId}/kuesioner`, payload, {
        headers: authH(),
      });
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
      showToast(r.data.message || 'Import berhasil');
      fetchData();
    } catch (err) {
      showToast(`Import gagal: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const jalankanSAW = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/saw/hitung?t=${Date.now()}`, { headers: authH() });
      if (r.data.success) {
        setRankingData(r.data.data || []);
        showToast(`Kalkulasi selesai — ${r.data.total} warga terhitung`);
      } else showToast('Kalkulasi SAW gagal', 'error');
    } catch (err) {
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
    if (Number(formKrit.bobot) <= 0) return showToast('Bobot harus lebih dari 0', 'error');
    setLoading(true);
    try {
      await axios.put(`${API}/kriteria/${modalKrit.id_kriteria}`, formKrit, { headers: authH() });
      setModalKrit(null);
      fetchData();
      showToast('Kriteria berhasil diperbarui');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal', 'error');
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

  /* ── Nav ─────────────────────────────────────────────────────────────── */
  const navGroups = [
    {
      label: 'Data & Laporan',
      items: [
        { key: 'beranda', icon: 'dashboard', label: 'Beranda' },
        { key: 'pengajuan', icon: 'description', label: 'Data Kuesioner', badge: countPending },
        { key: 'matriks', icon: 'grid_view', label: 'Matriks SAW' },
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
      ranking: 'Hasil Keputusan SAW',
      kriteria: 'Kelola Kriteria & Bobot',
      users: 'Manajemen Akun Sistem',
      log: 'Activity Log Sistem',
    }[activeMenu] || '';

  /* ── Inline styles ───────────────────────────────────────────────────── */
  const tblTh = {
    padding: '11px 18px',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
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
            background: toast.type === 'error' ? '#dc2626' : '#1A56DB',
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
        className="no-print"
        style={{
          width: 252,
          flexShrink: 0,
          background: '#EBF3FF',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRight: '1px solid #C6DCFF',
          overflowY: 'auto',
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid #C6DCFF',
            background: 'linear-gradient(135deg, #1A56DB 0%, #1e40af 100%)',
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
              <div style={{ fontSize: 11, color: '#1A56DB', fontWeight: 600 }}>Administrator</div>
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
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '.1em',
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
                        fontWeight: active ? 700 : 600,
                        background: active ? '#1d4ed8' : 'transparent',
                        color: active ? '#fff' : '#374151',
                        transition: '.12s',
                        borderLeft: `2px solid ${active ? '#fff' : 'transparent'}`,
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = '#C6DCFF';
                          e.currentTarget.style.color = '#1A56DB';
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
              transition: '.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#C6DCFF';
              e.currentTarget.style.color = '#1A56DB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#374151';
            }}
          >
            <MI name="print" size={15} /> Cetak Laporan
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
              transition: '.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,.1)')}
          >
            <MI name="logout" size={15} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* ════════ MAIN ════════ */}
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
          <div style={{ display: 'flex', align: 'center', gap: 12 }}>
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
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Memuat data...</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
                  background: '#7c3aed',
                  color: '#fff',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: '.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#6d28d9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#7c3aed')}
              >
                <MI name="upload_file" size={15} />
                {loading ? 'Memproses...' : 'Import CSV'}
                <input
                  type="file"
                  accept=".csv"
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
                style={{ background: '#059669' }}
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
          style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#F0F6FF' }}
        >
          {/* ══════ BERANDA ══════ */}
          {activeMenu === 'beranda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {[
                  {
                    label: 'Total Akun Sistem',
                    value: userList.length,
                    icon: 'group',
                    color: '#1d4ed8',
                    bg: '#dbeafe',
                    sub: 'Admin, RW, RT, Warga',
                  },
                  {
                    label: 'Total Kuesioner',
                    value: pengajuanList.length,
                    icon: 'fact_check',
                    color: '#7c3aed',
                    bg: '#f3e8ff',
                    sub: 'Semua status',
                  },
                  {
                    label: 'Warga Disetujui',
                    value: countDiterima,
                    icon: 'verified',
                    color: '#059669',
                    bg: '#dcfce7',
                    sub: 'Siap kalkulasi SAW',
                  },
                  {
                    label: 'Menunggu Verifikasi',
                    value: countPending,
                    icon: 'pending_actions',
                    color: '#ca8a04',
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
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                      {value}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Banner */}
              <div
                style={{
                  borderRadius: 16,
                  padding: '28px 36px',
                  background: 'linear-gradient(135deg,#1A56DB 0%,#1e40af 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 24,
                }}
              >
                <div style={{ maxWidth: '62%' }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#000000',
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
                    Data CSV akan otomatis diproses dan status pengajuan diset ke{' '}
                    <strong style={{ color: '#ffffff' }}>disetujui</strong>. Setelahnya jalankan
                    kalkulasi SAW untuk mendapatkan peringkat terbaru.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
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
                    <MI name="upload_file" size={18} /> Import CSV
                    <input
                      type="file"
                      accept=".csv"
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
                      background: '#059669',
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {/* Top 5 Ranking */}
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
                      Top 5 Peringkat Global
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
                                background: i === 0 ? '#0051d5' : '#f1f5f9',
                                color: i === 0 ? '#fff' : '#64748b',
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
                                color: '#475569',
                              }}
                            >
                              RT {r.rt || '-'}
                            </span>
                          </td>
                          <td
                            style={{
                              ...tblTd,
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              color: '#1A56DB',
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
                              color: '#94a3b8',
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
                      color: '#059669',
                      track: '#dcfce7',
                    },
                    { label: 'Ditolak', count: countDitolak, color: '#dc2626', track: '#fee2e2' },
                    { label: 'Pending', count: countPending, color: '#ca8a04', track: '#fef9c3' },
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
                            <span style={{ color: '#94a3b8', fontWeight: 400 }}>({pct}%)</span>
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
                      color: '#64748b',
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
                        border: `1.5px solid ${filterStatus === s ? '#0051d5' : '#e2e8f0'}`,
                        background: filterStatus === s ? '#0051d5' : '#fff',
                        color: filterStatus === s ? '#fff' : '#475569',
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
                    style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}
                  >
                    {filteredPengajuan.length} dari {pengajuanList.length} data
                  </span>
                </div>
              )}

              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #DBEAFE',
                  overflow: 'auto',
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
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {activeMenu === 'matriks'
                        ? `Matriks Nilai SAW — ${pengajuanList.filter((p) => p.status === 'disetujui').length} warga disetujui`
                        : `Total ${filteredPengajuan.length} Kuesioner`}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {activeMenu === 'matriks'
                        ? 'Nilai rij dari sub-kriteria masing-masing warga'
                        : 'Data kuesioner dari seluruh wilayah RT'}
                    </div>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={tblTh}>No</th>
                      <th style={{ ...tblTh, minWidth: 160 }}>Nama Warga</th>
                      {Array.from({ length: 10 }, (_, i) => (
                        <th key={i} style={{ ...tblTh, minWidth: 68, textAlign: 'center' }}>
                          <span style={{ color: '#1d4ed8' }}>C{i + 1}</span>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: 9.5,
                              color: '#94a3b8',
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
                          <td style={{ ...tblTd, fontWeight: 700, color: '#94a3b8', width: 44 }}>
                            {i + 1}
                          </td>
                          <td style={tblTd}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>
                              {p.warga?.nama_lengkap || p.warga?.name || 'Tanpa Nama'}
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                              RT {p.warga?.rt || '-'}
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
                                  style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: '#111827',
                                  }}
                                >
                                  {getSkor(p, k + 1)}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: '#475569',
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
                                    ? '#15803d'
                                    : p.status === 'ditolak'
                                      ? '#dc2626'
                                      : '#ca8a04',
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
                                    color: '#1A56DB',
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
                                    color: '#dc2626',
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
                            color: '#94a3b8',
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
                  <MI name="info" fill size={18} style={{ color: '#1A56DB' }} />
                  <span style={{ fontSize: 13, color: '#475569' }}>
                    Total <strong style={{ color: '#0f172a' }}>{rankingData.length}</strong> warga
                    terhitung berdasarkan bobot dan nilai sub-kriteria aktif. Nilai V dihitung
                    menggunakan metode SAW di sisi server (PHP).
                  </span>
                </div>
                <BtnPrimary
                  onClick={jalankanSAW}
                  disabled={loading}
                  style={{ background: '#059669', flexShrink: 0 }}
                >
                  <MI name="refresh" size={15} />
                  {loading ? 'Menghitung...' : 'Hitung Ulang'}
                </BtnPrimary>
              </div>

              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #DBEAFE',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {[
                        'Peringkat',
                        'Nama Warga',
                        'Alamat',
                        'RT',
                        'Nilai Preferensi (V)',
                        'Kelayakan',
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
                              background:
                                i === 0
                                  ? '#0051d5'
                                  : i === 1
                                    ? '#3b82f6'
                                    : i === 2
                                      ? '#93c5fd'
                                      : '#f1f5f9',
                              color: i < 3 ? '#fff' : '#64748b',
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
                            color: '#64748b',
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
                              color: '#1d4ed8',
                            }}
                          >
                            RT {w.rt || '-'}
                          </span>
                        </td>
                        <td
                          style={{
                            ...tblTd,
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: 15,
                            color: i === 0 ? '#0051d5' : '#334155',
                          }}
                        >
                          {Number(w.skor_saw).toFixed(6)}
                        </td>
                      </tr>
                    ))}
                    {rankingData.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            padding: '48px',
                            textAlign: 'center',
                            color: '#94a3b8',
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
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      Normalisasi bobot dilakukan otomatis oleh SawController (bobot / totalBobot)
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '7px 14px',
                      borderRadius: 9,
                      background: '#EBF3FF',
                    }}
                  >
                    <MI name="calculate" size={15} style={{ color: '#1A56DB' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1A56DB' }}>
                      Total Bobot: {kriteriaData.reduce((s, k) => s + Number(k.bobot), 0)}
                    </span>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                          <td style={{ ...tblTd, fontWeight: 700, color: '#94a3b8', width: 44 }}>
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
                                color: '#1A56DB',
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
                                color: k.tipe === 'benefit' ? '#15803d' : '#dc2626',
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
                                  background: '#e2e8f0',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    borderRadius: 4,
                                    background: '#1A56DB',
                                    width: `${Math.min(k.bobot, 100)}%`,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: '#1A56DB',
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
                                color: '#1A56DB',
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
                                color: '#1A56DB',
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
                            color: '#94a3b8',
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
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    border: '1px solid #bfdbfe',
                    overflow: 'hidden',
                  }}
                >
                  <div
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
                      <div style={{ fontSize: 12, color: '#0369a1', marginTop: 2 }}>
                        Nilai ini dipakai SawController sebagai input matriks keputusan
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedKriteria(null)}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#64748b',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Tutup
                    </button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                          <td style={{ ...tblTd, fontWeight: 700, color: '#94a3b8', width: 44 }}>
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
                                    ? '#15803d'
                                    : sk.nilai >= 5
                                      ? '#ca8a04'
                                      : '#dc2626',
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
                                color: '#1A56DB',
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
                              color: '#94a3b8',
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
                      color: '#94a3b8',
                    }}
                  />
                  <input
                    style={{
                      paddingLeft: 36,
                      paddingRight: 14,
                      height: 38,
                      borderRadius: 9,
                      border: '1.5px solid #C6DCFF',
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
                    onFocus={(e) => (e.target.style.borderColor = '#1A56DB')}
                    onBlur={(e) => (e.target.style.borderColor = '#C6DCFF')}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['all', 'admin', 'rw', 'rt', 'warga'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilterRole(r)}
                      style={{
                        padding: '7px 13px',
                        borderRadius: 8,
                        border: `1.5px solid ${filterRole === r ? '#0051d5' : '#e2e8f0'}`,
                        background: filterRole === r ? '#0051d5' : '#fff',
                        color: filterRole === r ? '#fff' : '#475569',
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
                  style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}
                >
                  {filteredUsers.length} akun
                </span>
              </div>

              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #DBEAFE',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['No', 'Profil & Nama', 'Username', 'RT', 'Alamat', 'Hak Akses', 'Aksi'].map(
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
                          <td style={{ ...tblTd, fontWeight: 700, color: '#94a3b8', width: 44 }}>
                            {i + 1}
                          </td>
                          <td style={tblTd}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                              color: '#475569',
                            }}
                          >
                            {u.username}
                          </td>
                          <td style={{ ...tblTd, textAlign: 'center', fontSize: 12.5 }}>
                            {u.rt || '-'}
                          </td>
                          <td
                            style={{
                              ...tblTd,
                              fontSize: 12.5,
                              color: '#64748b',
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
                                  color: '#1A56DB',
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
                                  color: '#dc2626',
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
                            color: '#94a3b8',
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
              style={{
                background: '#fff',
                borderRadius: 14,
                border: '1px solid #DBEAFE',
                overflow: 'hidden',
              }}
            >
              <div className="print-header" style={{ display: 'none' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700 }}>ACTIVITY LOG SISTEM</h2>
                <p>
                  Dicetak: {new Date().toLocaleString('id-ID')} &nbsp;|&nbsp; Oleh: {userData.name}
                </p>
              </div>
              <div
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
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
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
                    color: '#475569',
                  }}
                >
                  {activityLogs.length} entri
                </span>
              </div>
              {activityLogs.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                          <td style={{ ...tblTd, fontWeight: 700, color: '#94a3b8', width: 44 }}>
                            {i + 1}
                          </td>
                          <td
                            style={{
                              ...tblTd,
                              fontFamily: 'monospace',
                              fontSize: 12,
                              color: '#64748b',
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
                  <MI name="history" size={48} style={{ color: '#cbd5e1' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>
                    Belum ada aktivitas tercatat
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: '#94a3b8',
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
                        border: `1.5px solid ${formMentah[key] ? '#bfdbfe' : '#e2e8f0'}`,
                        background: formMentah[key] ? '#f0f9ff' : '#f8fafc',
                        transition: '.15s',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#475569',
                          textTransform: 'uppercase',
                          letterSpacing: '.07em',
                          marginBottom: 10,
                        }}
                      >
                        <span style={{ color: '#1A56DB', marginRight: 4 }}>C{i + 1}</span>
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
                  borderTop: '1px solid #e2e8f0',
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                      border: '1.5px solid #C6DCFF',
                      background: '#FAFCFF',
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                      fontSize: 13.5,
                      color: '#0f172a',
                      outline: 'none',
                      resize: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1A56DB')}
                    onBlur={(e) => (e.target.style.borderColor = '#C6DCFF')}
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
              <div>
                <Lbl required>Bobot (0 – 100)</Lbl>
                <Inp
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  required
                  value={formKrit.bobot}
                  onChange={(e) => setFormKrit({ ...formKrit, bobot: Number(e.target.value) })}
                />
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 5 }}>
                  SawController akan menormalisasi otomatis: bobot / totalBobot
                </div>
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
                    border: '1.5px solid #C6DCFF',
                    background: '#FAFCFF',
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    fontSize: 13.5,
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1A56DB')}
                  onBlur={(e) => (e.target.style.borderColor = '#C6DCFF')}
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
    </div>
  );
}
