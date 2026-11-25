<?php

namespace App\Services;

use App\Models\Penilaian;
use App\Models\SubKriteria;

/**
 * Pembentukan baris `penilaian` dari jawaban mentah — jalur tunggal (SSOT)
 * untuk approval, sinkronisasi kuesioner, import, dan seeder.
 *
 * Sebelumnya tiap pemanggil memakai implementasi sendiri dengan perilaku
 * berbeda (fallback diam-diam ke skor minimum, matriks parsial tanpa laporan).
 * Di sini tidak ada fallback: jawaban yang tidak dikenal ditolak (strict) atau
 * dilaporkan (non-strict), tidak pernah disulap menjadi sub-kriteria apa pun.
 */
class PenilaianAssembler
{
    /**
     * Bangun ulang seluruh penilaian satu pengajuan dari jawaban mentah.
     *
     * @param  array<string, mixed>  $jawaban  ['q1' => '...', ...]
     * @return array{terbentuk: int, tidak_cocok: array<int, array{key:string, kriteria:int, jawaban:string, alasan:string}>}
     *
     * @throws JawabanTidakDikenalException  bila strict dan ada jawaban tak dikenal.
     */
    public static function bangun(int $idPengajuan, array $jawaban, bool $strict = true): array
    {
        $subKriteria = SubKriteria::all();

        $peta = JawabanMapper::petakanSemua($jawaban, $subKriteria);

        // Deteksi kriteria yang jawabannya TIDAK ADA sama sekali — pemanggil
        // (approval /fix-data) wajib tahu kriteria mana yang hilang, bukan
        // hanya yang salah cetak (P1-04: matriks lengkap = seluruh kriteria).
        $idKriteriaAktif = $subKriteria->pluck('id_kriteria')->unique()->values();
        $kunciAda = collect(array_keys($jawaban));

        foreach ($idKriteriaAktif as $idK) {
            $kunci = 'q'.$idK;
            if (! $kunciAda->contains($kunci) && ! isset($peta['error'][$kunci])) {
                $peta['error'][] = [
                    'key' => $kunci,
                    'kriteria' => (int) $idK,
                    'jawaban' => '',
                    'alasan' => 'jawaban tidak disertakan — kriteria tidak terisi',
                ];
            }
        }

        $peta['ok'] = $peta['error'] === [];

        if (! $peta['ok'] && $strict) {
            throw new JawabanTidakDikenalException($peta['error']);
        }

        if ($peta['ok']) {
            Penilaian::where('id_pengajuan', $idPengajuan)->delete();

            foreach ($peta['hasil'] as $idKriteria => $idSubkriteria) {
                Penilaian::create([
                    'id_pengajuan' => $idPengajuan,
                    'id_kriteria' => $idKriteria,
                    'id_subkriteria' => $idSubkriteria,
                ]);
            }
        }

        return [
            'terbentuk' => count($peta['hasil']),
            'tidak_cocok' => $peta['error'],
        ];
    }
}