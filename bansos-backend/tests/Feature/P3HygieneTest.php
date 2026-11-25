<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\PesanChat;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * P3 — higiene: kolom kredensial mati, status baca chat, dan pembatas laju.
 *
 * Ketiganya berasal dari temuan audit (§21 dead code, BUG-26 chat tanpa status
 * baca, §22.3 tanpa rate limit pada endpoint berat).
 */
class P3HygieneTest extends TestCase
{
    use RefreshDatabase;

    protected function wargaLengkap(string $nama = 'Warga Chat', string $rt = '001'): array
    {
        $warga = Warga::create([
            'nama_lengkap' => $nama,
            'alamat' => "Jl. {$nama}",
            'rt' => $rt,
            'rw' => '008',
        ]);

        $user = User::create([
            'name' => $nama,
            'username' => strtolower(str_replace(' ', '', $nama)),
            'password' => bcrypt('rahasia123'),
            'role' => 'warga',
            'rt' => $rt,
            'id_warga' => $warga->id_warga,
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        return [$warga, $user, $pengajuan];
    }

    protected function ketuaRt(string $rt = '001'): User
    {
        return User::create([
            'name' => 'Ketua RT 001',
            'username' => 'ketua-'.uniqid(),
            'password' => bcrypt('rahasia123'),
            'role' => 'rt',
            'rt' => $rt,
        ]);
    }

    // ── P3-26: kolom kredensial mati ─────────────────────────────────────────

    public function test_kolom_password_warga_sudah_dihapus(): void
    {
        $this->assertFalse(
            Schema::hasColumn('warga', 'password'),
            'warga.password adalah kredensial mati dan tidak boleh ada lagi'
        );
    }

    public function test_pembuatan_warga_tetap_berjalan_tanpa_kolom_password(): void
    {
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Tanpa Password',
            'alamat' => 'Jl. Tanpa',
            'rt' => '001',
            'rw' => '008',
        ]);

        $this->assertDatabaseHas('warga', [
            'id_warga' => $warga->id_warga,
            'nama_lengkap' => 'Warga Tanpa Password',
        ]);
    }

    // ── P3-30: status baca chat ──────────────────────────────────────────────

    public function test_pesan_baru_dari_lawan_bicara_terhitung_belum_dibaca(): void
    {
        [, $warga, $pengajuan] = $this->wargaLengkap();

        Sanctum::actingAs($warga);
        $this->postJson("/api/chat/{$pengajuan->id_pengajuan}", ['isi_pesan' => 'Halo RT'])
            ->assertOk();

        // Pesan sendiri tidak boleh dihitung sebagai belum dibaca.
        $this->getJson("/api/chat/{$pengajuan->id_pengajuan}/belum-dibaca")
            ->assertOk()
            ->assertJsonPath('jumlah', 0);

        // RT membalas → bagi warga itu pesan baru.
        Sanctum::actingAs($this->ketuaRt());
        $this->postJson("/api/chat/{$pengajuan->id_pengajuan}", ['isi_pesan' => 'Halo warga'])
            ->assertOk();

        Sanctum::actingAs($warga);
        $this->getJson("/api/chat/{$pengajuan->id_pengajuan}/belum-dibaca")
            ->assertOk()
            ->assertJsonPath('jumlah', 1);
    }

    public function test_menandai_dibaca_mengembalikan_jumlah_ke_nol(): void
    {
        [, $warga, $pengajuan] = $this->wargaLengkap();

        Sanctum::actingAs($this->ketuaRt());
        $this->postJson("/api/chat/{$pengajuan->id_pengajuan}", ['isi_pesan' => 'Pesan 1'])->assertOk();
        $this->postJson("/api/chat/{$pengajuan->id_pengajuan}", ['isi_pesan' => 'Pesan 2'])->assertOk();

        Sanctum::actingAs($warga);
        $this->getJson("/api/chat/{$pengajuan->id_pengajuan}/belum-dibaca")
            ->assertOk()
            ->assertJsonPath('jumlah', 2);

        $this->putJson("/api/chat/{$pengajuan->id_pengajuan}/baca")
            ->assertOk()
            ->assertJsonPath('jumlah', 2);

        $this->getJson("/api/chat/{$pengajuan->id_pengajuan}/belum-dibaca")
            ->assertOk()
            ->assertJsonPath('jumlah', 0);

        // Status tersimpan di database, bukan hanya di memori request.
        $this->assertSame(
            0,
            PesanChat::where('id_pengajuan', $pengajuan->id_pengajuan)
                ->whereNull('dibaca_pada')
                ->where('pengirim_role', 'rt')
                ->count()
        );
    }

    public function test_status_baca_tidak_bocor_lintas_pengguna(): void
    {
        [, $wargaA, $pengajuanA] = $this->wargaLengkap('Warga A', '001');
        [, , $pengajuanB] = $this->wargaLengkap('Warga B', '001');

        Sanctum::actingAs($this->ketuaRt('001'));
        $this->postJson("/api/chat/{$pengajuanB->id_pengajuan}", ['isi_pesan' => 'Untuk warga B'])
            ->assertOk();

        // Warga A menandai baca pengajuannya sendiri — tidak boleh menyentuh B.
        Sanctum::actingAs($wargaA);
        $this->putJson("/api/chat/{$pengajuanA->id_pengajuan}/baca")->assertOk();

        $this->assertSame(
            1,
            PesanChat::where('id_pengajuan', $pengajuanB->id_pengajuan)
                ->whereNull('dibaca_pada')
                ->count(),
            'Pesan milik warga lain tidak boleh ikut tertandai dibaca'
        );
    }

    public function test_warga_tidak_bisa_membaca_status_chat_orang_lain(): void
    {
        [, , $pengajuanA] = $this->wargaLengkap('Warga A', '001');
        [, $wargaB] = $this->wargaLengkap('Warga B', '001');

        Sanctum::actingAs($wargaB);

        $this->getJson("/api/chat/{$pengajuanA->id_pengajuan}/belum-dibaca")->assertStatus(403);
        $this->putJson("/api/chat/{$pengajuanA->id_pengajuan}/baca")->assertStatus(403);
    }

    // ── P3-32: pembatas laju ─────────────────────────────────────────────────

    public function test_endpoint_saw_dibatasi_per_pengguna(): void
    {
        [$warga] = $this->wargaLengkap();

        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin-rate',
            'password' => bcrypt('rahasia123'),
            'role' => 'admin',
        ]);
        Sanctum::actingAs($admin);

        // Batas 60/menit. Panggilan ke-61 harus 429.
        for ($i = 0; $i < 60; $i++) {
            $this->getJson('/api/saw/hitung')->assertStatus(404); // belum ada alternatif
        }

        $this->getJson('/api/saw/hitung')->assertStatus(429);
    }

    public function test_endpoint_chat_dibatasi_per_pengguna(): void
    {
        [, $warga, $pengajuan] = $this->wargaLengkap();
        Sanctum::actingAs($warga);

        // Batas 30/menit untuk kirim pesan.
        for ($i = 0; $i < 30; $i++) {
            $this->postJson("/api/chat/{$pengajuan->id_pengajuan}", ['isi_pesan' => "P{$i}"])
                ->assertOk();
        }

        $this->postJson("/api/chat/{$pengajuan->id_pengajuan}", ['isi_pesan' => 'ke-31'])
            ->assertStatus(429);

        $this->assertSame(
            30,
            PesanChat::where('id_pengajuan', $pengajuan->id_pengajuan)->count(),
            'Pesan yang ditolak tidak boleh tersimpan'
        );
    }
}
