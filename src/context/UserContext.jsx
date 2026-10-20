//src/context/UseContext.jsx

import { useCallback, useEffect, useState } from "react";
import { UserContext } from "./user-context.js";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

export function UserProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("course_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const api = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && path !== "/auth/login") {
        localStorage.removeItem("course_token");
        setToken(null);
        setUser(null);
      }
      throw new Error(data.message || `Request failed (${response.status}).`);
    }
    return data;
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    if (!token) return;
    fetch(`${API_URL}/api/user`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session expired");
        return response.json();
      })
      .then((data) => { if (!cancelled) setUser(data.user); })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem("course_token");
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  async function login(identifier, password) {
    const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) });
    localStorage.setItem("course_token", data.token);
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
  }

  function logout() {
    localStorage.removeItem("course_token");
    setToken(null);
    setUser(null);
  }

  return <UserContext.Provider value={{ user, token, loading: loading && !!token, api, login, logout }}>{children}</UserContext.Provider>;
}
