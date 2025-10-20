"use client";

import React, { useEffect, useState, useContext, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LanguageContext } from "../../context/LanguageContext";
import {
  Menu, X, User, MapPin, Heart, Shield, Home, Info, Phone, LogIn, LogOut,
  Stethoscope, Hospital, CalendarDays, BarChart3, Settings, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const translations = {
  en: { nav: {
    home: "Home", about: "About", contact: "Contact", login: "Login", logout: "Logout",
    dashboard: "Dashboard", appointments: "Appointments", patients: "Patients",
    analytics: "Analytics", hospital: "Hospital", symptoms: "Symptoms", emergency: "Emergency",
    profile: "Profile", settings: "Settings", manageDoctors: "Manage Doctors", managePatients: "Manage Patients"
  }},
  hi: { nav: {
    home: "होम", about: "हमारे बारे में", contact: "संपर्क करें", login: "लॉगिन", logout: "लॉगआउट",
    dashboard: "डैशबोर्ड", appointments: "अपॉइंटमेंट्स", patients: "मरीज़", analytics: "विश्लेषण",
    hospital: "अस्पताल", symptoms: "लक्षण", emergency: "आपातकाल", profile: "प्रोफ़ाइल",
    settings: "सेटिंग्स", manageDoctors: "डॉक्टर प्रबंधन", managePatients: "मरीज़ प्रबंधन"
  }},
  ta: { nav: {
    home: "முகப்பு", about: "எங்களை பற்றி", contact: "தொடர்பு", login: "உள்நுழை", logout: "வெளியேறு",
    dashboard: "டாஷ்போர்டு", appointments: "நியமனங்கள்", patients: "நோயாளிகள்", analytics: "பகுப்பாய்வு",
    hospital: "மருத்துவமனை", symptoms: "அறிகுறிகள்", emergency: "அவசரம்", profile: "சுயவிவரம்",
    settings: "அமைப்புகள்", manageDoctors: "மருத்துவர்களை மேலாண்மை செய்", managePatients: "நோயாளிகளை மேலாண்மை செய்"
  }},
};

const SIDEBAR_EXPANDED = 280;
const SIDEBAR_COLLAPSED = 84;
const LS_KEY = "medin360_sidebar_state";

export default function Navbar() {
  const { pathname } = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const { lang } = useContext(LanguageContext);

  const [isOpen, setIsOpen] = useState(false); // mobile
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "false"); }
    catch { return false; }
  });

  const t = (key) => {
    const parts = key.split(".");
    let cur = translations[lang] || translations.en;
    for (const p of parts) {
      if (!cur[p]) return key;
      cur = cur[p];
    }
    return cur;
  };

  const base = (arr) =>
    arr.map((x) => ({ ...x, id: x.label.toLowerCase().replace(/\s/g, "-") }));

  const navPublic = base([
    { label: t("nav.home"), path: "/", icon: Home },
    { label: t("nav.about"), path: "/about", icon: Info },
    { label: t("nav.contact"), path: "/contact", icon: Phone },
    { label: t("nav.login"), path: "/login", icon: LogIn },
  ]);
  const navDoctor = base([
    { label: t("nav.dashboard"), path: "/doctor/dashboard", icon: Stethoscope },
    { label: t("nav.appointments"), path: "/doctor/appointments", icon: CalendarDays },
    { label: t("nav.patients"), path: "/doctor/patients", icon: User },
    { label: t("nav.analytics"), path: "/doctor/analytics", icon: BarChart3 },
    { label: t("nav.logout"), path: "#logout", icon: LogOut, onClick: () => logout?.() },
  ]);
  const navAdmin = base([
    { label: t("nav.dashboard"), path: "/admin/dashboard", icon: Hospital },
    { label: t("nav.manageDoctors"), path: "/admin/doctors", icon: Stethoscope },
    { label: t("nav.managePatients"), path: "/admin/patients", icon: User },
    { label: t("nav.settings"), path: "/admin/settings", icon: Settings },
    { label: t("nav.logout"), path: "#logout", icon: LogOut, onClick: () => logout?.() },
  ]);
  const navPatient = base([
    { label: t("nav.dashboard"), path: "/dashboard", icon: Home },
    { label: t("nav.hospital"), path: "/hospital", icon: MapPin },
    { label: t("nav.symptoms"), path: "/symptoms", icon: Heart },
    { label: t("nav.emergency"), path: "/emergency", icon: Shield },
    { label: t("nav.profile"), path: "/profile", icon: User },
    { label: t("nav.logout"), path: "#logout", icon: LogOut, onClick: () => logout?.() },
  ]);

  const roleNav = useMemo(() => {
    if (!isAuthenticated) return navPublic;
    if (user?.role === "doctor") return navDoctor;
    if (user?.role === "admin") return navAdmin;
    return navPatient;
  }, [isAuthenticated, user?.role, lang]);

  const isActive = (p) => pathname === p;

  useEffect(() => {
    const apply = () => {
      document.body.style.marginLeft =
        window.innerWidth >= 768
          ? `${collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED}px`
          : "0px";
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  const MobileNav = (
    <header className="md:hidden sticky top-0 z-50 bg-gradient-to-r from-[#0f172a]/95 via-[#1e293b]/95 to-[#0f172a]/95 border-b border-sky-700/70 backdrop-blur-lg shadow-lg">
      <div className="flex justify-between items-center px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Medin360 Logo" className="h-9 w-9 rounded-xl shadow" />
          <span className="text-xl font-extrabold text-white">Medin360</span>
        </Link>
        <button
          onClick={() => setIsOpen((s) => !s)}
          className="p-2 rounded-lg hover:bg-sky-800/50 transition"
        >
          {isOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#0f172a]/95 border-t border-sky-800/40"
          >
            <ul className="flex flex-col gap-1 py-4 px-6">
              {roleNav.map(({ label, path, onClick, icon: Icon }) => {
                const active = isActive(path);
                const handle = onClick ? () => { onClick(); setIsOpen(false); } : undefined;
                const baseClass = `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  active ? "bg-yellow-300 text-sky-900 font-semibold"
                          : "text-white hover:bg-yellow-200 hover:text-sky-900"
                }`;
                return (
                  <li key={label}>
                    {handle ? (
                      <button onClick={handle} className={baseClass}>
                        <Icon size={18} /> {label}
                      </button>
                    ) : (
                      <Link to={path} onClick={() => setIsOpen(false)} className={baseClass}>
                        <Icon size={18} /> {label}
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

  const DesktopSidebar = (
    <aside
      className="hidden md:flex fixed top-0 left-0 h-screen z-50 bg-gradient-to-b from-[#0f172a]/95 via-[#111827]/95 to-[#0b1020]/95 border-r border-sky-800/40 shadow-2xl transition-all duration-300"
      style={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between px-3 py-3 border-b border-sky-800/40">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Medin360 Logo" className="h-9 w-9 rounded-xl shadow-md" />
            {!collapsed && (
              <span className="text-xl font-extrabold text-white drop-shadow-md">Medin360</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-2 p-1.5 rounded-lg bg-sky-900/40 hover:bg-sky-800/60 text-sky-100"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="mt-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700/60 scrollbar-track-transparent">
          <ul className="px-2 pb-6 space-y-1">
            {roleNav.map(({ label, path, onClick, icon: Icon }) => {
              const active = isActive(path);
              const content = (
                <div
                  className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? "bg-yellow-300 text-sky-900 font-semibold"
                      : "text-slate-200 hover:bg-sky-900/40 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {collapsed && (
                    <span className="absolute left-[72px] top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
                      {label}
                    </span>
                  )}
                </div>
              );

              return (
                <li key={label}>
                  {onClick ? (
                    <button onClick={onClick} className="w-full text-left">
                      {content}
                    </button>
                  ) : (
                    <Link to={path}>{content}</Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-sky-800/40 text-[11px] text-slate-300/70">
          {!collapsed ? (
            <>
              <div>© {new Date().getFullYear()} Medin360</div>
              <div className="opacity-70">Secure · Smart · Connected</div>
            </>
          ) : (
            <div className="text-center">© {new Date().getFullYear()}</div>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {MobileNav}
      {DesktopSidebar}
    </>
  );
}
