import React, { lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Footer from "../components/layout/Footer"; // ✅ added

const Home = lazy(() => import("../pages/home.jsx"));
const Login = lazy(() => import("../pages/login.jsx"));
const Register = lazy(() => import("../pages/register.jsx"));
const Emergency = lazy(() => import("../pages/emergency.jsx"));
const Hospital = lazy(() => import("../pages/hospital.jsx"));
const Symptoms = lazy(() => import("../pages/symptoms.jsx"));
const FirstAid = lazy(() => import("../pages/firstaid.jsx"));
const ConsultDoctor = lazy(() => import("../pages/consultdoctor.jsx"));
const About = lazy(() => import("../pages/about.jsx"));
const Contact = lazy(() => import("../pages/contact.jsx"));

const DoctorDashboard = lazy(() => import("../pages/doctordashboard.jsx"));
const HospitalDashboard = lazy(() => import("../pages/hospitaldashboard.jsx"));
const Dashboard = lazy(() => import("../pages/index.jsx"));
const Profile = lazy(() => import("../pages/profile.jsx"));

const EmergencyOne = lazy(() => import("../pages/emergencyone.jsx"));
const HospitalOne = lazy(() => import("../pages/hospitalone.jsx"));
const SymptomsOne = lazy(() => import("../pages/symptomsone.jsx"));
const FirstAidOne = lazy(() => import("../pages/firstaidone.jsx"));
const ConsultDoctorOne = lazy(() => import("../pages/consultdoctorone.jsx"));

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sky-600 font-semibold animate-pulse">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
};

const LoginRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sky-600 font-semibold animate-pulse">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  const roleRedirects = {
    doctor: "/doctordashboard",
    admin: "/hospitaldashboard",
    hospital: "/hospitaldashboard",
    patient: "/dashboard",
    guest: "/dashboard",
  };

  return (
    <Navigate
      to={roleRedirects[user?.role] || "/dashboard"}
      state={{ from: location }}
      replace
    />
  );
};

const publicRoutes = [
  { path: "/", element: <Home /> },
  { path: "/login", element: <LoginRedirect /> },
  { path: "/register", element: <Register /> },
  { path: "/emergency", element: <Emergency /> },
  { path: "/hospital", element: <Hospital /> },
  { path: "/symptoms", element: <Symptoms /> },
  { path: "/firstaid", element: <FirstAid /> },
  { path: "/consultdoctor", element: <ConsultDoctor /> },
  { path: "/about", element: <About /> },
  { path: "/contact", element: <Contact /> },
];

const patientRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/profile", element: <Profile /> },
  { path: "/emergencyone", element: <EmergencyOne /> },
  { path: "/hospitalone", element: <HospitalOne /> },
  { path: "/symptomsone", element: <SymptomsOne /> },
  { path: "/firstaidone", element: <FirstAidOne /> },
  { path: "/consultdoctorone", element: <ConsultDoctorOne /> },
];

const doctorRoutes = [{ path: "/doctordashboard", element: <DoctorDashboard /> }];
const hospitalRoutes = [{ path: "/hospitaldashboard", element: <HospitalDashboard /> }];

export default function AppRouter() {
  return (
    <>
      <Routes>
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {patientRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <PrivateRoute roles={["patient", "guest"]}>
                {route.element}
              </PrivateRoute>
            }
          />
        ))}

        {doctorRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <PrivateRoute roles={["doctor"]}>
                {route.element}
              </PrivateRoute>
            }
          />
        ))}

        {hospitalRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <PrivateRoute roles={["admin", "hospital"]}>
                {route.element}
              </PrivateRoute>
            }
          />
        ))}

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

      <Footer /> {/* ✅ added */}
    </>
  );
}
