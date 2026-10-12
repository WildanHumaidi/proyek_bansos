# Contributing Guidelines

Terima kasih atas minat Anda untuk berkontribusi pada proyek BansosHub (SPK SAW)!

## Standar Kode & Workflow

1. **Branching**:
   - Buat branch fitur dari `main` dengan format: `feat/nama-fitur` atau `fix/nama-bug`.
   - Hindari push langsung ke branch `main`.

2. **Format Pesan Commit**:
   Gunakan standar [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: tambah ekspor PDF peringkat SAW`
   - `fix: tangani error respon API saat token kedaluwarsa`
   - `refactor: rapikan struktur utilitas kuesioner`
   - `test: tambah test case otorisasi role RT`

3. **Verifikasi Kualitas Sebelum Commit**:
   - Backend: Jalankan `composer lint` (Laravel Pint) dan `php artisan test`.
   - Frontend: Jalankan `npm run lint` (ESLint) dan `npm run build`.

4. **Kebijakan Keamanan & Privasi**:
   - Jangan pernah melakukan commit file `.env`, kredensial database riil, token API, atau data pribadi penduduk riil.
   - Gunakan data dummy atau seeder yang telah disediakan.

5. **Pull Request**:
   - Jelaskan perubahan yang dilakukan dan sertakan ringkasan pengujian.
   - Pastikan seluruh checks pada GitHub Actions lulus.
