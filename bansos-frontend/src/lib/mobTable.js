/* Label kolom untuk tabel yang berubah jadi kartu di HP.
 *
 * Di layar sempit `table.mob-table` kehilangan <thead> (lihat index.css), jadi
 * tiap sel harus membawa namanya sendiri lewat `data-label` agar dibaca
 * `td::before`. Menyalin label dari <th> saat render membuat penambahan kolom
 * tidak perlu menyunting setiap <td>.
 */
export function pasangLabelTabel(root = document) {
  for (const tabel of root.querySelectorAll('table.mob-table')) {
    const judul = [...tabel.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    if (judul.length === 0) continue;
    for (const baris of tabel.querySelectorAll('tbody tr')) {
      [...baris.children].forEach((sel, i) => {
        sel.setAttribute('data-label', judul[i] || '');
      });
    }
  }
}