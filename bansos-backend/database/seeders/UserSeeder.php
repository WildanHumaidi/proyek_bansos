<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Warga;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {

        User::create([
            'name' => 'Administrator Sistem',
            'username' => 'admin',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Bapak Ketua RW 08',
            'username' => 'rw08',
            'password' => Hash::make('rw123'),
            'role' => 'rw',
        ]);

        $rts = ['001', '002', '003'];
        foreach ($rts as $rt) {
            User::create([
                'name' => 'Ketua RT '.$rt,
                'username' => 'rt'.$rt,
                'password' => Hash::make('rt123'),
                'role' => 'rt',
                'rt' => $rt,
            ]);
        }

        // Akun demo warga wajib punya identitas warga sendiri dan tertaut lewat
        // id_warga. Membuat User tanpa id_warga menghasilkan akun yang tidak bisa
        // mengajukan (409), dan mencocokkan lewat nama akan menimpa warga lain.
        $wargaDemo = Warga::create([
            'nama_lengkap' => 'Budi Santoso',
            'alamat' => 'Jl. Merpati No. 12',
            'rt' => '001',
            'rw' => '008',
            'password' => Hash::make('warga123'),
        ]);

        User::create([
            'name' => 'Budi Santoso',
            'username' => 'warga01',
            'password' => Hash::make('warga123'),
            'role' => 'warga',
            'rt' => '001',
            'alamat' => 'Jl. Merpati No. 12',
            'id_warga' => $wargaDemo->id_warga,
        ]);
    }
}
