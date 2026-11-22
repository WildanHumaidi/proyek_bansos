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

class SawRankingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Nilai sub-kriteria mengikuti urutan database acuan: index 0 = 2.5 (paling
     * membutuhkan untuk kriteria cost) sampai index 3 = 10.
     */
    protected array $nilaiSub = [2.5, 5, 7.5, 10];

    protected function setUp(): void
    {
        parent::setUp();

        for ($i = 1; $i <= 10; $i++) {
            $k = Kriteria::create([
                'nama_kriteria' => "Kriteria $i",
                'tipe' => in_array($i, [1, 2, 4], true) ? 'benefit' : 'cost',
                'bobot' => 10,
            ]);

            foreach ($this->nilaiSub as $nilai) {
                SubKriteria::create([
                    'id_kriteria' => $k->id_kriteria,
                    'keterangan' => "Sub $i - $nilai",
                    'nilai' => $nilai,
                ]);
            }
        }
    }

    protected function buatPengajuanDenganSkor(string $nama, int $indexSub): Pengajuan
    {
        $warga = Warga::create([
            'nama_lengkap' => $nama,
            'alamat' => 'Alamat '.$nama,
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode(['q1' => 'x']),
        ]);

        for ($i = 1; $i <= 10; $i++) {
            $sub = SubKriteria::where('id_kriteria', $i)
                ->orderBy('id_subkriteria')
                ->get()[$indexSub];

            Penilaian::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_kriteria' => $i,
                'id_subkriteria' => $sub->id_subkriteria,
            ]);
        }

        return $pengajuan;
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

    public function test_warga_paling_membutuhkan_mendapat_skor_tertinggi(): void
    {
        // index 0 → nilai 2.5 di semua kriteria: benefit dinormalisasi min/max,
        // cost dinormalisasi min/x, jadi ini kondisi paling miskin.
        $miskin = $this->buatPengajuanDenganSkor('Warga Miskin', 0);
        // index 3 → nilai 10 di semua kriteria: kondisi paling sejahtera.
        $kaya = $this->buatPengajuanDenganSkor('Warga Sejahtera', 3);

        $this->admin();

        $response = $this->getJson('/api/saw/hitung')->assertOk();
        $data = collect($response->json('data'))->keyBy('id_pengajuan');

        $this->assertSame(1, $data[$miskin->id_pengajuan]['ranking']);
        $this->assertSame(2, $data[$kaya->id_pengajuan]['ranking']);
        $this->assertGreaterThan(
            $data[$kaya->id_pengajuan]['skor_saw'],
            $data[$miskin->id_pengajuan]['skor_saw']
        );
    }

    public function test_skor_imbang_diurutkan_stabil_berdasarkan_id_pengajuan(): void
    {
        $pertama = $this->buatPengajuanDenganSkor('Warga Satu', 1);
        $kedua = $this->buatPengajuanDenganSkor('Warga Dua', 1);
        $ketiga = $this->buatPengajuanDenganSkor('Warga Tiga', 1);

        $this->admin();

        $urutanPertama = collect($this->getJson('/api/saw/hitung')->assertOk()->json('data'))
            ->pluck('id_pengajuan')
            ->all();
        $urutanKedua = collect($this->getJson('/api/saw/hitung')->assertOk()->json('data'))
            ->pluck('id_pengajuan')
            ->all();

        $this->assertSame($urutanPertama, $urutanKedua);
        $this->assertSame(
            [$pertama->id_pengajuan, $kedua->id_pengajuan, $ketiga->id_pengajuan],
            $urutanPertama
        );
    }

    public function test_pengajuan_tanpa_nama_warga_tidak_masuk_ranking(): void
    {
        $valid = $this->buatPengajuanDenganSkor('Warga Valid', 1);

        // Baris tanpa identitas warga: kalau ikut dihitung, ia bisa menempati rank 1
        // dengan skor sempurna dan menggeser warga yang sah.
        $hantu = Warga::create([
            'nama_lengkap' => '',
            'alamat' => '',
            'rt' => '000',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $pengajuanHantu = Pengajuan::create([
            'id_warga' => $hantu->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => null,
        ]);

        for ($i = 1; $i <= 10; $i++) {
            $sub = SubKriteria::where('id_kriteria', $i)->orderBy('id_subkriteria')->first();

            Penilaian::create([
                'id_pengajuan' => $pengajuanHantu->id_pengajuan,
                'id_kriteria' => $i,
                'id_subkriteria' => $sub->id_subkriteria,
            ]);
        }

        $this->admin();

        $response = $this->getJson('/api/saw/hitung')->assertOk();

        $this->assertSame([$valid->id_pengajuan], $response->json('data.*.id_pengajuan'));
        $this->assertSame(
            [$pengajuanHantu->id_pengajuan],
            collect($response->json('dilewati'))->pluck('id_pengajuan')->all()
        );
        $this->assertSame('nama warga kosong', $response->json('dilewati.0.alasan'));
    }

    public function test_pengajuan_dengan_matriks_tidak_lengkap_tidak_masuk_ranking(): void
    {
        $lengkap = $this->buatPengajuanDenganSkor('Warga Lengkap', 1);

        $warga = Warga::create([
            'nama_lengkap' => 'Warga Setengah',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode(['q1' => '-']),
        ]);

        // Hanya 3 dari 10 kriteria terisi.
        for ($i = 1; $i <= 3; $i++) {
            $sub = SubKriteria::where('id_kriteria', $i)->orderBy('id_subkriteria')->first();

            Penilaian::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_kriteria' => $i,
                'id_subkriteria' => $sub->id_subkriteria,
            ]);
        }

        $this->admin();

        $response = $this->getJson('/api/saw/hitung')->assertOk();

        $this->assertSame([$lengkap->id_pengajuan], $response->json('data.*.id_pengajuan'));
        $this->assertSame('matriks penilaian belum lengkap', $response->json('dilewati.0.alasan'));
    }
}
