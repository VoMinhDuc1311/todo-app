import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import AvatarUpload from "./AvatarUpload";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/40 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group outline-none" style={{ textDecoration: 'none' }}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2h-11zm1.75 5h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5zm0 3h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5zm0 3h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5z"/>
            </svg>
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight ml-1">
            TaskFlow
          </span>
        </Link>

        {/* NAV LINKS */}
        <div className="hidden md:flex items-center gap-1 flex-1 ml-10">
          <NavLink to="/" label="Dashboard" active={isActive("/")} />
          <NavLink to="/groups" label="Groups" active={isActive("/groups")} />
          {user?.role === "admin" && (
            <NavLink to="/admin" label="Admin" active={isActive("/admin")} isAdmin />
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 ml-auto">
          <NotificationBell />

          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          {/* User Menu Dropdown */}
          <div className="relative isolate" ref={menuRef}>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 p-1 pr-3 rounded-full hover:bg-slate-100 transition-colors outline-none cursor-pointer"
            >
               <AvatarUpload 
                  defaultAvatar={user?.avatar} 
                  size="sm" 
                  editable={false} 
               />
              <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.name}</span>
            </button>

            {/* Dropdown Content */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-[999]">
                 <div className="p-5 border-b border-slate-100 flex flex-col items-center text-center">
                    <AvatarUpload 
                        defaultAvatar={user?.avatar} 
                        size="md" 
                        onUploadSuccess={(url) => updateUser({ ...user, avatar: url })}
                    />
                    <div className="mt-3 font-semibold text-gray-900 text-sm">{user?.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{user?.email}</div>
                 </div>
                 <div className="p-2">
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors active:scale-95 outline-none"
                    >
                      Log out
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, label, active, isAdmin }) {
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors outline-none hover:no-underline
        ${active 
          ? "bg-slate-100 text-gray-900" 
          : isAdmin 
            ? "text-amber-600 hover:bg-amber-50" 
            : "text-gray-500 hover:bg-slate-50 hover:text-gray-900"
        }
      `}
      style={{ textDecoration: 'none' }}
    >
      {label}
    </Link>
  );
}