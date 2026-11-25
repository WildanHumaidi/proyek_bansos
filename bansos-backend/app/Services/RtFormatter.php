<?php

namespace App\Services;

/**
 * Format & validasi RT kanonik.
 *
 * Seluruh sistem menyimpan RT dalam berbagai bentuk ('1', '001', 'RT 01') di
 * database lama. Semua jalur tulis baru WAJIB lewat formatRt() agar tersimpan
 * sebagai tiga digit ('001'), dan perbandingan scope memakai intValue() supaya
 * data lama ('1') tetap kompatibel.
 */
class RtFormatter
{
    /**
     * Ubah input apa pun menjadi RT kanonik 3 digit ('001').
     * Hanya menerima angka 1-999.
     *
     * @throws \InvalidArgumentException bila input bukan RT yang valid.
     */
    public static function formatRt(mixed $input): string
    {
        $int = self::intValue($input);

        if ($int < 1 || $int > 999) {
            throw new \InvalidArgumentException(
                "Nilai RT tidak valid: '".(is_scalar($input) ? (string) $input : gettype($input))."'."
            );
        }

        return str_pad((string) $int, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Ambil nilai integer RT dari data lama maupun baru ('1' == '001' == 1).
     * Return null bila input bukan angka RT yang sah (bukan 0, bukan 'RT01').
     */
    public static function intValue(mixed $input): ?int
    {
        if ($input === null || $input === '') {
            return null;
        }

        $teks = trim((string) $input);

        if ($teks === '0') {
            return null;
        }

        if (! preg_match('/^\d{1,3}$/', $teks)) {
            return null;
        }

        $int = (int) $teks;

        return ($int >= 1 && $int <= 999) ? $int : null;
    }

    /**
     * Bandingkan dua nilai RT apa pun ('1' vs '001' vs 1). True bila sama.
     */
    public static function sama(mixed $a, mixed $b): bool
    {
        $ia = self::intValue($a);
        $ib = self::intValue($b);

        return $ia !== null && $ib !== null && $ia === $ib;
    }

    /**
     * Validasi rule Laravel: 'rt' => ['required', RtFormatter::rule()] dsb.
     *
     * Menolak nol ('0', '00', '000') karena RT 0 tidak pernah sah — dulu pola
     * `^[0-9]{1,3}$` meloloskan '0' sehingga formatRt() melempar exception dan
     * endpoint mengembalikan 500, bukan 422.
     */
    public static function rule(): string
    {
        return 'regex:/^(?!0+$)[0-9]{1,3}$/';
    }
}