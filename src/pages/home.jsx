import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, Stethoscope, AlertTriangle, Users } from "lucide-react";

// 🗣️ Supported languages
const LANGS = {
  en: {
    appName: "MediLink360",
    tagline:
      "Your personal health assistant. Check symptoms, get instant emergency support, and connect with doctors — all in one platform.",
    login: "Login",
    register: "Register",
    guest: "Continue as Guest",
    features: [
      { title: "Symptom Checker", desc: "AI-powered triage to guide your next steps.", icon: <HeartPulse className="mx-auto text-sky-500" size={40} /> },
      { title: "Emergency SOS", desc: "Get instant help and live ambulance tracking.", icon: <AlertTriangle className="mx-auto text-red-500" size={40} /> },
      { title: "Doctor Connect", desc: "Consult certified doctors online 24/7.", icon: <Stethoscope className="mx-auto text-green-500" size={40} /> },
      { title: "For Everyone", desc: "Patients, caregivers, or guests — MediLink360 is here for you.", icon: <Users className="mx-auto text-purple-500" size={40} /> },
    ],
    footer: "Built for Better Health Access",
    chooseLang: "Choose Your Language",
  },
  hi: {
    appName: "मेडिलिंक360",
    tagline:
      "आपका व्यक्तिगत स्वास्थ्य सहायक। लक्षण जांचें, तुरंत आपातकालीन सहायता पाएं और डॉक्टरों से जुड़ें — सब एक ही प्लेटफ़ॉर्म पर।",
    login: "लॉगिन",
    register: "रजिस्टर",
    guest: "अतिथि के रूप में जारी रखें",
    features: [
      { title: "लक्षण चेकर", desc: "AI आधारित जांच जो आपके अगले कदमों का मार्गदर्शन करेगी।", icon: <HeartPulse className="mx-auto text-sky-500" size={40} /> },
      { title: "आपातकालीन SOS", desc: "तुरंत मदद पाएं और लाइव एम्बुलेंस ट्रैकिंग।", icon: <AlertTriangle className="mx-auto text-red-500" size={40} /> },
      { title: "डॉक्टर कनेक्ट", desc: "24/7 प्रमाणित डॉक्टरों से ऑनलाइन परामर्श करें।", icon: <Stethoscope className="mx-auto text-green-500" size={40} /> },
      { title: "सबके लिए", desc: "मरीज, देखभालकर्ता या अतिथि — MediLink360 आपके लिए है।", icon: <Users className="mx-auto text-purple-500" size={40} /> },
    ],
    footer: "बेहतर स्वास्थ्य पहुंच के लिए निर्मित",
    chooseLang: "अपनी भाषा चुनें",
  },
  ta: {
    appName: "மெடிலிங்க்360",
    tagline:
      "உங்கள் தனிப்பட்ட சுகாதார உதவியாளர். அறிகுறிகளை சரிபார்க்கவும், உடனடி அவசர உதவியைப் பெறவும், மருத்துவர்களுடன் இணைக்கவும் — அனைத்தும் ஒரே தளத்தில்.",
    login: "உள்நுழைய",
    register: "பதிவு செய்யவும்",
    guest: "விருந்தினராக தொடரவும்",
    features: [
      { title: "அறிகுறி பரிசோதகர்", desc: "அடுத்த படிகளை வழிகாட்டும் AI இயக்கம்.", icon: <HeartPulse className="mx-auto text-sky-500" size={40} /> },
      { title: "அவசர SOS", desc: "உடனடி உதவி மற்றும் நேரடி ஆம்புலன்ஸ் கண்காணிப்பு.", icon: <AlertTriangle className="mx-auto text-red-500" size={40} /> },
      { title: "மருத்துவர் இணைப்பு", desc: "சான்றளிக்கப்பட்ட மருத்துவர்களுடன் 24/7 ஆன்லைன் ஆலோசனை.", icon: <Stethoscope className="mx-auto text-green-500" size={40} /> },
      { title: "அனைவருக்கும்", desc: "நோயாளிகள், பராமரிப்பாளர்கள் அல்லது விருந்தினர்கள் — MediLink360 உங்களுக்காக.", icon: <Users className="mx-auto text-purple-500" size={40} /> },
    ],
    footer: "சிறந்த சுகாதார அணுகலுக்காக உருவாக்கப்பட்டது",
    chooseLang: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
  },
};

export default function Home() {
  const [lang, setLang] = useState(localStorage.getItem("lang") || null);

  // Auto-detect browser language
  useEffect(() => {
    if (!lang) {
      const browserLang = navigator.language.slice(0, 2);
      if (LANGS[browserLang]) setLang(browserLang);
    }
  }, [lang]);

  const chooseLanguage = (code) => {
    setLang(code);
    localStorage.setItem("lang", code);
  };

  const t = lang ? LANGS[lang] : LANGS.en;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-white to-sky-100 relative">
      {/* Language Modal */}
      <AnimatePresence>
        {!lang && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm text-center"
            >
              <h2 className="text-2xl font-bold text-sky-700 mb-6">🌐 {t.chooseLang}</h2>
              <div className="flex flex-col gap-4">
                {Object.keys(LANGS).map((code) => (
                  <button
                    key={code}
                    onClick={() => chooseLanguage(code)}
                    className={`px-6 py-3 rounded-xl font-semibold text-white transition ${
                      code === "en" ? "bg-sky-600 hover:bg-sky-700" :
                      code === "hi" ? "bg-green-600 hover:bg-green-700" :
                      "bg-pink-600 hover:bg-pink-700"
                    }`}
                  >
                    {code === "en" ? "English" : code === "hi" ? "हिन्दी" : "தமிழ்"}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {lang && (
        <>
          {/* Floating Language Switcher */}
          <div className="absolute top-6 right-6 z-40 flex items-center gap-2 bg-white border rounded-lg shadow-md px-3 py-1 hover:shadow-lg transition">
            <span>🌐</span>
            <select
              value={lang}
              onChange={(e) => chooseLanguage(e.target.value)}
              className="bg-transparent focus:outline-none text-gray-700 font-medium cursor-pointer"
            >
              {Object.keys(LANGS).map((code) => (
                <option key={code} value={code}>
                  {code === "en" ? "English" : code === "hi" ? "हिन्दी" : "தமிழ்"}
                </option>
              ))}
            </select>
          </div>

          {/* Hero Section */}
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

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-12 flex flex-col sm:flex-row gap-5"
            >
              {["login", "register", "guest"].map((key, idx) => (
                <Link
                  key={key}
                  to={key === "guest" ? "#" : `/${key}`}
                  className={`px-6 py-3 rounded-xl font-semibold shadow-lg hover:scale-105 transition ${
                    key === "login"
                      ? "bg-sky-600 text-white hover:bg-sky-700"
                      : key === "register"
                      ? "border border-sky-600 text-sky-700 hover:bg-sky-50"
                      : "bg-yellow-500 text-white hover:bg-yellow-600"
                  }`}
                >
                  {t[key]}
                </Link>
              ))}
            </motion.div>
          </section>

          {/* Features Section */}
          <section className="bg-white py-20 px-6">
            <div className="max-w-6xl mx-auto grid gap-10 sm:grid-cols-2 lg:grid-cols-4 text-center">
              {t.features.map((f, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 150 }}
                  className="p-6 bg-sky-50 rounded-xl shadow-md hover:shadow-xl transition"
                >
                  {f.icon}
                  <h3 className="mt-4 text-lg font-bold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-sky-700 text-white py-6 text-center text-sm">
            <p>
              © {new Date().getFullYear()} {t.appName}. <span className="font-semibold">{t.footer}</span>.
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
