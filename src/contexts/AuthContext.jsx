// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ==========================
// Create Auth Context
// ==========================
const AuthContext = createContext();

// ==========================
// Custom Hook
// ==========================
export const useAuth = () => useContext(AuthContext);

// ==========================
// Auth Provider
// ==========================
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // Restore user from localStorage
  // ==========================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("❌ Failed to parse stored user:", err);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // =========================
  // Role-based Redirect Helper
  // =========================
  const getRedirectPath = (role) => {
    switch (role) {
      case "doctor":
        return "/doctor-dashboard";
      case "admin":
      case "hospital":
        return "/hospital-dashboard";
      default:
        return "/dashboard"; // patient or guest
    }
  };

  // =========================
  // Save user + redirect
  // =========================
  const saveUser = (newUser, redirectTo) => {
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));

    const path = redirectTo || getRedirectPath(newUser.role);
    navigate(path, { replace: true });
  };

  // =========================
  // LOGIN
  // =========================
  const login = async ({
    email,
    password,
    role = "patient",
    name,
    provider,
    redirectTo,
  }) => {
    let loggedUser;

    if (provider) {
      // Social login (Google, etc.)
      loggedUser = {
        email: email || `${provider}@demo.com`,
        name: name || `${provider} User`,
        role,
        provider,
      };
    } else if (email && password) {
      // Standard email/password login
      loggedUser = {
        email,
        name: email.split("@")[0],
        role,
        provider: "credentials",
      };
    } else {
      throw new Error("Invalid credentials");
    }

    saveUser(loggedUser, redirectTo);
    return loggedUser;
  };

  // =========================
  // REGISTER (dummy)
  // =========================
  const register = async ({ email, password, role = "patient", redirectTo }) => {
    const newUser = {
      email,
      name: email.split("@")[0],
      role,
      provider: "credentials",
    };
    saveUser(newUser, redirectTo);
    return newUser;
  };

  // =========================
  // Guest login
  // =========================
  const guestLogin = () => {
    const guestUser = {
      email: "guest@demo.com",
      name: "Guest User",
      role: "guest",
      provider: "guest",
    };
    saveUser(guestUser);
    return guestUser;
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  // =========================
  // Context Provider
  // =========================
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        guestLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
