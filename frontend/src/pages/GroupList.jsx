import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function GroupList() {
  const { user } = useAuth();
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/groups");
      setGroups(res.data.data);
    } catch { toast.error("Lỗi tải danh sách nhóm"); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Vui lòng nhập tên nhóm");
    setCreating(true);
    try {
      const res = await api.post("/groups", form);
      setGroups((g) => [res.data.data, ...g]);
      setForm({ name: "", description: "" });
      setShowModal(false);
      toast.success("✅ Tạo nhóm thành công!");
    } catch (e) { toast.error(e.response?.data?.message || "Lỗi tạo nhóm"); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa nhóm này? Tất cả task nhóm cũng sẽ bị xóa.")) return;
    try {
      await api.delete(`/groups/${id}`);
      setGroups((g) => g.filter((gr) => gr._id !== id));
      toast.success("Đã xóa nhóm");
    } catch (e) { toast.error(e.response?.data?.message || "Lỗi xóa nhóm"); }
  };

  const GroupColors = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)",
    "linear-gradient(135deg,#10b981,#059669)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#ec4899,#8b5cf6)",
    "linear-gradient(135deg,#14b8a6,#0ea5e9)",
  ];

  const getGroupGradient = (id = "") => {
    const idx = id.charCodeAt(id.length - 1) % GroupColors.length;
    return GroupColors[idx];
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Nhóm của tôi</h1>
          <p className="page-subtitle">
            {groups.length > 0
              ? `Bạn đang tham gia ${groups.length} nhóm`
              : "Tạo nhóm để làm việc cùng nhau"}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          ➕ Tạo nhóm mới
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <GroupSkeleton />
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <h3>Chưa có nhóm nào</h3>
          <p>Tạo nhóm mới để bắt đầu cộng tác với đồng đội!</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            ➕ Tạo nhóm đầu tiên
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {groups.map((group) => {
            const isOwner = group.owner?._id === user?._id;
            const gradient = getGroupGradient(group._id);

            return (
              <div key={group._id} className="card" style={styles.groupCard}>
                {/* Gradient banner */}
                <div style={{ ...styles.banner, background: gradient }}>
                  <span style={styles.bannerIcon}>👥</span>
                  {isOwner && (
                    <span style={styles.ownerBadge}>👑 Leader</span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: "16px 0 0" }}>
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", marginBottom: 6 }}>
                    {group.name}
                  </h3>

                  {group.description && (
                    <p style={{ fontSize: 13, color: "#64748b", marginBottom: 10, lineHeight: 1.6 }}>
                      {group.description}
                    </p>
                  )}

                  {/* Members avatars */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div className="avatar-stack">
                      {group.members?.slice(0, 4).map((m) => (
                        <div
                          key={m.user?._id}
                          className="avatar avatar-sm"
                          data-tooltip={m.user?.name}
                          style={{ background: gradient }}
                        >
                          {m.user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                      ))}
                      {group.members?.length > 4 && (
                        <div className="avatar avatar-sm" style={{ background: "#94a3b8" }}>
                          +{group.members.length - 4}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
                      {group.members?.length || 0} thành viên
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => navigate(`/groups/${group._id}`)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      Xem chi tiết →
                    </button>
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(group._id)}
                        className="btn btn-danger btn-sm"
                        data-tooltip="Xóa nhóm"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div>
                <h2>👥 Tạo nhóm mới</h2>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  Thêm thành viên sau khi tạo xong
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Tên nhóm *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Frontend Team, Marketing..."
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Mô tả nhóm</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Mục tiêu, phạm vi công việc của nhóm..."
                  rows={3}
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  Hủy
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? <><span className="spinner" /> Đang tạo...</> : "✅ Tạo nhóm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div className="skeleton" style={{ height: 90, borderRadius: 10, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 16, borderRadius: 8, marginBottom: 8, width: "70%" }} />
          <div className="skeleton" style={{ height: 13, borderRadius: 8, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 36, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
    gap: 18,
  },
  groupCard: {
    padding: "0 16px 16px",
    overflow: "hidden",
    cursor: "default",
    transition: "transform .2s, box-shadow .2s",
  },
  banner: {
    height: 90,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: "0 16px",
    margin: "-0px -16px 0",
    borderRadius: "10px 10px 0 0",
  },
  bannerIcon: {
    fontSize: 40,
    opacity: 0.9,
  },
  ownerBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "rgba(255,255,255,.25)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 99,
    backdropFilter: "blur(4px)",
  },
  cardActions: {
    display: "flex",
    gap: 8,
  },
};
