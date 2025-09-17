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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Multi-language labels
const LANGS = {
  en: {
    home: "Home",
    about: "About",
    contact: "Contact",
    login: "Login",
    hospital: "Hospital",
    symptoms: "Symptoms",
    emergency: "Emergency",
    profile: "Profile",
    logout: "Logout",
  },
  hi: {
    home: "होम",
    about: "हमारे बारे में",
    contact: "संपर्क करें",
    login: "लॉगिन",
    hospital: "अस्पताल",
    symptoms: "लक्षण",
    emergency: "आपातकालीन",
    profile: "प्रोफ़ाइल",
    logout: "लॉग आउट",
  },
  ta: {
    home: "முகப்பு",
    about: "எங்களைப்பற்றி",
    contact: "தொடர்பு",
    login: "உள்நுழைய",
    hospital: "மருத்துவமனை",
    symptoms: "அறிகுறிகள்",
    emergency: "அவசரம்",
    profile: "சுயவிவரம்",
    logout: "வெளியேறு",
  },
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { isAuthenticated, role, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState("en");

  // Load selected language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "en";
    setLang(savedLang);
  }, []);

  const t = LANGS[lang];

  // Navigation items
  const navItemsPublic = [
    { label: t.home, path: "/", icon: <Home size={18} /> },
    { label: t.about, path: "/about", icon: <Info size={18} /> },
    { label: t.contact, path: "/contact", icon: <Phone size={18} /> },
    { label: t.login, path: "/login", icon: <LogIn size={18} /> },
  ];

  const navItemsUser = [
    { label: t.hospital, path: "/hospital", icon: <MapPin size={18} /> },
    { label: t.symptoms, path: "/symptoms", icon: <Heart size={18} /> },
    { label: t.emergency, path: "/emergency", icon: <Shield size={18} /> },
    { label: t.profile, path: "/profile", icon: <User size={18} /> }, // Added Profile
    { label: t.logout, path: "#", onClick: logout, icon: <User size={18} /> },
  ];

  const navItems = isAuthenticated && role === "user" ? navItemsUser : navItemsPublic;

  return (
    <nav className="bg-sky-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        {/* Logo */}
        <Link
          to="/"
          className="font-bold text-2xl md:text-3xl tracking-wide hover:text-yellow-300 transition-colors duration-300"
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
                  className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-yellow-200 hover:text-sky-700 transition duration-300 shadow-sm"
                >
                  {icon} {label}
                </button>
              ) : (
                <Link
                  to={path}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md hover:bg-yellow-200 hover:text-sky-700 transition duration-300 shadow-sm ${
                    pathname === path ? "font-semibold underline decoration-yellow-300" : ""
                  }`}
                >
                  {icon} {label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden flex items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-sky-700 px-6 overflow-hidden"
          >
            <ul className="flex flex-col gap-3 py-4">
              {navItems.map(({ label, path, onClick, icon }) => (
                <li key={label}>
                  {onClick ? (
                    <button
                      onClick={() => {
                        onClick();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-yellow-200 hover:text-sky-700 transition duration-300 shadow-sm"
                    >
                      {icon} {label}
                    </button>
                  ) : (
                    <Link
                      to={path}
                      onClick={() => setIsOpen(false)}
                      className={`block flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-yellow-200 hover:text-sky-700 transition duration-300 shadow-sm ${
                        pathname === path ? "font-semibold underline decoration-yellow-300" : ""
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
