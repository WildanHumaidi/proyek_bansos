<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P3-01: `warga.password` adalah kredensial mati — tidak pernah dibaca oleh
 * kode mana pun (BUKTI: tidak ada read path; tabel `users` yang mengelola
 * autentikasi). Langkah pertama (aman & reversible): kolom dijadikan nullable
 * agar aplikasi berhenti menulisnya, tanpa menghancurkan data live.
 * Penghapusan kolom penuh menyusul di fase berikutnya setelah tidak ada
 * dependency (lihat FIX_IMPLEMENTATION_REPORT.md).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('warga', function (Blueprint $table) {
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Kembalikan NOT NULL — hanya aman bila seluruh baris existing berisi
        // nilai; database testing selalu kosong ketika migrasi dijalankan.
        Schema::table('warga', function (Blueprint $table) {
            $table->string('password')->nullable(false)->change();
        });
    }
};