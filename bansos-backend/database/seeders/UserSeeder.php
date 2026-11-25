<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Warga;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Akun demo untuk pengembangan lokal.
 *
 * P3-02: idempoten — jalankan ulang tidak menggandakan akun.
 * P1-07: seeder ini TIDAK boleh dijalankan di production. Password demo &
 * username terkenal hanya untuk development/testing; production wajib
 * membuat akun dengan password kuat secara manual.
 */
class UserSeeder extends Seeder
{
    public function run()
    {
        $buatUser = function (array $data) {
            return User::firstOrCreate(
                ['username' => $data['username']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make($data['password']),
                    'role' => $data['role'],
                    'rt' => $data['rt'] ?? null,
                    'alamat' => $data['alamat'] ?? '',
                    'id_warga' => $data['id_warga'] ?? null,
                ]
            );
        };

        $buatUser([
            'name' => 'Administrator Sistem',
            'username' => 'admin',
            'password' => 'admin123',
            'role' => 'admin',
        ]);

        $buatUser([
            'name' => 'Bapak Ketua RW 08',
            'username' => 'rw08',
            'password' => 'rw123',
            'role' => 'rw',
        ]);

        foreach (['001', '002', '003'] as $rt) {
            $buatUser([
                'name' => 'Ketua RT '.$rt,
                'username' => 'rt'.$rt,
                'password' => 'rt123',
                'role' => 'rt',
                'rt' => $rt,
            ]);
        }

        // Akun demo warga wajib punya identitas warga sendiri dan tertaut lewat
        // id_warga. Membuat User tanpa id_warga menghasilkan akun yang tidak bisa
        // mengajukan (409).
        $wargaDemo = Warga::firstOrCreate(
            ['nama_lengkap' => 'Budi Santoso', 'rt' => '001'],
            [
                'alamat' => 'Jl. Merpati No. 12',
                'rw' => '008',
            ]
        );

        $buatUser([
            'name' => 'Budi Santoso',
            'username' => 'warga01',
            'password' => 'warga123',
            'role' => 'warga',
            'rt' => '001',
            'alamat' => 'Jl. Merpati No. 12',
            'id_warga' => $wargaDemo->id_warga,
        ]);
    }
}