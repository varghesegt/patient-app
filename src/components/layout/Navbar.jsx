import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LanguageContext } from "../../context/LanguageContext";
import {
  Menu,
  X,
  User,
  MapPin,
  Heart,
  Shield,
  Home,
  Info,
  Phone,
  LogIn,
  LogOut,
  Stethoscope,
  Hospital,
  CalendarDays,
  BarChart3,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* 🌍 Translations */
const translations = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      contact: "Contact",
      login: "Login",
      logout: "Logout",
      dashboard: "Dashboard",
      appointments: "Appointments",
      patients: "Patients",
      analytics: "Analytics",
      hospital: "Hospital",
      symptoms: "Symptoms",
      emergency: "Emergency",
      profile: "Profile",
      settings: "Settings",
      manageDoctors: "Manage Doctors",
      managePatients: "Manage Patients",
    },
  },
  hi: {
    nav: {
      home: "होम",
      about: "हमारे बारे में",
      contact: "संपर्क करें",
      login: "लॉगिन",
      logout: "लॉगआउट",
      dashboard: "डैशबोर्ड",
      appointments: "अपॉइंटमेंट्स",
      patients: "मरीज़",
      analytics: "विश्लेषण",
      hospital: "अस्पताल",
      symptoms: "लक्षण",
      emergency: "आपातकाल",
      profile: "प्रोफ़ाइल",
      settings: "सेटिंग्स",
      manageDoctors: "डॉक्टर प्रबंधन",
      managePatients: "मरीज़ प्रबंधन",
    },
  },
  ta: {
    nav: {
      home: "முகப்பு",
      about: "எங்களை பற்றி",
      contact: "தொடர்பு கொள்ள",
      login: "உள்நுழை",
      logout: "வெளியேறு",
      dashboard: "டாஷ்போர்டு",
      appointments: "நியமனங்கள்",
      patients: "நோயாளிகள்",
      analytics: "பகுப்பாய்வு",
      hospital: "மருத்துவமனை",
      symptoms: "அறிகுறிகள்",
      emergency: "அவசரம்",
      profile: "சுயவிவரம்",
      settings: "அமைப்புகள்",
      manageDoctors: "மருத்துவர்களை மேலாண்மை செய்",
      managePatients: "நோயாளிகளை மேலாண்மை செய்",
    },
  },
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const { lang } = useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);

  const t = (key) => {
    const parts = key.split(".");
    let cur = translations[lang] || translations.en;
    for (const p of parts) {
      if (!cur || typeof cur !== "object" || !(p in cur)) return key;
      cur = cur[p];
    }
    return typeof cur === "string" ? cur : key;
  };

  /* 🔹 Role-Based Menu Items */
  const navItemsPublic = [
    { label: t("nav.home"), path: "/", icon: <Home size={18} /> },
    { label: t("nav.about"), path: "/about", icon: <Info size={18} /> },
    { label: t("nav.contact"), path: "/contact", icon: <Phone size={18} /> },
    { label: t("nav.login"), path: "/login", icon: <LogIn size={18} /> },
  ];

  const navItemsDoctor = [
    { label: t("nav.dashboard"), path: "/doctordashboard", icon: <Stethoscope size={18} /> },
    { label: t("nav.appointments"), path: "/doctor/appointments", icon: <CalendarDays size={18} /> },
    { label: t("nav.patients"), path: "/doctor/patients", icon: <User size={18} /> },
    { label: t("nav.analytics"), path: "/doctor/analytics", icon: <BarChart3 size={18} /> },
    { label: t("nav.logout"), path: "#", onClick: logout, icon: <LogOut size={18} /> },
  ];

  const navItemsAdmin = [
    { label: t("nav.dashboard"), path: "/hospitaldashboard", icon: <Hospital size={18} /> },
    { label: t("nav.manageDoctors"), path: "/admin/doctors", icon: <Stethoscope size={18} /> },
    { label: t("nav.managePatients"), path: "/admin/patients", icon: <User size={18} /> },
    { label: t("nav.settings"), path: "/admin/settings", icon: <Settings size={18} /> },
    { label: t("nav.logout"), path: "#", onClick: logout, icon: <LogOut size={18} /> },
  ];

  const navItemsPatient = [
    { label: t("nav.dashboard"), path: "/dashboard", icon: <Home size={18} /> },
    { label: t("nav.hospital"), path: "/hospital", icon: <MapPin size={18} /> },
    { label: t("nav.symptoms"), path: "/symptoms", icon: <Heart size={18} /> },
    { label: t("nav.emergency"), path: "/emergency", icon: <Shield size={18} /> },
    { label: t("nav.profile"), path: "/profile", icon: <User size={18} /> },
    { label: t("nav.logout"), path: "#", onClick: logout, icon: <LogOut size={18} /> },
  ];

  let navItems = navItemsPublic;
  if (isAuthenticated) {
    if (user?.role === "doctor") navItems = navItemsDoctor;
    else if (user?.role === "admin") navItems = navItemsAdmin;
    else navItems = navItemsPatient;
  }

  const handleLogout = () => logout && logout();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-[#0f172a]/95 via-[#1e293b]/95 to-[#0f172a]/95 border-b border-sky-700 shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="MediLink360 Logo"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          />
          <span className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-wide text-white drop-shadow-md">
            MediLink360
          </span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex gap-6 items-center">
          {navItems.map(({ label, path, onClick, icon }) => {
            const active = path && pathname === path;
            const clickHandler = onClick === logout ? handleLogout : onClick;
            return (
              <li key={label} className="relative">
                {clickHandler ? (
                  <button
                    onClick={() => clickHandler()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white hover:text-yellow-300 transition-colors duration-300"
                  >
                    {icon} <span className="font-medium">{label}</span>
                  </button>
                ) : (
                  <Link
                    to={path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                      active
                        ? "text-yellow-300 font-semibold"
                        : "text-gray-200 hover:text-yellow-300"
                    }`}
                  >
                    {icon} <span className="font-medium">{label}</span>
                    {active && (
                      <motion.div
                        layoutId="underline"
                        className="absolute -bottom-1 left-0 w-full h-[2px] bg-yellow-300 rounded"
                      />
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {/* Mobile Toggle Button */}
        <button
          className="md:hidden flex items-center p-2 rounded-lg hover:bg-sky-800 transition"
          onClick={() => setIsOpen((s) => !s)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={26} className="text-white" /> : <Menu size={26} className="text-white" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="md:hidden bg-[#0f172a]/95 backdrop-blur-2xl shadow-2xl border-t border-sky-800"
          >
            <ul className="flex flex-col gap-2 py-4 px-6">
              {navItems.map(({ label, path, onClick, icon }) => {
                const active = path && pathname === path;
                const clickHandler = onClick === logout ? handleLogout : onClick;
                return (
                  <li key={label}>
                    {clickHandler ? (
                      <button
                        onClick={() => {
                          clickHandler();
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-yellow-200 hover:text-sky-900 transition duration-300"
                      >
                        {icon} <span className="font-medium">{label}</span>
                      </button>
                    ) : (
                      <Link
                        to={path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-300 ${
                          active
                            ? "bg-yellow-300 text-sky-900 font-semibold"
                            : "text-white hover:bg-yellow-200 hover:text-sky-900"
                        }`}
                      >
                        {icon} <span className="font-medium">{label}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
