import React, { useEffect, useState, useContext, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
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

/* 🔧 Constants */
const SIDEBAR_EXPANDED = 280;  // px
const SIDEBAR_COLLAPSED = 84;  // px
const LS_KEY = "ml360_sidebar_collapsed";

export default function Navbar() {
  const { pathname } = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const { lang } = useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);         // mobile drawer
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "false"); } catch { return false; }
  });

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
    { label: t("nav.home"), path: "/", icon: Home },
    { label: t("nav.about"), path: "/about", icon: Info },
    { label: t("nav.contact"), path: "/contact", icon: Phone },
    { label: t("nav.login"), path: "/login", icon: LogIn },
  ];

  const navItemsDoctor = [
    { label: t("nav.dashboard"), path: "/doctordashboard", icon: Stethoscope },
    { label: t("nav.appointments"), path: "/doctor/appointments", icon: CalendarDays },
    { label: t("nav.patients"), path: "/doctor/patients", icon: User },
    { label: t("nav.analytics"), path: "/doctor/analytics", icon: BarChart3 },
    { label: t("nav.logout"), path: "#logout", icon: LogOut, onClick: () => logout?.() },
  ];

  const navItemsAdmin = [
    { label: t("nav.dashboard"), path: "/hospitaldashboard", icon: Hospital },
    { label: t("nav.manageDoctors"), path: "/admin/doctors", icon: Stethoscope },
    { label: t("nav.managePatients"), path: "/admin/patients", icon: User },
    { label: t("nav.settings"), path: "/admin/settings", icon: Settings },
    { label: t("nav.logout"), path: "#logout", icon: LogOut, onClick: () => logout?.() },
  ];

  const navItemsPatient = [
    { label: t("nav.dashboard"), path: "/dashboard", icon: Home },
    { label: t("nav.hospital"), path: "/hospital", icon: MapPin },
    { label: t("nav.symptoms"), path: "/symptoms", icon: Heart },
    { label: t("nav.emergency"), path: "/emergency", icon: Shield },
    { label: t("nav.profile"), path: "/profile", icon: User },
    { label: t("nav.logout"), path: "#logout", icon: LogOut, onClick: () => logout?.() },
  ];

  const roleNav = useMemo(() => {
    if (!isAuthenticated) return navItemsPublic;
    if (user?.role === "doctor") return navItemsDoctor;
    if (user?.role === "admin") return navItemsAdmin;
    return navItemsPatient;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role, lang]);

  /* 🧭 Active helper */
  const isActive = (path) => !!path && pathname === path;

  /* 🧱 Desktop sidebar margin for page content */
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      if (w >= 768) {
        document.body.style.marginLeft = `${collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED}px`;
      } else {
        document.body.style.marginLeft = "0px";
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      document.body.style.marginLeft = "0px";
    };
  }, [collapsed]);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(collapsed)); } catch {}
  }, [collapsed]);

  /* ============== MOBILE TOP BAR (unchanged) ============== */
  const MobileTopBar = (
    <header className="md:hidden sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-[#0f172a]/95 via-[#1e293b]/95 to-[#0f172a]/95 border-b border-sky-700 shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
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
              {roleNav.map(({ label, path, onClick, icon: Icon }) => {
                const active = isActive(path);
                const handle = onClick
                  ? () => { onClick(); setIsOpen(false); }
                  : undefined;
                return (
                  <li key={label}>
                    {handle ? (
                      <button
                        onClick={handle}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-yellow-200 hover:text-sky-900 transition duration-300"
                      >
                        <Icon size={18} /> <span className="font-medium">{label}</span>
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
                        <Icon size={18} /> <span className="font-medium">{label}</span>
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

  /* ============== DESKTOP LEFT SIDEBAR ============== */
  const DesktopSidebar = (
    <aside
      className="hidden md:flex fixed top-0 left-0 z-50 h-screen border-r border-sky-800/40 bg-gradient-to-b from-[#0f172a]/95 via-[#111827]/95 to-[#0b1020]/95 shadow-2xl"
      style={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
      aria-label="Primary"
    >
      <div className="flex flex-col w-full">
        {/* Brand / Collapse */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-sky-800/40">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="MediLink360 Logo"
              className="h-9 w-9 rounded-xl shadow-md"
            />
            {!collapsed && (
              <span className="text-xl font-extrabold tracking-wide text-white drop-shadow-md">
                MediLink360
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-2 shrink-0 p-1.5 rounded-lg bg-sky-900/40 hover:bg-sky-800/60 text-sky-100 transition"
            title={collapsed ? "Expand" : "Collapse"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/60 scrollbar-track-transparent">
          <ul className="px-2 pb-10 space-y-1">
            {roleNav.map(({ label, path, onClick, icon: Icon }) => {
              const active = isActive(path);
              const content = (
                <div className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${active ? "bg-yellow-300 text-sky-900 font-semibold"
                           : "text-slate-200 hover:bg-sky-900/40 hover:text-white"}`}>
                  <Icon size={18} />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {collapsed && (
                    <span
                      className="pointer-events-none absolute left-[72px] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition
                                 bg-black text-white text-xs px-2 py-1 rounded shadow"
                    >
                      {label}
                    </span>
                  )}
                </div>
              );

              return (
                <li key={label} className="relative">
                  {onClick ? (
                    <button
                      onClick={onClick}
                      className="w-full text-left"
                      aria-label={label}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link to={path} aria-current={active ? "page" : undefined}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="mt-auto p-3 border-t border-sky-800/40 text-[11px] text-slate-300/70">
          {!collapsed ? (
            <div>
              <div>© {new Date().getFullYear()} MediLink360</div>
              <div className="opacity-70">Secure · Fast · Reliable</div>
            </div>
          ) : (
            <div className="text-center">© {new Date().getFullYear()}</div>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile top bar (visible < md) */}
      {MobileTopBar}

      {/* Desktop left sidebar (visible ≥ md) */}
      {DesktopSidebar}
    </>
  );
}
