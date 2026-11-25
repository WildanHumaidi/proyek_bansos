<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Penilaian;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\KriteriaFixture;
use Tests\TestCase;

class AdminRtControllerFixesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        KriteriaFixture::seedKriteria();
    }

    public function test_fix_data_only_accepts_post(): void
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
            'q2' => '5 Orang',
            'q3' => 'SD',
            'q4' => '2 Orang',
            'q5' => '400 - 700 Ribu',
            'q6' => '< 400 Ribu',
            'q7' => 'Sewa < 1 Juta',
            'q8' => 'PDAM Terbatas',
            'q9' => 'Listrik 450 watt',
            'q10' => 'Sepeda Motor 1 Buah, dalam Kondisi Baik',
        ];

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode($jawaban),
        ]);

        Sanctum::actingAs($admin);

        $responsePost = $this->postJson('/api/admin/fix-data', ['mode' => 'apply']);
        $responsePost->assertStatus(200);
        $this->assertEquals(10, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());

        $this->getJson('/api/admin/fix-data')->assertStatus(405);
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
            'jawaban_mentah' => json_encode([
                'q1' => '1 KK', 'q2' => '4 Orang', 'q3' => 'SD',
                'q4' => 'Tidak Ada', 'q5' => '400 - 700 Ribu', 'q6' => '< 400 Ribu',
                'q7' => 'Sewa < 1 Juta', 'q8' => 'Sumur Milik Sendiri',
                'q9' => 'Listrik 450 watt', 'q10' => 'Sepeda Motor 1 Buah, dalam Kondisi Baik',
            ]),
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
