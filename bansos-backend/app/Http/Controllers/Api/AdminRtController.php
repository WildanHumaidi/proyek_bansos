<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\Penilaian;
use App\Models\SubKriteria;
use App\Models\User;
use App\Models\Warga;
use App\Services\CsvHeaderException;
use App\Services\CsvImporter;
use App\Services\JawabanTidakDikenalException;
use App\Services\PenilaianAssembler;
use App\Services\RtFormatter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminRtController extends Controller
{
    // ==========================================
    // BAGIAN 1: MANAJEMEN USER SISTEM
    // ==========================================

    public function getUsers(Request $request)
    {
        $query = DB::table('users')->select([
            'id',
            'name',
            'username',
            'role',
            'rt',
            'alamat',
            'id_warga',
            'created_at',
            'updated_at',
        ]);

        if ($request->user()->role === 'rt') {
            $query->where('role', 'warga')
                ->where(function ($areaQuery) use ($request) {
                    $rtNum = RtFormatter::intValue($request->user()->rt);
                    $areaQuery->whereRaw('CAST(rt AS UNSIGNED) = ?', [$rtNum]);
                });
        }

        $users = $query->get();

        $namaUsersTanpaAlamat = $users->filter(fn ($u) => empty($u->alamat))->pluck('name')->all();
        $wargaMap = [];
        if (! empty($namaUsersTanpaAlamat)) {
            $wargaMap = DB::table('warga')
                ->whereIn('nama_lengkap', $namaUsersTanpaAlamat)
                ->pluck('alamat', 'nama_lengkap')
                ->all();
        }

        $usersDenganAlamat = $users->map(function ($user) use ($wargaMap) {
            if (empty($user->alamat) && isset($wargaMap[$user->name])) {
                $user->alamat = $wargaMap[$user->name];
            }

            return $user;
        });

        return response()->json(['success' => true, 'data' => $usersDenganAlamat]);
    }

    /**
     * GET /api/rt/warga — daftar WARGA wilayah (bukan akun).
     *
     * Database Warga dulu membaca /admin/users sehingga hanya menampilkan warga
     * yang sudah punya akun (2 orang), padahal wilayah RT 01 punya 37 warga
     * terdata. Daftar ini memakai tabel `warga` sebagai sumber, lalu menempelkan
     * akun (kalau ada) dan pengajuan terakhirnya.
     */
    public function getWargaWilayah(Request $request)
    {
        try {
            $user = $request->user();

            $query = DB::table('warga')
                ->leftJoin('users', 'users.id_warga', '=', 'warga.id_warga')
                ->select([
                    'warga.id_warga',
                    'warga.nama_lengkap',
                    'warga.alamat',
                    'warga.rt',
                    'users.id as id_user',
                    'users.username',
                ]);

            if ($user->role === 'rt') {
                $rtNum = RtFormatter::intValue($user->rt);
                $query->whereRaw('CAST(warga.rt AS UNSIGNED) = ?', [$rtNum]);
            }

            $daftar = $query->orderBy('warga.nama_lengkap')->get();

            // Pengajuan terakhir per warga; urut naik lalu keyBy menyisakan yang terbaru.
            $pengajuan = DB::table('pengajuan')
                ->select('id_pengajuan', 'id_warga', 'status', 'created_at')
                ->whereIn('id_warga', $daftar->pluck('id_warga')->all() ?: [0])
                ->orderBy('created_at')
                ->get()
                ->keyBy('id_warga');

            $data = $daftar->map(function ($w) use ($pengajuan) {
                $p = $pengajuan->get($w->id_warga);

                return [
                    'id' => $w->id_user ?? 'warga-'.$w->id_warga,
                    'id_warga' => (int) $w->id_warga,
                    'name' => $w->nama_lengkap,
                    'username' => $w->username,
                    'alamat' => $w->alamat,
                    'rt' => $w->rt,
                    'id_pengajuan' => $p->id_pengajuan ?? null,
                    'status' => $p->status ?? null,
                ];
            });

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/admin/users — buat akun.
     *
     * P1-02: saat akun warga dibuat, baris `warga` juga dibuat dan users.id_warga
     * ditautkan dalam SATU transaksi. Akun hasil buatan RT langsung bisa login
     * dan mengakses datanya sendiri (tidak lagi yatim/BUG-10).
     */
    public function storeUser(Request $request)
    {
        try {
            $actor = $request->user();

            $request->validate([
                'name' => 'required|string',
                'username' => 'required|unique:users',
                'password' => 'required|min:6',
                'role' => 'required|in:admin,rw,rt,warga',
                'rt' => 'nullable|string',
                'alamat' => 'nullable|string',
            ]);

            if ($actor->role === 'rt' && $request->role !== 'warga') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ketua RT hanya dapat membuat akun warga.',
                ], 403);
            }

            $rt = $actor->role === 'rt' ? $actor->rt : $request->rt;

            $user = DB::transaction(function () use ($request, $actor, $rt) {
                $dataUser = [
                    'name' => $request->name,
                    'username' => $request->username,
                    'password' => Hash::make($request->password),
                    'role' => $actor->role === 'rt' ? 'warga' : $request->role,
                    'rt' => $rt,
                    'alamat' => $request->alamat ?? '',
                ];

                if (($dataUser['role'] ?? $request->role) === 'warga') {
                    // Setiap akun warga wajib punya pasangan identitas warga (P1-02).
                    $warga = Warga::create([
                        'nama_lengkap' => $request->name,
                        'alamat' => $request->alamat ?? '',
                        'rt' => RtFormatter::formatRt($rt),
                        'rw' => '008',
                    ]);

                    $dataUser['id_warga'] = $warga->id_warga;
                }

                return User::create($dataUser);
            });

            LogController::catatLog(
                auth()->user()->name ?? 'sistem',
                auth()->user()->role ?? 'admin',
                "Tambah akun baru: {$user->name} (role: {$user->role})"
            );

            return response()->json(['success' => true, 'message' => 'User berhasil ditambahkan!', 'data' => $user]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateUser(Request $request, $id)
    {
        try {
            $actor = $request->user();
            $user = User::findOrFail($id);

            if ($actor->role === 'rt'
                && ($user->role !== 'warga' || ! RtFormatter::sama($user->rt, $actor->rt))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ketua RT hanya dapat mengubah akun warga di wilayahnya.',
                ], 403);
            }

            $request->validate([
                'name' => 'required|string',
                'username' => 'required|unique:users,username,'.$id,
                'role' => 'required|in:admin,rw,rt,warga',
                'rt' => 'nullable|string',
                'alamat' => 'nullable|string',
            ]);

            if ($actor->role === 'rt' && $request->role !== 'warga') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ketua RT tidak dapat mengubah role akun warga.',
                ], 403);
            }

            $user->name = $request->name;
            $user->username = $request->username;
            $user->role = $actor->role === 'rt' ? 'warga' : $request->role;
            $user->rt = $actor->role === 'rt' ? $actor->rt : $request->rt;
            $user->alamat = $request->alamat ?? $user->alamat;

            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }
            $user->save();

            LogController::catatLog(
                auth()->user()->name ?? 'sistem',
                auth()->user()->role ?? 'admin',
                "Update akun: {$user->name} (role: {$user->role})"
            );

            return response()->json(['success' => true, 'message' => 'Data User berhasil diperbarui!']);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function deleteUser($id)
    {
        try {
            $user = User::findOrFail($id);

            if (auth()->id() === $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
                ], 422);
            }

            $nama = $user->name;
            $user->delete();

            LogController::catatLog(
                auth()->user()->name ?? 'sistem',
                auth()->user()->role ?? 'admin',
                "Hapus akun: {$nama}"
            );

            return response()->json(['success' => true, 'message' => 'User berhasil dihapus!']);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * PUT /api/admin/users/{id}/taut-warga
     *
     * Menautkan akun warga ke baris `warga` tertentu (untuk kasus nama duplikat
     * dari data lama). Memvalidasi RT cocok dan kepemilikan unik.
     */
    public function tautkanWarga(Request $request, $id)
    {
        $request->validate([
            'id_warga' => 'required|integer|exists:warga,id_warga',
        ]);

        $user = User::findOrFail($id);

        if ($user->role !== 'warga') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya akun berperan warga yang dapat ditautkan ke data warga.',
            ], 422);
        }

        $warga = Warga::findOrFail($request->id_warga);

        $sudahDipakai = User::where('id_warga', $warga->id_warga)
            ->where('id', '!=', $user->id)
            ->exists();

        if ($sudahDipakai) {
            return response()->json([
                'success' => false,
                'message' => 'Data warga tersebut sudah tertaut ke akun lain.',
            ], 422);
        }

        if (! RtFormatter::sama($user->rt, $warga->rt)) {
            return response()->json([
                'success' => false,
                'message' => 'RT akun tidak sesuai dengan RT data warga. Periksa kembali.',
            ], 422);
        }

        $user->update(['id_warga' => $warga->id_warga]);

        LogController::catatLog(
            auth()->user()->name ?? 'sistem',
            auth()->user()->role ?? 'admin',
            "Tautkan akun {$user->username} ke warga #{$warga->id_warga} ({$warga->nama_lengkap})"
        );

        return response()->json([
            'success' => true,
            'message' => 'Akun berhasil ditautkan ke data warga.',
            'data' => ['id' => $user->id, 'id_warga' => $user->id_warga],
        ]);
    }

    // ==========================================
    // BAGIAN 2: MANAJEMEN PENGAJUAN & KUESIONER
    // ==========================================
    public function getDaftarPengajuan(Request $request)
    {
        try {
            $user = $request->user();
            $query = Pengajuan::with(['warga', 'penilaian.subKriteria']);

            if ($user->role === 'rt') {
                $rtNum = RtFormatter::intValue($user->rt);
                $query->whereHas('warga', function ($q) use ($rtNum) {
                    $q->whereRaw('CAST(rt AS UNSIGNED) = ?', [$rtNum]);
                });
            }

            $pengajuan = $query->orderBy('created_at', 'desc')->get();

            return response()->json(['success' => true, 'data' => $pengajuan]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    protected function authorizePengajuanArea(Request $request, Pengajuan $pengajuan): void
    {
        $user = $request->user();

        if ($user->role !== 'rt') {
            return;
        }

        if (! $pengajuan->warga || ! RtFormatter::sama($pengajuan->warga->rt, $user->rt)) {
            abort(response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Pengajuan ini berada di luar wilayah RT Anda.',
            ], 403));
        }
    }

    /**
     * PUT /api/admin/pengajuan/{id}/status
     *
     * P0-04: approval hanya untuk aktor berwenang; P1-04: persetujuan hanya
     * berhasil bila matriks penilaian LENGKAP (10 kriteria) — jika ada jawaban
     * yang tidak bisa dipetakan, seluruh transaksi di-rollback dan error 422
     * dikembalikan berisi kriteria bermasalah (BUG-16). Rejection menghapus
     * penilaian (BUG-24 memungkinkan pengajuan ulang — lihat WargaController).
     */
    public function ubahStatusPengajuan(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:menunggu,disetujui,ditolak',
        ]);

        $pengajuan = Pengajuan::with('warga')->findOrFail($id);
        $this->authorizePengajuanArea($request, $pengajuan);

        try {
            DB::beginTransaction();

            $pengajuan->update(['status' => $request->status]);

            if ($request->status === 'disetujui' && ! empty($pengajuan->jawaban_mentah)) {
                $hasil = PenilaianAssembler::bangun(
                    $pengajuan->id_pengajuan,
                    json_decode($pengajuan->jawaban_mentah, true) ?: [],
                    strict: true
                );

                $jumlahKriteria = SubKriteria::distinct('id_kriteria')->count('id_kriteria');
                if ($hasil['terbentuk'] !== $jumlahKriteria) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'message' => 'Persetujuan dibatalkan: matriks penilaian tidak lengkap. '
                            .'Kriteria yang bermasalah: '
                            .implode(', ', array_map(fn ($e) => $e['key'].' ('.$e['alasan'].')', $hasil['tidak_cocok'])),
                        'error' => $hasil['tidak_cocok'],
                    ], 422);
                }
            } elseif ($request->status !== 'disetujui') {
                Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->delete();
            }

            LogController::catatLog(
                auth()->user()->name ?? 'sistem',
                auth()->user()->role ?? 'rt',
                "Ubah status pengajuan #{$id} menjadi: {$request->status}"
            );

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Status berhasil diubah']);
        } catch (JawabanTidakDikenalException $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Persetujuan dibatalkan: '.$e->getMessage(),
                'error' => $e->rincian,
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * PUT /api/admin/pengajuan/{id}/kuesioner
     *
     * P0-05: setiap pasangan id_kriteria ↔ id_subkriteria divalidasi silang —
     * sub-kriteria harus milik kriteria terkait, kalau tidak 422 dan tidak ada
     * perubahan parsial (transaction). Seluruh matriks lama dihapus & dibangun
     * ulang hanya setelah seluruh payload tervalidasi.
     */
    public function updateKuesioner(Request $request, $id)
    {
        $pengajuan = Pengajuan::with('warga')->findOrFail($id);
        $this->authorizePengajuanArea($request, $pengajuan);

        try {
            DB::beginTransaction();

            if ($request->has('jawaban_mentah')) {
                $mentah = is_array($request->jawaban_mentah)
                    ? json_encode($request->jawaban_mentah)
                    : $request->jawaban_mentah;
                $pengajuan->update(['jawaban_mentah' => $mentah]);
            }

            if ($request->has('jawaban') && is_array($request->jawaban)) {
                // Validasi SILANG terlebih dahulu — jangan hapus data lama
                // sebelum seluruh payload terbukti sah (P0-05 #4).
                $idSubById = [];
                $petaSub = SubKriteria::all()->keyBy('id_subkriteria');

                foreach ($request->jawaban as $idKriteria => $idSub) {
                    $idKriteria = (int) $idKriteria;
                    $idSub = (int) $idSub;

                    $sub = $petaSub->get($idSub);
                    if (! $sub) {
                        DB::rollBack();

                        return response()->json([
                            'success' => false,
                            'message' => "Sub-kriteria #{$idSub} tidak ditemukan.",
                        ], 422);
                    }
                    if ((int) $sub->id_kriteria !== $idKriteria) {
                        DB::rollBack();

                        return response()->json([
                            'success' => false,
                            'message' => "Sub-kriteria #{$idSub} bukan milik kriteria C{$idKriteria} "
                                ."(milik C{$sub->id_kriteria}). Penilaian dibatalkan.",
                        ], 422);
                    }

                    $idSubById[$idKriteria] = $idSub;
                }

                Penilaian::where('id_pengajuan', $id)->delete();
                foreach ($idSubById as $idKriteria => $idSub) {
                    Penilaian::create([
                        'id_pengajuan' => $id,
                        'id_kriteria' => $idKriteria,
                        'id_subkriteria' => $idSub,
                    ]);
                }
            } elseif ($request->has('jawaban_mentah') && $pengajuan->status === 'disetujui') {
                PenilaianAssembler::bangun(
                    $pengajuan->id_pengajuan,
                    json_decode($pengajuan->jawaban_mentah, true) ?: [],
                    strict: true
                );
            }

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Kuesioner berhasil diperbarui']);
        } catch (JawabanTidakDikenalException $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Kuesioner ditolak: '.$e->getMessage(),
                'error' => $e->rincian,
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroyPengajuan($id)
    {
        try {
            Pengajuan::destroy($id);
            Penilaian::where('id_pengajuan', $id)->delete();

            LogController::catatLog(
                auth()->user()->name ?? 'sistem',
                auth()->user()->role ?? 'admin',
                "Hapus data kuesioner/pengajuan #{$id}"
            );

            return response()->json(['success' => true, 'message' => 'Data berhasil dihapus']);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ==========================================
    // BAGIAN 3: IMPORT DATA CSV
    // ==========================================

    /**
     * POST /api/admin/pengajuan/import
     *
     * Memakai CsvImporter (SSOT): header divalidasi, baris yang gagal
     * menyebabkan rollback seluruh impor, status selalu 'menunggu',
     * identitas tidak pernah ditimpa diam-diam.
     *
     * Setiap warga hasil impor langsung dibuatkan akun login (role warga,
     * tertaut id_warga): username = nama depan, password awal = nama depan +
     * "123". Password hanya muncul sekali di laporan response ini — RT/RW
     * tinggal meneruskan ke warganya.
     */
    public function importCsv(Request $request)
    {
        ini_set('max_execution_time', 300);

        try {
            $request->validate([
                'file' => 'required|file|mimes:csv,txt|max:5120',
            ]);

            $isi = file_get_contents($request->file('file')->getRealPath());

            $hasil = (new CsvImporter)->impor($isi, buatAkun: true);

            if ($hasil['error_header']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Import gagal: '.$hasil['error_header'],
                    'detail' => $hasil,
                ], 422);
            }

            LogController::catatLog(
                auth()->user()->name ?? 'sistem',
                auth()->user()->role ?? 'admin',
                sprintf(
                    'Import CSV: %d dibuat, %d dilewati (duplikat), %d gagal, %d akun warga dibuat',
                    $hasil['banyak_import'],
                    $hasil['banyak_skip'],
                    $hasil['banyak_gagal'],
                    $hasil['banyak_akun']
                )
            );

            return response()->json([
                'success' => $hasil['banyak_gagal'] === 0,
                'message' => $hasil['banyak_gagal'] === 0
                    ? sprintf(
                        'Berhasil! %d data warga tersimpan (status: menunggu verifikasi), %d akun login dibuat.',
                        $hasil['banyak_import'],
                        $hasil['banyak_akun']
                    )
                    : sprintf('Import dibatalkan: %d baris gagal.', $hasil['banyak_gagal']),
                'banyak_import' => $hasil['banyak_import'],
                'banyak_skip' => $hasil['banyak_skip'],
                'banyak_gagal' => $hasil['banyak_gagal'],
                'banyak_akun' => $hasil['banyak_akun'],
                'laporan' => $hasil['baris'],
            ], $hasil['banyak_gagal'] === 0 ? 200 : 422);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import gagal: '.$e->getMessage(),
            ], 500);
        }
    }

    // ==========================================
    // BAGIAN 4: FIX DATA (dry-run default)
    // ==========================================

    /**
     * POST /api/admin/fix-data
     *
     * P2-02: mode default dry-run — tidak mengubah apa pun, hanya melaporkan
     * jumlah pengajuan yang akan diproses dan perubahan yang akan terjadi.
     * Mode apply memerlukan parameter eksplisit `mode=apply` dan tetap
     * melewati record yang gagal validasi tanpa menimpanya.
     */
    public function fixDataMentah(Request $request)
    {
        $mode = $request->input('mode', 'dry-run');

        if (! in_array($mode, ['dry-run', 'apply'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Mode tidak dikenal. Gunakan mode=dry-run (default) atau mode=apply.',
            ], 422);
        }

        $semuaPengajuan = Pengajuan::whereNotNull('jawaban_mentah')->get();

        $laporan = [];
        $countOk = 0;
        $countError = 0;

        foreach ($semuaPengajuan as $p) {
            $idPengajuan = $p->id_pengajuan;

            try {
                $hasil = PenilaianAssembler::bangun(
                    $idPengajuan,
                    json_decode($p->jawaban_mentah, true) ?: [],
                    strict: true
                );

                $laporan[] = [
                    'id_pengajuan' => $idPengajuan,
                    'status' => 'ok',
                    'terbentuk' => $hasil['terbentuk'],
                ];
                $countOk++;
            } catch (JawabanTidakDikenalException $e) {
                $laporan[] = [
                    'id_pengajuan' => $idPengajuan,
                    'status' => 'error',
                    'error' => $e->getMessage(),
                ];
                $countError++;
            }
        }

        if ($mode === 'dry-run') {
            return response()->json([
                'success' => true,
                'message' => "Dry-run: {$countOk} pengajuan akan diperbaiki, {$countError} gagal validasi.",
                'mode' => 'dry-run',
                'count_ok' => $countOk,
                'count_error' => $countError,
                'laporan' => $laporan,
            ]);
        }

        LogController::catatLog(
            auth()->user()->name ?? 'sistem',
            auth()->user()->role ?? 'admin',
            "Fix data (apply): {$countOk} diperbaiki & matriks di-generate, {$countError} gagal"
        );

        return response()->json([
            'success' => true,
            'message' => "{$countOk} data diperbaiki dan matriks berhasil di-generate, {$countError} gagal.",
            'mode' => 'apply',
            'count_ok' => $countOk,
            'count_error' => $countError,
            'laporan' => $laporan,
        ]);
    }
}
