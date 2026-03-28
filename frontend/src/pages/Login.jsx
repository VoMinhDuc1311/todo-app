import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Vui lòng nhập đầy đủ thông tin");
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("🎉 Đăng nhập thành công!");
      navigate("/");
    } catch (e) {
      toast.error(e.response?.data?.message || "Email hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={{ ...styles.blob, top: -100, left: -100, background: "rgba(99,102,241,.3)" }} />
      <div style={{ ...styles.blob, bottom: -100, right: -60, background: "rgba(139,92,246,.25)" }} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>⚡</div>
          <div>
            <h1 style={styles.appName}>TaskFlow</h1>
            <p style={styles.appSlogan}>Quản lý công việc thông minh</p>
          </div>
        </div>

        <div style={styles.divider} />

        <h2 style={styles.title}>Chào mừng trở lại 👋</h2>
        <p style={styles.subtitle}>Đăng nhập để quản lý công việc</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
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
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: 38, paddingRight: 40 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          >
            {loading ? (
              <><span className="spinner" /> Đang đăng nhập...</>
            ) : (
              "Đăng nhập →"
            )}
          </button>
        </form>

        <p style={styles.footer}>
          Chưa có tài khoản?{" "}
          <Link to="/register" style={styles.link}>
            Đăng ký miễn phí
          </Link>
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
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  logoIcon: {
    width: 48,
    height: 48,
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    boxShadow: "0 8px 24px rgba(99,102,241,.4)",
  },
  appName: {
    fontWeight: 800,
    fontSize: 20,
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    lineHeight: 1.2,
  },
  appSlogan: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 1,
  },
  divider: {
    height: 1,
    background: "#f1f5f9",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
    pointerEvents: "none",
    zIndex: 1,
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    padding: "4px",
  },
  footer: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
    color: "#64748b",
  },
  link: {
    color: "#6366f1",
    fontWeight: 700,
    textDecoration: "none",
  },
};
