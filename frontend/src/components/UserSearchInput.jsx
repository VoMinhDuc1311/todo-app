import { useState, useEffect, useRef } from "react";
import api from "../api/axios";

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  return (
    <div style={{ position: "relative", flex: 1 }} ref={dropdownRef}>
      <span
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 14,
          pointerEvents: "none",
        }}
      >
        🔍
      </span>
      <input
        value={query}
        onChange={handleChange}
        onFocus={() => {
          if (query.trim() && !selectedUser) setShowDropdown(true);
        }}
        placeholder="Tìm kiếm bằng tên hoặc email..."
        type="text"
        style={{
          width: "100%",
          padding: "10px 14px 10px 36px",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          outline: "none",
          fontSize: 14,
          transition: "border-color 0.2s",
        }}
        onFocusCapture={(e) => {
          e.target.style.borderColor = "#6366f1";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e8f0";
        }}
      />

      {showDropdown && query.trim() && !selectedUser && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
            zIndex: 100,
            overflow: "hidden",
            maxHeight: 280,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {loading ? (
            <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#64748b" }}>
              Đang tìm...
            </div>
          ) : results.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", overflowY: "auto" }}>
              {results.map((u) => (
                <li
                  key={u._id}
                  onClick={() => handleSelect(u)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f1f5f9",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {u.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {u.email}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#64748b" }}>
              Không tìm thấy người dùng
            </div>
          )}
        </div>
      )}
    </div>
  );
}
