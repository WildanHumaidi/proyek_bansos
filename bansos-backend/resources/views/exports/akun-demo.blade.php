<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Daftar Akun Demo BansosHub</title>
    <style>
        @page { margin: 14mm 10mm; }
        * { box-sizing: border-box; }
        body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 8pt; color: #0f172a; margin: 0; }

        .kop { border-bottom: 2.5pt solid #0b3fa8; padding-bottom: 6pt; margin-bottom: 8pt; }
        .kop h1 { font-size: 15pt; margin: 0 0 2pt; color: #0b3fa8; }
        .kop .instansi { font-size: 9pt; font-weight: bold; margin: 0; }
        .kop .sub { font-size: 8pt; color: #334155; margin: 3pt 0 0; }
        .kop .cetak { font-size: 7.5pt; color: #475569; margin: 2pt 0 0; }

        .awas {
            background: #FEF9C3; border: 0.8pt solid #B45309; border-left: 4pt solid #B45309;
            padding: 6pt 9pt; margin: 0 0 9pt; font-size: 7.8pt; line-height: 1.5; color: #7C2D12;
        }
        .awas strong { color: #7C2D12; }

        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        thead th {
            background: #0b3fa8; color: #fff; font-size: 7.3pt; font-weight: bold;
            text-transform: uppercase; letter-spacing: .3pt;
            padding: 5pt 4pt; border: .5pt solid #0b3fa8; text-align: left;
        }
        tbody td { padding: 3.6pt 4pt; border: .5pt solid #c7d7ee; font-size: 7.8pt; vertical-align: top; word-wrap: break-word; }
        tbody tr:nth-child(even) td { background: #f0f6ff; }
        .nomor { text-align: center; }
        .akun { font-family: "DejaVu Sans Mono", monospace; font-size: 7.6pt; }
        .role-admin td { background: #FEF9C3 !important; }
        .role-rw td { background: #F3E8FF !important; }
        .role-rt td { background: #DCFCE7 !important; }

        .footer { margin-top: 9pt; font-size: 7.2pt; color: #475569; border-top: .5pt solid #c7d7ee; padding-top: 4pt; }
    </style>
</head>
<body>
    <div class="kop">
        <h1>Daftar Akun Demo BansosHub</h1>
        <p class="instansi">Sistem Pendukung Keputusan Penerima Bantuan Sosial RW 08</p>
        <p class="sub">Semua akun beserta password yang berlaku saat dokumen ini dibuat</p>
        <p class="cetak">Dicetak {{ now()->translatedFormat('d F Y, H:i') }} WIB &middot; Total {{ count($baris) }} akun</p>
    </div>

    <div class="awas">
        <strong>Dokumen ini memuat password.</strong> Jangan dibagikan ke luar panitia demo dan
        jangan diunggah ke repo atau grup publik. Baris berwarna menandai akun staf yang dipakai
        saat demo berlangsung.
    </div>

    <table>
        <thead>
            <tr>
                @foreach ($kolom as $i => $label)
                    <th style="width: {{ $lebar[$i] ?? 10 }}%">{{ $label }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($baris as $isi)
                @php
                    $kelas = match ($isi[1]) {
                        'Administrator' => 'role-admin',
                        'Ketua RW' => 'role-rw',
                        'Ketua RT' => 'role-rt',
                        default => '',
                    };
                @endphp
                <tr class="{{ $kelas }}">
                    <td class="nomor">{{ $isi[0] }}</td>
                    <td>{{ $isi[1] }}</td>
                    <td class="nomor">{{ $isi[2] }}</td>
                    <td>{{ $isi[3] }}</td>
                    <td class="akun">{{ $isi[4] }}</td>
                    <td class="akun">{{ $isi[5] }}</td>
                    <td>{{ $isi[6] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Diurutkan per peran: Administrator, Ketua RW, Ketua RT, lalu warga. Warga dengan nama depan
        sama memakai password yang sama; untuk demo, masuk sebagai salah satu dari mereka sudah
        cukup. Akun warga boleh ganti password sendiri lewat menu Ganti Password setelah login.
    </div>
</body>
</html>
