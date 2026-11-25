<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Riwayat pengajuan (P1-06).
 *
 * Satu warga hanya memiliki SATU baris `pengajuan` aktif (dijaga unique index
 * `pengajuan_id_warga_unique`). Saat warga mengajukan ulang setelah ditolak,
 * isi pengajuan lama (status + jawaban) diarsipkan ke tabel ini SEBELUM baris
 * yang sama diperbarui menjadi 'menunggu' dengan jawaban baru — histori tidak
 * pernah hilang, dan rancangan ini kompatibel dengan MySQL maupun SQLite.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_riwayat', function (Blueprint $table) {
            $table->id('id_riwayat');
            $table->unsignedBigInteger('id_pengajuan');
            $table->string('status_lama', 20);
            $table->text('jawaban_lama')->nullable();
            $table->string('diubah_oleh', 255)->nullable();
            $table->timestamps();

            $table->foreign('id_pengajuan')->references('id_pengajuan')->on('pengajuan')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_riwayat');
    }
};