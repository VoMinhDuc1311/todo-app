import { useEffect, useState, useRef } from "react";
import api from "../api/axios";

export default function NotificationBell() {
  const [notis, setNotis] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetchNoti();
    // Poll mỗi 30 giây
    const timer = setInterval(fetchNoti, 30000);
    return () => clearInterval(timer);
  }, []);

 
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNoti = async () => {
    try {
      const res = await api.get("/notifications");
      setNotis(res.data.data);
    } catch {}
  };

  const unread = notis.filter((n) => !n.isRead).length;

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotis((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    const unreadIds = notis.filter(n => !n.isRead).map(n => n._id);
    await Promise.all(unreadIds.map(id => api.patch(`/notifications/${id}/read`)));
    setNotis((prev) => prev.map(n => ({ ...n, isRead: true })));
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} ngày trước`;
    if (h > 0) return `${h} giờ trước`;
    if (m > 0) return `${m} phút trước`;
    return "Vừa xong";
  };

  return (
    <div style={{ position: "relative" }} ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-ghost btn-sm"
        style={{ position: "relative", fontSize: 18, padding: "6px 8px" }}
      >
        🔔
        {unread > 0 && (
          <span style={styles.badge}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown}>
          {/* Header */}
          <div style={styles.dropHeader}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Thông báo</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12, padding: "3px 8px" }}
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div style={styles.list}>
            {notis.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: 32 }}>🔕</span>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                  Chưa có thông báo nào
                </p>
              </div>
            ) : (
              notis.slice(0, 10).map((n) => (
                <div
                  key={n._id}
                  style={{
                    ...styles.item,
                    background: n.isRead ? "transparent" : "#f0f9ff",
                    borderLeft: n.isRead ? "3px solid transparent" : "3px solid #3b82f6",
                  }}
                  onClick={() => !n.isRead && markRead(n._id)}
                >
                  <div style={styles.itemIcon}>{n.isRead ? "📭" : "📬"}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: "var(--text-primary)", lineHeight: 1.5 }}>
                      {n.message}
                    </p>
                    {n.createdAt && (
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    )}
                  </div>
                  {!n.isRead && <span style={styles.dot} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    background: "#ef4444",
    color: "#fff",
    borderRadius: "999px",
    fontSize: 10,
    fontWeight: 800,
    minWidth: 18,
    height: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    border: "2px solid #fff",
    animation: "pulse-red 2s infinite",
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 8px)",
    width: 320,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    boxShadow: "0 20px 48px rgba(0,0,0,.14)",
    overflow: "hidden",
    zIndex: 300,
    animation: "slideDown .2s ease",
  },
  dropHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 10px",
    borderBottom: "1px solid #e2e8f0",
  },
  list: {
    maxHeight: 360,
    overflowY: "auto",
  },
  item: {
    display: "flex",
    gap: 10,
    padding: "12px 16px",
    cursor: "pointer",
    transition: "background .15s",
    borderBottom: "1px solid #f1f5f9",
    alignItems: "flex-start",
  },
  itemIcon: {
    fontSize: 18,
    flexShrink: 0,
    marginTop: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#3b82f6",
    flexShrink: 0,
    marginTop: 4,
  },
  empty: {
    textAlign: "center",
    padding: "28px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};