/**
 * Shared questionnaire constants and helper functions.
 */

export const DAFTAR_OPSI = {
  // Label ini HARUS identik dengan `sub_kriteria.keterangan` di database;
  // backend mencocokkan jawaban ke baris sub-kriteria berdasarkan teks ini.
  // Mengubah label di sini tanpa mengubah database akan membuat penilaian gagal terbentuk.
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
