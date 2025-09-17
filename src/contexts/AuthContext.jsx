// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Create context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null means not logged in
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on initial render
  useEffect(() => {
    const savedUser = localStorage.getItem("medilink_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Login function (normal user)
  const login = useCallback(async ({ email, role = "user", name = "John Doe" }) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((res) => setTimeout(res, 500));

      const loggedUser = { name, email, role };
      setUser(loggedUser);
      localStorage.setItem("medilink_user", JSON.stringify(loggedUser));
    } finally {
      setLoading(false);
    }
  }, []);

  // Guest login
  const guestLogin = useCallback(() => {
    const guestUser = { name: "Guest", email: "guest@demo.com", role: "guest" };
    setUser(guestUser);
    localStorage.setItem("medilink_user", JSON.stringify(guestUser));
  }, []);

  // Logout
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
      {/* Show children only when loading is false */}
      {!loading ? (
        children
      ) : (
        <div className="flex items-center justify-center h-screen text-sky-600 font-semibold animate-pulse">
          Loading...
        </div>
      )}
    </AuthContext.Provider>
  );
};
