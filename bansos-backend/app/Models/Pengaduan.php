<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pengaduan extends Model
{
    protected $table = 'pengaduan';

    protected $primaryKey = 'id_pengaduan';

    protected $fillable = [
        'id_warga',
        'id_pengajuan',
        'kategori',
        'isi',
        'status',
        'ditangani_oleh',
        'tanggapan',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    public function warga()
    {
        return $this->belongsTo(Warga::class, 'id_warga', 'id_warga');
    }

    public function pengajuan()
    {
        return $this->belongsTo(Pengajuan::class, 'id_pengajuan', 'id_pengajuan');
    }

    public function riwayat()
    {
        return $this->hasMany(PengaduanRiwayat::class, 'id_pengaduan', 'id_pengaduan');
    }
}