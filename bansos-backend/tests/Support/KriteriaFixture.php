<?php

namespace Tests\Support;

use App\Models\Kriteria;
use App\Models\SubKriteria;

/**
 * Label & nilai sub-kriteria yang sama dengan database acuan
 * (`docs/archive/db_bansos_saw.sql`) dan jurnal Tabel 1-3.
 * Dipakai fixture test supaya pencocokan jawaban kuesioner realistis.
 */
class KriteriaFixture
{
    public const OPSI = [
        1 => ['> 3 KK', '3 KK', '2 KK', '1 KK'],
        2 => ['> 6 Orang', '5 Orang', '4 Orang', '1 - 3 Orang'],
        3 => ['Tidak Sekolah / Tidak Tamat SD', 'SD', 'SMP', 'SMA / SMK / PT'],
        4 => ['> 3 Orang', '2 Orang', '1 Orang', 'Tidak Ada'],
        5 => ['< 400 Ribu', '400 - 700 Ribu', '700 Ribu - 1 Juta', '> 1 Juta'],
        6 => ['< 400 Ribu', '400 - 700 Ribu', '700 Ribu - 1 Juta', '> 1 Juta'],
        7 => ['Magersari / Pakai Gratis', 'Sewa < 1 Juta', 'Milik Orang Tua / Warisan', 'Milik Sendiri / Sewa'],
        8 => ['Sumur Milik Tetangga', 'Sumur Milik Sendiri', 'PDAM Terbatas', 'PDAM Bebas / Air Kemasan'],
        9 => ['Listrik Numpang', 'Listrik 450 watt', 'Listrik 900 watt', 'Listrik > 900 watt'],
        10 => ['Jalan Kaki / Sepeda / Motor Seadanya', 'Sepeda Motor 1 Buah, dalam Kondisi Baik', 'Sepeda Motor > 1 Buah, dalam Kondisi Baik', 'Mobil'],
    ];

    public const NILAI = [10, 7.5, 5, 2.5];

    /** Nilai sub-kriteria untuk kriteria cost dibalik: sejahtera = 10, butuh = 2.5. */
    public static function nilaiUntuk(int $idKriteria, int $index): float
    {
        $nilai = self::NILAI[$index];

        return in_array($idKriteria, [1, 2, 4], true) ? $nilai : 12.5 - $nilai;
    }

    public static function tipe(int $idKriteria): string
    {
        return in_array($idKriteria, [1, 2, 4], true) ? 'benefit' : 'cost';
    }

    /** Buat 10 kriteria + 40 sub-kriteria sesuai acuan. */
    public static function seedKriteria(): void
    {
        foreach (self::OPSI as $idKriteria => $opsi) {
            $kriteria = Kriteria::create([
                'nama_kriteria' => "Kriteria C{$idKriteria}",
                'tipe' => self::tipe($idKriteria),
                'bobot' => 10,
            ]);

            foreach ($opsi as $index => $keterangan) {
                SubKriteria::create([
                    'id_kriteria' => $kriteria->id_kriteria,
                    'keterangan' => $keterangan,
                    'nilai' => self::nilaiUntuk($idKriteria, $index),
                ]);
            }
        }
    }
}
