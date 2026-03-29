import { useState, useEffect } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import "../style/TaskModal.css";

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
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        status: task.status || "todo",
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
        assignedTo: task.assignedTo?.map((u) => u._id) || [],
      });
      return;
    }
    setForm(EMPTY);
  }, [task]);

  const setField = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const toggleAssign = (userId) => {
    setForm((f) => {
      const exists = f.assignedTo.includes(userId);
      return {
        ...f,
        assignedTo: exists ? f.assignedTo.filter((id) => id !== userId) : [...f.assignedTo, userId],
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
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lỗi lưu task");
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: "low", label: "🟢 Thấp", colorClass: "is-low" },
    { value: "medium", label: "🟡 Trung bình", colorClass: "is-medium" },
    { value: "high", label: "🔴 Cao", colorClass: "is-high" },
  ];

  const statusOptions = [
    { value: "todo", label: "⭕ Chờ làm" },
    { value: "in_progress", label: "🔵 Đang làm" },
    { value: "done", label: "✅ Hoàn thành" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="task-modal-title">
              {task ? "✏ Chỉnh sửa Task" : groupId ? "👥 Thêm Task Nhóm" : "➕ Tạo Task Mới"}
            </h2>
            <p className="task-modal-subtitle">
              {task ? "Cập nhật thông tin task" : "Điền thông tin task bên dưới"}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tiêu đề *</label>
            <input
              name="title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Nhập tiêu đề task..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              name="description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Mô tả chi tiết về task này..."
              rows={3}
            />
          </div>

          <div className="task-modal-grid">
            <div className="form-group">
              <label>Ưu tiên</label>
              <div className="task-modal-option-row">
                {priorityOptions.map((p) => {
                  const active = form.priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setField("priority", p.value)}
                      className={`task-modal-option-btn ${p.colorClass} ${active ? "active" : ""}`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label>Trạng thái</label>
              <select name="status" value={form.status} onChange={(e) => setField("status", e.target.value)}>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>📅 Hạn hoàn thành</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={(e) => setField("dueDate", e.target.value)}
            />
          </div>

          {groupId && members.length > 0 && (
            <div className="form-group">
              <label>👥 Giao cho thành viên</label>
              <div className="task-modal-member-list">
                {members.map((m) => {
                  const uid = m.user._id;
                  const selected = form.assignedTo.includes(uid);

                  return (
                    <button
                      key={uid}
                      type="button"
                      onClick={() => toggleAssign(uid)}
                      className={`task-modal-member-item ${selected ? "selected" : ""}`}
                    >
                      <div className="avatar avatar-sm task-modal-member-avatar">
                        {m.user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="task-modal-member-meta">
                        <p className="task-modal-member-name">{m.user.name}</p>
                        <p className="task-modal-member-email">{m.user.email}</p>
                      </div>
                      {selected && <span className="task-modal-member-check">✓</span>}
                    </button>
                  );
                })}
              </div>

              {form.assignedTo.length > 0 && (
                <p className="task-modal-selected-text">Đã chọn {form.assignedTo.length} người</p>
              )}
            </div>
          )}

          <div className="task-modal-actions">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? (
                <>
                  <span className="spinner" /> Đang lưu...
                </>
              ) : task ? (
                "💾 Cập nhật"
              ) : (
                "➕ Tạo task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}