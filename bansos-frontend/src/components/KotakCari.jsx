/**
 * Kotak pencarian untuk tabel yang berisi banyak nama.
 *
 * Kenapa ada: tiap dashboard dulu menulis input pencariannya sendiri, dengan
 * lebar tetap (240px) yang membuatnya berdesakan di HP, dan hanya halaman
 * tertentu yang punya. Dengan satu komponen, perilaku (ikon, fokus, tombol
 * hapus, lebar responsif) sama di RT, RW, dan Admin.
 *
 * Komponen ini tidak menyimpan state: nilai dan perubahan diteruskan lewat
 * props supaya filter tetap berada di halaman yang tahu cara menyaring datanya.
 *
 * @param {object} props
 * @param {string} props.value
 * @param {(nilai: string) => void} props.onChange
 * @param {string} [props.placeholder]
 * @param {number} [props.hasil]  jumlah baris setelah disaring; ditampilkan
 *                                sebagai "N hasil" agar pengguna tahu filter aktif
 * @param {number} [props.total]  jumlah baris keseluruhan
 */
export default function KotakCari({
  value,
  onChange,
  placeholder = 'Cari nama...',
  hasil,
  total,
}) {
  const aktif = value.trim() !== '';

  return (
    <div
      className="no-print"
      style={{ position: 'relative', flex: '1 1 220px', minWidth: 160, maxWidth: 380 }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 17,
          lineHeight: 1,
          color: '#334155',
          pointerEvents: 'none',
        }}
      >
        search
      </span>

      <input
        type="search"
        // Baris yang sama dirakit ulang tiap render; tanpa aria-label pembaca
        // layar hanya membacakan "kotak teks" tanpa menjelaskan fungsinya.
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          minHeight: 40,
          padding: aktif ? '9px 60px 9px 36px' : '9px 12px 9px 36px',
          borderRadius: 9,
          border: '1.5px solid #a9c7f0',
          fontSize: 13,
          outline: 'none',
          color: '#0f172a',
          background: '#fff',
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          // Chrome menambahkan tombol silang bawaan untuk type=search; bawaan
          // itu tidak bisa digaya dan bertabrakan dengan tombol hapus kita.
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#0b3fa8')}
        onBlur={(e) => (e.target.style.borderColor = '#a9c7f0')}
      />

      {aktif && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Hapus pencarian"
          aria-label="Hapus pencarian"
          style={{
            position: 'absolute',
            right: typeof hasil === 'number' && typeof total === 'number' ? 74 : 6,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            padding: 0,
            border: 'none',
            borderRadius: 6,
            background: 'transparent',
            color: '#334155',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#EBF3FF')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 17, lineHeight: 1 }}
          >
            close
          </span>
        </button>
      )}

      {typeof hasil === 'number' && typeof total === 'number' && (
        // Angka ini penting: tanpa itu pengguna mengira datanya hilang, bukan
        // sedang tersaring.
        <span
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            fontWeight: 600,
            color: '#475569',
            pointerEvents: 'none',
          }}
        >
          {hasil}/{total}
        </span>
      )}
    </div>
  );
}
