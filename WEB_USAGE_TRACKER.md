# 🎯 WEB USAGE TRACKER - Hệ thống theo dõi thời gian sử dụng web

## 📋 **TỔNG QUAN**

Hệ thống theo dõi thời gian sử dụng web chính xác, lưu trữ trên Firebase, với giới hạn 120 phút/ngày.

### **🎯 YÊU CẦU BÀI TOÁN**
- ⏱️ Tính thời gian từ lúc đăng nhập → đăng xuất hoặc đóng tab/reload
- 🔥 Lưu thời gian lên Firebase theo ngày, cộng dồn nhiều session
- 🚫 Giới hạn 120 phút/ngày, chặn nếu vượt
- 🧠 Kiến trúc đúng: Lưu timestamp khi login, tính chênh lệch khi logout

## 🏗️ **KIẾN TRÚC HỆ THỐNG**

### **✅ CÁCH ĐÚNG (Đã implement)**
```javascript
// 👉 Lưu timestamp khi login
this.sessionStartTime = Date.now();

// 👉 Tính chênh lệch khi logout/unload
const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
```

### **❌ CÁCH SAI (Không dùng)**
```javascript
// ⛔ KHÔNG dùng setInterval để cộng thời gian
setInterval(() => {
    this.totalTime += 1; // ➡️ DỄ SAI – reload là mất
}, 1000);
```

## 📁 **CẤU TRÚC DỮ LIỆU FIREBASE**

### **Firestore Collection Structure:**
```
usage/
  └── {userId}/
      └── daily/
          └── 2026-01-04/
              ├── totalSeconds: 3200
              ├── sessions: 3
              ├── date: "2026-01-04"
              ├── lastUpdated: timestamp
              └── userId: "user123"
```

### **Ví dụ dữ liệu:**
```json
{
  "totalSeconds": 3200,
  "sessions": 3,
  "date": "2026-01-04",
  "lastUpdated": "2026-01-04T10:30:00Z",
  "userId": "abc123"
}
```

## 🔧 **CÁC FILE CHÍNH**

### **1. `js/usageTracker.js`** - Core tracking system
- ✅ Theo dõi thời gian chính xác
- ✅ Lưu Firebase theo ngày
- ✅ Giới hạn 120 phút/ngày
- ✅ Chặn truy cập khi vượt
- ✅ Xử lý đóng tab/reload

### **2. `js/webUsageTracker.js`** - Display & compatibility
- ✅ Hiển thị thời gian real-time
- ✅ Cập nhật UI elements
- ✅ Backward compatibility

### **3. `firestore-rules.txt`** - Security rules
- ✅ User chỉ truy cập data của mình
- ✅ Bảo mật collection `usage/{userId}/daily/{date}`

## 🎮 **CÁCH SỬ DỤNG**

### **1. Tự động khởi tạo**
```javascript
// Tự động load khi import
import './js/usageTracker.js';
import './js/webUsageTracker.js';
```

### **2. Hiển thị thời gian trong HTML**
```html
<!-- Hiển thị thời gian sử dụng -->
<div data-usage-time>0m</div>

<!-- Hiển thị thời gian còn lại -->
<div data-usage-remaining>120m</div>

<!-- Hiển thị số phiên -->
<div data-usage-sessions>0</div>

<!-- Progress bar -->
<div data-usage-progress style="width: 0%"></div>
```

### **3. API JavaScript**
```javascript
// Lấy thông tin sử dụng
const usage = window.webUsageTracker.getDailyUsage();
console.log(usage);
// {
//   totalMinutes: 45,
//   totalSeconds: 2700,
//   sessions: 2,
//   remainingMinutes: 75,
//   isBlocked: false
// }

// Force save session
await window.webUsageTracker.forceSave();

// Lấy display formatted
const display = window.webUsageTracker.getUsageDisplay();
console.log(display); // "45m 30s"
```

## ⚙️ **CẤU HÌNH**

### **Thay đổi giới hạn thời gian:**
```javascript
// Trong js/usageTracker.js
this.config = {
    maxDailyMinutes: 120,        // Giới hạn 120 phút/ngày
    warningThreshold: 100,       // Cảnh báo ở 100 phút
    checkInterval: 30000,        // Check mỗi 30 giây
    saveInterval: 60000          // Lưu Firebase mỗi 60 giây
};
```

## 🔄 **FLOW HOẠT ĐỘNG**

### **1. User Login:**
```
1. onAuthStateChanged → handleUserLogin()
2. Lưu sessionStartTime = Date.now()
3. Load daily usage từ Firebase
4. Check giới hạn → block nếu vượt
5. Start tracking timers
6. Tăng sessions count
```

### **2. Trong phiên sử dụng:**
```
1. Save progress mỗi 60 giây
2. Check limit mỗi 30 giây
3. Show warning ở 100 phút
4. Block access ở 120 phút
```

### **3. User Logout/Close Tab:**
```
1. Tính sessionDuration = now - sessionStartTime
2. Cộng vào totalSeconds
3. Save to Firebase
4. Backup to localStorage
5. Reset session data
```

## 🛡️ **XỬ LÝ LỖI & BACKUP**

### **1. Firebase offline:**
- ✅ Backup to localStorage
- ✅ Sync khi online trở lại

### **2. Page reload:**
- ✅ beforeunload event
- ✅ sendBeacon API
- ✅ localStorage backup

### **3. Tab switch:**
- ✅ visibilitychange event
- ✅ Pause/resume tracking

## 🚫 **CHẶN TRUY CẬP**

### **Khi vượt 120 phút:**
```javascript
// 1. Show modal cảnh báo
this.showUsageLimitModal();

// 2. Redirect về login
setTimeout(() => {
    window.location.href = 'index.html';
}, 2000);

// 3. Block tất cả tương tác
this.isBlocked = true;
```

### **Cảnh báo sớm:**
- 🟡 100 phút: Warning toast
- 🟠 110 phút: Warning toast
- 🔴 120 phút: Block access

## 📊 **DASHBOARD INTEGRATION**

### **Progress Bar:**
```css
.usage-progress.normal { background: green; }    /* 0-75% */
.usage-progress.warning { background: orange; }  /* 75-90% */
.usage-progress.danger { background: red; }      /* 90-100% */
```

### **Real-time Updates:**
- ✅ Cập nhật mỗi 10 giây
- ✅ Progress bar animation
- ✅ Color coding theo mức độ

## 🔧 **TROUBLESHOOTING**

### **Lỗi thường gặp:**

1. **Firebase permission denied:**
   - ✅ Check firestore-rules.txt
   - ✅ Publish rules lên Firebase Console

2. **Thời gian không cập nhật:**
   - ✅ Check console errors
   - ✅ Verify auth state
   - ✅ Check element selectors

3. **Data không lưu:**
   - ✅ Check network tab
   - ✅ Verify Firebase config
   - ✅ Check localStorage backup

## 📈 **PERFORMANCE**

### **Tối ưu hóa:**
- ✅ Save Firebase mỗi 60s (không phải mỗi giây)
- ✅ Update UI mỗi 10s (không phải real-time)
- ✅ Use sendBeacon cho unload
- ✅ localStorage backup

### **Memory usage:**
- ✅ Clear intervals on logout
- ✅ Remove event listeners
- ✅ Reset session data

## ✅ **HOÀN THÀNH**

- ✅ Tracking chính xác theo timestamp
- ✅ Firebase integration với security rules
- ✅ Giới hạn 120 phút/ngày
- ✅ Block access khi vượt
- ✅ Warning system
- ✅ Progress bars & UI
- ✅ Backup & error handling
- ✅ Mobile responsive
- ✅ Performance optimized