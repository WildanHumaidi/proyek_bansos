<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\User;
use App\Models\Warga;
use App\Services\JawabanMapper;
use App\Services\PenilaianAssembler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\KriteriaFixture;
use Tests\TestCase;

/**
 * Peringkat di dashboard RT harus memakai skala GLOBAL RW.
 *
 * Kenapa ada: dengan normalisasi lingkup RT sendiri, warga dengan skor 0.90
 * bisa tampil sebagai peringkat 1 karena di RT itu ia yang tertinggi — padahal
 * di seluruh RW ada warga RT lain dengan 0.95, sehingga di dashboard RW orang
 * yang sama tampil peringkat 3. Dua layar memberi angka berbeda untuk orang
 * yang sama, dan Ketua RT mengambil keputusan dari angka yang terlalu optimis.
 *
 * Aturan yang dijaga:
 *  - `skala=rw` menghitung max/min atas SELURUH RW, dan nomor peringkat sama
 *    persis dengan yang dilihat Ketua RW.
 *  - Daftar yang dikembalikan tetap hanya wilayah RT peminta: tidak ada nama,
 *    alamat, atau id_pengajuan warga RT lain.
 *  - Tanpa `skala=rw`, perilaku lama (lingkup RT, peringkat mulai 1) tetap
 *    seperti semula supaya kontrak API lama tidak pecah.
 */
class RankingSkalaRwTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        KriteriaFixture::seedKriteria();
    }

    /** Warga + pengajuan disetujui dengan matriks penilaian lengkap. */
    private function buatAlternatif(string $nama, string $rt, array $jawaban): Pengajuan
    {
        $warga = Warga::create([
            'nama_lengkap' => $nama,
            'alamat' => "Jl. {$nama}",
            'rt' => $rt,
            'rw' => '008',
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode($jawaban),
        ]);

        // Penilaian dibentuk lewat jalur produksi (bukan insert manual) supaya
        // test juga menjaga mapper tetap tersambung.
        PenilaianAssembler::bangun($pengajuan->id_pengajuan, $jawaban);

        return $pengajuan;
    }

    /** Jawaban paling butuh (skor tinggi) atau paling sejahtera (skor rendah). */
    private function jawaban(bool $palingButuh): array
    {
        $opsi = KriteriaFixture::OPSI;

        return collect(range(1, 10))
            ->mapWithKeys(fn ($k) => ["q{$k}" => $palingButuh ? $opsi[$k][0] : $opsi[$k][3]])
            ->all();
    }

    private function aktor(string $username, string $role, ?string $rt = null): User
    {
        return User::create([
            'name' => $username,
            'username' => $username,
            'password' => bcrypt('rahasia123'),
            'role' => $role,
            'rt' => $rt,
        ]);
    }

    public function test_peringkat_rt_sama_persis_dengan_peringkat_global_rw(): void
    {
        // RT 001: dua warga, kondisi menengah (bukan yang terbaik).
        $rt1a = $this->buatAlternatif('RT01 Menengah', '001', $this->jawaban(false));
        $rt1b = $this->buatAlternatif('RT01 Paling Kurang', '001', $this->jawaban(false));

        // RT 003: warga paling membutuhkan — skor tertinggi seluruh RW.
        // Sengaja dibuat jelas lebih tinggi supaya peringkat 1 miliknya pasti,
        // bukan bergantung pada tie-break id_pengajuan.
        $rt3 = $this->buatAlternatif('RT03 Terbaik', '003', $this->jawaban(true));

        // RT 001 diberi satu warga menengah-tinggi agar ada variasi internal.
        $rt1c = $this->buatAlternatif('RT01 Menengah Atas', '001', array_merge(
            $this->jawaban(false),
            ['q1' => KriteriaFixture::OPSI[1][0], 'q2' => KriteriaFixture::OPSI[2][0]]
        ));

        $rt = $this->aktor('rt001', 'rt', '001');
        $rw = $this->aktor('rw08', 'rw');

        // Acuan: apa yang dilihat Ketua RW.
        Sanctum::actingAs($rw);
        $global = collect($this->getJson('/api/saw/hitung')->assertOk()->json('data'))
            ->keyBy('id_pengajuan');

        // Dashboard RT dengan skala RW.
        Sanctum::actingAs($rt);
        $response = $this->getJson('/api/saw/hitung?skala=rw')->assertOk();

        $this->assertSame('rw', $response->json('skala'));

        $data = collect($response->json('data'))->keyBy('id_pengajuan');

        // Hanya warga RT 001 yang tampil.
        $this->assertCount(3, $data);
        foreach ($data as $row) {
            $this->assertEquals(1, (int) $row['rt']);
        }

        // Nomor peringkat & skor identik dengan layar RW.
        foreach ($data as $id => $row) {
            $this->assertArrayHasKey($id, $global->toArray(), 'id_pengajuan RT lain tidak boleh muncul');
            $this->assertSame(
                $global[$id]['ranking'],
                $row['ranking'],
                "Peringkat {$row['nama_warga']} harus sama dengan yang dilihat Ketua RW"
            );
            $this->assertEqualsWithDelta(
                $global[$id]['skor_saw'],
                $row['skor_saw'],
                1e-9,
                "Skor {$row['nama_warga']} harus sama dengan yang dilihat Ketua RW"
            );
        }

        // Warga terbaik RT 001 TIDAK boleh tampil sebagai peringkat 1, karena
        // warga RT 003 ada di atasnya.
        $teratasRt1 = $data->sortBy('ranking')->first();
        $this->assertGreaterThan(
            1,
            $teratasRt1['ranking'],
            'Peringkat 1 harus milik warga terbaik seluruh RW, bukan terbaik RT sendiri'
        );

        // Tidak ada identitas RT lain yang bocor.
        $namaTampil = $data->pluck('nama_warga')->all();
        $this->assertNotContains('RT03 Terbaik', $namaTampil);
        $this->assertNotContains($rt3->warga->nama_lengkap, $namaTampil);
    }

    public function test_tanpa_skala_rw_perilaku_lama_tetap_berlaku(): void
    {
        $this->buatAlternatif('RT01 A', '001', $this->jawaban(true));
        $this->buatAlternatif('RT01 B', '001', $this->jawaban(false));
        $this->buatAlternatif('RT03 C', '003', $this->jawaban(true));

        $rt = $this->aktor('rt001', 'rt', '001');
        Sanctum::actingAs($rt);

        $response = $this->getJson('/api/saw/hitung')->assertOk();

        $this->assertSame('rt', $response->json('skala'));
        $this->assertSame(
            [1, 2],
            array_column($response->json('data'), 'ranking'),
            'Kontrak lama: tanpa skala=rw peringkat dimulai dari 1 dalam lingkup RT'
        );
    }
}
