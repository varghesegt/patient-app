import React, { useContext } from "react";
import SymptomForm from "../components/triage/SymptomForm";
import { motion } from "framer-motion";
import { Stethoscope, Info } from "lucide-react";
import { LanguageContext } from "../context/LanguageContext";

const LANGS = {
  en: {
    title: "Symptom Checker",
    subtitle: `Describe your health condition, and let our 
      AI-powered triage guide you with personalized risk levels 
      and suggested next steps.`,
    disclaimer: `Disclaimer: This tool provides initial guidance only and 
      is not a substitute for professional medical advice. 
      If you feel unwell, please seek medical help immediately.`,
  },
  hi: {
    title: "लक्षण जाँचकर्ता",
    subtitle: `अपनी स्वास्थ्य स्थिति का वर्णन करें और हमारी 
      एआई-संचालित त्रायेज आपको व्यक्तिगत जोखिम स्तर और सुझाए गए 
      अगले कदमों के साथ मार्गदर्शन करेगी।`,
    disclaimer: `अस्वीकरण: यह उपकरण केवल प्रारंभिक मार्गदर्शन प्रदान करता है 
      और पेशेवर चिकित्सा सलाह का विकल्प नहीं है। 
      यदि आप अस्वस्थ महसूस कर रहे हैं, तो कृपया तुरंत चिकित्सा सहायता लें।`,
  },
  ta: {
    title: "அறிகுறி சரிபார்ப்பான்",
    subtitle: `உங்கள் உடல்நிலை பற்றி விவரிக்கவும், எங்கள் 
      செயற்கை நுண்ணறிவு அடிப்படையிலான தாயரேஜ் 
      உங்களுக்கு தனிப்பட்ட ஆபத்து நிலைகள் மற்றும் பரிந்துரைக்கப்பட்ட 
      அடுத்த படிகளை வழிகாட்டும்.`,
    disclaimer: `பொறுப்புத்துறப்பு: இந்த கருவி ஆரம்ப வழிகாட்டுதலை மட்டுமே வழங்குகிறது 
      மற்றும் தொழில்முறை மருத்துவ ஆலோசனைக்கு மாற்றாகாது. 
      நீங்கள் உடல்நலக் குறைவாக உணர்ந்தால், உடனடியாக மருத்துவ உதவியை நாடுங்கள்.`,
  },
};

export default function Symptoms() {
  const { lang } = useContext(LanguageContext);
  const t = LANGS[lang] || LANGS.en;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-sky-50 
                    transition-colors text-gray-900 flex flex-col">
      {/* Page Heading */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center px-6 pt-12 sm:pt-20"
      >
        {/* Icon with Glow */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 blur-3xl bg-sky-400/40 
                            rounded-full animate-pulse" />
            <Stethoscope className="w-20 h-20 sm:w-24 sm:h-24 relative 
                                    text-sky-600 drop-shadow-lg" />
          </motion.div>
        </div>

        {/* Title */}
        <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold 
                       tracking-tight leading-tight bg-gradient-to-r 
                       from-sky-600 to-sky-400 bg-clip-text text-transparent">
          {t.title}
        </h2>

        {/* Subtitle */}
        <p className="mt-5 text-gray-700 max-w-2xl mx-auto 
                      text-[clamp(0.95rem,2vw,1.15rem)] leading-relaxed">
          {t.subtitle}
        </p>
      </motion.div>

      {/* Symptom Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full mt-12 sm:mt-16 lg:mt-20 rounded-3xl 
                   bg-white/80 backdrop-blur-xl shadow-2xl border border-sky-100/70 
                   p-6 sm:p-10 md:p-12 mx-auto max-w-4xl"
      >
        {/* Gradient Glow */}
        <div className="absolute inset-0 bg-gradient-to-br 
                        from-sky-100/40 via-transparent to-sky-50/20 
                        pointer-events-none rounded-3xl" />
        <SymptomForm />
      </motion.div>

      {/* Tips & Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="mt-10 sm:mt-14 mx-4 sm:mx-10 lg:mx-20 flex items-start gap-4 
                   bg-gradient-to-r from-amber-50/80 to-yellow-100/90 
                   border border-yellow-200/70 
                   rounded-2xl shadow-lg p-5 sm:p-6 md:p-7"
      >
        <Info className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600 shrink-0" />
        <p className="text-[clamp(0.85rem,2vw,1rem)] text-gray-700 leading-relaxed">
          {t.disclaimer}
        </p>
      </motion.div>

      <div className="h-10 sm:h-16" />
    </div>
  );
}
