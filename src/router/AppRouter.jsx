import React, { lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Public Pages
const Home = lazy(() => import("../pages/home.jsx"));
const Login = lazy(() => import("../pages/login.jsx"));
const Register = lazy(() => import("../pages/register.jsx"));
const Emergency = lazy(() => import("../pages/emergency.jsx"));
const Hospital = lazy(() => import("../pages/hospital.jsx"));
const Symptoms = lazy(() => import("../pages/symptoms.jsx"));

// Private Pages
const Dashboard = lazy(() => import("../pages/index.jsx"));
const Profile = lazy(() => import("../pages/profile.jsx"));
const EmergencyOne = lazy(() => import("../pages/emergencyone.jsx"));
const HospitalOne = lazy(() => import("../pages/hospitalone.jsx"));
const SymptomsOne = lazy(() => import("../pages/symptomsone.jsx"));

// Guarded Route
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sky-600 font-semibold animate-pulse">
        Checking authentication...
      </div>
    );
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />}
      />
      <Route path="/emergency" element={<Emergency />} />
      <Route path="/hospital" element={<Hospital />} />
      <Route path="/symptoms" element={<Symptoms />} />

      {/* Private Routes */}
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
      <Route
        path="/emergencyone"
        element={
          <PrivateRoute>
            <EmergencyOne />
          </PrivateRoute>
        }
      />
      <Route
        path="/hospitalone"
        element={
          <PrivateRoute>
            <HospitalOne />
          </PrivateRoute>
        }
      />
      <Route
        path="/symptomsone"
        element={
          <PrivateRoute>
            <SymptomsOne />
          </PrivateRoute>
        }
      />

      {/* 404 */}
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
