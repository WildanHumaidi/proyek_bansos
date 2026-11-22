<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\Warga;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WargaController extends Controller
{
    /**
     * Pengajuan per warga dibatasi 1 baris oleh unique index `pengajuan_id_warga_unique`.
     * Tangkap pelanggaran constraint agar balapan submit (double click) menghasilkan
     * pesan 400 yang jelas, bukan error 500.
     */
    protected function simpanPengajuanBaru(int $idWarga, array $jawabanMentah, string $pesanDuplikat)
    {
        try {
            $pengajuan = new Pengajuan;
            $pengajuan->id_warga = $idWarga;
            $pengajuan->jawaban_mentah = json_encode($jawabanMentah);
            $pengajuan->status = 'menunggu';
            $pengajuan->save();

            return $pengajuan;
        } catch (UniqueConstraintViolationException $e) {
            throw new \RuntimeException($pesanDuplikat, 400, $e);
        }
    }

    /**
     * GET /api/warga/status
     * GET /api/warga/pengajuan/status
     *
     * Cek status pengajuan warga yang sedang login.
     * Dicari berdasarkan nama user → id_warga → pengajuan terbaru.
     */
    public function getStatus(Request $request)
    {
        try {
            $user = $request->user();

            $warga = $user->warga;

            if (! $warga) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data warga tidak ditemukan. Silakan isi kuesioner terlebih dahulu.',
                ], 404);
            }

            $pengajuan = DB::table('pengajuan')
                ->where('id_warga', $warga->id_warga)
                ->latest()
                ->first();

            if (! $pengajuan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Belum ada data pengajuan.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $pengajuan,
            ]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Alias — supaya route lama /warga/status & /warga/pengajuan/status
     * sama-sama mengarah ke getStatus()
     */
    public function cekStatus(Request $request)
    {
        return $this->getStatus($request);
    }

    /**
     * POST /api/warga/pengajuan-rt
     *
     * Dipakai RT untuk input kuesioner atas nama warga.
     * Menerima nama_lengkap, alamat, rt, jawaban_mentah (array).
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'nama_lengkap' => 'required|string',
                'alamat' => 'required|string',
                'rt' => 'required',
                'jawaban_mentah' => 'required|array',
            ]);

            // RT menginput atas nama warga di wilayahnya. Warga dicari lewat nama
            // karena RT memang belum tentu punya akun untuk orang tersebut; batas
            // wilayahnya ditegakkan di sini, dan nama kosong ditolak.
            $namaLengkap = trim((string) $request->nama_lengkap);

            if ($namaLengkap === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Nama lengkap warga wajib diisi.',
                ], 422);
            }

            if ($request->user()->role === 'rt') {
                $rtAktor = (int) $request->user()->rt;

                if ((int) $request->rt !== $rtAktor) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ketua RT hanya dapat menginput warga di wilayah RT-nya.',
                    ], 403);
                }
            }

            $warga = Warga::firstOrCreate(
                ['nama_lengkap' => $namaLengkap, 'rt' => $request->rt],
                [
                    'alamat' => $request->alamat,
                    'rw' => '08',
                    'password' => bcrypt(Str::random(16)),
                ]
            );

            if (! $warga->wasRecentlyCreated) {
                $warga->update(['alamat' => $request->alamat]);
            }

            $idWarga = $warga->id_warga;

            $cek = Pengajuan::where('id_warga', $idWarga)->first();
            if ($cek) {
                return response()->json([
                    'success' => false,
                    'message' => 'Warga ini sudah pernah memiliki pengajuan!',
                ], 400);
            }

            $pengajuan = $this->simpanPengajuanBaru(
                $idWarga,
                $request->jawaban_mentah,
                'Warga ini sudah pernah memiliki pengajuan!'
            );

            return response()->json([
                'success' => true,
                'message' => 'Data kuesioner warga berhasil disimpan!',
                'data' => $pengajuan,
            ]);

        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/warga/pengajuan
     *
     * Dipakai Warga Dashboard — kirim kuesioner sendiri.
     */
    public function kirimPengajuan(Request $request)
    {
        try {
            $request->validate([
                'alamat' => 'required',
                'rt' => 'required',
                'jawaban_mentah' => 'required|array',
            ]);

            $user = Auth::user();

            // Warga hanya boleh mengajukan untuk identitasnya sendiri. Kalau belum
            // tertaut (mis. nama duplikat saat migrasi), admin harus menautkan dulu
            // lewat endpoint taut-warga agar data tidak menimpa warga lain.
            $warga = $user->warga;

            if (! $warga) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Anda belum tertaut ke data warga. Hubungi admin untuk menautkannya.',
                ], 409);
            }

            $warga->update([
                'rt' => $request->rt,
                'alamat' => $request->alamat,
            ]);

            $idWarga = $warga->id_warga;

            $cek = Pengajuan::where('id_warga', $idWarga)->first();
            if ($cek) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah pernah mengirimkan pengajuan!',
                ], 400);
            }

            $pengajuan = $this->simpanPengajuanBaru(
                $idWarga,
                $request->jawaban_mentah,
                'Anda sudah pernah mengirimkan pengajuan!'
            );

            return response()->json([
                'success' => true,
                'message' => 'Pengajuan berhasil dikirim dan siap diverifikasi!',
            ]);

        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
