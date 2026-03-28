import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* LOGO */}
        <Link to="/" style={styles.brand}>
          <span style={styles.brandIcon}>⚡</span>
          <span style={styles.brandText}>TaskFlow</span>
        </Link>

        {/* NAV LINKS — Desktop */}
        <div style={styles.links}>
          <NavLink to="/" label="Dashboard" active={isActive("/")} icon="📊" />
          <NavLink to="/groups" label="Nhóm" active={isActive("/groups")} icon="👥" />
          {user?.role === "admin" && (
            <NavLink to="/admin" label="Admin" active={isActive("/admin")} icon="⚙" isAdmin />
          )}
        </div>

        {/* RIGHT SIDE */}
        <div style={styles.right}>
          <NotificationBell />

          {/* User Chip */}
          <div style={styles.userChip}>
            <div style={styles.userAvatar}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span style={styles.userName}>{user?.name}</span>
          </div>

          <button onClick={handleLogout} className="btn btn-outline btn-sm">
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, label, active, icon, isAdmin }) {
  return (
    <Link
      to={to}
      style={{
        ...styles.navLink,
        ...(active ? styles.navLinkActive : {}),
        ...(isAdmin && !active ? styles.navLinkAdmin : {}),
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

const styles = {
  nav: {
    background: "rgba(255,255,255,.92)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 200,
    boxShadow: "0 1px 16px rgba(0,0,0,.06)",
  },
  inner: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "0 20px",
    height: 62,
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
    textDecoration: "none",
  },
  brandIcon: {
    fontSize: 22,
    lineHeight: 1,
  },
  brandText: {
    fontWeight: 800,
    fontSize: 18,
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-.02em",
  },
  links: {
    display: "flex",
    gap: 4,
    flex: 1,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    borderRadius: 10,
    fontWeight: 500,
    fontSize: 14,
    color: "#475569",
    transition: "all .2s",
    textDecoration: "none",
  },
  navLinkActive: {
    background: "#eef2ff",
    color: "#4f46e5",
    fontWeight: 700,
  },
  navLinkAdmin: {
    color: "#d97706",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginLeft: "auto",
  },
  userChip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "5px 12px 5px 5px",
    borderRadius: 999,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },
};