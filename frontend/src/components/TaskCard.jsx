import { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";

const STATUS_META = {
  todo: { label: "Chờ làm", cls: "badge-todo", icon: "⭕", next: "▶ Bắt đầu" },
  in_progress: { label: "Đang làm", cls: "badge-progress", icon: "🔵", next: "✓ Hoàn thành" },
  done: { label: "Hoàn thành", cls: "badge-done", icon: "✅", next: "↩ Mở lại" },
};

const PRIORITY_META = {
  low: { label: "Thấp", cls: "badge-low", color: "#10b981" },
  medium: { label: "Trung bình", cls: "badge-medium", color: "#f59e0b" },
  high: { label: "Cao", cls: "badge-high", color: "#ef4444" },
};

export default function TaskCard({ task, onToggle, onEdit, onDelete, currentUserId }) {
  const [toggling, setToggling] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isOwner = task.createdBy?._id === currentUserId;
  const isAssigned = task.assignedTo?.some((u) => u._id === currentUserId);
  const canToggle = isOwner || isAssigned;

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  const sm = STATUS_META[task.status] || STATUS_META.todo;
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const isDone = task.status === "done";
  const isGroupTask = task.type === "group";

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await api.patch(`/tasks/${task._id}/toggle`);
      onToggle(res.data.data);
      const s = res.data.data.status;
      toast.success(
        s === "done" ? "✅ Đã hoàn thành!" :
          s === "in_progress" ? "▶ Bắt đầu làm" : "↩ Đã mở lại"
      );
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi cập nhật");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa task này?")) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      onDelete(task._id);
      toast.success("Đã xóa task");
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi xóa");
    }
  };

  return (
    <div
      style={{
        ...cardStyle,
        opacity: isDone ? 0.7 : 1,
        borderLeft: isOverdue ? "none" : `4px solid ${pm.color}`,
        border: isOverdue ? "2px solid #ef4444" : "1px solid #e2e8f0",
        background: isOverdue ? "#fff7f7" : "#fff",
      }}
    >
      {/* TOP ROW */}
      <div style={styles.top}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <p
            style={{
              fontWeight: 700,
              fontSize: 15,
              textDecoration: isDone ? "line-through" : "none",
              color: isDone ? "#94a3b8" : "#0f172a",
              marginBottom: 4,
              lineHeight: 1.4,
            }}
          >
            {task.title}
          </p>

          {/* Creator & Group */}
          <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <div className="avatar avatar-sm" style={{ width: 22, height: 22, fontSize: 10, background: `hsl(${hashCode(task.createdBy?.name) % 360},60%,55%)` }} data-tooltip="Người tạo">
              {task.createdBy?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span>{task.createdBy?.name}</span>
            {task.group?.name && (
              <>
                <span style={{ color: "#cbd5e1" }}>•</span>
                <span style={{ fontWeight: 600, color: "#475569" }} data-tooltip="Tên nhóm">👥 {task.group.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Badges */}
        <div style={styles.badges}>
          <span className="badge" style={{ background: isGroupTask ? "#f3e8ff" : "#f1f5f9", color: isGroupTask ? "#9333ea" : "#475569" }}>
            {isGroupTask ? "👥 Nhóm" : "👤 Cá nhân"}
          </span>
          <span className={`badge ${sm.cls}`}>
            {sm.icon} {sm.label}
          </span>
          <span className={`badge ${pm.cls}`}>
            {pm.label}
          </span>
          {isOverdue && (
            <span className="badge badge-overdue">⚠ Quá hạn</span>
          )}
        </div>
      </div>

      {/* DESCRIPTION (expandable) */}
      {task.description && (
        <div>
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              margin: "10px 0 0",
              lineHeight: 1.6,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: expanded ? 99 : 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {task.description}
          </p>
          {task.description.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn-ghost"
              style={{ fontSize: 12, padding: "3px 0", marginTop: 2, color: "#6366f1", fontWeight: 600 }}
            >
              {expanded ? "Thu gọn ▲" : "Xem thêm ▼"}
            </button>
          )}
        </div>
      )}

      {/* META ROW */}
      <div style={styles.meta}>
        {/* Due date */}
        {task.dueDate && (
          <span
            style={{
              fontSize: 12,
              color: isOverdue ? "#ef4444" : "#94a3b8",
              fontWeight: isOverdue ? 700 : 400,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            📅 {new Date(task.dueDate).toLocaleDateString("vi-VN")}
            {isOverdue && " • Quá hạn!"}
          </span>
        )}

        {/* Assigned avatars */}
        {task.assignedTo?.length > 0 && (
          <div className="avatar-stack" style={{ marginLeft: task.dueDate ? 12 : 0 }}>
            {task.assignedTo.slice(0, 4).map((u) => (
              <div
                key={u._id}
                className="avatar avatar-sm"
                data-tooltip={u.name}
                style={{ background: `hsl(${hashCode(u.name) % 360},60%,55%)` }}
              >
                {u.name?.charAt(0)?.toUpperCase()}
              </div>
            ))}
            {task.assignedTo.length > 4 && (
              <div className="avatar avatar-sm" style={{ background: "#94a3b8" }}>
                +{task.assignedTo.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div style={styles.actions}>
        {canToggle && (
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`btn btn-sm ${isDone ? "btn-outline" : "btn-success"}`}
          >
            {toggling ? <span className="spinner" /> : sm.next}
          </button>
        )}

        {isOwner && (
          <>
            <button
              onClick={() => onEdit && onEdit(task)}
              className="btn btn-outline btn-sm"
            >
              ✏ Sửa
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger btn-sm"
            >
              🗑
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function hashCode(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

const cardStyle = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  padding: "16px 18px",
  marginBottom: 10,
  boxShadow: "0 1px 4px rgba(0,0,0,.04)",
  transition: "all .2s",
};

const styles = {
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  badges: {
    display: "flex",
    gap: 6,
    flexShrink: 0,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  meta: {
    display: "flex",
    alignItems: "center",
    marginTop: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  actions: {
    display: "flex",
    gap: 8,
    marginTop: 14,
    flexWrap: "wrap",
  },
};