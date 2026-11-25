<?php

namespace Tests\Feature;

use App\Models\Kriteria;
use App\Models\Pengajuan;
use App\Models\Penilaian;
use App\Models\SubKriteria;
use App\Models\User;
use App\Models\Warga;
use App\Services\SawCalculator;
use Database\Seeders\KriteriaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\Support\KriteriaFixture;
use Tests\TestCase;

/**
 * P2-10 — delapan kelompok pengujian jurnal (Bab 3.5 / Tabel 3.2).
 *
 * Audit mencatat jurnal mengklaim "29/29 test case lulus" tetapi repo hanya
 * menutup ~19 padanan, dan tiga kelompok hilang total (terutama cetak laporan).
 * Berkas ini memetakan setiap kelompok jurnal ke pengujian API yang benar-benar
 * menjaga perilaku yang diklaim, bukan sekadar menambah jumlah test.
 *
 * Kelompok:
 *  1. Autentikasi (login valid/invalid, peran untuk redirect, proteksi rute)
 *  2. Registrasi warga (valid, username duplikat, password pendek)
 *  3. Pengajuan kuesioner (lengkap, duplikat, lihat status)
 *  4. Verifikasi & akses data RT (setujui, tolak, filter wilayah, edit jawaban)
 *  5. Perhitungan SAW (urutan ranking, tampilan matriks keputusan)
 *  6. Import CSV
 *  7. Manajemen akun (tambah, edit, hapus, username duplikat)
 *  8. Cetak laporan (matriks SAW, ranking, activity log)
 */
class JurnalKelompokTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(KriteriaSeeder::class);
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    protected function user(string $role, array $extra = []): User
    {
        static $n = 0;
        $n++;

        return User::create(array_merge([
            'name' => ucfirst($role)." {$n}",
            'username' => "{$role}{$n}",
            'password' => bcrypt('rahasia123'),
            'role' => $role,
        ], $extra));
    }

    protected function admin(): User
    {
        $admin = $this->user('admin');
        Sanctum::actingAs($admin);

        return $admin;
    }

    protected function ketuaRt(string $rt): User
    {
        $ketua = $this->user('rt', ['rt' => $rt]);
        Sanctum::actingAs($ketua);

        return $ketua;
    }

    /** Buat warga + pengajuan berstatus tertentu dengan matriks lengkap. */
    protected function pengajuan(string $nama, string $rt, string $status = 'disetujui', ?int $opsiC1 = null): Pengajuan
    {
        $warga = Warga::create([
            'nama_lengkap' => $nama,
            'alamat' => "Jl. {$nama}",
            'rt' => $rt,
            'rw' => '008',
        ]);

        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => $status,
        ]);

        foreach (KriteriaFixture::OPSI as $idKriteria => $opsi) {
            $index = $idKriteria === 1 && $opsiC1 !== null ? $opsiC1 : 0;
            $sub = SubKriteria::where('id_kriteria', $idKriteria)
                ->where('keterangan', $opsi[$index])
                ->firstOrFail();

            Penilaian::create([
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_kriteria' => $idKriteria,
                'id_subkriteria' => $sub->id_subkriteria,
            ]);
        }

        return $pengajuan;
    }

    // ════════════════════════════════════════════════════════════════════════
    // Kelompok 1 — Autentikasi
    // ════════════════════════════════════════════════════════════════════════

    public function test_kelompok1_login_valid_mengembalikan_token_dan_peran(): void
    {
        $this->user('rt', ['rt' => '001', 'username' => 'rt001']);

        $res = $this->postJson('/api/login', ['username' => 'rt001', 'password' => 'rahasia123'])
            ->assertOk()
            ->assertJsonPath('success', true);

        // Peran & RT dipakai frontend untuk mengarahkan ke dashboard yang tepat.
        $this->assertSame('rt', $res->json('user.role'));
        $this->assertSame('001', $res->json('user.rt'));
        $this->assertNotEmpty($res->json('token'));
    }

    public function test_kelompok1_login_salah_ditolak_tanpa_membocorkan_alasan(): void
    {
        $this->user('admin', ['username' => 'admin']);

        $this->postJson('/api/login', ['username' => 'admin', 'password' => 'salah'])
            ->assertStatus(401)
            ->assertJsonPath('success', false);

        $this->postJson('/api/login', ['username' => 'tidak-ada', 'password' => 'apa-saja'])
            ->assertStatus(401);
    }

    public function test_kelompok1_rute_privat_menolak_tanpa_token_dengan_json_401(): void
    {
        // Bukan redirect HTML: frontend mengharapkan JSON agar bisa logout rapi.
        $this->getJson('/api/saw/hitung')
            ->assertStatus(401)
            ->assertJsonStructure(['message']);
    }

    public function test_kelompok1_logout_mencabut_token_yang_dipakai(): void
    {
        $user = $this->user('warga');
        $token = $user->createToken('uji')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout')
            ->assertOk();

        // Token yang sama tidak boleh dipakai lagi.
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/warga/status')
            ->assertStatus(401);
    }

    // ════════════════════════════════════════════════════════════════════════
    // Kelompok 2 — Registrasi warga
    // ════════════════════════════════════════════════════════════════════════

    public function test_kelompok2_registrasi_valid_membuat_identitas_warga_tertaut(): void
    {
        $this->postJson('/api/register', [
            'nama_lengkap' => 'Warga Baru',
            'username' => 'wargabaru',
            'password' => 'rahasia123',
            'rt' => '002',
            'alamat' => 'Jl. Baru 1',
        ])->assertStatus(201);

        $user = User::where('username', 'wargabaru')->firstOrFail();
        $this->assertNotNull($user->id_warga, 'Akun harus tertaut identitas warga');
        $this->assertSame('002', $user->rt);
        $this->assertSame('002', Warga::find($user->id_warga)->rt);
    }

    public function test_kelompok2_registrasi_username_duplikat_ditolak(): void
    {
        $this->user('warga', ['username' => 'kembar']);

        $this->postJson('/api/register', [
            'nama_lengkap' => 'Orang Lain',
            'username' => 'kembar',
            'password' => 'rahasia123',
            'rt' => '001',
            'alamat' => 'Jl. Lain',
        ])->assertStatus(422);
    }

    public function test_kelompok2_registrasi_password_pendek_ditolak(): void
    {
        $this->postJson('/api/register', [
            'nama_lengkap' => 'Warga Pendek',
            'username' => 'pendek',
            'password' => '123',
            'rt' => '001',
            'alamat' => 'Jl. Pendek',
        ])->assertStatus(422);

        $this->assertNull(User::where('username', 'pendek')->first());
    }

    public function test_kelompok2_registrasi_rt_tidak_sah_ditolak(): void
    {
        foreach (['RT01', '0', 'abc', '1000'] as $rt) {
            $this->postJson('/api/register', [
                'nama_lengkap' => 'Warga RT Aneh',
                'username' => 'aneh-'.md5($rt),
                'password' => 'rahasia123',
                'rt' => $rt,
                'alamat' => 'Jl. Aneh',
            ])->assertStatus(422);
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // Kelompok 3 — Pengajuan kuesioner
    // ════════════════════════════════════════════════════════════════════════

    protected function jawabanLengkap(): array
    {
        return [
            'q1' => '> 3 KK', 'q2' => '5 Orang', 'q3' => 'SD',
            'q4' => '2 Orang', 'q5' => '400 - 700 Ribu', 'q6' => '< 400 Ribu',
            'q7' => 'Sewa < 1 Juta', 'q8' => 'PDAM Terbatas',
            'q9' => 'Listrik 450 watt', 'q10' => 'Sepeda Motor 1 Buah, dalam Kondisi Baik',
        ];
    }

    public function test_kelompok3_pengajuan_lengkap_dibuat_dan_matriks_terbentuk(): void
    {
        $warga = $this->user('warga', ['rt' => '001']);
        $identitas = Warga::create([
            'nama_lengkap' => 'Warga Kuesioner', 'alamat' => 'Jl. K', 'rt' => '001', 'rw' => '008',
        ]);
        $warga->update(['id_warga' => $identitas->id_warga]);
        Sanctum::actingAs($warga);

        $this->postJson('/api/warga/pengajuan', [
            'nama_lengkap' => 'Warga Kuesioner',
            'alamat' => 'Jl. K',
            'rt' => '001',
            'jawaban_mentah' => $this->jawabanLengkap(),
        ])->assertOk(); // endpoint membalas 200 dengan {success:true}, bukan 201

        $pengajuan = Pengajuan::where('id_warga', $identitas->id_warga)->firstOrFail();

        // Saat submit: hanya jawaban mentah yang disimpan, status menunggu, dan
        // matriks penilaian BELUM dibentuk (dibentuk saat approval oleh RT).
        $this->assertSame('menunggu', $pengajuan->status);
        $this->assertSame(10, count(json_decode($pengajuan->jawaban_mentah, true)));
        $this->assertSame(0, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());

        // Setelah RT menyetujui: matriks 10 kriteria terbentuk dari jawaban itu.
        $this->ketuaRt('001');
        $this->putJson("/api/admin/pengajuan/{$pengajuan->id_pengajuan}/status", ['status' => 'disetujui'])
            ->assertOk();

        $this->assertSame('disetujui', $pengajuan->fresh()->status);
        $this->assertSame(10, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());
    }

    public function test_kelompok3_pengajuan_kedua_ditolak(): void
    {
        $identitas = Warga::create([
            'nama_lengkap' => 'Warga Ganda', 'alamat' => 'Jl. G', 'rt' => '001', 'rw' => '008',
        ]);
        $warga = $this->user('warga', ['rt' => '001', 'id_warga' => $identitas->id_warga]);
        Sanctum::actingAs($warga);

        $payload = [
            'nama_lengkap' => 'Warga Ganda',
            'alamat' => 'Jl. G',
            'rt' => '001',
            'jawaban_mentah' => $this->jawabanLengkap(),
        ];

        $this->postJson('/api/warga/pengajuan', $payload)->assertOk();
        $this->postJson('/api/warga/pengajuan', $payload)->assertStatus(400);

        $this->assertSame(1, Pengajuan::where('id_warga', $identitas->id_warga)->count());
    }

    public function test_kelompok3_warga_melihat_status_pengajuannya_sendiri(): void
    {
        $identitas = Warga::create([
            'nama_lengkap' => 'Warga Status', 'alamat' => 'Jl. S', 'rt' => '001', 'rw' => '008',
        ]);
        $pengajuan = Pengajuan::create([
            'id_warga' => $identitas->id_warga, 'status' => 'disetujui',
        ]);

        $warga = $this->user('warga', ['rt' => '001', 'id_warga' => $identitas->id_warga]);
        Sanctum::actingAs($warga);

        $this->getJson('/api/warga/status')
            ->assertOk()
            ->assertJsonPath('data.id_pengajuan', $pengajuan->id_pengajuan)
            ->assertJsonPath('data.status', 'disetujui');
    }

    // ════════════════════════════════════════════════════════════════════════
    // Kelompok 4 — Verifikasi & akses data RT
    // ════════════════════════════════════════════════════════════════════════

    public function test_kelompok4_rt_menyetujui_pengajuan_dan_penilaian_terbentuk(): void
    {
        $p = $this->pengajuan('Warga Setuju', '001', 'menunggu');
        // Hapus matriks dulu: approval harus membangunnya dari jawaban mentah.
        Penilaian::where('id_pengajuan', $p->id_pengajuan)->delete();
        $p->update(['jawaban_mentah' => json_encode($this->jawabanLengkap())]);

        $this->ketuaRt('001');

        $this->putJson("/api/admin/pengajuan/{$p->id_pengajuan}/status", ['status' => 'disetujui'])
            ->assertOk();

        $this->assertSame('disetujui', $p->fresh()->status);
        $this->assertSame(10, Penilaian::where('id_pengajuan', $p->id_pengajuan)->count());
    }

    public function test_kelompok4_rt_menolak_pengajuan(): void
    {
        $p = $this->pengajuan('Warga Tolak', '001', 'menunggu');
        $this->ketuaRt('001');

        $this->putJson("/api/admin/pengajuan/{$p->id_pengajuan}/status", ['status' => 'ditolak'])
            ->assertOk();

        $this->assertSame('ditolak', $p->fresh()->status);
    }

    public function test_kelompok4_filter_wilayah_rt_hanya_melihat_wilayahnya(): void
    {
        $this->pengajuan('Warga RT1', '001', 'menunggu');
        $this->pengajuan('Warga RT2', '002', 'menunggu');

        $this->ketuaRt('001');

        $res = $this->getJson('/api/admin/pengajuan')->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('Warga RT1', $res->json('data.0.warga.nama_lengkap'));
    }

    public function test_kelompok4_rt_mengedit_jawaban_kuesioner_wilayahnya(): void
    {
        $p = $this->pengajuan('Warga Edit', '001', 'menunggu');
        $this->ketuaRt('001');

        $this->putJson("/api/admin/pengajuan/{$p->id_pengajuan}/kuesioner", [
            'jawaban_mentah' => $this->jawabanLengkap(),
        ])->assertOk();

        $this->assertSame(10, Penilaian::where('id_pengajuan', $p->id_pengajuan)->count());
    }

    // ════════════════════════════════════════════════════════════════════════
    // Kelompok 5 — Perhitungan SAW (urutan + tampilan matriks keputusan)
    // ════════════════════════════════════════════════════════════════════════

    public function test_kelompok5_urutan_ranking_mengikuti_nilai_preferensi(): void
    {
        // C1 benefit: opsi 0 = '> 3 KK' (10), opsi 3 = '1 KK' (2.5).
        $this->pengajuan('Paling Butuh', '001', 'disetujui', 3);
        $this->pengajuan('Paling Mampu', '001', 'disetujui', 0);

        $this->admin();

        $data = $this->getJson('/api/saw/hitung')->assertOk()->json('data');
        $this->assertSame('Paling Mampu', $data[0]['nama_warga']);
        $this->assertSame(1, $data[0]['ranking']);
        $this->assertSame('Paling Butuh', $data[1]['nama_warga']);
    }

    public function test_kelompok5_matriks_keputusan_tersedia_dan_lengkap(): void
    {
        // "Tampilan matriks keputusan" di jurnal = layar Matriks SAW admin.
        // Kontraknya: /saw/dataset memuat nilai tiap kriteria untuk tiap alternatif.
        $this->pengajuan('Warga Matriks', '001');

        $this->admin();

        $res = $this->getJson('/api/saw/dataset')->assertOk();

        $this->assertCount(10, $res->json('kriteria'), 'Harus ada 10 kolom kriteria C1..C10');

        $baris = $res->json('dataset.0');
        $this->assertSame('Warga Matriks', $baris['nama_warga']);
        foreach (range(1, 10) as $k) {
            $this->assertArrayHasKey("C{$k}", $baris, "Kolom C{$k} harus ada di matriks");
            $this->assertNotNull($baris["C{$k}"], "Nilai C{$k} tidak boleh kosong");
        }
    }

    public function test_kelompok5_kriteria_konstan_dilaporkan_bukan_disembunyikan(): void
    {
        // BUG-05: kolom konstan tidak mendiskriminasi apa pun; sistem harus
        // melaporkannya supaya staf tahu bobot 10 % itu tidak berpengaruh.
        $this->pengajuan('Warga A', '001');
        $this->pengajuan('Warga B', '001');
        // Keduanya identik → SEMUA kriteria konstan.

        $this->admin();

        $res = $this->getJson('/api/saw/hitung')->assertOk();
        $this->assertCount(10, $res->json('kriteria_tanpa_variasi'));
    }

    public function test_kelompok5_kriteria_bervariasi_tidak_dilaporkan_konstan(): void
    {
        $this->pengajuan('Warga A', '001', 'disetujui', 0);
        $this->pengajuan('Warga B', '001', 'disetujui', 3);

        $this->admin();

        $tanpaVariasi = $this->getJson('/api/saw/hitung')->assertOk()->json('kriteria_tanpa_variasi');

        // C1 berbeda antar alternatif → tidak boleh masuk daftar konstan.
        $this->assertNotContains('Jumlah KK dalam 1 Rumah', $tanpaVariasi);
        // Sembilan kriteria lain identik → harus dilaporkan.
        $this->assertCount(9, $tanpaVariasi);
    }

    // ════════════════════════════════════════════════════════════════════════
    // Kelompok 6 — Import CSV
    // ════════════════════════════════════════════════════════════════════════

    public function test_kelompok6_import_csv_membentuk_matriks_dan_status_menunggu(): void
    {
        $this->admin();

        $file = UploadedFile::fake()->createWithContent(
            'data.csv',
            file_get_contents(database_path('data/data_warga.csv'))
        );

        $this->postJson('/api/admin/pengajuan/import', ['file' => $file])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame(90, Warga::count());
        $this->assertSame(90, Pengajuan::count());
        $this->assertSame(0, Pengajuan::where('status', '!=', 'menunggu')->count());
        $this->assertSame(900, Penilaian::count(), '90 alternatif × 10 kriteria');
    }

    // ════════════════════════════════════════════════════════════════════════
    // Kelompok 7 — Manajemen akun
    // ════════════════════════════════════════════════════════════════════════

    public function test_kelompok7_admin_menambah_mengedit_dan_menghapus_akun(): void
    {
        $this->admin();

        $this->postJson('/api/users', [
            'name' => 'Akun Baru',
            'username' => 'akunbaru',
            'password' => 'rahasia123',
            'role' => 'rw',
        ])->assertStatus(201);

        $baru = User::where('username', 'akunbaru')->firstOrFail();

        $this->putJson("/api/users/{$baru->id}", ['name' => 'Akun Diubah'])->assertOk();
        $this->assertSame('Akun Diubah', $baru->fresh()->name);

        $this->deleteJson("/api/admin/users/{$baru->id}")->assertOk();
        $this->assertNull(User::find($baru->id));
    }

    public function test_kelompok7_username_duplikat_ditolak(): void
    {
        $this->user('warga', ['username' => 'sudahada']);
        $this->admin();

        $this->postJson('/api/users', [
            'name' => 'Bentrok',
            'username' => 'sudahada',
            'password' => 'rahasia123',
            'role' => 'warga',
        ])->assertStatus(422);
    }

    // ════════════════════════════════════════════════════════════════════════
    // Kelompok 8 — Cetak / ekspor laporan (jurnal: 3 kasus)
    // ════════════════════════════════════════════════════════════════════════

    public function test_kelompok8_cetak_laporan_ranking_mengandung_semua_alternatif(): void
    {
        $this->pengajuan('Warga Cetak A', '001');
        $this->pengajuan('Warga Cetak B', '002');
        $this->admin();

        $csv = $this->get('/api/saw/report/export?format=csv')->assertOk()->getContent();
        $baris = array_values(array_filter(explode("\n", $csv), fn ($b) => trim($b) !== ''));

        $this->assertCount(3, $baris, 'Header + 2 alternatif');
        $this->assertStringContainsString('Nama Warga', $baris[0]);
        $this->assertStringContainsString('Ranking RT', $baris[0]);
        $this->assertStringContainsString('Warga Cetak A', $csv);
        $this->assertStringContainsString('Warga Cetak B', $csv);
    }

    public function test_kelompok8_cetak_laporan_matriks_saw_sesuai_scope_peran(): void
    {
        $this->pengajuan('Warga RT1', '001');
        $this->pengajuan('Warga RT2', '002');

        $this->ketuaRt('001');
        $csv = $this->get('/api/saw/report/export?format=csv')->assertOk()->getContent();

        $this->assertStringContainsString('Warga RT1', $csv);
        $this->assertStringNotContainsString('Warga RT2', $csv, 'RT tidak boleh mengekspor wilayah lain');
    }

    public function test_kelompok8_activity_log_dapat_dicetak_admin(): void
    {
        $this->admin();

        $this->postJson('/api/users', [
            'name' => 'Akun Log',
            'username' => 'akunlog',
            'password' => 'rahasia123',
            'role' => 'warga',
        ])->assertStatus(201);

        $res = $this->getJson('/api/logs')->assertOk();
        $this->assertIsArray($res->json('data'));
        // Struktur kolom yang dipakai layar cetak Activity Log.
        foreach ($res->json('data') as $log) {
            $this->assertArrayHasKey('user_name', $log);
            $this->assertArrayHasKey('role', $log);
            $this->assertArrayHasKey('aksi', $log);
            $this->assertArrayHasKey('created_at', $log);
        }
    }

    public function test_kelompok8_format_ekspor_tidak_dikenal_ditolak(): void
    {
        $this->admin();

        $this->getJson('/api/saw/report/export?format=pdf')->assertStatus(422);
    }

    // ════════════════════════════════════════════════════════════════════════
    // Penjaga: kalkulator tidak bergantung pada urutan pemanggilan
    // ════════════════════════════════════════════════════════════════════════

    public function test_saw_calculator_memakai_fixture_kriteria_yang_sama(): void
    {
        // Memastikan seeder produksi dan fixture test tidak menyimpang: keduanya
        // harus memberi 10 kriteria dan label opsi yang identik.
        $this->assertSame(10, Kriteria::count());
        $this->assertSame(40, SubKriteria::count());

        foreach (KriteriaFixture::OPSI as $idKriteria => $opsi) {
            $label = SubKriteria::where('id_kriteria', $idKriteria)->pluck('keterangan')->all();
            sort($label);
            $harap = $opsi;
            sort($harap);
            $this->assertSame($harap, $label, "Label C{$idKriteria} berbeda dari fixture");
        }
    }

    public function test_saw_calculator_mengembalikan_struktur_lengkap(): void
    {
        $this->pengajuan('Warga Struktur', '001');
        $hasil = SawCalculator::hitung($this->user('admin'));

        $this->assertTrue($hasil['success']);
        $this->assertSame(1, $hasil['total']);
        $this->assertArrayHasKey('dilewati', $hasil);
        $this->assertArrayHasKey('kriteria_tanpa_variasi', $hasil);
        $this->assertArrayHasKey('scope_rt', $hasil);

        $baris = $hasil['data'][0];
        foreach (['id_pengajuan', 'nama_warga', 'rt', 'skor_saw', 'ranking', 'ranking_rt'] as $kunci) {
            $this->assertArrayHasKey($kunci, $baris);
        }
    }
}
