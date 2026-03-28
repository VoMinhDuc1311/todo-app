import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import { toast } from "react-toastify";

export default function GroupDetail() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [group, setGroup]           = useState(null);
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState("tasks");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask]     = useState(null);
  const [addEmail, setAddEmail]     = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [gRes, tRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/tasks/group/${id}`),
      ]);
      setGroup(gRes.data.data);
      setTasks(tRes.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi tải dữ liệu nhóm");
      navigate("/groups");
    } finally {
      setLoading(false);
    }
  };

  const isOwner = group?.owner?._id === user?._id;

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addEmail.trim()) return;
    setAddingMember(true);
    try {
      const res = await api.post(`/groups/${id}/members`, { email: addEmail });
      setGroup(res.data.data);
      setAddEmail("");
      toast.success("✅ Đã thêm thành viên!");
    } catch (e) { toast.error(e.response?.data?.message || "Lỗi thêm thành viên"); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Xóa thành viên này khỏi nhóm?")) return;
    try {
      const res = await api.delete(`/groups/${id}/members/${memberId}`);
      setGroup(res.data.data);
      toast.success("Đã xóa thành viên");
    } catch (e) { toast.error(e.response?.data?.message || "Lỗi xóa thành viên"); }
  };

  const handleSaved = (saved) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t._id === saved._id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
  };

  const handleToggle = (updated) => handleSaved(updated);
  const handleDelete = (taskId) => setTasks((prev) => prev.filter((t) => t._id !== taskId));

  // Stats
  const stats = {
    all:         tasks.length,
    todo:        tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done:        tasks.filter((t) => t.status === "done").length,
  };

  const filteredTasks = filterStatus === "all"
    ? tasks
    : tasks.filter((t) => t.status === filterStatus);

  const completionRate = tasks.length > 0
    ? Math.round((stats.done / tasks.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="page">
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: "float 1.5s ease-in-out infinite" }}>⏳</div>
          <p style={{ color: "#94a3b8", fontSize: 15 }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Back + Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate("/groups")}
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 12 }}
        >
          ← Quay lại
        </button>

        <div className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ flex: 1 }}>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 44, height: 44,
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                borderRadius: 12,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>👥</span>
              {group?.name}
            </h1>
            {group?.description && (
              <p className="page-subtitle" style={{ marginLeft: 54 }}>{group.description}</p>
            )}
          </div>

          {isOwner && (
            <button
              onClick={() => { setEditTask(null); setShowTaskModal(true); }}
              className="btn btn-primary"
            >
              ➕ Thêm Task
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {tasks.length > 0 && (
        <div className="card" style={{ marginBottom: 20, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Tiến độ nhóm</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#6366f1" }}>{completionRate}%</span>
          </div>
          <div style={{ background: "#f1f5f9", borderRadius: 99, height: 8, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${completionRate}%`,
                background: completionRate === 100
                  ? "linear-gradient(90deg,#10b981,#059669)"
                  : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                borderRadius: 99,
                transition: "width 1s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
            <span>⭕ {stats.todo} chờ</span>
            <span>🔵 {stats.in_progress} đang</span>
            <span>✅ {stats.done} xong</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: "tasks",   label: `📋 Tasks (${tasks.length})` },
          { key: "members", label: `👥 Thành viên (${group?.members?.length || 0})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`btn btn-sm ${tab === t.key ? "btn-primary" : "btn-outline"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TASKS TAB ── */}
      {tab === "tasks" && (
        <div>
          {/* Status Filters */}
          {tasks.length > 0 && (
            <div className="filter-tabs" style={{ marginBottom: 16 }}>
              {[
                { key: "all", label: `Tất cả (${stats.all})` },
                { key: "todo", label: `⭕ Chờ (${stats.todo})` },
                { key: "in_progress", label: `🔵 Đang (${stats.in_progress})` },
                { key: "done", label: `✅ Xong (${stats.done})` },
              ].map((f) => (
                <button
                  key={f.key}
                  className={`filter-tab ${filterStatus === f.key ? "active" : ""}`}
                  onClick={() => setFilterStatus(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h3>Chưa có task nhóm nào</h3>
              <p>{isOwner ? "Tạo task để phân công cho thành viên" : "Leader chưa tạo task nào"}</p>
              {isOwner && (
                <button
                  onClick={() => { setEditTask(null); setShowTaskModal(true); }}
                  className="btn btn-primary"
                >
                  ➕ Tạo task đầu tiên
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                currentUserId={user?._id}
                onToggle={handleToggle}
                onEdit={(t) => { setEditTask(t); setShowTaskModal(true); }}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div>
          {/* Add Member (owner only) */}
          {isOwner && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>
                ➕ Thêm thành viên
              </h3>
              <form onSubmit={handleAddMember} style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>✉</span>
                  <input
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="Nhập email người dùng..."
                    type="email"
                    style={{ paddingLeft: 36 }}
                  />
                </div>
                <button type="submit" disabled={addingMember} className="btn btn-primary">
                  {addingMember ? <><span className="spinner" /> Đang thêm</> : "Thêm"}
                </button>
              </form>
            </div>
          )}

          {/* Member List */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>
              👥 Danh sách thành viên ({group?.members?.length || 0})
            </h3>

            {group?.members?.map((m) => (
              <div key={m.user?._id} style={styles.memberRow}>
                <div
                  className="avatar avatar-lg"
                  style={{
                    background: m.role === "leader"
                      ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                      : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  }}
                >
                  {m.user?.name?.charAt(0)?.toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                    {m.user?.name}
                    {m.user?._id === user?._id && (
                      <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, marginLeft: 6 }}>
                        (Bạn)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{m.user?.email}</div>
                </div>

                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 700,
                    background: m.role === "leader" ? "#fef3c7" : "#f1f5f9",
                    color: m.role === "leader" ? "#b45309" : "#475569",
                  }}
                >
                  {m.role === "leader" ? "👑 Leader" : "👤 Thành viên"}
                </span>

                {isOwner && m.role !== "leader" && (
                  <button
                    onClick={() => handleRemoveMember(m.user._id)}
                    className="btn btn-danger btn-sm"
                    data-tooltip="Xóa khỏi nhóm"
                  >
                    🗑
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editTask}
          groupId={id}
          members={group?.members || []}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

const styles = {
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
  },
  memberRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 0",
    borderBottom: "1px solid #f1f5f9",
  },
};
