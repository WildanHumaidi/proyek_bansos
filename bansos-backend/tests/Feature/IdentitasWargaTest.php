<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\KriteriaFixture;
use Tests\TestCase;

/**
 * Identitas warga WAJIB lewat `users.id_warga`, bukan pencocokan nama.
 * Nama bisa duplikat (6 kasus di data nyata), sehingga pencocokan nama membuat
 * satu akun dapat membaca atau menimpa data warga lain.
 */
class IdentitasWargaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Validasi jawaban server-side butuh vocabulary sub-kriteria.
        KriteriaFixture::seedKriteria();
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

    public function test_dua_warga_dengan_nama_sama_tidak_saling_menimpa(): void
    {
        // Dua orang berbeda, nama identik, RT berbeda.
        $wargaSendiri = Warga::create([
            'nama_lengkap' => 'Budi Santoso',
            'alamat' => 'Alamat Sendiri',
            'rt' => '002',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $wargaOrangLain = Warga::create([
            'nama_lengkap' => 'Budi Santoso',
            'alamat' => 'Alamat Asli',
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $user = User::create([
            'name' => 'Budi Santoso',
            'username' => 'budi-baru',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '002',
            'id_warga' => $wargaSendiri->id_warga,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/warga/pengajuan', [
            'alamat' => 'Alamat Diperbarui',
            'rt' => '002',
            'jawaban_mentah' => $this->jawabanLengkap(),
        ])->assertOk();

        // Hanya baris milik akun ini yang berubah.
        $this->assertSame('Alamat Diperbarui', $wargaSendiri->fresh()->alamat);

        // Warga lain dengan nama sama sama sekali tidak tersentuh.
        $wargaOrangLain->refresh();
        $this->assertSame('Alamat Asli', $wargaOrangLain->alamat);
        $this->assertSame('001', $wargaOrangLain->rt);

        // Tidak ada baris baru yang terbentuk (tidak lagi updateOrCreate by name).
        $this->assertSame(2, Warga::where('nama_lengkap', 'Budi Santoso')->count());
    }

    public function test_warga_tidak_bisa_membaca_chat_pengajuan_orang_lain_dengan_nama_sama(): void
    {
        $wargaLain = Warga::create([
            'nama_lengkap' => 'Siti Aminah',
            'alamat' => 'Alamat Lain',
            'rt' => '002',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $pengajuanLain = Pengajuan::create([
            'id_warga' => $wargaLain->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        DB::table('pesan_chat')->insert([
            'id_pengajuan' => $pengajuanLain->id_pengajuan,
            'pengirim_role' => 'warga',
            'isi_pesan' => 'PESAN RAHASIA MILIK ORANG LAIN',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Pengguna berbeda dengan nama sama.
        $penyusup = User::create([
            'name' => 'Siti Aminah',
            'username' => 'penyusup',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
        ]);

        Sanctum::actingAs($penyusup);

        $this->getJson("/api/chat/{$pengajuanLain->id_pengajuan}")
            ->assertStatus(403);
    }

    public function test_warga_tidak_bisa_melihat_status_pengajuan_orang_lain_dengan_nama_sama(): void
    {
        $wargaLain = Warga::create([
            'nama_lengkap' => 'Agus Salim',
            'alamat' => 'Alamat Lain',
            'rt' => '003',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        Pengajuan::create([
            'id_warga' => $wargaLain->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        $penyusup = User::create([
            'name' => 'Agus Salim',
            'username' => 'penyusup2',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
        ]);

        Sanctum::actingAs($penyusup);

        $response = $this->getJson('/api/warga/status');

        // Pengguna ini belum pernah mengajukan, jadi tidak boleh melihat data apa pun.
        $response->assertStatus(404);
    }

    public function test_admin_dan_rw_tidak_tercatat_sebagai_warga_saat_mengirim_pesan(): void
    {
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Chat',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/chat/{$pengajuan->id_pengajuan}", [
            'isi_pesan' => 'Pesan dari admin',
        ])->assertOk();

        $this->assertDatabaseHas('pesan_chat', [
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'pengirim_role' => 'admin',
        ]);
    }

    public function test_akun_warga_tanpa_tautan_ditolak_saat_mengajukan(): void
    {
        $user = User::create([
            'name' => 'Tanpa Tautan',
            'username' => 'tanpa-tautan',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/warga/pengajuan', [
            'alamat' => 'Alamat',
            'rt' => '001',
            'jawaban_mentah' => ['q1' => '1 KK'],
        ])->assertStatus(409);

        $this->assertSame(0, Pengajuan::count());
    }

    public function test_admin_dapat_menautkan_akun_ke_warga_yang_sesuai(): void
    {
        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);

        $warga = Warga::create([
            'nama_lengkap' => 'Nama Duplikat',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $akun = User::create([
            'name' => 'Nama Duplikat',
            'username' => 'akun-duplikat',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
        ]);

        Sanctum::actingAs($admin);

        $this->putJson("/api/admin/users/{$akun->id}/taut-warga", [
            'id_warga' => $warga->id_warga,
        ])->assertOk();

        $this->assertSame($warga->id_warga, $akun->fresh()->id_warga);
    }

    public function test_satu_baris_warga_tidak_boleh_tertaut_ke_dua_akun(): void
    {
        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);

        $warga = Warga::create([
            'nama_lengkap' => 'Warga Tunggal',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $akunPertama = User::create([
            'name' => 'Akun Satu',
            'username' => 'akun-satu',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
            'id_warga' => $warga->id_warga,
        ]);

        $akunKedua = User::create([
            'name' => 'Akun Dua',
            'username' => 'akun-dua',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
        ]);

        Sanctum::actingAs($admin);

        $this->putJson("/api/admin/users/{$akunKedua->id}/taut-warga", [
            'id_warga' => $warga->id_warga,
        ])->assertStatus(422);

        $this->assertNull($akunKedua->fresh()->id_warga);
        $this->assertSame($warga->id_warga, $akunPertama->fresh()->id_warga);
    }

    public function test_rt_tidak_boleh_menginput_warga_di_luar_wilayahnya(): void
    {
        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);

        Sanctum::actingAs($rt);

        $this->postJson('/api/warga/pengajuan-rt', [
            'nama_lengkap' => 'Warga RT Lain',
            'alamat' => 'Alamat',
            'rt' => '002',
            'jawaban_mentah' => ['q1' => '1 KK'],
        ])->assertStatus(403);

        $this->assertSame(0, Warga::count());
    }

    public function test_nama_warga_kosong_ditolak(): void
    {
        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);

        Sanctum::actingAs($rt);

        $this->postJson('/api/warga/pengajuan-rt', [
            'nama_lengkap' => '   ',
            'alamat' => 'Alamat',
            'rt' => '001',
            'jawaban_mentah' => ['q1' => '1 KK'],
        ])->assertStatus(422);

        $this->assertSame(0, Warga::count());
    }

    public function test_registrasi_menautkan_akun_ke_identitas_warga_baru(): void
    {
        $this->postJson('/api/register', [
            'nama_lengkap' => 'Pendaftar Baru',
            'username' => 'pendaftar',
            'password' => 'rahasia123',
            'rt' => '001',
            'alamat' => 'Jl. Pendaftar',
        ])->assertStatus(201);

        $user = User::where('username', 'pendaftar')->firstOrFail();

        $this->assertNotNull($user->id_warga);
        $this->assertSame('Pendaftar Baru', $user->warga->nama_lengkap);

        // Akun hasil registrasi langsung bisa mengajukan tanpa tautan manual.
        Sanctum::actingAs($user);

        $this->postJson('/api/warga/pengajuan', [
            'alamat' => 'Jl. Pendaftar',
            'rt' => '001',
            'jawaban_mentah' => $this->jawabanLengkap(),
        ])->assertOk();
    }

    public function test_registrasi_dengan_nama_sama_tidak_menimpa_warga_yang_sudah_ada(): void
    {
        $wargaLama = Warga::create([
            'nama_lengkap' => 'Nama Sama',
            'alamat' => 'Alamat Lama',
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $this->postJson('/api/register', [
            'nama_lengkap' => 'Nama Sama',
            'username' => 'nama-sama-baru',
            'password' => 'rahasia123',
            'rt' => '002',
            'alamat' => 'Alamat Baru',
        ])->assertStatus(201);

        $wargaLama->refresh();
        $this->assertSame('Alamat Lama', $wargaLama->alamat);
        $this->assertSame('001', $wargaLama->rt);

        $user = User::where('username', 'nama-sama-baru')->firstOrFail();
        $this->assertNotSame($wargaLama->id_warga, $user->id_warga);
    }
}
