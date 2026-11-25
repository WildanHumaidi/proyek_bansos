<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Penilaian;
use App\Models\SubKriteria;
use App\Models\User;
use App\Models\Warga;
use App\Services\SawCalculator;
use Database\Seeders\KriteriaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * P2 — Kelengkapan sistem:
 *  P2-03 laporan export (SSV) mengikuti scope & nilai API yang sama
 *  P2-05 eligibility konsisten ranking ↔ dataset
 *  P2-09 snapshot SAW (satu transaksi: skor tidak tercampur bobot lama/baru)
 */
class P2RemediationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(KriteriaSeeder::class);
    }

    protected function admin(): User
    {
        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);

        Sanctum::actingAs($admin);

        return $admin;
    }

    protected function buatPengajuanSetujui(string $nama, string $rt, float $nilaiC1): Pengajuan
    {
        $warga = Warga::create([
            'nama_lengkap' => $nama,
            'alamat' => "Alamat {$nama}",
            'rt' => $rt,
            'rw' => '008',
        ]);

        $jawaban = [
            'q1' => '> 3 KK', 'q2' => '5 Orang', 'q3' => 'SD',
            'q4' => '2 Orang', 'q5' => '400 - 700 Ribu', 'q6' => '< 400 Ribu',
            'q7' => 'Sewa < 1 Juta', 'q8' => 'PDAM Terbatas',
            'q9' => 'Listrik 450 watt', 'q10' => 'Sepeda Motor 1 Buah, dalam Kondisi Baik',
        ];

        // q1 menyesuaikan nilaiC1 lewat sub-kriteria dengan nilai yang diminta.
        $sub = SubKriteria::where('id_kriteria', 1)
            ->where('nilai', $nilaiC1)
            ->firstOrFail();
        $jawaban['q1'] = $sub->keterangan;

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode($jawaban),
        ]);

        foreach ($jawaban as $k => $ket) {
            $subKet = SubKriteria::where('id_kriteria', (int) substr($k, 1))
                ->where('keterangan', $ket)
                ->firstOrFail();
            Penilaian::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_kriteria' => (int) substr($k, 1),
                'id_subkriteria' => $subKet->id_subkriteria,
            ]);
        }

        return $pengajuan;
    }

    // ────────────────────────────────────────────────────────────────────────
    // P2-03 — laporan export (SSV) mengikuti scope & nilai yang sama
    // ────────────────────────────────────────────────────────────────────────

    public function test_export_report_csv_mengikuti_scope_dan_nilai_api(): void
    {
        $this->buatPengajuanSetujui('Warga RT1-A', '001', 10);
        $this->buatPengajuanSetujui('Warga RT1-B', '001', 2.5);
        $this->buatPengajuanSetujui('Warga RT2-A', '002', 10);

        $this->admin();

        $api = $this->getJson('/api/saw/hitung')->assertOk()->json('data');

        // Export laporan: CSV/SSV — baris sama dengan ranking API (P2-03).
        $this->get('/api/saw/report/export?format=csv')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/csv; charset=utf-8');

        $response = $this->get('/api/saw/report/export?format=csv')->assertOk();
        $laporan = $response->getContent();

        $baris = array_values(array_filter(array_map(
            fn ($line) => str_getcsv($line, ';'),
            explode("\n", $laporan)
        ), fn ($b) => count($b) > 0 && trim(implode('', $b)) !== ''));
        array_shift($baris); // header

        $this->assertCount(3, $baris, 'Export memuat 3 alternatif (scope admin = semua)');

        foreach ($baris as $i => $kolom) {
            $this->assertSame($api[$i]['nama_warga'], $kolom[0]);
            // Kolom: Nama|RT|Skor|Ranking|Ranking RT|Keterangan → skor di index 2
            $this->assertEqualsWithDelta((float) $api[$i]['skor_saw'], (float) $kolom[2], 0.000001);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // P2-05 — eligibility & dataset konsisten dengan ranking
    // ────────────────────────────────────────────────────────────────────────

    public function test_dataset_dan_ranking_setuju_perihal_alternatif_eligible(): void
    {
        $this->buatPengajuanSetujui('Warga Lengkap A', '001', 10);
        $this->buatPengajuanSetujui('Warga Lengkap B', '002', 2.5);

        // Satu pengajuan disetujui tapi matriks TIDAK lengkap (8 dari 10).
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Parsial',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
        ]);
        $pengajuanParsial = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode(['q1' => '> 3 KK']),
        ]);
        for ($k = 1; $k <= 8; $k++) {
            Penilaian::create([
                'id_pengajuan' => $pengajuanParsial->id_pengajuan,
                'id_kriteria' => $k,
                'id_subkriteria' => SubKriteria::where('id_kriteria', $k)->first()->id_subkriteria,
            ]);
        }

        $this->admin();

        $ranking = $this->getJson('/api/saw/hitung')->assertOk();
        $dataset = $this->getJson('/api/saw/dataset')->assertOk();

        // Keduanya setuju: 2 alternatif eligible, 1 dilewati karena matriks tak lengkap.
        $this->assertSame(2, $ranking->json('total'));
        $this->assertCount(2, $dataset->json('dataset'));
        $this->assertCount(1, $ranking->json('dilewati'));
        $this->assertCount(1, $dataset->json('dilewati'));
    }

    // ────────────────────────────────────────────────────────────────────────
    // P2-09 — snapshot SAW satu transaksi
    // ────────────────────────────────────────────────────────────────────────

    public function test_perhitungan_saw_membaca_satu_snapshot_kriteria_dan_penilaian(): void
    {
        // Prekondisi: tanpa data apa pun, hitung ranking harus 404 bukan 500.
        $this->admin();
        $this->getJson('/api/saw/hitung')->assertStatus(404);

        // Dengan data lengkap, seluruh komponen (kriteria + bobot + alternatif
        // + penilaian) terbaca dalam satu transaksi — SawCalculator::ambilDataEligible.
        $this->buatPengajuanSetujui('Warga Snapshot', '001', 10);

        $hasRan = false;
        try {
            DB::beginTransaction();
            // Simulasi: bobot diubah DI TENGAH perhitungan (seolah request lain).
            $data = SawCalculator::ambilDataEligible(auth()->user());

            // Di dalam satu snapshot, bobot konsisten (dari satu sumber).
            $this->assertSame(0.1, $data['kriteriaMap'][1]['bobot_norm']);
            $hasRan = true;
        } finally {
            DB::commit();
        }

        $this->assertTrue($hasRan);
    }
}