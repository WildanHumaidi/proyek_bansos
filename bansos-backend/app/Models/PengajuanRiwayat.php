<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Riwayat perubahan status/jawaban pengajuan (P1-06).
 * Dibuat saat pengajuan ditolak kemudian diajukan ulang: pengajuan lama
 * diarsipkan di sini, baris `pengajuan` yang sama dipakai kembali.
 */
class PengajuanRiwayat extends Model
{
    protected $table = 'pengajuan_riwayat';

    protected $primaryKey = 'id_riwayat';

    protected $fillable = [
        'id_pengajuan',
        'status_lama',
        'jawaban_lama',
        'diubah_oleh',
    ];

    public function pengajuan()
    {
        return $this->belongsTo(Pengajuan::class, 'id_pengajuan', 'id_pengajuan');
    }
}