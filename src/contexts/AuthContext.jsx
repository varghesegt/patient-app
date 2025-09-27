import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const getRedirectPath = (role) => {
    switch (role) {
      case "doctor":
        return "/doctor-dashboard";
      case "admin":
      case "hospital":
        return "/hospital-dashboard";
      default:
        return "/dashboard";
    }
  };

  const saveUser = (newUser, redirectTo) => {
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));

    const path = redirectTo || getRedirectPath(newUser.role);
    navigate(path, { replace: true });
  };

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
      loggedUser = {
        email: email || `${provider}@demo.com`,
        name: name || `${provider} User`,
        role,
        provider,
      };
    } else if (email && password) {
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
