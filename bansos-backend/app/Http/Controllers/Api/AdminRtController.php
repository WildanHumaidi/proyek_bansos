<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\Penilaian;
use App\Models\SubKriteria;
use App\Models\User;
use App\Models\Warga;
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
                    $rtNum = (int) $request->user()->rt;
                    $areaQuery->where('rt', $rtNum)
                        ->orWhere('rt', str_pad($rtNum, 3, '0', STR_PAD_LEFT));
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

    // BUG FIX: tambahkan 'alamat' yang sebelumnya tidak disimpan
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

            $user = User::create([
                'name' => $request->name,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'role' => $actor->role === 'rt' ? 'warga' : $request->role,
                'rt' => $rt,
                'alamat' => $request->alamat ?? '', // BUG FIX: sebelumnya tidak ada
            ]);

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
                && ($user->role !== 'warga' || (int) $user->rt !== (int) $actor->rt)) {
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
     * Menautkan akun warga ke baris `warga` tertentu. Dipakai untuk akun yang
     * namanya duplikat sehingga tidak bisa dipasangkan otomatis saat migrasi.
     * Tanpa tautan ini, akun tidak bisa mengajukan (409) dan tidak bisa membuka
     * chat — sengaja, agar tidak menebak dan salah memasangkan orang.
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

        // Satu baris warga hanya boleh dimiliki satu akun, kalau tidak dua akun bisa
        // mengubah pengajuan yang sama.
        $sudahDipakai = User::where('id_warga', $warga->id_warga)
            ->where('id', '!=', $user->id)
            ->exists();

        if ($sudahDipakai) {
            return response()->json([
                'success' => false,
                'message' => 'Data warga tersebut sudah tertaut ke akun lain.',
            ], 422);
        }

        if ((int) $user->rt !== (int) $warga->rt) {
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
                $rtNum = (int) $user->rt;
                $query->whereHas('warga', function ($q) use ($rtNum) {
                    $q->where('rt', $rtNum)
                        ->orWhere('rt', str_pad($rtNum, 3, '0', STR_PAD_LEFT));
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

        if (! $pengajuan->warga || (int) $pengajuan->warga->rt !== (int) $user->rt) {
            abort(response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Pengajuan ini berada di luar wilayah RT Anda.',
            ], 403));
        }
    }

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
                self::sinkronkanPenilaianDariJawaban($pengajuan->id_pengajuan, $pengajuan->jawaban_mentah);
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
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Membentuk/menyegarkan 10 baris `penilaian` dari `jawaban_mentah`.
     *
     * Pencocokan dilakukan terhadap baris `sub_kriteria` milik kriteria itu sendiri
     * (bukan daftar label hardcoded), karena label kuesioner frontend/CSV bisa
     * berbeda dari teks di database. Mengembalikan daftar kriteria yang jawabannya
     * tidak dikenali, supaya pemanggil bisa melaporkannya alih-alih diam-diam
     * memakai sub-kriteria default.
     */
    public static function sinkronkanPenilaianDariJawaban($idPengajuan, $rawJawaban): array
    {
        $mentah = is_string($rawJawaban) ? json_decode($rawJawaban, true) : $rawJawaban;
        if (is_string($mentah)) {
            $mentah = json_decode($mentah, true);
        }
        if (! is_array($mentah)) {
            return ['terbentuk' => 0, 'tidak_cocok' => []];
        }

        Penilaian::where('id_pengajuan', $idPengajuan)->delete();

        $terbentuk = 0;
        $tidakCocok = [];
        $normalisasi = fn ($teks) => strtolower(preg_replace('/\s+/', '', (string) $teks));

        for ($i = 1; $i <= 10; $i++) {
            $key = "q{$i}";
            $jawabanUser = $normalisasi($mentah[$key] ?? '');

            $subRecords = SubKriteria::where('id_kriteria', $i)
                ->orderBy('nilai', 'asc')
                ->orderBy('id_subkriteria', 'asc')
                ->get();

            $cocok = $subRecords->first(
                fn ($sub) => $normalisasi($sub->keterangan) === $jawabanUser
            );

            if (! $cocok) {
                // Coba pencocokan sebagian (mis. "SMA / SMK / S1" vs "SMA / SMK / PT").
                $cocok = $subRecords->first(function ($sub) use ($normalisasi, $jawabanUser) {
                    $keterangan = $normalisasi($sub->keterangan);

                    return $jawabanUser !== ''
                        && $keterangan !== ''
                        && (str_contains($keterangan, $jawabanUser) || str_contains($jawabanUser, $keterangan));
                });
            }

            if (! $cocok) {
                $tidakCocok[] = $key;

                continue;
            }

            Penilaian::create([
                'id_pengajuan' => $idPengajuan,
                'id_kriteria' => $i,
                'id_subkriteria' => $cocok->id_subkriteria,
            ]);
            $terbentuk++;
        }

        return ['terbentuk' => $terbentuk, 'tidak_cocok' => $tidakCocok];
    }

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
                Penilaian::where('id_pengajuan', $id)->delete();
                foreach ($request->jawaban as $id_kriteria => $id_sub) {
                    Penilaian::create([
                        'id_pengajuan' => $id,
                        'id_kriteria' => (int) $id_kriteria,
                        'id_subkriteria' => (int) $id_sub,
                    ]);
                }
            } elseif ($request->has('jawaban_mentah') && $pengajuan->status === 'disetujui') {
                // Matriks di-generate backend dari jawaban mentah; frontend tidak perlu
                // mengirim pemetaan sub-kriteria sendiri.
                self::sinkronkanPenilaianDariJawaban($pengajuan->id_pengajuan, $pengajuan->jawaban_mentah);
            }

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Kuesioner berhasil diperbarui']);
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

    public function importCsv(Request $request)
    {
        ini_set('max_execution_time', 300);

        try {
            $request->validate([
                'file' => 'required|file|mimes:csv,txt|max:5120',
            ]);
            $path = $request->file('file')->getRealPath();
            $file = fopen($path, 'r');
            if (! $file) {
                return response()->json(['success' => false, 'message' => 'Gagal membaca file.']);
            }

            // Deteksi delimiter otomatis
            $line = fgets($file);
            $delimiter = substr_count($line, ';') > substr_count($line, ',') ? ';' : ',';
            rewind($file);
            fgetcsv($file, 0, $delimiter); // skip header

            $count = 0;
            $passUser = Hash::make(Str::random(12));
            $passWarga = bcrypt(Str::random(12));

            DB::beginTransaction();

            while (($row = fgetcsv($file, 0, $delimiter)) !== false) {
                if (! isset($row[1]) || trim($row[1]) === '') {
                    continue;
                }

                $nama = trim($row[1]);
                $alamat = isset($row[2]) ? trim($row[2]) : '';
                $rtNum = (int) ($row[13] ?? 1);

                $baseUser = strtolower(preg_replace('/[^a-z0-9]/i', '', $nama));
                if (empty($baseUser)) {
                    $baseUser = 'warga';
                }
                $username = $baseUser.'_'.$rtNum.'_'.rand(100, 999);
                while (User::where('username', $username)->exists()) {
                    $username = $baseUser.'_'.rand(1000, 99999);
                }

                // 1. Buat/ambil user di tabel users
                $user = User::firstOrCreate(
                    ['name' => $nama, 'rt' => $rtNum],
                    ['username' => $username, 'password' => $passUser, 'role' => 'warga', 'alamat' => $alamat]
                );
                // Selalu update alamat
                if (! $user->wasRecentlyCreated) {
                    $user->update(['alamat' => $alamat]);
                }

                // 2. Buat/update entri di tabel warga
                $warga = Warga::updateOrCreate(
                    ['nama_lengkap' => $nama],
                    ['rt' => $rtNum, 'alamat' => $alamat, 'rw' => '8', 'password' => $passWarga]
                );
                $idWarga = $warga->id_warga ?? $warga->id;

                $jawaban = [
                    'q1' => $row[3] ?? '-', 'q2' => $row[4] ?? '-',
                    'q3' => $row[5] ?? '-', 'q4' => $row[6] ?? '-',
                    'q5' => $row[7] ?? '-', 'q6' => $row[8] ?? '-',
                    'q7' => $row[9] ?? '-', 'q8' => $row[10] ?? '-',
                    'q9' => $row[11] ?? '-', 'q10' => $row[12] ?? '-',
                ];

                // BUG FIX: hapus 'rt' dari pengajuan — kolom itu tidak ada di tabel pengajuan
                $pengajuan = Pengajuan::updateOrCreate(
                    ['id_warga' => $idWarga],
                    [
                        'status' => 'disetujui',
                        'jawaban_mentah' => json_encode($jawaban),
                    ]
                );
                self::sinkronkanPenilaianDariJawaban($pengajuan->id_pengajuan, $pengajuan->jawaban_mentah);

                $count++;
            }

            fclose($file);
            DB::commit();

            LogController::catatLog(
                auth()->user()->name ?? 'sistem',
                auth()->user()->role ?? 'admin',
                "Import CSV: {$count} data warga berhasil diproses"
            );

            return response()->json([
                'success' => true,
                'message' => "Berhasil! {$count} data warga tersimpan.",
            ]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Import gagal: '.$e->getMessage().' (baris '.$e->getLine().')',
            ], 500);
        }
    }

    // ==========================================
    // BAGIAN 4: SAPU AJAIB – PERBAIKI DATA MENTAH + GENERATE MATRIKS
    // ==========================================

    public function fixDataMentah()
    {
        return DB::transaction(function () {
            $semuaPengajuan = Pengajuan::all();
            $count = 0;

            foreach ($semuaPengajuan as $p) {
                $idPengajuan = $p->id_pengajuan ?? $p->id;
                if (! empty($p->jawaban_mentah)) {
                    self::sinkronkanPenilaianDariJawaban($idPengajuan, $p->jawaban_mentah);
                    $count++;
                }
            }

            LogController::catatLog(
                auth()->user()->name ?? 'sistem',
                auth()->user()->role ?? 'admin',
                "Sapu ajaib: {$count} data kuesioner diperbaiki & matriks di-generate"
            );

            return response()->json([
                'success' => true,
                'message' => "{$count} data diperbaiki dan matriks berhasil di-generate!",
            ]);
        });
    }
}
