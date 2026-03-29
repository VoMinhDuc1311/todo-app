import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function NotificationBell() {
  const [notis, setNotis] = useState([]);
  const [invites, setInvites] = useState([]);
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null); // To show loading state on buttons
  const ref = useRef(null);

  useEffect(() => {
    fetchAll();
    // Poll mỗi 10 giây cho group invites (và notification luôn)
    const timer = setInterval(fetchAll, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchAll = async () => {
    try {
      const [nRes, iRes] = await Promise.all([
        api.get("/notifications").catch(() => ({ data: { data: [] } })),
        api.get("/invites").catch(() => ({ data: { data: [] } })),
      ]);
      setNotis(nRes.data.data || []);
      setInvites(iRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const unreadNotis = notis.filter((n) => !n.isRead).length;
  const unreadCount = unreadNotis + invites.length; // Pending invites count as unread

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotis((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    const unreadIds = notis.filter((n) => !n.isRead).map((n) => n._id);
    await Promise.all(unreadIds.map((id) => api.patch(`/notifications/${id}/read`).catch(() => {})));
    setNotis((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleAcceptInvite = async (id) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api.post(`/invites/${id}/accept`);
      setInvites((prev) => prev.filter((i) => i._id !== id));
      toast.success("✅ Đã chấp nhận lời mời và tham gia nhóm!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi chấp nhận lời mời");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvite = async (id) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api.post(`/invites/${id}/reject`);
      setInvites((prev) => prev.filter((i) => i._id !== id));
      toast.info("Đã từ chối lời mời");
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi từ chối lời mời");
    } finally {
      setProcessingId(null);
    }
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

  // Merge lists and sort by date descending
  const combined = [
    ...notis.map((n) => ({ ...n, type: "notification" })),
    ...invites.map((i) => ({ ...i, type: "invite" })),
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return (
    <div style={{ position: "relative" }} ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-ghost btn-sm"
        style={{ position: "relative", fontSize: 18, padding: "6px 8px" }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown}>
          {/* Header */}
          <div style={styles.dropHeader}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Thông báo & Lời mời</span>
            {unreadNotis > 0 && (
              <button
                onClick={markAllRead}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12, padding: "3px 8px" }}
              >
                Đọc tất cả thông báo
              </button>
            )}
          </div>

          {/* List */}
          <div style={styles.list}>
            {combined.length === 0 ? (
              <div style={styles.empty}>
                <span style={{ fontSize: 32 }}>🔕</span>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                  Chưa có thông báo nào
                </p>
              </div>
            ) : (
              combined.slice(0, 15).map((item) => {
                if (item.type === "invite") {
                  return (
                    <div
                      key={`inv-${item._id}`}
                      style={{
                        ...styles.item,
                        background: "#f0fdf4",
                        borderLeft: "3px solid #22c55e",
                        cursor: "default",
                      }}
                    >
                      <div style={styles.itemIcon}>✉️</div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0f172a",
                            lineHeight: 1.5,
                          }}
                        >
                          <strong style={{ color: "#334155" }}>{item.senderId?.name}</strong> đã
                          mời bạn tham gia nhóm{" "}
                          <strong style={{ color: "#4f46e5" }}>{item.groupId?.name}</strong>
                        </p>
                        
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <button
                            onClick={() => handleAcceptInvite(item._id)}
                            disabled={processingId === item._id}
                            className="btn btn-primary btn-sm"
                            style={{ padding: "4px 12px", fontSize: 12, height: "auto" }}
                          >
                            {processingId === item._id ? "Đang xử lý..." : "Chấp nhận"}
                          </button>
                          <button
                            onClick={() => handleRejectInvite(item._id)}
                            disabled={processingId === item._id}
                            className="btn btn-outline btn-sm"
                            style={{ padding: "4px 12px", fontSize: 12, height: "auto" }}
                          >
                            Từ chối
                          </button>
                        </div>

                        {item.createdAt && (
                          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
                            {timeAgo(item.createdAt)}
                          </p>
                        )}
                      </div>
                      <span style={{ ...styles.dot, background: "#22c55e" }} />
                    </div>
                  );
                } else {
                  // Type: notification
                  return (
                    <div
                      key={`not-${item._id}`}
                      style={{
                        ...styles.item,
                        background: item.isRead ? "transparent" : "#f0f9ff",
                        borderLeft: item.isRead ? "3px solid transparent" : "3px solid #3b82f6",
                      }}
                      onClick={() => !item.isRead && markRead(item._id)}
                    >
                      <div style={styles.itemIcon}>{item.isRead ? "📭" : "📬"}</div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: item.isRead ? 400 : 600,
                            color: "#0f172a",
                            lineHeight: 1.5,
                          }}
                        >
                          {item.message}
                        </p>
                        {item.createdAt && (
                          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                            {timeAgo(item.createdAt)}
                          </p>
                        )}
                      </div>
                      {!item.isRead && <span style={styles.dot} />}
                    </div>
                  );
                }
              })
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
    maxHeight: 400,
    overflowY: "auto",
  },
  item: {
    display: "flex",
    gap: 10,
    padding: "14px 16px",
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
    marginTop: 6,
  },
  empty: {
    textAlign: "center",
    padding: "28px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};