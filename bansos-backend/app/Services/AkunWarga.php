<?php

namespace App\Services;

use App\Models\User;
use App\Models\Warga;
use Illuminate\Support\Str;

/**
 * Pembuat akun login warga — satu aturan untuk import CSV dan backfill.
 *
 * Konvensi yang dipakai (permintaan operator):
 *  - username = nama depan, huruf kecil, tanpa tanda baca;
 *  - password awal = nama depan + "123";
 *  - bila username sudah dipakai (nama depan kembar / akun lain), diberi
 *    satu huruf di belakangnya: `budi`, `budia`, `budib`, …
 *
 * Password awal ini SEDERHANA dan hanya untuk penyerahan pertama. Akun lama
 * tidak pernah diubah; password tidak pernah direset diam-diam.
 */
class AkunWarga
{
    /**
     * Pastikan satu warga punya akun login.
     *
     * @return array{username:?string, password_awal:?string, akun_baru:bool}
     */
    public function pastikan(Warga $warga): array
    {
        $user = User::where('id_warga', $warga->id_warga)->first();

        if ($user) {
            return [
                'username' => $user->username,
                'password_awal' => null,
                'akun_baru' => false,
            ];
        }

        $dasar = $this->namaDepan($warga->nama_lengkap);
        $username = $this->usernameUnik($dasar);
        $sandi = $dasar.'123';

        User::create([
            'name' => $warga->nama_lengkap,
            'username' => $username,
            'password' => $sandi, // cast 'hashed' di model User
            'role' => 'warga',
            'rt' => $warga->rt,
            'alamat' => $warga->alamat ?? '',
            'id_warga' => $warga->id_warga,
        ]);

        return [
            'username' => $username,
            'password_awal' => $sandi,
            'akun_baru' => true,
        ];
    }

    /** Nama depan yang aman dipakai sebagai username. */
    public function namaDepan(string $nama): string
    {
        $token = preg_split('/\s+/u', trim($nama))[0] ?? '';
        $slug = Str::slug($token, '');

        if ($slug === '') {
            $slug = 'warga';
        }

        // users.username varchar(255): sisakan ruang untuk sufiks huruf.
        return substr($slug, 0, 80);
    }

    /**
     * Username unik dari nama depan. $tambahan dipakai pratinjau dry-run agar
     * sufiks yang sama bisa disimulasikan sebelum ada baris yang ditulis.
     *
     * @param  array<int,string>  $tambahan
     */
    public function usernameUnik(string $dasar, array $tambahan = []): string
    {
        $kandidat = $dasar;
        $urut = 0;

        // Kembar pertama tetap nama depan; berikutnya budia, budib, ….
        // Lewat z (lebih dari 26 kembar) baru pakai angka.
        while (User::where('username', $kandidat)->exists()
            || in_array($kandidat, $tambahan, true)) {
            $akhiran = $urut < 26 ? chr(97 + $urut) : (string) ($urut + 1);
            $kandidat = $dasar.$akhiran;
            $urut++;
        }

        return $kandidat;
    }
}