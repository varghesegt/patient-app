// src/pages/FirstAidPage.jsx
import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageContext } from "../context/LanguageContext";

// Multi-language content
const LANGS = {
  en: {
    header: "🩺 Advanced First Aid Guide",
    desc: "A detailed, interactive reference to help you act quickly during emergencies. Use the search below to find tips by keyword or category.",
    searchPlaceholder: "🔍 Search CPR, Burns, Fractures...",
    checklistTitle: "✅ Quick Emergency Checklist",
    checklist: [
      "📞 Call emergency number immediately (112 in India)",
      "🫀 Start CPR if no pulse/breathing",
      "🩸 Control severe bleeding with firm pressure",
      "🔥 Cool burns with running water",
      "🦴 Immobilize fractures/sprains",
      "💊 Check for allergic reaction & use epinephrine if available",
    ],
    ambulanceTitle: "🚑 Need an Ambulance?",
    ambulanceDesc: "For urgent medical transport, dial 112 (India) immediately.",
    ambulanceBtn: "📞 Call 112 Now",
    hotlineTitle: "🚨 Emergency Hotline",
    hotlineDesc: "If someone is in immediate danger, call 112 (India) or your local emergency number right away.",
  },
  hi: {
    header: "🩺 उन्नत प्राथमिक चिकित्सा गाइड",
    desc: "आपात स्थिति के दौरान तुरंत कार्य करने में मदद के लिए एक विस्तृत, इंटरैक्टिव संदर्भ। नीचे दिए गए खोज का उपयोग करके टिप्स खोजें।",
    searchPlaceholder: "🔍 खोजें सीपीआर, जलने, फ्रैक्चर...",
    checklistTitle: "✅ त्वरित आपातकालीन चेकलिस्ट",
    checklist: [
      "📞 तुरंत आपातकालीन नंबर (112 भारत में) कॉल करें",
      "🫀 यदि नाड़ी/सांस नहीं है तो सीपीआर शुरू करें",
      "🩸 गंभीर रक्तस्राव को दबाव डालकर नियंत्रित करें",
      "🔥 जलन को बहते पानी से ठंडा करें",
      "🦴 फ्रैक्चर/मरोड़ को स्थिर करें",
      "💊 एलर्जी प्रतिक्रिया की जाँच करें और उपलब्ध होने पर एपिनेफ्रिन का उपयोग करें",
    ],
    ambulanceTitle: "🚑 एम्बुलेंस चाहिए?",
    ambulanceDesc: "तत्काल चिकित्सा परिवहन के लिए, तुरंत 112 (भारत) डायल करें।",
    ambulanceBtn: "📞 अभी 112 कॉल करें",
    hotlineTitle: "🚨 आपातकालीन हेल्पलाइन",
    hotlineDesc: "यदि कोई तत्काल खतरे में है, तो तुरंत 112 (भारत) या अपने स्थानीय आपातकालीन नंबर पर कॉल करें।",
  },
  ta: {
    header: "🩺 மேம்பட்ட முதலுதவி வழிகாட்டி",
    desc: "அவசர சூழலில் விரைவாக செயல்பட உதவும் விரிவான, தொடர்பாடல் குறிப்பு. கீழே உள்ள தேடலை பயன்படுத்தி குறிப்புகளைத் தேடவும்.",
    searchPlaceholder: "🔍 தேடுக CPR, எரிப்பு, எலும்பு முறிவு...",
    checklistTitle: "✅ விரைவான அவசர சோதனைப் பட்டியல்",
    checklist: [
      "📞 உடனடியாக அவசர எண் (112 இந்தியா) அழைக்கவும்",
      "🫀 துடிப்பு/மூச்சு இல்லை என்றால் சிபிஆர் தொடங்கவும்",
      "🩸 கடுமையான இரத்தப்போக்கை அழுத்தம் கொடுத்து கட்டுப்படுத்தவும்",
      "🔥 எரிப்புகளை ஓடும் நீரால் குளிர்விக்கவும்",
      "🦴 முறிவு/முடக்கு பகுதிகளை அசையாமல் வைக்கவும்",
      "💊 அலர்ஜி இருப்பதைச் சரிபார்த்து, இருந்தால் எபினெப்ரைன் பயன்படுத்தவும்",
    ],
    ambulanceTitle: "🚑 ஆம்புலன்ஸ் தேவையா?",
    ambulanceDesc: "அவசர மருத்துவப் போக்குவரத்திற்காக உடனே 112 (இந்தியா) அழைக்கவும்.",
    ambulanceBtn: "📞 உடனே 112 அழைக்கவும்",
    hotlineTitle: "🚨 அவசர ஹாட்லைன்",
    hotlineDesc: "யாராவது உடனடி ஆபத்தில் இருந்தால், 112 (இந்தியா) அல்லது உங்கள் உள்ளூர் அவசர எண் அழைக்கவும்.",
  },
};

// Tips content in all 3 languages
const TIPS = {
  en: [
    { title: "🫀 CPR Basics", category: "Life-Saving", desc: "Check responsiveness, call emergency services, and begin chest compressions. Push hard and fast at 100–120 per minute.", extra: "If trained, provide rescue breaths (30:2 ratio). Continue until help arrives." },
    { title: "🩸 Controlling Bleeding", category: "Trauma", desc: "Apply firm pressure with a cloth. Do not remove soaked layers.", extra: "Elevate injured part. Use a tourniquet only if bleeding is severe and unstoppable." },
    { title: "🔥 Burns", category: "Trauma", desc: "Cool under running water for at least 10 minutes. Remove tight items nearby.", extra: "Do not apply ice, butter, or oils. Cover loosely with a clean cloth." },
    { title: "🦴 Fractures & Sprains", category: "Trauma", desc: "Immobilize with a splint/sling. Avoid unnecessary movement.", extra: "Apply ice packs for swelling. Seek medical help immediately." },
    { title: "💊 First Aid Kit Essentials", category: "Everyday Essentials", desc: "Keep bandages, gauze, wipes, gloves, scissors, and thermometer ready.", extra: "Add pain relievers, burn ointment, tweezers, and emergency contacts." },
    { title: "🥵 Heatstroke", category: "Everyday Essentials", desc: "Move person to a cool area and hydrate immediately.", extra: "Cool body with wet cloths. Call emergency services if fainting or confusion occurs." },
    { title: "🤧 Allergic Reactions", category: "Life-Saving", desc: "Look for hives, swelling, or breathing difficulty.", extra: "Use epinephrine auto-injector if available. Call emergency services right away." },
  ],
  hi: [
    { title: "🫀 सीपीआर मूल बातें", category: "जीवन-रक्षक", desc: "प्रतिक्रिया जांचें, आपातकालीन सेवा को कॉल करें और छाती पर दबाव डालना शुरू करें। प्रति मिनट 100–120 बार तेज़ और मज़बूत दबाएँ।", extra: "यदि प्रशिक्षित हों, तो रेस्क्यू सांस (30:2 अनुपात) दें। मदद आने तक जारी रखें।" },
    { title: "🩸 रक्तस्राव नियंत्रित करना", category: "चोट", desc: "कपड़े से दृढ़ दबाव डालें। गीली परतों को न हटाएँ।", extra: "चोटिल हिस्से को ऊपर उठाएँ। केवल गंभीर और न रुकने वाले रक्तस्राव पर ही टॉर्निकेट का उपयोग करें।" },
    { title: "🔥 जलना", category: "चोट", desc: "कम से कम 10 मिनट तक बहते पानी से ठंडा करें। पास के तंग वस्त्र हटा दें।", extra: "बर्फ, मक्खन या तेल न लगाएँ। साफ कपड़े से ढीले ढकें।" },
    { title: "🦴 फ्रैक्चर और मोच", category: "चोट", desc: "स्प्लिंट/स्लिंग से स्थिर करें। अनावश्यक हिलाना-डुलाना न करें।", extra: "सूजन के लिए बर्फ पैक करें। तुरंत डॉक्टर से संपर्क करें।" },
    { title: "💊 प्राथमिक चिकित्सा किट आवश्यकताएँ", category: "दैनिक आवश्यकताएँ", desc: "बैंडेज, गॉज, वाइप्स, दस्ताने, कैंची और थर्मामीटर रखें।", extra: "दर्द निवारक, जलन मरहम, चिमटी और आपातकालीन संपर्क जोड़ें।" },
    { title: "🥵 हीटस्ट्रोक", category: "दैनिक आवश्यकताएँ", desc: "व्यक्ति को ठंडी जगह ले जाएँ और तुरंत पानी पिलाएँ।", extra: "गीले कपड़े से शरीर को ठंडा करें। बेहोशी या भ्रम की स्थिति में तुरंत आपातकालीन सेवा को कॉल करें।" },
    { title: "🤧 एलर्जिक रिएक्शन", category: "जीवन-रक्षक", desc: "पित्ती, सूजन या सांस लेने में कठिनाई देखें।", extra: "एपिनेफ्रिन इंजेक्शन का उपयोग करें यदि उपलब्ध हो। तुरंत आपातकालीन सेवा को कॉल करें।" },
  ],
  ta: [
    { title: "🫀 சிபிஆர் அடிப்படை", category: "உயிர் காப்பாற்றும்", desc: "பதிலளிப்பதை சரிபார்க்கவும், அவசர சேவைகளை அழைக்கவும், மார்பு அழுத்தங்களைத் தொடங்கவும். நிமிடத்திற்கு 100–120 முறை வலுவாக அழுத்தவும்.", extra: "பயிற்சி பெற்றிருந்தால், 30:2 விகிதத்தில் மூச்சு ஊதவும். உதவி வரும் வரை தொடரவும்." },
    { title: "🩸 இரத்தப்போக்கை கட்டுப்படுத்துதல்", category: "காயம்", desc: "துணியால் வலுவாக அழுத்தவும். நனைந்த படுகைகளை அகற்ற வேண்டாம்.", extra: "காயம் பட்ட பகுதியை உயர்த்தவும். மிகக் கடுமையான இரத்தப்போக்கு இருந்தால் மட்டுமே டூர்னிகேட் பயன்படுத்தவும்." },
    { title: "🔥 எரிச்சல்", category: "காயம்", desc: "குறைந்தது 10 நிமிடங்கள் ஓடும் நீரில் குளிர்விக்கவும். அருகிலுள்ள இறுக்கமான பொருட்களை அகற்றவும்.", extra: "பனியை, வெண்ணெயை அல்லது எண்ணெயை பயன்படுத்த வேண்டாம். சுத்தமான துணியால் தளர்வாக மூடவும்." },
    { title: "🦴 எலும்பு முறிவு மற்றும் மூட்டு", category: "காயம்", desc: "ஸ்ப்ளிண்ட்/ஸ்லிங் மூலம் அசையாமல் வைக்கவும். தேவையற்ற அசைவுகளைத் தவிர்க்கவும்.", extra: "வீக்கத்திற்காக பனிப்பொட்டிகளைப் பயன்படுத்தவும். உடனடியாக மருத்துவ உதவி பெறவும்." },
    { title: "💊 முதலுதவி பெட்டி தேவைகள்", category: "அன்றாட தேவைகள்", desc: "பட்டைகள், காஸ், துடைப்பான், கையுறைகள், கத்தரிகள் மற்றும் வெப்பமானி வைத்திருங்கள்.", extra: "வலி நிவாரணி, எரிச்சல் மருந்து, பின்செட் மற்றும் அவசர தொடர்புகளைச் சேர்க்கவும்." },
    { title: "🥵 வெப்பக்காய்ச்சல்", category: "அன்றாட தேவைகள்", desc: "நபரை குளிர்ந்த இடத்துக்கு அழைத்துச் செல்லவும் மற்றும் உடனே தண்ணீர் கொடுக்கவும்.", extra: "ஈரமான துணியால் உடலை குளிர்விக்கவும். மயக்கம் அல்லது குழப்பம் ஏற்பட்டால் உடனடியாக அவசர சேவையை அழைக்கவும்." },
    { title: "🤧 ஒவ்வாமை எதிர்வினை", category: "உயிர் காப்பாற்றும்", desc: "சுருட்டல், வீக்கம் அல்லது சுவாச சிரமம் உள்ளதா பாருங்கள்.", extra: "எபினெப்ரைன் கிடைத்தால் பயன்படுத்தவும். உடனடியாக அவசர சேவையை அழைக்கவும்." },
  ],
};

export default function FirstAidPage() {
  const { lang } = useContext(LanguageContext);
  const t = LANGS[lang] || LANGS.en;
  const tips = TIPS[lang] || TIPS.en;

  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState("");

  const filteredTips = tips.filter(
    (tip) =>
      tip.title.toLowerCase().includes(search.toLowerCase()) ||
      tip.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-100 py-16 px-6 relative">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl sm:text-5xl font-extrabold text-center text-sky-700 mb-4"
      >
        {t.header}
      </motion.h1>
      <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
        {t.desc}
      </p>

      {/* Search Bar */}
      <div className="max-w-lg mx-auto mb-10">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-sky-200 focus:ring-2 focus:ring-sky-400 shadow-sm"
        />
      </div>

      {/* Tips Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {filteredTips.map((tip, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.03 }}
            onClick={() => setOpen(open === i ? null : i)}
            className="bg-white rounded-2xl shadow-lg p-6 border border-sky-100 flex flex-col gap-3 cursor-pointer transition duration-300 hover:shadow-2xl"
          >
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-100 text-sky-700 w-fit">
              {tip.category}
            </span>
            <h2 className="font-bold text-lg text-sky-800">{tip.title}</h2>
            <p className="text-gray-700">{tip.desc}</p>

            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm text-gray-600"
                >
                  {tip.extra}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Checklist */}
      <div className="mt-20 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-sky-200 rounded-2xl shadow-lg p-8"
        >
          <h3 className="text-2xl font-bold text-sky-700 mb-4 text-center">
            {t.checklistTitle}
          </h3>
          <ul className="grid sm:grid-cols-2 gap-3 text-gray-700 text-lg">
            {t.checklist.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Ambulance CTA */}
      <div className="mt-16 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-3xl font-extrabold mb-2">{t.ambulanceTitle}</h3>
          <p className="mb-4 text-lg">{t.ambulanceDesc}</p>
          <a
            href="tel:112"
            className="inline-block bg-white text-red-600 font-bold px-6 py-3 rounded-xl shadow-md hover:bg-red-50 transition"
          >
            {t.ambulanceBtn}
          </a>
        </motion.div>
      </div>

      {/* Hotline */}
      <div className="mt-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-md"
        >
          <h3 className="text-2xl font-bold text-red-600 mb-2">
            {t.hotlineTitle}
          </h3>
          <p className="text-gray-700">{t.hotlineDesc}</p>
        </motion.div>
      </div>
    </div>
  );
}
