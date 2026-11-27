<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Import XLSX untuk pengajuan warga.
 *
 * Membaca sheet pertama menjadi baris kanonik yang bentuknya IDENTIK dengan
 * hasil parser CSV, lalu menyerahkannya ke `CsvImporter::prosesBarisData()`.
 * Semua kebijakan impor (dedup, akun otomatis, status 'menunggu', atomic)
 * tetap satu tempat di CsvImporter — tidak ada aturan kedua di sini.
 *
 * Format yang diterima sama dengan CSV: header berisi kolom NAMA, ALAMAT, RT
 * dan tepat 10 kolom jawaban (q1..q10). Baris kosong dilewati diam-diam.
 */
class XlsxImporter
{
    /**
     * @return array<int, array{nama:string, alamat:string, rt:string, jawaban:array<int,string>}>
     *
     * @throws CsvHeaderException — sheet kosong / header tidak sesuai
     */
    public function parse(string $path): array
    {
        $reader = IOFactory::createReaderForFile($path);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($path);

        try {
            $sheet = $spreadsheet->getSheet(0);
            $baris = $this->bacaSheet($sheet);
        } finally {
            $spreadsheet->disconnectWorksheets();
        }

        if ($baris === []) {
            throw new CsvHeaderException('File XLSX kosong.');
        }

        $peta = (new CsvImporter)->petakanHeader($baris[0]);

        $hasil = [];
        $nomorBaris = 1; // nomor baris fisik: 1 = header

        foreach (array_slice($baris, 1) as $sel) {
            $nomorBaris++;

            // Baris kosong murni (semua sel kosong) dilewati diam-diam.
            if (trim(implode('', $sel)) === '') {
                continue;
            }

            $hasil[$nomorBaris] = (new CsvImporter)->barisDariSel($sel, $peta);
        }

        return $hasil;
    }

    /**
     * Ambil seluruh baris sheet sebagai array string, tanpa sel kosong di ujung.
     *
     * @return array<int, array<int, string>>
     */
    private function bacaSheet(Worksheet $sheet): array
    {
        $tertinggi = $sheet->getHighestDataRow();
        $terlebar = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString(
            $sheet->getHighestDataColumn()
        );

        if ($tertinggi < 1 || $terlebar < 1) {
            return [];
        }

        $baris = [];

        for ($r = 1; $r <= $tertinggi; $r++) {
            $sel = [];

            for ($c = 1; $c <= $terlebar; $c++) {
                $nilai = $sheet->getCell([$c, $r])->getValue();

                // Angka RT bisa tersimpan sebagai float (1.0) — tampilkan bulat.
                if (is_float($nilai) && $nilai === floor($nilai)) {
                    $nilai = (int) $nilai;
                }

                $sel[] = trim((string) ($nilai ?? ''));
            }

            $baris[] = $sel;
        }

        return $baris;
    }
}
