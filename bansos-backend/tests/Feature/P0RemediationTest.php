<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Penilaian;
use App\Models\SubKriteria;
use App\Models\User;
use App\Models\Warga;
use App\Services\CsvImporter;
use App\Services\JawabanMapper;
use Database\Seeders\KriteriaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * P0-ACCEPTANCE-GATE — seluruh tujuh kelompok pekerjaan P0 dibuktikan lewat
 * regression test pada pipeline NYATA (CSV asli → parser → mapper → penilaian
 * → pengajuan menunggu → approval → SAW → ranking API).
 *
 * Test dibuat terhadap data aktual yang terbentuk, bukan matriks dengan nilai
 * expected yang sudah diketahui sebelumnya (P0-07).
 */
class P0RemediationTest extends TestCase
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

    /** Baca CSV asli repository. */
    protected function csvAsli(): string
    {
        return file_get_contents(database_path('data/data_warga.csv'));
    }

    // ────────────────────────────────────────────────────────────────────────
    // P0-01 — CSV → sub-kriteria mapping: 900 sel, unmapped = 0, fallback = 0
    // ────────────────────────────────────────────────────────────────────────

    public function test_csv_asli_900_sel_terpetakan_semuanya_tanpa_fallback(): void
    {
        $subs = SubKriteria::all();
        $perKriteria = $subs->groupBy('id_kriteria');

        $selDicek = 0;
        $gagal = 0;
        $rincianGagal = [];

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $this->csvAsli());
        rewind($stream);
        fgetcsv($stream, 0, ';'); // header

        while (($baris = fgetcsv($stream, 0, ';')) !== false) {
            if ($baris === null || trim(implode('', $baris)) === '') {
                continue;
            }

            foreach (range(1, 10) as $k) {
                $jawaban = trim((string) ($baris[$k + 2] ?? ''));
                $this->assertNotSame('', $jawaban, "Sel jawaban C{$k} tidak boleh kosong");

                $selDicek++;
                $r = JawabanMapper::petakan($jawaban, $k, $perKriteria->get($k));

                if (! $r['ok']) {
                    $gagal++;
                    $rincianGagal[] = "C{$k}: {$jawaban} → {$r['alasan']}";
                } else {
                    // Setiap hasil menunjuk ke sub-kriteria dari kriteria yang BENAR.
                    $sub = $subs->first(fn ($s) => $s->id_subkriteria === $r['id_subkriteria']);
                    $this->assertSame($k, (int) $sub->id_kriteria);
                }
            }
        }
        fclose($stream);

        $this->assertSame(900, $selDicek, 'Harus persis 90 alternatif × 10 kriteria');
        $this->assertSame(0, $gagal, 'Unmapped answer harus 0: '.implode('; ', $rincianGagal));
    }

    public function test_alias_c3_c5_c6_yang_sebelumnya_gagal_100_persen_kini_terpetakan(): void
    {
        $subs = SubKriteria::all();

        $kasus = [
            3 => ['SMA / SMK / S1' => 'SMA / SMK / PT', 'SEKOLAH DASAR (SD)' => 'SD'],
            5 => ['> RP. 5.000.000' => '> 1 Juta', '< Rp. 1.500.000' => '< 400 Ribu'],
            6 => ['RP. 3.000.000 - Rp. 5.000.000' => '700 Ribu - 1 Juta'],
            7 => ['MILIK SENDIRI' => 'Milik Sendiri / Sewa', 'MENUMPANG / TIDAK MEMILIKI TEMPAT TINGGAL' => 'Magersari / Pakai Gratis'],
            8 => ['SUMUR (BOR/GALI)' => 'Sumur Milik Sendiri', 'PDAM' => 'PDAM Terbatas'],
        ];

        foreach ($kasus as $idKriteria => $peta) {
            foreach ($peta as $jawaban => $labelEkspektasi) {
                $r = JawabanMapper::petakan($jawaban, $idKriteria, $subs->where('id_kriteria', $idKriteria));

                $this->assertTrue($r['ok'], "Alias gagal: C{$idKriteria} '{$jawaban}'");
                $this->assertSame(
                    $labelEkspektasi,
                    $subs->first(fn ($s) => $s->id_subkriteria === $r['id_subkriteria'])->keterangan
                );
            }
        }
    }

    public function test_jawaban_tidak_dikenal_menghasilkan_error_bukan_fallback(): void
    {
        $subs = SubKriteria::all();

        $r = JawabanMapper::petakan('BANANA', 1, $subs->where('id_kriteria', 1));

        $this->assertFalse($r['ok']);
        $this->assertArrayNotHasKey('id_subkriteria', $r);
        $this->assertStringContainsString('tidak dikenal', $r['alasan']);
    }

    // ────────────────────────────────────────────────────────────────────────
    // P0-04 — import == menunggu; ranking menolak data belum disetujui
    // ────────────────────────────────────────────────────────────────────────

    public function test_import_csv_asli_status_menunggu_dan_tidak_masuk_ranking_sebelum_approval(): void
    {
        $this->admin();

        $hasil = (new CsvImporter)->impor($this->csvAsli());

        $this->assertSame(0, $hasil['banyak_gagal'], 'CSV asli wajib 0 gagal: '.json_encode($hasil['baris']));
        $this->assertSame(90, $hasil['banyak_import']);

        $this->assertSame(0, Pengajuan::where('status', 'disetujui')->count());
        $this->assertSame(90, Pengajuan::where('status', 'menunggu')->count());
        $this->assertSame(900, Penilaian::count());

        // Belum ada yang disetujui → ranking 404.
        $this->getJson('/api/saw/hitung')->assertStatus(404);
    }

    public function test_approval_memunculkan_pengajuan_di_ranking(): void
    {
        $this->admin();

        (new CsvImporter)->impor($this->csvAsli());

        // Rumah tangga pertama dari fixture CSV (isinya data contoh, bukan data warga asli).
        $pengajuan = Pengajuan::orderBy('id_pengajuan')->firstOrFail();

        $this->assertEquals('menunggu', $pengajuan->status);
        $this->assertSame(10, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());

        $this->putJson("/api/admin/pengajuan/{$pengajuan->id_pengajuan}/status", ['status' => 'disetujui'])
            ->assertOk();

        $pengajuan->refresh();
        $this->assertEquals('disetujui', $pengajuan->status);
        $this->assertSame(10, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());

        $this->getJson('/api/saw/hitung')->assertOk()->assertJsonPath('total', 1);
    }

    // ────────────────────────────────────────────────────────────────────────
    // P0-03 — dua warga nama sama, RT/alamat beda → dua identitas, tidak menimpa
    // ────────────────────────────────────────────────────────────────────────

    public function test_import_dua_nama_sama_rt_berbeda_menghasilkan_dua_record(): void
    {
        $this->admin();

        // Dua baris nama 'SITI' — RT 1 dan RT 2 (alamat berbeda).
        $csv = "Timestamp;NAMA : ;ALAMAT :;JUMLAH KARTU KELUARGA (KK) DALAM SATU RUMAH : ;JUMLAH ANGGOTA KELUARGA DALAM SATU RUMAH : ;PENDIDIKAN KEPALA KELUARGA : ;JUMLAH ANGGOTA KELUARGA MASIH SEKOLAH/KULIAH : ;PENGELUARAN BULANAN 1 RUMAH : ;PENGHASILAN BULANAN DALAM 1 RUMAH : ;STATUS KEPEMILIKAN RUMAH : ;SUMBER AIR BERSIH :;SUMBER PENERANGAN RUMAH :;TRANSPORTASI YANG DIGUNAKAN : ;RT\r\n"
            ."4/14/2026 21:43:42;SITI;Jl Melati 1;1 KK;4 ORANG;SD;Tidak Ada;400 - 700 Ribu;< 400 Ribu;Sewa < 1 Juta;Sumur Milik Sendiri;Listrik 450 watt;Sepeda Motor 1 Buah, dalam Kondisi Baik;1\r\n"
            ."4/14/2026 21:43:43;SITI;Jl Melati 99;1 KK;4 ORANG;SD;Tidak Ada;400 - 700 Ribu;< 400 Ribu;Sewa < 1 Juta;Sumur Milik Sendiri;Listrik 450 watt;Sepeda Motor 1 Buah, dalam Kondisi Baik;2\r\n";

        $hasil = (new CsvImporter)->impor($csv);

        $this->assertSame(2, $hasil['banyak_import'], 'Dua rumah tangga bernama sama harus dua record');
        $this->assertSame(2, Warga::where('nama_lengkap', 'SITI')->count());
        $this->assertSame(2, Warga::where('nama_lengkap', 'SITI')->distinct('rt')->count('rt'));
        $this->assertSame(2, Pengajuan::count(), 'Tidak boleh ada overwrite/timpa');
    }

    public function test_import_ulang_csv_yang_sama_tidak_menggandakan(): void
    {
        $this->admin();

        (new CsvImporter)->impor($this->csvAsli());

        // Jalankan ulang → seluruh baris identik di-skip (nama+RT+alamat sama).
        $hasil = (new CsvImporter)->impor($this->csvAsli());

        $this->assertSame(0, $hasil['banyak_import']);
        $this->assertSame(90, $hasil['banyak_skip']);
        $this->assertSame(90, Warga::count());
        $this->assertSame(90, Pengajuan::count());
    }

    // ────────────────────────────────────────────────────────────────────────
    // P0-05 — validasi silang id_kriteria ↔ id_subkriteria
    // ────────────────────────────────────────────────────────────────────────

    public function test_update_kuesioner_pasangan_kriteria_subkriteria_silang_ditolak_422(): void
    {
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Uji',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
        ]);
        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        // Simpan penilaian awal yang valid (C1 → sub-kriteria milik C1).
        Penilaian::create([
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'id_kriteria' => 1,
            'id_subkriteria' => SubKriteria::where('id_kriteria', 1)->first()->id_subkriteria,
        ]);

        $this->admin();

        // C1 → sub-kriteria milik C3 (nilai 10) = pasangan SILANG.
        $subC3 = SubKriteria::where('id_kriteria', 3)->first();

        $this->putJson("/api/admin/pengajuan/{$pengajuan->id_pengajuan}/kuesioner", [
            'jawaban' => [1 => $subC3->id_subkriteria],
        ])->assertStatus(422);

        // Tidak ada yang berubah: penilaian lama utuh, tidak ada partial write.
        $this->assertSame(1, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());
        $this->assertSame(
            SubKriteria::where('id_kriteria', 1)->first()->id_subkriteria,
            Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->first()->id_subkriteria
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // P0-06 — RT hanya melihat RT-nya sendiri; ranking dimulai dari 1
    // ────────────────────────────────────────────────────────────────────────

    public function test_rt_hanya_melihat_wilayahnya_dan_ranking_mulai_dari_1(): void
    {
        $this->admin();

        // Data tersebar di RT 001 dan RT 002.
        (new CsvImporter)->impor($this->csvAsli());

        // Approve dua warga RT 001 dan dua warga RT 002.
        $ids = Pengajuan::whereHas('warga', fn ($q) => $q->whereRaw('CAST(rt AS UNSIGNED) = 1'))
            ->limit(2)->pluck('id_pengajuan');
        $ids2 = Pengajuan::whereHas('warga', fn ($q) => $q->whereRaw('CAST(rt AS UNSIGNED) = 2'))
            ->limit(2)->pluck('id_pengajuan');

        foreach ($ids->concat($ids2) as $id) {
            $this->putJson("/api/admin/pengajuan/{$id}/status", ['status' => 'disetujui'])->assertOk();
        }

        // Login sebagai RT 001.
        $rt1 = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);

        Sanctum::actingAs($rt1);

        $response = $this->getJson('/api/saw/hitung')->assertOk();

        $data = $response->json('data');
        $this->assertCount(2, $data, 'RT 001 hanya boleh melihat 2 warga RT 001');

        foreach ($data as $row) {
            $this->assertEquals(1, (int) $row['rt'], 'Semua alternatif harus RT 001');
            $this->assertNotEmpty($row['alamat'], 'Alamat warga RT sendiri tetap ditampilkan');
        }

        // Ranking RT dimulai dari 1 dan berurutan.
        $this->assertSame(1, $data[0]['ranking']);
        $this->assertSame([1, 2], array_column($data, 'ranking'));

        // Tidak ada warga RT 002 dalam response (nama/alamat/rt-nya bocor?).
        $namaSemua = array_column($data, 'nama_warga');
        foreach (Warga::whereRaw('CAST(rt AS UNSIGNED) = 2')->get() as $w2) {
            $this->assertNotContains($w2->nama_lengkap, $namaSemua, 'Data RT 002 tidak boleh bocor');
        }

        // Parameter query tidak bisa mengubah scope.
        $responseManipulasi = $this->getJson('/api/saw/hitung?rt=2');
        $responseManipulasi->assertOk();
        $this->assertCount(2, $responseManipulasi->json('data'), 'scope RT tidak bisa dimanipulasi via query param');
    }

    // ────────────────────────────────────────────────────────────────────────
    // P0-07 — End-to-end pipeline regression
    // ────────────────────────────────────────────────────────────────────────

    public function test_pipeline_end_to_end_csv_ke_ranking(): void
    {
        $this->admin();

        // CSV asli → seluruh pipeline.
        (new CsvImporter)->impor($this->csvAsli());

        // Import ulang tidak menggandakan (identity resolution aman).
        (new CsvImporter)->impor($this->csvAsli());

        $this->assertSame(90, Warga::count());
        $this->assertSame(90, Pengajuan::count());
        $this->assertSame(90, Pengajuan::where('status', 'menunggu')->count());
        $this->assertSame(900, Penilaian::count());

        // Approve seluruh pengajuan (sebagai admin, proses eksplisit & tercatat).
        foreach (Pengajuan::pluck('id_pengajuan') as $id) {
            $this->putJson("/api/admin/pengajuan/{$id}/status", ['status' => 'disetujui'])->assertOk();
        }

        // Ranking penuh — 90 alternatif, skor valid, ranking berurutan.
        $response = $this->getJson('/api/saw/hitung')->assertOk();
        $this->assertSame(90, $response->json('total'));
        $this->assertSame(range(1, 90), array_column($response->json('data'), 'ranking'));

        foreach ($response->json('data') as $row) {
            $this->assertGreaterThanOrEqual(0.0, $row['skor_saw']);
            $this->assertLessThanOrEqual(1.0, $row['skor_saw']);
            // Setiap alternatif punya 10 penilaian.
            $this->assertSame(10, Penilaian::where('id_pengajuan', $row['id_pengajuan'])->count());
        }
    }
}