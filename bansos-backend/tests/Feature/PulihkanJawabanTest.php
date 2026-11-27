<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Penilaian;
use App\Models\SubKriteria;
use App\Models\Warga;
use Database\Seeders\KriteriaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pengajuan lama (impor sebelum jawaban mentah disimpan) hanya punya matriks
 * penilaian. Perintah `pengajuan:pulihkan-jawaban` merekonstruksi q1–q10 dari
 * label sub-kriteria agar layar Input Kuesioner tidak tampil 0/10.
 */
class PulihkanJawabanTest extends TestCase
{
    use RefreshDatabase;

    private array $arsipSebelum = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(KriteriaSeeder::class);
        $this->arsipSebelum = glob(base_path('../docs/archive/pengajuan_jawaban_null_backup_*.json')) ?: [];
    }

    protected function tearDown(): void
    {
        $baru = array_diff(
            glob(base_path('../docs/archive/pengajuan_jawaban_null_backup_*.json')) ?: [],
            $this->arsipSebelum
        );
        foreach ($baru as $file) {
            @unlink($file);
        }

        parent::tearDown();
    }

    private function buatPengajuan(int $jumlahPenilaian): Pengajuan
    {
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Legacy',
            'alamat' => 'Jl. Legacy',
            'rt' => '001',
            'rw' => '008',
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => null,
        ]);

        foreach (range(1, $jumlahPenilaian) as $kriteria) {
            $sub = SubKriteria::where('id_kriteria', $kriteria)
                ->orderBy('id_subkriteria')
                ->firstOrFail();

            Penilaian::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_kriteria' => $kriteria,
                'id_subkriteria' => $sub->id_subkriteria,
            ]);
        }

        return $pengajuan;
    }

    public function test_jawaban_dipulihkan_dari_matriks_dan_dry_run_tidak_menulis(): void
    {
        $lengkap = $this->buatPengajuan(10);
        $tidakLengkap = $this->buatPengajuan(9);

        $this->artisan('pengajuan:pulihkan-jawaban', ['--dry-run' => true])->assertExitCode(0);
        $this->assertNull($lengkap->fresh()->jawaban_mentah, 'dry-run tidak boleh menulis');

        $this->artisan('pengajuan:pulihkan-jawaban')->assertExitCode(0);

        $jawaban = json_decode($lengkap->fresh()->jawaban_mentah, true);
        $this->assertIsArray($jawaban);
        $this->assertCount(10, $jawaban);

        $subPertama = SubKriteria::where('id_kriteria', 1)->orderBy('id_subkriteria')->firstOrFail();
        $this->assertSame($subPertama->keterangan, $jawaban['q1']);

        $this->assertNull(
            $tidakLengkap->fresh()->jawaban_mentah,
            'pengajuan dengan penilaian tidak lengkap harus dilewati'
        );
    }
}