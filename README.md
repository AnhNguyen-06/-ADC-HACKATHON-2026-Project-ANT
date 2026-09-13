# Project ANT (Adaptive Navigation Technology)
> **ADC Hackathon 2026 — Assistive Technology Track**  
> *Indoor Assistive Mobility Terminal & Spatial Telemetry Cockpit for Blind and Visually Impaired Employees*

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![OpenCV AprilTag](https://img.shields.io/badge/Vision-OpenCV%205.0%20AprilTag-red.svg)](https://opencv.org/)
[![WCAG AAA](https://img.shields.io/badge/Accessibility-WCAG%20AAA-brightgreen.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Tests](https://img.shields.io/badge/Tests-52%2F52%20Passing-success.svg)](https://pytest.org/)
[![Offline Capable](https://img.shields.io/badge/Demo-100%25%20Offline%20Reliable-orange.svg)]()

---

## 🌟 Tổng Quan Dự Án (Project Overview)

**Project ANT (Adaptive Navigation Technology)** là giải pháp công nghệ trợ tiếp cận trong nhà (Indoor Assistive Navigation) được phát triển nhằm trao quyền độc lập cho nhân viên khiếm thị khi di chuyển trong các không gian văn phòng phức tạp (hành lang, phòng họp, thang máy, khu vực tiện ích) mà không cần phụ thuộc vào người dẫn đường hay thị giác.

### Vấn đề thực tế (The Challenge):
- **Tín hiệu GPS ngoài trời bị chặn** hoàn toàn bên trong các tòa nhà cao tầng.
- **Hệ thống cảm biến đắt tiền (như LiDAR)** cồng kềnh, tiêu hao pin cao và khó triển khai đại trà.
- **Mù định hướng trong hành lang văn phòng**: Rất dễ lạc hoặc va chạm với các vật thể phát sinh đột xuất (ghế xếp, xe đẩy vệ sinh, thùng rác).

### Giải pháp của ANT (The ANT Solution):
1. **Định vị thụ động chính xác cao với AprilTag**: Nhận diện các thẻ fiducial marker dán tại các mốc cố định (Cửa vào, Thang máy, Phòng họp) qua camera thông thường với độ trễ tính bằng mili-giây.
2. **Thuật toán tìm đường Dijkstra có ràng buộc tiếp cận**: Tính toán tuyến đường đi ngắn nhất và an toàn nhất, tự động loại bỏ các lối đi nguy hiểm (như cầu thang bộ không rào chắn).
3. **Giao diện âm thanh hướng đích (Audio-First & Earcons)**:
   - Điều khiển giọng nói tự nhiên: *"Take me to Meeting Room B"*.
   - Chỉ dẫn âm thanh súc tích, tránh làm quá tải thính giác người dùng.
   - Âm báo phi ngôn ngữ (Earcons): Hai âm cao dần khi đến checkpoint, hợp âm arpeggio khi đến đích, tiếng rung cảnh báo khi gặp vật cản.
4. **Cảm biến cảnh báo vật cản hành lang (Corridor Hazard Perception)**: Phát hiện vật thể bất ngờ nằm trên đường đi và đưa ra chỉ dẫn điều chỉnh hướng di chuyển tức thì (*"Caution: chair ahead. Move slightly left"*).
5. **Thiết kế phần cứng xúc giác mô phỏng (Impeccable Tactile Terminal UI)**: Giao diện web được thiết kế theo tiêu chuẩn WCAG AAA với các phím bấm xúc giác có gờ nổi, phím tắt phần cứng (`Space`, `Enter`, `Esc`, `H`), dải sóng âm thanh real-time và bản đồ CAD kỹ thuật trực quan cho giám khảo.

---

## 🏛️ Kiến Trúc Hệ Thống (Architecture)

```
[ Camera / Video Feed ]          [ Voice Mic / Input ]
          │                                │
          ▼                                ▼
[ AprilTag 36h11 Detector ]      [ Natural Speech Parser ]
          │                                │
          └───────────────┬────────────────┘
                          ▼
             [ NavigationService Coordinator ]
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
[ Dijkstra Graph Router ]        [ Hazard Warning Engine ]
  - Accessible office map          - Qualitative proximity
  - Obstacle avoidance rerouting   - Corridor clearing logic
         │                                 │
         └────────────────┬────────────────┘
                          ▼
               [ WebSocket Telemetry Bus ]
                          │
     ┌────────────────────┴────────────────────┐
     ▼                                         ▼
[ Handheld Assistive Terminal ]    [ Spatial Radar & Cockpit ]
 - Spoken audio & earcons           - Live CAD floorplan SVG
 - Animated waveform visualizer     - Camera CV reticle overlay
 - Tactile preset landmark chips    - 60s Stage demo rehearsal
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử (Quick Start Guide)

### 1. Yêu cầu hệ thống (Prerequisites)
- **Python**: Phiên bản 3.10 trở lên (khuyến nghị Python 3.11 - 3.14).
- **Trình duyệt web**: Chrome, Edge, Firefox hoặc Safari hỗ trợ Web Audio và Web Speech API.

### 2. Cài đặt môi trường (Installation)
Clone repo về máy và cài đặt các thư viện cần thiết:
```bash
git clone https://github.com/AnhNguyen-06/-ADC-HACKATHON-2026-Project-ANT.git
cd -ADC-HACKATHON-2026-Project-ANT
pip install -r requirements.txt
```

### 3. Chạy kiểm thử tự động (Run Automated Tests)
Hệ thống đi kèm bộ kiểm thử toàn diện 52 tests (Unit, Component, Integration, Red-Team):
```bash
python run_tests.py
```
> **Kết quả dự kiến**: `52 passed in ~1.9s` (100% tests green).

### 4. Khởi chạy ứng dụng Web (Launch Web Application)
Khởi động máy chủ FastAPI:
```bash
python serve.py
```
Sau đó mở trình duyệt tại địa chỉ:
```
http://127.0.0.1:8000
```

---

## 🎯 Kịch Bản Trình Diễn Trên Sân Khấu (Hackathon Presentation Guide)

Để đảm bảo buổi thuyết trình đạt hiệu quả cao nhất mà không sợ rủi ro mất mạng hoặc camera chập chờn, ANT tích hợp sẵn **Deterministic Stage Rehearsal Controller** ở góc dưới màn hình:

1. **Bắt đầu kịch bản 60 giây**:
   - Nhấn nút **Play Scenario** trong thanh điều khiển *STAGE REHEARSAL*.
   - Hệ thống tự động mô phỏng hành trình hoàn chỉnh 7 bước:
     1. `00:00` — Định vị ban đầu tại **Office Entrance** qua AprilTag #1.
     2. `00:08` — Người dùng nói lệnh: *"Take me to Meeting Room B"*; Dijkstra vẽ đường đi tối ưu 40m.
     3. `00:18` — Camera phát hiện vật cản bất ngờ (chiếc ghế) trong hành lang; phát âm cảnh báo: *"Caution: chair ahead. Move slightly left"*.
     4. `00:27` — Người dùng tránh qua chướng ngại vật; hệ thống xác nhận lối đi an toàn.
     5. `00:36` — Checkpoint tại **Main Elevators** (AprilTag #3); phát chuông chime hai âm.
     6. `00:46` — Checkpoint hành lang phía Đông (AprilTag #4).
     7. `00:55` — Đến đích **Meeting Room B** (AprilTag #12); phát hợp âm thành công arpeggio.

2. **Các tương tác nhanh dành cho Ban Giám Khảo**:
   - **Preset Landmark Chips**: Nhấp trực tiếp vào các nút `Meeting Room B`, `Elevators`, `Restroom`, `Cafeteria` để kích hoạt tìm đường tức thì.
   - **Phím tắt không phụ thuộc thị giác (Rule 7 Screen-Agnostic)**:
     - `Phím Space`: Giữ để nói lệnh thoại điều hướng.
     - `Phím Enter`: Lặp lại chỉ dẫn âm thanh gần nhất.
     - `Phím H`: Chuyển đổi qua lại chế độ tương phản cao **WCAG AAA High Contrast Mode**.
     - `Phím Esc`: Đặt lại trạng thái ban đầu.
   - **Real Camera Toggle**: Bấm nút `DEMO MODE` trên thanh header để chuyển sang dùng webcam thật của laptop/thiết bị di động.

---

## 📂 Cấu Trúc Thư Mục Dự Án (Project Structure)

```
[ADC Hackathon 2026] Project-ANT/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints & WebSocket telemetry bus (/ws/navigation)
│   │   ├── audio/           # NLP destination parser, TTS synthesizer, earcon engine
│   │   ├── core/            # App configuration & settings
│   │   ├── navigation/      # Topological graph, Dijkstra solver, state machine
│   │   ├── perception/      # OpenCV AprilTag 36h11 detector & obstacle warning engine
│   │   ├── services/        # NavigationService unified coordinator
│   │   └── main.py          # FastAPI application factory
│   └── data/
│       └── office_map.json  # Bản đồ topo văn phòng mẫu (Nodes, Edges, Landmark tags)
├── frontend/
│   ├── css/
│   │   └── style.css        # Impeccable Design System (OLED Dark, WCAG AAA, spring physics)
│   ├── js/
│   │   ├── app.js           # Client controller, WebSocket handler, Canvas waveform visualizer
│   │   └── demo_runner.js   # 60s deterministic presentation runner
│   └── index.html           # Dual Accessible Terminal & Spatial Radar Cockpit
├── docs/
│   ├── ARCHITECTURE.md      # Chi tiết kiến trúc kỹ thuật
│   ├── DEMO_SPEC.md         # Đặc tả kịch bản demo 60s
│   ├── REQUIREMENTS.md      # Yêu cầu hệ thống & phân tích người dùng khiếm thị
│   └── reviews/
│       └── IMPECCABLE_CRITIQUE.md # Đánh giá chi tiết UI/UX theo thang điểm 0-10
├── project-state/           # Sổ tay quyết định (DECISIONS.md) & trạng thái dự án (STATE.md)
├── tasks/                   # Backlog công việc theo từng Sprint (M0 - M8)
├── tests/                   # 52 automated tests (Unit, Integration, Red-Team)
├── CHANGELOG.md             # Lịch sử phiên bản
├── requirements.txt         # Danh sách thư viện Python
├── run_tests.py             # Script chạy toàn bộ test suite
└── serve.py                 # Script chạy local web server
```

---

## 🛡️ Đánh Giá Chất Lượng & Bảo Mật (Quality & Red-Team Audit)

Hệ thống đã vượt qua bài kiểm thử thâm nhập và kiểm thử độ bền (Red-Team Hardening):
- **Kháng nhiễu cảm biến**: Tự động xử lý tình huống mất hình ảnh đột ngột (blackout) hoặc chói lóa ánh sáng (extreme glare).
- **Phục hồi tuyến đường đứt gãy**: Tự động tìm đường vòng an toàn nếu hành lang chính bị phong tỏa.
- **Bảo mật**: 100% không chứa hardcoded API keys, secrets hoặc dữ liệu nhạy cảm.
- **Điểm chuẩn giao diện (Impeccable Score)**: Đạt **9.3 / 10** theo bộ tiêu chí thẩm mỹ và công thái học tiếp cận.

---

## ⚠️ Tuyên Bố Trách Nhiệm (Disclaimer)
> **Lưu ý**: Đây là nguyên mẫu thử nghiệm phục vụ cuộc thi Hackathon công nghệ tiếp cận (ADC Hackathon 2026), **KHÔNG PHẢI** là thiết bị y tế hoặc thiết bị hỗ trợ di chuyển đã được cấp chứng nhận an toàn thương mại. Người dùng cần luôn chú ý an toàn cá nhân và sử dụng kết hợp với gậy trắng hoặc chó dẫn đường truyền thống.

---

## 👥 Tác Giả & Bản Quyền (Author & License)
- **Tác giả**: [Anh Nguyen (AnhNguyen-06)](https://github.com/AnhNguyen-06)
- **Đơn vị**: Tham gia cuộc thi ADC Hackathon 2026
- **Giấy phép**: MIT License
