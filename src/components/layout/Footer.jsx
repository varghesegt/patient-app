import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { LanguageContext } from "../../context/LanguageContext";

const translations = {
  en: {
    quickLinks: "Quick Links",
    contact: "Contact",
    newsletter: "Newsletter",
    rights: "All rights reserved",
    subscribePlaceholder: "Enter your email",
    subscribeBtn: "Subscribe",
    address: "MediLink360 HQ, Chennai, India",
  },
  hi: {
    quickLinks: "त्वरित लिंक",
    contact: "संपर्क करें",
    newsletter: "न्यूज़लेटर",
    rights: "सर्वाधिकार सुरक्षित",
    subscribePlaceholder: "अपना ईमेल दर्ज करें",
    subscribeBtn: "सदस्यता लें",
    address: "मेडीलिंक360 मुख्यालय, चेन्नई, भारत",
  },
  ta: {
    quickLinks: "விரைவு இணைப்புகள்",
    contact: "தொடர்பு கொள்ள",
    newsletter: "செய்திமடல்",
    rights: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டுள்ளன",
    subscribePlaceholder: "உங்கள் மின்னஞ்சலை உள்ளிடவும்",
    subscribeBtn: "சந்தா",
    address: "மெடிலிங்க்360 தலைமையகம், சென்னை, இந்தியா",
  },
};

export default function Footer() {
  const { lang } = useContext(LanguageContext);
  const t = translations[lang] || translations.en;

  const quickLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "Hospitals", to: "/hospital" },
    { label: "Emergency", to: "/emergency" },
  ];

  return (
    <footer className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] text-gray-300 border-t border-sky-700">
      {/* Top */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 px-6 py-12">
        {/* Column 1 — Brand & Social */}
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MediLink360" className="w-10 h-10 rounded-xl shadow-md" />
            <h3 className="text-2xl font-bold text-white">MediLink360</h3>
          </div>
          <p className="mt-3 text-sm text-gray-400 max-w-sm">
            Revolutionizing healthcare with AI-powered symptom analysis, emergency triage, and easy doctor connectivity.
          </p>
          {/* Social */}
          <div className="mt-4 flex space-x-4">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
              <motion.a
                key={idx}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-800/40 hover:bg-yellow-300 hover:text-sky-900 transition duration-300"
              >
                <Icon size={18} />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Column 2 — Quick Links */}
        <div>
          <h4 className="text-xl font-semibold text-white mb-4">{t.quickLinks}</h4>
          <ul className="space-y-2">
            {quickLinks.map(({ label, to }) => (
              <li key={label}>
                <Link
                  to={to}
                  className="hover:text-yellow-300 text-sm transition-colors duration-300 inline-flex items-center gap-1"
                >
                  ➜ {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 — Contact & Newsletter */}
        <div>
          <h4 className="text-xl font-semibold text-white mb-4">{t.contact}</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin size={16} className="text-yellow-300" />
              {t.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-yellow-300" /> +91 98765 43210
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="text-yellow-300" /> support@medilink360.com
            </li>
          </ul>
          <div className="mt-5">
            <h5 className="text-white text-sm font-medium mb-2">{t.newsletter}</h5>
            <form className="flex items-center">
              <input
                type="email"
                placeholder={t.subscribePlaceholder}
                className="w-full rounded-l-lg px-3 py-2 text-sm text-gray-900 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-300 text-sky-900 px-4 py-2 text-sm font-semibold rounded-r-lg transition duration-300"
              >
                {t.subscribeBtn}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-sky-700/50 text-sm text-gray-400 px-6 py-4 flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto">
        <span>© {new Date().getFullYear()} MediLink360 — {t.rights}</span>
        <div className="flex gap-4 mt-2 sm:mt-0 text-xs">
          <Link to="/privacy" className="hover:text-yellow-300 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-yellow-300 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
