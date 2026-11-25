/**
 * Helper RT kanonik untuk frontend.
 *
 * Backend menyimpan RT sebagai tiga digit ('001') dan membandingkan lewat
 * `RtFormatter::intValue()`. Sebelumnya setiap halaman menormalkan sendiri
 * (`padStart(2,'0')`, `Number(rt)`, `String(Number(...))`), sehingga tampilan
 * bisa "RT 01" sementara nilai yang dikirim "1" dan filter memakai perbandingan
 * string yang berbeda-beda. Semua halaman sekarang memakai helper ini.
 */

/** Nilai integer RT, atau null bila bukan RT sah. */
export const rtInt = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const teks = String(value).trim();
  if (!/^\d{1,3}$/.test(teks)) return null;
  const n = Number(teks);
  return n >= 1 && n <= 999 ? n : null;
};

/** RT kanonik tiga digit ('001') untuk dikirim ke API. Null bila tidak sah. */
export const rtKode = (value) => {
  const n = rtInt(value);
  return n === null ? null : String(n).padStart(3, '0');
};

/** Label tampilan dua digit ('01') seperti kebiasaan di kertas RT. */
export const rtNomor = (value) => {
  const n = rtInt(value);
  return n === null ? '—' : String(n).padStart(2, '0');
};

/** Label siap pakai: 'RT 01'. */
export const rtLabel = (value) => {
  const n = rtInt(value);
  return n === null ? 'RT —' : `RT ${String(n).padStart(2, '0')}`;
};

/** True bila dua nilai RT menunjuk wilayah yang sama ('1' vs '001'). */
export const rtSama = (a, b) => {
  const ia = rtInt(a);
  const ib = rtInt(b);
  return ia !== null && ia === ib;
};
