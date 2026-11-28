<?php

namespace Tests\Feature;

use App\Models\SubKriteria;
use App\Services\JawabanMapper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\KriteriaFixture;
use Tests\TestCase;

/**
 * Setiap pilihan jawaban yang DITAMPILKAN form kuesioner harus bisa dipetakan
 * ke sub-kriteria. Kalau tidak, warga mengisi kuesioner dengan benar tetapi
 * pengajuannya ditolak saat disetujui RT ("jawaban tidak dikenal") — kegagalan
 * yang baru terlihat belakangan dan menyalahkan warga.
 *
 * Label di form sengaja memakai kalimat formulir asli (Google Form), sedangkan
 * `sub_kriteria.keterangan` memakai istilah kanonik jurnal. Jembatannya adalah
 * kamus alias di JawabanMapper; test ini menjaga seluruh 40 kombinasi tetap
 * terjembatani setelah salah satu sisi diubah.
 */
class OpsiKuesionerTerpetakanTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Cerminan PERTANYAAN di bansos-frontend/src/pages/WargaDashboard.jsx.
     * Kalau opsi di UI berubah, ubah di sini juga — itulah maksud guard ini.
     */
    private const OPSI_FORM = [
        1 => ['> 3 KK', '3 KK', '2 KK', '1 KK'],
        2 => ['>= 6 Orang', '5 Orang', '4 Orang', '1 - 3 Orang'],
        3 => [
            'Tidak Sekolah / Tidak Tamat Sekolah Dasar (SD)',
            'Sekolah Dasar (SD)',
            'Sekolah Menengah Pertama (SMP)',
            'SMA / SMK / S1',
        ],
        4 => ['>= 3 Orang', '2 Orang', '1 Orang', 'Tidak Ada'],
        5 => [
            '< Rp. 1.500.000',
            'Rp. 1.500.000 - Rp. 3.000.000',
            'Rp. 3.000.000 - Rp. 5.000.000',
            '> Rp. 5.000.000',
        ],
        6 => [
            '< Rp. 1.500.000',
            'Rp. 1.500.000 - Rp. 3.000.000',
            'Rp. 3.000.000 - Rp. 5.000.000',
            '> Rp. 5.000.000',
        ],
        7 => [
            'Menumpang / Tidak Memiliki Tempat Tinggal',
            'Sewa / Kontrak',
            'Milik Orang Tua / Saudara / Keluarga',
            'Milik Sendiri',
        ],
        8 => [
            'Menumpang / Tidak Memiliki Sumber Air',
            'Sumur (Bor/Gali)',
            'PDAM',
            'Air Kemasan / Air Galon',
        ],
        9 => ['Listrik Numpang', 'Listrik 450 Watt', 'Listrik 900 Watt', 'Listrik > 900 Watt'],
        10 => [
            'Jalan Kaki / Sepeda / Sepeda Motor Seadanya / Transportasi Umum',
            'Sepeda Motor 1 Unit dalam Kondisi Baik',
            'Sepeda Motor Lebih dari 1 Unit dalam Kondisi Baik',
            'Mobil',
        ],
    ];

    protected function setUp(): void
    {
        parent::setUp();
        KriteriaFixture::seedKriteria();
    }

    public function test_seluruh_opsi_form_kuesioner_bisa_dipetakan(): void
    {
        $subKriteria = SubKriteria::all();
        $gagal = [];

        foreach (self::OPSI_FORM as $idKriteria => $daftar) {
            $milikKriteria = $subKriteria->where('id_kriteria', $idKriteria);

            $this->assertCount(4, $milikKriteria, "C{$idKriteria} harus punya 4 sub-kriteria");

            foreach ($daftar as $jawaban) {
                $hasil = JawabanMapper::petakan($jawaban, $idKriteria, $milikKriteria);

                if (! $hasil['ok']) {
                    $gagal[] = "C{$idKriteria}: '{$jawaban}'";
                    continue;
                }

                // Sub-kriteria yang dipilih harus milik kriteria yang sama —
                // bukan milik kriteria lain yang kebetulan berlabel sama.
                $sub = $milikKriteria->firstWhere('id_subkriteria', $hasil['id_subkriteria']);
                $this->assertNotNull($sub, "C{$idKriteria}: id_subkriteria tidak ada di kriteria ini");
            }
        }

        $this->assertSame([], $gagal, 'Opsi form tidak terpetakan: '.implode(' | ', $gagal));
    }

    public function test_opsi_paling_membutuhkan_dan_paling_sejahtera_berlawanan_ujung(): void
    {
        $subKriteria = SubKriteria::all();

        // Skala jurnal: benefit besar = prioritas, cost kecil = prioritas.
        // Opsi pertama tiap pertanyaan = kondisi paling membutuhkan, opsi
        // terakhir = paling sejahtera. Jadi nilai DB harus naik pada kriteria
        // benefit (1,2,4) dan turun pada kriteria cost.
        $benefit = [1, 2, 4];

        foreach (self::OPSI_FORM as $idKriteria => $daftar) {
            $milikKriteria = $subKriteria->where('id_kriteria', $idKriteria);

            $pertama = JawabanMapper::petakan($daftar[0], $idKriteria, $milikKriteria);
            $terakhir = JawabanMapper::petakan($daftar[count($daftar) - 1], $idKriteria, $milikKriteria);

            $nilaiPertama = (float) $milikKriteria->firstWhere('id_subkriteria', $pertama['id_subkriteria'])->nilai;
            $nilaiTerakhir = (float) $milikKriteria->firstWhere('id_subkriteria', $terakhir['id_subkriteria'])->nilai;

            if (in_array($idKriteria, $benefit, true)) {
                $this->assertGreaterThan(
                    $nilaiTerakhir,
                    $nilaiPertama,
                    "C{$idKriteria} (benefit): kondisi paling membutuhkan harus bernilai LEBIH TINGGI"
                );
            } else {
                $this->assertLessThan(
                    $nilaiTerakhir,
                    $nilaiPertama,
                    "C{$idKriteria} (cost): kondisi paling membutuhkan harus bernilai LEBIH RENDAH"
                );
            }
        }
    }
}
