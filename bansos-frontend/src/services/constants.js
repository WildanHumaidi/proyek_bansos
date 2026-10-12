/**
 * Shared questionnaire constants and helper functions.
 */

export const DAFTAR_OPSI = {
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
  q7: ['MENUMPANG', 'SEWA / KONTRAK', 'MILIK ORANG TUA / SAUDARA / KELUARGA', 'MILIK SENDIRI'],
  q8: ['SUNGAI / MATA AIR', 'SUMUR (BOR/GALI)', 'PDAM', 'KEMASAN / ISI ULANG'],
  q9: ['TIDAK ADA / LAMPU TEMPEL', 'LISTRIK 450 WATT', 'LISTRIK 900 WATT', 'LISTRIK > 900 WATT'],
  q10: [
    'JALAN KAKI / SEPEDA / SEPEDA MOTOR SEADANYA / TRANSPORTASI UMUM',
    'SEPEDA MOTOR 1 UNIT KONDISI BAIK',
    'SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK',
    'MOBIL',
  ],
};

export const PERTANYAAN_LABELS = [
  'Jumlah KK dalam 1 Rumah',
  'Jumlah Anggota Keluarga',
  'Pendidikan Kepala Keluarga',
  'Jumlah Anggota yang Bersekolah',
  'Rata-rata Pengeluaran per Bulan',
  'Rata-rata Penghasilan per Bulan',
  'Status Kepemilikan Rumah',
  'Sumber Air Bersih',
  'Sumber Penerangan / Listrik',
  'Kepemilikan Kendaraan',
];

export const KRITERIA_SHORT = [
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

export const normRT = (rt) => {
  if (!rt) return '-';
  const n = parseInt(rt, 10);
  return Number.isNaN(n) ? String(rt) : String(n);
};

export const fmtDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-';

export const fmtDateTime = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' WIB'
    : '-';

export const parseJawaban = (raw) => {
  if (!raw) return null;
  let parsed = raw;
  for (let i = 0; i < 3; i++) {
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        break;
      }
    } else {
      break;
    }
  }
  return typeof parsed === 'object' && parsed !== null ? parsed : null;
};

const norm = (str) =>
  String(str || '')
    .replace(/\s+/g, '')
    .toLowerCase();

export const konversiSubkriteria = (rawJawaban) => {
  const obj = parseJawaban(rawJawaban);
  if (!obj) return {};
  const hasil = {};
  for (let i = 1; i <= 10; i++) {
    const opsi = DAFTAR_OPSI[`q${i}`] || [];
    const idx = opsi.findIndex((o) => norm(o) === norm(obj[`q${i}`] || ''));
    hasil[i] = idx !== -1 ? (i - 1) * 4 + idx + 1 : (i - 1) * 4 + 1;
  }
  return hasil;
};

export const getSkor = (pengajuan, idKriteria) => {
  if (pengajuan?.penilaian?.length) {
    const p = pengajuan.penilaian.find((x) => x.id_kriteria === idKriteria);
    if (p) return p.sub_kriteria?.nilai ?? p.nilai ?? null;
  }
  const obj = parseJawaban(pengajuan?.jawaban_mentah);
  if (!obj) return '-';
  const opsi = DAFTAR_OPSI[`q${idKriteria}`];
  if (!opsi) return '-';
  const idx = opsi.findIndex((o) => norm(o) === norm(obj[`q${idKriteria}`] || ''));
  return idx === -1 ? '-' : [10, 7.5, 5, 2.5][idx];
};

export const statusStyle = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'disetujui')
    return { bg: '#d1fae5', color: '#065f46', dot: '#10b981', label: 'DITERIMA' };
  if (s === 'ditolak') return { bg: '#ffdad6', color: '#ba1a1a', dot: '#ba1a1a', label: 'DITOLAK' };
  return { bg: '#fef3c7', color: '#d97706', dot: '#f59e0b', label: 'PENDING' };
};

export const roleInfo = (role, rt) => {
  if (role === 'admin') return { label: 'Administrator', bg: '#fef3c7', color: '#d97706' };
  if (role === 'rw') return { label: 'Ketua RW', bg: '#ede9fe', color: '#7c3aed' };
  if (role === 'rt') return { label: `Ketua RT ${rt || '-'}`, bg: '#dce9ff', color: '#0369a1' };
  return { label: 'Warga', bg: '#f1f5f9', color: '#475569' };
};
