<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\PesanChat;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Polling chat (frontend menarik `GET /chat/{id}` + `GET /chat/{id}/belum-dibaca`
 * setiap 15 detik).
 *
 * Yang dijaga di sini adalah kontrak yang membuat polling aman: endpoint baca
 * tidak boleh mengubah state, urutan pesan harus stabil (klien membandingkan
 * `id_pesan` per indeks untuk memutuskan perlu render ulang atau tidak), dan
 * polling tidak boleh membocorkan pesan ke pengguna lain.
 */
class ChatPollingTest extends TestCase
{
    use RefreshDatabase;

    private function siapkan(): array
    {
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Polling',
            'alamat' => 'Jl. Polling 1',
            'rt' => '001',
            'rw' => '008',
        ]);

        $userWarga = User::create([
            'name' => 'Warga Polling',
            'username' => 'wargapolling',
            'password' => bcrypt('rahasia123'),
            'role' => 'warga',
            'rt' => '001',
            'id_warga' => $warga->id_warga,
        ]);

        $userRt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'ketuartpolling',
            'password' => bcrypt('rahasia123'),
            'role' => 'rt',
            'rt' => '001',
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        return [$userWarga, $userRt, $pengajuan];
    }

    public function test_membaca_pesan_berulang_tidak_mengubah_status_baca(): void
    {
        [$userWarga, $userRt, $pengajuan] = $this->siapkan();

        PesanChat::create([
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'pengirim_role' => 'rt',
            'isi_pesan' => 'Pesan dari RT',
        ]);

        Sanctum::actingAs($userWarga);

        // Tiga siklus polling: baca pesan + hitung belum dibaca.
        for ($i = 0; $i < 3; $i++) {
            $this->getJson("/api/chat/{$pengajuan->id_pengajuan}")->assertOk();
            $this->getJson("/api/chat/{$pengajuan->id_pengajuan}/belum-dibaca")
                ->assertOk()
                ->assertJson(['jumlah' => 1]);
        }

        $this->assertSame(
            1,
            PesanChat::where('id_pengajuan', $pengajuan->id_pengajuan)->whereNull('dibaca_pada')->count(),
            'GET tidak boleh menandai pesan terbaca — hanya PUT /baca yang boleh'
        );
    }

    public function test_urutan_pesan_stabil_antar_panggilan(): void
    {
        [$userWarga, $userRt, $pengajuan] = $this->siapkan();

        foreach (['pertama', 'kedua', 'ketiga'] as $teks) {
            PesanChat::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'pengirim_role' => 'rt',
                'isi_pesan' => $teks,
                'created_at' => now()->addSecond(),
            ]);
        }

        Sanctum::actingAs($userWarga);

        $idPertama = array_column(
            $this->getJson("/api/chat/{$pengajuan->id_pengajuan}")->json('data'),
            'id_pesan'
        );
        $idKedua = array_column(
            $this->getJson("/api/chat/{$pengajuan->id_pengajuan}")->json('data'),
            'id_pesan'
        );

        $this->assertSame($idPertama, $idKedua, 'Urutan harus deterministik agar klien bisa membandingkan per indeks');
        $this->assertSame(
            ['pertama', 'kedua', 'ketiga'],
            array_column($this->getJson("/api/chat/{$pengajuan->id_pengajuan}")->json('data'), 'isi_pesan')
        );
    }

    public function test_pesan_baru_terlihat_pada_polling_berikutnya(): void
    {
        [$userWarga, $userRt, $pengajuan] = $this->siapkan();

        Sanctum::actingAs($userWarga);
        $awal = $this->getJson("/api/chat/{$pengajuan->id_pengajuan}")->json('data');
        $this->assertCount(0, $awal);

        // RT membalas di antara dua siklus polling.
        PesanChat::create([
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'pengirim_role' => 'rt',
            'isi_pesan' => 'Balasan baru',
        ]);

        $sesudah = $this->getJson("/api/chat/{$pengajuan->id_pengajuan}")->json('data');
        $this->assertCount(1, $sesudah);
        $this->assertSame('Balasan baru', $sesudah[0]['isi_pesan']);
        $this->assertSame(
            1,
            $this->getJson("/api/chat/{$pengajuan->id_pengajuan}/belum-dibaca")->json('jumlah')
        );
    }

    public function test_polling_warga_lain_tetap_ditolak(): void
    {
        [, , $pengajuan] = $this->siapkan();

        $wargaLain = Warga::create([
            'nama_lengkap' => 'Warga Lain',
            'alamat' => 'Jl. Lain 2',
            'rt' => '001',
            'rw' => '008',
        ]);
        $userLain = User::create([
            'name' => 'Warga Lain',
            'username' => 'wargalain',
            'password' => bcrypt('rahasia123'),
            'role' => 'warga',
            'rt' => '001',
            'id_warga' => $wargaLain->id_warga,
        ]);

        Sanctum::actingAs($userLain);

        // Polling memakai dua endpoint ini; keduanya harus 403, bukan data kosong.
        $this->getJson("/api/chat/{$pengajuan->id_pengajuan}")->assertStatus(403);
        $this->getJson("/api/chat/{$pengajuan->id_pengajuan}/belum-dibaca")->assertStatus(403);
    }
}
