import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

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
  UserPlus,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* =========================
   Multi-language labels
========================= */
const LANGS = {
  en: {
    home: "Home",
    about: "About",
    contact: "Contact",
    login: "Login",
    register: "Register",
    hospital: "Hospital",
    symptoms: "Symptoms",
    emergency: "Emergency",
    profile: "Profile",
    dashboard: "Dashboard",
    logout: "Logout",
  },
  hi: {
    home: "होम",
    about: "हमारे बारे में",
    contact: "संपर्क करें",
    login: "लॉगिन",
    register: "रजिस्टर",
    hospital: "अस्पताल",
    symptoms: "लक्षण",
    emergency: "आपातकालीन",
    profile: "प्रोफ़ाइल",
    dashboard: "डैशबोर्ड",
    logout: "लॉग आउट",
  },
  ta: {
    home: "முகப்பு",
    about: "எங்களைப்பற்றி",
    contact: "தொடர்பு",
    login: "உள்நுழைய",
    register: "பதிவு",
    hospital: "மருத்துவமனை",
    symptoms: "அறிகுறிகள்",
    emergency: "அவசரம்",
    profile: "சுயவிவரம்",
    dashboard: "டாஷ்போர்டு",
    logout: "வெளியேறு",
  },
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState("en");

  /* Load selected language */
  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "en";
    setLang(savedLang);
  }, []);

  const t = LANGS[lang];

  /* Public Navigation */
  const navItemsPublic = [
    { label: t.home, path: "/", icon: <Home size={18} /> },
    { label: t.about, path: "/about", icon: <Info size={18} /> },
    { label: t.contact, path: "/contact", icon: <Phone size={18} /> },
    { label: t.login, path: "/login", icon: <LogIn size={18} /> },
  ];

  /* Authenticated User Navigation */
  const navItemsUser = [
        { label: t.dashboard, path: "/dashboard", icon: <Home size={18} /> },
    { label: t.hospital, path: "/hospital", icon: <MapPin size={18} /> },
    { label: t.symptoms, path: "/symptoms", icon: <Heart size={18} /> },
    { label: t.emergency, path: "/emergency", icon: <Shield size={18} /> },
   
    { label: t.profile, path: "/profile", icon: <User size={18} /> },
    { label: t.logout, path: "#", onClick: logout, icon: <LogOut size={18} /> },
  ];

  const navItems = isAuthenticated ? navItemsUser : navItemsPublic;

  // ✅ filter guest/demo emails
  const isRealUser =
    isAuthenticated &&
    user?.email &&
    !user.email.includes("guest") &&
    !user.email.includes("demo");

  return (
    <nav className="bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3">
        {/* Logo */}
        <Link
          to="/"
          className="font-bold text-2xl sm:text-3xl tracking-wide hover:text-yellow-300 transition-colors duration-300"
        >
          MediLink360
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-6 items-center">
          {navItems.map(({ label, path, onClick, icon }) => (
            <li key={label}>
              {onClick ? (
                <button
                  onClick={onClick}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-yellow-200 hover:text-sky-800 transition duration-300 shadow-sm"
                >
                  {icon} <span className="hidden lg:inline">{label}</span>
                </button>
              ) : (
                <Link
                  to={path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-yellow-200 hover:text-sky-800 transition duration-300 shadow-sm ${
                    pathname === path
                      ? "font-semibold underline decoration-yellow-300"
                      : ""
                  }`}
                >
                  {icon} <span className="hidden lg:inline">{label}</span>
                </Link>
              )}
            </li>
          ))}

          {/* ✅ Show only real user email */}
          {isRealUser && (
            <li className="ml-4 text-xs sm:text-sm font-medium italic text-yellow-200 truncate max-w-[160px]">
              {user.email}
            </li>
          )}
        </ul>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden flex items-center p-2 rounded-lg hover:bg-sky-500 transition"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="md:hidden bg-sky-700/95 px-6 backdrop-blur-md overflow-hidden rounded-b-2xl shadow-lg"
          >
            <ul className="flex flex-col gap-2 py-4">
              {navItems.map(({ label, path, onClick, icon }) => (
                <li key={label}>
                  {onClick ? (
                    <button
                      onClick={() => {
                        onClick();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-yellow-200 hover:text-sky-800 transition duration-300 shadow"
                    >
                      {icon} {label}
                    </button>
                  ) : (
                    <Link
                      to={path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-yellow-200 hover:text-sky-800 transition duration-300 shadow ${
                        pathname === path
                          ? "font-semibold underline decoration-yellow-300"
                          : ""
                      }`}
                    >
                      {icon} {label}
                    </Link>
                  )}
                </li>
              ))}

            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
