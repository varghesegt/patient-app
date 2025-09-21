// src/pages/Home.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  AlertTriangle,
  Hospital,
  Globe,
} from "lucide-react";
import { LanguageContext } from "../context/LanguageContext";

// === Multilingual Support ===
const LANGS = {
  en: {
    appName: "MediLink360",
    tagline:
      "Your personal health assistant. Check symptoms, get instant emergency support, and connect with doctors all in one platform.",
    login: "Login",
    register: "Register",
    guest: "Continue as Guest",
    quickAccess: "Quick Access (Guest Mode)",
    emergency: "Emergency SOS",
    symptoms: "Check Symptoms",
    hospital: "Nearby Hospitals",
    footer: "Built for Better Health Access",
    chooseLang: "Choose Your Language",
    install: "📲 Install MediLink360",
    iosTip: "📲 To install: Tap Share → Add to Home Screen",
    offline: "is offline. Some features may be limited.",
  },
  hi: {
    appName: "मेडी लिंक 360",
    tagline:
      "आपका व्यक्तिगत स्वास्थ्य सहायक। लक्षण जांचें, तुरंत आपातकालीन सहायता प्राप्त करें, और डॉक्टरों से जुड़ें सब कुछ एक ही प्लेटफ़ॉर्म पर।",
    login: "लॉगिन",
    register: "रजिस्टर",
    guest: "अतिथि के रूप में जारी रखें",
    quickAccess: "त्वरित पहुँच (गेस्ट मोड)",
    emergency: "आपातकालीन SOS",
    symptoms: "लक्षण जांचें",
    hospital: "नज़दीकी अस्पताल",
    footer: "बेहतर स्वास्थ्य पहुँच के लिए बनाया गया",
    chooseLang: "अपनी भाषा चुनें",
    install: "📲 इंस्टॉल करें MediLink360",
    iosTip: "📲 इंस्टॉल करने के लिए: शेयर → Add to Home Screen",
    offline: "ऑफ़लाइन है। कुछ सुविधाएँ सीमित हो सकती हैं।",
  },
  ta: {
    appName: "மெடிலிங்க்360",
    tagline:
      "உங்களின் தனிப்பட்ட சுகாதார உதவியாளர். அறிகுறிகளைச் சரிபார்க்கவும், அவசர உதவியை உடனடியாகப் பெறவும், மற்றும் மருத்தவர்களைத் தொடர்புகொள்ளவும் அனைத்தும் ஒரே தளத்தில்.",
    login: "உள்நுழைக",
    register: "பதிவு செய்க",
    guest: "விருந்தினராக தொடரவும்",
    quickAccess: "விரைவான அணுகல் (விருந்தினர்)",
    emergency: "அவசர SOS",
    symptoms: "அறிகுறிகள் பார்க்க",
    hospital: "அருகிலுள்ள மருத்துவமனைகள்",
    footer: "சிறந்த சுகாதார அணுகலுக்காக உருவாக்கப்பட்டது",
    chooseLang: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    install: "📲 நிறுவுக MediLink360",
    iosTip: "📲 நிறுவ: பகிர்வு → முகப்பு திரைக்கு சேர்",
    offline: "ஆஃப்லைனில் உள்ளது. சில அம்சங்கள் வேலை செய்யாமல் இருக்கலாம்.",
  },
};

export default function Home() {
  const navigate = useNavigate();
  const { lang, setLang } = useContext(LanguageContext);

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const t = LANGS[lang] || LANGS.en;

  // Detect browser language if none set
  useEffect(() => {
    if (!lang) {
      const browserLang = navigator.language.slice(0, 2);
      setLang(LANGS[browserLang] ? browserLang : "en");
    }
  }, [lang, setLang]);

  // Install + iOS handling
  useEffect(() => {
    const isIos = /iphone|ipad|ipod/.test(
      window.navigator.userAgent.toLowerCase()
    );
    const isInStandalone = window.navigator.standalone === true;

    if (isIos && !isInStandalone) {
      setShowIosBanner(true);
      setShowInstall(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      console.log("✅ MediLink360 installed");
      setShowInstall(false);
      setShowIosBanner(false);
    });

    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstall(false);
    } else if (showIosBanner) {
      alert(t.iosTip);
    }
  };

  const chooseLanguage = (code) => {
    setLang(code);
    localStorage.setItem("lang", code);
  };

  const enableGuestAndNavigate = (path) => {
    localStorage.setItem("guest", "true");
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-white to-sky-100 relative">
      {/* === Offline Banner === */}
<AnimatePresence>
  {isOffline && (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed top-0 inset-x-0 bg-red-600 text-white py-2 px-4 flex items-center justify-between text-sm z-50"
    >
      <span>⚠️ {t.appName} {t.offline}</span>
      <button
        onClick={() => setIsOffline(false)}
        className="ml-4 text-white hover:text-gray-200 font-bold text-lg"
      >
        ×
      </button>
    </motion.div>
  )}
</AnimatePresence>


      {/* === iOS Install Banner === */}
      <AnimatePresence>
        {showIosBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 inset-x-0 bg-gray-900 text-white py-3 px-4 text-center text-sm z-50"
          >
            {t.iosTip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Selection Modal (only if no language set yet) */}
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
                <button
                  onClick={() => chooseLanguage("en")}
                  className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                >
                  English
                </button>
                <button
                  onClick={() => chooseLanguage("hi")}
                  className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => chooseLanguage("ta")}
                  className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold"
                >
                  தமிழ்
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {lang && (
        <>
          {/* Floating Language Switcher */}
          <div className="absolute top-6 right-6 z-40 flex items-center gap-2 bg-white border rounded-lg shadow-md px-3 py-1 hover:shadow-lg transition">
            <Globe className="w-4 h-4 text-sky-600" />
            <select
              value={lang}
              onChange={(e) => chooseLanguage(e.target.value)}
              className="bg-transparent focus:outline-none text-gray-700 font-medium cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>

          {/* Hero Section */}
          <section className="flex-1 flex flex-col justify-center items-center text-center px-6 py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/40 to-sky-100/20 blur-3xl -z-10" />

            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-sky-700 leading-tight"

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

            {/* CTA Buttons */}
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
            </motion.div>

            {/* Guest Quick Access */}
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

          {/* Install Button */}
          <AnimatePresence>
            {showInstall && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={handleInstall}
                className="fixed bottom-6 right-6 px-5 py-3 bg-sky-600 text-white font-semibold rounded-xl shadow-lg hover:bg-sky-700 hover:scale-105 transition z-50"
              >
                {t.install}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Footer */}
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
