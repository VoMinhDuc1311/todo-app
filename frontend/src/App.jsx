import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import GroupList from "./pages/GroupList";
import GroupDetail from "./pages/GroupDetail";
import AdminPage from "./pages/AdminPage";
import Navbar from "./components/Navbar";

// Route cần đăng nhập
function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

// Route chỉ Admin
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { token } = useAuth();
  return (
    <>
      {token && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to="/" />} />

        {/* Private */}
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/groups" element={<PrivateRoute><GroupList /></PrivateRoute>} />
        <Route path="/groups/:id" element={<PrivateRoute><GroupDetail /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 min-h-screen">
          <h1 className="text-2xl font-bold mb-4">CRASH DETECTED</h1>
          <pre className="bg-red-100 p-4 rounded text-sm overflow-auto mb-4">{this.state.error && this.state.error.toString()}</pre>
          <pre className="bg-red-100 p-4 rounded text-xs overflow-auto">{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-100 min-h-screen text-gray-800 font-sans">
          <BrowserRouter>
            <AppRoutes />
            <ToastContainer position="bottom-right" autoClose={2500} hideProgressBar />
          </BrowserRouter>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
