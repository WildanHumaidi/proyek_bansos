<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P2-01 — Sub-sistem pengaduan (keluhan) warga.
 *
 * Jurnal: warga mengirim keluhan → RT menerima/merespons (pending/diterima/
 * ditolak) → admin dapat mengambil alih saat RT tidak tersedia → warga dapat
 * melihat status & riwayat. Entitas ini TERPISAH dari chat yang menempel pada
 * pengajuan; chat pada pengaduan tetap tercatat via id_pengajuan NULL +
 * id_pengaduan (dibuat pada migrasi pesan_chat terkait).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengaduan', function (Blueprint $table) {
            $table->id('id_pengaduan');
            $table->unsignedBigInteger('id_warga');
            $table->unsignedBigInteger('id_pengajuan')->nullable()->comment('konteks pengajuan terkait, opsional');
            $table->string('kategori', 50)->default('umum');
            $table->text('isi');
            $table->enum('status', ['pending', 'diterima', 'ditolak'])->default('pending');
            $table->string('ditangani_oleh', 120)->nullable()->comment('username aktor terakhir');
            $table->string('tanggapan', 1000)->nullable();
            $table->timestamps();

            $table->foreign('id_warga')->references('id_warga')->on('warga')->onDelete('cascade');
            $table->foreign('id_pengajuan')->references('id_pengajuan')->on('pengajuan')->onDelete('set null');
            $table->index(['status', 'created_at']);
        });

        Schema::create('pengaduan_riwayat', function (Blueprint $table) {
            $table->id('id_riwayat');
            $table->unsignedBigInteger('id_pengaduan');
            $table->string('status_lama', 20)->nullable();
            $table->string('status_baru', 20);
            $table->string('diubah_oleh', 120)->nullable();
            $table->string('catatan', 1000)->nullable();
            $table->timestamps();

            $table->foreign('id_pengaduan')->references('id_pengaduan')->on('pengaduan')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaduan_riwayat');
        Schema::dropIfExists('pengaduan');
    }
};