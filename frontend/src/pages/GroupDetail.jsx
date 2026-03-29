import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import UserSearchInput from "../components/UserSearchInput";
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [addingMember, setAddingMember] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
      toast.error(e.response?.data?.message || "Error loading group");
      navigate("/groups");
    } finally {
      setLoading(false);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
  };

  // Permission Logic
  const memberRecord = group?.members?.find(m => m.user?._id === user?._id);
  const isOwner = group?.owner?._id === user?._id;
  const isLeader = memberRecord && (memberRecord.role === "leader" || memberRecord.role === "admin");
  const canEditAvatar = isOwner || isLeader;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Chỉ chấp nhận file ảnh");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Ảnh tối đa 5MB");
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await api.put(`/groups/${id}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setGroup(res.data.data);
      toast.success("Cập nhật ảnh nhóm thành công!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật ảnh");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return toast.warn("Chọn user để mời");
    setAddingMember(true);
    try {
      await api.post(`/invites`, { groupId: id, receiverId: selectedUser._id });
      setSelectedUser(null);
      toast.success("Đã gửi lời mời thành công.");
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi gửi lời mời");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Xóa thành viên này khỏi nhóm?")) return;
    try {
      const res = await api.delete(`/groups/${id}/members/${memberId}`);
      setGroup(res.data.data);
      toast.success("Đã xóa thành viên.");
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-screen pb-20">
      <button 
        onClick={() => navigate("/groups")} 
        className="mb-6 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/40 shadow-sm inline-flex items-center gap-2 outline-none"
      >
        ← Back to groups
      </button>

      {/* ── HERO HEADER ── */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 overflow-hidden mb-8 animate-fade-in">
        {/* Large Gradient Banner */}
        <div className="h-40 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <div className="px-6 pb-6 relative flex flex-col sm:flex-row gap-6 sm:items-end -mt-16">
          {/* Group Avatar overlapping banner */}
          <div className="relative group/avatar inline-block w-28 h-28 sm:w-32 sm:h-32 shrink-0">
            <div className={`w-full h-full rounded-2xl border-4 border-white shadow-md bg-white flex items-center justify-center overflow-hidden text-4xl font-bold text-gray-300 ${uploadingAvatar ? "opacity-50" : ""}`}>
               {group?.avatar ? ( 
                 <img src={getFullUrl(group.avatar)} alt={group.name} className="w-full h-full object-cover" /> 
               ) : ( 
                 group?.name?.charAt(0).toUpperCase()
               )}
            </div>
            
            {/* Edit overlay on hover */}
            {canEditAvatar && (
              <div 
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-[2px]"
              >
                 <span className="text-white text-sm font-medium tracking-wide">Change</span>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>

          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{group?.name}</h1>
            <p className="text-gray-500 text-sm mt-1.5 font-medium">{group?.members?.length || 0} members</p>
            {group?.description && <p className="text-gray-600 text-sm mt-3 leading-relaxed max-w-2xl">{group.description}</p>}
          </div>

          <div className="pb-2 w-full sm:w-auto mt-4 sm:mt-0">
            {canEditAvatar && (
               <button 
                 onClick={() => { setEditTask(null); setShowTaskModal(true); }} 
                 className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl hover:scale-105 transition-all shadow-md font-semibold text-sm outline-none"
               >
                 Add Task
               </button>
            )}
          </div>
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      {tasks.length > 0 && (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-sm border border-white/40 p-6 mb-8 flex flex-col gap-3 animate-fade-in relative overflow-hidden z-10 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-end px-1 relative z-10">
            <span className="text-sm font-bold text-gray-600 uppercase tracking-wider text-[11px]">Tiến độ {isLeader || isOwner ? "dự án" : "cá nhân"}</span>
            <span className="text-lg font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]">{completionRate}%</span>
          </div>
          <div className="w-full bg-slate-200/50 rounded-full h-3 overflow-hidden flex relative z-10">
            <div
              className="h-full transition-all duration-1000 ease-out bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="flex gap-4 mb-6 border-b border-gray-200/50 pb-4 overflow-x-auto no-scrollbar">
        {[
          { key: "tasks",   label: `Tasks (${tasks.length})` },
          { key: "members", label: `Members (${group?.members?.length || 0})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-semibold px-5 py-2 rounded-xl transition-colors text-sm whitespace-nowrap outline-none
              ${tab === t.key 
                ? "bg-white shadow-sm border border-white/50 text-gray-900" 
                : "text-gray-500 hover:text-gray-900 hover:bg-white/40"}
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="transition-all duration-300">
        {/* ── TASKS TAB ── */}
        {tab === "tasks" && (
          <div className="flex flex-col gap-6 animate-fade-in">
             <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: `All` },
                  { key: "todo", label: `To Do` },
                  { key: "in_progress", label: `In Progress` },
                  { key: "done", label: `Done` },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilterStatus(f.key)}
                    className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all shadow-sm outline-none
                      ${filterStatus === f.key 
                        ? "bg-indigo-600 text-white border border-indigo-600"
                        : "bg-white/60 text-gray-600 border border-white hover:bg-white hover:text-gray-900"}
                    `}
                  >
                    {f.label}
                  </button>
                ))}
             </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-2xl border border-white flex justify-center items-center shadow-sm">
                <p className="text-gray-400 text-sm font-medium">No tasks found.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    currentUserId={user?._id}
                    onToggle={handleToggle}
                    onEdit={(t) => { setEditTask(t); setShowTaskModal(true); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {tab === "members" && (
          <div className="flex flex-col gap-6 animate-fade-in relative">
            {canEditAvatar && (
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 p-6 relative z-10 overflow-visible">
                <h3 className="text-lg font-bold text-gray-900 mb-4 tracking-tight">Add new member</h3>
                <form onSubmit={handleInviteUser} className="flex flex-col sm:flex-row gap-4 items-start w-full relative">
                  <div className="flex-1 w-full relative z-[100]">
                    <UserSearchInput
                      groupId={id}
                      selectedUser={selectedUser}
                      onSelectUser={setSelectedUser}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={addingMember || !selectedUser} 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-105 text-white font-semibold h-[46px] px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:hover:scale-100 min-w-[120px] shrink-0 text-sm outline-none"
                  >
                    {addingMember ? "Sending..." : "Invite"}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 overflow-hidden relative z-0">
               <div className="p-6 border-b border-white/40">
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">Team members</h3>
               </div>
               <div className="flex flex-col">
                  {group?.members?.map((m) => {
                     const isCurrUser = m.user?._id === user?._id;
                     const isLeaderRole = m.role === "leader" || m.role === "admin";
                     const activeAvatar = isCurrUser ? user?.avatar : m.user?.avatar;
                     return (
                        <div key={m.user?._id} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100/50 last:border-0 hover:bg-white/60 transition-colors group">
                           {/* Clean Avatar */}
                           <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-100 shadow-sm flex items-center justify-center text-gray-500 font-bold overflow-hidden shrink-0 text-lg">
                              {activeAvatar ? <img src={getFullUrl(activeAvatar)} className="w-full h-full object-cover" /> : m.user?.name?.charAt(0).toUpperCase()}
                           </div>
                           
                           {/* Basic Information */}
                           <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                 {m.user?.name}
                                 {isCurrUser && <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md">You</span>}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 truncate">{m.user?.email}</div>
                           </div>
                           
                           {/* Roles & Quick Actions */}
                           <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${isLeaderRole ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-gray-600 border-gray-200 shadow-sm"}`}>
                                 {isLeaderRole ? "Leader" : "Member"}
                              </span>
                              
                              {canEditAvatar && !isLeaderRole && (
                                 <button 
                                   onClick={() => handleRemoveMember(m.user._id)} 
                                   className="text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-all opacity-0 group-hover:opacity-100 font-semibold outline-none"
                                 >
                                   Remove
                                 </button>
                              )}
                           </div>
                        </div>
                     )
                  })}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlapping Modals */}
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
