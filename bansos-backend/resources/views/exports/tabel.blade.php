<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $judul }}</title>
    <style>
        @page { margin: 16mm 12mm; }
        * { box-sizing: border-box; }
        body {
            font-family: "DejaVu Sans", Arial, sans-serif;
            font-size: 8.5pt;
            color: #0f172a;
            margin: 0;
        }
        .kop {
            border-bottom: 2.5pt solid #0b3fa8;
            padding-bottom: 6pt;
            margin-bottom: 10pt;
        }
        .kop h1 { font-size: 14pt; margin: 0 0 2pt; color: #0b3fa8; letter-spacing: .2pt; }
        .kop .instansi { font-size: 9pt; font-weight: bold; color: #0f172a; margin: 0; }
        .kop .subjudul { font-size: 8pt; color: #334155; margin: 3pt 0 0; }
        .kop .cetak { font-size: 7.5pt; color: #475569; margin: 2pt 0 0; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        thead th {
            background: #0b3fa8;
            color: #fff;
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: .3pt;
            padding: 5pt 4pt;
            border: .5pt solid #0b3fa8;
            text-align: left;
            word-wrap: break-word;
        }
        tbody td {
            padding: 4pt;
            border: .5pt solid #c7d7ee;
            font-size: 8pt;
            vertical-align: top;
            word-wrap: break-word;
        }
        tbody tr:nth-child(even) td { background: #f0f6ff; }
        .kosong { text-align: center; color: #475569; padding: 14pt; font-style: italic; }
        .footer {
            margin-top: 10pt;
            font-size: 7.5pt;
            color: #475569;
            border-top: .5pt solid #c7d7ee;
            padding-top: 4pt;
        }
        .nomor { text-align: center; }
    </style>
</head>
<body>
    <div class="kop">
        <h1>{{ $judul }}</h1>
        <p class="instansi">BansosHub — Sistem Pendukung Keputusan Penerima Bantuan Sosial RW 08</p>
        <p class="subjudul">{{ $subjudul }}</p>
        <p class="cetak">Dicetak {{ now()->translatedFormat('d F Y, H:i') }} WIB &middot; Total {{ count($baris) }} baris</p>
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
            @forelse ($baris as $isi)
                <tr>
                    @foreach ($kolom as $i => $label)
                        <td @class(['nomor' => in_array($label, ['No'], true)])>{{ $isi[$i] ?? '' }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td class="kosong" colspan="{{ count($kolom) }}">Belum ada data untuk dicetak.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Dokumen ini dihasilkan otomatis oleh BansosHub. Data mengikuti hak akses akun yang mencetak.
    </div>
</body>
</html>
