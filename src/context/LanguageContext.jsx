import React, { createContext, useState, useEffect, useMemo } from "react";
const LANGS = {
  en: {
    nav: {
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
    home: {
      title: "MediLink360",
      tagline: "Your personal health assistant...",
      login: "Login",
      register: "Register",
      guest: "Continue as Guest",
    },
  },
  hi: {
    nav: {
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
    home: {
      title: "MediLink360",
      tagline: "आपका व्यक्तिगत स्वास्थ्य सहायक...",
      login: "लॉगिन",
      register: "रजिस्टर",
      guest: "अतिथि के रूप में जारी रखें",
    },
  },
  ta: {
    nav: {
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
    home: {
      title: "MediLink360",
      tagline: "உங்கள் தனிப்பட்ட ஆரோக்கிய உதவியாளர்...",
      login: "உள்நுழைய",
      register: "பதிவு",
      guest: "விருந்தினராக தொடரவும்",
    },
  },
};

export const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: LANGS.en,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const t = useMemo(() => LANGS[lang] || LANGS.en, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
