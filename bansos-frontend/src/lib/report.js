import axios from 'axios';
import { API } from '../services/api';

/**
 * Unduh laporan hasil SAW dari endpoint server (P2-03 / BUG-23).
 *
 * Menggantikan `window.print()` pada tombol "Unduh Laporan": isi file berasal
 * dari `GET /saw/report/export` yang menghitung ulang dengan SawCalculator,
 * sehingga scope role (RT hanya wilayahnya) dan nilai V identik dengan yang
 * tampil di layar.
 */
export const unduhLaporanSaw = async (format = 'csv') => {
  const token = localStorage.getItem('token');
  const r = await axios.get(`${API}/saw/report/export?format=${format}`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });

  const url = URL.createObjectURL(new Blob([r.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan-saw-${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
