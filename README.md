# Battle wars v1.0

Prototype game web chạy bằng HTML/CSS/JS, có đầy đủ khung tính năng theo 14 mục yêu cầu:

1. Đăng ký/đăng nhập bắt buộc.
2. Tài khoản admin đặc biệt `admin / battlewars` có tài nguyên vô hạn.
3. Cơ chế bảo vệ input, hash mật khẩu nội bộ, role admin khóa trong logic.
4. Shop + nạp tiền đa tiền tệ và phương thức thanh toán.
5. Trang bị/vật phẩm theo level + bệnh viện hồi máu.
6. Kết bạn + mời người ngoài vào trận.
7. Special Offer theo vòng quay ngẫu nhiên.
8. AI đồng minh/kẻ địch tự động chiến đấu.
9. 3 map: rừng, sa mạc, đô thị + hiệu ứng môi trường + nhạc nền mô phỏng.
10. Boss Lucky xuất hiện khi nguy hiểm, có trạng thái animation + bắn đạn.
11. Phương tiện: ô tô, mô tô, trực thăng, tàu, máy bay.
12. Scope ngắm bắn chính xác (phím `Q`).
13. UI/UX đầy đủ HUD/menu/shop/kết quả.
14. GameManager điều khiển vòng trận, spawn, thắng thua, sự kiện.

## Chạy nhanh

```bash
python3 -m http.server 8000
```

Mở `http://localhost:8000`.

## Điều khiển

- `WASD`: di chuyển
- `Space`: bắn
- `Q`: bật/tắt scope
