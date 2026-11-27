#!/usr/bin/env bash
# Backup harian database BansosHub.
#
#   - Dump semua tabel dari .env Laravel (DB_DATABASE/DB_USERNAME/DB_PASSWORD).
#   - Simpan .sql.gz + .sha256 di /var/backups/bansos-db, retensi 14 hari.
#   - Setiap dump diuji: gzip utuh, penanda "-- Dump completed" ada, dan
#     di-restore ke database sementara untuk membandingkan jumlah baris.
#   - Dipanggil cron root tiap hari; aman dari tumpang tindih lewat flock.
#
# Pemakaian:
#   bansos-db-backup.sh            # backup + verifikasi (dipakai cron)
#   bansos-db-backup.sh --daftar   # tampilkan backup yang tersimpan
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/bansos-db}"
ENV_FILE="${ENV_FILE:-/var/www/bansos/bansos-backend/.env}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
VERIFY_DB="bansos_restore_check"
LOCK_FILE="/var/lock/bansos-db-backup.lock"
MAIN_TABLES=(warga pengajuan penilaian users kriteria sub_kriteria)

log() { printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"; }
die() { log "GAGAL: $*"; exit 1; }

env_value() {
    local key="$1" line
    line=$(grep -E "^${key}=.*" "$ENV_FILE" | tail -1) || return 0
    line="${line#*=}"
    line="${line%\"}"; line="${line#\"}"
    line="${line%\'}"; line="${line#\'}"
    printf '%s' "$line"
}

hitung_baris() {  # hitung_baris <database>
    local db="$1" t query="" hasil=""
    for t in "${MAIN_TABLES[@]}"; do
        [ -n "$query" ] && query="$query UNION ALL "
        query="$query SELECT '$t', COUNT(*) FROM \`$db\`.\`$t\`"
    done
    hasil=$(mysql -N -B -e "$query")
    printf '%s' "$hasil"
}

if [ "${1:-}" = "--daftar" ]; then
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "(belum ada backup)"
    exit 0
fi

[ -r "$ENV_FILE" ] || die "tidak bisa membaca $ENV_FILE"

exec 9>"$LOCK_FILE"
flock -n 9 || { log "lewati: backup sebelumnya masih berjalan"; exit 0; }

DB_NAME=$(env_value DB_DATABASE)
DB_USER=$(env_value DB_USERNAME)
DB_PASS=$(env_value DB_PASSWORD)
[ -n "$DB_NAME" ] && [ -n "$DB_USER" ] || die "DB_DATABASE/DB_USERNAME tidak ada di $ENV_FILE"

umask 077
mkdir -p "$BACKUP_DIR"
STAMP=$(date -u '+%Y%m%d-%H%M%SZ')
OUT="$BACKUP_DIR/bansos-$STAMP.sql.gz"
TMP="$OUT.part"
MULAI=$(date +%s)

export MYSQL_PWD="$DB_PASS"
mysqldump --no-tablespaces --single-transaction --quick --routines --triggers --events \
    --default-character-set=utf8mb4 -u "$DB_USER" "$DB_NAME" | gzip -9 > "$TMP" \
    || die "mysqldump gagal"
unset MYSQL_PWD

[ "$(stat -c%s "$TMP")" -gt 1024 ] || die "dump terlalu kecil ($(stat -c%s "$TMP") byte)"
gzip -t "$TMP" || die "arsip gzip rusak"
gunzip -c "$TMP" | tail -1 | grep -q '^-- Dump completed' || die "dump terpotong (penanda akhir tidak ada)"

mv "$TMP" "$OUT"
sha256sum "$OUT" > "$OUT.sha256"

# Uji restore ke database sementara, lalu bandingkan jumlah baris.
SEBELUM=$(hitung_baris "$DB_NAME")
mysql -e "DROP DATABASE IF EXISTS \`$VERIFY_DB\`; CREATE DATABASE \`$VERIFY_DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || die "gagal membuat DB uji"
if ! gunzip -c "$OUT" | mysql "$VERIFY_DB"; then
    mysql -e "DROP DATABASE IF EXISTS \`$VERIFY_DB\`"
    die "restore ke DB uji gagal"
fi
SESUDAH=$(hitung_baris "$VERIFY_DB")
mysql -e "DROP DATABASE IF EXISTS \`$VERIFY_DB\`"
[ "$SEBELUM" = "$SESUDAH" ] || die "jumlah baris berbeda setelah restore. asli:[$SEBELUM] uji:[$SESUDAH]"

printf '%s\n' "$SESUDAH" > "$OUT.counts.txt"

# Retensi
find "$BACKUP_DIR" -maxdepth 1 -name 'bansos-*.sql.gz*' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -name 'bansos-*.counts.txt' -mtime "+$RETENTION_DAYS" -delete

DURASI=$(( $(date +%s) - MULAI ))
log "ok $(basename "$OUT") $(numfmt --to=iec "$(stat -c%s "$OUT")") ${DURASI}s restore-cocok $(echo "$SESUDAH" | tr '\n' ' ')"
