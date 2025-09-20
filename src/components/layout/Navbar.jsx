// src/components/layout/Navbar.jsx
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { t } = useContext(LanguageContext); // reactive translations
  const [isOpen, setIsOpen] = useState(false);

  // Public nav items
  const navItemsPublic = [
    { label: t.nav.home, path: "/", icon: <Home size={18} /> },
    { label: t.nav.about, path: "/about", icon: <Info size={18} /> },
    { label: t.nav.contact, path: "/contact", icon: <Phone size={18} /> },
    { label: t.nav.login, path: "/login", icon: <LogIn size={18} /> },
  ];

  // Authenticated user nav items
  const navItemsUser = [
    { label: t.nav.dashboard, path: "/dashboard", icon: <Home size={18} /> },
    { label: t.nav.hospital, path: "/hospital", icon: <MapPin size={18} /> },
    { label: t.nav.symptoms, path: "/symptoms", icon: <Heart size={18} /> },
    { label: t.nav.emergency, path: "/emergency", icon: <Shield size={18} /> },
    { label: t.nav.profile, path: "/profile", icon: <User size={18} /> },
    { label: t.nav.logout, path: "#", onClick: logout, icon: <LogOut size={18} /> },
  ];

  const navItems = isAuthenticated ? navItemsUser : navItemsPublic;

  return (
    <nav className="bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold tracking-wide hover:text-yellow-300 transition-colors duration-300"
        >
          <img
            src="/logo.png"
            alt="MediLink360 Logo"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg shadow-md"
          />
          <span className="text-lg sm:text-xl md:text-2xl font-semibold whitespace-nowrap">
            MediLink360
          </span>
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
                  {icon} {label}
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
                  {icon} {label}
                </Link>
              )}
            </li>
          ))}
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
            <ul className="flex flex-col gap-2 py-4 max-h-[75vh] overflow-y-auto">
              {navItems.map(({ label, path, onClick, icon }) => (
                <li key={label}>
                  {onClick ? (
                    <button
                      onClick={() => {
                        onClick();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-yellow-200 hover:text-sky-800 transition duration-300 shadow"
                    >
                      {icon} {label}
                    </button>
                  ) : (
                    <Link
                      to={path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-yellow-200 hover:text-sky-800 transition duration-300 shadow ${
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
