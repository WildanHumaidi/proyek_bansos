<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\Response;

/**
 * Export data layar menjadi PDF atau Excel yang siap dibaca.
 *
 * Satu tempat untuk seluruh export supaya format, judul, dan gaya konsisten:
 * dokumen selalu memuat judul, nama instansi, rentang data, dan stempel waktu
 * cetak. Isi kolom mengikuti apa yang tampil di dashboard role terkait —
 * pemanggil bertanggung jawab mengirim baris yang SUDAH ter-scope role.
 *
 * PDF memakai DomPDF dengan kertas A4 landscape dan baris zebra; Excel memakai
 * PhpSpreadsheet dengan header berwarna, lebar kolom otomatis, baris judul
 * digabung, dan print setup landscape.
 */
class DataExporter
{
    /**
     * Unduh data sebagai PDF.
     *
     * @param  array<int, string>  $kolom  label kolom
     * @param  array<int, array<int, mixed>>  $baris  isi sel (urutannya sama dengan $kolom)
     */
    public function pdf(string $judul, string $subjudul, array $kolom, array $baris, string $namaFile): Response
    {
        $lebar = $this->lebarKolom($kolom, $baris);

        $pdf = Pdf::loadView('exports.tabel', [
            'judul' => $judul,
            'subjudul' => $subjudul,
            'kolom' => $kolom,
            'baris' => $baris,
            'lebar' => $lebar,
        ])->setPaper('a4', 'landscape');

        // Nomor halaman. DomPDF hanya bisa menuliskannya lewat script setelah
        // canvas dibuat; tanpa ini dokumen lima halaman yang dicetak lalu
        // tercecer tidak bisa diurutkan kembali.
        $pdf->render();
        $dompdf = $pdf->getDomPDF();
        $canvas = $dompdf->getCanvas();
        $canvas->page_text(
            $canvas->get_width() - 90,
            $canvas->get_height() - 26,
            'Hal. {PAGE_NUM} dari {PAGE_COUNT}',
            null,
            7.5,
            [0.28, 0.33, 0.41]
        );

        return $pdf->download($namaFile.'.pdf');
    }

    /**
     * Unduh data sebagai Excel (.xlsx).
     *
     * @param  array<int, string>  $kolom
     * @param  array<int, array<int, mixed>>  $baris
     */
    public function excel(string $judul, string $subjudul, array $kolom, array $baris, string $namaFile): Response
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data');

        $jumlahKolom = max(count($kolom), 1);
        $hurufAkhir = Coordinate::stringFromColumnIndex($jumlahKolom);

        // Baris judul & subjudul digabung selebar tabel.
        $sheet->mergeCells("A1:{$hurufAkhir}1");
        $sheet->setCellValue('A1', $judul);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A2:{$hurufAkhir}2");
        $sheet->setCellValue('A2', $subjudul);
        $sheet->getStyle('A2')->getFont()->setSize(9)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FF334155'));
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $barisHeader = 4;
        foreach ($kolom as $i => $label) {
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($i + 1).$barisHeader, $label);
        }

        $gayaHeader = $sheet->getStyle("A{$barisHeader}:{$hurufAkhir}{$barisHeader}");
        $gayaHeader->getFont()->setBold(true)->getColor()->setRGB('FFFFFFFF');
        $gayaHeader->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FF0B3FA8');
        $gayaHeader->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $r = $barisHeader + 1;
        foreach ($baris as $isi) {
            foreach ($kolom as $i => $_) {
                $nilai = $isi[$i] ?? '';

                // Angka tetap angka supaya bisa dijumlah/diurutkan di Excel.
                // Kolom nomor urut dikecualikan: nomor seperti "001" akan
                // diratakan Excel menjadi 1 dan kehilangan nol depannya, padahal
                // nomor itu juga dipakai sebagai kode RT di tabel lain.
                $numerik = (is_int($nilai) || is_float($nilai))
                    && ! in_array($kolom[$i] ?? '', ['No', 'RT'], true);

                $sheet->setCellValueExplicit(
                    Coordinate::stringFromColumnIndex($i + 1).$r,
                    $nilai,
                    $numerik
                        ? \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC
                        : \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING
                );
            }
            $r++;
        }

        if ($baris !== []) {
            $terakhir = $r - 1;
            $sheet->getStyle("A{$barisHeader}:{$hurufAkhir}{$terakhir}")
                ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

            // Baris zebra supaya tabel panjang tetap mudah dibaca.
            for ($i = $barisHeader + 1; $i <= $terakhir; $i++) {
                if (($i - $barisHeader) % 2 === 0) {
                    $sheet->getStyle("A{$i}:{$hurufAkhir}{$i}")
                        ->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FFF0F6FF');
                }
            }
        }

        // Lebar kolom otomatis dari isi (maks 60 karakter supaya tidak melebar).
        for ($i = 1; $i <= $jumlahKolom; $i++) {
            $huruf = Coordinate::stringFromColumnIndex($i);
            $sheet->getColumnDimension($huruf)->setAutoSize(true);
        }

        $sheet->getStyle("A{$barisHeader}:{$hurufAkhir}{$barisHeader}")
            ->getAlignment()->setWrapText(true);

        $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);
        $sheet->freezePane('A'.($barisHeader + 1));

        // Autofilter: tanpa ini pengguna harus menyortir manual, padahal 92 baris
        // pengajuan hampir selalu disaring per RT atau per status.
        if ($baris !== []) {
            $sheet->setAutoFilter("A{$barisHeader}:{$hurufAkhir}".($barisHeader + count($baris)));
        }

        // Baris judul + header diulang di setiap halaman cetak. Tanpa ini, tabel
        // yang tercetak lebih dari satu halaman kehilangan nama kolomnya di
        // halaman kedua dan seterusnya.
        $sheet->getPageSetup()->setRowsToRepeatAtTopByStartAndEnd(1, $barisHeader);
        $sheet->getPageSetup()->setFitToPage(true);
        $sheet->getPageSetup()->setHorizontalCentered(true);

        // Nomor halaman di footer cetak.
        $sheet->getHeaderFooter()
            ->setOddFooter('&L&BansosHub&CHal. &P dari &N&R&D');

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $namaFile.'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Perkiraan lebar relatif tiap kolom (persen) dari panjang isi terpanjang.
     *
     * Totalnya WAJIB tepat 100. Versi sebelumnya memberi lantai 9% per kolom dan
     * membiarkan totalnya membengkak: dengan tujuh kolom hasilnya 112%, dan pada
     * `table-layout: fixed` kelebihan 12% itu memotong kolom paling kanan keluar
     * halaman (header "TANGGAL KIRIM" terpotong jadi "TANGGAL KIR", status dan
     * skor hilang). Setelah itu setiap sel dipaksa wrap dan satu baris data
     * pecah menjadi dua baris fisik di PDF.
     *
     * Jadi lebar dihitung dari porsi, lantai diterapkan, lalu dinormalkan kembali
     * ke 100 dengan pembagian proporsional.
     *
     * @param  array<int, string>  $kolom
     * @param  array<int, array<int, mixed>>  $baris
     * @return array<int, float>
     */
    private function lebarKolom(array $kolom, array $baris): array
    {
        $panjang = [];
        foreach ($kolom as $i => $label) {
            $panjang[$i] = mb_strlen((string) $label);
        }

        foreach ($baris as $isi) {
            foreach ($kolom as $i => $_) {
                $panjang[$i] = max($panjang[$i] ?? 0, mb_strlen((string) ($isi[$i] ?? '')));
            }
        }

        // Akar kuadrat meredam kolom Alamat yang panjangnya menyerap hampir semua
        // ruang; tanpa itu kolom lain terjepit sampai tidak terbaca.
        $bobot = array_map(static fn (int $p): float => sqrt(max($p, 1)), $panjang);
        $total = max(array_sum($bobot), 0.001);

        $lebar = [];
        foreach ($bobot as $i => $b) {
            $lebar[$i] = max(9.0, ($b / $total) * 100);
        }

        // Normalkan ke tepat 100 supaya tidak ada kolom yang tumpah keluar kertas.
        $jumlah = array_sum($lebar);
        foreach ($lebar as $i => $l) {
            $lebar[$i] = round($l / $jumlah * 100, 1);
        }

        // Pembulatan bisa menyisakan selisih 0.1; buang ke kolom terlebar supaya
        // totalnya benar-benar 100.0.
        $selisih = round(100 - array_sum($lebar), 1);
        if (abs($selisih) >= 0.1) {
            $terlebar = array_keys($lebar, max($lebar))[0];
            $lebar[$terlebar] = round($lebar[$terlebar] + $selisih, 1);
        }

        return $lebar;
    }

    /**
     * Nama file aman: tanpa spasi, hanya huruf/angka/strip.
     */
    public function slug(string $teks): string
    {
        $slug = preg_replace('/[^a-z0-9]+/', '-', mb_strtolower($teks)) ?? 'data';

        return trim($slug, '-');
    }
}
