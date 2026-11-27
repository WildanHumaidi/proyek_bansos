<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengaduan;
use App\Models\User;
use App\Models\Warga;
use App\Services\RtFormatter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * P2-01 — Sub-sistem pengaduan (keluhan) warga.
 *
 * Status: pending → diterima / ditolak. Warga membuat pengaduan, RT wilayahnya
 * menangani; admin dapat mengambil alih (mis. RT tidak tersedia). Warga TIDAK
 * dapat membaca pengaduan milik warga lain (ownership id_warga, bukan nama).
 */
class PengaduanController extends Controller
{
    /** Status yang valid untuk transisi via API. */
    protected const STATUS_VALID = ['pending', 'diterima', 'ditolak'];

    // ── WARGA ───────────────────────────────────────────────────────────────

    /**
     * POST /api/pengaduan — warga membuat pengaduan.
     */
    public function store(Request $request)
    {
        $request->validate([
            'kategori' => 'sometimes|string|max:50',
            'isi' => 'required|string|max:5000',
            'id_pengajuan' => 'sometimes|integer|exists:pengajuan,id_pengajuan',
        ]);

        $user = $request->user();

        if ($user->role !== 'warga' || ! $user->id_warga) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya akun warga yang tertaut identitas yang dapat membuat pengaduan.',
            ], 403);
        }

        $pengaduan = DB::transaction(function () use ($request, $user) {
            $p = Pengaduan::create([
                'id_warga' => $user->id_warga,
                'id_pengajuan' => $request->id_pengajuan ?? null,
                'kategori' => $request->kategori ?? 'umum',
                'isi' => trim($request->isi),
                'status' => 'pending',
            ]);

            // Riwayat awal: pending.
            \App\Models\PengaduanRiwayat::create([
                'id_pengaduan' => $p->id_pengaduan,
                'status_lama' => null,
                'status_baru' => 'pending',
                'diubah_oleh' => $user->username,
                'catatan' => 'Pengaduan dibuat oleh warga',
            ]);

            return $p;
        });

        return response()->json([
            'success' => true,
            'message' => 'Pengaduan terkirim dan menunggu diproses.',
            'data' => $pengaduan->load('riwayat'),
        ], 201);
    }

    /**
     * GET /api/pengaduan — warga melihat pengaduan MILIKNYA + riwayat.
     * RT melihat pengaduan wilayahnya; admin/RW melihat semua.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Pengaduan::with(['warga:id_warga,nama_lengkap,rt', 'riwayat'])
            ->orderBy('created_at', 'desc');

        if ($user->role === 'warga') {
            $query->where('id_warga', $user->id_warga);
        } elseif ($user->role === 'rt') {
            $rt = RtFormatter::intValue($user->rt);
            $query->whereHas('warga', function ($q) use ($rt) {
                $q->whereRaw('CAST(rt AS UNSIGNED) = ?', [$rt]);
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    // ── RT / ADMIN ─────────────────────────────────────────────────────────

    /**
     * PUT /api/pengaduan/{id} — RT/Admin menindaklanjuti: mengubah status dan
     * (opsional) memberi tanggapan. RT hanya untuk wilayahnya; admin bebas.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:'.implode(',', self::STATUS_VALID),
            'tanggapan' => 'sometimes|string|max:1000',
        ]);

        $pengaduan = Pengaduan::with('warga')->findOrFail($id);
        $user = $request->user();

        // Hanya petugas yang boleh menindaklanjuti pengaduan. Tanpa gerbang ini
        // akun warga bisa mengubah status/tanggapan pengaduan siapa pun.
        if (! in_array($user->role, ['rt', 'rw', 'admin'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya petugas RT/RW/Admin yang dapat menindaklanjuti pengaduan.',
            ], 403);
        }

        if ($user->role === 'rt') {
            $rt = RtFormatter::intValue($user->rt);
            if (! $pengaduan->warga || RtFormatter::intValue($pengaduan->warga->rt) !== $rt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pengaduan ini berada di luar wilayah RT Anda.',
                ], 403);
            }
        }

        $statusLama = $pengaduan->status;

        $pengaduan = DB::transaction(function () use ($pengaduan, $request, $user, $statusLama) {
            $pengaduan->update([
                'status' => $request->status,
                'tanggapan' => $request->tanggapan ?? $pengaduan->tanggapan,
                'ditangani_oleh' => $user->username,
            ]);

            \App\Models\PengaduanRiwayat::create([
                'id_pengaduan' => $pengaduan->id_pengaduan,
                'status_lama' => $statusLama,
                'status_baru' => $request->status,
                'diubah_oleh' => $user->username,
                'catatan' => $request->catatan ?? null,
            ]);

            return $pengaduan;
        });

        return response()->json([
            'success' => true,
            'message' => 'Status pengaduan diperbarui.',
            'data' => $pengaduan->fresh('riwayat'),
        ]);
    }
}