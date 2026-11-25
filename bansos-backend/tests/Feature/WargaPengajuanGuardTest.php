<?php

namespace Tests\Feature;

use App\Models\Kriteria;
use App\Models\Pengajuan;
use App\Models\Penilaian;
use App\Models\SubKriteria;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\Support\KriteriaFixture;
use Tests\TestCase;

class WargaPengajuanGuardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Validasi jawaban server-side butuh vocabulary sub-kriteria (P1-03).
        KriteriaFixture::seedKriteria();
    }

    protected function admin(): void
    {
        Sanctum::actingAs(User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]));
    }

    protected function warga(): Warga
    {
        return Warga::create([
            'nama_lengkap' => 'Warga Guard',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
        ]);
    }

    /** Payload jawaban lengkap dengan vocabulary valid (P1-03). */
    protected function jawabanLengkap(): array
    {
        return [
            'q1' => '1 KK',
            'q2' => '4 Orang',
            'q3' => 'SD',
            'q4' => 'Tidak Ada',
            'q5' => '400 - 700 Ribu',
            'q6' => '< 400 Ribu',
            'q7' => 'Sewa < 1 Juta',
            'q8' => 'Sumur Milik Sendiri',
            'q9' => 'Listrik 450 watt',
            'q10' => 'Sepeda Motor 1 Buah, dalam Kondisi Baik',
        ];
    }

    public function test_import_csv_menolak_file_yang_bukan_csv(): void
    {
        $this->admin();

        $this->postJson('/api/admin/pengajuan/import', [
            'file' => UploadedFile::fake()->create('data.pdf', 20, 'application/pdf'),
        ])->assertStatus(422)->assertJsonValidationErrors('file');
    }

    public function test_import_csv_menerima_file_csv(): void
    {
        $this->admin();

        $csv = "Timestamp;NAMA : ;ALAMAT :;JUMLAH KARTU KELUARGA (KK) DALAM SATU RUMAH : ;JUMLAH ANGGOTA KELUARGA DALAM SATU RUMAH : ;PENDIDIKAN KEPALA KELUARGA : ;JUMLAH ANGGOTA KELUARGA MASIH SEKOLAH/KULIAH : ;PENGELUARAN BULANAN 1 RUMAH : ;PENGHASILAN BULANAN DALAM 1 RUMAH : ;STATUS KEPEMILIKAN RUMAH : ;SUMBER AIR BERSIH :;SUMBER PENERANGAN RUMAH :;TRANSPORTASI YANG DIGUNAKAN : ;RT\r\n"
            ."4/14/2026 21:43:42;Warga Import ;Jl. Uji;1 KK;4 ORANG;SD;Tidak Ada;400 - 700 Ribu;< 400 Ribu;Sewa < 1 Juta;Sumur Milik Sendiri;Listrik 450 watt;Sepeda Motor 1 Buah, dalam Kondisi Baik;1\r\n";

        $file = UploadedFile::fake()->createWithContent('data.csv', $csv);

        $this->postJson('/api/admin/pengajuan/import', ['file' => $file])
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('warga', ['nama_lengkap' => 'Warga Import']);
    }

    public function test_pengajuan_kedua_untuk_warga_yang_sama_ditolak_dengan_400(): void
    {
        $this->admin();
        $warga = $this->warga();

        Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        // Pengecekan awal di controller memang menolak lebih dulu; pastikan pesannya
        // tetap 400 dan tidak ada baris kedua yang terbentuk.
        $this->postJson('/api/warga/pengajuan-rt', [
            'nama_lengkap' => 'Warga Guard',
            'alamat' => 'Alamat',
            'rt' => '001',
            'jawaban_mentah' => $this->jawabanLengkap(),
        ])->assertStatus(400);

        $this->assertSame(1, Pengajuan::where('id_warga', $warga->id_warga)->count());
    }

    public function test_update_kuesioner_membangun_ulang_matriks_dari_jawaban_mentah(): void
    {
        $this->admin();

        $warga = $this->warga();
        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode($this->jawabanLengkap()),
        ]);

        // Ubah SEMUA jawaban ke '2 KK'-style yang valid untuk seluruh kriteria:
        // gunakan jawaban pertama (paling membutuhkan) dari tiap kriteria.
        $jawabanBaru = [];
        foreach (KriteriaFixture::OPSI as $id => $opsi) {
            $jawabanBaru['q'.$id] = $opsi[0];
        }

        $this->putJson("/api/admin/pengajuan/{$pengajuan->id_pengajuan}/kuesioner", [
            'jawaban_mentah' => $jawabanBaru,
        ])->assertOk();

        $this->assertSame(10, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());

        $nilai = Penilaian::with('subKriteria')
            ->where('id_pengajuan', $pengajuan->id_pengajuan)
            ->get()
            ->pluck('subKriteria.nilai')
            ->values()
            ->all();

        // Opsi pertama tiap kriteria = nilai 10 untuk benefit, 2.5 untuk cost.
        $this->assertSame(
            [10.0, 10.0, 2.5, 10.0, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5],
            $nilai
        );
    }
}
