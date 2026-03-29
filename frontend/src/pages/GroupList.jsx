import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import "../style/Group.css";

export default function GroupList() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/groups");
      setGroups(res.data.data);
    } catch {
      toast.error("Lỗi tải danh sách nhóm");
    } finally {
      setLoading(false);
    }
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
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi tạo nhóm");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa nhóm này? Tất cả task nhóm cũng sẽ bị xóa.")) return;
    try {
      await api.delete(`/groups/${id}`);
      setGroups((g) => g.filter((gr) => gr._id !== id));
      toast.success("Đã xóa nhóm");
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi xóa nhóm");
    }
  };

  const getGroupColorIndex = (id = "") => {
    if (!id) return 0;
    return id.charCodeAt(id.length - 1) % 6; // 0..5
  };

  return (
    <div className="page">
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
        <div className="group-grid">
          {groups.map((group) => {
            const isOwner = group.owner?._id === user?._id;
            const colorClass = `group-gradient-${getGroupColorIndex(group._id)}`;

            return (
              <div key={group._id} className="card group-card">
                <div className={`group-banner ${colorClass}`}>
                  <span className="group-banner-icon">👥</span>
                  {isOwner && <span className="group-owner-badge">👑 Leader</span>}
                </div>

                <div className="group-body">
                  <h3 className="group-name">{group.name}</h3>

                  {group.description && <p className="group-description">{group.description}</p>}

                  <div className="group-members-row">
                    <div className="avatar-stack">
                      {group.members?.slice(0, 4).map((m) => (
                        <div
                          key={m.user?._id}
                          className={`avatar avatar-sm group-member-avatar ${colorClass}`}
                          data-tooltip={m.user?.name}
                        >
                          {m.user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                      ))}

                      {group.members?.length > 4 && (
                        <div className="avatar avatar-sm group-member-avatar-more">
                          +{group.members.length - 4}
                        </div>
                      )}
                    </div>

                    <span className="group-members-count">{group.members?.length || 0} thành viên</span>
                  </div>

                  <div className="group-card-actions">
                    <button
                      onClick={() => navigate(`/groups/${group._id}`)}
                      className="btn btn-primary btn-sm group-detail-btn"
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal group-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>👥 Tạo nhóm mới</h2>
                <p className="group-create-subtitle">Thêm thành viên sau khi tạo xong</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
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

              <div className="group-create-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  Hủy
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? (
                    <>
                      <span className="spinner" /> Đang tạo...
                    </>
                  ) : (
                    "✅ Tạo nhóm"
                  )}
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
    <div className="group-skeleton-grid">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card group-skeleton-card">
          <div className="skeleton group-skeleton-banner" />
          <div className="skeleton group-skeleton-line-1" />
          <div className="skeleton group-skeleton-line-2" />
          <div className="skeleton group-skeleton-btn" />
        </div>
      ))}
    </div>
  );
}