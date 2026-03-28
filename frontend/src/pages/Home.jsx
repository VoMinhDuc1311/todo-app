import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const FILTERS = [
  { key: "all",        label: "Tất cả",      icon: "📋" },
  { key: "personal",   label: "Cá nhân",     icon: "👤" },
  { key: "group",      label: "Nhóm",        icon: "👥" },
  { key: "done",       label: "Hoàn thành",  icon: "✅" },
  { key: "overdue",    label: "Quá hạn",     icon: "⚠" },
];

const SORTS = [
  { key: "newest",   label: "Mới nhất" },
  { key: "oldest",   label: "Cũ nhất" },
  { key: "priority", label: "Ưu tiên" },
  { key: "dueDate",  label: "Hạn gần nhất" },
];

export default function Home() {
  const { user } = useAuth();
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [sort, setSort]           = useState("newest");
  const [search, setSearch]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask]   = useState(null);
  const searchRef = useRef(null);

  useEffect(() => { fetchTasks(); }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Suggestions update
  useEffect(() => {
    if (!search.trim()) return setSuggestions([]);
    const s = tasks
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 6);
    setSuggestions(s);
  }, [search, tasks]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tasks/my");
      setTasks(res.data.data);
    } catch {
      toast.error("Lỗi tải danh sách task");
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (saved) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t._id === saved._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleToggle   = (updated) => handleSaved(updated);
  const handleDelete   = (id)      => setTasks((prev) => prev.filter((t) => t._id !== id));

  // Filter + Search
  const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done";

  // Stats
  const stats = {
    total: tasks.length,
    totalP: tasks.filter(t => t.type === "personal").length,
    totalG: tasks.filter(t => t.type === "group").length,
    todo:  tasks.filter((t) => t.status === "todo").length,
    todoP: tasks.filter(t => t.status === "todo" && t.type === "personal").length,
    todoG: tasks.filter(t => t.status === "todo" && t.type === "group").length,
    doing: tasks.filter((t) => t.status === "in_progress").length,
    doingP: tasks.filter((t) => t.status === "in_progress" && t.type === "personal").length,
    doingG: tasks.filter((t) => t.status === "in_progress" && t.type === "group").length,
    done:  tasks.filter((t) => t.status === "done").length,
    doneP: tasks.filter((t) => t.status === "done" && t.type === "personal").length,
    doneG: tasks.filter((t) => t.status === "done" && t.type === "group").length,
    overdue: tasks.filter(isOverdue).length,
  };

  let displayed = tasks.filter((t) => {
    if (filter === "all")     return true;
    if (filter === "overdue") return isOverdue(t);
    if (filter === "done")    return t.status === "done";
    if (filter === "personal") return t.type === "personal";
    if (filter === "group")   return t.type === "group";
    return true;
  });

  if (search.trim()) {
    displayed = displayed.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.group?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Sort
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  displayed = [...displayed].sort((a, b) => {
    if (sort === "newest")   return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "oldest")   return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "priority") return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
    if (sort === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });

  const STAT_CARDS = [
    { label: "Tổng Task",    value: stats.total, split: `(${stats.totalP} Cá nhân, ${stats.totalG} Nhóm)`, icon: "📋", textColor: "#fff", bg: "linear-gradient(135deg, #a855f7, #6b21a8)" },
    { label: "Chờ làm",      value: stats.todo,  split: `(${stats.todoP} Cá nhân, ${stats.todoG} Nhóm)`, icon: "⭕", textColor: "#64748b", bg: "linear-gradient(135deg, #f8fafc, #f1f5f9)", color: "#64748b" },
    { label: "Đang làm",     value: stats.doing, split: `(${stats.doingP} Cá nhân, ${stats.doingG} Nhóm)`, icon: "🔵", textColor: "#fff", bg: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
    { label: "Hoàn thành",   value: stats.done,  split: `(${stats.doneP} Cá nhân, ${stats.doneG} Nhóm)`, icon: "✅", textColor: "#fff", bg: "linear-gradient(135deg, #10b981, #047857)" },
  ];

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Xin chào, {user?.name?.split(" ").pop()} 👋
          </h1>
          <p className="page-subtitle">
            Bạn có <strong style={{ color: stats.overdue > 0 ? "#ef4444" : "#6366f1" }}>
              {stats.overdue > 0 ? `${stats.overdue} task quá hạn` : `${stats.todo} task cần làm`}
            </strong> hôm nay
          </p>
        </div>
        <button
          onClick={() => { setEditTask(null); setShowModal(true); }}
          className="btn btn-primary"
        >
          ➕ Tạo task mới
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {STAT_CARDS.map((s) => (
          <div
            key={s.label}
            className="card card-elevated"
            style={{
              background: s.bg,
              border: s.color ? `1px solid ${s.color}22` : "none",
              cursor: "pointer",
              textAlign: "center",
              padding: "20px 16px",
            }}
            onClick={() => {
              const map = { "Tổng Task": "all", "Chờ làm": "todo", "Đang làm": "in_progress", "Hoàn thành": "done" };
              if (map[s.label]) setFilter(map[s.label]);
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6, filter: s.textColor === "#fff" ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none" }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.textColor, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: s.textColor === "#fff" ? "rgba(255,255,255,0.9)" : s.color, marginTop: 4, fontWeight: 600 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 11, color: s.textColor === "#fff" ? "rgba(255,255,255,0.7)" : "#94a3b8", marginTop: 4 }}>
              {s.split}
            </div>
          </div>
        ))}
      </div>

      {/* Overdue Warning */}
      {stats.overdue > 0 && (
        <div style={styles.overdueWarning}>
          <span style={{ fontSize: 20 }}>⚠</span>
          <p style={{ fontSize: 14, fontWeight: 600 }}>
            Bạn có <strong>{stats.overdue} task quá hạn!</strong>{" "}
            <button
              onClick={() => setFilter("overdue")}
              style={{ background: "none", border: "none", color: "#7f1d1d", fontWeight: 700, textDecoration: "underline", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}
            >
              Xem ngay
            </button>
          </p>
        </div>
      )}

      {/* Search + Sort Row */}
      <div style={styles.controlRow}>
        {/* Search */}
        <div style={{ flex: 1, position: "relative" }} ref={searchRef}>
          <div className="search-wrap" style={{ marginBottom: 0 }}>
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="search"
              placeholder="Tìm kiếm task..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((s) => (
                <div
                  key={s._id}
                  className="search-suggestions-item"
                  onClick={() => {
                    setSearch(s.title);
                    setShowSuggestions(false);
                  }}
                >
                  <span style={{ fontSize: 14 }}>
                    {s.status === "done" ? "✅" : s.status === "in_progress" ? "🔵" : "⭕"}
                  </span>
                  <span style={{ fontWeight: 500 }}>{s.title}</span>
                  {s.priority === "high" && <span className="badge badge-high" style={{ marginLeft: "auto" }}>Cao</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Sắp xếp:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ width: "auto", padding: "8px 28px 8px 12px" }}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.icon} {f.label}
            {f.key !== "all" && (
              <span style={{
                marginLeft: 4,
                background: filter === f.key ? "rgba(255,255,255,.3)" : "#e2e8f0",
                color: filter === f.key ? "#fff" : "#64748b",
                padding: "1px 6px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
              }}>
                {f.key === "personal" ? stats.totalP :
                 f.key === "group" ? stats.totalG :
                 f.key === "done" ? stats.done :
                 f.key === "overdue" ? stats.overdue : ""}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <SkeletonList />
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">{search ? "🔍" : filter === "done" ? "🏆" : "📭"}</span>
          <h3>
            {search ? "Không tìm thấy task phù hợp" :
             filter === "done" ? "Chưa có task nào hoàn thành" :
             "Bạn chưa có task cá nhân hoặc nhóm"}
          </h3>
          <p>
            {search ? `Không có task nào chứa "${search}"` :
             filter === "all" ? "Tạo task đầu tiên của bạn để bắt đầu!" :
             "Không có task nào trong danh mục này"}
          </p>
          {filter === "all" && !search && (
            <button
              onClick={() => { setEditTask(null); setShowModal(true); }}
              className="btn btn-primary"
            >
              ➕ Tạo task đầu tiên
            </button>
          )}
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, fontWeight: 500 }}>
            Hiển thị {displayed.length} / {tasks.length} task
          </p>
          {displayed.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              currentUserId={user?._id}
              onToggle={handleToggle}
              onEdit={(t) => { setEditTask(t); setShowModal(true); }}
              onDelete={handleDelete}
            />
          ))}
        </>
      )}

      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ marginBottom: 10, borderRadius: 12, overflow: "hidden" }}>
          <div className="skeleton" style={{ height: 100 }} />
        </div>
      ))}
    </div>
  );
}

const styles = {
  controlRow: {
    display: "flex",
    gap: 12,
    marginBottom: 16,
    alignItems: "center",
    flexWrap: "wrap",
  },
  overdueWarning: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 12,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    color: "#7f1d1d",
  },
};