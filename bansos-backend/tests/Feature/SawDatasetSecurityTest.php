<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SawDatasetSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_to_saw_dataset_is_denied(): void
    {
        $response = $this->getJson('/api/saw/dataset');
        $response->assertStatus(401);
    }

    public function test_warga_cannot_access_saw_dataset(): void
    {
        $warga = User::create([
            'name' => 'Warga User',
            'username' => 'warga1',
            'password' => bcrypt('password'),
            'role' => 'warga',
            'rt' => '001',
        ]);

        Sanctum::actingAs($warga);

        $response = $this->getJson('/api/saw/dataset');
        $response->assertStatus(403);
    }

    public function test_rt_cannot_access_saw_dataset(): void
    {
        $rt = User::create([
            'name' => 'Ketua RT 001',
            'username' => 'rt001',
            'password' => bcrypt('password'),
            'role' => 'rt',
            'rt' => '001',
        ]);

        Sanctum::actingAs($rt);

        $response = $this->getJson('/api/saw/dataset');
        $response->assertStatus(403);
    }

    public function test_admin_and_rw_can_access_saw_dataset(): void
    {
        $admin = User::create([
            'name' => 'Admin System',
            'username' => 'admin',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        Sanctum::actingAs($admin);
        $responseAdmin = $this->getJson('/api/saw/dataset');
        $responseAdmin->assertStatus(200);

        $rw = User::create([
            'name' => 'Ketua RW 08',
            'username' => 'rw08',
            'password' => bcrypt('password'),
            'role' => 'rw',
        ]);

        Sanctum::actingAs($rw);
        $responseRw = $this->getJson('/api/saw/dataset');
        $responseRw->assertStatus(200);
    }
}
