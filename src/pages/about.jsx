import React, { useContext, useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Users, HeartPulse, Stethoscope, Globe, Phone, Info } from "lucide-react";
import { LanguageContext } from "../context/LanguageContext";

const LANGS = {
  en: {
    about: "About Us",
    intro:
      "Our platform connects patients with verified doctors across India, providing safe, convenient, and efficient healthcare consultations.",
    doctors: "Doctors",
    specialties: "Specialties",
    consultations: "Consultations",
    cities: "Cities Covered",
    missionTitle: "Our Mission",
    missionDesc:
      "We aim to make healthcare accessible and reliable for everyone, leveraging technology to connect patients with top medical specialists, anytime, anywhere.",
    experts: "Meet Our Experts",
    contact: "Contact Us",
    disclaimer:
      "This platform provides medical guidance and consultation online. For emergencies, always call 108 or visit the nearest hospital.",
  },
  hi: {
    about: "हमारे बारे में",
    intro:
      "हमारा प्लेटफ़ॉर्म पूरे भारत में मरीजों को सत्यापित डॉक्टरों से जोड़ता है, सुरक्षित, सुविधाजनक और प्रभावी स्वास्थ्य परामर्श प्रदान करता है।",
    doctors: "डॉक्टर",
    specialties: "विशेषज्ञताएँ",
    consultations: "परामर्श",
    cities: "शहरों में उपलब्ध",
    missionTitle: "हमारा मिशन",
    missionDesc:
      "हम सभी के लिए स्वास्थ्य सेवा को सुलभ और विश्वसनीय बनाना चाहते हैं, तकनीक का उपयोग करके मरीजों को शीर्ष चिकित्सा विशेषज्ञों से कभी भी, कहीं भी जोड़ना।",
    experts: "हमारे विशेषज्ञों से मिलें",
    contact: "संपर्क करें",
    disclaimer:
      "यह प्लेटफ़ॉर्म ऑनलाइन चिकित्सा मार्गदर्शन और परामर्श प्रदान करता है। आपात स्थिति में, हमेशा 108 पर कॉल करें या निकटतम अस्पताल जाएँ।",
  },
  ta: {
    about: "எங்களை பற்றி",
    intro:
      "இந்த தளம் இந்தியா முழுவதும் உள்ள நோயாளிகளை சரிபார்க்கப்பட்ட மருத்துவர்களுடன் இணைக்கிறது, பாதுகாப்பான, வசதியான மற்றும் திறமையான சுகாதார ஆலோசனையை வழங்குகிறது.",
    doctors: "மருத்துவர்கள்",
    specialties: "சிறப்பு துறைகள்",
    consultations: "ஆலோசனைகள்",
    cities: "நகரங்கள்",
    missionTitle: "எங்கள் பணி",
    missionDesc:
      "எல்லோருக்கும் சுகாதாரம் எளிதில் கிடைக்கக் கூடியதும் நம்பகமானதுமானதாக இருக்க வேண்டும் என்பதே எங்கள் நோக்கம். நோயாளிகளை முன்னணி மருத்துவ நிபுணர்களுடன் எப்போதும், எங்கும் இணைக்க தொழில்நுட்பத்தை பயன்படுத்துகிறோம்.",
    experts: "எங்கள் நிபுணர்களை சந்திக்கவும்",
    contact: "எங்களை தொடர்பு கொள்ளவும்",
    disclaimer:
      "இந்த தளம் ஆன்லைன் மருத்துவ ஆலோசனையை வழங்குகிறது. அவசர சூழ்நிலையில், எப்போதும் 108 ஐ அழைக்கவும் அல்லது அருகிலுள்ள மருத்துவமனைக்கு செல்லவும்.",
  },
};

export default function About() {
  const { lang } = useContext(LanguageContext);
  const t = LANGS[lang] || LANGS.en;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const prev = document.title;
    document.title = `${t.about} · MediLink360`;
    return () => { document.title = prev; };
  }, [t.about]);

  const stats = useMemo(
    () => [
      { icon: <Users className="w-6 h-6 text-indigo-600" aria-hidden="true" />, label: t.doctors, value: "120" },
      { icon: <HeartPulse className="w-6 h-6 text-red-500" aria-hidden="true" />, label: t.specialties, value: "15" },
      { icon: <Stethoscope className="w-6 h-6 text-sky-500" aria-hidden="true" />, label: t.consultations, value: "10K+" },
      { icon: <Globe className="w-6 h-6 text-green-500" aria-hidden="true" />, label: t.cities, value: "10" },
    ],
    [t.doctors, t.specialties, t.consultations, t.cities]
  );

  const team = useMemo(
    () => [
      { name: "Dr. Anjali Mehta", role: "Chief Medical Officer", image: "https://randomuser.me/api/portraits/women/44.jpg" },
      { name: "Dr. Rajesh Kumar", role: "Head of Neurology", image: "https://randomuser.me/api/portraits/men/46.jpg" },
      { name: "Dr. Priya Sharma", role: "Pediatrics Specialist", image: "https://randomuser.me/api/portraits/women/47.jpg" },
    ],
    []
  );

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.6, delay },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-sky-50 text-gray-900">
      {/* Hero */}
      <header className="px-6 pt-16 sm:pt-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: reduceMotion ? 0 : -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-[clamp(2.25rem,6vw,4rem)] font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent"
        >
          {t.about}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-5 text-gray-700 max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed"
        >
          {t.intro}
        </motion.p>
      </header>

      {/* Stats */}
      <section aria-label="Platform statistics" className="max-w-6xl mx-auto mt-16 px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.article
              key={s.label}
              {...fadeUp(i * 0.05)}
              className="bg-white/70 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl focus-within:ring-2 ring-indigo-200 transition"
              tabIndex={0}
              role="group"
              aria-label={`${s.value} ${s.label}`}
            >
              <div className="flex flex-col items-center">
                {s.icon}
                <p className="mt-3 text-2xl font-extrabold tracking-tight">{s.value}</p>
                <p className="mt-1 text-gray-600 text-sm">{s.label}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="mt-20 max-w-4xl mx-auto px-4 text-center">
        <motion.h2
          {...fadeUp(0.05)}
          className="text-2xl sm:text-3xl font-bold text-indigo-700"
        >
          {t.missionTitle}
        </motion.h2>
        <motion.p
          {...fadeUp(0.15)}
          className="mt-4 text-gray-700 sm:text-lg leading-relaxed"
        >
          {t.missionDesc}
        </motion.p>
      </section>

      {/* Team */}
      <section className="mt-20 max-w-7xl mx-auto px-4">
        <motion.h2
          {...fadeUp(0.05)}
          className="text-2xl sm:text-3xl font-bold text-indigo-700 text-center mb-10"
        >
          {t.experts}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {team.map((m, i) => (
            <motion.article
              key={m.name}
              {...fadeUp(0.08 + i * 0.06)}
              className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-xl transition"
            >
              <img
                src={m.image}
                loading="lazy"
                decoding="async"
                alt={`${m.name} – ${m.role}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
              />
              <h3 className="mt-4 font-semibold text-indigo-700">{m.name}</h3>
              <p className="mt-1 text-gray-600">{m.role}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mt-20 flex justify-center px-4">
        <motion.a
          {...fadeUp(0.1)}
          href="tel:108"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition focus:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-300"
          aria-label={t.contact}
        >
          <Phone className="w-5 h-5" aria-hidden="true" />
          {t.contact}
        </motion.a>
      </section>

      {/* Disclaimer */}
      <section className="mt-16 mx-4 sm:mx-10 lg:mx-20">
        <div className="flex items-start gap-4 bg-gradient-to-r from-amber-50 to-yellow-100 border border-yellow-200 rounded-2xl shadow-lg p-6">
          <Info className="w-7 h-7 text-yellow-600 shrink-0" aria-hidden="true" />
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            <span className="font-semibold">Disclaimer:</span> {t.disclaimer}
          </p>
        </div>
      </section>

      <div className="h-16" />
    </main>
  );
}
