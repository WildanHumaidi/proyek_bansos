<?php

namespace Tests\Feature;

use App\Models\Pengaduan;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * P2-01 — Sub-sistem pengaduan:
 *  - warga membuat pengaduan (nomor/identitas pemilik, status pending);
 *  - RT menindaklanjuti pengaduan wilayahnya saja;
 *  - admin dapat mengambil alih (RT tidak tersedia);
 *  - warga melihat status & riwayat; warga TIDAK bisa membaca pengaduan orang lain.
 */
class PengaduanTest extends TestCase
{
    use RefreshDatabase;

    protected function warga(string $nama, string $rt, string $username): User
    {
        $w = Warga::create([
            'nama_lengkap' => $nama,
            'alamat' => "Alamat {$nama}",
            'rt' => $rt,
            'rw' => '008',
        ]);

        return User::create([
            'name' => $nama,
            'username' => $username,
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => $rt,
            'alamat' => "Alamat {$nama}",
            'id_warga' => $w->id_warga,
        ]);
    }

    public function test_warga_membuat_pengaduan_dan_melihat_status_riwayat(): void
    {
        $warga = $this->warga('Warga Keluh', '001', 'warga-keluh');
        Sanctum::actingAs($warga);

        $this->postJson('/api/pengaduan', [
            'kategori' => 'bantuan',
            'isi' => 'Saya belum menerima bantuan padahal sudah disetujui.',
        ])->assertStatus(201);

        $pengaduan = Pengaduan::firstOrFail();
        $this->assertSame('pending', $pengaduan->status);
        $this->assertSame($warga->id_warga, $pengaduan->id_warga);
        $this->assertSame(1, $pengaduan->riwayat()->count(), 'Harus ada riwayat awal');

        // Warga melihat pengaduannya + riwayat.
        $this->getJson('/api/pengaduan')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'pending');
    }

    public function test_rt_menindaklanjuti_pengaduan_wilayahnya(): void
    {
        $warga = $this->warga('Warga RT1', '001', 'warga-rt1');
        Sanctum::actingAs($warga);
        $this->postJson('/api/pengaduan', ['isi' => 'Keluhan RT 1.' ])->assertStatus(201);

        $pengaduan = Pengaduan::firstOrFail();

        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);
        Sanctum::actingAs($rt);

        $this->putJson("/api/pengaduan/{$pengaduan->id_pengaduan}", [
            'status' => 'diterima',
            'tanggapan' => 'Baik, kami proses.',
        ])->assertOk();

        $pengaduan->refresh();
        $this->assertSame('diterima', $pengaduan->status);
        $this->assertSame('rt001', $pengaduan->ditangani_oleh);
        $this->assertSame(2, $pengaduan->riwayat()->count());
        $this->assertSame('pending', $pengaduan->riwayat()->orderBy('id_riwayat', 'desc')->first()->status_lama);
    }

    public function test_rt_tidak_bisa_menangani_pengaduan_rt_lain(): void
    {
        $warga = $this->warga('Warga RT2', '002', 'warga-rt2');
        Sanctum::actingAs($warga);
        $this->postJson('/api/pengaduan', ['isi' => 'Keluhan RT 2.'])->assertStatus(201);

        $pengaduan = Pengaduan::firstOrFail();

        $rtLain = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);
        Sanctum::actingAs($rtLain);

        $this->putJson("/api/pengaduan/{$pengaduan->id_pengaduan}", ['status' => 'diterima'])
            ->assertStatus(403);

        $this->assertSame('pending', $pengaduan->fresh()->status);
    }

    public function test_admin_dapat_mengambil_alih_pengaduan(): void
    {
        $warga = $this->warga('Warga RT3', '003', 'warga-rt3');
        Sanctum::actingAs($warga);
        $this->postJson('/api/pengaduan', ['isi' => 'RT tidak merespons.'])->assertStatus(201);

        $pengaduan = Pengaduan::firstOrFail();

        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);
        Sanctum::actingAs($admin);

        $this->putJson("/api/pengaduan/{$pengaduan->id_pengaduan}", [
            'status' => 'ditolak',
            'tanggapan' => 'Data tidak lengkap, silakan hubungi RT.',
        ])->assertOk();

        $pengaduan->refresh();
        $this->assertSame('ditolak', $pengaduan->status);
        $this->assertSame('admin', $pengaduan->ditangani_oleh);
    }

    public function test_warga_tidak_bisa_membaca_pengaduan_orang_lain(): void
    {
        $penulis = $this->warga('Penulis Keluhan', '002', 'penulis');
        Sanctum::actingAs($penulis);
        $this->postJson('/api/pengaduan', ['isi' => 'Rahasia milik penulis.'])->assertStatus(201);

        $penyusup = $this->warga('Penyusup', '002', 'penyusup');
        Sanctum::actingAs($penyusup);

        $this->getJson('/api/pengaduan')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_rt_hanya_melihat_pengaduan_wilayahnya_di_daftar(): void
    {
        $rt1 = $this->warga('Warga Satu', '001', 'warga-1');
        Sanctum::actingAs($rt1);
        $this->postJson('/api/pengaduan', ['isi' => 'Keluhan wilayah 001.'])->assertStatus(201);

        $rt3 = $this->warga('Warga Tiga', '003', 'warga-3');
        Sanctum::actingAs($rt3);
        $this->postJson('/api/pengaduan', ['isi' => 'Keluhan wilayah 003.'])->assertStatus(201);

        $ketua = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);
        Sanctum::actingAs($ketua);

        $res = $this->getJson('/api/pengaduan')->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('001', (string) $res->json('data.0.warga.rt'));
    }

    public function test_rt_dengan_format_rt_berbeda_tetap_melihat_wilayahnya(): void
    {
        // Data lama menyimpan RT sebagai '1', data baru '001' — keduanya harus cocok.
        $warga = $this->warga('Warga Format Lama', '1', 'warga-lama');
        Sanctum::actingAs($warga);
        $this->postJson('/api/pengaduan', ['isi' => 'RT disimpan sebagai angka.'])->assertStatus(201);

        $ketua = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);
        Sanctum::actingAs($ketua);

        $this->getJson('/api/pengaduan')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_status_di_luar_daftar_ditolak_422(): void
    {
        $warga = $this->warga('Warga Status', '001', 'warga-status');
        Sanctum::actingAs($warga);
        $this->postJson('/api/pengaduan', ['isi' => 'Uji status tidak valid.'])->assertStatus(201);

        $pengaduan = Pengaduan::firstOrFail();

        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);
        Sanctum::actingAs($admin);

        $this->putJson("/api/pengaduan/{$pengaduan->id_pengaduan}", ['status' => 'selesai'])
            ->assertStatus(422);

        $this->assertSame('pending', $pengaduan->fresh()->status);
    }

    public function test_isi_pengaduan_kosong_ditolak_422(): void
    {
        $warga = $this->warga('Warga Kosong', '001', 'warga-kosong');
        Sanctum::actingAs($warga);

        $this->postJson('/api/pengaduan', ['isi' => '   '])->assertStatus(422);
        $this->assertSame(0, Pengaduan::count());
    }

    public function test_akun_warga_tanpa_identitas_tidak_bisa_mengadu(): void
    {
        $user = User::create([
            'name' => 'Akun Tanpa Warga',
            'username' => 'tanpa-warga',
            'password' => bcrypt('secret'),
            'role' => 'warga',
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/pengaduan', ['isi' => 'Tidak boleh masuk.'])->assertStatus(403);
        $this->assertSame(0, Pengaduan::count());
    }

    public function test_riwayat_mencatat_setiap_perubahan_status(): void
    {
        $warga = $this->warga('Warga Riwayat', '001', 'warga-riwayat');
        Sanctum::actingAs($warga);
        $this->postJson('/api/pengaduan', ['isi' => 'Perlu dua kali tindak lanjut.'])->assertStatus(201);

        $pengaduan = Pengaduan::firstOrFail();

        $ketua = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);
        Sanctum::actingAs($ketua);

        $this->putJson("/api/pengaduan/{$pengaduan->id_pengaduan}", ['status' => 'diterima'])
            ->assertOk();
        $this->putJson("/api/pengaduan/{$pengaduan->id_pengaduan}", ['status' => 'ditolak'])
            ->assertOk();

        $riwayat = $pengaduan->fresh()->riwayat()->orderBy('id_riwayat')->get();
        $this->assertCount(3, $riwayat);
        $this->assertNull($riwayat[0]->status_lama);
        $this->assertSame('pending', $riwayat[0]->status_baru);
        $this->assertSame('pending', $riwayat[1]->status_lama);
        $this->assertSame('diterima', $riwayat[1]->status_baru);
        $this->assertSame('diterima', $riwayat[2]->status_lama);
        $this->assertSame('ditolak', $riwayat[2]->status_baru);
    }
}