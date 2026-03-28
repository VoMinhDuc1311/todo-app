import { useState, useEffect } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

const EMPTY = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  dueDate: "",
  assignedTo: [],
};

export default function TaskModal({ onClose, onSaved, task = null, groupId = null, members = [] }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title:       task.title       || "",
        description: task.description || "",
        priority:    task.priority    || "medium",
        status:      task.status      || "todo",
        dueDate:     task.dueDate ? task.dueDate.slice(0, 10) : "",
        assignedTo:  task.assignedTo?.map((u) => u._id) || [],
      });
    }
  }, [task]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const toggleAssign = (userId) => {
    setForm((f) => {
      const already = f.assignedTo.includes(userId);
      return {
        ...f,
        assignedTo: already
          ? f.assignedTo.filter((id) => id !== userId)
          : [...f.assignedTo, userId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Vui lòng nhập tiêu đề");

    setLoading(true);
    try {
      let res;
      if (task) {
        res = await api.put(`/tasks/${task._id}`, form);
        toast.success("✅ Đã cập nhật task");
      } else if (groupId) {
        res = await api.post(`/tasks/group/${groupId}`, form);
        toast.success("✅ Đã thêm task nhóm");
      } else {
        res = await api.post("/tasks/personal", form);
        toast.success("✅ Đã thêm task");
      }
      onSaved(res.data.data);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi lưu task");
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: "low",    label: "🟢 Thấp",       color: "#10b981" },
    { value: "medium", label: "🟡 Trung bình",  color: "#f59e0b" },
    { value: "high",   label: "🔴 Cao",         color: "#ef4444" },
  ];

  const statusOptions = [
    { value: "todo",        label: "⭕ Chờ làm"     },
    { value: "in_progress", label: "🔵 Đang làm"    },
    { value: "done",        label: "✅ Hoàn thành"  },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>
              {task ? "✏ Chỉnh sửa Task" : groupId ? "👥 Thêm Task Nhóm" : "➕ Tạo Task Mới"}
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {task ? "Cập nhật thông tin task" : "Điền thông tin task bên dưới"}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label>Tiêu đề *</label>
            <input
              name="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Nhập tiêu đề task..."
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              name="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mô tả chi tiết về task này..."
              rows={3}
            />
          </div>

          {/* Priority & Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label>Ưu tiên</label>
              <div style={styles.optionRow}>
                {priorityOptions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set("priority", p.value)}
                    style={{
                      ...styles.optionBtn,
                      background: form.priority === p.value ? p.color + "22" : "transparent",
                      border: `1.5px solid ${form.priority === p.value ? p.color : "#e2e8f0"}`,
                      color: form.priority === p.value ? p.color : "#64748b",
                      fontWeight: form.priority === p.value ? 700 : 500,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Trạng thái</label>
              <select
                name="status"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label>📅 Hạn hoàn thành</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </div>

          {/* Assign members (group tasks only) */}
          {groupId && members.length > 0 && (
            <div className="form-group">
              <label>👥 Giao cho thành viên</label>
              <div style={styles.memberList}>
                {members.map((m) => {
                  const selected = form.assignedTo.includes(m.user._id);
                  return (
                    <div
                      key={m.user._id}
                      onClick={() => toggleAssign(m.user._id)}
                      style={{
                        ...styles.memberItem,
                        background: selected ? "#eef2ff" : "#f8fafc",
                        border: `1.5px solid ${selected ? "#6366f1" : "#e2e8f0"}`,
                      }}
                    >
                      <div
                        className="avatar avatar-sm"
                        style={{ background: selected ? "#6366f1" : "#94a3b8" }}
                      >
                        {m.user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>{m.user.name}</p>
                        <p style={{ fontSize: 11, color: "#94a3b8" }}>{m.user.email}</p>
                      </div>
                      {selected && <span style={{ color: "#6366f1", fontSize: 16 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
              {form.assignedTo.length > 0 && (
                <p style={{ fontSize: 12, color: "#6366f1", marginTop: 6, fontWeight: 600 }}>
                  Đã chọn {form.assignedTo.length} người
                </p>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? (
                <><span className="spinner" /> Đang lưu...</>
              ) : (
                task ? "💾 Cập nhật" : "➕ Tạo task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  optionRow: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  optionBtn: {
    padding: "7px 10px",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    transition: "all .15s",
    textAlign: "left",
    fontFamily: "inherit",
  },
  memberList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: 200,
    overflowY: "auto",
    padding: "2px 0",
  },
  memberItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    transition: "all .15s",
  },
};
