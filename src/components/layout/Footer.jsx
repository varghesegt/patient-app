"use client";
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LanguageContext } from "../../context/LanguageContext";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  HeartPulse,
} from "lucide-react";
const translations = {
  en: {
    quickLinks: "Quick Links",
    contact: "Contact",
    newsletter: "Newsletter",
    rights: "All rights reserved",
    subscribePlaceholder: "Enter your email",
    subscribeBtn: "Subscribe",
    address: "Medin360 HQ, Chennai, India",
    tagline: "Empowering Smarter, Faster & Connected Healthcare",
  },
  hi: {
    quickLinks: "त्वरित लिंक",
    contact: "संपर्क करें",
    newsletter: "न्यूज़लेटर",
    rights: "सर्वाधिकार सुरक्षित",
    subscribePlaceholder: "अपना ईमेल दर्ज करें",
    subscribeBtn: "सदस्यता लें",
    address: "मेडिन360 मुख्यालय, चेन्नई, भारत",
    tagline: "स्मार्ट, तेज़ और कनेक्टेड हेल्थकेयर को सशक्त बनाना",
  },
  ta: {
    quickLinks: "விரைவு இணைப்புகள்",
    contact: "தொடர்பு கொள்ள",
    newsletter: "செய்திமடல்",
    rights: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டுள்ளன",
    subscribePlaceholder: "உங்கள் மின்னஞ்சலை உள்ளிடவும்",
    subscribeBtn: "சந்தா",
    address: "மெடின்360 தலைமையகம், சென்னை, இந்தியா",
    tagline: "செயல்திறனான, வேகமான மற்றும் இணைக்கப்பட்ட சுகாதாரம்",
  },
};

export default function Footer() {
  const { lang } = useContext(LanguageContext);
  const t = translations[lang] || translations.en;

  const quickLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Hospitals", to: "/hospital" },
    { label: "Emergency", to: "/emergency" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0b1326] text-gray-300 border-t border-sky-800/60 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.15),transparent_70%)] pointer-events-none"></div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-1 md:grid-cols-3 gap-10 z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <motion.img
              whileHover={{ rotate: 8, scale: 1.05 }}
              src="/logo.png"
              alt="Medin360"
              className="w-11 h-11 rounded-xl shadow-lg"
            />
            <h3 className="text-2xl font-extrabold text-white tracking-wide">
              Medin360
            </h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-400 max-w-sm">
            {t.tagline}. <br />
            <span className="text-yellow-300 font-medium">
              <HeartPulse className="inline-block w-4 h-4 mb-1 mr-1 text-yellow-300 animate-pulse" />
              AI-Powered Health • Voice Navigation • Smart Emergency
            </span>
          </p>
          <div className="flex gap-3 mt-5">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ scale: 1.2, y: -2 }}
                className="p-2 bg-sky-900/40 hover:bg-sky-700/70 rounded-lg transition"
              >
                <Icon size={18} className="text-gray-200" />
              </motion.a>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <h4 className="text-xl font-semibold text-white mb-5 border-b border-sky-800/50 pb-2">
            {t.quickLinks}
          </h4>
          <ul className="space-y-2">
            {quickLinks.map(({ label, to }) => (
              <li key={label}>
                <Link
                  to={to}
                  className="inline-flex items-center gap-2 text-sm hover:text-yellow-300 transition-all duration-300 group"
                >
                  <span className="text-yellow-400 opacity-0 group-hover:opacity-100 transition">➜</span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
      <div className="border-t border-sky-800/40 py-4 text-center text-xs text-gray-400 bg-[#0b1326]/70 backdrop-blur-md">
        © {new Date().getFullYear()} <span className="text-yellow-300 font-semibold">Medin360</span> — {t.rights}.
      </div>
    </footer>
  );
}
