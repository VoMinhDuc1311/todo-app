import { createContext, useContext, useReducer, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  loading: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "LOGIN_SUCCESS":
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
    case "LOGOUT":
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return { user: null, token: null, loading: false };
    case "UPDATE_USER":
      localStorage.setItem("user", JSON.stringify(action.payload));
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verify token khi load app
  useEffect(() => {
    if (state.token) {
      api.get("/auth/me")
        .then((res) => dispatch({ type: "UPDATE_USER", payload: res.data.data }))
        .catch(() => dispatch({ type: "LOGOUT" }));
    }
  }, []);

  const login = async (email, password) => {
    dispatch({ type: "SET_LOADING", payload: true });
    const res = await api.post("/auth/login", { email, password });
    dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
    return res.data;
  };

  const register = async (name, email, password) => {
    dispatch({ type: "SET_LOADING", payload: true });
    const res = await api.post("/auth/register", { name, email, password });
    dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
    return res.data;
  };

  const logout = () => dispatch({ type: "LOGOUT" });

  const updateUser = (userData) => {
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
