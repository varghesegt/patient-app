import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, Info } from "lucide-react";
import { LanguageContext } from "../context/LanguageContext";

const LANGS = {
  en: {
    title: "Get in Touch",
    desc: "Have questions or need support? Reach out to our team we're here to help you 24/7.",
    callUs: "Call Us",
    email: "Email",
    visitUs: "Visit Us",
    sendMsg: "Send a Message",
    yourName: "Your Name",
    yourEmail: "Your Email",
    yourMessage: "Your Message",
    btnSend: "Send Message",
    success: "Thank you! Your message has been sent successfully.",
    disclaimer: "Disclaimer:",
    disclaimerText:
      "The contact form is meant for support and queries only. In case of emergencies, please call 108 or visit the nearest hospital.",
  },
  hi: {
    title: "संपर्क करें",
    desc: "क्या आपके पास प्रश्न हैं या सहायता चाहिए? हमारी टीम से संपर्क करें हम आपकी सहायता के लिए 24/7 उपलब्ध हैं।",
    callUs: "कॉल करें",
    email: "ईमेल",
    visitUs: "हमसे मिलें",
    sendMsg: "संदेश भेजें",
    yourName: "आपका नाम",
    yourEmail: "आपका ईमेल",
    yourMessage: "आपका संदेश",
    btnSend: "संदेश भेजें",
    success: "धन्यवाद! आपका संदेश सफलतापूर्वक भेज दिया गया है।",
    disclaimer: "अस्वीकरण:",
    disclaimerText:
      "संपर्क फ़ॉर्म केवल प्रश्नों और सहायता के लिए है। आपात स्थिति में 108 पर कॉल करें या निकटतम अस्पताल जाएं।",
  },
  ta: {
    title: "எங்களை தொடர்பு கொள்ளவும்",
    desc: "உங்களுக்கு கேள்விகள் அல்லது உதவி தேவையா? எங்களை 24/7 தொடர்பு கொள்ளுங்கள் நாங்கள் உதவ தயாராக உள்ளோம்.",
    callUs: "அழைக்கவும்",
    email: "மின்னஞ்சல்",
    visitUs: "எங்களைச் சந்திக்கவும்",
    sendMsg: "செய்தி அனுப்பு",
    yourName: "உங்கள் பெயர்",
    yourEmail: "உங்கள் மின்னஞ்சல்",
    yourMessage: "உங்கள் செய்தி",
    btnSend: "செய்தி அனுப்பு",
    success: "நன்றி! உங்கள் செய்தி வெற்றிகரமாக அனுப்பப்பட்டது.",
    disclaimer: "குறிப்பு:",
    disclaimerText:
      "இந்த தொடர்பு படிவம் ஆதரவு மற்றும் கேள்விகளுக்காக மட்டுமே. அவசர சூழ்நிலைகளில் 108 அழைக்கவும் அல்லது அருகிலுள்ள மருத்துவமனைக்கு செல்லவும்.",
  },
};

export default function Contact() {
  const { lang } = useContext(LanguageContext);
  const t = LANGS[lang] || LANGS.en;
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-100 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center px-6 pt-16 sm:pt-24"
      >
        <h1 className="text-[clamp(2.25rem,6vw,4rem)] font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <p className="mt-5 text-gray-700 max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed">
          {t.desc}
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto mt-16 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            icon: <Phone className="w-6 h-6 text-indigo-600" />,
            title: t.callUs,
            info: "+91 78718 44464",
            link: "tel:+917871844464",
            glow: "from-indigo-500/20 to-sky-400/10",
          },
          {
            icon: <Mail className="w-6 h-6 text-red-500" />,
            title: t.email,
            info: "varghese.gt.dev@gmail.com",
            link: "mailto:varghese.gt.dev@gmail.com",
            glow: "from-pink-500/20 to-red-400/10",
          },
          {
            icon: <MapPin className="w-6 h-6 text-green-500" />,
            title: t.visitUs,
            info: "Medin360, Trichy, India",
            link: "https://goo.gl/maps/example",
            glow: "from-green-500/20 to-emerald-400/10",
          },
        ].map((card, i) => (
          <motion.a
            key={i}
            href={card.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="relative group rounded-3xl bg-white/50 backdrop-blur-xl p-8 shadow-xl border border-white/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.glow} opacity-0 group-hover:opacity-100 blur-2xl transition duration-700`}
            />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="p-3 bg-white/70 rounded-full shadow-inner">{card.icon}</div>
              <h4 className="mt-3 font-semibold text-indigo-700">{card.title}</h4>
              <p className="mt-1 text-gray-700">{card.info}</p>
            </div>
          </motion.a>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-16 mx-4 sm:mx-10 lg:mx-20 flex items-start gap-4 bg-gradient-to-r from-amber-50 to-yellow-100 border border-yellow-200 rounded-2xl shadow-lg p-6"
      >
        <Info className="w-7 h-7 text-yellow-600 shrink-0" />
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
          <span className="font-semibold">{t.disclaimer}</span> {t.disclaimerText}
        </p>
      </motion.div>

      <div className="h-16"></div>
    </div>
  );
}
