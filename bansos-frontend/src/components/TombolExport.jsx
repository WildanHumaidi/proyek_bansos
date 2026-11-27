import { useState } from 'react';
import { unduhData } from '../lib/exportData';

const MI = ({ name, size = 15 }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1 }}>
    {name}
  </span>
);

/**
 * Sepasang tombol "PDF" dan "Excel" untuk satu tabel.
 *
 * Ditaruh di header tabel (bukan header halaman) supaya jelas file mana yang
 * diunduh dan tabel mana yang tercetak — dulu tombol Cetak hanya ada di header
 * halaman sehingga ambigu saat satu halaman punya beberapa tabel.
 *
 * @param {object} props
 * @param {'pengajuan'|'warga'|'users'|'saw'} props.jenis  sumber data di server
 * @param {string} props.label  nama data untuk pesan galat ("data pengajuan")
 * @param {(pesan: string, tipe?: 'success'|'error') => void} [props.onInfo]
 */
export default function TombolExport({ jenis, label, onInfo }) {
  const [proses, setProses] = useState(null);

  const unduh = async (format) => {
    setProses(format);
    try {
      const nama = await unduhData(jenis, format);
      onInfo?.(`${label} berhasil diunduh: ${nama}`, 'success');
    } catch (err) {
      const pesan =
        err.response?.status === 404
          ? `Belum ada ${label} yang bisa diunduh.`
          : `Gagal mengunduh ${label}. Coba lagi.`;
      onInfo?.(pesan, 'error');
    } finally {
      setProses(null);
    }
  };

  const dasar = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: '0 0 auto',
    minHeight: 40,
    padding: '9px 14px',
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
  };

  return (
    <div className="tombol-export" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: '1 1 auto', minWidth: 0, maxWidth: '100%' }}>
      <button
        type="button"
        onClick={() => unduh('pdf')}
        disabled={proses !== null}
        title={`Unduh ${label} sebagai PDF`}
        style={{
          ...dasar,
          background: '#fff',
          color: '#B91C1C',
          border: '1.5px solid #FCA5A5',
          opacity: proses === 'pdf' ? 0.65 : 1,
        }}
      >
        <MI name="picture_as_pdf" size={15} />
        {proses === 'pdf' ? 'Menyiapkan...' : 'PDF'}
      </button>

      <button
        type="button"
        onClick={() => unduh('xlsx')}
        disabled={proses !== null}
        title={`Unduh ${label} sebagai Excel`}
        style={{
          ...dasar,
          background: '#fff',
          color: '#166534',
          border: '1.5px solid #86EFAC',
          opacity: proses === 'xlsx' ? 0.65 : 1,
        }}
      >
        <MI name="table_view" size={15} />
        {proses === 'xlsx' ? 'Menyiapkan...' : 'Excel'}
      </button>
    </div>
  );
}
