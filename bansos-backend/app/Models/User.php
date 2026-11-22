<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'role',
        'rt',
        'alamat',
        'id_warga',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Identitas warga milik akun ini.
     *
     * Relasi WAJIB lewat id_warga, bukan nama: nama bisa duplikat, dan mencocokkan
     * dengan nama membuat akun bisa membaca atau menimpa data warga lain.
     */
    public function warga()
    {
        return $this->belongsTo(Warga::class, 'id_warga', 'id_warga');
    }

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }
}
