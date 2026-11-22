#!/usr/bin/env bash
#
# buat-paket-awardspace.sh — jalankan DI LAPTOP, bukan di server.
#
# Menghasilkan satu file ZIP siap upload ke AwardSpace:
#   dist-deploy/bansos-awardspace.zip
#
# Isi paket: kode aplikasi + vendor/ + .env template + dump SQL.
# TIDAK menyertakan: .git, tests, node_modules, .env asli.
#
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$BACKEND_DIR/dist-deploy"
STAGE="$OUT_DIR/stage"
ZIP="$OUT_DIR/bansos-awardspace.zip"

echo "==> 1/5 Membersihkan"
rm -rf "$STAGE" "$ZIP"
mkdir -p "$STAGE"

echo "==> 2/5 Menyalin aplikasi"
cd "$BACKEND_DIR"
for item in app bootstrap config database public resources routes storage artisan composer.json composer.lock; do
  [ -e "$item" ] && cp -r "$item" "$STAGE/"
done

# Vendor WAJIB versi produksi (tanpa dev dependency). Kalau memakai vendor lokal,
# phpunit/pint/faker ikut terbawa ~31 MB dan kuota 1 GB AwardSpace terbuang.
VENDOR_PROD="${VENDOR_PROD:-}"
if [ -n "$VENDOR_PROD" ] && [ -d "$VENDOR_PROD" ]; then
  echo "    memakai vendor produksi: $VENDOR_PROD"
  cp -r "$VENDOR_PROD" "$STAGE/vendor"
else
  echo "    PERINGATAN: VENDOR_PROD tidak diset."
  echo "    Jalankan dulu:"
  echo "      composer install --no-dev --optimize-autoloader --working-dir=<dir>"
  echo "    lalu: VENDOR_PROD=<dir>/vendor bash deploy/buat-paket-awardspace.sh"
  echo "    Tanpa ini, phpunit/pint/faker (~31 MB) ikut terpaket."
  cp -r vendor "$STAGE/vendor"
fi

echo "==> 3/5 Membersihkan isi yang tidak perlu di server"
rm -rf "$STAGE"/storage/logs/*.log
rm -rf "$STAGE"/storage/framework/cache/data/* 2>/dev/null || true
rm -rf "$STAGE"/storage/framework/sessions/* 2>/dev/null || true
rm -rf "$STAGE"/storage/framework/views/* 2>/dev/null || true
find "$STAGE" -name ".DS_Store" -delete 2>/dev/null || true
find "$STAGE" -name "*.log" -delete 2>/dev/null || true

echo "==> 4/5 Menambahkan .env template + .htaccess root"
cp "$BACKEND_DIR/.env.production.example" "$STAGE/.env.example-produksi"
cp "$BACKEND_DIR/deploy/awardspace-root.htaccess" "$STAGE/.htaccess"

# .env sengaja TIDAK disertakan — diisi manual di server lewat File Manager,
# supaya kredensial tidak pernah masuk ke file ZIP yang berpindah-pindah.

echo "==> 5/5 Membuat ZIP"
cd "$STAGE"
if command -v zip >/dev/null 2>&1; then
  zip -rq "$ZIP" . -x "*.git*"
else
  # Fallback PowerShell di Windows
  powershell.exe -NoProfile -Command \
    "Compress-Archive -Path '$(cygpath -w "$STAGE")\\*' -DestinationPath '$(cygpath -w "$ZIP")' -Force"
fi

cd "$BACKEND_DIR"
SIZE=$(du -h "$ZIP" | cut -f1)
echo
echo "=============================================================="
echo " Paket siap: $ZIP  ($SIZE)"
echo
echo " Langkah upload:"
echo "   1. AwardSpace File Manager -> buka folder htdocs/"
echo "   2. Upload bansos-awardspace.zip"
echo "   3. Extract di dalam htdocs/ (bukan di subfolder)"
echo "   4. Hapus file zip setelah extract (hemat 1 GB kuota)"
echo "   5. Rename .env.example-produksi -> .env, lalu edit isinya"
echo "=============================================================="
