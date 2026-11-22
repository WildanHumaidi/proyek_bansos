<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Menghubungkan `users` ke `warga` lewat ID, bukan nama.
 *
 * Sebelumnya seluruh pencocokan dilakukan dengan `warga.nama_lengkap = users.name`.
 * Karena nama bukan identitas unik (ada 6 nama duplikat di data nyata), satu akun
 * bisa membaca status/chat milik orang lain dan menimpa data warga lain saat submit.
 *
 * Migrasi ini:
 * 1. Menambah kolom `users.id_warga` (nullable, unique, FK ke warga).
 * 2. Backfill: pasangkan akun warga ke baris `warga` berdasarkan nama HANYA bila
 *    namanya unik; nama duplikat sengaja dibiarkan NULL agar admin memilih manual
 *    lewat endpoint tautan, alih-alih menebak dan salah pasang.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('id_warga')->nullable()->after('alamat');
            $table->unique('id_warga', 'users_id_warga_unique');
            $table->foreign('id_warga')->references('id_warga')->on('warga')->onDelete('set null');
        });

        $namaUnik = DB::table('warga')
            ->selectRaw('TRIM(nama_lengkap) as nama, COUNT(*) as jumlah')
            ->groupBy(DB::raw('TRIM(nama_lengkap)'))
            ->having('jumlah', 1)
            ->pluck('nama')
            ->filter(fn ($nama) => trim((string) $nama) !== '')
            ->all();

        if (empty($namaUnik)) {
            return;
        }

        $petaWarga = DB::table('warga')
            ->whereIn(DB::raw('TRIM(nama_lengkap)'), $namaUnik)
            ->get(['id_warga', 'nama_lengkap'])
            ->mapWithKeys(fn ($w) => [trim($w->nama_lengkap) => $w->id_warga])
            ->all();

        $akunWarga = DB::table('users')->where('role', 'warga')->get(['id', 'name']);

        foreach ($akunWarga as $user) {
            $idWarga = $petaWarga[trim((string) $user->name)] ?? null;

            if ($idWarga !== null) {
                DB::table('users')->where('id', $user->id)->update(['id_warga' => $idWarga]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['id_warga']);
            $table->dropUnique('users_id_warga_unique');
            $table->dropColumn('id_warga');
        });
    }
};
