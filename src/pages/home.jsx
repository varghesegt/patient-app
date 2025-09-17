import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  Stethoscope,
  AlertTriangle,
  Users,
  Hospital,
} from "lucide-react";

// 🌐 Supported Languages
const LANGS = {
  en: {
    appName: "MediLink360",
    tagline:
      "Your personal health assistant. Check symptoms, get instant emergency support, and connect with doctors — all in one platform.",
    login: "Login",
    register: "Register",
    guest: "Continue as Guest",
    quickAccess: "Quick Access (Guest Mode)",
    emergency: "Emergency SOS",
    symptoms: "Check Symptoms",
    hospital: "Nearby Hospitals",
    features: [
      {
        title: "Symptom Checker",
        desc: "AI-powered triage to guide your next steps.",
        icon: <HeartPulse className="mx-auto text-sky-500" size={40} />,
      },
      {
        title: "Emergency SOS",
        desc: "Get instant help and live ambulance tracking.",
        icon: <AlertTriangle className="mx-auto text-red-500" size={40} />,
      },
      {
        title: "Doctor Connect",
        desc: "Consult certified doctors online 24/7.",
        icon: <Stethoscope className="mx-auto text-green-500" size={40} />,
      },
      {
        title: "For Everyone",
        desc: "Patients, caregivers, or guests — MediLink360 is here for you.",
        icon: <Users className="mx-auto text-purple-500" size={40} />,
      },
    ],
    footer: "Built for Better Health Access",
    chooseLang: "Choose Your Language",
  },
  // 🟢 Extend Hindi & Tamil in the same format if needed
};

export default function Home() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem("lang") || null);

  // 🌍 Auto-detect browser language (first visit only)
  useEffect(() => {
    if (!lang) {
      const browserLang = navigator.language.slice(0, 2);
      if (LANGS[browserLang]) {
        setLang(browserLang);
      } else {
        setLang("en");
      }
    }
  }, [lang]);

  // 🌐 Handle language selection
  const chooseLanguage = (code) => {
    setLang(code);
    localStorage.setItem("lang", code);
  };

  // 👤 Handle guest mode navigation
  const enableGuestAndNavigate = (path) => {
    localStorage.setItem("guest", "true");
    navigate(path);
  };

  const t = lang ? LANGS[lang] : LANGS.en;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-white to-sky-100 relative">
      {/* 🌐 Language Selection Modal */}
      <AnimatePresence>
        {!lang && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm text-center"
            >
              <h2 className="text-2xl font-bold text-sky-700 mb-6">
                🌐 {LANGS.en.chooseLang}
              </h2>
              <div className="flex flex-col gap-4">
                {Object.keys(LANGS).map((code) => (
                  <button
                    key={code}
                    onClick={() => chooseLanguage(code)}
                    className={`px-6 py-3 rounded-xl font-semibold text-white transition ${
                      code === "en"
                        ? "bg-sky-600 hover:bg-sky-700"
                        : code === "hi"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-pink-600 hover:bg-pink-700"
                    }`}
                  >
                    {code === "en"
                      ? "English"
                      : code === "hi"
                      ? "हिन्दी"
                      : "தமிழ்"}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {lang && (
        <>
          {/* 🌐 Floating Language Switcher */}
          <div className="absolute top-6 right-6 z-40 flex items-center gap-2 bg-white border rounded-lg shadow-md px-3 py-1 hover:shadow-lg transition">
            <span>🌐</span>
            <select
              value={lang}
              onChange={(e) => chooseLanguage(e.target.value)}
              className="bg-transparent focus:outline-none text-gray-700 font-medium cursor-pointer"
            >
              {Object.keys(LANGS).map((code) => (
                <option key={code} value={code}>
                  {code === "en"
                    ? "English"
                    : code === "hi"
                    ? "हिन्दी"
                    : "தமிழ்"}
                </option>
              ))}
            </select>
          </div>

          {/* 🎯 Hero Section */}
          <section className="flex-1 flex flex-col justify-center items-center text-center px-6 py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/40 to-sky-100/20 blur-3xl -z-10" />

            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-sky-700 leading-tight"
            >
              {t.appName}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-lg sm:text-xl md:text-2xl text-gray-700 max-w-3xl"
            >
              {t.tagline}
            </motion.p>

            {/* 🚀 CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-12 flex flex-col sm:flex-row gap-5"
            >
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl font-semibold shadow-lg bg-sky-600 text-white hover:bg-sky-700 hover:scale-105 transition"
              >
                {t.login}
              </Link>

              <Link
                to="/register"
                className="px-6 py-3 rounded-xl font-semibold shadow-lg border border-sky-600 text-sky-700 hover:bg-sky-50 hover:scale-105 transition"
              >
                {t.register}
              </Link>

              <button
                onClick={() => enableGuestAndNavigate("/dashboard")}
                className="px-6 py-3 rounded-xl font-semibold shadow-lg bg-yellow-500 text-white hover:bg-yellow-600 hover:scale-105 transition"
              >
                {t.guest}
              </button>
            </motion.div>

            {/* 🆕 Guest Quick Access */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-14 w-full max-w-3xl bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-lg font-semibold text-sky-700 mb-6">
                {t.quickAccess}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <button
                  onClick={() => enableGuestAndNavigate("/emergency")}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-red-50 hover:bg-red-100 shadow-md hover:shadow-lg transition"
                >
                  <AlertTriangle className="text-red-500 mb-3" size={40} />
                  <span className="font-semibold text-gray-800">
                    {t.emergency}
                  </span>
                </button>

                <button
                  onClick={() => enableGuestAndNavigate("/symptoms")}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-sky-50 hover:bg-sky-100 shadow-md hover:shadow-lg transition"
                >
                  <HeartPulse className="text-sky-500 mb-3" size={40} />
                  <span className="font-semibold text-gray-800">
                    {t.symptoms}
                  </span>
                </button>

                <button
                  onClick={() => enableGuestAndNavigate("/hospital")}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-green-50 hover:bg-green-100 shadow-md hover:shadow-lg transition"
                >
                  <Hospital className="text-green-500 mb-3" size={40} />
                  <span className="font-semibold text-gray-800">
                    {t.hospital}
                  </span>
                </button>
              </div>
            </motion.div>
          </section>

          {/* 🔻 Footer */}
          <footer className="bg-sky-700 text-white py-6 text-center text-sm">
            <p>
              © {new Date().getFullYear()} {t.appName}.{" "}
              <span className="font-semibold">{t.footer}</span>.
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
