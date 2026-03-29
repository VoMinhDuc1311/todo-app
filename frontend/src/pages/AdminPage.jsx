import { useState, useEffect } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

const TABS = [
  { key: "stats",  label: "📊 Thống kê",  desc: "Tổng quan hệ thống" },
  { key: "users",  label: "👤 Users",      desc: "Quản lý người dùng" },
  { key: "tasks",  label: "📋 Tasks",      desc: "Tất cả công việc" },
  { key: "groups", label: "👥 Groups",     desc: "Tất cả nhóm" },
];

const STATUS_META = {
  todo:        { label: "Chờ làm",    color: "#64748b", bg: "#f1f5f9" },
  in_progress: { label: "Đang làm",  color: "#2563eb", bg: "#dbeafe" },
  done:        { label: "Hoàn thành",color: "#10b981", bg: "#d1fae5" },
};

export default function AdminPage() {
  const [tab, setTab]         = useState("stats");
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [tasks, setTasks]     = useState([]);
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchTask, setSearchTask] = useState("");

  useEffect(() => { handleTabChange("stats"); }, []);

  const fetchStats  = async () => { const r = await api.get("/admin/stats");  setStats(r.data.data); };
  const fetchUsers  = async () => { const r = await api.get("/admin/users");  setUsers(r.data.data); };
  const fetchTasks  = async () => { const r = await api.get("/admin/tasks");  setTasks(r.data.data); };
  const fetchGroups = async () => { const r = await api.get("/admin/groups"); setGroups(r.data.data); };

  const handleTabChange = async (t) => {
    setTab(t);
    setLoading(true);
    try {
      if (t === "stats")  await fetchStats();
      if (t === "users")  await fetchUsers();
      if (t === "tasks")  await fetchTasks();
      if (t === "groups") await fetchGroups();
    } catch { toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Xóa người dùng này?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("Đã xóa người dùng");
    } catch (e) { toast.error(e.response?.data?.message || "Lỗi xóa"); }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    if (!window.confirm(`Đổi role của ${user.name} sang ${newRole}?`)) return;
    try {
      const res = await api.patch(`/admin/users/${user._id}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => u._id === user._id ? res.data.data : u));
      toast.success(`Đã đổi role → ${newRole}`);
    } catch (e) { toast.error(e.response?.data?.message || "Lỗi đổi role"); }
  };

  const filteredUsers = users.filter((u) =>
    !searchUser || u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredTasks = tasks.filter((t) =>
    !searchTask || t.title.toLowerCase().includes(searchTask.toLowerCase())
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙ Trang Quản trị</h1>
          <p className="page-subtitle">Quản lý toàn bộ hệ thống TaskFlow</p>
        </div>
        <span style={styles.adminBadge}>⚙ Admin</span>
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            style={{
              ...styles.tabBtn,
              ...(tab === t.key ? styles.tabBtnActive : {}),
            }}
          >
            <span>{t.label}</span>
            {tab === t.key && (
              <span style={styles.tabDesc}>{t.desc}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 36, animation: "float 1.5s ease-in-out infinite" }}>⏳</div>
          <p style={{ color: "#94a3b8", marginTop: 12 }}>Đang tải dữ liệu...</p>
        </div>
      )}

      {/* ── STATS ── */}
      {tab === "stats" && !loading && stats && (
        <div>
          <div className="stat-grid">
            {[
              { label: "Tổng Users",      value: stats.totalUsers,  icon: "👤", color: "#6366f1", bg: "#eef2ff" },
              { label: "Tổng Tasks",      value: stats.totalTasks,  icon: "📋", color: "#2563eb", bg: "#dbeafe" },
              { label: "Task Hoàn thành", value: stats.doneTasks,   icon: "✅", color: "#10b981", bg: "#d1fae5" },
              { label: "Tổng Nhóm",       value: stats.totalGroups, icon: "👥", color: "#f59e0b", bg: "#fef3c7" },
            ].map((s) => (
              <div
                key={s.label}
                className="card"
                style={{ background: s.bg, border: `1px solid ${s.color}22`, textAlign: "center", padding: "28px 16px" }}
              >
                <div style={{ fontSize: 36 }}>{s.icon}</div>
                <div style={{ fontSize: 42, fontWeight: 900, color: s.color, lineHeight: 1.1, margin: "8px 0 4px" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Completion Rate */}
          {stats.totalTasks > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: "#475569" }}>Tỷ lệ hoàn thành hệ thống</span>
                <span style={{ fontWeight: 800, color: "#10b981" }}>
                  {Math.round((stats.doneTasks / stats.totalTasks) * 100)}%
                </span>
              </div>
              <div style={{ background: "#f1f5f9", borderRadius: 99, height: 10, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(stats.doneTasks / stats.totalTasks) * 100}%`,
                    background: "linear-gradient(90deg,#10b981,#059669)",
                    borderRadius: 99,
                    transition: "width 1.2s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                {stats.doneTasks}/{stats.totalTasks} tasks hoàn thành
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── USERS ── */}
      {tab === "users" && !loading && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>👤 Danh sách Users ({filteredUsers.length})</h3>
            <div style={{ position: "relative", width: 240 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
              <input
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Tìm user..."
                style={{ paddingLeft: 34, padding: "8px 14px 8px 34px" }}
              />
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            className="avatar avatar-sm"
                            style={{ background: u.role === "admin" ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                          >
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color: "#64748b", fontSize: 13 }}>{u.email}</td>
                      <td>
                        <span style={{
                          ...styles.roleBadge,
                          background: u.role === "admin" ? "#fef3c7" : "#f1f5f9",
                          color: u.role === "admin" ? "#b45309" : "#475569",
                        }}>
                          {u.role === "admin" ? "⚙ Admin" : "👤 User"}
                        </span>
                      </td>
                      <td style={{ color: "#94a3b8", fontSize: 12 }}>
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handleToggleRole(u)}
                            className="btn btn-outline btn-sm"
                          >
                            {u.role === "admin" ? "→ User" : "→ Admin"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="btn btn-danger btn-sm"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                  Không tìm thấy user nào
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TASKS ── */}
      {tab === "tasks" && !loading && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>📋 Tất cả Tasks ({filteredTasks.length})</h3>
            <div style={{ position: "relative", width: 240 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
              <input
                value={searchTask}
                onChange={(e) => setSearchTask(e.target.value)}
                placeholder="Tìm task..."
                style={{ paddingLeft: 34, padding: "8px 14px 8px 34px" }}
              />
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Loại</th>
                    <th>Trạng thái</th>
                    <th>Ưu tiên</th>
                    <th>Người tạo</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => {
                    const sm = STATUS_META[t.status] || STATUS_META.todo;
                    return (
                      <tr key={t._id}>
                        <td style={{ fontWeight: 600, maxWidth: 200 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.title}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: t.type === "group" ? "#ede9fe" : "#f0fdf4",
                            color: t.type === "group" ? "#6d28d9" : "#166534",
                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                          }}>
                            {t.type === "group" ? "👥 Nhóm" : "👤 Cá nhân"}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: sm.bg, color: sm.color,
                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                          }}>
                            {sm.label}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${t.priority}`}>{
                            t.priority === "high" ? "🔴 Cao" :
                            t.priority === "medium" ? "🟡 TB" : "🟢 Thấp"
                          }</span>
                        </td>
                        <td style={{ color: "#64748b", fontSize: 13 }}>{t.createdBy?.name}</td>
                        <td style={{ color: "#94a3b8", fontSize: 12 }}>
                          {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredTasks.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                  Không tìm thấy task nào
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GROUPS ── */}
      {tab === "groups" && !loading && (
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>👥 Tất cả Nhóm ({groups.length})</h3>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tên nhóm</th>
                    <th>Mô tả</th>
                    <th>Leader</th>
                    <th style={{ textAlign: "center" }}>Thành viên</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr key={g._id}>
                      <td style={{ fontWeight: 700 }}>{g.name}</td>
                      <td style={{ color: "#64748b", fontSize: 13, maxWidth: 200 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {g.description || "—"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="avatar avatar-sm" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
                            {g.owner?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13 }}>{g.owner?.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 700, color: "#6366f1" }}>{g.members?.length || 0}</span>
                      </td>
                      <td style={{ color: "#94a3b8", fontSize: 12 }}>
                        {new Date(g.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {groups.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                  Chưa có nhóm nào
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  adminBadge: {
    background: "linear-gradient(135deg,#f59e0b,#ef4444)",
    color: "#fff",
    padding: "6px 16px",
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 700,
    boxShadow: "0 4px 12px rgba(245,158,11,.3)",
  },
  tabBar: {
    display: "flex",
    gap: 8,
    marginBottom: 28,
    background: "#f8fafc",
    padding: 6,
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    flexWrap: "wrap",
  },
  tabBtn: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: 10,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#475569",
    transition: "all .2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    fontFamily: "inherit",
    minWidth: 100,
  },
  tabBtnActive: {
    background: "#fff",
    color: "#6366f1",
    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
  },
  tabDesc: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 400,
  },
  roleBadge: {
    padding: "3px 10px",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 700,
    display: "inline-block",
  },
};
