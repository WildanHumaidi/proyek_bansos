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

class PengajuanApprovalPenilaianTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed 10 criteria and 4 sub-criteria each
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

    public function test_approving_pengajuan_automatically_generates_penilaian_records(): void
    {
        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('password'),
            'role' => 'rt',
            'rt' => '001',
        ]);

        $warga = Warga::create([
            'nama_lengkap' => 'Warga A',
            'alamat' => 'Alamat A',
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
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode($jawaban),
        ]);

        // Prior to approval, penilaian must be 0
        $this->assertEquals(0, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());

        Sanctum::actingAs($rt);

        // RT approves the application
        $response = $this->putJson("/api/admin/pengajuan/{$pengajuan->id_pengajuan}/status", [
            'status' => 'disetujui',
        ]);

        $response->assertStatus(200);

        // After approval, 10 penilaian records must be present
        $this->assertEquals(10, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());
        $this->assertEquals('disetujui', $pengajuan->fresh()->status);

        // If RT rejects the application, penilaian records must be deleted
        $rejectResponse = $this->putJson("/api/admin/pengajuan/{$pengajuan->id_pengajuan}/status", [
            'status' => 'ditolak',
        ]);
        $rejectResponse->assertStatus(200);
        $this->assertEquals(0, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());
        $this->assertEquals('ditolak', $pengajuan->fresh()->status);
    }

    public function test_invalid_status_is_rejected_by_validation(): void
    {
        $admin = User::create([
            'name' => 'Admin System',
            'username' => 'admin',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson('/api/admin/pengajuan/1/status', [
            'status' => 'arbitrary_status',
        ]);

        $response->assertStatus(422);
    }
}
