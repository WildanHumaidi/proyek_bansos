<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P2-08 / P0-05: satu pengajuan TIDAK boleh memiliki dua penilaian untuk
 * kriteria yang sama. Data existing sudah diverifikasi bebas duplikat oleh
 * audit (940 penilaian = 94 × 10, 0 duplikat), sehingga unique constraint
 * dapat dipasang langsung tanpa preflight data.
 *
 * Index kompatibel MySQL & SQLite; rollback men-drop index saja.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('penilaian', function (Blueprint $table) {
            $table->unique(['id_pengajuan', 'id_kriteria'], 'penilaian_pengajuan_kriteria_unique');
        });
    }

    public function down(): void
    {
        Schema::table('penilaian', function (Blueprint $table) {
            $table->dropUnique('penilaian_pengajuan_kriteria_unique');
        });
    }
};