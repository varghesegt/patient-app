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
        console.error("Error parsing stored user:", err);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  /* =========================
     LOGIN
  ========================= */
  const login = async ({ email, password, role, redirectTo }) => {
    // TODO: Replace with API call
    if (email && password) {
      const loggedUser = { email, role: role || "user" };
      setUser(loggedUser);
      localStorage.setItem("user", JSON.stringify(loggedUser));

      navigate(redirectTo || "/dashboard", { replace: true });
    } else {
      alert("Invalid credentials!");
    }
  };

  /* =========================
     REGISTER
  ========================= */
  const register = async ({ email, password, role, redirectTo }) => {
    // TODO: Replace with API call
    const newUser = { email, role: role || "user" };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));

    navigate(redirectTo || "/dashboard", { replace: true });
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

  /* =========================
     GUEST LOGIN
  ========================= */
  const guestLogin = () => {
    const guestUser = { email: "guest@demo.com", role: "guest" };
    setUser(guestUser);
    localStorage.setItem("user", JSON.stringify(guestUser));
    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        guestLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
