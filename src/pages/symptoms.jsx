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
  HeartPulse,
  AlertTriangle,
} from "lucide-react";
import { LanguageContext } from "../context/LanguageContext";

const LANGS = {
  en: {
    title: "Symptom Checker",
    subtitle:
      "Describe your condition and let AI triage suggest risk levels and next steps.",
    disclaimer:
      "Disclaimer: This is guidance only and not a substitute for professional medical advice. If you feel unwell, seek medical care immediately.",
    voiceReady: "Voice ready",
    voiceNotSupported: "Voice input not supported",
    legendTitle: "Risk legend",
    severeCTA: "Emergency now",
    severeCTATip:
      "If severe chest pain, trouble breathing, or confusion — call emergency number immediately.",
  },
};

const EXAMPLES = [
  {
    text: "Sudden chest pain radiating to left arm, sweating, shortness of breath for 20 minutes. History: hypertension.",
  },
  {
    text: "Fever 101°F with sore throat and dry cough for 3 days, mild headache, no breathing difficulty.",
  },
  {
    text: "Lower right abdominal pain worsening over 8 hours, nausea, loss of appetite, no vomiting.",
  },
];

const fireFillEvent = (payload) => {
  const ev = new CustomEvent("symptom:fill", { detail: payload });
  window.dispatchEvent(ev);
};

export default function Symptoms() {
  const { lang } = useContext(LanguageContext);
  const t = LANGS[lang] || LANGS.en;

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

  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      const rec = new SR();
      rec.lang = "en-IN";
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

  const Background = useMemo(
    () => (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-sky-50 via-white to-sky-100"
      >
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>
    ),
    []
  );

  return (
    <div className="min-h-screen text-gray-900 flex flex-col">
      {Background}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-sm shadow-sm">
              <Stethoscope className="h-4 w-4 text-sky-600" />
              <span className="font-medium">AI Triage v2</span>
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs border shadow-sm ${
              online
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
            }`}>
              {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {online ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center px-6 pt-10"
      >
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 blur-3xl bg-sky-400/30 rounded-full animate-pulse" />
            <Stethoscope className="w-16 h-16 text-sky-600 relative" />
          </motion.div>
        </div>
        <h1 className="text-[clamp(1.9rem,5vw,3.4rem)] font-extrabold bg-gradient-to-r from-sky-700 to-sky-400 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <p className="mt-4 text-gray-700 max-w-2xl mx-auto text-lg">
          {t.subtitle}
        </p>
      </motion.div>

      <div className="w-full px-4 sm:px-6 lg:px-8 mt-8 pb-16">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative lg:col-span-2 rounded-3xl bg-white shadow-xl border border-sky-100 p-6"
          >
            <SymptomForm />
            <AnimatePresence>
              {listening && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
                >
                  <Mic className="h-4 w-4" />
                  <span>Listening… speak clearly near the mic.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <section className="rounded-2xl border border-gray-200 bg-white shadow p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-sky-600" />
                <h3 className="font-semibold text-gray-800">{t.legendTitle}</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> High risk: urgent care suggested</li>
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Medium: monitor and consider consult</li>
                <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low: self-care advice</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h3 className="font-semibold text-rose-800">{t.severeCTA}</h3>
              </div>
              <p className="text-sm text-rose-900/90 mb-3">{t.severeCTATip}</p>
              <a
                href="tel:112"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700"
              >
                <HeartPulse className="h-4 w-4" /> 112 - Call now
              </a>
            </section>
          </motion.aside>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-8 mx-auto max-w-5xl flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl shadow p-4"
        >
          <Info className="w-6 h-6 text-yellow-700 shrink-0" />
          <p className="text-base text-gray-700 leading-relaxed">
            {t.disclaimer}
          </p>
        </motion.div>
      </div>
    </div>
  );
}