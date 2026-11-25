<?php

namespace Tests\Unit;

use App\Services\RtFormatter;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

/**
 * P2-04 — kanonikalisasi RT.
 *
 * Backend menyimpan RT sebagai tiga digit. Test ini mengunci kontrak helper
 * supaya jalur tulis tidak kembali menyimpan '1' atau menerima 'RT01'.
 */
class RtFormatterTest extends TestCase
{
    public function test_format_rt_menghasilkan_tiga_digit(): void
    {
        $this->assertSame('001', RtFormatter::formatRt(1));
        $this->assertSame('001', RtFormatter::formatRt('1'));
        $this->assertSame('001', RtFormatter::formatRt(' 001 '));
        $this->assertSame('012', RtFormatter::formatRt('12'));
        $this->assertSame('123', RtFormatter::formatRt(123));
    }

    public function test_format_rt_menolak_nilai_tidak_sah(): void
    {
        foreach (['0', '', 'RT01', 'abc', -1, '1.5', '1000', null] as $buruk) {
            try {
                RtFormatter::formatRt($buruk);
                $this->fail("formatRt('".var_export($buruk, true)."') seharusnya melempar exception");
            } catch (InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function test_int_value_membaca_format_lama_dan_baru(): void
    {
        $this->assertSame(1, RtFormatter::intValue('1'));
        $this->assertSame(1, RtFormatter::intValue('001'));
        $this->assertSame(1, RtFormatter::intValue(1));
        $this->assertSame(12, RtFormatter::intValue('012'));
        $this->assertNull(RtFormatter::intValue('RT01'));
        $this->assertNull(RtFormatter::intValue('0'));
        $this->assertNull(RtFormatter::intValue(''));
        $this->assertNull(RtFormatter::intValue(null));
    }

    public function test_sama_menyamakan_format_lama_dan_baru(): void
    {
        $this->assertTrue(RtFormatter::sama('1', '001'));
        $this->assertTrue(RtFormatter::sama(1, '001'));
        $this->assertFalse(RtFormatter::sama('1', '002'));
        // Nilai tidak sah tidak pernah dianggap sama — mencegah dua data rusak
        // saling cocok dan membuka akses lintas wilayah.
        $this->assertFalse(RtFormatter::sama(null, null));
        $this->assertFalse(RtFormatter::sama('RT01', '001'));
    }

    public function test_rule_hanya_menerima_angka(): void
    {
        $rule = RtFormatter::rule();
        $this->assertStringStartsWith('regex:', $rule);

        // Rule Laravel berbentuk 'regex:<pola>'; pola-nya yang diuji di sini.
        $pola = substr($rule, strlen('regex:'));
        $this->assertSame(1, preg_match($pola, '1'));
        $this->assertSame(1, preg_match($pola, '001'));
        $this->assertSame(0, preg_match($pola, 'RT01'));
        $this->assertSame(0, preg_match($pola, '1000'));
        $this->assertSame(0, preg_match($pola, '1a'));
    }

    public function test_rule_menolak_nol_sehingga_tidak_jadi_500(): void
    {
        // '0' lolos pola lama, lalu formatRt() melempar InvalidArgumentException
        // dan endpoint membalas 500. Validasi harus menangkapnya lebih dulu (422).
        $pola = substr(RtFormatter::rule(), strlen('regex:'));

        foreach (['0', '00', '000'] as $nol) {
            $this->assertSame(0, preg_match($pola, $nol), "'{$nol}' harus ditolak rule");
            $this->assertNull(RtFormatter::intValue($nol));
        }
    }
}
