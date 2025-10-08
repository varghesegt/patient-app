import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, Info } from "lucide-react";
import { LanguageContext } from "../context/LanguageContext";

const LANGS = {
  en: {
    title: "Get in Touch",
    desc: "Have questions or need support? Reach out to our team and we will respond promptly.",
    callUs: "Call Us",
    email: "Email",
    visitUs: "Visit Us",
    sendMsg: "Send a Message",
    yourName: "Your Name",
    yourEmail: "Your Email",
    yourMessage: "Your Message",
    btnSend: "Send Message",
    success: "Thank you! Your message has been sent.",
    disclaimer: "Disclaimer:",
    disclaimerText:
      "Contact form submissions are for queries and support only. In case of emergencies, call 108 or visit the nearest hospital.",
  },
  hi: {
    title: "संपर्क करें",
    desc: "क्या आपके पास प्रश्न हैं या सहायता चाहिए? हमारी टीम से संपर्क करें, हम शीघ्र ही जवाब देंगे।",
    callUs: "कॉल करें",
    email: "ईमेल",
    visitUs: "हमसे मिलें",
    sendMsg: "संदेश भेजें",
    yourName: "आपका नाम",
    yourEmail: "आपका ईमेल",
    yourMessage: "आपका संदेश",
    btnSend: "संदेश भेजें",
    success: "धन्यवाद! आपका संदेश भेज दिया गया है।",
    disclaimer: "अस्वीकरण:",
    disclaimerText:
      "संपर्क फ़ॉर्म केवल प्रश्नों और सहायता के लिए है। आपात स्थिति में, 108 पर कॉल करें या निकटतम अस्पताल जाएं।",
  },
  ta: {
    title: "எங்களை தொடர்பு கொள்ளவும்",
    desc: "உங்களுக்கு கேள்விகள் அல்லது ஆதரவு தேவையா? எங்களை தொடர்பு கொள்ளுங்கள், நாங்கள் விரைவில் பதிலளிப்போம்.",
    callUs: "அழைக்கவும்",
    email: "மின்னஞ்சல்",
    visitUs: "எங்களைச் சந்திக்கவும்",
    sendMsg: "செய்தி அனுப்பு",
    yourName: "உங்கள் பெயர்",
    yourEmail: "உங்கள் மின்னஞ்சல்",
    yourMessage: "உங்கள் செய்தி",
    btnSend: "செய்தி அனுப்பு",
    success: "நன்றி! உங்கள் செய்தி அனுப்பப்பட்டது.",
    disclaimer: "குறிப்பு:",
    disclaimerText:
      "தொடர்பு படிவம் கேள்விகள் மற்றும் ஆதரவுக்காக மட்டுமே. அவசர நிலைகளில், 108 அழைக்கவும் அல்லது அருகிலுள்ள மருத்துவமனைக்கு செல்லவும்.",
  },
};

export default function Contact() {
  const { lang } = useContext(LanguageContext);
  const t = LANGS[lang] || LANGS.en;

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-sky-50 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center px-6 pt-16 sm:pt-24"
      >
        <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <p className="mt-5 text-gray-700 max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed">
          {t.desc}
        </p>
      </motion.div>

      {/* Contact Info Cards */}
      <div className="max-w-6xl mx-auto mt-16 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            icon: <Phone className="w-6 h-6 text-indigo-600" />,
            title: t.callUs,
            info: "+91 1234 567 890",
            link: "tel:+911234567890",
            bg: "bg-white/70",
          },
          {
            icon: <Mail className="w-6 h-6 text-red-500" />,
            title: t.email,
            info: "support@medilink360.com",
            link: "mailto:support@healthapp.com",
            bg: "bg-white/70",
          },
          {
            icon: <MapPin className="w-6 h-6 text-green-500" />,
            title: t.visitUs,
            info: "123 Health St, Bengaluru, India",
            link: "https://goo.gl/maps/example",
            bg: "bg-white/70",
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
            className={`flex flex-col items-center justify-center p-6 rounded-2xl ${card.bg} backdrop-blur-lg border border-gray-200 shadow-lg hover:scale-105 transition-transform`}
          >
            {card.icon}
            <h4 className="mt-3 font-semibold text-indigo-700">{card.title}</h4>
            <p className="mt-1 text-gray-700 text-center">{card.info}</p>
          </motion.a>
        ))}
      </div>

      {/* Disclaimer */}
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
