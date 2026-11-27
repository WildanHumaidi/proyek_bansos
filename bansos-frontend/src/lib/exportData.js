import axios from 'axios';
import { API } from '../services/api';

/**
 * Unduh data tabel sebagai PDF atau Excel dari server.
 *
 * File dibuat backend (bukan window.print) supaya isinya sama persis dengan
 * data yang lolos scope role di API: RT hanya wilayahnya, admin/RW seluruh RW.
 *
 * @param {'pengajuan'|'warga'|'users'|'saw'} jenis
 * @param {'pdf'|'xlsx'} format
 * @returns {Promise<string>} nama file yang diunduh
 */
export const unduhData = async (jenis, format = 'pdf') => {
  const token = localStorage.getItem('token');

  const r = await axios.get(`${API}/export/${jenis}?format=${format}`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });

  // Server mengirim nama file di Content-Disposition; pakai itu bila ada.
  const disposisi = r.headers?.['content-disposition'] || '';
  const cocok = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposisi);
  const namaFile = cocok
    ? decodeURIComponent(cocok[1])
    : `${jenis}-${new Date().toISOString().slice(0, 10)}.${format}`;

  const url = URL.createObjectURL(new Blob([r.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return namaFile;
};

export const EXTENSI = { pdf: 'PDF', xlsx: 'Excel' };
