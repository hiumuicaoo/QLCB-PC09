# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG TRÊN SERVER CÁ NHÂN (UBUNTU, DOCKER COMPOSE & TAILSCALE)

Tài liệu này hướng dẫn chi tiết cách cấu hình và đưa toàn bộ ứng dụng "Hệ thống Quản lý Cán bộ" lên máy chủ cá nhân chạy **Ubuntu**, tối ưu hóa cấu hình phần cứng **SSD + HDD** và kết nối an toàn qua mạng riêng ảo **Tailscale**.

---

## 1. Mô Hình Kiến Trúc Hệ Thống

*   **Ổ SSD (Chạy Server - Tối ưu hiệu năng):**
    *   Toàn bộ mã nguồn, Docker Image, và các tiến trình máy chủ (Node.js Express + frontend React đã biên dịch) sẽ chạy trực tiếp trên phân vùng SSD chính của hệ điều hành Ubuntu. Điều này giúp khởi động container nhanh, tải trang mượt mà và giảm độ trễ phản hồi.
*   **Ổ HDD (Lưu trữ dữ liệu lớn - Tối ưu chi phí):**
    *   Toàn bộ tài liệu văn bằng PDF tải lên và tệp cơ sở dữ liệu `personnel_db.json` sẽ được lưu trữ vật lý trên ổ đĩa HDD thông qua cơ chế gắn ổ (Docker Volume Bind Mount). Điều này bảo vệ tối đa dữ liệu khỏi thất thoát khi cập nhật container và tiết kiệm dung lượng SSD.
*   **Mạng ảo Tailscale (Bảo mật tuyệt đối):**
    *   Ứng dụng sẽ chạy trong mạng nội bộ của Tailscale. Bạn có thể truy cập an toàn từ xa bằng máy tính cá nhân, điện thoại mà không cần mở cổng công khai (port forwarding) trên bộ định tuyến mạng, bảo vệ hệ thống khỏi các cuộc tấn công mạng internet.

---

## 2. Chuẩn Bị Trước Khi Cài Đặt (Trên Ubuntu)

1.  **Cài đặt Docker và Docker Compose:**
    Nếu máy chủ chưa có Docker, hãy chạy các lệnh sau trên terminal của Ubuntu:
    ```bash
    sudo apt update
    sudo apt install -y docker.io docker-compose-v2
    sudo systemctl enable --now docker
    ```

2.  **Chuẩn bị thư mục lưu trữ trên ổ HDD:**
    *   Tìm đường dẫn phân vùng ổ HDD đã được gắn (mount) trên Ubuntu (ví dụ: `/mnt/hdd`).
    *   Tạo một thư mục để chứa cơ sở dữ liệu và văn bằng:
        ```bash
        sudo mkdir -p /mnt/hdd/quanlycanbo_data
        # Cấp quyền ghi cho Docker
        sudo chmod -R 777 /mnt/hdd/quanlycanbo_data
        ```

3.  **Cài đặt Tailscale:**
    Nếu máy chủ Ubuntu chưa cài Tailscale, hãy cài đặt và kích hoạt:
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up
    ```
    *Ghi nhớ địa chỉ IP Tailscale của máy chủ Ubuntu (ví dụ: `100.x.y.z`).*

---

## 3. Các Bước Triển Khai

### Bước 1: Chuẩn bị mã nguồn trên SSD
Sao chép toàn bộ thư mục dự án này vào ổ SSD của máy chủ Ubuntu (ví dụ trong thư mục người dùng: `/home/ubuntu/quanlycanbo`).

### Bước 2: Kiểm tra cấu hình Docker Compose
Mở tệp `docker-compose.yml` trên máy chủ và điều chỉnh đường dẫn ổ đĩa HDD của bạn nếu khác với `/mnt/hdd/quanlycanbo_data`:

```yaml
version: '3.8'

services:
  quanlycanbo:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: quanlycanbo_app
    ports:
      - "3080:3000"
    volumes:
      # Ánh xạ thư mục vật lý từ ổ HDD máy chủ Ubuntu vào Container
      - /mnt/hdd/quanlycanbo_data:/app/data
    environment:
      - NODE_ENV=production
      - DATA_DIR=/app/data
      - PORT=3000
    restart: unless-stopped
```

### Bước 3: Khởi chạy hệ thống bằng Docker Compose
Trong thư mục dự án chứa tệp `docker-compose.yml`, hãy khởi chạy lệnh sau:

```bash
docker compose up -d --build
```

Docker sẽ tự động:
1.  Tải gói môi trường Node.js siêu nhẹ.
2.  Biên dịch giao diện React sang mã tĩnh hiệu suất cao lưu vào thư mục `dist`.
3.  Đóng gói máy chủ Express và khởi động dịch vụ trên cổng `3080` (thông qua ánh xạ cổng từ bên ngoài máy chủ).
4.  Tự động quét và di chuyển bất kỳ dữ liệu cán bộ có sẵn nào từ trình duyệt của bạn lên ổ đĩa HDD máy chủ trong lần kết nối đầu tiên.

Kiểm tra trạng thái container đang chạy:
```bash
docker ps
```

---

## 4. Truy Cập Ứng Dụng An Toàn Qua Tailscale

Khi dịch vụ đã hoạt động trên cổng `3080` của máy chủ, mọi thiết bị khác cũng đã đăng nhập cùng tài khoản Tailscale với máy chủ của bạn đều có thể truy cập hệ thống ngay lập tức:

1.  Mở trình duyệt trên máy tính cá nhân hoặc máy tính bảng kết nối Tailscale.
2.  Truy cập địa chỉ:
    ```text
    http://<Địa-Chỉ-IP-Tailscale-Của-Server>:3080
    ```
3.  Hệ thống hoạt động mượt mà, độc lập hoàn toàn và dữ liệu được lưu trữ trực tiếp trên máy chủ Ubuntu của bạn.

---

## 5. Đồng Bộ & Sao Lưu Dữ Liệu Dễ Dàng

Bởi vì toàn bộ cơ sở dữ liệu cán bộ và tài liệu PDF đính kèm đều được cô lập và lưu trữ tập trung tại ổ HDD của bạn (thư mục `/mnt/hdd/quanlycanbo_data`), việc sao lưu trở nên cực kỳ đơn giản:

*   **Sao lưu toàn bộ dữ liệu:**
    Chỉ cần sao lưu thư mục `/mnt/hdd/quanlycanbo_data` trên host Ubuntu:
    ```bash
    tar -czvf quanlycanbo_backup_$(date +%F).tar.gz /mnt/hdd/quanlycanbo_data
    ```
*   **Khôi phục dữ liệu:**
    Khi cần chuyển máy chủ hoặc cài đặt lại, chỉ cần giải nén thư mục dữ liệu đã sao lưu vào ổ HDD của máy chủ mới, trỏ `docker-compose.yml` vào đó và khởi chạy! Dữ liệu sẽ lập tức xuất hiện nguyên vẹn đầy đủ.
