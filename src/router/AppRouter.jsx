import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/* =========================
   Lazy load pages
========================= */
const Home = lazy(() => import("../pages/home.jsx"));
const Dashboard = lazy(() => import("../pages/index.jsx"));
const Symptoms = lazy(() => import("../pages/symptoms.jsx"));
const Emergency = lazy(() => import("../pages/emergency.jsx"));
const Profile = lazy(() => import("../pages/profile.jsx"));
const Register = lazy(() => import("../pages/register.jsx"));
const Login = lazy(() => import("../pages/login.jsx"));
const Hospital = lazy(() => import("../pages/hospital.jsx"));

/* =========================
   Route Guards
========================= */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sky-600 font-semibold animate-pulse">
        Checking authentication...
      </div>
    );
  }

  // Redirect to LOGIN instead of Home when not authenticated
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/* =========================
   App Router
========================= */
export default function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      /* Default Landing */
<Route
  path="/"
  element={<Home />}
/>


      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/register"
        element={
          !isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />
        }
      />

      {/* Publicly Accessible Routes */}
      <Route path="/symptoms" element={<Symptoms />} />
      <Route path="/emergency" element={<Emergency />} />
      <Route path="/hospital" element={<Hospital />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />

      {/* 404 Fallback */}
      <Route
        path="*"
        element={
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
            <p className="mt-2">The page you are looking for does not exist.</p>
          </div>
        }
      />
    </Routes>
  );
}
