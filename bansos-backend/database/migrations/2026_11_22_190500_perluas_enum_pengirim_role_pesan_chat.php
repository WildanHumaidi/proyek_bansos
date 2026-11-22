<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `pesan_chat.pengirim_role` sebelumnya hanya mengizinkan 'warga' dan 'rt',
 * sehingga pesan dari admin/RW gagal disimpan (500) atau — setelah controller
 * diperbaiki — akan melanggar constraint. Enum diperluas keempat peran.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->ubahEnum(['warga', 'rt', 'rw', 'admin']);
    }

    public function down(): void
    {
        $this->ubahEnum(['warga', 'rt']);
    }

    private function ubahEnum(array $nilai): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // SQLite menyimpan enum sebagai varchar + CHECK constraint; change()
            // membangun ulang tabel dengan constraint baru.
            Schema::table('pesan_chat', function (Blueprint $table) use ($nilai) {
                $table->enum('pengirim_role', $nilai)->change();
            });

            return;
        }

        $daftar = "'".implode("','", $nilai)."'";
        DB::statement("ALTER TABLE `pesan_chat` MODIFY `pengirim_role` ENUM({$daftar}) NOT NULL");
    }
};
