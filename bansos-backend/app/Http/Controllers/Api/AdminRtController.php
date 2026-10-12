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

class AdminRtController extends Controller
{
    // ==========================================
    // BAGIAN 1: MANAJEMEN USER SISTEM
    // ==========================================

    public function getUsers()
    {
        $users = DB::table('users')->get();

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
            $request->validate([
                'name' => 'required|string',
                'username' => 'required|unique:users',
                'password' => 'required|min:6',
                'role' => 'required|in:admin,rw,rt,warga',
                'rt' => 'nullable|string',
                'alamat' => 'nullable|string',
            ]);

            $user = User::create([
                'name' => $request->name,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'rt' => $request->rt,
                'alamat' => $request->alamat ?? '', // BUG FIX: sebelumnya tidak ada
            ]);

            LogController::catatLog(
                auth()->user()->name ?? 'sistem',
                auth()->user()->role ?? 'admin',
                "Tambah akun baru: {$user->name} (role: {$user->role})"
            );

            return response()->json(['success' => true, 'message' => 'User berhasil ditambahkan!', 'data' => $user]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateUser(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            $request->validate([
                'name' => 'required|string',
                'username' => 'required|unique:users,username,'.$id,
                'role' => 'required|in:admin,rw,rt,warga',
                'rt' => 'nullable|string',
                'alamat' => 'nullable|string',
            ]);

            $user->name = $request->name;
            $user->username = $request->username;
            $user->role = $request->role;
            $user->rt = $request->rt;
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
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function deleteUser($id)
    {
        try {
            $user = User::findOrFail($id);
            $nama = $user->name;
            $user->delete();

            LogController::catatLog(
                auth()->user()->name ?? 'sistem',
                auth()->user()->role ?? 'admin',
                "Hapus akun: {$nama}"
            );

            return response()->json(['success' => true, 'message' => 'User berhasil dihapus!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
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
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function ubahStatusPengajuan(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:menunggu,disetujui,ditolak',
        ]);

        try {
            DB::beginTransaction();

            $pengajuan = Pengajuan::findOrFail($id);
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

    public static function sinkronkanPenilaianDariJawaban($idPengajuan, $rawJawaban): void
    {
        $daftarOpsi = [
            'q1' => ['> 3 KK', '3 KK', '2 KK', '1 KK'],
            'q2' => ['>= 6 ORANG', '5 ORANG', '4 ORANG', '<= 3 ORANG'],
            'q3' => ['TIDAK SEKOLAH', 'SEKOLAH DASAR (SD)', 'SEKOLAH MENENGAH PERTAMA (SMP)', 'SMA / SARJANA'],
            'q4' => ['>= 3 ORANG', '2 ORANG', '1 ORANG', 'TIDAK ADA'],
            'q5' => ['< Rp. 1.500.000', 'Rp. 1.500.000 - Rp. 3.000.000', 'RP. 3.000.000 - Rp. 5.000.000', '> RP. 5.000.000'],
            'q6' => ['< Rp. 1.500.000', 'Rp. 1.500.000 - Rp. 3.000.000', 'RP. 3.000.000 - Rp. 5.000.000', '> RP. 5.000.000'],
            'q7' => ['MENUMPANG', 'SEWA / KONTRAK', 'MILIK ORANG TUA/ SAUDARA /KELUARGA', 'MILIK SENDIRI'],
            'q8' => ['SUNGAI / MATA AIR', 'SUMUR (BOR/GALI)', 'PDAM', 'KEMASAN / ISI ULANG'],
            'q9' => ['TIDAK ADA / LAMPU TEMPEL', 'LISTRIK 450 WATT', 'LISTRIK 900 WATT', 'LISTRIK  > 900 WATT'],
            'q10' => ['JALAN KAKI / SEPEDA / SEPEDA MOTOR SEADANYA / TRANSPORTASI UMUM', 'SEPEDA MOTOR 1 UNIT KONDISI BAIK', 'SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK', 'MOBIL'],
        ];

        $mentah = is_string($rawJawaban) ? json_decode($rawJawaban, true) : $rawJawaban;
        if (is_string($mentah)) {
            $mentah = json_decode($mentah, true);
        }
        if (! is_array($mentah)) {
            return;
        }

        Penilaian::where('id_pengajuan', $idPengajuan)->delete();

        for ($i = 1; $i <= 10; $i++) {
            $key = "q{$i}";
            $jawabanUser = strtolower(preg_replace('/\s+/', '', $mentah[$key] ?? ''));
            $indexOpsi = 2;

            foreach ($daftarOpsi[$key] as $idx => $opsiBenar) {
                if ($jawabanUser === strtolower(preg_replace('/\s+/', '', $opsiBenar))) {
                    $indexOpsi = $idx;
                    break;
                }
            }

            $subRecords = SubKriteria::where('id_kriteria', $i)
                ->orderBy('id_subkriteria', 'asc')
                ->get();

            $idSub = (isset($subRecords[$indexOpsi]))
                ? $subRecords[$indexOpsi]->id_subkriteria
                : (($i - 1) * 4) + $indexOpsi + 1;

            Penilaian::create([
                'id_pengajuan' => $idPengajuan,
                'id_kriteria' => $i,
                'id_subkriteria' => $idSub,
            ]);
        }
    }

    public function updateKuesioner(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $pengajuan = Pengajuan::findOrFail($id);

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
            $request->validate(['file' => 'required|file']);
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
        $semuaPengajuan = Pengajuan::all();

        $daftarOpsi = [
            'q1' => ['> 3 KK', '3 KK', '2 KK', '1 KK'],
            'q2' => ['>= 6 ORANG', '5 ORANG', '4 ORANG', '<= 3 ORANG'],
            'q3' => ['TIDAK SEKOLAH', 'SEKOLAH DASAR (SD)', 'SEKOLAH MENENGAH PERTAMA (SMP)', 'SMA / SARJANA'],
            'q4' => ['>= 3 ORANG', '2 ORANG', '1 ORANG', 'TIDAK ADA'],
            'q5' => ['< Rp. 1.500.000', 'Rp. 1.500.000 - Rp. 3.000.000', 'RP. 3.000.000 - Rp. 5.000.000', '> RP. 5.000.000'],
            'q6' => ['< Rp. 1.500.000', 'Rp. 1.500.000 - Rp. 3.000.000', 'RP. 3.000.000 - Rp. 5.000.000', '> RP. 5.000.000'],
            'q7' => ['MENUMPANG', 'SEWA / KONTRAK', 'MILIK ORANG TUA/ SAUDARA /KELUARGA', 'MILIK SENDIRI'],
            'q8' => ['SUNGAI / MATA AIR', 'SUMUR (BOR/GALI)', 'PDAM', 'KEMASAN / ISI ULANG'],
            'q9' => ['TIDAK ADA / LAMPU TEMPEL', 'LISTRIK 450 WATT', 'LISTRIK 900 WATT', 'LISTRIK  > 900 WATT'],
            'q10' => ['JALAN KAKI / SEPEDA / SEPEDA MOTOR SEADANYA / TRANSPORTASI UMUM', 'SEPEDA MOTOR 1 UNIT KONDISI BAIK', 'SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK', 'MOBIL'],
        ];

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
    }
}
