<?php

namespace Tests\Feature;

use App\Models\Kriteria;
use App\Models\Pengajuan;
use App\Models\Penilaian;
use App\Models\SubKriteria;
use App\Models\User;
use App\Models\Warga;
use Database\Seeders\KriteriaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Mengunci kesesuaian implementasi dengan acuan jurnal:
 * "Web-Based Decision Support System for Recommending Social Assistance
 *  Recipients using the SAW Method" (Vol. 6 No. 1, Oct 2026), Tabel 1-3.
 *
 * Konvensi skala (jurnal 2.3): setiap jawaban bernilai 2.5 / 5 / 7.5 / 10.
 * C1, C2, C4 = benefit (nilai besar = prioritas). C3, C5-C10 = cost
 * (nilai KECIL = prioritas), sehingga rumah sejahtera bernilai tinggi.
 */
class SubKriteriaArahNilaiTest extends TestCase
{
    use RefreshDatabase;

    protected function subKriteria(int $idKriteria, string $keterangan): SubKriteria
    {
        return SubKriteria::where('id_kriteria', $idKriteria)
            ->where('keterangan', $keterangan)
            ->firstOrFail();
    }

    public function test_seeder_memakai_skala_jurnal_untuk_kriteria_cost(): void
    {
        $this->seed(KriteriaSeeder::class);

        // C3 pendidikan: SMA/SMK/PT = 10 (paling sejahtera), tidak sekolah = 2.5
        $this->assertEquals(2.5, $this->subKriteria(3, 'Tidak Sekolah / Tidak Tamat SD')->nilai);
        $this->assertEquals(5.0, $this->subKriteria(3, 'SD')->nilai);
        $this->assertEquals(7.5, $this->subKriteria(3, 'SMP')->nilai);
        $this->assertEquals(10.0, $this->subKriteria(3, 'SMA / SMK / PT')->nilai);

        // C5 pengeluaran & C6 penghasilan
        $this->assertEquals(2.5, $this->subKriteria(5, '< 400 Ribu')->nilai);
        $this->assertEquals(10.0, $this->subKriteria(5, '> 1 Juta')->nilai);
        $this->assertEquals(2.5, $this->subKriteria(6, '< 400 Ribu')->nilai);
        $this->assertEquals(10.0, $this->subKriteria(6, '> 1 Juta')->nilai);

        // C7 status rumah
        $this->assertEquals(2.5, $this->subKriteria(7, 'Magersari / Pakai Gratis')->nilai);
        $this->assertEquals(10.0, $this->subKriteria(7, 'Milik Sendiri / Sewa')->nilai);

        // C8 air bersih
        $this->assertEquals(2.5, $this->subKriteria(8, 'Sumur Milik Tetangga')->nilai);
        $this->assertEquals(10.0, $this->subKriteria(8, 'PDAM Bebas / Air Kemasan')->nilai);

        // C9 penerangan
        $this->assertEquals(2.5, $this->subKriteria(9, 'Listrik Numpang')->nilai);
        $this->assertEquals(10.0, $this->subKriteria(9, 'Listrik > 900 watt')->nilai);

        // C10 transportasi
        $this->assertEquals(
            2.5,
            $this->subKriteria(10, 'Jalan Kaki / Sepeda / Motor Seadanya')->nilai
        );
        $this->assertEquals(10.0, $this->subKriteria(10, 'Mobil')->nilai);
    }

    public function test_seeder_memakai_skala_jurnal_untuk_kriteria_benefit(): void
    {
        $this->seed(KriteriaSeeder::class);

        $this->assertEquals(10.0, $this->subKriteria(1, '> 3 KK')->nilai);
        $this->assertEquals(2.5, $this->subKriteria(1, '1 KK')->nilai);
        $this->assertEquals(10.0, $this->subKriteria(2, '> 6 Orang')->nilai);
        $this->assertEquals(2.5, $this->subKriteria(2, '1 - 3 Orang')->nilai);
        $this->assertEquals(10.0, $this->subKriteria(4, '> 3 Orang')->nilai);
        $this->assertEquals(2.5, $this->subKriteria(4, 'Tidak Ada')->nilai);
    }

    public function test_tipe_dan_bobot_kriteria_sesuai_tabel_1_jurnal(): void
    {
        $this->seed(KriteriaSeeder::class);

        foreach ([1, 2, 4] as $id) {
            $this->assertEquals('benefit', Kriteria::find($id)->tipe, "C{$id} harus benefit");
        }
        foreach ([3, 5, 6, 7, 8, 9, 10] as $id) {
            $this->assertEquals('cost', Kriteria::find($id)->tipe, "C{$id} harus cost");
        }
        $this->assertEqualsWithDelta(100.0, (float) Kriteria::sum('bobot'), 0.001);
    }

    /**
     * Reproduksi Tabel 2 & 3 jurnal: A1 = 0.892 (rank 1), A3 = 0.725 (rank 2),
     * A2 = 0.683 (rank 3).
     */
    public function test_worked_example_jurnal_tabel_2_dan_3_tereproduksi(): void
    {
        $this->seed(KriteriaSeeder::class);

        $alternatif = [
            'A1' => [2.5, 7.5, 2.5, 5.0, 2.5, 2.5, 2.5, 5.0, 2.5, 2.5],
            'A2' => [5.0, 10.0, 7.5, 7.5, 5.0, 5.0, 10.0, 5.0, 10.0, 2.5],
            'A3' => [5.0, 7.5, 7.5, 2.5, 2.5, 2.5, 5.0, 5.0, 7.5, 2.5],
        ];

        $skorJurnal = ['A1' => 0.892, 'A2' => 0.683, 'A3' => 0.725];

        foreach ($alternatif as $nama => $nilaiPerKriteria) {
            $warga = Warga::create([
                'nama_lengkap' => $nama,
                'alamat' => "Alamat {$nama}",
                'rt' => '001',
                'rw' => '008',
                'password' => bcrypt('secret'),
            ]);

            $pengajuan = Pengajuan::create([
                'id_warga' => $warga->id_warga,
                'status' => 'disetujui',
                'jawaban_mentah' => json_encode(['q1' => '-']),
            ]);

            foreach ($nilaiPerKriteria as $index => $nilai) {
                $sub = SubKriteria::where('id_kriteria', $index + 1)
                    ->where('nilai', $nilai)
                    ->firstOrFail();

                Penilaian::create([
                    'id_pengajuan' => $pengajuan->id_pengajuan,
                    'id_kriteria' => $index + 1,
                    'id_subkriteria' => $sub->id_subkriteria,
                ]);
            }
        }

        Sanctum::actingAs(User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]));

        $data = collect($this->getJson('/api/saw/hitung')->assertOk()->json('data'));

        foreach ($data as $row) {
            $this->assertEqualsWithDelta(
                $skorJurnal[$row['nama_warga']],
                $row['skor_saw'],
                0.001,
                "Skor {$row['nama_warga']} harus sama dengan Tabel 3 jurnal"
            );
        }

        $this->assertSame(['A1', 'A3', 'A2'], $data->pluck('nama_warga')->all());
        $this->assertSame([1, 2, 3], $data->pluck('ranking')->all());
    }

    /**
     * Invarian skor maksimum: V = 1.0 hanya tercapai bila SELURUH kriteria berada
     * di kondisi paling membutuhkan — benefit = 10, cost = 2.5.
     *
     * [10, 10, 2.5, 10, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5] → V = 1.0
     */
    public function test_skor_sempurna_hanya_untuk_kondisi_paling_membutuhkan(): void
    {
        $this->seed(KriteriaSeeder::class);

        $buat = function (string $nama, array $nilaiPerKriteria) {
            $warga = Warga::create([
                'nama_lengkap' => $nama,
                'alamat' => "Alamat {$nama}",
                'rt' => '001',
                'rw' => '008',
                'password' => bcrypt('secret'),
            ]);

            $pengajuan = Pengajuan::create([
                'id_warga' => $warga->id_warga,
                'status' => 'disetujui',
                'jawaban_mentah' => json_encode(['q1' => '-']),
            ]);

            foreach ($nilaiPerKriteria as $index => $nilai) {
                $sub = SubKriteria::where('id_kriteria', $index + 1)
                    ->where('nilai', $nilai)
                    ->firstOrFail();

                Penilaian::create([
                    'id_pengajuan' => $pengajuan->id_pengajuan,
                    'id_kriteria' => $index + 1,
                    'id_subkriteria' => $sub->id_subkriteria,
                ]);
            }

            return $pengajuan;
        };

        // benefit (C1,C2,C4) = 10 ; cost (C3,C5-C10) = 2.5
        $sempurna = $buat('Warga Paling Butuh', [10, 10, 2.5, 10, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5]);

        // Kebalikannya: benefit = 2.5, cost = 10 → kondisi paling sejahtera.
        $terbalik = $buat('Warga Paling Sejahtera', [2.5, 2.5, 10, 2.5, 10, 10, 10, 10, 10, 10]);

        // Satu kriteria saja meleset dari kondisi ideal → skor tidak boleh 1.0.
        $hampir = $buat('Warga Hampir Sempurna', [10, 10, 2.5, 10, 2.5, 2.5, 2.5, 2.5, 2.5, 5.0]);

        Sanctum::actingAs(User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]));

        $data = collect($this->getJson('/api/saw/hitung')->assertOk()->json('data'))
            ->keyBy('id_pengajuan');

        $this->assertEqualsWithDelta(1.0, $data[$sempurna->id_pengajuan]['skor_saw'], 0.000001);
        $this->assertSame(1, $data[$sempurna->id_pengajuan]['ranking']);

        // Baris dengan seluruh nilai terbaik justru mendapat skor terendah:
        // benefit 2.5/10 = 0.25 (3 kriteria) + cost 2.5/10 = 0.25 (7 kriteria) = 0.25
        $this->assertEqualsWithDelta(0.25, $data[$terbalik->id_pengajuan]['skor_saw'], 0.000001);
        $this->assertSame(3, $data[$terbalik->id_pengajuan]['ranking']);

        // C10 = 5 (bukan 2.5) → satu kriteria meleset, V = 1 - 0.1 + 0.1*(2.5/5) = 0.95
        $this->assertEqualsWithDelta(0.95, $data[$hampir->id_pengajuan]['skor_saw'], 0.000001);
        $this->assertSame(2, $data[$hampir->id_pengajuan]['ranking']);
    }
}
