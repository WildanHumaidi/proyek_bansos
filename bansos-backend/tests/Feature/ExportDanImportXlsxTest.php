<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\User;
use App\Models\Warga;
use Database\Seeders\KriteriaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

/**
 * Export PDF/Excel dan import XLSX.
 *
 * Yang dijaga:
 *  - setiap role hanya menerima data dalam wilayahnya (RT tidak bocor ke RT lain),
 *  - file benar-benar terbentuk (PDF diawali %PDF, XLSX diawali PK),
 *  - daftar akun tidak pernah memuat hash password atau token,
 *  - XLSX import menghasilkan baris yang sama dengan CSV import.
 */
class ExportDanImportXlsxTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(KriteriaSeeder::class);
    }

    private function akun(string $role, string $username, ?string $rt = null): User
    {
        return User::create([
            'name' => ucfirst($username),
            'username' => $username,
            'password' => bcrypt('rahasia123'),
            'role' => $role,
            'rt' => $rt,
        ]);
    }

    private function buatWarga(string $nama, string $rt, string $status = 'menunggu'): Warga
    {
        $warga = Warga::create([
            'nama_lengkap' => $nama,
            'alamat' => 'Jl. Uji No. 1',
            'rt' => $rt,
            'rw' => '008',
        ]);

        Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => $status,
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        return $warga;
    }

    // ── EXPORT ──────────────────────────────────────────────────────────────

    public function test_export_pengajuan_pdf_menghasilkan_file_pdf(): void
    {
        $this->buatWarga('Warga Satu', '001');
        Sanctum::actingAs($this->akun('admin', 'admin'));

        $res = $this->get('/api/export/pengajuan?format=pdf');

        $res->assertOk();
        $this->assertStringContainsString('application/pdf', $res->headers->get('content-type'));
        $this->assertStringContainsString('attachment', $res->headers->get('content-disposition'));
        $this->assertStringStartsWith('%PDF', $res->getContent());
    }

    public function test_export_pengajuan_xlsx_menghasilkan_file_excel(): void
    {
        $this->buatWarga('Warga Satu', '001');
        Sanctum::actingAs($this->akun('admin', 'admin'));

        $res = $this->get('/api/export/pengajuan?format=xlsx');

        $res->assertOk();
        $this->assertStringContainsString(
            'spreadsheetml',
            $res->headers->get('content-type')
        );
        $this->assertStringStartsWith('PK', $res->streamedContent(), 'XLSX adalah arsip ZIP');
    }

    public function test_rt_hanya_mendapat_data_wilayahnya_saat_export(): void
    {
        $this->buatWarga('Warga RT Satu', '001');
        $this->buatWarga('Warga RT Dua', '002');

        $rt = $this->akun('rt', 'rt001', '001');

        $data = (new \App\Http\Controllers\Api\ExportController(app(\App\Services\DataExporter::class)))
            ->susunWarga($rt);

        $nama = array_map(fn ($b) => $b[1], $data['baris']);

        $this->assertContains('Warga RT Satu', $nama);
        $this->assertNotContains('Warga RT Dua', $nama, 'RT tidak boleh melihat wilayah lain');
    }

    public function test_export_users_tidak_memuat_hash_password_atau_token(): void
    {
        $this->akun('admin', 'admin');
        $this->akun('warga', 'wargauji', '001');

        $admin = User::where('username', 'admin')->firstOrFail();

        $data = (new \App\Http\Controllers\Api\ExportController(app(\App\Services\DataExporter::class)))
            ->susunUsers($admin);

        $semua = json_encode($data['baris']);

        $hash = User::where('username', 'wargauji')->value('password');
        $this->assertStringNotContainsString($hash, $semua);
        $this->assertStringNotContainsString('$2y$', $semua);
        $this->assertStringContainsString('wargauji', $semua, 'username tetap tampil karena memang dibutuhkan');
    }

    public function test_warga_tidak_boleh_export_daftar_akun(): void
    {
        Sanctum::actingAs($this->akun('warga', 'wargauji', '001'));

        $this->get('/api/export/users?format=pdf')->assertStatus(403);
        $this->get('/api/export/pengajuan?format=pdf')->assertStatus(403);
    }

    public function test_format_export_tidak_dikenal_ditolak_422(): void
    {
        Sanctum::actingAs($this->akun('admin', 'admin'));

        $this->get('/api/export/pengajuan?format=docx')
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_export_saw_mengikuti_ranking_di_layar(): void
    {
        // Matriks penilaian lengkap supaya warga eligible masuk ranking.
        $warga = Warga::create([
            'nama_lengkap' => 'Warga Disetujui',
            'alamat' => 'Jl. Uji No. 1',
            'rt' => '001',
            'rw' => '008',
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        for ($i = 1; $i <= 10; $i++) {
            $sub = \App\Models\SubKriteria::where('id_kriteria', $i)->orderBy('id_subkriteria')->first();

            \App\Models\Penilaian::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_kriteria' => $i,
                'id_subkriteria' => $sub->id_subkriteria,
            ]);
        }

        $admin = $this->akun('admin', 'admin');

        $data = (new \App\Http\Controllers\Api\ExportController(app(\App\Services\DataExporter::class)))
            ->susunSaw($admin);

        $this->assertNotNull($data, 'SAW harus punya data untuk diekspor');
        $this->assertSame('Hasil Perangkingan SAW', $data['judul']);
        $this->assertSame('Warga Disetujui', $data['baris'][0][1]);
        $this->assertNotEmpty($data['baris'][0][3]);

        // Endpoint tetap mengirim file yang sah.
        Sanctum::actingAs($admin);
        $res = $this->get('/api/export/saw?format=pdf');
        $res->assertOk();
        $this->assertStringStartsWith('%PDF', $res->getContent());
    }

    // ── IMPORT XLSX ─────────────────────────────────────────────────────────

    /** @return array<int, string> header kolom yang sama dengan CSV resmi */
    private function header(): array
    {
        return [
            'Timestamp',
            'NAMA : ',
            'ALAMAT :',
            'JUMLAH KARTU KELUARGA (KK) DALAM SATU RUMAH : ',
            'JUMLAH ANGGOTA KELUARGA DALAM SATU RUMAH : ',
            'PENDIDIKAN KEPALA KELUARGA : ',
            'JUMLAH ANGGOTA KELUARGA MASIH SEKOLAH/KULIAH : ',
            'PENGELUARAN BULANAN 1 RUMAH : ',
            'PENGHASILAN BULANAN DALAM 1 RUMAH : ',
            'STATUS KEPEMILIKAN RUMAH : ',
            'SUMBER AIR BERSIH :',
            'SUMBER PENERANGAN RUMAH :',
            'TRANSPORTASI YANG DIGUNAKAN : ',
            'RT',
        ];
    }

    /** @return array<int, mixed> */
    private function baris(string $nama, string $alamat, string $rt = '1'): array
    {
        return [
            '4/14/2026 21:43:42', $nama, $alamat, '1 KK', '4 ORANG', 'SD', 'Tidak Ada',
            '400 - 700 Ribu', '< 400 Ribu', 'Sewa < 1 Juta', 'Sumur Milik Sendiri',
            'Listrik 450 watt', 'Sepeda Motor 1 Buah, dalam Kondisi Baik', $rt,
        ];
    }

    /** Tulis file XLSX asli ke disk sementara. */
    private function fileXlsx(array $dataBaris): string
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        foreach ($this->header() as $i => $label) {
            $sheet->setCellValue([$i + 1, 1], $label);
        }

        $r = 2;
        foreach ($dataBaris as $baris) {
            foreach ($baris as $i => $nilai) {
                $sheet->setCellValue([$i + 1, $r], $nilai);
            }
            $r++;
        }

        $path = tempnam(sys_get_temp_dir(), 'bansos_xlsx_').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);
        $spreadsheet->disconnectWorksheets();

        return $path;
    }

    public function test_import_xlsx_membuat_warga_pengajuan_dan_akun(): void
    {
        Sanctum::actingAs($this->akun('admin', 'admin'));

        $path = $this->fileXlsx([
            $this->baris('Warga Excel', 'Jl. Excel'),
        ]);

        try {
            $file = new UploadedFile($path, 'data_warga.xlsx', null, null, true);

            $res = $this->postJson('/api/admin/pengajuan/import', ['file' => $file])
                ->assertOk()
                ->assertJsonPath('banyak_import', 1)
                ->assertJsonPath('banyak_gagal', 0)
                ->assertJsonPath('banyak_akun', 1);
        } finally {
            @unlink($path);
        }

        $this->assertDatabaseHas('warga', ['nama_lengkap' => 'Warga Excel']);

        $warga = Warga::where('nama_lengkap', 'Warga Excel')->firstOrFail();
        $this->assertDatabaseHas('pengajuan', [
            'id_warga' => $warga->id_warga,
            'status' => 'menunggu',
        ]);

        $user = User::where('id_warga', $warga->id_warga)->firstOrFail();
        $this->assertSame('warga', $user->role);
        $this->assertTrue(Hash::check('warga123', $user->password));
        $this->assertSame('warga123', collect($res->json('laporan'))->firstWhere('username')['password_awal']);
    }

    public function test_import_xlsx_menolak_header_tanpa_kolom_wajib(): void
    {
        Sanctum::actingAs($this->akun('admin', 'admin'));

        $spreadsheet = new Spreadsheet;
        $spreadsheet->getActiveSheet()->setCellValue('A1', 'BEBAS');
        $path = tempnam(sys_get_temp_dir(), 'bansos_xlsx_').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);
        $spreadsheet->disconnectWorksheets();

        try {
            $file = new UploadedFile($path, 'salah.xlsx', null, null, true);

            $res = $this->postJson('/api/admin/pengajuan/import', ['file' => $file])
                ->assertStatus(422);

            $this->assertStringContainsString('NAMA', $res->json('message'));
        } finally {
            @unlink($path);
        }

        $this->assertSame(0, Warga::count(), 'tidak ada data yang masuk saat header salah');
    }

    public function test_import_xlsx_dengan_baris_gagal_membatalkan_semuanya(): void
    {
        Sanctum::actingAs($this->akun('admin', 'admin'));

        $path = $this->fileXlsx([
            $this->baris('Warga Valid', 'Jl. Valid'),
            $this->baris('', 'Jl. Tanpa Nama'), // nama kosong → gagal
        ]);

        try {
            $file = new UploadedFile($path, 'campur.xlsx', null, null, true);

            $this->postJson('/api/admin/pengajuan/import', ['file' => $file])
                ->assertStatus(422)
                ->assertJsonPath('banyak_gagal', 1);
        } finally {
            @unlink($path);
        }

        $this->assertSame(0, Warga::count(), 'satu baris gagal → semuanya di-rollback');
    }

    public function test_import_file_pdf_tetap_ditolak(): void
    {
        Sanctum::actingAs($this->akun('admin', 'admin'));

        $this->postJson('/api/admin/pengajuan/import', [
            'file' => UploadedFile::fake()->create('data.pdf', 20, 'application/pdf'),
        ])->assertStatus(422)->assertJsonValidationErrors('file');
    }
}
