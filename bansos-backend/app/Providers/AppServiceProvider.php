<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->daftarkanRateLimiter();
    }

    /**
     * P3-32 — pembatas laju untuk endpoint berat.
     *
     * Sebelumnya hanya /login dan /register yang dibatasi. Endpoint berikut
     * memicu kerja berat (agregasi seluruh matriks, tulis massal, tulis per
     * pesan) dan bisa dipakai menghabiskan CPU/DB bila dipanggil berulang:
     *
     *   saw     — GET /saw/hitung, /saw/report/export (baca seluruh matriks)
     *   import  — POST /admin/pengajuan/import, /admin/fix-data (tulis massal)
     *   chat    — POST /chat/{id} (tulis per pesan)
     *
     * Batas dihitung per pengguna (bukan per IP) karena semua endpoint ini di
     * balik autentikasi — beberapa RT bisa berbagi satu IP kantor.
     */
    protected function daftarkanRateLimiter(): void
    {
        RateLimiter::for('saw', function (Request $request) {
            return Limit::perMinute(60)->by($this->kunciPengguna($request));
        });

        RateLimiter::for('import', function (Request $request) {
            return Limit::perMinute(10)->by($this->kunciPengguna($request));
        });

        RateLimiter::for('chat', function (Request $request) {
            return Limit::perMinute(30)->by($this->kunciPengguna($request));
        });
    }

    /** Kunci pembatas: id pengguna bila login, jika tidak alamat IP. */
    protected function kunciPengguna(Request $request): string
    {
        $user = $request->user();

        return $user ? 'user:'.$user->getAuthIdentifier() : 'ip:'.$request->ip();
    }
}
