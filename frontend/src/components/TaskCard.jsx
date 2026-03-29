import { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const STATUS_META = {
  todo: { label: "Chờ làm", cls: "bg-slate-100 text-slate-600", icon: "⭕", next: "▶ Bắt đầu" },
  in_progress: { label: "Đang làm", cls: "bg-blue-50 text-blue-600 border-blue-200", icon: "🔵", next: "✓ Xong" },
  done: { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: "✅", next: "↩ Mở lại" },
};

const PRIORITY_META = {
  low: { label: "Thấp", bg: "#10b981" },
  medium: { label: "TB", bg: "#f59e0b" },
  high: { label: "Cao", bg: "#ef4444" },
};

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const { user } = useAuth();
  const currentUserId = user?._id;
  const [toggling, setToggling] = useState(false);

  // Mở khóa: Owner, Admin, Assignee đều có thể toggle
  const isOwner = task.createdBy?._id === currentUserId;
  const isAssigned = task.assignedTo?.some((u) => u._id === currentUserId);
  const canToggle = isOwner || isAssigned;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  const sm = STATUS_META[task.status] || STATUS_META.todo;
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const isDone = task.status === "done";
  const isGroupTask = task.type === "group";

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (toggling) return;
    setToggling(true);
    try {
      const res = await api.patch(`/tasks/${task._id}/toggle`);
      onToggle(res.data.data);
      const s = res.data.data.status;
      toast.success(
        s === "done" ? "✅ Đã đánh dấu hoàn thành!" :
          s === "in_progress" ? "▶ Đã bắt đầu làm" : "↩ Đã mở lại task"
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Bạn không có quyền mở lại task này!");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Xóa task này?")) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      onDelete(task._id);
      toast.success("Đã xóa task");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi xóa");
    }
  };

  return (
    <div
      className={`group relative bg-white rounded-xl border p-3 shadow-sm hover:shadow transition-all duration-200 flex flex-col gap-2 
        ${isOverdue ? "border-red-300 bg-red-50/30" : "border-slate-200"}
        ${isDone ? "opacity-60 grayscale-[0.3]" : "opacity-100"}
      `}
      style={{ borderLeftWidth: 4, borderLeftColor: isOverdue ? "#ef4444" : pm.bg }}
    >
      {/* --- ROW 1: Badges & Type --- */}
      <div className="flex justify-between items-center w-full">
         <div className="flex gap-1.5 items-center">
            {isGroupTask ? (
               <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 tracking-wider uppercase">Nhóm</span>
            ) : (
               <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 tracking-wider uppercase">Cá nhân</span>
            )}
            {isOverdue && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 tracking-wider uppercase">Quá hạn</span>}
         </div>

         <div className="flex gap-1">
            {isOwner && (
               <>
                 <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(task); }} className="text-slate-400 hover:text-indigo-600 transition-colors p-1" title="Sửa">✏</button>
                 <button onClick={handleDelete} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Xóa">🗑</button>
               </>
            )}
         </div>
      </div>

      {/* --- ROW 2: Title & Desc --- */}
      <div>
         <h4 className={`text-sm font-semibold leading-snug break-words ${isDone ? "line-through text-slate-500" : "text-slate-800"}`}>
            {task.title}
         </h4>
         {task.description && (
            <p className="text-xs text-slate-500 truncate mt-1">{task.description}</p>
         )}
      </div>

      {/* --- ROW 3: Meta & Assignees (Compact Footer) --- */}
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100">
         <div className="flex items-center gap-2">
            {/* Toggle Button */}
            {canToggle && (
               <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm border transition-colors
                     ${isDone ? "bg-white border-slate-200 text-slate-500 hover:bg-slate-50" : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"}
                  `}
               >
                  {toggling ? "⏳" : sm.next}
               </button>
            )}

            {/* Trạng thái hiện tại */}
            {!canToggle && (
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sm.cls}`}>
                  {sm.label}
               </span>
            )}
         </div>

         {/* Assignees Avatars */}
         {task.assignedTo?.length > 0 && (
            <div className="flex -space-x-1.5 justify-end">
               {task.assignedTo.slice(0, 3).map((u) => {
                  const url = u._id === currentUserId ? user?.avatar : u.avatar;
                  return (
                     <div key={u._id} className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm overflow-hidden" style={{ background: `hsl(${hashCode(u.name) % 360},60%,55%)` }} title={u.name}>
                        {url ? <img src={url.startsWith('http') ? url : `http://localhost:5000${url}`} className="w-full h-full object-cover"/> : u.name?.charAt(0)?.toUpperCase()}
                     </div>
                  )
               })}
               {task.assignedTo.length > 3 && (
                  <div className="w-6 h-6 rounded-full border border-white bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold shadow-sm">
                     +{task.assignedTo.length - 3}
                  </div>
               )}
            </div>
         )}
      </div>

      {/* Group Name Mini tooltip */}
      {isGroupTask && task.group?.name && (
         <div className="absolute top-0 right-0 max-w-[100px] bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity truncate shadow">
            {task.group.name}
         </div>
      )}
    </div>
  );
}

function hashCode(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}