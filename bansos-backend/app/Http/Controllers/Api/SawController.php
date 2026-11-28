<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SawCalculator;
use Illuminate\Http\Request;

class SawController extends Controller
{
    /**
     * GET /api/saw/hitung
     *
     * Ranking SAW dihitung sepenuhnya oleh SawCalculator (SSOT):
     *  - Scope peran: RT hanya melihat & dihitung atas alternatif RT-nya (P0-06),
     *    admin/RW melihat seluruh RW.
     *  - Eligibility konsisten dengan /saw/dataset (P2-05).
     *  - Satu snapshot transaksional (P2-09).
     *  - Kriteria tanpa variasi dilaporkan, tidak disembunyikan (BUG-05).
     */
    public function hitungRanking()
    {
        // `skala=rw`: hitung skor & peringkat dengan batas (max/min) seluruh RW
        // supaya angka di dashboard RT sebanding dengan dashboard RW untuk
        // orang yang sama. Daftar yang dikembalikan tetap hanya wilayah peminta.
        $skalaGlobal = request()->input('skala') === 'rw';

        $hasil = SawCalculator::hitung(request()->user(), $skalaGlobal);

        if (! $hasil['success']) {
            return response()->json([
                'success' => false,
                'message' => $hasil['pesan'],
                'dilewati' => $hasil['dilewati'],
                'kriteria_tanpa_variasi' => $hasil['kriteria_tanpa_variasi'],
                'scope_rt' => $hasil['scope_rt'],
                'skala' => $hasil['skala'],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'source' => 'php',
            'total' => $hasil['total'],
            'data' => $hasil['data'],
            'dilewati' => $hasil['dilewati'],
            'kriteria_tanpa_variasi' => $hasil['kriteria_tanpa_variasi'],
            'scope_rt' => $hasil['scope_rt'],
            'skala' => $hasil['skala'],
        ]);
    }

    /**
     * GET /api/saw/dataset
     *
     * Dataset mentah (matriks nilai) memakai filter & eligibility yang SAMA
     * dengan ranking (P2-05) sehingga keduanya tidak pernah berselisih (BUG-19).
     */
    public function getDataset()
    {
        $elig = SawCalculator::ambilDataEligible(request()->user());

        $kriteriaList = $elig['kriteria'];

        $dataset = [];
        foreach ($elig['matriks'] as $idP => $baris) {
            $meta = $elig['meta'][$idP];

            $barisData = [
                'id_pengajuan' => $meta['id_pengajuan'],
                'nama_warga' => $meta['nama_warga'],
                'alamat' => $meta['alamat'],
                'rt' => $meta['rt'],
            ];

            foreach ($baris as $idKriteria => $nilai) {
                $barisData['C'.$idKriteria] = $nilai;
            }

            $dataset[] = $barisData;
        }

        return response()->json([
            'success' => true,
            'kriteria' => $kriteriaList->map(fn ($k) => [
                'id_kriteria' => 'C'.$k->id_kriteria,
                'nama_kriteria' => $k->nama_kriteria,
                'tipe' => $k->tipe,
                'bobot' => $k->bobot,
            ]),
            'dataset' => $dataset,
            'dilewati' => $elig['dilewati'],
            'scope_rt' => $elig['scopeRt'],
        ]);
    }

    /**
     * GET /api/saw/report/export
     *
     * P2-03: export laporan NYATA (CSV/TSV siap cetak) dari hasil ranking
     * yang SAMA dengan API — bukan window.print(). Data mengikuti scope role
     * (RT melihat wilayahnya sendiri), nilai identik dengan /saw/hitung,
     * dan PII yang tidak diperlukan (alamat lengkap) tidak disertakan.
     */
    public function exportReport(Request $request)
    {
        $format = $request->input('format', 'csv');
        if (! in_array($format, ['csv', 'tsv'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Format tidak dikenali. Gunakan format=csv atau format=tsv.',
            ], 422);
        }

        $hasil = SawCalculator::hitung(request()->user());

        $delimiter = $format === 'tsv' ? "\t" : ';';

        $kolom = ['Nama Warga', 'RT', 'Skor', 'Ranking', 'Ranking RT', 'Keterangan'];
        $baris = [$kolom];

        foreach ($hasil['data'] as $row) {
            $baris[] = [
                $row['nama_warga'],
                $row['rt'],
                number_format((float) $row['skor_saw'], 6, '.', ''),
                $row['ranking'],
                $row['ranking_rt'],
                $row['ranking'] <= 10 ? 'Prioritas' : 'Cadangan',
            ];
        }

        $stream = fopen('php://temp', 'r+');
        foreach ($baris as $b) {
            fputcsv($stream, $b, $delimiter);
        }
        rewind($stream);
        $isi = stream_get_contents($stream);
        fclose($stream);

        $namaFile = 'laporan-saw-'.date('Y-m-d-His').'.'.($format === 'tsv' ? 'tsv' : 'csv');

        return response($isi)
            ->header('Content-Type', $format === 'tsv' ? 'text/tab-separated-values' : 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="'.$namaFile.'"');
    }
}