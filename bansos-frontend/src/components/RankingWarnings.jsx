/**
 * Banner status hasil SAW untuk dashboard staf (BUG-09, BUG-05, BUG-21).
 *
 * Backend sudah lama mengirim `dilewati` (warga yang tidak masuk ranking) dan
 * `kriteria_tanpa_variasi`, tetapi tidak ada dashboard yang menampilkannya,
 * sehingga staf menganggap ranking sudah lengkap. Komponen ini menutup celah
 * itu sekaligus memberi jalur retry saat pemuatan gagal.
 */

const Ikon = ({ name, size = 18 }) => (
  <span
    className="material-symbols-outlined select-none"
    style={{ fontSize: size, lineHeight: 1 }}
  >
    {name}
  </span>
);

const Box = ({ tone, children }) => {
  const palette = {
    error: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
    info: { bg: '#FAFCFF', border: '#DBEAFE', color: '#1d4ed8' },
  }[tone];

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: '12px 16px',
        borderRadius: 12,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
};

export default function RankingWarnings({ dilewati = [], kriteriaTanpaVariasi = [], error = null }) {
  return (
    <>
      {error && (
        <Box tone="error">
          <Ikon name="error" />
          <div style={{ flex: 1 }}>
            <strong>Gagal memuat hasil SAW.</strong> {error}
          </div>
        </Box>
      )}

      {dilewati.length > 0 && (
        <Box tone="warning">
          <Ikon name="warning" />
          <div style={{ flex: 1 }}>
            <strong>
              {dilewati.length} warga tidak masuk peringkat
            </strong>{' '}
            dan tidak dihitung dalam normalisasi SAW:
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {dilewati.slice(0, 8).map((d, i) => (
                <li key={`${d.id_pengajuan ?? 'x'}-${i}`}>
                  {d.nama_warga || `Pengajuan #${d.id_pengajuan ?? '?'}`}
                  {d.rt ? ` (RT ${d.rt})` : ''} — {d.alasan}
                </li>
              ))}
              {dilewati.length > 8 && (
                <li>… dan {dilewati.length - 8} lainnya</li>
              )}
            </ul>
          </div>
        </Box>
      )}

      {kriteriaTanpaVariasi.length > 0 && (
        <Box tone="info">
          <Ikon name="info" />
          <div style={{ flex: 1 }}>
            <strong>Kriteria tanpa variasi nilai:</strong>{' '}
            {kriteriaTanpaVariasi.join(', ')}. Seluruh alternatif punya nilai
            sama pada kriteria ini, sehingga kontribusinya ke peringkat nol.
          </div>
        </Box>
      )}
    </>
  );
}
