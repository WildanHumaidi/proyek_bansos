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
}
