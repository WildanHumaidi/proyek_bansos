<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P3-33 — index untuk filter `pengajuan.status`.
 *
 * SawCalculator::ambilDataEligible() selalu memfilter `status = 'disetujui'`,
 * dan itu satu-satunya jalur yang menyentuh seluruh tabel pengajuan. Tanpa
 * index, setiap kalkulasi SAW memindai tabel penuh.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->index('status', 'pengajuan_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropIndex('pengajuan_status_index');
        });
    }
};
