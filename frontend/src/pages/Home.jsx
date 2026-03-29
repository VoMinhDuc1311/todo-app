import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import TaskCard from "../components/TaskCard";
import TaskBoard from "../components/TaskBoard";
import TaskModal from "../components/TaskModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import "../style/Home.css";

const FILTERS = [
  { key: "all", label: "Tất cả", icon: "📋" },
  { key: "personal", label: "Cá nhân", icon: "👤" },
  { key: "group", label: "Nhóm", icon: "👥" },
  { key: "done", label: "Hoàn thành", icon: "✅" },
  { key: "overdue", label: "Quá hạn", icon: "⚠" },
];

const SORTS = [
  { key: "newest", label: "Mới nhất" },
  { key: "oldest", label: "Cũ nhất" },
  { key: "priority", label: "Ưu tiên" },
  { key: "dueDate", label: "Hạn gần nhất" },
];

export default function Home() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }

    const next = tasks
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 6);

    setSuggestions(next);
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

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi di chuyển task!");
      fetchTasks(); 
    }
  };

  const handleToggle = (updated) => handleSaved(updated);
  const handleDelete = (id) => setTasks((prev) => prev.filter((t) => t._id !== id));

  const isOverdue = (t) =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done";

  const stats = {
    total: tasks.length,
    totalP: tasks.filter((t) => t.type === "personal").length,
    totalG: tasks.filter((t) => t.type === "group").length,
    todo: tasks.filter((t) => t.status === "todo").length,
    todoP: tasks.filter((t) => t.status === "todo" && t.type === "personal").length,
    todoG: tasks.filter((t) => t.status === "todo" && t.type === "group").length,
    doing: tasks.filter((t) => t.status === "in_progress").length,
    doingP: tasks.filter((t) => t.status === "in_progress" && t.type === "personal").length,
    doingG: tasks.filter((t) => t.status === "in_progress" && t.type === "group").length,
    done: tasks.filter((t) => t.status === "done").length,
    doneP: tasks.filter((t) => t.status === "done" && t.type === "personal").length,
    doneG: tasks.filter((t) => t.status === "done" && t.type === "group").length,
    overdue: tasks.filter(isOverdue).length,
  };

  let displayed = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "todo") return t.status === "todo";
    if (filter === "in_progress") return t.status === "in_progress";
    if (filter === "done") return t.status === "done";
    if (filter === "overdue") return isOverdue(t);
    if (filter === "personal") return t.type === "personal";
    if (filter === "group") return t.type === "group";
    return true;
  });

  if (search.trim()) {
    const q = search.toLowerCase();
    displayed = displayed.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.group?.name?.toLowerCase().includes(q)
    );
  }

  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  displayed = [...displayed].sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "priority") {
      return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
    }
    if (sort === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });

  const STAT_CARDS = [
    {
      label: "Tổng Task",
      value: stats.total,
      split: `(${stats.totalP} Cá nhân, ${stats.totalG} Nhóm)`,
      icon: "📋",
      textColor: "#fff",
      bg: "linear-gradient(135deg, #a855f7, #6b21a8)",
    },
    {
      label: "Chờ làm",
      value: stats.todo,
      split: `(${stats.todoP} Cá nhân, ${stats.todoG} Nhóm)`,
      icon: "⭕",
      textColor: "#64748b",
      bg: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
    },
    {
      label: "Đang làm",
      value: stats.doing,
      split: `(${stats.doingP} Cá nhân, ${stats.doingG} Nhóm)`,
      icon: "🔵",
      textColor: "#fff",
      bg: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    },
    {
      label: "Hoàn thành",
      value: stats.done,
      split: `(${stats.doneP} Cá nhân, ${stats.doneG} Nhóm)`,
      icon: "✅",
      textColor: "#fff",
      bg: "linear-gradient(135deg, #10b981, #047857)",
    },
  ];

  const getFilterCount = (key) => {
    if (key === "personal") return stats.totalP;
    if (key === "group") return stats.totalG;
    if (key === "done") return stats.done;
    if (key === "overdue") return stats.overdue;
    return "";
  };

  return (
    <div className="page home-page-wrap">
      <div className="home-hero">
        <div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>
            Xin chào, {user?.name?.split(" ").pop()} 👋
          </h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Bạn có{" "}
            <strong style={{ color: stats.overdue > 0 ? "#dc2626" : "#4f46e5" }}>
              {stats.overdue > 0 ? `${stats.overdue} task quá hạn` : `${stats.todo} task cần làm`}
            </strong>{" "}
            hôm nay
          </p>
        </div>

        <button
          onClick={() => {
            setEditTask(null);
            setShowModal(true);
          }}
          className="btn btn-primary home-create-btn"
        >
          ➕ Tạo task mới
        </button>
      </div>

      <div className="stat-grid">
        {STAT_CARDS.map((s) => (
          <button
            key={s.label}
            type="button"
            className="card card-elevated home-kpi-card"
            style={{ background: s.bg, color: s.textColor }}
            onClick={() => {
              const map = {
                "Tổng Task": "all",
                "Chờ làm": "todo",
                "Đang làm": "in_progress",
                "Hoàn thành": "done",
              };
              if (map[s.label]) setFilter(map[s.label]);
            }}
          >
            <div className="home-kpi-icon">{s.icon}</div>
            <div className="home-kpi-value">{s.value}</div>
            <div
              className="home-kpi-label"
              style={{ color: s.textColor === "#fff" ? "rgba(255,255,255,.92)" : "#334155" }}
            >
              {s.label}
            </div>
            <div
              className="home-kpi-split"
              style={{ color: s.textColor === "#fff" ? "rgba(255,255,255,.75)" : "#64748b" }}
            >
              {s.split}
            </div>
          </button>
        ))}
      </div>

      {stats.overdue > 0 && (
        <div className="home-overdue-warning">
          <span style={{ fontSize: 20 }}>⚠</span>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            Bạn có <strong>{stats.overdue} task quá hạn!</strong>{" "}
            <button onClick={() => setFilter("overdue")} className="home-link-btn">
              Xem ngay
            </button>
          </p>
        </div>
      )}

      <div className="home-toolbar">
        <div style={{ flex: 1, minWidth: 260, position: "relative" }} ref={searchRef}>
          <div className="search-wrap" style={{ marginBottom: 0 }}>
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="search"
              placeholder="Tìm kiếm task..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions home-suggestion-panel">
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
                  {s.priority === "high" && (
                    <span className="badge badge-high" style={{ marginLeft: "auto" }}>
                      Cao
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="home-sort-wrap">
          <span className="home-sort-label">Sắp xếp:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="home-sort-select"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-tabs" style={{ marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.icon} {f.label}
            {f.key !== "all" && <span className="home-filter-count">{getFilterCount(f.key)}</span>}
          </button>
        ))}
      </div>

      <div className="home-list-panel">
        {loading ? (
          <SkeletonList />
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">{search ? "🔍" : filter === "done" ? "🏆" : "📭"}</span>
            <h3>
              {search
                ? "Không tìm thấy task phù hợp"
                : filter === "done"
                ? "Chưa có task nào hoàn thành"
                : "Bạn chưa có task cá nhân hoặc nhóm"}
            </h3>
            <p>
              {search
                ? `Không có task nào chứa "${search}"`
                : filter === "all"
                ? "Tạo task đầu tiên của bạn để bắt đầu!"
                : "Không có task nào trong danh mục này"}
            </p>
            {filter === "all" && !search && (
              <button
                onClick={() => {
                  setEditTask(null);
                  setShowModal(true);
                }}
                className="btn btn-primary"
              >
                ➕ Tạo task đầu tiên
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="home-result-text">
              Hiển thị {displayed.length} / {tasks.length} task
            </p>
            <TaskBoard 
               tasks={displayed}
               currentUserId={user?._id}
               onStatusChange={handleStatusChange}
               onEdit={(t) => {
                 setEditTask(t);
                 setShowModal(true);
               }}
               onDelete={handleDelete}
               onToggle={handleToggle}
            />
          </>
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => {
            setShowModal(false);
            setEditTask(null);
          }}
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