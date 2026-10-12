<?php

namespace Tests\Feature;

use App\Models\Kriteria;
use Database\Seeders\KriteriaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KriteriaSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_kriteria_seeder_sets_c5_as_cost(): void
    {
        $this->seed(KriteriaSeeder::class);

        $this->assertEquals(10, Kriteria::count());

        $c5 = Kriteria::where('nama_kriteria', 'LIKE', '%Pengeluaran%')->first();
        $this->assertNotNull($c5);
        $this->assertEquals('cost', $c5->tipe);
    }
}
