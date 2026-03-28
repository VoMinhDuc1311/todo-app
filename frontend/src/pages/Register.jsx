import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const strength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    return s;
  };

  const pwStrength = strength(form.password);
  const strengthLabel = ["", "Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"][pwStrength] || "";
  const strengthColor = ["", "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#10b981"][pwStrength] || "#e5e7eb";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error("Vui lòng nhập đầy đủ thông tin");
    if (form.password.length < 6) return toast.error("Mật khẩu tối thiểu 6 ký tự");
    if (form.password !== form.confirm) return toast.error("Mật khẩu xác nhận không khớp");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("🎉 Đăng ký thành công! Chào mừng bạn!");
      navigate("/");
    } catch (e) {
      toast.error(e.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={{ ...styles.blob, top: -80, right: -80, background: "rgba(99,102,241,.3)" }} />
      <div style={{ ...styles.blob, bottom: -80, left: -80, background: "rgba(139,92,246,.25)" }} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>⚡</div>
          <div>
            <h1 style={styles.appName}>TaskFlow</h1>
            <p style={styles.appSlogan}>Tạo tài khoản miễn phí</p>
          </div>
        </div>

        <div style={{ height: 1, background: "#f1f5f9", marginBottom: 20 }} />

        <h2 style={styles.title}>Tạo tài khoản mới ✨</h2>
        <p style={styles.subtitle}>Bắt đầu quản lý công việc hôm nay</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          {/* Name */}
          <div className="form-group">
            <label>Họ và tên</label>
            <div style={{ position: "relative" }}>
              <span style={styles.inputIcon}>👤</span>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Nguyễn Văn A"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <div style={{ position: "relative" }}>
              <span style={styles.inputIcon}>✉</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                style={{ paddingLeft: 38, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
            {/* Strength Bar */}
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1,2,3,4,5].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: 4,
                        flex: 1,
                        borderRadius: 99,
                        background: i <= pwStrength ? strengthColor : "#e5e7eb",
                        transition: "all .3s",
                      }}
                    />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: strengthColor, marginTop: 4, fontWeight: 600 }}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <div style={{ position: "relative" }}>
              <span style={styles.inputIcon}>
                {form.confirm && form.confirm === form.password ? "✅" : "🔒"}
              </span>
              <input
                type={showPass ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                placeholder="Nhập lại mật khẩu"
                style={{
                  paddingLeft: 38,
                  borderColor: form.confirm && form.confirm !== form.password ? "#ef4444" : undefined,
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          >
            {loading ? (
              <><span className="spinner" /> Đang đăng ký...</>
            ) : (
              "Đăng ký ngay →"
            )}
          </button>
        </form>

        <p style={styles.footer}>
          Đã có tài khoản?{" "}
          <Link to="/login" style={styles.link}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: "50%",
    filter: "blur(80px)",
    pointerEvents: "none",
  },
  card: {
    background: "rgba(255,255,255,.97)",
    backdropFilter: "blur(20px)",
    padding: "40px",
    borderRadius: 24,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 32px 64px rgba(0,0,0,.2)",
    position: "relative",
    zIndex: 1,
    animation: "slideUp .4s cubic-bezier(.34,1.56,.64,1)",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  logoIcon: {
    width: 48, height: 48,
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    borderRadius: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24,
    boxShadow: "0 8px 24px rgba(99,102,241,.4)",
  },
  appName: {
    fontWeight: 800, fontSize: 20,
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    lineHeight: 1.2,
  },
  appSlogan: { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  title: { fontSize: 22, fontWeight: 800, color: "#0f172a" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  inputIcon: {
    position: "absolute", left: 12, top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14, pointerEvents: "none", zIndex: 1,
  },
  eyeBtn: {
    position: "absolute", right: 10, top: "50%",
    transform: "translateY(-50%)",
    background: "transparent", border: "none",
    cursor: "pointer", fontSize: 14, padding: "4px",
  },
  footer: { textAlign: "center", marginTop: 24, fontSize: 14, color: "#64748b" },
  link: { color: "#6366f1", fontWeight: 700, textDecoration: "none" },
};
