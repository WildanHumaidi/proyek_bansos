<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    /**
     * Memverifikasi hak akses pengguna terhadap pengajuan terkait chat.
     */
    protected function authorizeAccess(Request $request, $id_pengajuan): Pengajuan
    {
        $pengajuan = Pengajuan::with('warga')->findOrFail($id_pengajuan);
        $user = $request->user();

        // Admin dan RW memiliki akses pengawasan global
        if (in_array($user->role, ['admin', 'rw'], true)) {
            return $pengajuan;
        }

        // Warga hanya boleh mengakses chat pengajuannya sendiri
        if ($user->role === 'warga') {
            if (! $pengajuan->warga || $pengajuan->warga->nama_lengkap !== $user->name) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak: Anda tidak memiliki akses ke percakapan ini.',
                ], 403));
            }
        }

        // RT hanya boleh mengakses chat pengajuan warga di RT-nya
        if ($user->role === 'rt') {
            if (! $pengajuan->warga || (int) $pengajuan->warga->rt !== (int) $user->rt) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak: Pengajuan ini berada di luar wilayah RT Anda.',
                ], 403));
            }
        }

        return $pengajuan;
    }

    // Mengambil riwayat pesan
    public function getPesan(Request $request, $id_pengajuan)
    {
        $this->authorizeAccess($request, $id_pengajuan);

        $pesan = DB::table('pesan_chat')
            ->where('id_pengajuan', $id_pengajuan)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['success' => true, 'data' => $pesan]);
    }

    // Mengirim pesan baru
    public function storePesan(Request $request, $id_pengajuan)
    {
        $request->validate([
            'isi_pesan' => 'required|string|max:1000',
        ]);

        $this->authorizeAccess($request, $id_pengajuan);

        $role = $request->user()->role === 'rt' ? 'rt' : 'warga';

        DB::table('pesan_chat')->insert([
            'id_pengajuan' => $id_pengajuan,
            'pengirim_role' => $role,
            'isi_pesan' => trim($request->isi_pesan),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Pesan terkirim']);
    }
}
