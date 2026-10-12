<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_ownership_and_rt_authorization(): void
    {
        $wargaA = User::create([
            'name' => 'Warga A',
            'username' => 'wargaa',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt' => '001',
        ]);

        $wargaModelA = Warga::create([
            'nama_lengkap' => 'Warga A',
            'alamat' => 'Alamat A',
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);

        $pengajuanA = Pengajuan::create([
            'id_warga' => $wargaModelA->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        $wargaB = User::create([
            'name' => 'Warga B',
            'username' => 'wargab',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt' => '001',
        ]);

        $rt2 = User::create([
            'name' => 'Ketua RT 002',
            'username' => 'rt002',
            'password' => bcrypt('password'),
            'role' => 'rt',
            'rt' => '002',
        ]);

        $rt1 = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('password'),
            'role' => 'rt',
            'rt' => '001',
        ]);

        // 1. Warga A can read and send messages to their own application
        Sanctum::actingAs($wargaA);
        $resPost = $this->postJson("/api/chat/{$pengajuanA->id_pengajuan}", ['isi_pesan' => 'Halo RT']);
        $resPost->assertStatus(200);

        $resGet = $this->getJson("/api/chat/{$pengajuanA->id_pengajuan}");
        $resGet->assertStatus(200);
        $this->assertCount(1, $resGet->json('data'));

        // 2. Warga B cannot read or send messages to Warga A's application (IDOR prevention)
        Sanctum::actingAs($wargaB);
        $this->getJson("/api/chat/{$pengajuanA->id_pengajuan}")->assertStatus(403);
        $this->postJson("/api/chat/{$pengajuanA->id_pengajuan}", ['isi_pesan' => 'Intruder'])->assertStatus(403);

        // 3. RT 002 cannot access application of Warga A in RT 001
        Sanctum::actingAs($rt2);
        $this->getJson("/api/chat/{$pengajuanA->id_pengajuan}")->assertStatus(403);

        // 4. RT 001 can access application of Warga A in RT 001
        Sanctum::actingAs($rt1);
        $this->getJson("/api/chat/{$pengajuanA->id_pengajuan}")->assertStatus(200);
        $this->postJson("/api/chat/{$pengajuanA->id_pengajuan}", ['isi_pesan' => 'Halo Warga A'])->assertStatus(200);

        // 5. Empty message validation
        $this->postJson("/api/chat/{$pengajuanA->id_pengajuan}", ['isi_pesan' => ''])->assertStatus(422);
    }
}
