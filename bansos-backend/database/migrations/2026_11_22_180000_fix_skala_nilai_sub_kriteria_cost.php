<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Menyelaraskan skala nilai sub-kriteria kriteria cost dengan acuan jurnal
 * (Tabel 2 & 3): cost memakai min/x, jadi kondisi paling sejahtera bernilai 10
 * dan paling membutuhkan bernilai 2.5.
 *
 * Database hasil import manual memiliki urutan terbalik untuk C3, C5-C10,
 * yang membuat min/x justru memprioritaskan warga paling sejahtera.
 * Idempoten: hanya membalik bila baris tersebut masih dalam kondisi terbalik.
 */
return new class extends Migration
{
    /** id_subkriteria => [nilai_live_terbalik, nilai_benar] */
    private array $perbaikan = [
        // C3 Pendidikan Kepala Keluarga
        9 => [10.0, 2.5],
        10 => [7.5, 5.0],
        11 => [5.0, 7.5],
        12 => [2.5, 10.0],
        // C5 Pengeluaran
        17 => [10.0, 2.5],
        18 => [7.5, 5.0],
        19 => [5.0, 7.5],
        20 => [2.5, 10.0],
        // C6 Penghasilan
        21 => [10.0, 2.5],
        22 => [7.5, 5.0],
        23 => [5.0, 7.5],
        24 => [2.5, 10.0],
        // C7 Status Kepemilikan Rumah
        25 => [10.0, 2.5],
        26 => [7.5, 5.0],
        27 => [5.0, 7.5],
        28 => [2.5, 10.0],
        // C8 Sumber Air Bersih
        29 => [10.0, 2.5],
        30 => [7.5, 5.0],
        31 => [5.0, 7.5],
        32 => [2.5, 10.0],
        // C9 Penerangan Rumah
        33 => [10.0, 2.5],
        34 => [7.5, 5.0],
        35 => [5.0, 7.5],
        36 => [2.5, 10.0],
        // C10 Transportasi
        37 => [10.0, 2.5],
        38 => [7.5, 5.0],
        39 => [5.0, 7.5],
        40 => [2.5, 10.0],
    ];

    public function up(): void
    {
        DB::transaction(function () {
            foreach ($this->perbaikan as $id => [$terbalik, $benar]) {
                DB::table('sub_kriteria')
                    ->where('id_subkriteria', $id)
                    ->where('nilai', $terbalik)
                    ->update(['nilai' => $benar, 'updated_at' => now()]);
            }
        });
    }

    public function down(): void
    {
        // Kembalikan ke kondisi sebelumnya (skala terbalik), hanya bila belum diubah.
        DB::transaction(function () {
            foreach ($this->perbaikan as $id => [$terbalik, $benar]) {
                DB::table('sub_kriteria')
                    ->where('id_subkriteria', $id)
                    ->where('nilai', $benar)
                    ->update(['nilai' => $terbalik, 'updated_at' => now()]);
            }
        });
    }
};
