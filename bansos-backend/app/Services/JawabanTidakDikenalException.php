<?php

namespace App\Services;

/**
 * Dilempar saat jawaban kuesioner tidak dapat dipetakan ke sub-kriteria mana
 * pun. `$rincian` berisi per-key detail: kunci (q1..qN), kriteria terkait,
 * jawaban asli, dan alasan gagal — cukup untuk laporan per baris CSV
 * (P0-01 #8) dan pesan 422 yang menjelaskan kriteria bermasalah (P1-04).
 */
class JawabanTidakDikenalException extends \RuntimeException
{
    /** @var array<int, array{key:string, kriteria:int, jawaban:string, alasan:string}> */
    public array $rincian;

    public function __construct(array $rincian)
    {
        $this->rincian = $rincian;

        $pesan = 'Jawaban kuesioner tidak dapat dipetakan ke sub-kriteria: '
            .implode('; ', array_map(
                fn ($r) => "{$r['key']} (C{$r['kriteria']}): {$r['alasan']}",
                $rincian
            ));

        parent::__construct($pesan, 422);
    }
}