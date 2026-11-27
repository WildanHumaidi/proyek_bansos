<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_endpoint_has_rate_limiting(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/login', [
                'username' => 'dummy',
                'password' => 'wrongpass',
            ]);
        }

        // 11th request should be rate-limited (HTTP 429)
        $response = $this->postJson('/api/login', [
            'username' => 'dummy',
            'password' => 'wrongpass',
        ]);

        $response->assertStatus(429);
    }

    public function test_login_dibatasi_per_akun_bukan_global(): void
    {
        // Semua klien di produksi datang dari satu IP edge, jadi batas harus
        // menempel ke akun: akun yang diserang terkunci, akun lain tetap bisa masuk.
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'username' => 'dummy',
                'password' => 'wrongpass',
            ])->assertStatus(401);
        }

        $this->postJson('/api/login', [
            'username' => 'dummy',
            'password' => 'wrongpass',
        ])->assertStatus(429);

        $this->postJson('/api/login', [
            'username' => 'akunlain',
            'password' => 'wrongpass',
        ])->assertStatus(401);
    }
}
