import { useState, useEffect, useRef } from "react";
import api, { BASE_URL } from "../api/axios";

export default function UserSearchInput({ groupId, selectedUser, onSelectUser }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // If we have a selected user, the query is just for display, don't search.
    if (selectedUser && query === selectedUser.name) {
      return;
    }

    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      onSelectUser(null);
      return;
    }

    const timer = setTimeout(() => {
      fetchUsers(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, groupId, selectedUser, onSelectUser]);

  const fetchUsers = async (searchTerm) => {
    setLoading(true);
    try {
      const res = await api.get(`/users/search?query=${searchTerm}&groupId=${groupId}`);
      setResults(res.data.data);
      setShowDropdown(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (user) => {
    setQuery(user.name);
    setShowDropdown(false);
    onSelectUser(user);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    if (selectedUser) {
        onSelectUser(null); // Clear selected user if they type again
    }
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
  };

  return (
    <div className="relative w-full z-[100]" ref={dropdownRef}>
      <input
        value={query}
        onChange={handleChange}
        onFocus={() => {
          if (query.trim() && !selectedUser) setShowDropdown(true);
        }}
        placeholder="Search by name or email..."
        type="text"
        className="w-full px-4 py-3 border border-slate-200 bg-white/70 backdrop-blur-md rounded-xl outline-none text-gray-800 transition-all focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 placeholder-gray-400 text-sm shadow-sm"
      />

      {showDropdown && query.trim() && !selectedUser && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-md z-[999] flex flex-col max-h-60 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : results.length > 0 ? (
            <ul className="m-0 p-0 overflow-y-auto">
              {results.map((u) => (
                <li
                  key={u._id}
                  onClick={() => handleSelect(u)}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-slate-50 hover:bg-slate-100 transition-colors last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-gray-600 flex items-center justify-center text-xs font-semibold shrink-0 shadow-sm border border-white overflow-hidden">
                     {u.avatar ? <img src={getFullUrl(u.avatar)} alt={u.name} className="w-full h-full object-cover"/> : u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 truncate">
                      {u.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {u.email}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              Không tìm thấy người dùng
            </div>
          )}
        </div>
      )}
    </div>
  );
}
