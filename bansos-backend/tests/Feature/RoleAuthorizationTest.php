<?php

namespace Tests\Feature;

use App\Models\User;
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

    public function test_rt_can_access_rt_verification_endpoints(): void
    {
        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('secret'),
            'role' => 'rt',
            'rt' => '001',
        ]);

        Sanctum::actingAs($rt);

        $response = $this->getJson('/api/admin/pengajuan');
        $response->assertStatus(200);
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
