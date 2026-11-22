<?php

namespace Tests\Feature;

use App\Models\Kriteria;
use App\Models\Pengajuan;
use App\Models\Penilaian;
use App\Models\SubKriteria;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WargaPengajuanGuardTest extends TestCase
{
    use RefreshDatabase;

    protected function admin(): void
    {
        Sanctum::actingAs(User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]));
    }

    protected function warga(): Warga
    {
        return Warga::create([
            'nama_lengkap' => 'Warga Guard',
            'alamat' => 'Alamat',
            'rt' => '001',
            'rw' => '008',
            'password' => bcrypt('secret'),
        ]);
    }

    public function test_import_csv_menolak_file_yang_bukan_csv(): void
    {
        $this->admin();

        $this->postJson('/api/admin/pengajuan/import', [
            'file' => UploadedFile::fake()->create('data.pdf', 20, 'application/pdf'),
        ])->assertStatus(422)->assertJsonValidationErrors('file');
    }

    public function test_import_csv_menerima_file_csv(): void
    {
        $this->admin();

        $csv = "Timestamp;NAMA : ;ALAMAT :;JUMLAH KARTU KELUARGA (KK) DALAM SATU RUMAH : ;JUMLAH ANGGOTA KELUARGA DALAM SATU RUMAH : ;PENDIDIKAN KEPALA KELUARGA : ;JUMLAH ANGGOTA KELUARGA MASIH SEKOLAH/KULIAH : ;PENGELUARAN BULANAN 1 RUMAH : ;PENGHASILAN BULANAN DALAM 1 RUMAH : ;STATUS KEPEMILIKAN RUMAH : ;SUMBER AIR BERSIH :;SUMBER PENERANGAN RUMAH :;TRANSPORTASI YANG DIGUNAKAN : ;RT\r\n"
            ."4/14/2026 21:43:42;Warga Import ;Jl. Uji;1 KK;5 ORANG;SEKOLAH DASAR (SD);1 ORANG;< Rp. 1.500.000;< Rp. 1.500.000;MENUMPANG;SUNGAI / MATA AIR;TIDAK ADA / LAMPU TEMPEL;JALAN KAKI / SEPEDA / SEPEDA MOTOR SEADANYA / TRANSPORTASI UMUM;1\r\n";

        $file = UploadedFile::fake()->createWithContent('data.csv', $csv);

        $this->postJson('/api/admin/pengajuan/import', ['file' => $file])
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('warga', ['nama_lengkap' => 'Warga Import']);
    }

    public function test_pengajuan_kedua_untuk_warga_yang_sama_ditolak_dengan_400(): void
    {
        $this->admin();
        $warga = $this->warga();

        Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'menunggu',
            'jawaban_mentah' => json_encode(['q1' => '1 KK']),
        ]);

        // Pengecekan awal di controller memang menolak lebih dulu; pastikan pesannya
        // tetap 400 dan tidak ada baris kedua yang terbentuk.
        $this->postJson('/api/warga/pengajuan-rt', [
            'nama_lengkap' => 'Warga Guard',
            'alamat' => 'Alamat',
            'rt' => '001',
            'jawaban_mentah' => ['q1' => '1 KK'],
        ])->assertStatus(400);

        $this->assertSame(1, Pengajuan::where('id_warga', $warga->id_warga)->count());
    }

    public function test_update_kuesioner_membangun_ulang_matriks_dari_jawaban_mentah(): void
    {
        $this->admin();

        for ($i = 1; $i <= 10; $i++) {
            $k = Kriteria::create([
                'nama_kriteria' => "Kriteria $i",
                'tipe' => in_array($i, [1, 2, 4], true) ? 'benefit' : 'cost',
                'bobot' => 10,
            ]);
            foreach (['> 3 KK', '3 KK', '2 KK', '1 KK'] as $j => $ket) {
                SubKriteria::create([
                    'id_kriteria' => $k->id_kriteria,
                    'keterangan' => $ket,
                    'nilai' => [10, 7.5, 5, 2.5][$j],
                ]);
            }
        }

        $warga = $this->warga();
        $pengajuan = Pengajuan::create([
            'id_warga' => $warga->id_warga,
            'status' => 'disetujui',
            'jawaban_mentah' => json_encode(array_fill_keys(
                array_map(fn ($i) => "q$i", range(1, 10)),
                '1 KK'
            )),
        ]);

        $this->putJson("/api/admin/pengajuan/{$pengajuan->id_pengajuan}/kuesioner", [
            'jawaban_mentah' => array_fill_keys(
                array_map(fn ($i) => "q$i", range(1, 10)),
                '3 KK'
            ),
        ])->assertOk();

        $this->assertSame(10, Penilaian::where('id_pengajuan', $pengajuan->id_pengajuan)->count());

        $nilai = Penilaian::with('subKriteria')
            ->where('id_pengajuan', $pengajuan->id_pengajuan)
            ->get()
            ->pluck('subKriteria.nilai')
            ->unique()
            ->values()
            ->all();

        // '3 KK' ada di index 1 setiap kriteria → nilai 7.5 untuk benefit, dan
        // kriteria cost memakai sub-kriteria yang sama (7.5) karena fixture ini
        // memakai daftar keterangan identik untuk semua kriteria.
        $this->assertSame([7.5], $nilai);
    }
}
