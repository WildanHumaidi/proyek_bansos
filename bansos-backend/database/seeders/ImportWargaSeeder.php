<?php

namespace Database\Seeders;

use App\Services\CsvImporter;
use Illuminate\Database\Seeder;

/**
 * Impor data warga dari CSV resmi — via CsvImporter (SSOT) agar perilakunya
 * identik dengan endpoint import admin (P0-01/03/04):
 *  - mapping jawaban wajib 100% atau baris gagal (tidak ada fallback);
 *  - status pengajuan = 'menunggu' (tidak ada auto-approve);
 *  - tidak menimpa warga dengan nama sama;
 *  - RT (dan seluruh kolom) dibaca dari HEADER, bukan posisi tetap.
 *
 * Karena kebijakan ini, file CSV nyata `database/data/data_warga.csv` yang
 * berisi baris kosong/duplikat/tak-dikenal akan membuat seeder MELAPORKAN
 * baris gagal alih-alih diam-diam menghasilkan data rusak.
 */
class ImportWargaSeeder extends Seeder
{
    public function run()
    {
        $path = database_path('data/data_warga.csv');

        $this->command?->comment('Membaca '.$path.' ...');

        $isi = file_get_contents($path);

        $hasil = (new CsvImporter)->impor($isi);

        if ($hasil['error_header']) {
            throw new \RuntimeException('ImportWargaSeeder: '.$hasil['error_header']);
        }

        if ($hasil['banyak_gagal'] > 0) {
            // Baris yang gagal membuat seluruh impor di-rollback (atomic).
            $barisGagal = collect($hasil['baris'])
                ->filter(fn ($b) => $b['status'] === 'gagal')
                ->map(fn ($b) => "baris {$b['baris']}: {$b['detail']}")
                ->implode("\n");

            throw new \RuntimeException(
                "ImportWargaSeeder: {$hasil['banyak_gagal']} baris gagal dipetakan sehingga impor dibatalkan.\n{$barisGagal}"
            );
        }

        $this->command?->info(
            "ImportWargaSeeder: {$hasil['banyak_import']} warga dibuat (menunggu verifikasi), "
            ."{$hasil['banyak_skip']} duplikat dilewati."
        );
    }
}