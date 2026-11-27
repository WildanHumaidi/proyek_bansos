<?php

namespace App\Console\Commands;

use App\Models\Pengajuan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Pulihkan jawaban_mentah untuk pengajuan lama yang hanya menyimpan matriks
 * penilaian (impor sebelum CsvImporter menyimpan jawaban mentah).
 *
 * Sumber rekonstruksi: relasi penilaian → sub_kriteria.keterangan, yang
 * merupakan label kanonik jawaban pada codebook saat ini. Hasilnya dipakai
 * layar Input Kuesioner (progres 10/10) dan modal edit RT, sehingga data lama
 * bisa dilihat dan disunting — bukan tampil kosong.
 */
class PulihkanJawabanPengajuan extends Command
{
    protected $signature = 'pengajuan:pulihkan-jawaban {--dry-run : Hanya laporkan, tidak menulis}';

    protected $description = 'Isi jawaban_mentah pengajuan lama dari matriks penilaian yang sudah ada (q1–q10)';

    public function handle(): int
    {
        $daftar = Pengajuan::query()
            ->where(function ($q) {
                $q->whereNull('jawaban_mentah')->orWhere('jawaban_mentah', '');
            })
            ->orderBy('id_pengajuan')
            ->get();

        if ($daftar->isEmpty()) {
            $this->info('Semua pengajuan sudah punya jawaban mentah.');

            return self::SUCCESS;
        }

        $siap = [];
        $dilewati = [];

        foreach ($daftar as $p) {
            $baris = DB::table('penilaian')
                ->join('sub_kriteria', 'sub_kriteria.id_subkriteria', '=', 'penilaian.id_subkriteria')
                ->where('penilaian.id_pengajuan', $p->id_pengajuan)
                ->select('penilaian.id_kriteria', 'sub_kriteria.keterangan')
                ->orderBy('penilaian.id_kriteria')
                ->get();

            $kriteria = $baris->pluck('id_kriteria')->map(fn ($k) => (int) $k)->all();

            if (count($baris) !== 10 || count(array_unique($kriteria)) !== 10) {
                $dilewati[] = [$p->id_pengajuan, count($baris), 'butuh tepat 10 kriteria unik'];
                continue;
            }

            $jawaban = [];
            foreach ($baris as $b) {
                $jawaban['q'.$b->id_kriteria] = $b->keterangan;
            }

            $siap[$p->id_pengajuan] = $jawaban;
        }

        $this->info(count($daftar).' pengajuan tanpa jawaban mentah.');
        $this->info(count($siap).' bisa dipulihkan, '.count($dilewati).' dilewati.');

        if ($dilewati !== []) {
            $this->table(['ID', 'Baris penilaian', 'Alasan'], $dilewati);
        }

        if ($siap === []) {
            return self::SUCCESS;
        }

        $contoh = array_slice($siap, 0, 5, true);
        $this->table(
            ['ID Pengajuan', 'q1', 'q2', 'q3'],
            array_map(
                fn ($id, $j) => [$id, $j['q1'] ?? '-', $j['q2'] ?? '-', $j['q3'] ?? '-'],
                array_keys($contoh),
                array_values($contoh)
            )
        );

        if ($this->option('dry-run')) {
            $this->warn('Dry-run: tidak ada yang ditulis.');

            return self::SUCCESS;
        }

        $backup = [];
        foreach ($daftar as $p) {
            $backup[] = [
                'id_pengajuan' => $p->id_pengajuan,
                'jawaban_mentah_lama' => $p->jawaban_mentah,
            ];
        }

        $path = base_path('../docs/archive/pengajuan_jawaban_null_backup_'.date('Ymd_His').'.json');
        file_put_contents($path, json_encode($backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        DB::transaction(function () use ($siap) {
            foreach ($siap as $id => $jawaban) {
                Pengajuan::where('id_pengajuan', $id)->update([
                    'jawaban_mentah' => json_encode($jawaban, JSON_UNESCAPED_UNICODE),
                    'updated_at' => now(),
                ]);
            }
        });

        $this->info(count($siap).' pengajuan dipulihkan.');
        $this->info('Backup nilai lama: '.$path);

        return self::SUCCESS;
    }
}