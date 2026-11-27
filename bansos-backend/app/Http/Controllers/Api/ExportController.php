<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\User;
use App\Services\DataExporter;
use App\Services\RtFormatter;
use App\Services\SawCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Export PDF/Excel untuk data yang tampil di dashboard Admin, RW, dan RT.
 *
 * Setiap penyusun (`susun*`) memakai scope yang SAMA dengan endpoint tampilan
 * (`role:...` di routes + filter wilayah untuk RT), sehingga angka di file
 * unduhan tidak pernah berbeda dari angka di layar. PII yang tidak perlu
 * (hash password, remember_token) tidak pernah masuk ke file.
 *
 * Penyusunan data dipisah dari pengiriman file supaya isinya bisa diuji tanpa
 * membongkar bytes PDF/XLSX.
 */
class ExportController extends Controller
{
    private const LABEL_STATUS = [
        'menunggu' => 'Menunggu Verifikasi',
        'disetujui' => 'Disetujui',
        'ditolak' => 'Ditolak',
    ];

    private const LABEL_ROLE = [
        'admin' => 'Administrator',
        'rw' => 'RW',
        'rt' => 'Ketua RT',
        'warga' => 'Warga',
    ];

    public function __construct(private readonly DataExporter $exporter) {}

    // ── Endpoint ────────────────────────────────────────────────────────────

    public function pengajuan(Request $request)
    {
        return $this->kirim($request, $this->susunPengajuan($request->user()), 'data-pengajuan');
    }

    public function warga(Request $request)
    {
        return $this->kirim($request, $this->susunWarga($request->user()), 'data-warga');
    }

    public function users(Request $request)
    {
        return $this->kirim($request, $this->susunUsers($request->user()), 'daftar-akun');
    }

    public function saw(Request $request)
    {
        $data = $this->susunSaw($request->user());

        if ($data === null) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada data disetujui yang bisa diekspor.',
            ], 404);
        }

        return $this->kirim($request, $data, 'hasil-saw');
    }

    // ── Penyusun data ───────────────────────────────────────────────────────

    /**
     * @return array{judul:string, subjudul:string, kolom:array<int,string>, baris:array<int,array<int,mixed>>}
     */
    public function susunPengajuan(object $user): array
    {
        $query = Pengajuan::with(['warga'])->orderByDesc('created_at');

        if ($user->role === 'rt') {
            $rtNum = RtFormatter::intValue($user->rt);
            $query->whereHas('warga', fn ($q) => $q->whereRaw('CAST(rt AS UNSIGNED) = ?', [$rtNum]));
        }

        $skorMap = $this->skorSaw($user);

        $baris = [];
        foreach ($query->get() as $i => $p) {
            $warga = $p->warga;

            $baris[] = [
                $i + 1,
                $warga?->nama_lengkap ?? '(warga terhapus)',
                $warga?->alamat ?? '-',
                $this->labelRt($warga?->rt),
                $p->created_at ? $p->created_at->format('d/m/Y H:i') : '-',
                self::LABEL_STATUS[$p->status] ?? ucfirst((string) $p->status),
                isset($skorMap[$p->id_pengajuan]) ? number_format($skorMap[$p->id_pengajuan], 4) : '-',
            ];
        }

        return [
            'judul' => 'Data Pengajuan Warga',
            'subjudul' => $this->subjudulUntuk($user, 'Seluruh pengajuan kuesioner beserta status verifikasi'),
            'kolom' => ['No', 'Nama Warga', 'Alamat', 'RT', 'Tanggal Kirim', 'Status', 'Skor SAW'],
            'baris' => $baris,
        ];
    }

    /**
     * @return array{judul:string, subjudul:string, kolom:array<int,string>, baris:array<int,array<int,mixed>>}
     */
    public function susunWarga(object $user): array
    {
        $query = DB::table('warga')
            ->leftJoin('users', 'users.id_warga', '=', 'warga.id_warga')
            ->select(['warga.id_warga', 'warga.nama_lengkap', 'warga.alamat', 'warga.rt', 'users.username']);

        if ($user->role === 'rt') {
            $rtNum = RtFormatter::intValue($user->rt);
            $query->whereRaw('CAST(warga.rt AS UNSIGNED) = ?', [$rtNum]);
        }

        $daftar = $query->orderBy('warga.nama_lengkap')->get();

        // Pengajuan terakhir per warga (urut naik, keyBy menyisakan terbaru).
        $terakhir = DB::table('pengajuan')
            ->select('id_warga', 'status', 'created_at')
            ->whereIn('id_warga', $daftar->pluck('id_warga')->all() ?: [0])
            ->orderBy('created_at')
            ->get()
            ->keyBy('id_warga');

        $baris = [];
        foreach ($daftar as $i => $w) {
            $p = $terakhir->get($w->id_warga);

            $baris[] = [
                $i + 1,
                $w->nama_lengkap,
                $w->alamat ?: '-',
                $this->labelRt($w->rt),
                $w->username ?: 'Belum punya akun',
                $p ? (self::LABEL_STATUS[$p->status] ?? ucfirst((string) $p->status)) : 'Belum mengajukan',
            ];
        }

        return [
            'judul' => 'Data Warga',
            'subjudul' => $this->subjudulUntuk($user, 'Database warga terdaftar beserta status pengajuan terakhir'),
            'kolom' => ['No', 'Nama Lengkap', 'Alamat', 'RT', 'Username', 'Status Pengajuan Terakhir'],
            'baris' => $baris,
        ];
    }

    /**
     * Daftar akun: admin/RW melihat semua, RT hanya warganya.
     * Hash password dan token tidak pernah disertakan.
     *
     * @return array{judul:string, subjudul:string, kolom:array<int,string>, baris:array<int,array<int,mixed>>}
     */
    public function susunUsers(object $user): array
    {
        $query = User::query()
            ->select(['id', 'name', 'username', 'role', 'rt', 'alamat', 'created_at']);

        if ($user->role === 'rt') {
            $query->where('role', 'warga')
                ->whereRaw('CAST(rt AS UNSIGNED) = ?', [RtFormatter::intValue($user->rt)]);
        }

        // Urutan role dihitung di PHP: FIELD() hanya ada di MySQL, sedangkan
        // suite tes memakai SQLite.
        $urutanRole = array_flip(array_keys(self::LABEL_ROLE));
        $daftar = $query->get()->sortBy(fn ($u) => [
            $urutanRole[$u->role] ?? 99,
            (string) $u->rt,
            (string) $u->name,
        ])->values();

        $baris = [];
        foreach ($daftar as $i => $u) {
            $baris[] = [
                $i + 1,
                $u->name,
                $u->username,
                self::LABEL_ROLE[$u->role] ?? ucfirst((string) $u->role),
                $this->labelRt($u->rt),
                $u->alamat ?: '-',
                $u->created_at ? $u->created_at->format('d/m/Y') : '-',
            ];
        }

        return [
            'judul' => 'Daftar Akun Pengguna',
            'subjudul' => $this->subjudulUntuk($user, 'Akun sistem beserta hak aksesnya (tanpa password)'),
            'kolom' => ['No', 'Nama', 'Username', 'Role', 'RT', 'Alamat', 'Terdaftar'],
            'baris' => $baris,
        ];
    }

    /**
     * Hasil perangkingan SAW; null bila belum ada alternatif eligible.
     *
     * @return array{judul:string, subjudul:string, kolom:array<int,string>, baris:array<int,array<int,mixed>>}|null
     */
    public function susunSaw(object $user): ?array
    {
        $hasil = SawCalculator::hitung($user);

        if (! $hasil['success']) {
            return null;
        }

        $baris = [];
        foreach ($hasil['data'] as $i => $row) {
            $baris[] = [
                $i + 1,
                $row['nama_warga'],
                $this->labelRt($row['rt']),
                number_format((float) $row['skor_saw'], 6),
                $row['ranking'],
                $row['ranking_rt'],
                $row['ranking'] <= 10 ? 'Prioritas' : 'Cadangan',
            ];
        }

        return [
            'judul' => 'Hasil Perangkingan SAW',
            'subjudul' => $this->subjudulUntuk($user, 'Perankingan penerima bantuan berdasarkan 10 kriteria SAW'),
            'kolom' => ['No', 'Nama Warga', 'RT', 'Skor SAW', 'Ranking Global', 'Ranking RT', 'Keterangan'],
            'baris' => $baris,
        ];
    }

    // ── Transport ───────────────────────────────────────────────────────────

    /**
     * @param  array{judul:string, subjudul:string, kolom:array<int,string>, baris:array<int,array<int,mixed>>}  $data
     */
    private function kirim(Request $request, array $data, string $dasar)
    {
        $format = strtolower((string) $request->input('format', 'pdf'));

        if (! in_array($format, ['pdf', 'xlsx'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Format tidak dikenali. Gunakan format=pdf atau format=xlsx.',
            ], 422);
        }

        $namaFile = $dasar.'-'.now()->format('Ymd-His');

        LogController::catatLog(
            auth()->user()->name ?? 'sistem',
            auth()->user()->role ?? 'admin',
            "Export {$format}: {$data['judul']} ({$namaFile})"
        );

        return $format === 'xlsx'
            ? $this->exporter->excel($data['judul'], $data['subjudul'], $data['kolom'], $data['baris'], $namaFile)
            : $this->exporter->pdf($data['judul'], $data['subjudul'], $data['kolom'], $data['baris'], $namaFile);
    }

    /** @return array<int, float> skor SAW per id_pengajuan */
    private function skorSaw(object $user): array
    {
        $hasil = SawCalculator::hitung($user);

        if (! $hasil['success']) {
            return [];
        }

        $map = [];
        foreach ($hasil['data'] as $row) {
            $map[$row['id_pengajuan']] = $row['skor_saw'];
        }

        return $map;
    }

    private function subjudulUntuk(object $user, string $dasar): string
    {
        $cakupan = match ($user->role) {
            'rt' => 'Lingkup: RT '.$this->labelRt($user->rt).' / RW 08',
            'rw' => 'Lingkup: RW 08 (seluruh RT)',
            default => 'Lingkup: seluruh wilayah RW 08',
        };

        return $dasar.' — '.$cakupan;
    }

    private function labelRt(?string $rt): string
    {
        if ($rt === null || trim($rt) === '') {
            return '-';
        }

        return RtFormatter::formatRt($rt);
    }
}
