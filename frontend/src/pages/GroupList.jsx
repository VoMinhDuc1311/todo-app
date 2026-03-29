import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../api/axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function GroupList() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [form, setForm] = useState({ name: "", description: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/groups");
      setGroups(res.data.data);
    } catch {
      toast.error("Lỗi tải danh sách nhóm");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Vui lòng chọn ảnh nhỏ hơn 5MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ name: "", description: "" });
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Vui lòng nhập tên nhóm");

    setCreating(true);
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      const res = await api.post("/groups", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setGroups((g) => [res.data.data, ...g]);
      closeModal();
      toast.success("✅ Tạo nhóm thành công!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi tạo nhóm");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa nhóm "${name}"? Tất cả task cũng sẽ bị xóa vĩnh viễn.`)) return;
    try {
      await api.delete(`/groups/${id}`);
      setGroups((g) => g.filter((gr) => gr._id !== id));
      toast.success("Đã xóa nhóm thành công");
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi xóa nhóm");
    }
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            👥 Nhóm của tôi
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {groups.length > 0
              ? `Bạn đang tham gia ${groups.length} nhóm dự án`
              : "Tạo nhóm mới để bắt đầu quản lý công việc và cộng tác"}
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="mt-4 md:mt-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 text-sm"
        >
          ➕ Tạo nhóm mới
        </button>
      </div>

      {loading ? (
        <GroupSkeleton />
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm text-center">
          <span className="text-6xl mb-4 opacity-50">🪴</span>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có nhóm nào</h3>
          <p className="text-slate-500 mb-6 max-w-sm">Hãy khởi tạo nhóm làm việc đầu tiên của bạn để kết nối và chia sẻ công việc với mọi người.</p>
          <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2 px-5 rounded-xl shadow-md transition-transform hover:scale-105">
            Tạo nhóm đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groups.map((group) => {
            const isOwner = group.owner?._id === user?._id;

            return (
              <div 
                key={group._id} 
                className="relative bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group/card cursor-pointer" 
                onClick={() => navigate(`/groups/${group._id}`)}
              >
                {/* Banner */}
                <div className="h-28 bg-gradient-to-tr from-indigo-500/80 to-purple-600/80 p-4 flex items-start justify-end">
                   {isOwner && <span className="bg-white/90 text-amber-600 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm tracking-wide">👑 LEADER</span>}
                </div>
                
                {/* Card Body */}
                <div className="px-5 pb-5 pt-0 flex-1 flex flex-col items-center -mt-10 relative">
                   {/* Group Avatar */}
                   <div className="w-[72px] h-[72px] rounded-full border-4 border-white bg-slate-50 shadow-md flex items-center justify-center overflow-hidden z-10 transition-transform duration-300 group-hover/card:scale-110">
                      {group.avatar ? (
                        <img 
                          src={getFullUrl(group.avatar)} 
                          alt={group.name} 
                          className="w-full h-full object-cover" 
                          loading="lazy" 
                          onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerHTML = '👥'; }} 
                        />
                      ) : (
                        <span className="text-3xl">👥</span>
                      )}
                   </div>

                   <h3 className="text-lg font-bold text-slate-800 mt-3 text-center line-clamp-1">{group.name}</h3>
                   <p className="text-xs font-medium text-slate-500 text-center line-clamp-2 mt-1.5 h-8">
                      {group.description || "Chưa có mô tả cho nhóm này."}
                   </p>

                   {/* Footer Info */}
                   <div className="mt-5 w-full flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex -space-x-2">
                        {group.members?.slice(0, 4).map((m) => {
                          const url = m.user?._id === user?._id ? user?.avatar : m.user?.avatar;
                          return (
                          <div 
                            key={m.user?._id} 
                            className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm overflow-hidden" 
                            title={m.user?.name}
                          >
                            {url ? ( 
                              <img src={getFullUrl(url)} alt="avt" className="w-full h-full object-cover" /> 
                            ) : ( 
                              m.user?.name?.charAt(0)?.toUpperCase() 
                            )}
                          </div>
                        )})}
                        {group.members?.length > 4 && (
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold shadow-sm">
                            +{group.members.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{group.members?.length || 0} thành viên</span>
                   </div>
                </div>

                {isOwner && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(group._id, group.name); }} 
                    className="absolute bottom-4 right-4 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors z-20 opacity-0 group-hover/card:opacity-100" 
                    title="Xóa nhóm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">✨ Khởi tạo nhóm</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm border border-slate-100 w-8 h-8 flex items-center justify-center rounded-full transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6">
              
              <div className="flex flex-col items-center mb-6">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-24 h-24 rounded-full border-2 border-dashed border-indigo-300 bg-indigo-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors overflow-hidden relative group"
                 >
                    {avatarPreview ? (
                       <img src={avatarPreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                       <>
                         <span className="text-2xl mb-1">📷</span>
                         <span className="text-[10px] font-semibold text-indigo-500 text-center px-2">Ảnh đại diện</span>
                       </>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-white text-xs font-semibold">Tải lên</span>
                    </div>
                 </div>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên nhóm <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Frontend Team, Kế hoạch 2024..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-700 placeholder:font-normal"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mô tả (tùy chọn)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mục tiêu hoặc lưu ý của nhóm..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-700 placeholder:font-normal resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={creating} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:scale-100 flex items-center justify-center min-w-[120px]">
                  {creating ? <span className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "Tạo nhóm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden h-64 flex flex-col">
          <div className="h-28 bg-slate-200 animate-pulse"></div>
          <div className="px-5 flex-1 flex flex-col items-center -mt-10">
            <div className="w-[72px] h-[72px] rounded-full border-4 border-white bg-slate-300 animate-pulse mb-3"></div>
            <div className="w-32 h-5 bg-slate-200 rounded-md animate-pulse mb-2"></div>
            <div className="w-48 h-4 bg-slate-100 rounded-md animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}