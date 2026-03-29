import { useState, useRef } from "react";
import api, { BASE_URL } from "../api/axios";
import { toast } from "react-toastify";

export default function AvatarUpload({ defaultAvatar, onUploadSuccess, size = "md", editable = true }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
  };

  const preview = getFullUrl(defaultAvatar);

  const sizes = {
    sm: "w-8 h-8 text-sm",
    md: "w-20 h-20 text-3xl",
    lg: "w-32 h-32 text-5xl",
  };
  const currentSize = sizes[size] || sizes.md;

  const handleFileChange = async (e) => {
    if (!editable) return;
    const file = e.target.files[0];
    if (!file) return;

    // Optional: compress/check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Vui lòng chọn ảnh nhỏ hơn 5MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await api.post("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newAvatarUrl = res.data.avatar;
      toast.success("✅ Cập nhật avatar thành công!");
      if (onUploadSuccess) onUploadSuccess(newAvatarUrl);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật ảnh");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${editable ? "cursor-pointer group" : ""}`}
      onClick={() => editable && fileInputRef.current?.click()}
    >
      <div 
        className={`${currentSize} rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md flex justify-center items-center text-white font-bold transition-transform duration-200 ease-in-out ${editable ? "group-hover:scale-105" : ""}`}
      >
        {preview ? (
          <img 
            src={preview} 
            alt="Avatar" 
            className="w-full h-full object-cover" 
            loading="lazy" 
            onError={(e) => { 
                e.target.onerror = null; 
                e.target.style.display = 'none'; 
                e.target.parentNode.innerHTML = '👤'; 
            }} 
          />
        ) : (
          <span>👤</span>
        )}
      </div>

      {uploading && (
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm transition-all">
          <span className="spinner w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        </div>
      )}

      {/* Hover Overlay */}
      {editable && !uploading && (
         <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-[1px]">
           <span className="text-white text-xs font-medium">📸 Sửa</span>
         </div>
      )}

      {editable && (
         <input 
           type="file" 
           ref={fileInputRef} 
           onChange={handleFileChange} 
           accept="image/*" 
           className="hidden" 
         />
      )}
    </div>
  );
}
