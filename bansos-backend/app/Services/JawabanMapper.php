<?php

namespace App\Services;

use App\Models\SubKriteria;
use Illuminate\Support\Collection;

/**
 * Pemetaan jawaban (CSV / kuesioner) menjadi sub-kriteria.
 *
 * SINGLE SOURCE OF TRUTH untuk seluruh jalur yang mengubah jawaban menjadi
 * penilaian: seeder import, endpoint import CSV, approval, dan sinkronisasi
 * kuesioner. Sebelumnya tiap jalur punya heuristic masing-masing dengan hasil
 * berbeda (LIKE substring, dua arah str_contains, fallback skor minimum) —
 * yang menyebabkan 55,7 % sel CSV salah-petakan secara diam-diam.
 *
 * Aturan:
 *  - Tidak ada fallback. Jawaban yang tidak dikenal menghasilkan error
 *    terstruktur, bukan skor minimum.
 *  - Pencocokan memakai normalisasi teks deterministik + kamus alias eksplisit
 *    yang telah diverifikasi maknanya terhadap data CSV nyata.
 *  - Hasil selalu menunjuk ke sub-kriteria milik kriteria yang benar.
 */
class JawabanMapper
{
    /** Kamus alias: id_kriteria => [ jawaban_CSV_kasus_apa_pun => keterangan DB ]. */
    private const ALIAS = [
        2 => ['>= 6 orang' => '> 6 Orang'],
        3 => [
            'sma / smk / s1' => 'SMA / SMK / PT',
            'sekolah dasar (sd)' => 'SD',
            'sekolah menengah pertama (smp)' => 'SMP',
            'tidak sekolah / tidak tamat sekolah dasar (sd)' => 'Tidak Sekolah / Tidak Tamat SD',
        ],
        4 => ['>= 3 orang' => '> 3 Orang'],
        5 => [
            '> rp. 5.000.000' => '> 1 Juta',
            'rp. 3.000.000 - rp. 5.000.000' => '700 Ribu - 1 Juta',
            'rp. 1.500.000 - rp. 3.000.000' => '400 - 700 Ribu',
            '< rp. 1.500.000' => '< 400 Ribu',
        ],
        6 => [
            '> rp. 5.000.000' => '> 1 Juta',
            'rp. 3.000.000 - rp. 5.000.000' => '700 Ribu - 1 Juta',
            'rp. 1.500.000 - rp. 3.000.000' => '400 - 700 Ribu',
            '< rp. 1.500.000' => '< 400 Ribu',
        ],
        7 => [
            'milik sendiri' => 'Milik Sendiri / Sewa',
            'sewa / kontrak' => 'Sewa < 1 Juta',
            'milik orang tua/ saudara /keluarga' => 'Milik Orang Tua / Warisan',
            'menumpang / tidak memiliki tempat tinggal' => 'Magersari / Pakai Gratis',
        ],
        8 => [
            'pdam' => 'PDAM Terbatas',
            'sumur (bor/gali)' => 'Sumur Milik Sendiri',
            'menumpang/ tidak meliki sumber air' => 'Sumur Milik Tetangga',
            'air kemasan / air galon' => 'PDAM Bebas / Air Kemasan',
        ],
        10 => [
            'jalan kaki / sepeda / sepeda motor seadanya / transportasi umum' => 'Jalan Kaki / Sepeda / Motor Seadanya',
            'sepeda motor 1 unit dalam kondisi baik' => 'Sepeda Motor 1 Buah, dalam Kondisi Baik',
            'sepeda motor lebih dari 1 unit dalam kondisi baik' => 'Sepeda Motor > 1 Buah, dalam Kondisi Baik',
        ],
    ];

    /**
     * Normalisasi teks deterministik:
     * huruf kecil, whitespace dirapikan, spasi di sekitar tanda baca dihapus,
     * spasi ganda dihilangkan, poin 'Rp.' dirapikan.
     */
    public static function normalisasi(mixed $teks): string
    {
        $s = mb_strtolower(trim((string) $teks), 'UTF-8');
        $s = preg_replace('/\s+/u', ' ', $s) ?? $s;
        $s = preg_replace('/\s+([\/.,;:()\-])/u', '$1', $s) ?? $s;
        $s = preg_replace('/([\/.,;:()\-])\s+/u', '$1', $s) ?? $s;

        return trim($s);
    }

    /**
     * Petakan SATU jawaban ke sub-kriteria kriteria tertentu.
     *
     * @param  Collection<int, SubKriteria>  $subKriteria  baris sub-kriteria milik kriteria itu.
     * @return array{ok: bool, id_subkriteria?: int, alasan?: string}
     */
    public static function petakan(string $jawaban, int $idKriteria, Collection $subKriteria): array
    {
        $normal = self::normalisasi($jawaban);

        if ($normal === '') {
            return ['ok' => false, 'alasan' => "jawaban kosong untuk kriteria C{$idKriteria}"];
        }

        // 1. Kamus alias eksplisit (variasi CSV yang telah diverifikasi maknanya).
        // Key dibandingkan dalam bentuk TERNORMALISASI agar lookup konsisten
        // dengan output normalisasi() (spasi di sekitar tanda baca dihapus).
        $tujuan = $normal;
        foreach (self::ALIAS[$idKriteria] ?? [] as $kunci => $label) {
            if (self::normalisasi($kunci) === $normal) {
                $tujuan = self::normalisasi($label);
                break;
            }
        }

        // 2. Cocokkan persis terhadap keterangan sub-kriteria (ternormalisasi).
        $cocok = $subKriteria->first(
            fn (SubKriteria $sub) => self::normalisasi($sub->keterangan) === $tujuan
        );

        if ($cocok) {
            return ['ok' => true, 'id_subkriteria' => (int) $cocok->id_subkriteria];
        }

        return [
            'ok' => false,
            'alasan' => "jawaban '{$jawaban}' untuk kriteria C{$idKriteria} tidak dikenal "
                .'oleh kamus sub-kriteria (dan tidak ada alias yang aman untuknya)',
        ];
    }

    /**
     * Petakan pasangan jawaban kuesioner (q1..qN) ke penilaian.
     *
     * @param  array<string, mixed>  $jawaban  ['q1' => '...', ..., 'qN' => '...']
     * @param  Collection<int, SubKriteria>  $subKriteria  seluruh baris sub-kriteria (berikut id_kriteria).
     * @return array{ok: bool, hasil: array<int, int>, error: array<int, array{key:string, kriteria:int, jawaban:string, alasan:string}>}
     */
    public static function petakanSemua(array $jawaban, Collection $subKriteria): array
    {
        $perKriteria = $subKriteria->groupBy('id_kriteria');

        $hasil = [];
        $error = [];

        foreach ($jawaban as $key => $nilai) {
            if (! preg_match('/^q(\d+)$/', (string) $key, $m)) {
                $error[$key] = [
                    'key' => (string) $key,
                    'kriteria' => 0,
                    'jawaban' => (string) $nilai,
                    'alasan' => "kunci jawaban '{$key}' tidak sah (format q1..qN)",
                ];
                continue;
            }

            $idKriteria = (int) $m[1];
            $kumpulan = $perKriteria->get($idKriteria);

            if (! $kumpulan || $kumpulan->isEmpty()) {
                $error[$key] = [
                    'key' => $key,
                    'kriteria' => $idKriteria,
                    'jawaban' => (string) $nilai,
                    'alasan' => "kriteria C{$idKriteria} tidak memiliki sub-kriteria di database",
                ];
                continue;
            }

            $petakan = self::petakan((string) $nilai, $idKriteria, $kumpulan);

            if (! $petakan['ok']) {
                $error[$key] = [
                    'key' => $key,
                    'kriteria' => $idKriteria,
                    'jawaban' => (string) $nilai,
                    'alasan' => $petakan['alasan'],
                ];
                continue;
            }

            $hasil[$idKriteria] = $petakan['id_subkriteria'];
        }

        return [
            'ok' => $error === [],
            'hasil' => $hasil,
            'error' => array_values($error),
        ];
    }
}