// src/contexts/LanguageContext.jsx
import React, { createContext, useState, useEffect, useMemo } from "react";

/* =========================
   Translation Strings
========================= */
const LANGS = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      contact: "Contact",
      login: "Login",
      guest: "Guest",
      hospital: "Hospital",
      symptoms: "Symptoms",
      emergency: "Emergency",
      profile: "Profile",
      logout: "Logout",
    },
  },
  hi: {
    nav: {
      home: "होम",
      about: "हमारे बारे में",
      contact: "संपर्क करें",
      login: "लॉगिन",
      guest: "अतिथि",
      hospital: "अस्पताल",
      symptoms: "लक्षण",
      emergency: "आपातकालीन",
      profile: "प्रोफ़ाइल",
      logout: "लॉग आउट",
    },
  },
  ta: {
    nav: {
      home: "முகப்பு",
      about: "எங்களைப்பற்றி",
      contact: "தொடர்பு",
      login: "உள்நுழைய",
      guest: "விருந்தினர்",
      hospital: "மருத்துவமனை",
      symptoms: "அறிகுறிகள்",
      emergency: "அவசரம்",
      profile: "சுயவிவரம்",
      logout: "வெளியேறு",
    },
  },
};

/* =========================
   Context Setup
========================= */
export const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: LANGS.en,
});

/* =========================
   Language Provider
========================= */
export function LanguageProvider({ children }) {
  // Initialize language from localStorage or default to English
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");

  // Persist language selection in localStorage
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // Memoize translations to avoid unnecessary re-renders
  const t = useMemo(() => LANGS[lang] || LANGS.en, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
