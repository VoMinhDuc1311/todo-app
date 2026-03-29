import { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

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

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const { user } = useAuth();
  const currentUserId = user?._id;
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

// No need for all these styles, moving some to inline styles where appropriate or keeping simple
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-5 mb-3 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 relative overflow-hidden"
      style={{
        opacity: isDone ? 0.7 : 1,
        borderLeft: isOverdue ? "none" : `4px solid ${pm.color}`,
        border: isOverdue ? "2px solid #ef4444" : "1px solid #e2e8f0",
        background: isOverdue ? "#fff7f7" : "#fff",
      }}
    >
      {/* TOP ROW */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p
             className={`font-bold text-base leading-snug mb-2 ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}
          >
            {task.title}
          </p>

          {/* Creator & Group */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm overflow-hidden shrink-0" 
              style={{ background: `hsl(${hashCode(task.createdBy?.name) % 360},60%,55%)` }} 
              title="Người tạo"
            >
              {(() => {
                const url = task.createdBy?._id === currentUserId ? user?.avatar : task.createdBy?.avatar;
                return url ? <img src={url.startsWith('http') ? url : `http://localhost:5000${url}`} className="w-full h-full object-cover"/> : task.createdBy?.name?.charAt(0)?.toUpperCase();
              })()}
            </div>
            <span>{task.createdBy?.name}</span>
            {task.group?.name && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-indigo-500 truncate" title="Tên nhóm">👥 {task.group.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
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

      {/* DESCRIPTION */}
      {task.description && (
        <div className="mt-1">
          <p
            className="text-sm text-slate-500 leading-relaxed"
            style={{
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: expanded ? 99 : 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {task.description}
          </p>
          {task.description.length > 100 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-1 outline-none"
            >
              {expanded ? "Thu gọn ▲" : "Xem thêm ▼"}
            </button>
          )}
        </div>
      )}

      {/* META ROW */}
      <div className="flex items-center flex-wrap gap-3 mt-2">
        {/* Due date */}
        {task.dueDate && (
          <span
            className={`text-xs flex items-center gap-1.5 ${isOverdue ? "text-red-500 font-bold" : "text-slate-500 font-medium"}`}
          >
            📅 {new Date(task.dueDate).toLocaleDateString("vi-VN")}
            {isOverdue && " • Quá hạn"}
          </span>
        )}

        {/* Assigned avatars */}
        {task.assignedTo?.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignedTo.slice(0, 4).map((u) => {
              const url = u._id === currentUserId ? user?.avatar : u.avatar;
              return (
              <div
                key={u._id}
                className="w-6 h-6 rounded-full border-[1.5px] border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm overflow-hidden"
                style={{ background: `hsl(${hashCode(u.name) % 360},60%,55%)` }}
                title={u.name}
              >
                {url ? <img src={url.startsWith('http') ? url : `http://localhost:5000${url}`} className="w-full h-full object-cover"/> : u.name?.charAt(0)?.toUpperCase()}
              </div>
            )})}
            {task.assignedTo.length > 4 && (
              <div className="w-6 h-6 rounded-full border-[1.5px] border-white bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold shadow-sm">
                +{task.assignedTo.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-2 mt-3.5">
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