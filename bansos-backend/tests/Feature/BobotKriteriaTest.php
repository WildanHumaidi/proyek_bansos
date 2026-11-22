<?php

namespace Tests\Feature;

use App\Models\Kriteria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Bobot kriteria wajib berjumlah tepat 100% agar persentase di UI dan laporan
 * ke RW bermakna. Perubahan harus dilakukan serentak lewat endpoint bulk.
 */
class BobotKriteriaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        for ($i = 1; $i <= 10; $i++) {
            Kriteria::create([
                'nama_kriteria' => "Kriteria C{$i}",
                'tipe' => in_array($i, [1, 2, 4], true) ? 'benefit' : 'cost',
                'bobot' => 10,
            ]);
        }

        Sanctum::actingAs(User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]));
    }

    public function test_bulk_update_dengan_total_100_diterima(): void
    {
        $bobot = [];
        for ($i = 1; $i <= 10; $i++) {
            $bobot[$i] = $i === 1 ? 19 : 9;
        }

        $this->putJson('/api/admin/kriteria/bobot', ['bobot' => $bobot])
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertEqualsWithDelta(100.0, (float) Kriteria::sum('bobot'), 0.001);
        $this->assertEqualsWithDelta(19.0, Kriteria::find(1)->bobot, 0.001);
        $this->assertEqualsWithDelta(9.0, Kriteria::find(2)->bobot, 0.001);
    }

    public function test_bulk_update_dengan_total_bukan_100_ditolak(): void
    {
        $bobot = array_fill(1, 10, 10);
        $bobot[1] = 15; // total menjadi 105

        $response = $this->putJson('/api/admin/kriteria/bobot', ['bobot' => $bobot])
            ->assertStatus(422)
            ->assertJson(['success' => false]);

        $this->assertEqualsWithDelta(105.0, (float) $response->json('total_bobot'), 0.001);

        // Tidak ada baris yang tersimpan sebagian.
        $this->assertEqualsWithDelta(10.0, Kriteria::find(1)->bobot, 0.001);
        $this->assertEqualsWithDelta(100.0, (float) Kriteria::sum('bobot'), 0.001);
    }

    public function test_bulk_update_wajib_menyertakan_semua_kriteria(): void
    {
        $this->putJson('/api/admin/kriteria/bobot', ['bobot' => [1 => 100]])
            ->assertStatus(422)
            ->assertJson(['success' => false]);

        $this->assertEqualsWithDelta(100.0, (float) Kriteria::sum('bobot'), 0.001);
    }

    public function test_update_satu_kriteria_tidak_boleh_merusak_total_100(): void
    {
        $this->putJson('/api/kriteria/1', ['tipe' => 'benefit', 'bobot' => 20])
            ->assertStatus(422)
            ->assertJson(['success' => false]);

        $this->assertEqualsWithDelta(10.0, Kriteria::find(1)->bobot, 0.001);
        $this->assertEqualsWithDelta(100.0, (float) Kriteria::sum('bobot'), 0.001);
    }

    public function test_update_satu_kriteria_dengan_total_tetap_100_diterima(): void
    {
        // Nilai sama dengan sebelumnya → total tetap 100, jadi boleh disimpan.
        $this->putJson('/api/kriteria/1', ['tipe' => 'benefit', 'bobot' => 10])
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertEqualsWithDelta(100.0, (float) Kriteria::sum('bobot'), 0.001);
    }
}
