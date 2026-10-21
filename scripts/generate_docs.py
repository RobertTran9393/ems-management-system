import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:left w:val="none"/><w:right w:val="none"/><w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:insideV w:val="none"/></w:tblBorders>')
    tblPr.append(borders)

def add_code_block(doc, code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "F3F4F6")
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="single" w:sz="6" w:color="E5E7EB"/><w:left w:val="single" w:sz="18" w:color="4F46E5"/><w:bottom w:val="single" w:sz="6" w:color="E5E7EB"/><w:right w:val="single" w:sz="6" w:color="E5E7EB"/></w:tcBorders>')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    
    run = p.add_run(code_text.strip())
    run.font.name = 'Consolas'
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_callout_box(doc, title, text, box_type="info"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    
    if box_type == "important":
        bg_color = "FEF3C7"  # Amber 100
        border_color = "D97706"  # Amber 600
        title_color = RGBColor(0xB4, 0x53, 0x09)
    else:
        bg_color = "EEF2FF"  # Indigo 50
        border_color = "4F46E5"  # Indigo 600
        title_color = RGBColor(0x37, 0x30, 0xA3)
        
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="single" w:sz="24" w:color="{border_color}"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    run_title = p.add_run(title)
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(10.5)
    run_title.font.bold = True
    run_title.font.color.rgb = title_color
    
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(0)
    p2.paragraph_format.line_spacing = 1.15
    run_text = p2.add_run(text)
    run_text.font.name = 'Calibri'
    run_text.font.size = Pt(10)
    run_text.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def build_deployment_docx():
    doc = docx.Document()
    
    # Page Setup: Letter, 0.8 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
        # Header & Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Hệ Thống Quản Lý Giáo Dục EMS • Hướng Dẫn Triển Khai VPS")
        hrun.font.name = 'Calibri'
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(0x9C, 0xA3, 0xAF)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Bản Quyền © 2026 EMS SBR • Bảo Mật & Lưu Hành Nội Bộ")
        frun.font.name = 'Calibri'
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(0x9C, 0xA3, 0xAF)

    # Document Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(4)
    run_t = p_title.add_run("HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG EMS LÊN VPS")
    run_t.font.name = 'Calibri'
    run_t.font.size = Pt(22)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A) # Deep Navy
    
    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    run_s = p_sub.add_run("Chuyên Dụng Cho Trung Tâm Đào Tạo • Vận Hành Bền Bỉ, Tốc Độ Cao & Bảo Mật Chuẩn Doanh Nghiệp")
    run_s.font.name = 'Calibri'
    run_s.font.size = Pt(11.5)
    run_s.font.italic = True
    run_s.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
    
    # Overview Intro
    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.space_after = Pt(12)
    p_intro.paragraph_format.line_spacing = 1.15
    r_intro = p_intro.add_run("Tài liệu này hướng dẫn chi tiết từng bước từ một máy chủ VPS mới tinh (hệ điều hành Ubuntu 22.04 LTS hoặc 24.04 LTS) cho đến khi toàn bộ hệ thống EMS (Education Management System) vận hành hoàn chỉnh trên Internet với tên miền riêng và chứng chỉ bảo mật SSL/HTTPS (ổ khóa xanh).")
    r_intro.font.name = 'Calibri'
    r_intro.font.size = Pt(10.5)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
        return p

    def add_body(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = 'Calibri'
            rb.font.size = Pt(10.5)
            rb.font.bold = True
            rb.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
        return p

    # 1. TỔNG QUAN KIẾN TRÚC
    add_h1("1. TỔNG QUAN KIẾN TRÚC VẬN HÀNH TRÊN VPS")
    add_body("Hệ thống được đóng gói hoàn chỉnh theo mô hình Docker Container chuẩn công nghiệp gồm 3 tầng:")
    add_body(" Đón nhận lưu lượng người dùng qua cổng 80 (HTTP) và 443 (HTTPS), tự động điều hướng sang các container nội bộ.", "• Nginx Reverse Proxy (Cổng 80/443 SSL):")
    add_body(" Ứng dụng React 19 Single Page Application, được Nginx nội bộ phục vụ siêu tốc.", "• Frontend Web Client (Cổng 3000):")
    add_body(" Ứng dụng Node.js + Express xử lý toàn bộ logic nghiệp vụ, tích hợp Prisma ORM.", "• Backend API (Cổng 8000):")
    add_body(" Cơ sở dữ liệu quan hệ lưu trữ dữ liệu an toàn, gắn liền với Docker Volume ems_pgdata không bao giờ mất dữ liệu.", "• PostgreSQL 16 (Cổng 5432):")
    
    add_callout_box(doc, "Bảo toàn dữ liệu học viên & doanh thu", "Toàn bộ cơ sở dữ liệu và ảnh chứng từ hóa đơn tải lên được lưu trữ độc lập tại 2 Docker Volume: ems_pgdata và ems_uploads. Bạn hoàn toàn có thể khởi động lại máy chủ hoặc cập nhật code mới mà không bị mất bất kỳ dữ liệu nào.", "info")

    # 2. CẤU HÌNH VPS
    add_h1("2. CẤU HÌNH VPS KHUYÊN DÙNG")
    
    tbl = doc.add_table(rows=6, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    set_table_borders(tbl, color="CBD5E1", sz="4")
    
    col_widths = [Inches(1.8), Inches(2.3), Inches(2.4)]
    headers = ["Thành Phần", "Mức Tối Thiểu (< 300 Học Viên)", "Mức Khuyên Dùng (> 300 Học Viên)"]
    
    for c_idx, h in enumerate(headers):
        cell = tbl.cell(0, c_idx)
        cell.width = col_widths[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(h)
        run.font.name = 'Calibri'
        run.font.size = Pt(10)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        
    data = [
        ("Hệ điều hành", "Ubuntu 22.04 LTS / 24.04 LTS (64-bit)", "Ubuntu 22.04 LTS / 24.04 LTS (64-bit)"),
        ("CPU", "2 vCPU Cores", "2 - 4 vCPU Cores"),
        ("RAM", "2 GB (+ 2GB Swap bộ nhớ ảo)", "4 GB (+ 2GB Swap bộ nhớ ảo)"),
        ("Ổ cứng (SSD)", "25 GB SSD / NVMe", "40 GB+ NVMe SSD"),
        ("Băng thông", "100 Mbps (Lưu lượng không giới hạn)", "100 Mbps - 1 Gbps"),
    ]
    
    for row_idx, row_data in enumerate(data, start=1):
        bg = "F9FAFB" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            cell = tbl.cell(row_idx, col_idx)
            cell.width = col_widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.name = 'Calibri'
            r.font.size = Pt(9.5)
            if col_idx == 0:
                r.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 3. THIẾT LẬP BAN ĐẦU
    add_h1("3. BƯỚC 1: THIẾT LẬP BAN ĐẦU TRÊN MÁY CHỦ VPS")
    add_body("Đăng nhập vào VPS qua SSH bằng tài khoản root:")
    add_code_block(doc, "ssh root@<DIA_CHI_IP_VPS>")
    
    add_h2("3.1. Cập nhật gói hệ điều hành")
    add_code_block(doc, "apt update && apt upgrade -y\napt install -y curl wget git ufw nano htop unzip")
    
    add_h2("3.2. Cấu hình bộ nhớ ảo SWAP 2GB - 4GB (Chống tràn RAM & Treo máy)")
    add_callout_box(doc, "LƯU Ý CỰC KỲ QUAN TRỌNG", "Khi build Docker hoặc giờ cao điểm đông phụ huynh đóng học phí & điểm danh, VPS 2GB RAM có thể bị thiếu bộ nhớ tức thời (Out-Of-Memory). Tạo Swap giúp VPS luôn chạy mượt mà, không bao giờ bị đứng máy hay dừng đột ngột.", "important")
    add_code_block(doc, "# Tạo file swap 2GB\nfallocate -l 2G /swapfile\nchmod 600 /swapfile\nmkswap /swapfile\nswapon /swapfile\n\n# Tự động kích hoạt khi VPS khởi động lại\necho '/swapfile none swap sw 0 0' >> /etc/fstab\n\n# Thiết lập độ ưu tiên tối ưu\nsysctl vm.swappiness=20\necho 'vm.swappiness=20' >> /etc/sysctl.conf")
    
    add_h2("3.3. Cài đặt Docker Engine & Docker Compose")
    add_code_block(doc, "curl -fsSL https://get.docker.com -o get-docker.sh\nsh get-docker.sh\n\nsystemctl enable docker\nsystemctl start docker\n\n# Kiểm tra cài đặt thành công\ndocker --version\ndocker compose version")
    
    add_h2("3.4. Bật tường lửa UFW bảo vệ máy chủ")
    add_code_block(doc, "ufw default deny incoming\nufw default allow outgoing\nufw allow 22/tcp\nufw allow 80/tcp\nufw allow 443/tcp\nufw --force enable")

    # 4. TẢI MÃ NGUỒN VÀ CẤU HÌNH .ENV
    add_h1("4. BƯỚC 2: TẢI MÃ NGUỒN & THIẾT LẬP FILE MÔI TRƯỜNG (.ENV)")
    add_body("Tải mã nguồn từ GitHub về thư mục /opt:")
    add_code_block(doc, "cd /opt\ngit clone https://github.com/RobertTran9393/ems-management-system.git\ncd ems-management-system")
    
    add_body("Tạo file cấu hình .env từ file mẫu có sẵn:")
    add_code_block(doc, "cp .env.example .env\nnano .env")
    add_body("Chỉnh sửa các giá trị thực tế của trung tâm:")
    add_code_block(doc, "# Cơ Sở Dữ Liệu PostgreSQL\nPOSTGRES_USER=ems_admin\nPOSTGRES_PASSWORD=MatKhauBaoMatCucManh2026!@#\nPOSTGRES_DB=ems_production\nDATABASE_PORT=5432\n\n# Chuỗi kết nối Database cho Backend\nDATABASE_URL=\"postgresql://ems_admin:MatKhauBaoMatCucManh2026!@#@postgres:5432/ems_production?schema=public\"\n\n# Cấu hình Backend API\nNODE_ENV=production\nPORT=8000\nJWT_SECRET=chuoi_khoa_bao_mat_jwt_ngau_nhien_dai_it_nhat_32_ky_tu_2026\n\n# Thông tin tài khoản ngân hàng tạo mã VietQR tự động\nVIETQR_BANK_ID=\"970422\"\nVIETQR_ACCOUNT_NO=\"123456789\"\nVIETQR_ACCOUNT_NAME=\"TRUNG TAM TOAN TRI TUE SBR\"\n\n# Tên miền chính thức của trung tâm\nVITE_API_URL=https://ems.trungtam.vn")

    # 5. KHỞI CHẠY DOCKER COMPOSE
    add_h1("5. BƯỚC 3: KHỞI CHẠY HỆ THỐNG VỚI DOCKER COMPOSE")
    add_body("Khởi chạy toàn bộ hệ thống bằng 1 câu lệnh:")
    add_code_block(doc, "docker compose up -d --build")
    
    add_body("Kiểm tra trạng thái các container:")
    add_code_block(doc, "docker compose ps")
    
    add_body("Nạp dữ liệu tài khoản quản trị mẫu và danh mục khởi tạo (Initial Seed):")
    add_code_block(doc, "docker compose exec backend npm run prisma:seed")
    
    add_body("Tài khoản đăng nhập mặc định ban đầu:")
    add_body(" admin@sbr.edu.vn / Mật khẩu: 123456", "• Quản Trị Viên (Admin):")
    add_body(" ketoan@sbr.edu.vn / Mật khẩu: 123456", "• Kế Toán (Accountant):")
    add_body(" giaovu@sbr.edu.vn / Mật khẩu: 123456", "• Giáo Vụ (Academic Affairs):")
    add_body(" giaovien1@sbr.edu.vn / Mật khẩu: 123456", "• Giáo Viên (Teacher):")
    add_body(" sale1@sbr.edu.vn / Mật khẩu: 123456", "• Tư Vấn Tuyển Sinh (Sale):")

    # 6. CẤU HÌNH NGINX & SSL
    add_h1("6. BƯỚC 4: CÀI ĐẶT NGINX & CẤP CHỨNG CHỈ BẢO MẬT SSL (HTTPS)")
    add_body("1. Trỏ DNS tên miền về IP của VPS (Thêm bản ghi A record trỏ ems.trungtam.vn về IP máy chủ).")
    add_body("2. Cài đặt Nginx và Certbot:")
    add_code_block(doc, "apt install -y nginx certbot python3-certbot-nginx")
    
    add_body("3. Sao chép và kích hoạt cấu hình Nginx mẫu:")
    add_code_block(doc, "cp /opt/ems-management-system/nginx/ems.conf.example /etc/nginx/sites-available/ems.conf\n\n# Mở file đổi 'ems.trungtam.vn' thành tên miền của bạn\nnano /etc/nginx/sites-available/ems.conf\n\n# Kích hoạt site\nln -s /etc/nginx/sites-available/ems.conf /etc/nginx/sites-enabled/\nrm -f /etc/nginx/sites-enabled/default\nnginx -t\nsystemctl reload nginx")
    
    add_body("4. Cấp chứng chỉ SSL HTTPS miễn phí tự động gia hạn với Let's Encrypt:")
    add_code_block(doc, "certbot --nginx -d ems.trungtam.vn")
    add_body("Nhập email và đồng ý điều khoản, Certbot sẽ tự động cấu hình bảo mật HTTPS và tự động gia hạn trước khi hết hạn 30 ngày.")

    # 7. SAO LƯU DỮ LIỆU TỰ ĐỘNG
    add_h1("7. BƯỚC 5: SAO LƯU DỮ LIỆU TỰ ĐỘNG HÀNG NGÀY (DAILY BACKUP)")
    add_body("Cấp quyền thực thi cho kịch bản sao lưu và cập nhật:")
    add_code_block(doc, "chmod +x /opt/ems-management-system/scripts/backup.sh\nchmod +x /opt/ems-management-system/scripts/update.sh")
    
    add_body("Mở trình đặt lịch cron job của Linux:")
    add_code_block(doc, "crontab -e")
    add_body("Dán dòng sau vào cuối cùng để hệ thống tự động sao lưu lúc 2:00 sáng mỗi ngày:")
    add_code_block(doc, "0 2 * * * /bin/bash /opt/ems-management-system/scripts/backup.sh >> /var/log/ems_backup.log 2>&1")
    
    add_body("Cách khôi phục dữ liệu từ bản sao lưu khi cần:")
    add_code_block(doc, "gunzip -c /var/backups/ems_database/ems_backup_YYYY-MM-DD_HHMMSS.sql.gz | docker exec -i ems_postgres psql -U ems_admin -d ems_production")

    # 8. CẬP NHẬT TÍNH NĂNG MỚI
    add_h1("8. BƯỚC 6: CẬP NHẬT TÍNH NĂNG MỚI (1-CLICK UPDATE)")
    add_body("Mỗi khi có tính năng mới được cập nhật trên GitHub, bạn chỉ cần chạy đúng 1 lệnh duy nhất trên VPS:")
    add_code_block(doc, "cd /opt/ems-management-system\nbash scripts/update.sh")
    add_body("Kịch bản update.sh sẽ tự động kéo code mới nhất, build lại container, đồng bộ schema CSDL PostgreSQL và dọn dẹp ổ đĩa an toàn.")

    # 9. XỬ LÝ SỰ CỐ
    add_h1("9. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)")
    add_body(" Xem log ứng dụng:")
    add_code_block(doc, "docker compose logs -f backend")
    
    add_body(" Đặt lại mật khẩu Admin nếu quên:")
    add_code_block(doc, "docker compose exec backend node -e \"\nconst bcrypt = require('bcrypt');\nconst { PrismaClient } = require('@prisma/client');\nconst prisma = new PrismaClient();\nasync function run() {\n  const hash = await bcrypt.hash('123456', 10);\n  await prisma.user.updateMany({ where: { role: 'ADMIN' }, data: { passwordHash: hash } });\n  console.log('✅ Đã khôi phục mật khẩu Admin thành 123456');\n}\nrun();\n\"")

    add_body(" Kiểm tra tài nguyên RAM/CPU:")
    add_code_block(doc, "docker stats")

    # Save Word file
    output_path = r"d:\Apps\EMS\HUONG_DAN_DEPLOY_VPS.docx"
    doc.save(output_path)
    print(f"Word document saved successfully to {output_path}")

if __name__ == "__main__":
    build_deployment_docx()
