<?php

namespace Database\Seeders;

use App\Models\Kriteria;
use App\Models\SubKriteria;
use Illuminate\Database\Seeder;

class KriteriaSeeder extends Seeder
{
    public function run()
    {
        // Skala nilai mengikuti acuan jurnal (Tabel 2 & 3):
        //   benefit (C1, C2, C4) → makin besar nilai makin diprioritaskan (x / max)
        //   cost (C3, C5-C10)    → makin KECIL nilai makin diprioritaskan (min / x)
        // Jadi pada kriteria cost, kondisi paling sejahtera bernilai 10 dan kondisi
        // paling membutuhkan bernilai 2.5. Nilai ini identik dengan
        // `docs/archive/db_bansos_saw.sql`; jangan dibalik tanpa mengubah SawController.
        $kriteriaData = [
            [
                'nama_kriteria' => 'Jumlah KK dalam 1 Rumah',
                'tipe' => 'benefit',
                'bobot' => 10,
                'sub' => [
                    ['keterangan' => '> 3 KK', 'nilai' => 10],
                    ['keterangan' => '3 KK', 'nilai' => 7.5],
                    ['keterangan' => '2 KK', 'nilai' => 5],
                    ['keterangan' => '1 KK', 'nilai' => 2.5],
                ],
            ],
            [
                'nama_kriteria' => 'Jumlah Anggota Keluarga dalam 1 Rumah',
                'tipe' => 'benefit',
                'bobot' => 10,
                'sub' => [
                    ['keterangan' => '> 6 Orang', 'nilai' => 10],
                    ['keterangan' => '5 Orang', 'nilai' => 7.5],
                    ['keterangan' => '4 Orang', 'nilai' => 5],
                    ['keterangan' => '1 - 3 Orang', 'nilai' => 2.5],
                ],
            ],
            [
                'nama_kriteria' => 'Pendidikan Kepala Keluarga (KK)',
                'tipe' => 'cost',
                'bobot' => 10,
                'sub' => [
                    ['keterangan' => 'Tidak Sekolah / Tidak Tamat SD', 'nilai' => 2.5],
                    ['keterangan' => 'SD', 'nilai' => 5],
                    ['keterangan' => 'SMP', 'nilai' => 7.5],
                    ['keterangan' => 'SMA / SMK / PT', 'nilai' => 10],
                ],
            ],
            [
                'nama_kriteria' => 'Jumlah Anggota Keluarga Masih Sekolah',
                'tipe' => 'benefit',
                'bobot' => 10,
                'sub' => [
                    ['keterangan' => '> 3 Orang', 'nilai' => 10],
                    ['keterangan' => '2 Orang', 'nilai' => 7.5],
                    ['keterangan' => '1 Orang', 'nilai' => 5],
                    ['keterangan' => 'Tidak Ada', 'nilai' => 2.5],
                ],
            ],
            [
                'nama_kriteria' => 'Pengeluaran Satu Jiwa dalam Keluarga Perbulan',
                'tipe' => 'cost',
                'bobot' => 10,
                'sub' => [
                    ['keterangan' => '< 400 Ribu', 'nilai' => 2.5],
                    ['keterangan' => '400 - 700 Ribu', 'nilai' => 5],
                    ['keterangan' => '700 Ribu - 1 Juta', 'nilai' => 7.5],
                    ['keterangan' => '> 1 Juta', 'nilai' => 10],
                ],
            ],
            [
                'nama_kriteria' => 'Penghasilan Satu Jiwa dalam Keluarga Perbulan',
                'tipe' => 'cost',
                'bobot' => 10,
                'sub' => [
                    ['keterangan' => '< 400 Ribu', 'nilai' => 2.5],
                    ['keterangan' => '400 - 700 Ribu', 'nilai' => 5],
                    ['keterangan' => '700 Ribu - 1 Juta', 'nilai' => 7.5],
                    ['keterangan' => '> 1 Juta', 'nilai' => 10],
                ],
            ],
            [
                'nama_kriteria' => 'Status Kepemilikan Rumah',
                'tipe' => 'cost',
                'bobot' => 10,
                'sub' => [
                    ['keterangan' => 'Magersari / Pakai Gratis', 'nilai' => 2.5],
                    ['keterangan' => 'Sewa < 1 Juta', 'nilai' => 5],
                    ['keterangan' => 'Milik Orang Tua / Warisan', 'nilai' => 7.5],
                    ['keterangan' => 'Milik Sendiri / Sewa', 'nilai' => 10],
                ],
            ],
            [
                'nama_kriteria' => 'Sumber Air Bersih',
                'tipe' => 'cost',
                'bobot' => 10,
                'sub' => [
                    ['keterangan' => 'Sumur Milik Tetangga', 'nilai' => 2.5],
                    ['keterangan' => 'Sumur Milik Sendiri', 'nilai' => 5],
                    ['keterangan' => 'PDAM Terbatas', 'nilai' => 7.5],
                    ['keterangan' => 'PDAM Bebas / Air Kemasan', 'nilai' => 10],
                ],
            ],
            [
                'nama_kriteria' => 'Penerangan Rumah',
                'tipe' => 'cost',
                'bobot' => 10,
                'sub' => [
                    ['keterangan' => 'Listrik Numpang', 'nilai' => 2.5],
                    ['keterangan' => 'Listrik 450 watt', 'nilai' => 5],
                    ['keterangan' => 'Listrik 900 watt', 'nilai' => 7.5],
                    ['keterangan' => 'Listrik > 900 watt', 'nilai' => 10],
                ],
            ],
            [
                'nama_kriteria' => 'Transportasi',
                'tipe' => 'cost',
                'bobot' => 10,
                'sub' => [
                    ['keterangan' => 'Jalan Kaki / Sepeda / Motor Seadanya', 'nilai' => 2.5],
                    ['keterangan' => 'Sepeda Motor 1 Buah, dalam Kondisi Baik', 'nilai' => 5],
                    ['keterangan' => 'Sepeda Motor > 1 Buah, dalam Kondisi Baik', 'nilai' => 7.5],
                    ['keterangan' => 'Mobil', 'nilai' => 10],
                ],
            ],
        ];

        foreach ($kriteriaData as $data) {
            // P3-02 (idempoten): identitas stabil memakai nama_kriteria, bukan
            // ID database. Jalankan ulang tidak menggandakan kriteria/sub-kriteria.
            $kriteria = Kriteria::firstOrCreate(
                ['nama_kriteria' => $data['nama_kriteria']],
                ['tipe' => $data['tipe'], 'bobot' => $data['bobot']]
            );

            foreach ($data['sub'] as $sub) {
                SubKriteria::firstOrCreate(
                    [
                        'id_kriteria' => $kriteria->id_kriteria,
                        'keterangan' => $sub['keterangan'],
                    ],
                    ['nilai' => $sub['nilai']]
                );
            }
        }
    }
}
