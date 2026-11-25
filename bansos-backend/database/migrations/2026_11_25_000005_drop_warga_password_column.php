<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P3-26 — hapus kolom `warga.password`.
 *
 * Kolom ini ditulis tiga kali (AuthController, ImportWargaSeeder,
 * AdminRtController) tetapi tidak pernah dibaca: autentikasi memakai tabel
 * `users`, bukan `warga`. Menyimpan hash kata sandi yang tidak dipakai adalah
 * risiko tanpa manfaat — dan menyiratkan dua sumber kredensial yang berbeda.
 *
 * Migrasi 2026_11_25_000002 sudah membuatnya nullable sebagai langkah antara;
 * sekarang kolomnya dihapus. Semua jalur tulis sudah berhenti mengisinya
 * (`password` tidak ada di `$fillable` model Warga).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('warga', 'password')) {
            Schema::table('warga', function (Blueprint $table) {
                $table->dropColumn('password');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('warga', 'password')) {
            Schema::table('warga', function (Blueprint $table) {
                $table->string('password')->nullable()->after('rw');
            });
        }
    }
};
