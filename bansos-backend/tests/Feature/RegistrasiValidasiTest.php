<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pesan validasi pendaftaran harus berbahasa Indonesia dan sesuai aturan
 * sebenarnya.
 *
 * Kenapa ada: form `/register` dulu menjanjikan "kata sandi minimal 6
 * karakter" (teks bantuan, placeholder, dan cek di sisi klien), sedangkan
 * server menolak di bawah 8 karakter. Pendaftar yang mengikuti petunjuk layar
 * lalu mendapat pesan galat bahasa Inggris mentah dari Laravel
 * ("The password field must be at least 8 characters.") tepat setelah menekan
 * tombol daftar. Guard ini menjaga tiga hal: ambang 8 karakter, pesan
 * Indonesia, dan tidak ada akun/warga setengah jadi saat validasi gagal.
 */
class RegistrasiValidasiTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $override = []): array
    {
        return array_merge([
            'nama_lengkap' => 'Pendaftar Uji',
            'username' => 'pendaftar_uji',
            'password' => 'rahasia123',
            'rt' => '001',
            'alamat' => 'Jl. Uji No. 1',
        ], $override);
    }

    public function test_kata_sandi_kurang_dari_8_ditolak_dengan_pesan_indonesia(): void
    {
        $response = $this->postJson('/api/register', $this->payload(['password' => 'rahasia']));

        $response->assertStatus(422)
            ->assertJsonValidationErrors('password');

        $pesan = $response->json('errors.password.0');

        $this->assertSame('Kata sandi minimal 8 karakter.', $pesan);
        $this->assertStringNotContainsString('must be at least', $pesan);

        $this->assertSame(0, User::where('username', 'pendaftar_uji')->count());
        $this->assertSame(0, Warga::where('nama_lengkap', 'Pendaftar Uji')->count());
    }

    public function test_username_ganda_ditolak_dengan_pesan_indonesia(): void
    {
        User::create([
            'name' => 'Sudah Ada',
            'username' => 'pendaftar_uji',
            'password' => 'rahasia123',
            'role' => 'warga',
        ]);

        $response = $this->postJson('/api/register', $this->payload());

        $response->assertStatus(422);
        $this->assertSame('Username sudah dipakai. Pilih yang lain.', $response->json('errors.username.0'));
    }

    public function test_kata_sandi_8_karakter_diterima(): void
    {
        $this->postJson('/api/register', $this->payload(['password' => 'rahasia1']))
            ->assertStatus(201);

        $this->assertSame(1, User::where('username', 'pendaftar_uji')->count());
    }
}
