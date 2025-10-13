import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Footer from "../components/layout/Footer";

/* ------------------------------- Lazy imports ------------------------------- */
// Public
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

// Patient
const Dashboard = lazy(() => import("../pages/index.jsx"));
const Profile = lazy(() => import("../pages/profile.jsx"));
const EmergencyOne = lazy(() => import("../pages/emergencyone.jsx"));
const HospitalOne = lazy(() => import("../pages/hospitalone.jsx"));
const SymptomsOne = lazy(() => import("../pages/symptomsone.jsx"));
const FirstAidOne = lazy(() => import("../pages/firstaidone.jsx"));
const ConsultDoctorOne = lazy(() => import("../pages/consultdoctorone.jsx"));

// Doctor
const DoctorDashboard = lazy(() => import("../pages/doctordashboard.jsx"));
const DoctorAppointments = lazy(() => import("../pages/doctors/appointments.jsx"));
const DoctorPatients = lazy(() => import("../pages/doctors/patients.jsx"));
const DoctorAnalytics = lazy(() => import("../pages/doctors/analytics.jsx"));

// Admin/Hospital
const HospitalDashboard = lazy(() => import("../pages/hospitaldashboard.jsx"));
const AdminDoctors = lazy(() => import("../pages/admin/doctors.jsx"));
const AdminPatients = lazy(() => import("../pages/admin/patients.jsx"));
const AdminSettings = lazy(() => import("../pages/admin/settings.jsx"));

/* ------------------------------- Small screens ------------------------------ */
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen text-sky-600 font-semibold animate-pulse">
    Loading…
  </div>
);

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-red-600">
    <h2 className="text-2xl font-bold">Access Denied</h2>
    <p className="mt-2">You do not have permission to view this page.</p>
  </div>
);

const NotFound = () => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-600">
    <h2 className="text-2xl font-bold">404 – Page Not Found</h2>
    <p className="mt-2">The page you are looking for does not exist.</p>
  </div>
);

/* ------------------------------- Route guards ------------------------------- */
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles || roles.length === 0) return children;
  return roles.includes(user?.role) ? children : <AccessDenied />;
}

/* ------------------------------ Login redirect ------------------------------ */
function LoginRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Login />;

  const roleRedirects = {
    doctor: "/doctordashboard",
    admin: "/hospitaldashboard",
    hospital: "/hospitaldashboard",
    patient: "/dashboard",
    guest: "/dashboard",
  };

  return (
    <Navigate to={roleRedirects[user?.role] || "/dashboard"} state={{ from: location }} replace />
  );
}

/* ------------------------------ Scroll restore ------------------------------ */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/* --------------------------------- Router ---------------------------------- */
export default function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen />}> 
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/register" element={<Register />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/hospital" element={<Hospital />} />
        <Route path="/symptoms" element={<Symptoms />} />
        <Route path="/firstaid" element={<FirstAid />} />
        <Route path="/consultdoctor" element={<ConsultDoctor />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Patient routes */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <RoleRoute roles={["patient", "guest"]}>
                <Dashboard />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <RoleRoute roles={["patient", "guest"]}>
                <Profile />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/emergencyone"
          element={
            <RequireAuth>
              <RoleRoute roles={["patient", "guest"]}>
                <EmergencyOne />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/hospitalone"
          element={
            <RequireAuth>
              <RoleRoute roles={["patient", "guest"]}>
                <HospitalOne />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/symptomsone"
          element={
            <RequireAuth>
              <RoleRoute roles={["patient", "guest"]}>
                <SymptomsOne />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/firstaidone"
          element={
            <RequireAuth>
              <RoleRoute roles={["patient", "guest"]}>
                <FirstAidOne />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/consultdoctorone"
          element={
            <RequireAuth>
              <RoleRoute roles={["patient", "guest"]}>
                <ConsultDoctorOne />
              </RoleRoute>
            </RequireAuth>
          }
        />

        {/* Doctor routes */}
        <Route
          path="/doctordashboard"
          element={
            <RequireAuth>
              <RoleRoute roles={["doctor"]}>
                <DoctorDashboard />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <RequireAuth>
              <RoleRoute roles={["doctor"]}>
                <DoctorAppointments />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <RequireAuth>
              <RoleRoute roles={["doctor"]}>
                <DoctorPatients />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/doctor/analytics"
          element={
            <RequireAuth>
              <RoleRoute roles={["doctor"]}>
                <DoctorAnalytics />
              </RoleRoute>
            </RequireAuth>
          }
        />

        {/* Admin/Hospital routes */}
        <Route
          path="/hospitaldashboard"
          element={
            <RequireAuth>
              <RoleRoute roles={["admin", "hospital"]}>
                <HospitalDashboard />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/doctors"
          element={
            <RequireAuth>
              <RoleRoute roles={["admin", "hospital"]}>
                <AdminDoctors />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/patients"
          element={
            <RequireAuth>
              <RoleRoute roles={["admin", "hospital"]}>
                <AdminPatients />
              </RoleRoute>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RequireAuth>
              <RoleRoute roles={["admin", "hospital"]}>
                <AdminSettings />
              </RoleRoute>
            </RequireAuth>
          }
        />

        {/* Fallbacks */}
        <Route path="/unauthorized" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </Suspense>
  );
}
