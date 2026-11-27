<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Ganti password mandiri (semua peran yang sedang login).
 *
 * Aturan: password lama wajib benar, password baru minimal 8 karakter dan
 * dikonfirmasi, tidak boleh sama dengan password lama. Setelah berubah, token
 * lain dicabut tetapi sesi yang sedang dipakai tetap jalan.
 */
class GantiPasswordTest extends TestCase
{
    use RefreshDatabase;

    private function warga(string $sandi = 'lama12345'): User
    {
        return User::create([
            'name' => 'Warga Uji',
            'username' => 'wargauji',
            'password' => bcrypt($sandi),
            'role' => 'warga',
            'rt' => '001',
        ]);
    }

    public function test_password_berhasil_diganti_dan_password_baru_bisa_dipakai_login(): void
    {
        $user = $this->warga();
        Sanctum::actingAs($user);

        $this->postJson('/api/ganti-password', [
            'current_password' => 'lama12345',
            'password' => 'baru12345',
            'password_confirmation' => 'baru12345',
        ])->assertOk()->assertJsonPath('success', true);

        $this->assertTrue(Hash::check('baru12345', $user->fresh()->password));

        // Login: password lama ditolak, password baru diterima.
        Auth::shouldUse('web');
        $this->postJson('/api/login', ['username' => 'wargauji', 'password' => 'lama12345'])
            ->assertStatus(401);
        $this->postJson('/api/login', ['username' => 'wargauji', 'password' => 'baru12345'])
            ->assertOk()->assertJsonStructure(['token']);
    }

    public function test_password_lama_salah_ditolak_422(): void
    {
        $user = $this->warga();
        Sanctum::actingAs($user);

        $this->postJson('/api/ganti-password', [
            'current_password' => 'salahbanget',
            'password' => 'baru12345',
            'password_confirmation' => 'baru12345',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');

        $this->assertTrue(Hash::check('lama12345', $user->fresh()->password));
    }

    public function test_password_baru_kurang_dari_8_atau_tidak_cocok_ditolak(): void
    {
        $user = $this->warga();
        Sanctum::actingAs($user);

        $this->postJson('/api/ganti-password', [
            'current_password' => 'lama12345',
            'password' => 'pendek',
            'password_confirmation' => 'pendek',
        ])->assertStatus(422)->assertJsonValidationErrors('password');

        $this->postJson('/api/ganti-password', [
            'current_password' => 'lama12345',
            'password' => 'baru12345',
            'password_confirmation' => 'beda12345',
        ])->assertStatus(422)->assertJsonValidationErrors('password');

        $this->assertTrue(Hash::check('lama12345', $user->fresh()->password));
    }

    public function test_password_baru_sama_dengan_lama_ditolak(): void
    {
        $user = $this->warga();
        Sanctum::actingAs($user);

        $this->postJson('/api/ganti-password', [
            'current_password' => 'lama12345',
            'password' => 'lama12345',
            'password_confirmation' => 'lama12345',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_token_lain_dicabut_sesi_yang_dipakai_tetap_aktif(): void
    {
        $user = $this->warga();
        $tokenLain = $user->createToken('hp-lain');
        $tokenIni = $user->createToken('hp-ini');

        $this->withHeader('Authorization', 'Bearer '.$tokenIni->plainTextToken)
            ->postJson('/api/ganti-password', [
                'current_password' => 'lama12345',
                'password' => 'baru12345',
                'password_confirmation' => 'baru12345',
            ])
            ->assertOk();

        $sisa = $user->tokens()->pluck('id')->all();
        $this->assertSame([$tokenIni->accessToken->id], $sisa);
        $this->assertNotContains($tokenLain->accessToken->id, $sisa);

        // Sesi ini masih bisa memakai endpoint terproteksi.
        $this->withHeader('Authorization', 'Bearer '.$tokenIni->plainTextToken)
            ->getJson('/api/pengaduan')
            ->assertOk();
    }
}