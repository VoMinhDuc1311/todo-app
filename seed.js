// =================================================
// SEED DATA – chạy lần lượt trong MongoDB Compass
// hoặc mongosh để có dữ liệu mẫu
// =================================================

// 1. Chọn database
use TODO_MANAGEMENT;

// 2. Xóa dữ liệu cũ (tuỳ chọn)
db.users.drop();
db.tasks.drop();
db.groups.drop();

// 3. Tạo tài khoản Admin
// password: "admin123" (đã hash sẵn bằng bcryptjs salt=10)
db.users.insertOne({
  name: "Admin",
  email: "admin@todo.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  role: "admin",
  avatar: "",
  createdAt: new Date(),
  updatedAt: new Date()
});

// 4. Tạo tài khoản User mẫu
// password: "123456"
db.users.insertMany([
  {
    name: "Nguyễn Văn A",
    email: "a@todo.com",
    password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWq", // 123456
    role: "user",
    avatar: "",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Trần Thị B",
    email: "b@todo.com",
    password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWq", // 123456
    role: "user",
    avatar: "",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

