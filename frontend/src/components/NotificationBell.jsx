import { useEffect, useState, useRef, useCallback } from "react";
import api from "../api/axios";
import socket from "../config/socket";
import { toast } from "react-toastify";

export default function NotificationBell() {
  const [notis, setNotis] = useState([]);
  const [invites, setInvites] = useState([]);
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Socket listeners ────────────────────────────────────────────────────────
  const handleNewNotification = useCallback((noti) => {
    setNotis((prev) => {
      // Tránh duplicate nếu polling cũng fetch về
      if (prev.find((n) => n._id === noti._id)) return prev;
      return [noti, ...prev];
    });
  }, []);

  const handleNewInvite = useCallback((invite) => {
    setInvites((prev) => {
      if (prev.find((i) => i._id === invite._id)) return prev;
      return [invite, ...prev];
    });
  }, []);

  useEffect(() => {
    socket.on("notification:new", handleNewNotification);
    socket.on("invite:new", handleNewInvite);
    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("invite:new", handleNewInvite);
    };
  }, [handleNewNotification, handleNewInvite]);
  // ────────────────────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    try {
      const [nRes, iRes] = await Promise.all([
        api.get("/notifications").catch(() => ({ data: { data: [] } })),
        api.get("/invites").catch(() => ({ data: { data: [] } })),
      ]);
      setNotis(nRes.data.data || []);
      setInvites(iRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const unreadNotis = notis.filter((n) => !n.isRead).length;
  const unreadCount = unreadNotis + invites.length;

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotis((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    const unreadIds = notis.filter((n) => !n.isRead).map((n) => n._id);
    await Promise.all(unreadIds.map((id) => api.patch(`/notifications/${id}/read`).catch(() => {})));
    setNotis((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleAcceptInvite = async (id) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api.post(`/invites/${id}/accept`);
      setInvites((prev) => prev.filter((i) => i._id !== id));
      toast.success("Đã tham gia nhóm!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi tham gia");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvite = async (id) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api.post(`/invites/${id}/reject`);
      setInvites((prev) => prev.filter((i) => i._id !== id));
      toast.info("Đã từ chối");
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi từ chối");
    } finally {
      setProcessingId(null);
    }
  };

  const combined = [
    ...notis.map((n) => ({ ...n, type: "notification" })),
    ...invites.map((i) => ({ ...i, type: "invite" })),
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return (
    <div className="relative isolate" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:bg-slate-100 rounded-xl transition-all outline-none active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-[999]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <span className="font-semibold text-sm text-gray-800">Thông báo</span>
            {unreadNotis > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors outline-none"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {combined.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-400 font-medium">Bạn đã xem hết thông báo</p>
              </div>
            ) : (
              combined.slice(0, 15).map((item) => {
                if (item.type === "invite") {
                  return (
                    <div
                      key={`inv-${item._id}`}
                      className="p-4 border-b border-slate-50 relative flex gap-3 hover:bg-slate-50 transition-colors cursor-default"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500 absolute left-4 top-5 shrink-0"></div>
                      <div className="flex-1 min-w-0 pl-4">
                        <p className="text-sm text-gray-800 leading-snug">
                          <span className="font-semibold">{item.senderId?.name}</span> mời bạn vào{" "}
                          <span className="font-semibold text-indigo-600">{item.groupId?.name}</span>
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAcceptInvite(item._id)}
                            disabled={processingId === item._id}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors active:scale-95 disabled:opacity-50 flex-1"
                          >
                            Chấp nhận
                          </button>
                          <button
                            onClick={() => handleRejectInvite(item._id)}
                            disabled={processingId === item._id}
                            className="bg-white border border-slate-200 hover:bg-slate-100 text-gray-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors active:scale-95 disabled:opacity-50 flex-1"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={`not-${item._id}`}
                      onClick={() => !item.isRead && markRead(item._id)}
                      className={`p-4 border-b border-slate-50 flex gap-3 cursor-pointer transition-colors ${
                        item.isRead ? "bg-transparent hover:bg-slate-50" : "bg-indigo-50/50 hover:bg-indigo-50"
                      }`}
                    >
                      {!item.isRead && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5"></div>}
                      <p className={`text-sm leading-snug ${item.isRead ? "text-gray-500 pl-4" : "text-gray-800 font-medium pl-1"}`}>
                        {item.message}
                      </p>
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}