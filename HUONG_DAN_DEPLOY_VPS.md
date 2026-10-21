# 📖 HƯỚNG DẪN TOÀN DIỆN TRIỂN KHAI HỆ THỐNG EMS LÊN MÁY CHỦ VPS
### (Chuyên Dụng Cho Trung Tâm Đào Tạo • Vận Hành Bền Bỉ, Tốc Độ Cao & Bảo Mật Chuẩn Doanh Nghiệp)

Tài liệu này hướng dẫn chi tiết từng bước từ một máy chủ VPS mới tinh (Ubuntu 22.04 LTS / 24.04 LTS) cho đến khi hệ thống **EMS (Education Management System)** vận hành ổn định trên Internet với **tên miền riêng** và **chứng chỉ bảo mật SSL/HTTPS (ổ khóa xanh)**.

---

## 🏗️ 1. TỔNG QUAN KIẾN TRÚC VẬN HÀNH TRÊN VPS

Hệ thống được đóng gói theo mô hình Docker Container chuẩn công nghiệp:
```
                                        ┌────────────────────────────────────────────────────────┐
                                        │                      MÁY CHỦ VPS                       │
                                        │                                                        │
INTERNET (Người dùng & Giáo viên)       │   ┌────────────────────────────────────────────────┐   │
   │                                    │   │     NGINX REVERSE PROXY (Cổng 80 / 443 SSL)    │   │
   │                                    │   └───────────────────────┬────────────────────────┘   │
   ▼                                    │                           │                            │
https://ems.trungtam.vn ────────────────┼───────────┬───────────────┴───────────────┐            │
                                        │           │                               │            │
                                        │           ▼ (Cổng 3000)                   ▼ (Cổng 8000)│
                                        │   ┌────────────────┐              ┌────────────────┐   │
                                        │   │  ems_frontend  │              │  ems_backend   │   │
                                        │   │ (React 19 SPA) │              │(Node.js/Prisma)│   │
                                        │   └────────────────┘              └───────┬────────┘   │
                                        │                                           │            │
                                        │                                           ▼ (Cổng 5432)│
                                        │                                   ┌────────────────┐   │
                                        │                                   │  ems_postgres  │   │
                                        │                                   │ (PostgreSQL 16)│   │
                                        │                                   └───────┬────────┘   │
                                        │                                           ▼            │
                                        │                                   [Ổ đĩa lưu trữ]      │
                                        └────────────────────────────────────────────────────────┘
```

- **Mọi dữ liệu học viên, điểm danh, bảng lương, thu chi** được lưu trữ bền vững tại Docker Volume `ems_pgdata` (không bao giờ bị mất khi khởi động lại VPS hoặc cập nhật code).
- **Toàn bộ ảnh chứng từ thanh toán** được lưu tại Docker Volume `ems_uploads`.

---

## 💻 2. CẤU HÌNH VPS KHUYÊN DÙNG

| Thành phần | Mức tối thiểu (Trung tâm < 300 học viên) | Mức đề xuất (Trung tâm chuỗi > 300 học viên) |
| :--- | :--- | :--- |
| **Hệ điều hành** | Ubuntu 22.04 LTS hoặc 24.04 LTS (64-bit) | Ubuntu 22.04 LTS hoặc 24.04 LTS (64-bit) |
| **CPU** | 2 vCPU Core | 2 - 4 vCPU Core |
| **RAM** | 2 GB (+ 2GB Swap bộ nhớ ảo) | 4 GB (+ 2GB Swap) |
| **Ổ cứng** | 25 GB SSD / NVMe | 40 GB+ NVMe SSD |
| **Băng thông** | 100 Mbps (Không giới hạn lưu lượng) | 100 Mbps - 1 Gbps |
| **Nhà cung cấp VPS uy tín** | Vietnix, TinoHost, AZDIGI, KDATA, DigitalOcean, Hetzner, Linode... |

---

## 🛠️ 3. BƯỚC 1: THIẾT LẬP BAN ĐẦU TRÊN MÁY CHỦ VPS

Đăng nhập vào VPS qua SSH bằng tài khoản `root` (sử dụng Terminal trên macOS/Linux hoặc PuTTY / PowerShell trên Windows):
```bash
ssh root@<DIA_CHI_IP_VPS>
```

### 1.1. Cập nhật hệ thống
```bash
apt update && apt upgrade -y
apt install -y curl wget git ufw nano htop unzip
```

### 1.2. Tạo bộ nhớ ảo SWAP 2GB - 4GB (RẤT QUAN TRỌNG ĐỂ CHỐNG TRÀN RAM)
> [!IMPORTANT]
> Khi build Docker hoặc giờ cao điểm đông giáo viên điểm danh, VPS 2GB RAM có thể bị thiếu bộ nhớ tức thời (Out-Of-Memory). Tạo Swap giúp VPS không bao giờ bị đứng máy hay tắt đột ngột:

```bash
# Tạo file swap 2GB (hoặc 4G nếu ổ cứng rộng)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Lưu cấu hình để tự động kích hoạt sau khi reboot
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Tối ưu độ ưu tiên sử dụng swap
sysctl vm.swappiness=20
echo 'vm.swappiness=20' >> /etc/sysctl.conf
```

### 1.3. Cài đặt Docker Engine & Docker Compose chính thức
```bash
# Gỡ phiên bản cũ (nếu có)
apt remove -y docker docker-engine docker.io containerd runc

# Cài đặt Docker tự động từ script chính hãng
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Kích hoạt Docker khởi động cùng hệ điều hành
systemctl enable docker
systemctl start docker

# Kiểm tra phiên bản (Docker Compose v2 đã tích hợp sẵn)
docker --version
docker compose version
```

### 1.4. Cấu hình tường lửa UFW (Bảo vệ an toàn VPS)
```bash
# Cho phép SSH, Web HTTP (80) và Web bảo mật HTTPS (443)
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Bật tường lửa
ufw --force enable
ufw status
```

---

## 🚀 4. BƯỚC 2: TẢI MÃ NGUỒN VÀ THIẾT LẬP FILE CẤU HÌNH (.ENV)

### 2.1. Tải mã nguồn về thư mục làm việc
```bash
cd /opt
git clone https://github.com/RobertTran9393/ems-management-system.git
cd ems-management-system
```

### 2.2. Tạo file cấu hình môi trường `.env`
Sao chép từ tệp mẫu có sẵn:
```bash
cp .env.example .env
nano .env
```

Hãy chỉnh sửa các giá trị sau cho phù hợp với trung tâm của bạn:
```ini
# 1. Cơ Sở Dữ Liệu PostgreSQL
POSTGRES_USER=ems_admin
POSTGRES_PASSWORD=MatKhauBaoMatCuaBan2026!@#
POSTGRES_DB=ems_production
DATABASE_PORT=5432

# Chuỗi kết nối Database cho Backend
DATABASE_URL="postgresql://ems_admin:MatKhauBaoMatCuaBan2026!@#@postgres:5432/ems_production?schema=public"

# 2. Cấu hình Backend API
NODE_ENV=production
PORT=8000
JWT_SECRET=chuoi_khoa_bao_mat_jwt_ngau_nhien_dai_it_nhat_32_ky_tu_2026

# 3. Cấu hình VietQR Tự Động Tạo Mã Chuyển Khoản Học Phí
VIETQR_BANK_ID="970422"
VIETQR_ACCOUNT_NO="123456789"
VIETQR_ACCOUNT_NAME="TRUNG TAM TOAN TRI TUE SBR"

# 4. Tên Miền Của Trung Tâm (Ví dụ: https://ems.trungtam.vn)
VITE_API_URL=https://ems.trungtam.vn
```
*(Ấn `Ctrl + O` rồi Enter để lưu, sau đó ấn `Ctrl + X` để thoát `nano`)*

---

## 🐳 5. BƯỚC 3: KHỞI CHẠY HỆ THỐNG VỚI DOCKER COMPOSE

### 3.1. Build và khởi chạy tất cả Container
Chạy lệnh duy nhất sau:
```bash
docker compose up -d --build
```
> Docker sẽ tự động:
> 1. Kéo image PostgreSQL 16 Alpine siêu nhẹ.
> 2. Build Backend Node.js 20, tự động sinh Prisma Client.
> 3. Build Frontend React 19 tối ưu hóa tài nguyên (Gzip, minified CSS/JS).
> 4. Tạo mạng nội bộ kết nối an toàn giữa các dịch vụ.

### 3.2. Kiểm tra trạng thái các Container đang chạy
```bash
docker compose ps
```
Kết quả hiển thị 3 dịch vụ có trạng thái **Up (running)** là thành công:
```
NAME           IMAGE                        STATUS         PORTS
ems_postgres   postgres:16-alpine           Up (healthy)   0.0.0.0:5432->5432/tcp
ems_backend    ems-management-system-backend Up             0.0.0.0:8000->8000/tcp
ems_frontend   ems-management-system-frontend Up            0.0.0.0:3000->80/tcp
```

### 3.3. Nạp dữ liệu mẫu ban đầu (Initial Seed)
Nếu đây là lần đầu tiên bạn triển khai trên database trống, hãy nạp dữ liệu phân quyền và tài khoản ban đầu:
```bash
docker compose exec backend npm run prisma:seed
```

> **Danh sách tài khoản đăng nhập mặc định:**
> - 👑 **Quản Trị Viên (Admin):** `admin@sbr.edu.vn` / Mật khẩu: `123456`
> - 💰 **Kế Toán (Accountant):** `ketoan@sbr.edu.vn` / Mật khẩu: `123456`
> - 📚 **Giáo Vụ (Academic):** `giaovu@sbr.edu.vn` / Mật khẩu: `123456`
> - 🎓 **Giáo Viên (Teacher):** `giaovien1@sbr.edu.vn` / Mật khẩu: `123456`
> - 🎯 **Tư Vấn Tuyển Sinh (Sale):** `sale1@sbr.edu.vn` / Mật khẩu: `123456`
>
> *(Sau khi đăng nhập lần đầu, bạn có thể vào tab Quản Trị để đổi mật khẩu và cập nhật tên trung tâm/logo theo ý muốn).*

---

## 🌐 6. BƯỚC 4: CÀI ĐẶT NGINX & CẤP CHỨNG CHỈ BẢO MẬT SSL (HTTPS)

Để người dùng truy cập bằng tên miền đẹp dạng `https://ems.trungtam.vn` với ổ khóa xanh:

### 6.1. Trỏ DNS Tên Miền về IP của VPS
Vào trang quản lý tên miền của bạn (Nhân Hòa, Mắt Bão, Cloudflare, Namecheap...):
- Thêm bản ghi **A record**:
  - **Tên (Host):** `ems` (hoặc `@` nếu dùng tên miền gốc)
  - **Giá trị (Points to):** `<DIA_CHI_IP_VPS>`
  - **TTL:** 5 phút (Auto)

### 6.2. Cài đặt Nginx & Certbot trên VPS
```bash
apt install -y nginx certbot python3-certbot-nginx
```

### 6.3. Sao chép file cấu hình Nginx có sẵn
```bash
cp /opt/ems-management-system/nginx/ems.conf.example /etc/nginx/sites-available/ems.conf
```

Mở file để đổi tên miền sang tên miền của bạn:
```bash
nano /etc/nginx/sites-available/ems.conf
```
*Đổi tất cả các chữ `ems.trungtam.vn` thành tên miền thực tế của bạn.*

Kích hoạt cấu hình:
```bash
ln -s /etc/nginx/sites-available/ems.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 6.4. Cấp chứng chỉ SSL miễn phí tự động gia hạn với Let's Encrypt
Chạy lệnh sau:
```bash
certbot --nginx -d ems.trungtam.vn
```
- Nhập email của bạn để nhận thông báo gia hạn.
- Nhập `Y` đồng ý điều khoản.
- Certbot sẽ tự động cấu hình HTTPS và tự động gia hạn trước khi hết hạn 30 ngày.

Bây giờ bạn có thể mở trình duyệt và truy cập: **`https://ems.trungtam.vn`**! 🎉

---

## 💾 7. BƯỚC 5: SAO LƯU DỮ LIỆU TỰ ĐỘNG HÀNG NGÀY (DAILY BACKUP)

Dữ liệu học viên, học phí và bảng lương là tài sản vô cùng quan trọng. Hệ thống đã chuẩn bị sẵn kịch bản sao lưu nén tự động tại [`scripts/backup.sh`](file:///d:/Apps/EMS/scripts/backup.sh).

### 7.1. Cấp quyền thực thi cho script
```bash
chmod +x /opt/ems-management-system/scripts/backup.sh
chmod +x /opt/ems-management-system/scripts/update.sh
```

### 7.2. Đặt lịch Cron Job tự động sao lưu lúc 2:00 sáng mỗi ngày
Mở trình đặt lịch của Linux:
```bash
crontab -e
```
Thêm dòng sau vào dưới cùng:
```cron
0 2 * * * /bin/bash /opt/ems-management-system/scripts/backup.sh >> /var/log/ems_backup.log 2>&1
```
> Kịch bản này sẽ:
> - Xuất file `.sql.gz` nén vào thư mục `/var/backups/ems_database/`.
> - Tự động xóa các bản sao lưu cũ quá 14 ngày để không làm đầy ổ cứng.

### 7.3. Cách khôi phục dữ liệu từ file Backup (Khi cần)
Nếu cần chuyển VPS hoặc khôi phục dữ liệu:
```bash
gunzip -c /var/backups/ems_database/ems_backup_YYYY-MM-DD_HHMMSS.sql.gz | docker exec -i ems_postgres psql -U ems_admin -d ems_production
```

---

## 🔄 8. BƯỚC 6: CẬP NHẬT TÍNH NĂNG MỚI (1-CLICK UPDATE)

Mỗi khi đội ngũ phát triển đẩy tính năng hoặc sửa lỗi mới lên GitHub, bạn chỉ cần chạy **đúng 1 lệnh** trên VPS:

```bash
cd /opt/ems-management-system
bash scripts/update.sh
```

Kịch bản [`scripts/update.sh`](file:///d:/Apps/EMS/scripts/update.sh) sẽ tự động:
1. `git pull` lấy toàn bộ code mới nhất.
2. Build lại container không làm gián đoạn hệ thống.
3. Chạy `prisma db push` đồng bộ bảng dữ liệu mới mà không mất dữ liệu cũ.
4. Dọn sạch các image cũ để ổ cứng luôn nhẹ và sạch sẽ.

---

## 🩺 9. XỬ LÝ SỰ CỐ & CÂU HỎI THƯỜNG GẶP (TROUBLESHOOTING)

### Q1: Làm thế nào để xem nhật ký hoạt động (Log) của ứng dụng?
```bash
# Xem log toàn bộ hệ thống theo thời gian thực
docker compose logs -f

# Chỉ xem log của Backend API
docker compose logs -f backend

# Chỉ xem log của Cơ sở dữ liệu
docker compose logs -f postgres
```

### Q2: Quên mật khẩu tài khoản Admin thì làm sao?
Bạn có thể cập nhật trực tiếp mật khẩu cho tài khoản `admin@sbr.edu.vn` thành `123456` bằng lệnh:
```bash
docker compose exec backend node -e "
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const hash = await bcrypt.hash('123456', 10);
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { passwordHash: hash }
  });
  console.log('✅ Đã đặt lại mật khẩu Admin thành 123456');
}
run();
"
```

### Q3: Kiểm tra mức tiêu hao RAM và CPU của máy chủ?
```bash
# Xem trực quan qua htop
htop

# Xem tài nguyên từng container Docker đang dùng
docker stats
```

---

## 📞 10. DANH SÁCH FILE VẬN HÀNH TRÊN MÃ NGUỒN

- 📄 [`HUONG_DAN_DEPLOY_VPS.md`](file:///d:/Apps/EMS/HUONG_DAN_DEPLOY_VPS.md): Bản hướng dẫn đầy đủ này.
- ⚙️ [`.env.example`](file:///d:/Apps/EMS/.env.example): Tệp mẫu biến môi trường bảo mật cho VPS.
- 🐳 [`docker-compose.yml`](file:///d:/Apps/EMS/docker-compose.yml): Cấu hình khởi chạy các container hệ thống.
- 🌐 [`nginx/ems.conf.example`](file:///d:/Apps/EMS/nginx/ems.conf.example): Cấu hình mẫu Nginx Reverse Proxy & SSL.
- 🚀 [`scripts/update.sh`](file:///d:/Apps/EMS/scripts/update.sh): Script cập nhật tự động 1 chạm khi có code mới.
- 💾 [`scripts/backup.sh`](file:///d:/Apps/EMS/scripts/backup.sh): Script sao lưu CSDL PostgreSQL định kỳ.
