<?php

namespace App\Services;

use App\Models\Pengajuan;
use App\Models\Warga;
use Illuminate\Support\Facades\DB;

/**
 * Impor CSV warga + kuesioner — jalur tunggal (SSOT).
 *
 * Dipakai oleh endpoint `POST /api/admin/pengajuan/import` DAN seeder
 * `ImportWargaSeeder`. Sebelumnya dua implementasi dengan perilaku berbeda:
 * seeder memakai LIKE substring + fallback skor minimum (BUG-01) dan
 * updateOrCreate by nama (BUG-03), endpoint memakai status 'disetujui'
 * langsung (BUG-04) dan parse posisi kolom tanpa validasi header (BUG-17).
 *
 * Kebijakan baris:
 *  - nama kosong      → ditolak, dicatat nomor barisnya (BUG-11).
 *  - RT tidak valid   → ditolak, bukan di-coerce ke RT 001 (BUG-18).
 *  - duplikat identik (nama + RT + alamat yang sama setelah normalisasi)
 *                     → di-skip dan dilaporkan; TIDAK pernah menimpa data
 *                       existing (BUG-03). Nama kembar dengan RT/alamat
 *                       berbeda dianggap rumah tangga berbeda (BUG-12): kedua
 *                       record dibuat, identitas tidak digabung sembarangan.
 *  - jawaban tak dikenal → error terstruktur berisi nomor baris, kode
 *                       kriteria, jawaban asli, dan alasan (P0-01).
 *  - status hasil impor → 'menunggu' SELALU. Approval hanya lewat aktor
 *                       berwenang (P0-04).
 *
 * Import berjalan dalam satu transaksi: satu baris gagal → seluruh impor
 * di-rollback dan response memuat laporan per baris (atomic import P0-01).
 *
 * Akun warga: bila `$buatAkun` true (dipakai endpoint import), setiap warga
 * yang dibuat — juga warga lama hasil impor sebelumnya yang belum punya akun —
 * langsung mendapat akun login (role warga, tertaut lewat id_warga) dengan
 * aturan App\Services\AkunWarga: username = nama depan (unik, disufiks satu huruf
 * bila bentrok), password awal = nama depan + "123". Password HANYA
 * dikembalikan sekali di laporan impor untuk diteruskan ke warga.
 */
class CsvImporter
{
    private array $laporan = [];

    private bool $buatAkun = false;

    /**
     * Import isi CSV (string mentah).
     *
     * @param  bool  $buatAkun  true = buatkan akun login untuk tiap warga
     * @return array{banyak_import:int, banyak_gagal:int, banyak_skip:int,
     *               banyak_akun:int, baris:array<int,array>, error_header:?string}
     */
    public function impor(string $isiCsv, bool $buatAkun = false): array
    {
        $this->laporan = [];
        $this->buatAkun = $buatAkun;

        if (trim($isiCsv) === '') {
            return [
                'banyak_import' => 0,
                'banyak_gagal' => 0,
                'banyak_skip' => 0,
                'banyak_akun' => 0,
                'baris' => [],
                'error_header' => 'File CSV kosong.',
            ];
        }

        try {
            $barisData = $this->parse($isiCsv);
        } catch (CsvHeaderException $e) {
            return [
                'banyak_import' => 0,
                'banyak_gagal' => 0,
                'banyak_skip' => 0,
                'banyak_akun' => 0,
                'baris' => [],
                'error_header' => $e->getMessage(),
            ];
        }

        DB::beginTransaction();

        try {
            $banyakImport = 0;
            $banyakGagal = 0;
            $banyakSkip = 0;
            $banyakAkun = 0;

            foreach ($barisData as $nomorBaris => $data) {
                try {
                    $hasil = $this->prosesBaris($data, $nomorBaris);

                    if ($hasil['aksi'] === 'import') {
                        $banyakImport++;
                    } else {
                        $banyakSkip++;
                    }

                    if ($hasil['akun_baru'] ?? false) {
                        $banyakAkun++;
                    }

                    $this->laporan[] = [
                        'baris' => $nomorBaris,
                        'nama' => $hasil['nama'] ?? '',
                        'alamat' => $hasil['alamat'] ?? '',
                        'rt' => $hasil['rt'] ?? '',
                        'status' => $hasil['aksi'] === 'import' ? 'import' : 'skip',
                        'detail' => $hasil['detail'] ?? '',
                        'username' => $hasil['username'] ?? null,
                        'password_awal' => $hasil['password_awal'] ?? null,
                    ];
                } catch (JawabanTidakDikenalException $e) {
                    $banyakGagal++;

                    $this->laporan[] = [
                        'baris' => $nomorBaris,
                        'nama' => $data['nama'] ?? '',
                        'alamat' => $data['alamat'] ?? '',
                        'rt' => $data['rt'] ?? '',
                        'status' => 'gagal',
                        'detail' => $e->getMessage(),
                        'username' => null,
                        'password_awal' => null,
                    ];
                } catch (\InvalidArgumentException $e) {
                    $banyakGagal++;

                    $this->laporan[] = [
                        'baris' => $nomorBaris,
                        'nama' => $data['nama'] ?? '',
                        'alamat' => $data['alamat'] ?? '',
                        'rt' => $data['rt'] ?? '',
                        'status' => 'gagal',
                        'detail' => $e->getMessage(),
                        'username' => null,
                        'password_awal' => null,
                    ];
                }
            }

            if ($banyakGagal > 0) {
                DB::rollBack();

                return [
                    'banyak_import' => 0,
                    'banyak_gagal' => $banyakGagal,
                    'banyak_skip' => $banyakSkip,
                    'banyak_akun' => 0,
                    'baris' => $this->laporan,
                    'error_header' => null,
                ];
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            throw $e;
        }

        return [
            'banyak_import' => $banyakImport,
            'banyak_gagal' => $banyakGagal,
            'banyak_skip' => $banyakSkip,
            'banyak_akun' => $banyakAkun,
            'baris' => $this->laporan,
            'error_header' => null,
        ];
    }

    // ────────────────────────────────────────────────────────────────────────
    // PARSING
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Parse CSV menjadi baris-asosiatif. Header divalidasi dan dipetakan ke
     * kunci kanonik ('nama', 'alamat', 'rt', lalu q1..q10 untuk kolom jawaban
     * tersisa dalam urutan kemunculannya).
     *
     * @return array<int, array{nama:string, alamat:string, rt:string, jawaban:array<int,string>}>
     *
     * @throws CsvHeaderException — kolom inti hilang / jumlah jawaban bukan 10
     */
    private function parse(string $isiCsv): array
    {
        $delimiter = substr_count($isiCsv, ';') > substr_count($isiCsv, ',') ? ';' : ',';

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $isiCsv);
        rewind($stream);

        $header = fgetcsv($stream, 0, $delimiter);

        if ($header === false) {
            fclose($stream);

            throw new CsvHeaderException('CSV tidak memiliki baris header.');
        }

        $headerNormalized = array_map(
            fn ($h) => JawabanMapper::normalisasi(str_replace(':', '', (string) $h)),
            $header
        );

        $indexNama = array_search('nama', $headerNormalized, true);
        $indexAlamat = array_search('alamat', $headerNormalized, true);
        $indexRt = array_search('rt', $headerNormalized, true);

        if ($indexNama === false) {
            throw new CsvHeaderException('Header CSV tidak memiliki kolom "NAMA".');
        }
        if ($indexAlamat === false) {
            throw new CsvHeaderException('Header CSV tidak memiliki kolom "ALAMAT".');
        }
        if ($indexRt === false) {
            throw new CsvHeaderException('Header CSV tidak memiliki kolom "RT".');
        }

        // Kolom jawaban = seluruh kolom selain inti (nama/alamat/rt) dan
        // timestamp, dalam urutan kemunculannya → q1..q10.
        $indeksInti = [$indexNama, $indexAlamat, $indexRt];
        $indeksJawaban = [];
        $indexTimestamp = array_search('timestamp', $headerNormalized, true);

        foreach ($headerNormalized as $i => $label) {
            if (in_array($i, $indeksInti, true) || $i === $indexTimestamp) {
                continue;
            }
            if ($label === '' || $label === null) {
                continue;
            }
            $indeksJawaban[] = $i;
        }

        if (count($indeksJawaban) !== 10) {
            throw new CsvHeaderException(
                'CSV wajib memuat tepat 10 kolom jawaban (q1–q10). Ditemukan '.count($indeksJawaban).' kolom jawaban.'
            );
        }

        $barisData = [];
        $nomorBaris = 1; // baris fisik mulai dari 1 = header

        while (($sel = fgetcsv($stream, 0, $delimiter)) !== false) {
            $nomorBaris++;

            // Baris kosong murni (semua sel kosong) dilewati diam-diam.
            if ($sel === null || trim(implode('', $sel)) === '') {
                continue;
            }

            $ambil = fn (int $idx) => isset($sel[$idx]) ? trim((string) $sel[$idx]) : '';

            $nama = $ambil($indexNama);
            $alamat = $ambil($indexAlamat);
            $rt = $ambil($indexRt);

            $jawaban = [];
            foreach ($indeksJawaban as $idx) {
                $jawaban[] = $ambil($idx);
            }

            $barisData[$nomorBaris] = [
                'nama' => $nama,
                'alamat' => $alamat,
                'rt' => $rt,
                'jawaban' => $jawaban,
            ];
        }

        fclose($stream);

        return $barisData;
    }

    // ────────────────────────────────────────────────────────────────────────
    // PROSES SATU BARIS
    // ────────────────────────────────────────────────────────────────────────

    /**
     * @return array{aksi:'import'|'skip', nama:string, alamat:string, rt:string,
     *               detail:string, username:?string, password_awal:?string, akun_baru:bool}
     *
     * @throws \InvalidArgumentException     nama kosong / RT tidak valid
     * @throws JawabanTidakDikenalException jawaban tak dapat dipetakan
     */
    private function prosesBaris(array $data, int $nomorBaris): array
    {
        $nama = trim($data['nama']);
        $alamat = trim($data['alamat']);
        $rtMentah = trim($data['rt']);

        if ($nama === '') {
            throw new \InvalidArgumentException("Baris {$nomorBaris}: nama kosong — baris ditolak.");
        }

        $rt = RtFormatter::formatRt($rtMentah); // throws InvalidArgumentException
        $rtInt = RtFormatter::intValue($rtMentah);

        $jawabanMentah = [];
        foreach ($data['jawaban'] as $i => $nilai) {
            if (trim((string) $nilai) === '') {
                throw new JawabanTidakDikenalException([[
                    'key' => 'q'.($i + 1),
                    'kriteria' => $i + 1,
                    'jawaban' => '',
                    'alasan' => 'jawaban kosong pada kolom q'.($i + 1),
                ]]);
            }
            $jawabanMentah['q'.($i + 1)] = $nilai;
        }

        // Deduplikasi identik: nama + RT + alamat (normalisasi). Bukan key
        // nama saja — nama kembar di RT/alamat berbeda adalah rumah tangga
        // berbeda. Bila baris persis sama sudah ada, skip (import ulang aman,
        // tidak menggandakan dan tidak menimpa).
        $existing = Warga::query()
            ->whereRaw('LOWER(TRIM(nama_lengkap)) = ?', [mb_strtolower($nama)])
            ->whereRaw('CAST(rt AS UNSIGNED) = ?', [$rtInt])
            ->whereRaw('LOWER(TRIM(COALESCE(alamat, \'\'))) = ?', [mb_strtolower($alamat)])
            ->first();

        if ($existing) {
            // Impor ulang: data tidak ditimpa, tetapi warga lama yang belum
            // punya akun (hasil impor sebelum fitur ini) tetap dilengkapi akun.
            $akun = $this->buatAkun ? $this->pastikanAkun($existing) : $this->akunKosong();

            return [
                'aksi' => 'skip',
                'nama' => $nama,
                'alamat' => $alamat,
                'rt' => $rt,
                'detail' => $akun['akun_baru']
                    ? 'Data identik sudah ada; akun warga dibuat otomatis.'
                    : 'Baris identik sudah ada (nama + RT + alamat sama); dilewati.',
                'username' => $akun['username'],
                'password_awal' => $akun['password_awal'],
                'akun_baru' => $akun['akun_baru'],
            ];
        }

        $warga = Warga::create([
            'nama_lengkap' => $nama,
            'alamat' => $alamat,
            'rt' => $rt,
            'rw' => '008',
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'menunggu', // P0-04: import TIDAK pernah auto-approve
            'jawaban_mentah' => json_encode($jawabanMentah),
        ]);

        // P0-01: mapping wajib sukses 100% atau baris gagal (atomic).
        PenilaianAssembler::bangun($pengajuan->id_pengajuan, $jawabanMentah, strict: true);

        $akun = $this->buatAkun ? $this->pastikanAkun($warga) : $this->akunKosong();

        return [
            'aksi' => 'import',
            'nama' => $nama,
            'alamat' => $alamat,
            'rt' => $rt,
            'detail' => $akun['akun_baru']
                ? 'Data warga + pengajuan (menunggu) + akun login dibuat.'
                : 'Data warga + pengajuan (menunggu) dibuat.',
            'username' => $akun['username'],
            'password_awal' => $akun['password_awal'],
            'akun_baru' => $akun['akun_baru'],
        ];
    }

    /**
     * Pastikan satu warga punya akun login (aturan ada di App\Services\AkunWarga).
     *
     * @return array{username:?string, password_awal:?string, akun_baru:bool}
     */
    private function pastikanAkun(Warga $warga): array
    {
        return (new AkunWarga)->pastikan($warga);
    }

    /** @return array{username:null, password_awal:null, akun_baru:false} */
    private function akunKosong(): array
    {
        return ['username' => null, 'password_awal' => null, 'akun_baru' => false];
    }
}

class CsvHeaderException extends \RuntimeException
{
}
