// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("medilink_user");
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  // ✅ Just set state, don't force navigate
  const login = useCallback(async ({ email, role = "user", name = "John Doe" }) => {
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 500)); // simulate API
      const loggedUser = { name, email, role };
      setUser(loggedUser);
      localStorage.setItem("medilink_user", JSON.stringify(loggedUser));
    } finally {
      setLoading(false);
    }
  }, []);

  const guestLogin = useCallback(() => {
    const guestUser = { name: "Guest", email: "guest@demo.com", role: "guest" };
    setUser(guestUser);
    localStorage.setItem("medilink_user", JSON.stringify(guestUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("medilink_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "public",
        isAuthenticated: !!user,
        loading,
        login,
        guestLogin,
        logout,
      }}
    >
      {!loading ? children : <div className="text-center mt-20">Loading...</div>}
    </AuthContext.Provider>
  );
};
