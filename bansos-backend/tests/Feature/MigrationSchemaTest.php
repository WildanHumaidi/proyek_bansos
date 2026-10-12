<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MigrationSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_migrations_create_expected_schema_with_warga_and_jawaban_mentah(): void
    {
        // 1. Verify User model supports role 'warga' and 'alamat'
        $user = User::create([
            'name' => 'Budi Santoso',
            'username' => 'budis',
            'password' => bcrypt('password123'),
            'role' => 'warga',
            'rt' => '001',
            'alamat' => 'Jl. Meruyung Raya No. 10',
        ]);

        $this->assertDatabaseHas('users', [
            'username' => 'budis',
            'role' => 'warga',
            'alamat' => 'Jl. Meruyung Raya No. 10',
        ]);

        // 2. Verify Warga creation
        $warga = Warga::create([
            'nama_lengkap' => 'Budi Santoso',
            'alamat' => 'Jl. Meruyung Raya No. 10',
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $this->assertDatabaseHas('warga', [
            'nama_lengkap' => 'Budi Santoso',
        ]);

        // 3. Verify Pengajuan creation with status 'menunggu' and 'jawaban_mentah'
        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode(['q1' => '1 KK', 'q2' => '4 ORANG']),
        ]);

        $this->assertDatabaseHas('pengajuan', [
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'status' => 'menunggu',
        ]);
        $this->assertNotNull($pengajuan->fresh()->jawaban_mentah);
    }
}
