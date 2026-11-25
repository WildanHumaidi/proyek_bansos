<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PesanChat;
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

        // Warga hanya boleh mengakses chat pengajuannya sendiri.
        // Identitas dicek lewat id_warga, BUKAN nama: nama bisa duplikat, sehingga
        // mencocokkan nama memungkinkan akun lain membaca percakapan orang lain.
        if ($user->role === 'warga') {
            $idWargaPemilik = $pengajuan->warga?->id_warga;

            if ($idWargaPemilik === null || (int) $user->id_warga !== (int) $idWargaPemilik) {
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

        $role = $request->user()->role;

        // Peran disimpan apa adanya agar jejak audit benar: sebelumnya admin dan RW
        // ikut tercatat sebagai 'warga'.
        if (! in_array($role, ['warga', 'rt', 'rw', 'admin'], true)) {
            $role = 'warga';
        }

        DB::table('pesan_chat')->insert([
            'id_pengajuan' => $id_pengajuan,
            'pengirim_role' => $role,
            'isi_pesan' => trim($request->isi_pesan),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Pesan terkirim']);
    }

    /**
     * GET /api/chat/{id}/belum-dibaca
     *
     * Jumlah pesan dari lawan bicara yang belum dibaca oleh pengguna ini.
     *
     * Status baca disimpan di `pesan_chat.dibaca_pada` (migrasi
     * 2026_11_25_000006). Sebelumnya tidak ada status apa pun, sehingga UI harus
     * menghitung "ada pesan baru" dari panjang array — cara yang salah karena
     * ikut menghitung pesan sendiri dan tidak pernah kembali ke nol.
     */
    public function belumDibaca(Request $request, $id_pengajuan)
    {
        $this->authorizeAccess($request, $id_pengajuan);

        $role = $request->user()->role;

        $jumlah = PesanChat::where('id_pengajuan', $id_pengajuan)
            ->whereNull('dibaca_pada')
            ->where('pengirim_role', '!=', $role)
            ->count();

        return response()->json(['success' => true, 'jumlah' => $jumlah]);
    }

    /**
     * PUT /api/chat/{id}/baca
     *
     * Tandai seluruh pesan dari lawan bicara sebagai sudah dibaca.
     */
    public function tandaiDibaca(Request $request, $id_pengajuan)
    {
        $this->authorizeAccess($request, $id_pengajuan);

        $role = $request->user()->role;

        $terpengaruh = PesanChat::where('id_pengajuan', $id_pengajuan)
            ->whereNull('dibaca_pada')
            ->where('pengirim_role', '!=', $role)
            ->update(['dibaca_pada' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Pesan ditandai sudah dibaca.',
            'jumlah' => $terpengaruh,
        ]);
    }
}
