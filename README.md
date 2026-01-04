# 🎓 PHẦN MỀM HỖ TRỢ HỌC TẬP CHỦ ĐỘNG

Nền tảng học tập thông minh với sự hỗ trợ của AI, giúp học sinh học tập hiệu quả và chủ động.

## ✨ Tính năng chính

### 🔐 **Xác thực người dùng**
- Đăng nhập/đăng ký bằng email & mật khẩu
- Đăng nhập nhanh với Google
- Quản lý phiên đăng nhập an toàn với Firebase Auth

### 🤖 **AI Chat thông minh**
- Hỗ trợ giải bài tập các môn học
- Quản lý nhiều cuộc hội thoại
- Giao diện Glass Morphism hiện đại
- Quick Actions cho các tác vụ phổ biến
- Typing indicator và message actions

### ⏱️ **Theo dõi thời gian sử dụng web**
- Tự động theo dõi từ login → logout
- Lưu trữ Firebase theo ngày
- Giới hạn 120 phút/ngày với cảnh báo
- Progress bar và thống kê real-time

### 📊 **Dashboard thống kê**
- Tổng quan hoạt động học tập
- Thống kê thời gian sử dụng
- Quick actions và navigation
- Responsive design cho mọi thiết bị

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript ES Modules
- **Backend**: Firebase (Authentication + Firestore)
- **UI**: Glass Morphism design, Inter font
- **Icons**: Font Awesome 6.4.0
- **Deployment**: Static hosting

## 📁 Cấu trúc dự án

```
hoc-tap-chu-dong/
│
├── index.html              # Trang đăng nhập
├── dashboard.html          # Dashboard chính
├── ai-chat-new.html       # AI Chat hiện đại
│
├── css/
│   ├── style.css          # Base styles & variables
│   ├── login.css          # Login page styles
│   ├── dashboard.css      # Dashboard styles
│   └── ai-chat.css        # AI Chat styles
│
├── js/
│   ├── firebase.js        # Firebase configuration
│   ├── auth.js           # Authentication logic
│   ├── dashboard.js      # Dashboard functionality
│   ├── ai-new.js         # Modern AI Chat system
│   ├── usageTracker.js   # Web usage tracking
│   ├── webUsageTracker.js # Display utilities
│   ├── errorHandler.js   # Global error handling
│   └── extension-error-fix.js # Browser extension error suppression
│
├── assets/
│   └── logo.jpg          # Application logo
│
├── firestore-rules.txt   # Firestore security rules
└── WEB_USAGE_TRACKER.md  # Usage tracking documentation
```

## 🚀 Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd hoc-tap-chu-dong
```

### 2. Cấu hình Firebase
1. Tạo project Firebase tại https://console.firebase.google.com/
2. Bật Authentication (Email/Password + Google)
3. Tạo Firestore Database
4. Cập nhật config trong `js/firebase.js`

### 3. Cấu hình Firestore Rules
Copy nội dung từ `firestore-rules.txt` và paste vào Firebase Console > Firestore > Rules

### 4. Chạy ứng dụng
```bash
# Sử dụng Live Server (VS Code extension)
# Hoặc Python
python -m http.server 8000

# Hoặc Node.js
npx serve .
```

## 🔧 Cấu hình Firebase

### Firebase Config
Cập nhật thông tin trong `js/firebase.js`:
```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### Firestore Collections
- `users`: Thông tin người dùng
- `usage/{userId}/daily/{date}`: Thời gian sử dụng web theo ngày

## 🎯 Tính năng nổi bật

### Modern AI Chat
- Glass Morphism UI với backdrop blur
- Conversation management thông minh
- Message actions (copy, like)
- Quick actions cho các tác vụ phổ biến
- Mobile-first responsive design

### Web Usage Tracking
- Timestamp-based tracking (không dùng setInterval)
- Firebase Firestore integration
- 120 phút/ngày limit với warning system
- Progress bars với color coding
- Backup localStorage khi offline

### Clean Architecture
- ES Modules với proper imports
- Error handling toàn diện
- Browser extension error suppression
- Async function best practices

## �️ Code Quality & Best Practices

### Async Function Pattern
```javascript
// ✅ ĐÚNG - Always return boolean
async function loadData() {
    if (!user) return false; // Không return trống
    
    // ... logic
    return true; // Return success
}

// ❌ SAI - Causes "Uncaught (in promise) undefined"
async function loadData() {
    if (!user) return; // Return undefined
}
```

### Error Handling
- Global error handler cho unhandled promises
- Browser extension error suppression
- Graceful fallbacks cho offline scenarios

## 📱 Responsive Design

- **Desktop**: Full sidebar layout
- **Tablet**: Adaptive grid system
- **Mobile**: Collapsible sidebar, touch-friendly UI
- **Glass Morphism**: Modern blur effects across devices

## 🔒 Bảo mật

- Firestore Security Rules: User isolation
- Authentication required cho mọi operations
- No sensitive data in localStorage
- HTTPS-only Firebase configuration

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir .
```

### GitHub Pages
1. Push code lên GitHub
2. Settings > Pages > Deploy from branch
3. Chọn branch main

## 📚 Documentation

- `WEB_USAGE_TRACKER.md`: Chi tiết về hệ thống tracking
- `firestore-rules.txt`: Security rules cho Firestore
- Code comments: Comprehensive documentation trong source

## 🔧 Troubleshooting

### Common Issues
1. **Firebase permission denied**: Check firestore-rules.txt
2. **Async function errors**: Ensure proper return values
3. **Extension errors**: Already handled by error suppression
4. **Mobile layout**: Check viewport meta tag

### Debug Tools
- Browser DevTools Console
- Firebase Console > Firestore
- Network tab for API calls
- Application tab for localStorage

---

**Phát triển bởi**: Nhóm phát triển phần mềm học tập  
**Phiên bản**: 2.0.0  
**Cập nhật**: January 2026