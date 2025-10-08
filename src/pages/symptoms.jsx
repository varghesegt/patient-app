import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import SymptomForm from "../components/triage/SymptomForm";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Info,
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  ShieldCheck,
  Sparkles,
  Zap,
  HelpCircle,
  HeartPulse,
  AlertTriangle,
  Globe,
  RefreshCcw,
} from "lucide-react";
import { LanguageContext } from "../context/LanguageContext";

/**
 * Symptoms.jsx — Advanced, production‑ready AI triage screen
 * 
 * Highlights
 * - Multilingual copy via LanguageContext
 * - Voice dictation (Web Speech API) with graceful fallback
 * - Smart examples (one‑tap prompt inject)
 * - Offline awareness + draft autosave & restore
 * - Triage legend, safety CTA, privacy microcopy
 * - Keyboard shortcuts & accessibility labelling
 * - Subtle motion & glassmorphism, responsive up to 2‑column
 */

const LANGS = {
  en: {
    title: "Symptom Checker",
    subtitle:
      "Describe your condition and let AI triage suggest risk levels and next steps.",
    disclaimer:
      "Disclaimer: This is initial guidance and not a substitute for professional medical advice. If you feel unwell, seek medical care immediately.",
    voiceReady: "Voice ready",
    voiceNotSupported: "Voice input not supported on this device",
    smartExamples: "Try an example",
    legendTitle: "Risk legend",
    howItWorks: "How this works",
    howItWorksBody:
      "Your description is analyzed to extract symptoms, duration, modifiers (fever, pain scale, comorbidities) and red‑flag patterns. A lightweight on‑device pre‑screen runs first; if online, a server model refines the triage and suggests care pathways.",
    privacyTitle: "Privacy",
    privacyBody:
      "Text is processed securely. Do not paste personally identifying data (name, phone, address). In emergencies, call local services immediately.",
    shortcuts: "Shortcuts",
    shortcutList: [
      "/ to focus input",
      "Ctrl/⌘ + Enter to submit",
      "Alt + . to cycle examples",
    ],
    severeCTA: "Emergency now",
    severeCTATip: "If severe chest pain, trouble breathing, or confusion — call local emergency number immediately.",
  },
  hi: {
    title: "लक्षण जाँचकर्ता",
    subtitle:
      "अपनी स्थिति लिखें और AI त्रायेज जोखिम स्तर व अगले कदम सुझाएगा।",
    disclaimer:
      "अस्वीकरण: यह केवल प्रारम्भिक मार्गदर्शन है, डॉक्टर की सलाह का विकल्प नहीं है। आप अस्वस्थ हों तो तुरंत चिकित्सा सहायता लें।",
    voiceReady: "वॉइस तैयार",
    voiceNotSupported: "इस डिवाइस पर वॉइस इनपुट उपलब्ध नहीं",
    smartExamples: "उदाहरण आज़माएँ",
    legendTitle: "जोखिम संकेत",
    howItWorks: "यह कैसे काम करता है",
    howItWorksBody:
      "आपका वर्णन पढ़कर लक्षण, अवधि, सह‑लक्षण (बुखार, दर्द‑स्तर, सह‑रोग) व रेड‑फ्लैग पहचाने जाते हैं। ऑफलाइन प्री‑स्क्रीन के बाद ऑनलाइन मॉडल देखभाल मार्ग सुझाता है।",
    privacyTitle: "गोपनीयता",
    privacyBody:
      "कृपया नाम/फोन/पता जैसी पहचान योग्य जानकारी न डालें। आपात स्थिति में तुरंत स्थानीय सेवाओं को कॉल करें।",
    shortcuts: "शॉर्टकट",
    shortcutList: ["/ इनपुट पर जाएँ", "Ctrl/⌘ + Enter सबमिट", "Alt + . उदाहरण बदलें"],
    severeCTA: "तुरंत आपातकाल",
    severeCTATip:
      "यदि तीव्र सीने में दर्द, साँस लेने में दिक्कत, भ्रम — तुरंत आपात नंबर पर कॉल करें।",
  },
  ta: {
    title: "அறிகுறி சரிபார்ப்பான்",
    subtitle:
      "உங்கள் நிலையைக் எழுதுங்கள்; AI தாயரேஜ் ஆபத்து நிலை மற்றும் அடுத்த படிகளை பரிந்துரைக்கும்.",
    disclaimer:
      "பொறுப்புத்துறப்பு: இது ஆரம்ப வழிகாட்டுதல் மட்டுமே; மருத்துவர் ஆலோசனைக்கு மாற்றாகாது. அவசரமென நினைத்தால் உடனே மருத்துவ உதவி பெறுங்கள்.",
    voiceReady: "குரல் தயாராக உள்ளது",
    voiceNotSupported: "இந்த சாதனத்தில் குரல் உள்ளீடு இல்லை",
    smartExamples: "உதாரணம் முயற்சிக்க",
    legendTitle: "ஆபத்து குறிப்பு",
    howItWorks: "எப்படி செயல்படுகிறது",
    howItWorksBody:
      "உங்கள் விளக்கத்திலிருந்து அறிகுறிகள், காலம், துணை‑அறிகுறிகள், ரெட்‑ஃப்ளாக் பாட்டெர்ன்களை கண்டறிந்து முதலில் ஆஃப்லைன் முன்‑திரை; ஆன்லைனில் இருந்தால் மேம்பட்ட மாதிரி பரிந்துரைகள் தரும்.",
    privacyTitle: "தனியுரிமை",
    privacyBody:
      "பெயர்/தொலைபேசி/முகவரி போன்ற அடையாளத் தகவலை இட வேண்டாம். அவசர நிலை என்றால் உடனே உள்ளூர் சேவைகளை அழைக்கவும்.",
    shortcuts: "குறுக்குவழிகள்",
    shortcutList: [
      "/ உள்ளீட்டுக்கு செல்ல",
      "Ctrl/⌘ + Enter சமர்ப்பிக்க",
      "Alt + . உதாரணம் மாற்ற",
    ],
    severeCTA: "அவசரம் இப்போது",
    severeCTATip:
      "கடுமையான மார்பு வலி, சுவாசக் குறைவு, குழப்பம் — உடனே அவசர எண்ணிற்கு அழைக்கவும்.",
  },
};

const EXAMPLES = [
  {
    k: "cp",
    text:
      "Sudden chest pain radiating to left arm, sweating, shortness of breath for 20 minutes. History: hypertension.",
    level: "high",
  },
  {
    k: "fever",
    text:
      "Fever 101°F with sore throat and dry cough for 3 days, mild headache, no breathing difficulty.",
    level: "medium",
  },
  {
    k: "abd",
    text:
      "Lower right abdominal pain worsening over 8 hours, nausea, loss of appetite, pain 7/10, no vomiting.",
    level: "medium",
  },
  {
    k: "rash",
    text:
      "Itchy red rash after new detergent exposure, no swelling of lips/tongue, no breathing issues.",
    level: "low",
  },
];

// Utility: broadcast an example to SymptomForm without tight coupling
const fireFillEvent = (payload) => {
  const ev = new CustomEvent("symptom:fill", { detail: payload });
  window.dispatchEvent(ev);
};

export default function Symptoms() {
  const { lang } = useContext(LanguageContext);
  const t = LANGS[lang] || LANGS.en;

  // Offline awareness
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Voice dictation (Web Speech API)
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      const rec = new SR();
      rec.lang = lang === "hi" ? "hi-IN" : lang === "ta" ? "ta-IN" : "en-IN";
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      let liveText = "";
      rec.onresult = (e) => {
        const t = Array.from(e.results)
          .map((r) => r[0]?.transcript || "")
          .join(" ")
          .trim();
        liveText = t;
        fireFillEvent({ text: t, mode: "dictation" });
      };
      rec.onend = () => {
        setListening(false);
        if (liveText) fireFillEvent({ text: liveText, submit: false });
      };
      rec.onerror = () => setListening(false);
      recRef.current = rec;
    }
  }, [lang]);

  const toggleListening = () => {
    if (!voiceSupported) return;
    if (!listening) {
      try {
        recRef.current?.start();
        setListening(true);
      } catch {}
    } else {
      try {
        recRef.current?.stop();
      } catch {}
      setListening(false);
    }
  };

  // Autosave + restore hints (the SymptomForm can also manage its own state)
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const draft = localStorage.getItem("symptomDraft");
    if (draft && !restored) {
      setRestored(true);
      fireFillEvent({ text: draft, mode: "restore" });
    }
    const onDraft = (e) => {
      // Allow SymptomForm to broadcast draft updates
      if (e?.detail?.text !== undefined) {
        try {
          localStorage.setItem("symptomDraft", e.detail.text);
        } catch {}
      }
    };
    window.addEventListener("symptom:draft", onDraft);
    return () => window.removeEventListener("symptom:draft", onDraft);
  }, [restored]);

  // Cycle examples shortcut (Alt + .)
  const exIndex = useRef(0);
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && e.key === ".") {
        e.preventDefault();
        const sample = EXAMPLES[exIndex.current % EXAMPLES.length];
        exIndex.current += 1;
        fireFillEvent({ text: sample.text, mode: "example" });
      }
      // Focus main input hint: forward a focus event the form can use
      if (e.key === "/") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("symptom:focus"));
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
        window.dispatchEvent(new CustomEvent("symptom:submit"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Gradient background grid
  const Background = useMemo(
    () => (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-white to-sky-50" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.15) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>
    ),
    []
  );

  return (
    <div className="min-h-screen text-gray-900 flex flex-col">
      {Background}

      {/* Top banner: status & actions */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 backdrop-blur px-3 py-1 text-sm shadow-sm">
                <Stethoscope className="h-4 w-4 text-sky-600" />
                <span className="font-medium tracking-tight">AI Triage v2</span>
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="hidden sm:inline text-xs text-gray-500">{online ? t.voiceReady : t.voiceNotSupported}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs border shadow-sm ${
                online
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-700"
                  : "bg-amber-50/80 border-amber-200 text-amber-700"
              }`}>
                {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {online ? "Online" : "Offline: basic mode"}
              </span>
              <button
                type="button"
                onClick={toggleListening}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border transition shadow-sm ${
                  listening
                    ? "bg-red-50/80 border-red-200 text-red-700"
                    : "bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                aria-pressed={listening}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {listening ? "Listening…" : "Dictate"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center px-6 pt-10 sm:pt-14"
      >
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 blur-3xl bg-sky-400/40 rounded-full animate-pulse" />
            <Stethoscope className="w-16 h-16 sm:w-20 sm:h-20 relative text-sky-600 drop-shadow-lg" />
          </motion.div>
        </div>

        <h1 className="text-[clamp(1.9rem,5vw,3.4rem)] font-extrabold tracking-tight leading-tight bg-gradient-to-r from-sky-700 to-sky-400 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <p className="mt-4 text-gray-700 max-w-2xl mx-auto text-[clamp(0.95rem,2vw,1.15rem)] leading-relaxed">
          {t.subtitle}
        </p>
      </motion.div>

      {/* Main 2‑column section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10 pb-16">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
            className="relative lg:col-span-2 rounded-3xl bg-white/85 backdrop-blur-xl shadow-2xl border border-sky-100/70 p-5 sm:p-7"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100/40 via-transparent to-sky-50/20 pointer-events-none rounded-3xl" />

            {/* Smart examples */}
            

            {/* The actual form */}
            <SymptomForm />

            {/* Dictation hint */}
            <AnimatePresence>
              {listening && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
                >
                  <Mic className="h-4 w-4" />
                  <span>Listening… speak clearly near the microphone.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: Legend / Help / Safety */}
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="space-y-4"
          >
            {/* Risk legend */}
            <section className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur shadow-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-sky-600" />
                <h3 className="font-semibold text-gray-800">{t.legendTitle}</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> High risk: red‑flag symptoms, urgent care suggested</li>
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Medium: follow guidance, monitor and consider consult</li>
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low: home care advice & self‑monitoring</li>
              </ul>
            </section>

            {/* Emergency CTA */}
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h3 className="font-semibold text-rose-800">{t.severeCTA}</h3>
              </div>
              <p className="text-sm text-rose-900/90 mb-3">{t.severeCTATip}</p>
              <a
                href="tel:112"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-600"
              >
                <HeartPulse className="h-4 w-4" /> 112 — Call now
              </a>
            </section>
          </motion.aside>
        </div>

        {/* Tips & disclaimer footer */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 mx-auto max-w-5xl flex items-start gap-3 bg-gradient-to-r from-amber-50/80 to-yellow-100/90 border border-yellow-200/70 rounded-2xl shadow-lg p-4"
        >
          <Info className="w-6 h-6 text-yellow-700 shrink-0" />
          <p className="text-[clamp(0.9rem,2vw,1rem)] text-gray-700 leading-relaxed">
            {t.disclaimer}
          </p>
        </motion.div>
      </div>

    </div>
  );
}
