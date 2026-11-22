<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Warga;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Seeder demo harus menghasilkan akun yang langsung bisa dipakai. Akun warga tanpa
 * `id_warga` akan ditolak (409) saat mengajukan, dan pencocokan lewat nama berisiko
 * menimpa warga lain yang bernama sama.
 */
class UserSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_akun_demo_warga_tertaut_ke_identitas_warga(): void
    {
        $this->seed(UserSeeder::class);

        $wargaUser = User::where('username', 'warga01')->firstOrFail();

        $this->assertNotNull($wargaUser->id_warga);
        $this->assertNotNull($wargaUser->warga);
        $this->assertSame('Budi Santoso', $wargaUser->warga->nama_lengkap);
        $this->assertSame('001', $wargaUser->warga->rt);
    }

    public function test_seeder_membuat_enam_akun_dengan_peran_lengkap(): void
    {
        $this->seed(UserSeeder::class);

        // 1 admin + 1 RW + 3 RT + 1 warga demo
        $this->assertSame(6, User::count());
        $this->assertSame(1, User::where('role', 'admin')->count());
        $this->assertSame(1, User::where('role', 'rw')->count());
        $this->assertSame(3, User::where('role', 'rt')->count());
        $this->assertSame(1, User::where('role', 'warga')->count());

        // Hanya akun warga yang punya identitas warga.
        $this->assertSame(1, User::whereNotNull('id_warga')->count());
        $this->assertSame(1, Warga::count());
    }
}
