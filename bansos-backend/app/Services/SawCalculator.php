<?php

namespace App\Services;

use App\Models\Kriteria;
use App\Models\Pengajuan;
use Illuminate\Support\Facades\DB;

/**
 * Perhitungan SAW — jalur tunggal (SSOT) untuk ranking & dataset.
 *
 * Menggantikan logika yang tersebar di SawController (hitungRanking dan
 * getDataset dengan criteria yang berbeda — BUG-19) serta memenuhi:
 *
 *  - P0-06 RT scope: filter alternatif di BACKEND berdasarkan role user,
 *    normalisasi SAW dihitung terhadap kumpulan alternatif milik RT tersebut,
 *    ranking dimulai dari 1, tidak ada data RT lain yang bocor.
 *  - P2-05 eligibility konsisten: satu fungsi menentukan alternatif yang
 *    masuk matriks (status disetujui + warga ada + nama tidak kosong + matriks
 *    lengkap), dipakai hitungRanking, dataset, dan dashboard.
 *  - P2-09 snapshot: seluruh baca (pengajuan + kriteria + sub-kriteria)
 *    dilakukan dalam SATU transaksi DB sehingga satu request memakai data
 *    yang konsisten.
 *  - BUG-05: kriteria tanpa variasi dideteksi dan dilaporkan, tidak disembunyi-
 *    kan, namun tetap dihitung (skornya menjadi offset konstan).
 */
class SawCalculator
{
    /**
     * Ambil kumpulan alternatif yang ELIGIBLE untuk role & scope peminta.
     *
     * @return array{
     *   pengajuan: \Illuminate\Support\Collection,
     *   kriteria: \Illuminate\Support\Collection,
     *   kriteriaMap: array<int, array{nama:string,tipe:string,bobot_norm:float}>,
     *   matriks: array<int, array<int,float>>,
     *   meta: array<int, array{id_pengajuan:int,nama_warga:string,alamat:string,rt:string}>,
     *   dilewati: array<int, array{id_pengajuan:?int,nama_warga:?string,rt:?string,alasan:string}>,
     *   scopeRt: ?int
     * }
     */
    public static function ambilDataEligible(?object $user): array
    {
        $scopeRt = null;
        if ($user && $user->role === 'rt') {
            $scopeRt = RtFormatter::intValue($user->rt);
        }

        // Satu transaksi = satu snapshot (P2-09).
        return DB::transaction(function () use ($scopeRt) {
            $pengajuanQuery = Pengajuan::with(['warga', 'penilaian.subKriteria'])
                ->where('status', 'disetujui');

            if ($scopeRt !== null) {
                // P0-06: backend hanya memproses alternatif milik RT terkait.
                $pengajuanQuery->whereHas('warga', function ($q) use ($scopeRt) {
                    $q->whereRaw('CAST(rt AS UNSIGNED) = ?', [$scopeRt]);
                });
            }

            $pengajuanList = $pengajuanQuery->get();

            $kriteriaList = Kriteria::orderBy('id_kriteria')->get();

            $totalBobot = (float) $kriteriaList->sum('bobot');
            if ($totalBobot <= 0) {
                $totalBobot = 1;
            }

            $kriteriaMap = [];
            foreach ($kriteriaList as $k) {
                $kriteriaMap[$k->id_kriteria] = [
                    'nama' => $k->nama_kriteria,
                    'tipe' => $k->tipe,
                    'bobot_norm' => (float) $k->bobot / $totalBobot,
                ];
            }

            $jumlahKriteria = $kriteriaList->count();

            $matriks = [];
            $meta = [];
            $dilewati = [];

            foreach ($pengajuanList as $p) {
                $idP = $p->id_pengajuan;

                if ($p->warga === null) {
                    $dilewati[] = [
                        'id_pengajuan' => $idP,
                        'nama_warga' => null,
                        'rt' => null,
                        'alasan' => 'data warga tidak ditemukan',
                    ];

                    continue;
                }

                $nama = trim((string) $p->warga->nama_lengkap);
                if ($nama === '') {
                    $dilewati[] = [
                        'id_pengajuan' => $idP,
                        'nama_warga' => null,
                        'rt' => $p->warga->rt,
                        'alasan' => 'nama warga kosong',
                    ];

                    continue;
                }

                $barisMatriks = [];
                foreach ($p->penilaian as $penilaian) {
                    if (! $penilaian->subKriteria) {
                        continue;
                    }
                    $barisMatriks[$penilaian->id_kriteria] = (float) $penilaian->subKriteria->nilai;
                }

                if (count($barisMatriks) < $jumlahKriteria) {
                    $dilewati[] = [
                        'id_pengajuan' => $idP,
                        'nama_warga' => $nama,
                        'rt' => $p->warga->rt,
                        'alasan' => 'matriks penilaian belum lengkap',
                    ];

                    continue;
                }

                $matriks[$idP] = $barisMatriks;
                $meta[$idP] = [
                    'id_pengajuan' => $idP,
                    'nama_warga' => $nama,
                    'alamat' => $p->warga->alamat ?? '',
                    'rt' => $p->warga->rt,
                ];
            }

            return [
                'pengajuan' => $pengajuanList,
                'kriteria' => $kriteriaList,
                'kriteriaMap' => $kriteriaMap,
                'matriks' => $matriks,
                'meta' => $meta,
                'dilewati' => $dilewati,
                'scopeRt' => $scopeRt,
            ];
        });
    }

    /**
     * Hitung ranking SAW lengkap untuk role & scope peminta.
     *
     * @return array{
     *   success:bool,
     *   total:int,
     *   data:array<int, array{id_pengajuan:int,nama_warga:string,alamat:string,rt:string,skor_saw:float,ranking:int,ranking_rt:int}>,
     *   dilewati:array,
     *   kriteria_tanpa_variasi:array<int,string>,
     *   scope_rt:?int,
     *   pesan?:string
     * }
     */
    public static function hitung(?object $user): array
    {
        $elig = self::ambilDataEligible($user);

        if (count($elig['matriks']) === 0) {
            return [
                'success' => false,
                'total' => 0,
                'data' => [],
                'dilewati' => $elig['dilewati'],
                'kriteria_tanpa_variasi' => [],
                'scope_rt' => $elig['scopeRt'],
                'pesan' => 'Tidak ada data warga yang berstatus disetujui dengan matriks penilaian lengkap.',
            ];
        }

        // Max/min per kriteria (hanya atas alternatif dalam scope).
        $maxNilai = [];
        $minNilai = [];
        $tanpaVariasi = [];

        foreach ($elig['kriteriaMap'] as $idK => $_) {
            $kolom = array_filter(
                array_map(fn ($baris) => $baris[$idK] ?? null, $elig['matriks']),
                fn ($v) => $v !== null
            );

            if ($kolom === []) {
                $maxNilai[$idK] = 1;
                $minNilai[$idK] = 1;
                $tanpaVariasi[$idK] = $elig['kriteriaMap'][$idK]['nama'];

                continue;
            }

            $max = max($kolom);
            $min = min($kolom);
            $maxNilai[$idK] = $max;
            $minNilai[$idK] = $min;

            if (abs($max - $min) < 1e-9) {
                // BUG-05: kriteria konstan → kontribusi ke ranking nol.
                $tanpaVariasi[$idK] = $elig['kriteriaMap'][$idK]['nama'];
            }
        }

        // Skor preferensi.
        $hasil = [];
        foreach ($elig['matriks'] as $idP => $baris) {
            $skorV = 0.0;

            foreach ($elig['kriteriaMap'] as $idK => $info) {
                $nilai = $baris[$idK] ?? 0;
                $max = $maxNilai[$idK] ?: 1;
                $min = $minNilai[$idK] ?: 1;

                if ($info['tipe'] === 'benefit') {
                    $rij = ($max > 0) ? ($nilai / $max) : 0;
                } else {
                    $rij = ($nilai > 0) ? ($min / $nilai) : 0;
                }

                $skorV += $info['bobot_norm'] * $rij;
            }

            $hasil[$idP] = array_merge($elig['meta'][$idP], [
                'skor_saw' => round($skorV, 6),
            ]);
        }

        // Urutkan descending, tie-break deterministik id_pengajuan.
        uasort($hasil, function ($a, $b) {
            if ($b['skor_saw'] === $a['skor_saw']) {
                return $a['id_pengajuan'] <=> $b['id_pengajuan'];
            }

            return $b['skor_saw'] <=> $a['skor_saw'];
        });

        $posisiGlobal = [];
        $posisiPerRt = [];
        $nomor = 0;
        foreach ($hasil as $idP => &$row) {
            $nomor++;
            $row['ranking'] = $nomor;          // urutan dalam response (sudah scope)
            $posisiGlobal[$idP] = $nomor;
        }
        unset($row);

        // ranking_rt: posisi alternatif dalam RT-nya sendiri.
        $rtOrder = [];
        foreach ($hasil as $idP => $row) {
            $rtOrder[$row['rt']][] = $idP;
        }
        foreach ($rtOrder as $rt => $ids) {
            foreach ($ids as $i => $idP) {
                $hasil[$idP]['ranking_rt'] = $i + 1;
            }
        }

        return [
            'success' => true,
            'total' => count($hasil),
            'data' => array_values($hasil),
            'dilewati' => $elig['dilewati'],
            'kriteria_tanpa_variasi' => array_values($tanpaVariasi),
            'scope_rt' => $elig['scopeRt'],
        ];
    }
}