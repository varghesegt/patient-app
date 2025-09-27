import React, { useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { Globe, Activity, AlertTriangle, MapPin, User, HeartPulse, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import { LanguageContext } from "../context/LanguageContext";

const LANGS = {
  en: {
    getHelp: "Get Help Instantly",
    desc: "Start your AI-powered triage or press SOS for emergency. Supports voice input & multiple languages.",
    startSymptom: "Start Symptom Check",
    sos: "SOS / Emergency",
    myProfile: "My Profile",
    myProfileDesc: "Manage health info, history, and saved hospitals.",
    nearbyHospitals: "Nearby Hospitals",
    nearbyHospitalsDesc: "Find closest hospitals with live availability.",
    firstAid: "First Aid Guide",
    firstAidDesc: "Step-by-step emergency instructions.",
    consultDoctor: "Consult a Doctor",
    consultDoctorDesc: "Instantly connect with verified doctors.",
  },
  hi: {
    getHelp: "तुरंत सहायता प्राप्त करें",
    desc: "अपनी AI-पावर्ड जाँच शुरू करें या आपातकालीन SOS दबाएँ। वॉइस इनपुट और कई भाषाओं का समर्थन करता है।",
    startSymptom: "लक्षण जांच शुरू करें",
    sos: "एसओएस / आपातकालीन",
    myProfile: "मेरा प्रोफ़ाइल",
    myProfileDesc: "स्वास्थ्य जानकारी, इतिहास और सहेजे गए अस्पताल प्रबंधित करें।",
    nearbyHospitals: "निकटतम अस्पताल",
    nearbyHospitalsDesc: "निकटतम अस्पताल लाइव उपलब्धता के साथ खोजें।",
    firstAid: "प्राथमिक चिकित्सा गाइड",
    firstAidDesc: "चरण-दर-चरण आपातकालीन निर्देश।",
    consultDoctor: "डॉक्टर से संपर्क करें",
    consultDoctorDesc: "सत्यापित डॉक्टरों से तुरंत जुड़ें।",
  },
  ta: {
    getHelp: "உடனடி உதவி பெறவும்",
    desc: "உங்கள் AI-ஆல் இயக்கப்படும் சிகிச்சையை தொடங்கவும் அல்லது அவசர SOS அழுத்தவும். குரல் உள்ளீடு மற்றும் பல மொழிகள் ஆதரிக்கின்றன.",
    startSymptom: "அறிகுறிகள் சரிபார்க்கவும்",
    sos: "SOS / அவசரத்தடை",
    myProfile: "என் ப்ரொஃபைல்",
    myProfileDesc: "சுகாதாரத் தகவல், வரலாறு மற்றும் சேமிக்கப்பட்ட மருத்துவமனைகளை நிர்வகிக்கவும்.",
    nearbyHospitals: "நெருங்கிய மருத்துவமனைகள்",
    nearbyHospitalsDesc: "நெருங்கிய மருத்துவமனைகளை நேரடி கிடைக்கும் தகவலுடன் கண்டறியவும்.",
    firstAid: "முதன்மை மருத்துவ கையேடு",
    firstAidDesc: "படிகள் அடிப்படையிலான அவசர வழிகாட்டி.",
    consultDoctor: "மருத்துவரை அணுகவும்",
    consultDoctorDesc: "சரிபார்க்கப்பட்ட மருத்தவர்களுடன் உடனே இணைக்கவும்.",
  },
};

export default function Home() {
  const { lang, setLang } = useContext(LanguageContext);
  const t = LANGS[lang] || LANGS.en;

  useEffect(() => {
    window.scrollTo(0, 0); 
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-sky-50 relative overflow-hidden">


      {/* Floating Blobs */}
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-40 h-40 bg-sky-300 rounded-full blur-3xl opacity-30"
      />
      <motion.div
        animate={{ y: [0, -25, 0], x: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-10 w-52 h-52 bg-sky-400 rounded-full blur-3xl opacity-20"
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-16 space-y-24">

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl p-12 sm:p-16 text-center border border-sky-100"
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
            {t.getHelp}
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto mb-12 text-lg sm:text-xl">
            {t.desc}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/symptoms">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-full sm:w-auto px-8 py-3 rounded-3xl font-bold text-white 
                           bg-gradient-to-r from-sky-500 to-blue-600 
                           shadow-xl hover:shadow-sky-400/50 transition-all duration-300
                           flex items-center gap-3 overflow-hidden group"
              >
                <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition" />
                <Activity size={20} /> {t.startSymptom}
              </motion.button>
            </Link>

            <Link to="/emergency">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-full sm:w-auto px-8 py-3 rounded-3xl font-bold text-white 
                           bg-gradient-to-r from-red-500 to-rose-600 
                           shadow-xl hover:shadow-red-400/50 transition-all duration-300
                           flex items-center gap-3 overflow-hidden group"
              >
                <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition" />
                <AlertTriangle size={20} /> {t.sos}
              </motion.button>
            </Link>
          </div>
        </motion.section>

        {/* Quick Action Cards */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[
            { title: t.myProfile, desc: t.myProfileDesc, icon: <User className="text-sky-500" />, link: "/profile" },
            { title: t.nearbyHospitals, desc: t.nearbyHospitalsDesc, icon: <MapPin className="text-green-500" />, link: "/hospital" },
            { title: t.firstAid, desc: t.firstAidDesc, icon: <HeartPulse className="text-orange-500" />, link: "/firstaid" },
            { title: t.consultDoctor, desc: t.consultDoctorDesc, icon: <Stethoscope className="text-purple-500" />, link: "/consultdoctor" },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10, scale: 1.05, rotate: 1 }}
              transition={{ type: "spring", stiffness: 250, damping: 20 }}
              className="relative bg-white/80 backdrop-blur-2xl p-8 rounded-3xl 
                         shadow-2xl hover:shadow-3xl border border-sky-100/40 
                         transition group cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-sky-300 via-blue-200 to-sky-300 
                              opacity-0 group-hover:opacity-100 blur-2xl transition" />
              <Link to={card.link} className="relative block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-sky-50 rounded-xl group-hover:scale-110 transition">
                    {card.icon}
                  </div>
                  <h3 className="font-bold text-xl text-gray-900">{card.title}</h3>
                </div>
                <p className="text-gray-600 text-sm sm:text-base">{card.desc}</p>
              </Link>
            </motion.div>
          ))}
        </motion.section>
      </main>
    </div>
  );
}
