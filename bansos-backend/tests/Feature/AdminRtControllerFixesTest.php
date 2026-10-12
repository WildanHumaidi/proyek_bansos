<?php

namespace Tests\Feature;

use App\Models\Kriteria;
use App\Models\Pengajuan;
use App\Models\Penilaian;
use App\Models\SubKriteria;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminRtControllerFixesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        for ($i = 1; $i <= 10; $i++) {
            $k = Kriteria::create([
                'nama_kriteria' => "Kriteria $i",
                'tipe' => ($i <= 2 || $i == 4) ? 'benefit' : 'cost',
                'bobot' => 10,
            ]);

            for ($j = 1; $j <= 4; $j++) {
                SubKriteria::create([
                    'id_kriteria' => $k->id_kriteria,
                    'keterangan' => "Sub $i - $j",
                    'nilai' => [10, 7.5, 5, 2.5][$j - 1],
                ]);
            }
        }
    }

    public function test_fix_data_works_via_post_and_get(): void
    {
        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $warga = Warga::create([
            'nama_lengkap' => 'Warga Test',
            'alamat' => 'Alamat Test',
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $jawaban = [
            'q1' => '> 3 KK',
            'q2' => '5 ORANG',
            'q3' => 'SEKOLAH DASAR (SD)',
            'q4' => '2 ORANG',
            'q5' => 'Rp. 1.500.000 - Rp. 3.000.000',
            'q6' => '< Rp. 1.500.000',
            'q7' => 'SEWA / KONTRAK',
            'q8' => 'PDAM',
            'q9' => 'LISTRIK 450 WATT',
            'q10' => 'SEPEDA MOTOR 1 UNIT KONDISI BAIK',
        ];

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode($jawaban),
        ]);

        Sanctum::actingAs($admin);

        // Test POST /api/admin/fix-data
        $responsePost = $this->postJson('/api/admin/fix-data');
        $responsePost->assertStatus(200);
        $this->assertEquals(10, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());

        // Test GET /api/admin/fix-data
        $responseGet = $this->getJson('/api/admin/fix-data');
        $responseGet->assertStatus(200);
        $this->assertEquals(10, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());
    }

    public function test_update_kuesioner_updates_cleanly(): void
    {
        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $warga = Warga::create([
            'nama_lengkap' => 'Warga Test',
            'alamat' => 'Alamat Test',
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/admin/pengajuan/{$pengajuan->id_pengajuan}/kuesioner", [
            'jawaban_mentah' => ['q1' => '3 KK'],
            'jawaban' => [1 => 2, 2 => 6],
        ]);

        $response->assertStatus(200);
        $this->assertEquals(2, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());
    }
}
