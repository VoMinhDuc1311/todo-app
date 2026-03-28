# 📋 TodoApp – Quản lý Công việc Cá nhân & Nhóm

## 🗂 Cấu trúc project

```
todo-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               ← Kết nối MongoDB
│   │   ├── controllers/
│   │   │   ├── authController.js   ← Xử lý request auth
│   │   │   ├── taskController.js   ← Xử lý request task
│   │   │   └── groupController.js  ← Xử lý request group
│   │   ├── models/
│   │   │   ├── User.js             ← Schema người dùng
│   │   │   ├── Task.js             ← Schema công việc
│   │   │   └── Group.js            ← Schema nhóm
│   │   ├── repositories/
│   │   │   ├── userRepo.js         ← Truy vấn DB cho User
│   │   │   ├── taskRepo.js         ← Truy vấn DB cho Task
│   │   │   └── groupRepo.js        ← Truy vấn DB cho Group
│   │   ├── services/
│   │   │   ├── authService.js      ← Logic đăng nhập/đăng ký
│   │   │   ├── taskService.js      ← Logic CRUD task
│   │   │   └── groupService.js     ← Logic CRUD group & thành viên
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   ├── groupRoutes.js
│   │   │   └── adminRoutes.js
│   │   └── utils/
│   │       ├── jwt.js              ← Tạo & verify token
│   │       └── authMiddleware.js   ← Middleware bảo vệ route
│   ├── .env
│   ├── index.js                    ← Entry point backend
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js            ← Axios instance + interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx     ← Quản lý state đăng nhập
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskModal.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Home.jsx            ← Task cá nhân
│   │   │   ├── GroupList.jsx       ← Danh sách nhóm
│   │   │   ├── GroupDetail.jsx     ← Chi tiết nhóm + task nhóm
│   │   │   └── AdminPage.jsx       ← Trang quản trị
│   │   ├── App.jsx                 ← Router chính
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
│
└── seed.js                         ← Dữ liệu mẫu MongoDB
```

---

## ⚙️ Cài đặt & Chạy

### Bước 1 – Yêu cầu hệ thống
- Node.js >= 18
- MongoDB đang chạy (local port 27017)
- MongoDB Compass (tuỳ chọn, để xem dữ liệu)

---

### Bước 2 – Cài Backend

```bash
cd backend
npm install
```

Kiểm tra file `.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/TODO_MANAGEMENT
JWT_SECRET=todo_secret_key_2024
JWT_EXPIRES_IN=7d
```

Chạy backend:
```bash
npm run dev
```
✅ Server chạy tại: http://localhost:5000

---

### Bước 3 – Cài Frontend

```bash
cd frontend
npm install
npm run dev
```
✅ App chạy tại: http://localhost:3000

---

### Bước 4 – Seed dữ liệu mẫu (tuỳ chọn)

Mở MongoDB Compass → chọn database `TODO_MANAGEMENT` → mở tab Shell → dán nội dung file `seed.js` và chạy.

Tài khoản có sẵn sau khi seed:
| Tài khoản | Email | Mật khẩu | Role |
|---|---|---|---|
| Admin | admin@todo.com | password | admin |
| User A | a@todo.com | 123456 | user |
| User B | b@todo.com | 123456 | user |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | /api/auth/register | Đăng ký |
| POST | /api/auth/login | Đăng nhập |
| GET | /api/auth/me | Lấy thông tin bản thân |

### Tasks
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | /api/tasks/my | Task cá nhân của tôi |
| POST | /api/tasks/personal | Tạo task cá nhân |
| GET | /api/tasks/group/:groupId | Task của nhóm |
| POST | /api/tasks/group/:groupId | Tạo task nhóm (leader) |
| PUT | /api/tasks/:id | Cập nhật task |
| PATCH | /api/tasks/:id/toggle | Đánh dấu done/undo |
| PATCH | /api/tasks/:id/assign | Giao task cho thành viên |
| DELETE | /api/tasks/:id | Xóa task |

### Groups
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | /api/groups | Nhóm của tôi |
| POST | /api/groups | Tạo nhóm mới |
| GET | /api/groups/:id | Chi tiết nhóm |
| PUT | /api/groups/:id | Sửa nhóm |
| DELETE | /api/groups/:id | Xóa nhóm |
| POST | /api/groups/:id/members | Thêm thành viên (by email) |
| DELETE | /api/groups/:id/members/:memberId | Xóa thành viên |

### Admin (cần role admin)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | /api/admin/stats | Thống kê tổng quan |
| GET | /api/admin/users | Tất cả users |
| DELETE | /api/admin/users/:id | Xóa user |
| PATCH | /api/admin/users/:id/role | Đổi role |
| GET | /api/admin/tasks | Tất cả tasks |
| GET | /api/admin/groups | Tất cả groups |

---

## 🎯 Tính năng

### Client (User)
- ✅ Đăng ký / Đăng nhập với JWT
- ✅ Trang chủ: danh sách task cá nhân + filter (trạng thái) + tìm kiếm
- ✅ Thêm / Sửa / Xóa task cá nhân
- ✅ Đánh dấu hoàn thành (toggle done)
- ✅ Tạo nhóm, xem danh sách nhóm mình tham gia
- ✅ Thêm / Xóa thành viên nhóm (leader)
- ✅ Tạo task nhóm, giao task cho thành viên (leader)
- ✅ Thành viên đánh dấu done task được giao
- ✅ Toast thông báo khi CRUD thành công/thất bại

### Admin
- ✅ Trang quản trị riêng biệt (/admin)
- ✅ Thống kê tổng quan (users, tasks, groups, done rate)
- ✅ Xem / Xóa toàn bộ users
- ✅ Đổi role user ↔ admin
- ✅ Xem toàn bộ tasks & groups

---

## 🧱 Phân tầng kiến trúc Backend

```
Request → Route → Controller → Service → Repository → MongoDB
                     ↑
               (authMiddleware)
```

- **Route**: định nghĩa URL, method, gắn middleware
- **Controller**: nhận req/res, gọi service, trả response
- **Service**: xử lý business logic (validate, phân quyền)
- **Repository**: thuần truy vấn DB (tái sử dụng được)
- **Model**: định nghĩa schema MongoDB

---

## 🗄 Database: TODO_MANAGEMENT

### Collection: users
| Field | Type | Mô tả |
|---|---|---|
| name | String | Họ tên |
| email | String | Email (unique) |
| password | String | Đã hash bcrypt |
| role | String | "user" hoặc "admin" |

### Collection: tasks
| Field | Type | Mô tả |
|---|---|---|
| title | String | Tiêu đề task |
| description | String | Mô tả |
| status | String | todo / in_progress / done |
| priority | String | low / medium / high |
| dueDate | Date | Hạn hoàn thành |
| type | String | "personal" hoặc "group" |
| createdBy | ObjectId | ref → users |
| group | ObjectId | ref → groups (nếu là task nhóm) |
| assignedTo | ObjectId[] | ref → users (người được giao) |

### Collection: groups
| Field | Type | Mô tả |
|---|---|---|
| name | String | Tên nhóm |
| description | String | Mô tả |
| owner | ObjectId | ref → users (leader) |
| members | Array | [{user, role, joinedAt}] |
