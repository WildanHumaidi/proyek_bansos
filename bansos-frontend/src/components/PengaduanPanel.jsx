import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

/**
 * Panel pengaduan (P2-01) — satu komponen untuk empat peran.
 *
 * Backend sudah menyediakan GET/POST/PUT /api/pengaduan dengan scope peran:
 * warga hanya melihat miliknya, RT hanya wilayahnya, admin/RW melihat semua.
 * Komponen ini sengaja tidak melakukan filter sendiri — semua pembatasan ada di
 * server, dan UI hanya menampilkan apa yang dikirim.
 *
 * Gaya ditulis inline (bukan class) supaya bisa dipasang di dashboard mana pun
 * tanpa bergantung pada stylesheet masing-masing halaman.
 */

const Ikon = ({ name, size = 18, style }) => (
  <span
    className="material-symbols-outlined select-none"
    style={{ fontSize: size, lineHeight: 1, ...style }}
  >
    {name}
  </span>
);

const KATEGORI = [
  { value: 'umum', label: 'Umum' },
  { value: 'data', label: 'Data tidak sesuai' },
  { value: 'verifikasi', label: 'Verifikasi' },
  { value: 'pencairan', label: 'Pencairan' },
  { value: 'lainnya', label: 'Lainnya' },
];

const statusCfg = (st) => {
  const s = String(st || '').toLowerCase();
  if (s === 'diterima')
    return { label: 'Diterima', bg: '#dcfce7', color: '#15803d', icon: 'check_circle' };
  if (s === 'ditolak')
    return { label: 'Ditolak', bg: '#fee2e2', color: '#b91c1c', icon: 'cancel' };
  return { label: 'Menunggu', bg: '#fef9c3', color: '#a16207', icon: 'schedule' };
};

const fmtWaktu = (s) =>
  s
    ? new Date(s).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' WIB'
    : '—';

const tombol = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minHeight: 44,
  padding: '10px 18px',
  borderRadius: 9,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export default function PengaduanPanel({ role = 'warga' }) {
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sukses, setSukses] = useState('');

  const [kategori, setKategori] = useState('umum');
  const [isi, setIsi] = useState('');
  const [kirimLoading, setKirimLoading] = useState(false);

  const [aksiId, setAksiId] = useState(null);
  const [tanggapan, setTanggapan] = useState('');

  const staf = role === 'rt' || role === 'rw' || role === 'admin';

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await axios.get(`${API}/pengaduan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDaftar(r.data.data || []);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal memuat pengaduan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Ditunda satu tick seperti pola dashboard lain: memanggil setState langsung
    // di badan effect memicu peringatan react-hooks/set-state-in-effect.
    const timer = setTimeout(() => {
      muat();
    }, 0);
    return () => clearTimeout(timer);
  }, [muat]);

  const kirim = async (e) => {
    e.preventDefault();
    if (!isi.trim()) {
      setError('Isi pengaduan tidak boleh kosong.');
      return;
    }
    setKirimLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/pengaduan`,
        { kategori, isi: isi.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsi('');
      setKategori('umum');
      setSukses('Pengaduan terkirim. Pantau status di daftar di bawah.');
      setTimeout(() => setSukses(''), 4000);
      muat();
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal mengirim pengaduan.');
    } finally {
      setKirimLoading(false);
    }
  };

  const tindak = async (id, status) => {
    setAksiId(id);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/pengaduan/${id}`,
        { status, tanggapan: tanggapan.trim() || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTanggapan('');
      setSukses(`Pengaduan #${id} ditandai ${status}.`);
      setTimeout(() => setSukses(''), 4000);
      muat();
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal memperbarui pengaduan.');
    } finally {
      setAksiId(null);
    }
  };

  const belumDitangani = daftar.filter((d) => d.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #DBEAFE',
          borderRadius: 14,
          padding: '18px 22px',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
          Pengaduan Warga
        </div>
        <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
          {role === 'rt'
            ? 'Kelola keluhan warga. RT hanya melihat pengaduan di wilayahnya sendiri.'
            : staf
              ? 'Kelola keluhan dari seluruh RT. Admin dapat mengambil alih bila RT tidak tersedia.'
              : 'Sampaikan keluhan bila data atau proses bantuan tidak sesuai. Status dapat Anda pantau di sini.'}
          {staf && belumDitangani > 0 && (
            <strong style={{ color: '#a16207' }}>
              {' '}
              {belumDitangani} pengaduan belum ditangani.
            </strong>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            gap: 9,
            alignItems: 'flex-start',
            padding: '12px 16px',
            borderRadius: 12,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: 13,
          }}
        >
          <Ikon name="error" />
          <span style={{ flex: 1 }}>{error}</span>
        </div>
      )}

      {sukses && (
        <div
          style={{
            display: 'flex',
            gap: 9,
            alignItems: 'flex-start',
            padding: '12px 16px',
            borderRadius: 12,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#047857',
            fontSize: 13,
          }}
        >
          <Ikon name="check_circle" />
          <span style={{ flex: 1 }}>{sukses}</span>
        </div>
      )}

      {!staf && (
        <form
          onSubmit={kirim}
          style={{
            background: '#fff',
            border: '1px solid #DBEAFE',
            borderRadius: 14,
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
            Kategori
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                minHeight: 44,
                padding: '10px 13px',
                borderRadius: 9,
                border: '1.5px solid #C6DCFF',
                background: '#FAFCFF',
                fontSize: 13.5,
                fontFamily: 'inherit',
                color: '#0f172a',
              }}
            >
              {KATEGORI.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
            Isi Pengaduan
            <textarea
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Contoh: data jumlah anggota keluarga di kuesioner saya tidak sesuai."
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '11px 13px',
                borderRadius: 9,
                border: '1.5px solid #C6DCFF',
                background: '#FAFCFF',
                fontSize: 13.5,
                fontFamily: 'inherit',
                color: '#0f172a',
                resize: 'vertical',
              }}
            />
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="submit"
              disabled={kirimLoading}
              style={{
                ...tombol,
                background: '#1A56DB',
                color: '#fff',
                border: 'none',
                opacity: kirimLoading ? 0.6 : 1,
              }}
            >
              <Ikon name="send" size={16} />
              {kirimLoading ? 'Mengirim...' : 'Kirim Pengaduan'}
            </button>
            <span style={{ fontSize: 11.5, color: '#475569' }}>
              {isi.length}/5000 karakter
            </span>
          </div>
        </form>
      )}

      <div
        style={{
          background: '#fff',
          border: '1px solid #DBEAFE',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 22px',
            borderBottom: '1px solid #f1f5f9',
            background: '#FAFCFF',
            fontSize: 13,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          {staf ? 'Daftar Pengaduan' : 'Pengaduan Saya'} ({daftar.length})
        </div>

        {loading && (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: '#475569' }}>
            Memuat pengaduan...
          </div>
        )}

        {!loading && daftar.length === 0 && (
          <div style={{ padding: '40px 22px', textAlign: 'center' }}>
            <Ikon name="inbox" size={40} style={{ color: '#475569' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 10 }}>
              Belum ada pengaduan
            </div>
            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
              {staf
                ? 'Belum ada warga yang mengirim keluhan.'
                : 'Gunakan formulir di atas bila ada yang perlu disampaikan.'}
            </div>
          </div>
        )}

        {!loading &&
          daftar.map((d) => {
            const cfg = statusCfg(d.status);
            const riwayat = [...(d.riwayat || [])].sort(
              (a, b) => (a.id_riwayat || 0) - (b.id_riwayat || 0)
            );
            return (
              <div
                key={d.id_pengaduan}
                style={{
                  padding: '16px 22px',
                  borderBottom: '1px solid #EBF3FF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: cfg.bg,
                      color: cfg.color,
                    }}
                  >
                    <Ikon name={cfg.icon} size={14} /> {cfg.label}
                  </span>
                  <span style={{ fontSize: 11.5, color: '#475569' }}>
                    #{d.id_pengaduan} · {d.kategori || 'umum'} · {fmtWaktu(d.created_at)}
                  </span>
                  {staf && d.warga && (
                    <span style={{ fontSize: 11.5, color: '#475569' }}>
                      · {d.warga.nama_lengkap} (RT {d.warga.rt})
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 13.5, color: '#0f172a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {d.isi}
                </div>

                {d.tanggapan && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: '#F0F6FF',
                      border: '1px solid #DBEAFE',
                      fontSize: 12.5,
                      color: '#0f172a',
                    }}
                  >
                    <strong>Tanggapan{d.ditangani_oleh ? ` (${d.ditangani_oleh})` : ''}:</strong>{' '}
                    {d.tanggapan}
                  </div>
                )}

                {riwayat.length > 0 && (
                  <div style={{ fontSize: 11.5, color: '#475569' }}>
                    Riwayat:{' '}
                    {riwayat
                      .map((r) => `${r.status_lama || '—'} → ${r.status_baru}`)
                      .join('  ·  ')}
                  </div>
                )}

                {staf && d.status === 'pending' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <input
                      value={aksiId === d.id_pengaduan ? tanggapan : ''}
                      onChange={(e) => {
                        setAksiId(d.id_pengaduan);
                        setTanggapan(e.target.value);
                      }}
                      onFocus={() => setAksiId(d.id_pengaduan)}
                      placeholder="Tanggapan (opsional)"
                      maxLength={1000}
                      style={{
                        flex: '1 1 220px',
                        minHeight: 44,
                        padding: '10px 13px',
                        borderRadius: 9,
                        border: '1.5px solid #C6DCFF',
                        background: '#FAFCFF',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        color: '#0f172a',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => tindak(d.id_pengaduan, 'diterima')}
                      style={{
                        ...tombol,
                        background: '#047857',
                        color: '#fff',
                        border: 'none',
                      }}
                    >
                      <Ikon name="check" size={16} /> Terima
                    </button>
                    <button
                      type="button"
                      onClick={() => tindak(d.id_pengaduan, 'ditolak')}
                      style={{
                        ...tombol,
                        background: '#fff',
                        color: '#b91c1c',
                        border: '1.5px solid #fecaca',
                      }}
                    >
                      <Ikon name="close" size={16} /> Tolak
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
