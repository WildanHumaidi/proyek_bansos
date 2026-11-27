<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Warga;
use App\Services\CsvImporter;
use Database\Seeders\KriteriaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Akun warga otomatis.
 *
 * Aturan operator: username = nama depan (huruf kecil, unik), password awal =
 * nama depan + "123". Berlaku untuk import CSV maupun backfill
 * `php artisan warga:buat-akun`.
 */
class ImportAkunWargaTest extends TestCase
{
    use RefreshDatabase;

    private array $csvSebelum = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(KriteriaSeeder::class);
        // Jangan sentuh CSV kredensial asli di storage/app; catat yang sudah ada.
        $this->csvSebelum = glob(storage_path('app/akun_warga_*.csv')) ?: [];
    }

    protected function tearDown(): void
    {
        $baru = array_diff(glob(storage_path('app/akun_warga_*.csv')) ?: [], $this->csvSebelum);
        foreach ($baru as $file) {
            @unlink($file);
        }

        parent::tearDown();
    }

    private function admin(): User
    {
        return User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);
    }

    private function header(): string
    {
        return 'Timestamp;NAMA : ;ALAMAT :;JUMLAH KARTU KELUARGA (KK) DALAM SATU RUMAH : ;'
            .'JUMLAH ANGGOTA KELUARGA DALAM SATU RUMAH : ;PENDIDIKAN KEPALA KELUARGA : ;'
            .'JUMLAH ANGGOTA KELUARGA MASIH SEKOLAH/KULIAH : ;PENGELUARAN BULANAN 1 RUMAH : ;'
            .'PENGHASILAN BULANAN DALAM 1 RUMAH : ;STATUS KEPEMILIKAN RUMAH : ;'
            .'SUMBER AIR BERSIH :;SUMBER PENERANGAN RUMAH :;TRANSPORTASI YANG DIGUNAKAN : ;RT';
    }

    private function baris(string $nama, string $alamat, string $rt = '1'): string
    {
        return "4/14/2026 21:43:42;{$nama};{$alamat};1 KK;4 ORANG;SD;Tidak Ada;400 - 700 Ribu;"
            ."< 400 Ribu;Sewa < 1 Juta;Sumur Milik Sendiri;Listrik 450 watt;"
            ."Sepeda Motor 1 Buah, dalam Kondisi Baik;{$rt}";
    }

    private function kirimImport(string $csv)
    {
        $this->admin();
        Sanctum::actingAs(User::where('username', 'admin')->firstOrFail());

        $file = UploadedFile::fake()->createWithContent('data_warga.csv', $csv);

        return $this->postJson('/api/admin/pengajuan/import', ['file' => $file]);
    }

    public function test_import_membuat_akun_username_nama_depan_dan_bisa_login(): void
    {
        $csv = $this->header()."\r\n"
            .$this->baris('Warga Satu', 'Jl. Satu')."\r\n"
            .$this->baris('Nama Kembar', 'Jl. Kembar B')."\r\n"
            .$this->baris('Nama Kembar', 'Jl. Kembar C')."\r\n";

        $res = $this->kirimImport($csv);

        $res->assertOk()
            ->assertJsonPath('banyak_import', 3)
            ->assertJsonPath('banyak_gagal', 0)
            ->assertJsonPath('banyak_akun', 3);

        $this->assertSame(3, Warga::count());
        $this->assertSame(4, User::count(), 'admin + 3 akun warga');

        foreach (Warga::all() as $warga) {
            $user = User::where('id_warga', $warga->id_warga)->first();
            $this->assertNotNull($user, "Warga {$warga->nama_lengkap} wajib punya akun");
            $this->assertSame('warga', $user->role);
            $this->assertSame($warga->rt, $user->rt);
        }

        // Username = nama depan; kembar kedua mendapat satu huruf (nama -> namaa).
        $this->assertTrue(User::where('username', 'warga')->exists());
        $this->assertTrue(User::where('username', 'nama')->exists());
        $this->assertTrue(User::where('username', 'namaa')->exists());
        $this->assertSame(1, User::where('username', 'nama')->count());

        // Password awal = nama depan + 123, dan benar-benar password akunnya.
        $user = User::where('username', 'warga')->firstOrFail();
        $this->assertTrue(Hash::check('warga123', $user->password));

        $akun = collect($res->json('laporan'))->firstWhere('username', 'warga');
        $this->assertSame('warga123', $akun['password_awal']);

        $namaa = collect($res->json('laporan'))->firstWhere('username', 'namaa');
        $this->assertSame('nama123', $namaa['password_awal']);

        // Akun bisa dipakai: login mengembalikan token.
        // Sanctum::actingAs menggeser default guard; kembalikan ke web dulu.
        Auth::shouldUse('web');
        $this->postJson('/api/login', [
            'username' => 'warga',
            'password' => 'warga123',
        ])->assertOk()->assertJsonStructure(['success', 'token', 'user']);
    }

    public function test_import_ulang_melengkapi_akun_warga_lama_tanpa_menggandakan(): void
    {
        $csv = $this->header()."\r\n".$this->baris('Warga Lama', 'Jl. Lama')."\r\n";

        // Impor lama (sebelum fitur akun) — via service, tanpa flag.
        $awal = (new CsvImporter)->impor($csv);
        $this->assertSame(1, $awal['banyak_import']);
        $this->assertSame(0, User::count(), 'impor langsung tanpa flag tetap tidak membuat akun');

        // Admin mengimpor ulang file yang sama lewat endpoint.
        $res = $this->kirimImport($csv);

        $res->assertOk()
            ->assertJsonPath('banyak_import', 0)
            ->assertJsonPath('banyak_skip', 1)
            ->assertJsonPath('banyak_akun', 1);

        $this->assertSame(1, Warga::count(), 'warga tidak digandakan');
        $this->assertSame(2, User::count(), 'admin + 1 akun hasil pelengkapan');

        $user = User::where('role', 'warga')->firstOrFail();
        $this->assertSame('warga', $user->username);
        $this->assertTrue(Hash::check('warga123', $user->password));
    }

    public function test_perintah_warga_buat_akun_membuat_akun_massal_dengan_sufiks(): void
    {
        Warga::create(['nama_lengkap' => 'Budi Santoso', 'alamat' => 'Jl. A', 'rt' => '001', 'rw' => '008']);
        Warga::create(['nama_lengkap' => 'Budi Hartono', 'alamat' => 'Jl. B', 'rt' => '002', 'rw' => '008']);
        Warga::create(['nama_lengkap' => 'Siti Aminah', 'alamat' => 'Jl. C', 'rt' => '001', 'rw' => '008']);

        $this->artisan('warga:buat-akun', ['--dry-run' => true])->assertExitCode(0);
        $this->assertSame(0, User::count(), 'dry-run tidak menulis akun');

        $this->artisan('warga:buat-akun')->assertExitCode(0);

        $this->assertSame(3, User::count());
        $this->assertTrue(User::where('username', 'budi')->exists());
        $this->assertTrue(User::where('username', 'budia')->exists());
        $this->assertTrue(User::where('username', 'siti')->exists());

        $this->assertTrue(Hash::check('budi123', User::where('username', 'budi')->value('password')));
        $this->assertTrue(Hash::check('siti123', User::where('username', 'siti')->value('password')));

        // Setiap akun tertaut ke warga yang benar (budi vs budia tidak tertukar).
        $this->assertSame(
            'Budi Santoso',
            User::where('username', 'budi')->firstOrFail()->warga->nama_lengkap
        );
        $this->assertSame(
            'Budi Hartono',
            User::where('username', 'budia')->firstOrFail()->warga->nama_lengkap
        );
    }
}