<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengaduanRiwayat extends Model
{
    protected $table = 'pengaduan_riwayat';

    protected $primaryKey = 'id_riwayat';

    protected $fillable = [
        'id_pengaduan',
        'status_lama',
        'status_baru',
        'diubah_oleh',
        'catatan',
    ];

    public function pengaduan()
    {
        return $this->belongsTo(Pengaduan::class, 'id_pengaduan', 'id_pengaduan');
    }
}