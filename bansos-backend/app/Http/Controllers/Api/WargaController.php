<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\PengajuanRiwayat;
use App\Models\Warga;
use App\Services\JawabanMapper;
use App\Services\JawabanTidakDikenalException;
use App\Services\PenilaianAssembler;
use App\Services\RtFormatter;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WargaController extends Controller
{
    /**
     * Validasi jawaban kuesioner server-side (P1-03 / BUG-15):
     *  - seluruh kunci wajib q1..q10;
     *  - setiap jawaban harus dikenali oleh kamus sub-kriteria kriteria itu;
     *  - tidak boleh ada kunci duplikat/ekstra.
     *
     * @throws JawabanTidakDikenalException
     */
    protected function validasiJawaban(array $jawabanMentah): void
    {
        $kunciDikenal = [];
        for ($i = 1; $i <= 10; $i++) {
            $kunciDikenal['q'.$i] = true;
        }

        foreach ($jawabanMentah as $key => $nilai) {
            if (! isset($kunciDikenal[$key])) {
                throw new JawabanTidakDikenalException([[
                    'key' => (string) $key,
                    'kriteria' => 0,
                    'jawaban' => (string) $nilai,
                    'alasan' => "kunci jawaban '{$key}' tidak sah (wajib q1..q10)",
                ]]);
            }
        }

        if (count($jawabanMentah) !== 10) {
            $kurang = array_values(array_diff(array_keys($kunciDikenal), array_keys($jawabanMentah)));
            $rincian = array_map(fn ($k) => [
                'key' => $k,
                'kriteria' => (int) substr($k, 1),
                'jawaban' => '',
                'alasan' => 'jawaban wajib diisi',
            ], $kurang);

            throw new JawabanTidakDikenalException(array_values($rincian));
        }

        // Validasi vocab tiap jawaban terhadap sub-kriteria (tanpa menulis apa pun).
        $peta = JawabanMapper::petakanSemua($jawabanMentah, \App\Models\SubKriteria::all());

        if (! $peta['ok']) {
            throw new JawabanTidakDikenalException($peta['error']);
        }
    }

    /**
     * Simpan pengajuan baru (atau perbarui pengajuan lama yang ditolak).
     *
     * P1-06: satu pengajuan aktif per warga. Bila pengajuan sebelumnya berstatus
     * `ditolak`, warga boleh mengajukan ulang — baris yang sama diperbarui dan
     * kondisi lama diarsipkan ke `pengajuan_riwayat` (histori tidak hilang).
     * Pengajuan `menunggu`/`disetujui` tetap menolak pengajuan kedua.
     */
    protected function simpanPengajuan(int $idWarga, array $jawabanMentah, string $pesanDuplikat): Pengajuan
    {
        $existing = Pengajuan::where('id_warga', $idWarga)->first();

        if ($existing && $existing->status !== 'ditolak') {
            throw new \RuntimeException($pesanDuplikat, 400);
        }

        if ($existing) {
            PengajuanRiwayat::create([
                'id_pengajuan' => $existing->id_pengajuan,
                'status_lama' => $existing->status,
                'jawaban_lama' => $existing->jawaban_mentah,
                'diubah_oleh' => auth()->user()->username ?? 'sistem',
            ]);

            $existing->update([
                'status' => 'menunggu',
                'jawaban_mentah' => json_encode($jawabanMentah),
            ]);

            return $existing;
        }

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
     * POST /api/warga/pengajuan-rt
     *
     * Dipakai RT untuk input kuesioner atas nama warga.
     * P1-08: seluruh penyimpanan (warga + pengajuan + penilaian) dalam SATU
     * transaksi — tidak ada record parsial.
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'nama_lengkap' => 'required|string',
                'alamat' => 'required|string',
                'rt' => ['required', RtFormatter::rule()],
                'jawaban_mentah' => 'required|array',
            ]);

            $namaLengkap = trim((string) $request->nama_lengkap);

            if ($namaLengkap === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Nama lengkap warga wajib diisi.',
                ], 422);
            }

            if ($request->user()->role === 'rt'
                && ! RtFormatter::sama($request->rt, $request->user()->rt)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ketua RT hanya dapat menginput warga di wilayah RT-nya.',
                ], 403);
            }

            // P1-03: validasi jawaban SEBELUM menulis apa pun.
            $this->validasiJawaban($request->jawaban_mentah);

            $pengajuan = DB::transaction(function () use ($request, $namaLengkap) {
                $nameRt = RtFormatter::formatRt($request->rt);

                $warga = Warga::whereRaw('LOWER(TRIM(nama_lengkap)) = ?', [mb_strtolower($namaLengkap)])
                    ->whereRaw('CAST(rt AS UNSIGNED) = ?', [RtFormatter::intValue($request->rt)])
                    ->first();

                if (! $warga) {
                    $warga = Warga::create([
                        'nama_lengkap' => $namaLengkap,
                        'alamat' => $request->alamat,
                        'rt' => $nameRt,
                        'rw' => '008',
                    ]);
                } else {
                    $warga->update(['alamat' => $request->alamat]);
                }

                return $this->simpanPengajuan(
                    $warga->id_warga,
                    $request->jawaban_mentah,
                    'Warga ini sudah memiliki pengajuan yang sedang diproses!'
                );
            });

            return response()->json([
                'success' => true,
                'message' => 'Data kuesioner warga berhasil disimpan!',
                'data' => $pengajuan,
            ]);

        } catch (JawabanTidakDikenalException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kuesioner ditolak: '.$e->getMessage(),
                'error' => $e->rincian,
            ], 422);
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
                'rt' => ['required', RtFormatter::rule()],
                'jawaban_mentah' => 'required|array',
            ]);

            $user = Auth::user();

            // Warga hanya boleh mengajukan untuk identitasnya sendiri (id_warga).
            $warga = $user->warga;

            if (! $warga) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Anda belum tertaut ke data warga. Hubungi admin untuk menautkannya.',
                ], 409);
            }

            // P1-03: validasi jawaban SEBELUM menulis apa pun.
            $this->validasiJawaban($request->jawaban_mentah);

            $pengajuan = DB::transaction(function () use ($warga, $request) {
                $warga->update([
                    'rt' => RtFormatter::formatRt($request->rt),
                    'alamat' => $request->alamat,
                ]);

                return $this->simpanPengajuan(
                    $warga->id_warga,
                    $request->jawaban_mentah,
                    'Anda sudah memiliki pengajuan yang sedang diproses!'
                );
            });

            return response()->json([
                'success' => true,
                'message' => $pengajuan->wasRecentlyCreated
                    ? 'Pengajuan berhasil dikirim dan siap diverifikasi!'
                    : 'Pengajuan ulang berhasil dikirim setelah penolakan; menunggu verifikasi RT.',
            ]);

        } catch (JawabanTidakDikenalException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kuesioner ditolak: '.$e->getMessage(),
                'error' => $e->rincian,
            ], 422);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}