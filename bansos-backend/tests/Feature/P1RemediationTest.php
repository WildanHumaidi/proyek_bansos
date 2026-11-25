<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\PengajuanRiwayat;
use App\Models\Penilaian;
use App\Models\User;
use App\Models\Warga;
use App\Services\CsvImporter;
use Database\Seeders\KriteriaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * P1 — Workflow & validasi:
 *  P1-02 akun warga buatan RT utuh (warga + users.id_warga + bisa login/mengajukan)
 *  P1-03 validasi jawaban server-side (422 + rincian)
 *  P1-04 approval hanya dengan matriks lengkap (rollback + 422)
 *  P1-05 CSV parser robust (header hilang, kolom diacak, RT invalid)
 *  P1-06 resubmission setelah ditolak (histori terjaga)
 *  P1-08 atomic submission (fault injection → tidak ada partial write)
 */
class P1RemediationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(KriteriaSeeder::class);
    }

    protected function rt(): User
    {
        return User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);
    }

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

    // ────────────────────────────────────────────────────────────────────────
    // P1-02 — akun warga buatan RT tidak lagi yatim
    // ────────────────────────────────────────────────────────────────────────

    public function test_rt_membuat_akun_warga_langsung_tertaut_ke_identitas_warga(): void
    {
        $rt = $this->rt();
        Sanctum::actingAs($rt);

        $this->postJson('/api/admin/users', [
            'name' => 'Siti Aminah',
            'username' => 'siti01',
            'password' => 'rahasia123',
            'role' => 'warga',
            'rt' => '001',
            'alamat' => 'Jl. Melati',
        ])->assertOk();

        $user = User::where('username', 'siti01')->firstOrFail();

        // Akun punya pasangan warga + tautan id_warga (P1-02).
        $this->assertNotNull($user->id_warga);
        $this->assertNotNull($user->warga);
        $this->assertSame('Siti Aminah', $user->warga->nama_lengkap);
        $this->assertSame('001', $user->warga->rt);

        // Akun bisa login dan langsung mengajukan.
        Sanctum::actingAs($user);
        $this->postJson('/api/warga/pengajuan', [
            'alamat' => 'Jl. Melati',
            'rt' => '001',
            'jawaban_mentah' => $this->jawabanLengkap(),
        ])->assertOk();
    }

    // ────────────────────────────────────────────────────────────────────────
    // P1-03 — validasi jawaban server-side
    // ────────────────────────────────────────────────────────────────────────

    public function test_submit_jawaban_tidak_dikenal_ditolak_422_dengan_rincian(): void
    {
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Validasi',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
        ]);
        $user = User::create([
            'name' => 'Warga Validasi',
            'username' => 'warga-validasi',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
            'alamat' => 'Alamat',
            'id_warga' => $warga->id_warga,
        ]);

        Sanctum::actingAs($user);

        $jawaban = $this->jawabanLengkap();
        $jawaban['q3'] = 'BANANA'; // tidak dikenal

        $response = $this->postJson('/api/warga/pengajuan', [
            'alamat' => 'Alamat',
            'rt' => '001',
            'jawaban_mentah' => $jawaban,
        ])->assertStatus(422);

        $this->assertStringContainsString('q3', $response->json('error')[0]['key'] ?? '');
        $this->assertSame(0, Pengajuan::count(), 'Tidak ada pengajuan yang tersimpan');
    }

    public function test_submit_jawaban_kurang_dari_10_ditolak_422(): void
    {
        $user = User::create([
            'name' => 'Warga Kurang',
            'username' => 'warga-kurang',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
        ]);
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Kurang',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
        ]);
        $user->update(['id_warga' => $warga->id_warga]);

        Sanctum::actingAs($user);

        $this->postJson('/api/warga/pengajuan', [
            'alamat' => 'Alamat',
            'rt' => '001',
            'jawaban_mentah' => ['q1' => '1 KK'],
        ])->assertStatus(422);

        $this->assertSame(0, Pengajuan::count());
    }

    // ────────────────────────────────────────────────────────────────────────
    // P1-04 — approval hanya dengan matriks lengkap
    // ────────────────────────────────────────────────────────────────────────

    public function test_approval_jawaban_tidak_lengkap_dirollback_dan_422(): void
    {
        $rt = $this->rt();
        Sanctum::actingAs($rt);

        $warga = Warga::create([
            'nama_lengkap' => 'Warga Parsial',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
        ]);

        // Jawaban hanya q1..q9 (q10 hilang) → matriks tidak lengkap.
        $jawaban = $this->jawabanLengkap();
        unset($jawaban['q10']);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode($jawaban),
        ]);

        $response = $this->putJson("/api/admin/pengajuan/{$pengajuan->id_pengajuan}/status", [
            'status' => 'disetujui',
        ])->assertStatus(422);

        $this->assertStringContainsString('q10', $response->json('message'));

        // Tidak ada penilaian tersimpan (rollback), status tetap menunggu.
        $this->assertSame(0, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());
        $this->assertEquals('menunggu', $pengajuan->fresh()->status);
    }

    // ────────────────────────────────────────────────────────────────────────
    // P1-05 — CSV parser robust
    // ────────────────────────────────────────────────────────────────────────

    private function csvBarisSatu(string $nama = 'Warga Parser', string $rt = '1', string $alamat = 'Jl. Parser'): string
    {
        return "Timestamp;NAMA : ;ALAMAT :;JUMLAH KARTU KELUARGA (KK) DALAM SATU RUMAH : ;JUMLAH ANGGOTA KELUARGA DALAM SATU RUMAH : ;PENDIDIKAN KEPALA KELUARGA : ;JUMLAH ANGGOTA KELUARGA MASIH SEKOLAH/KULIAH : ;PENGELUARAN BULANAN 1 RUMAH : ;PENGHASILAN BULANAN DALAM 1 RUMAH : ;STATUS KEPEMILIKAN RUMAH : ;SUMBER AIR BERSIH :;SUMBER PENERANGAN RUMAH :;TRANSPORTASI YANG DIGUNAKAN : ;RT\r\n"
            ."4/14/2026 21:43:42;{$nama};{$alamat};1 KK;4 ORANG;SD;Tidak Ada;400 - 700 Ribu;< 400 Ribu;Sewa < 1 Juta;Sumur Milik Sendiri;Listrik 450 watt;Sepeda Motor 1 Buah, dalam Kondisi Baik;{$rt}\r\n";
    }

    public function test_csv_header_rt_hilang_menghasilkan_error_clear(): void
    {
        $csv = "Timestamp;NAMA : ;ALAMAT :;JUMLAH KARTU KELUARGA (KK) DALAM SATU RUMAH : ;....\r\n"
            ."4/14/2026 21:43:42;Warga;Jl A;1 KK;4 ORANG;SD;Tidak Ada;400 - 700 Ribu;< 400 Ribu;Sewa < 1 Juta;Sumur Milik Sendiri;Listrik 450 watt;Sepeda Motor 1 Buah, dalam Kondisi Baik\r\n";

        $hasil = (new CsvImporter)->impor($csv);

        $this->assertNotNull($hasil['error_header']);
        $this->assertStringContainsString('RT', $hasil['error_header']);
        $this->assertSame(0, Warga::count(), 'Tidak ada data yang diimpor');
    }

    public function test_csv_rt_invalid_tidak_di_coerce_ke_rt001(): void
    {
        // Melalui endpoint: admin import CSV dengan RT='RT001' → baris gagal → 422.
        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);
        Sanctum::actingAs($admin);

        $csv = $this->csvBarisSatu('Warga RT Aneh', 'RT001', 'Jl Aneh');
        $file = UploadedFile::fake()->createWithContent('data.csv', $csv);

        $this->postJson('/api/admin/pengajuan/import', ['file' => $file])
            ->assertStatus(422);

        $this->assertSame(0, Warga::count(), 'RT invalid harus ditolak, bukan dialihkan ke RT 001');
    }

    public function test_csv_dengan_urutan_kolom_diacak_tetap_benar(): void
    {
        // Header diacak: RT dipindah ke kolom pertama, NAMA ke kolom kedua.
        $csv = "RT;NAMA : ;ALAMAT :;JUMLAH KARTU KELUARGA (KK) DALAM SATU RUMAH : ;JUMLAH ANGGOTA KELUARGA DALAM SATU RUMAH : ;PENDIDIKAN KEPALA KELUARGA : ;JUMLAH ANGGOTA KELUARGA MASIH SEKOLAH/KULIAH : ;PENGELUARAN BULANAN 1 RUMAH : ;PENGHASILAN BULANAN DALAM 1 RUMAH : ;STATUS KEPEMILIKAN RUMAH : ;SUMBER AIR BERSIH :;SUMBER PENERANGAN RUMAH :;TRANSPORTASI YANG DIGUNAKAN : ;Timestamp\r\n"
            ."1;Warga Acak;Jl Acak;1 KK;4 ORANG;SD;Tidak Ada;400 - 700 Ribu;< 400 Ribu;Sewa < 1 Juta;Sumur Milik Sendiri;Listrik 450 watt;Sepeda Motor 1 Buah, dalam Kondisi Baik;4/14/2026 21:43:42\r\n";

        $hasil = (new CsvImporter)->impor($csv);

        $this->assertSame(1, $hasil['banyak_import']);

        $warga = Warga::where('nama_lengkap', 'Warga Acak')->firstOrFail();
        $this->assertSame('001', $warga->rt);
        $pengajuan = Pengajuan::where('id_warga', $warga->id_warga)->firstOrFail();
        $this->assertSame(10, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());
    }

    // ────────────────────────────────────────────────────────────────────────
    // P1-06 — resubmission setelah ditolak
    // ────────────────────────────────────────────────────────────────────────

    public function test_warga_ditolak_dapat_mengajukan_ulang_dengan_histori(): void
    {
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Resubmit',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
        ]);
        $user = User::create([
            'name' => 'Warga Resubmit',
            'username' => 'warga-resubmit',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
            'alamat' => 'Alamat',
            'id_warga' => $warga->id_warga,
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'ditolak',
            'jawaban_mentah' => json_encode($this->jawabanLengkap()),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/warga/pengajuan', [
            'alamat' => 'Alamat',
            'rt' => '001',
            'jawaban_mentah' => $this->jawabanLengkap(),
        ])->assertOk();

        // Status kembali menunggu; histori penolakan tercatat.
        $this->assertEquals('menunggu', $pengajuan->fresh()->status);
        $this->assertSame(1, Pengajuan::count(), 'Tetap satu pengajuan aktif per warga');
        $this->assertSame(1, PengajuanRiwayat::where('id_pengajuan', $pengajuan->id_pengajuan)->count());
        $this->assertEquals('ditolak', PengajuanRiwayat::first()->status_lama);
    }

    public function test_warga_dengan_pengajuan_menunggu_tidak_bisa_menggandakan(): void
    {
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Aktif',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
        ]);
        $user = User::create([
            'name' => 'Warga Aktif',
            'username' => 'warga-aktif',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
            'alamat' => 'Alamat',
            'id_warga' => $warga->id_warga,
        ]);

        Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode($this->jawabanLengkap()),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/warga/pengajuan', [
            'alamat' => 'Alamat',
            'rt' => '001',
            'jawaban_mentah' => $this->jawabanLengkap(),
        ])->assertStatus(400);

        $this->assertSame(1, Pengajuan::count());
    }

    // ────────────────────────────────────────────────────────────────────────
    // P1-08 — atomic submission (fault injection)
    // ────────────────────────────────────────────────────────────────────────

    public function test_pengajuan_gagal_tidak_menyisakan_record_parsial(): void
    {
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Atomic',
            'alamat' => 'Alamat Asli',
            'rt' => '001',
            'rw' => '008',
        ]);
        $user = User::create([
            'name' => 'Warga Atomic',
            'username' => 'warga-atomic',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
            'alamat' => 'Alamat Asli',
            'id_warga' => $warga->id_warga,
        ]);

        // Fault injection: unique constraint pada pengajuan.id_warga.
        Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode($this->jawabanLengkap()),
        ]);

        Sanctum::actingAs($user);

        // Submit kedua → 400 (duplikat) → tidak boleh mengubah alamat warga
        // (sebelumnya $warga->update() berjalan di luar transaction, BUG-13).
        $this->postJson('/api/warga/pengajuan', [
            'alamat' => 'Alamat Baru (seharusnya tidak tersimpan)',
            'rt' => '002',
            'jawaban_mentah' => $this->jawabanLengkap(),
        ])->assertStatus(400);

        $warga->refresh();
        $this->assertSame('Alamat Asli', $warga->alamat, 'Atomic: alamat tidak berubah saat pengajuan gagal');
        $this->assertSame('001', $warga->rt, 'Atomic: RT tidak berubah saat pengajuan gagal');
    }
}