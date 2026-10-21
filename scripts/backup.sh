#!/bin/bash
# ==============================================================================
# SCRIPT SAO LƯU TỰ ĐỘNG CƠ SỞ DỮ LIỆU POSTGRESQL (DAILY BACKUP)
# Có thể đưa vào crontab để chạy tự động lúc 2:00 sáng mỗi ngày:
# 0 2 * * * /bin/bash /duong/dan/ems-management-system/scripts/backup.sh >> /var/log/ems_backup.log 2>&1
# ==============================================================================

set -e

# Thư mục lưu file sao lưu
BACKUP_DIR="/var/backups/ems_database"
mkdir -p "$BACKUP_DIR"

# Đặt tên file theo ngày giờ: ems_backup_YYYY-MM-DD_HHMMSS.sql.gz
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ems_backup_$TIMESTAMP.sql.gz"

echo "💾 [$(date)] Đang bắt đầu sao lưu cơ sở dữ liệu EMS..."

# Lấy biến môi trường từ file .env nếu có
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

DB_USER="${POSTGRES_USER:-ems_user}"
DB_NAME="${POSTGRES_DB:-ems_db}"

# Tiến hành xuất dữ liệu từ container postgres và nén gzip
docker exec ems_postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Sao lưu thành công: $BACKUP_FILE (Dung lượng: $FILE_SIZE)"

# Tự động xóa các file sao lưu cũ hơn 14 ngày để tiết kiệm dung lượng đĩa
echo "🧹 Đang dọn dẹp các bản sao lưu cũ hơn 14 ngày..."
find "$BACKUP_DIR" -type f -name "ems_backup_*.sql.gz" -mtime +14 -delete

echo "🎉 Hoàn tất sao lưu lúc: $(date)"
