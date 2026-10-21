#!/bin/bash
# ==============================================================================
# SCRIPT CẬP NHẬT TỰ ĐỘNG HỆ THỐNG EMS TRÊN VPS (1-CLICK UPDATE)
# Chạy lệnh: bash scripts/update.sh
# ==============================================================================

set -e

echo "🚀 [1/5] Kéo mã nguồn mới nhất từ GitHub..."
git pull origin main

echo "📦 [2/5] Build và khởi động lại các Container (Backend, Frontend)..."
docker compose build
docker compose up -d

echo "🗄️ [3/5] Tự động cập nhật Schema Cơ Sở Dữ Liệu PostgreSQL..."
docker compose exec backend npx prisma db push

echo "🧹 [4/5] Dọn dẹp các image cũ để giải phóng dung lượng ổ cứng VPS..."
docker image prune -f

echo "✅ [5/5] Kiểm tra trạng thái các dịch vụ đang chạy:"
docker compose ps

echo "🎉 CẬP NHẬT HỆ THỐNG THÀNH CÔNG!"
