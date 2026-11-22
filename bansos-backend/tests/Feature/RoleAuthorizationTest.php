<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_warga_cannot_access_admin_user_management(): void
    {
        $warga = User::create([
            'name' => 'Warga User',
            'username' => 'warga1',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
        ]);

        Sanctum::actingAs($warga);

        $response = $this->getJson('/api/users');
        $response->assertStatus(403);

        $deleteResponse = $this->deleteJson('/api/users/1');
        $deleteResponse->assertStatus(403);
    }

    public function test_warga_cannot_access_admin_pengajuan_endpoints(): void
    {
        $warga = User::create([
            'name' => 'Warga User',
            'username' => 'warga1',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
        ]);

        Sanctum::actingAs($warga);

        $response = $this->getJson('/api/admin/pengajuan');
        $response->assertStatus(403);
    }

    public function test_rt_cannot_access_super_admin_features(): void
    {
        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);

        Sanctum::actingAs($rt);

        $this->getJson('/api/users')->assertStatus(403);
        $this->getJson('/api/logs')->assertStatus(403);
        $this->deleteJson('/api/admin/pengajuan/1')->assertStatus(403);
    }

    public function test_rt_cannot_create_a_privileged_account(): void
    {
        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);

        Sanctum::actingAs($rt);

        $this->postJson('/api/admin/users', [
            'name' => 'Admin Palsu',
            'username' => 'admin-palsu',
            'password' => 'secret123',
            'role' => 'admin',
            'rt' => '002',
        ])->assertStatus(403);

        $this->assertDatabaseMissing('users', ['username' => 'admin-palsu']);
    }

    public function test_rt_can_only_create_warga_in_its_own_area(): void
    {
        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);

        Sanctum::actingAs($rt);

        $this->postJson('/api/admin/users', [
            'name' => 'Warga Baru',
            'username' => 'warga-baru',
            'password' => 'secret123',
            'role' => 'warga',
            'rt' => '002',
            'alamat' => 'Alamat Baru',
        ])->assertOk();

        $this->assertDatabaseHas('users', [
            'username' => 'warga-baru',
            'role' => 'warga',
            'rt' => '001',
        ]);
    }

    public function test_rt_cannot_update_privileged_or_cross_area_accounts(): void
    {
        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);
        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);
        $wargaRtLain = User::create([
            'name' => 'Warga RT 002',
            'username' => 'warga002',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '002',
        ]);

        Sanctum::actingAs($rt);

        $payload = [
            'name' => 'Diubah RT',
            'username' => 'diubah-rt',
            'role' => 'warga',
            'rt' => '001',
        ];

        $this->putJson("/api/admin/users/{$admin->id}", $payload)->assertStatus(403);
        $this->putJson("/api/admin/users/{$wargaRtLain->id}", $payload)->assertStatus(403);

        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin']);
        $this->assertDatabaseHas('users', ['id' => $wargaRtLain->id, 'rt' => '002']);
    }

    public function test_rt_user_listing_is_limited_to_its_area_and_hides_secrets(): void
    {
        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);
        User::create([
            'name' => 'Warga RT 001',
            'username' => 'warga001',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '001',
        ]);
        User::create([
            'name' => 'Warga RT 002',
            'username' => 'warga002',
            'password' => bcrypt('secret'),
            'role' => 'warga',
            'rt' => '002',
        ]);

        Sanctum::actingAs($rt);

        $response = $this->getJson('/api/admin/users')->assertOk();
        $rows = $response->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame('warga001', $rows[0]['username']);
        $this->assertArrayNotHasKey('password', $rows[0]);
        $this->assertArrayNotHasKey('remember_token', $rows[0]);
    }

    public function test_admin_user_listing_hides_authentication_secrets(): void
    {
        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/users')->assertOk();
        $row = $response->json('data.0');

        $this->assertArrayNotHasKey('password', $row);
        $this->assertArrayNotHasKey('remember_token', $row);
    }

    public function test_rt_can_only_update_pengajuan_in_its_own_area(): void
    {
        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);
        $wargaRtLain = Warga::create([
            'nama_lengkap' => 'Warga RT 002',
            'alamat' => 'Alamat',
            'rt' => '002',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);
        $pengajuan = Pengajuan::create([
            'id_warga' => $wargaRtLain->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        Sanctum::actingAs($rt);

        $this->putJson("/api/admin/pengajuan/{$pengajuan->id_pengajuan}/status", [
            'status' => 'disetujui',
        ])->assertStatus(403);
        $this->putJson("/api/admin/pengajuan/{$pengajuan->id_pengajuan}/kuesioner", [
            'jawaban_mentah' => ['q1' => '1 KK'],
        ])->assertStatus(403);

        $this->assertDatabaseHas('pengajuan', [
            'id_pengajuan' => $pengajuan->id_pengajuan,
            'status' => 'menunggu',
        ]);
    }

    public function test_admin_has_full_access(): void
    {
        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/users')->assertStatus(200);
        $this->getJson('/api/logs')->assertStatus(200);
        $this->getJson('/api/admin/pengajuan')->assertStatus(200);
    }
}
