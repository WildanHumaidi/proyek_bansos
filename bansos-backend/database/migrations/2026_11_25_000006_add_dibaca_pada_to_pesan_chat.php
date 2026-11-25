<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P3-30 — status baca pesan chat.
 *
 * Tanpa kolom ini UI tidak punya cara membedakan "pesan baru" dari "pesan lama";
 * badge jumlah pesan harus dihitung dari panjang array (ikut menghitung pesan
 * sendiri) dan tidak pernah kembali ke nol.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('pesan_chat', 'dibaca_pada')) {
            Schema::table('pesan_chat', function (Blueprint $table) {
                $table->timestamp('dibaca_pada')->nullable()->after('isi_pesan');
                $table->index(['id_pengajuan', 'dibaca_pada'], 'pesan_chat_belum_dibaca_index');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('pesan_chat', 'dibaca_pada')) {
            Schema::table('pesan_chat', function (Blueprint $table) {
                $table->dropIndex('pesan_chat_belum_dibaca_index');
                $table->dropColumn('dibaca_pada');
            });
        }
    }
};
