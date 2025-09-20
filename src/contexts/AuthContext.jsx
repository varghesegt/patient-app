import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

// Custom Hook
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* =========================
     Restore User on App Load
  ========================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("❌ Error parsing stored user:", err);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  /* =========================
     Generic Save + Redirect
  ========================= */
  const saveUser = (newUser, redirectTo = "/dashboard") => {
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    navigate(redirectTo, { replace: true });
  };

  /* =========================
     LOGIN (Email/Password or Social)
  ========================= */
  const login = async ({ email, password, role, name, provider, redirectTo }) => {
    let loggedUser;

    // 🔹 Social or Google login (dummy)
    if (provider) {
      loggedUser = {
        email: email || `${provider}@demo.com`,
        name: name || `${provider} User`,
        role: role || "patient",
        provider,
      };
    }
    // 🔹 Normal email/password login (dummy)
    else if (email && password) {
      loggedUser = {
        email,
        name: email.split("@")[0],
        role: role || "patient",
        provider: "credentials",
      };
    }
    else {
      alert("⚠️ Invalid credentials!");
      return;
    }

    saveUser(loggedUser, redirectTo);
  };

  /* =========================
     REGISTER (Dummy)
  ========================= */
  const register = async ({ email, password, role, redirectTo }) => {
    const newUser = {
      email,
      name: email.split("@")[0],
      role: role || "patient",
      provider: "credentials",
    };
    saveUser(newUser, redirectTo);
  };

  /* =========================
     GUEST LOGIN (Dummy)
  ========================= */
  const guestLogin = () => {
    const guestUser = {
      email: "guest@demo.com",
      name: "Guest User",
      role: "guest",
      provider: "guest",
    };
    saveUser(guestUser);
  };

  /* =========================
     LOGOUT
  ========================= */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

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
