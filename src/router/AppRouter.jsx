import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Lazy load pages
const Home = lazy(() => import("../pages/home"));
const Dashboard = lazy(() => import("../pages/Index"));
const Symptoms = lazy(() => import("../pages/Symptoms"));
const Emergency = lazy(() => import("../pages/Emergency"));
const Profile = lazy(() => import("../pages/profile"));
const Register = lazy(() => import("../pages/register"));
const Login = lazy(() => import("../pages/login"));
const Hospital = lazy(() => import("../pages/hospital")); // <-- Add this

/* =========================
   Route Guards
========================= */

// Protect routes for logged-in users
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sky-600 font-semibold animate-pulse">
        Checking authentication...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/* =========================
   App Router
========================= */

export default function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />}
      />
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />}
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/symptoms"
        element={
          <PrivateRoute>
            <Symptoms />
          </PrivateRoute>
        }
      />
      <Route
        path="/emergency"
        element={
          <PrivateRoute>
            <Emergency />
          </PrivateRoute>
        }
      />
      <Route
        path="/hospital"
        element={
          <PrivateRoute>
            <Hospital />
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
