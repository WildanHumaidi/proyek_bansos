<?php

namespace App\Console\Commands;

use App\Models\Warga;
use App\Services\AkunWarga;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Backfill akun login untuk warga yang belum punya.
 *
 * Aturan sama dengan import CSV: username = nama depan (unik, disufiks satu huruf
 * bila bentrok), password awal = nama depan + "123". Daftar kredensial ditulis
 * ke storage/app (tidak masuk git) supaya bisa diteruskan ke warga.
 */
class BuatAkunWarga extends Command
{
    protected $signature = 'warga:buat-akun {--dry-run : Hanya tampilkan rencana, tidak menulis}';

    protected $description = 'Buatkan akun login untuk warga yang belum punya (username = nama depan, password = nama depan + 123)';

    public function handle(AkunWarga $akun): int
    {
        $daftar = Warga::query()
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('users')
                    ->whereColumn('users.id_warga', 'warga.id_warga');
            })
            ->orderBy('id_warga')
            ->get();

        if ($daftar->isEmpty()) {
            $this->info('Semua warga sudah punya akun.');

            return self::SUCCESS;
        }

        // Simulasikan username final lebih dulu agar dry-run dan eksekusi
        // menampilkan nama yang sama (termasuk sufiks untuk nama kembar).
        $terpakai = [];
        $rencana = [];

        foreach ($daftar as $warga) {
            $dasar = $akun->namaDepan($warga->nama_lengkap);
            $username = $akun->usernameUnik($dasar, $terpakai);
            $terpakai[] = $username;

            $rencana[] = [
                'warga' => $warga,
                'dasar' => $dasar,
                'username' => $username,
                'sandi' => $dasar.'123',
            ];
        }

        $hitungDasar = array_count_values(array_column($rencana, 'dasar'));
        $kembar = array_values(array_filter($rencana, fn ($r) => $hitungDasar[$r['dasar']] > 1));

        $this->info(count($rencana).' warga belum punya akun.');

        if ($kembar !== []) {
            $this->line('Nama depan kembar (diberi satu huruf di belakang):');
            $this->table(
                ['ID', 'Nama', 'Username', 'Password awal'],
                array_map(fn ($r) => [
                    $r['warga']->id_warga,
                    $r['warga']->nama_lengkap,
                    $r['username'],
                    $r['sandi'],
                ], $kembar)
            );
        }

        if ($this->option('dry-run')) {
            $this->warn('Dry-run: tidak ada akun yang ditulis.');

            return self::SUCCESS;
        }

        $gagal = 0;

        foreach ($rencana as $r) {
            $hasil = $akun->pastikan($r['warga']);

            if ($hasil['username'] !== $r['username']) {
                $this->warn("Username {$r['warga']->nama_lengkap} berubah: rencana {$r['username']}, hasil {$hasil['username']}");
                $r['username'] = $hasil['username'];
            }

            if (! $hasil['akun_baru']) {
                $gagal++;
            }
        }

        $path = storage_path('app/akun_warga_'.date('Ymd_His').'.csv');
        $fp = fopen($path, 'w');
        fwrite($fp, "\xEF\xBB\xBF"); // BOM agar Excel membaca UTF-8
        fputcsv($fp, ['Nama', 'RT', 'Username', 'Password Awal']);
        foreach ($rencana as $r) {
            fputcsv($fp, [$r['warga']->nama_lengkap, $r['warga']->rt, $r['username'], $r['sandi']]);
        }
        fclose($fp);

        $this->info((count($rencana) - $gagal).' akun dibuat, '.$gagal.' dilewati.');
        $this->info('Daftar kredensial: '.$path);

        return self::SUCCESS;
    }
}