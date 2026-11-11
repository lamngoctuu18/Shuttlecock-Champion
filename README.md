# 🏸 SHUTTLECOCK CHAMPION – ĐÁ CẦU TUỔI THƠ

> **Trò chơi đá cầu 2D HTML5 chuyên nghiệp** tái hiện ký ức sân trường Việt Nam, được phát triển bằng **Phaser 3**, **TypeScript** và **Vite**.

![Thumbnail](./public/assets/images/ui/thumbnail.svg)

---

## 1. Giới Thiệu Dự Án (Game Overview)

- **Tên tiếng Anh:** SHUTTLECOCK CHAMPION
- **Tên tiếng Việt:** ĐÁ CẦU TUỔI THƠ
- **Thể loại:** Arcade, Sports, Casual, Skill-based
- **Góc nhìn:** 2D Side View
- **Phong cách đồ họa:** 2D Cartoon Hiện Đại (Bối cảnh sân trường Việt Nam với cây phượng vĩ, mái ngói đỏ, cột cờ Tổ quốc, ghế đá, hàng rào)
- **Nền tảng:** HTML5 Browser Game (Tương thích Desktop & Mobile)

---

## 2. Cơ Chế Gameplay & Vật Lý Cốt Lõi

1. **Vật lý quả cầu thực tế (`PhysicsSystem` & `Shuttlecock`):**
   - Quả cầu có đế cao su nhiều tầng và tán lông cầu xoay hướng theo vector vận tốc thực tế (`vx`, `vy`, trọng lực `gravity`, lực cản không khí và gió nhẹ ở cấp độ cao).
   - Quả cầu hiển thị bóng đổ dưới mặt sân và vệt chuyển động (`Motion Trail`) tối ưu bằng Object Pooling.
2. **Hệ thống nhận diện thời điểm đá (`Hitbox & Timing Evaluation`):**
   - Người chơi phải đợi quả cầu rơi vào đúng vùng tương tác quanh chân nhân vật rồi mới nhấn nút đá.
   - **Tuyệt đối không cộng điểm** nếu nhấn nút khi quả cầu ở quá xa hoặc còn đang bay cao (nhân vật sẽ thực hiện động tác đá hụt `MISS` và bị mất chuỗi Combo).
   - Phân loại độ chính xác:
     - **PERFECT:** Đá trúng tâm ngọt (`Sweet Spot`) -> +25 điểm cơ bản, hiệu ứng lấp lánh, rung camera nhẹ.
     - **GOOD:** Đá hợp lệ tốt -> +15 điểm cơ bản.
     - **NORMAL:** Đá chạm rìa vùng chân -> +10 điểm cơ bản.
     - **MISS:** Đá quá sớm / quá xa / trái chân ngoài tầm -> 0 điểm, reset Combo.
3. **Hệ Thống Điều Khiển (Di Chuyển + 4 Kỹ Thuật Đá Cầu):**
   - **◀ Bước Trái (`[⬅]` / `[Q]` / Nút cảm ứng `◀ BƯỚC TRÁI`):** Di chuyển nhân vật sang trái trên mặt sân.
   - **Bước Phải ▶ (`[➡]` / `[E]` / Nút cảm ứng `BƯỚC PHẢI ▶`):** Di chuyển nhân vật sang phải trên mặt sân.
   - **🦶 Đá Chân Trái (`[A]` / `[J]`):** Đá cầu bên phía chân trái.
   - **🦶 Đá Chân Phải (`[D]` / `[L]`):** Đá cầu bên phía chân phải.
   - **🚀 Đá Cầu Cao (`[W]` / `[↑]` / `[Space]`):** Sút mạnh đưa cầu bay vút lên cao (+5 điểm kỹ thuật).
   - **🛡️ Đỡ Cầu / Hãm Cầu (`[S]` / `[↓]` / `[K]`):** Đỡ cầu nhẹ giúp hãm phương ngang, ổn định lại quả cầu khi tốc độ cao.
4. **Hệ Thống Combo & Độ Khó 10 Cấp Độ:**
   - Thưởng mốc Combo liên hoàn: **x5 (+10)**, **x10 (+25)**, **x20 (+50)**, **x30 (+100 + Hiệu ứng đặc biệt)**, **x50 (+250)**, **x100 (+600 + Thành tựu Thần Đồng Đá Cầu)**.
   - Độ khó tăng mượt từ **Level 1 đến Level 10**: tăng tốc độ rơi, biên độ bay ngang và gió sân trường.

---

## 3. Các Chế Độ Chơi & Nội Dung Mở Khóa

- **🎓 Practice Mode (Chế Độ Tập Luyện - Tích hợp trong nút `HOW TO PLAY`):**
  - **Tập Luyện Từng Bước (6 Bước):** Làm quen phím & nút di chuyển Trái/Phải đến điểm đích trên sân trước, sau đó lần lượt tập Đá Chân Trái, Đá Chân Phải, Đỡ Cầu Hãm Lực và Đá Cầu Cao với mũi tên chỉ dẫn nút bấm và chế độ **Cầu Chậm (Slow-Mo)** khi cầu vào vùng chân.
  - **Tập Tự Do (Free Practice):** Tâng cầu tự do không giới hạn, rơi cầu tự động phát lại (không bị Game Over), cho phép bật/tắt **Cầu Chậm (Slow-Mo)** và **Tự Bước Chân (Auto-Move Assist)** trực tiếp trên thanh công cụ.
- **🏅 Classic Mode:** Tâng cầu không giới hạn thời gian. Cầu chạm đất kết thúc lượt chơi, lưu kỷ lục cá nhân.
- **🎯 Challenge Mode:** 6 nhiệm vụ thử thách (Tâng 10, 20, 50, 100 lần, Đạt Combo 20, Thực hiện 10 cú Perfect) với phần thưởng Sao Vàng.
- **⏱️ Time Attack (60s):** Ghi điểm cao nhất trong 60 giây, lưu bảng xếp hạng cục bộ (`LocalStorage`).
- **👕 Nhân Vật, Trang Phục & Skin Cầu:**
  - **3 Nhân vật:** Minh Khôi (Nam sinh), Lan Anh (Nữ sinh), Hoàng Bảo (Tuyển thủ trẻ).
  - **5 Trang phục:** Đồng phục học sinh khăn quàng đỏ, Áo thể thao, Trang phục mùa hè, Cách điệu truyền thống, Trang phục Quán quân.
  - **5 Loại cầu:** Cầu truyền thống, Cầu sắc màu, Cầu phát sáng Neon, Cầu Rainbow, Cầu Rồng Vàng.

---

## 4. Cấu Trúc Thư Mục (Project Structure)

```text
shuttlecock-champion/
├── public/
│   └── assets/
│       └── images/
│           ├── backgrounds/
│           ├── characters/
│           ├── effects/
│           ├── shuttlecock/
│           └── ui/
├── src/
│   ├── main.ts
│   ├── config/
│   │   └── gameConfig.ts
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── MenuScene.ts
│   │   ├── GameScene.ts
│   │   ├── ChallengeScene.ts
│   │   ├── GameOverScene.ts
│   │   └── SettingsScene.ts
│   ├── entities/
│   │   ├── Player.ts
│   │   └── Shuttlecock.ts
│   ├── systems/
│   │   ├── PhysicsSystem.ts
│   │   ├── InputSystem.ts
│   │   ├── ComboSystem.ts
│   │   ├── ScoreSystem.ts
│   │   ├── DifficultySystem.ts
│   │   └── AchievementSystem.ts
│   ├── managers/
│   │   ├── AudioManager.ts
│   │   ├── StorageManager.ts
│   │   ├── GameStateManager.ts
│   │   └── AdService.ts
│   ├── ui/
│   │   ├── HUD.ts
│   │   ├── MainMenu.ts
│   │   ├── GameOverPanel.ts
│   │   └── SchoolyardBackground.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── main.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 5. Cài Đặt & Chạy Dự Án

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy môi trường phát triển (Development Server)
npm run dev

# 3. Kiểm tra kiểu TypeScript
npm run typecheck

# 4. Đóng gói bản thương mại (Production Build)
npm run build

# 5. Xem thử bản Production
npm run preview
```

---

## 6. Hướng Dẫn Triển Khai & Phát Hành (Deployment & Publishing)

### Triển khai lên GitHub Pages / Netlify / Vercel
- Dự án đã được cấu hình `base: './'` trong `vite.config.ts`, cho phép chạy từ bất kỳ đường dẫn tương đối nào.
- Sau khi chạy `npm run build`, toàn bộ mã nguồn tĩnh nằm gọn trong thư mục `dist/`.
- Chỉ cần tải thư mục `dist/` lên GitHub Pages, Netlify Drop, Vercel hoặc bất kỳ static host nào.

### Phát hành lên CrazyGames (https://developer.crazygames.com/games)

Dự án đã tích hợp hoàn chỉnh **CrazyGames HTML5 SDK v3 (`crazygames-sdk-v3.js`)** và đóng gói sẵn file **`shuttlecock-champion-crazygames.zip`** ngay tại thư mục gốc dự án.

#### 1. Các tính năng CrazyGames SDK v3 đã tích hợp
- **Khởi tạo SDK (`SDK.init`):** Tự động khởi tạo bất đồng bộ trong `BootScene.ts` thông qua `AdService.ts` (có cơ chế fallback an toàn khi chạy offline hoặc ngoài CrazyGames).
- **Loading Lifecycle (`game.loadingStart` / `game.loadingStop`):** Tích hợp trong `PreloadScene.ts`.
- **Gameplay Lifecycle (`game.gameplayStart` / `game.gameplayStop`):** Tự động gọi `gameplayStart()` khi bắt đầu lượt chơi hoặc tiếp tục sau khi Pause; gọi `gameplayStop()` khi mở bảng Pause hoặc kết thúc lượt chơi (`GameScene.ts`).
- **Happy Time (`game.happytime`):** Kích hoạt pháo giấy chúc mừng của CrazyGames khi người chơi lập kỷ lục mới, hoàn thành nhiệm vụ Challenge hoặc mở khóa thành tựu Combo.
- **Video Ads (`ad.requestAd` - `midgame` & `rewarded`):**
  - Tự động tắt toàn bộ âm thanh game (`AudioManager.setAdMuted(true)`) khi quảng cáo bắt đầu (`adStarted`) và bật lại khi quảng cáo kết thúc (`adFinished` / `adError`).
  - **Midgame Ad:** Hiển thị hợp lý giữa các lượt chơi (mỗi 2 lượt chơi khi nhấn *Play Again* hoặc *Main Menu*).
  - **Rewarded Ad:** Nút **`🎬 +80 ⭐ (XEM ADS)`** trên màn hình kết thúc lượt chơi cho phép người chơi xem quảng cáo nhận thêm 80 Sao Vàng.
- **Cloud Save (`data.getItem` / `data.setItem`):** Tự động đồng bộ tiến trình, điểm kỷ lục và trang phục qua tài khoản CrazyGames trong `StorageManager.ts`.
- **Chống cuộn trang (CrazyGames QA Rule):** Đã chặn sự kiện cuộn trang mặc định của các phím `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space` và cảm ứng `touchmove` trong `main.ts`.

#### 2. Các bước tải game lên https://developer.crazygames.com/games
1. Chạy lệnh đóng gói bản Production phẳng (Flat Build):
   ```bash
   npm run build
   ```
   Lệnh này tạo ra thư mục **`e:\gamedacau\dist`** chỉ gồm **3 file phẳng duy nhất** (không có thư mục con, không dùng file nén `.zip`):
   - `e:\gamedacau\dist\index.html`
   - `e:\gamedacau\dist\game.js`
   - `e:\gamedacau\dist\index.css`
2. Trong mục **Upload files** trên **https://developer.crazygames.com/games**:
   - Trước tiên nhấn **Delete all files** (hoặc biểu tượng thùng rác) để xóa file `.zip` cũ đi (vì trình tải lên mới của CrazyGames không nhận file `.zip`).
   - Mở thư mục **`e:\gamedacau\dist`** trên máy tính, bôi đen cả **3 file (`index.html`, `game.js`, `index.css`)** (nhấn `Ctrl + A`) rồi **kéo thả trực tiếp 3 file này** vào ô **Upload files** (hoặc bấm vào ô Upload files rồi chọn 3 file trong `e:\gamedacau\dist`).
3. Điền thông tin mô tả (Metadata gợi ý):
   - **Game Title:** `Shuttlecock Champion`
   - **Category:** `Sports` / `Arcade` / `Casual`
   - **Description (English for CrazyGames):**
     > *Shuttlecock Champion brings the beloved traditional Vietnamese schoolyard foot-badminton (Đá Cầu) game to your browser! Move across the court, time your kicks as the feathered shuttlecock drops into your foot sweet-spot, and chain massive combos using Left Kick, Right Kick, Cushion Receive, and Power High Kick. Includes an interactive 6-step Practice Mode, Classic Endless Mode, 6 Challenge Missions, 60s Time Attack, and unlockable characters, outfits, and shuttlecock skins!*
   - **Controls:**
     - `Left / Right Arrow` or `Q / E` (or on-screen buttons): Move Left / Right
     - `A` / `J`: Left Foot Kick
     - `D` / `L`: Right Foot Kick
     - `W` / `Space` / `Up Arrow`: High Power Kick
     - `S` / `Down Arrow`: Cushion Receive
     - `P` / `ESC`: Pause Game
   - **Progress Save:** Bật **Enabled** (vì game đã tích hợp `CrazyGames.SDK.data`).
4. Trong mục **Game Files**, tải trực tiếp file **`shuttlecock-champion-crazygames.zip`** lên và kiểm tra bằng công cụ **CrazyGames QA Tool** tích hợp sẵn trên cổng Developer.

