import React, { useState, useRef, useContext, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, X, Loader2, Search } from "lucide-react";
import Button from "../ui/Button";
import ResultsCard from "./ResultsCard";
import useTriage from "../../features/symptom-checker/useTriage";
import { LanguageContext } from "../../context/LanguageContext";
import { SYMPTOMS_TRANSLATIONS } from "./symptoms.data";

/*Translations */
const STRINGS = {
  en: {
    title: "AI Symptom Triage",
    subtitle:
      "Select or speak your symptoms. AI will calculate possible conditions and risk.",
    speak: "Speak Symptoms",
    stop: "Stop Listening",
    listening: "Listening...",
    error: "⚠️ Mic error",
    heard: "Heard:",
    search: "Search symptoms...",
    check: "Check Risk",
    clear: "Clear",
    noSupport: "❌ Your browser does not support voice input. Please use Chrome.",
    pleaseSelect: "Please select at least one symptom.",
  },
  hi: {
    title: " एआई लक्षण जांच",
    subtitle: "लक्षण चुनें या बोलें। एआई संभावित बीमारियाँ और जोखिम बताएगा।",
    speak: "लक्षण बोलें",
    stop: "सुनना बंद करें",
    listening: "सुन रहा है...",
    error: "⚠️ माइक त्रुटि",
    heard: "सुना:",
    search: "लक्षण खोजें...",
    check: "जोखिम जांचें",
    clear: "साफ़ करें",
    noSupport:
      "❌ आपका ब्राउज़र वॉइस इनपुट सपोर्ट नहीं करता। कृपया क्रोम का उपयोग करें।",
    pleaseSelect: "कृपया कम से कम एक लक्षण चुनें।",
  },
  ta: {
    title: "செயற்கை நுண்ணறிவு அறிகுறி மதிப்பீடு",
    subtitle:
      "அறிகுறிகளைத் தேர்ந்தெடுக்கவும் அல்லது பேசவும். செயற்கை நுண்ணறிவு சாத்தியமான நோய்கள் மற்றும் அபாயத்தை கணக்கிடும்.",
    speak: "அறிகுறிகளை பேசவும்",
    stop: "கேட்பதை நிறுத்தவும்",
    listening: "கேட்கிறது...",
    error: "⚠️ மைக் பிழை",
    heard: "கேட்டது:",
    search: "அறிகுறிகள் தேடவும்...",
    check: "அபாயத்தை சரிபார்க்கவும்",
    clear: "அழிக்கவும்",
    noSupport:
      "❌ உங்களின் உலாவி குரல் உள்ளீட்டை ஆதரிக்காது. தயவுசெய்து Chrome பயன்படுத்தவும்.",
    pleaseSelect: "தயவுசெய்து குறைந்தபட்சம் ஒரு அறிகுறியைத் தேர்ந்தெடுக்கவும்.",
  },
};

/*Category translations */
const CATEGORY_LABELS = {
  en: {
    General: "General",
    Cardiac: "Cardiac",
    Respiratory: "Respiratory",
    Neurological: "Neurological",
    Gastrointestinal: "Gastrointestinal",
    Musculoskeletal: "Musculoskeletal",
    Dermatological: "Dermatological",
    Psychological: "Psychological",
  },
  hi: {
    General: "सामान्य",
    Cardiac: "हृदय संबंधी",
    Respiratory: "श्वसन संबंधी",
    Neurological: "तंत्रिका संबंधी",
    Gastrointestinal: "पाचन तंत्र संबंधी",
    Musculoskeletal: "हड्डी और मांसपेशी संबंधी",
    Dermatological: "त्वचा संबंधी",
    Psychological: "मनोवैज्ञानिक",
  },
  ta: {
    General: "பொது",
    Cardiac: "இதய சம்பந்தமான",
    Respiratory: "சுவாசம் சம்பந்தமான",
    Neurological: "நரம்பியல்",
    Gastrointestinal: "அழுகுடல் சம்பந்தமான",
    Musculoskeletal: "எலும்பு தசை சம்பந்தமான",
    Dermatological: "தோல் சம்பந்தமான",
    Psychological: "மனவியல்",
  },
};

/*Utility: Fuzzy Matching*/
const similarity = (a, b) => {
  if (!a || !b) return 0;
  const matrix = Array.from({ length: b.length + 1 }, (_, i) =>
    Array.from({ length: a.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] =
          1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
      }
    }
  }
  const dist = matrix[b.length][a.length];
  return 1 - dist / Math.max(a.length, b.length);
};

const normalizeSpeech = (text) =>
  text
    .toLowerCase()
    .replace(/i have|i am|feeling|suffering from|with|and/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const highlightTranscript = (text, matched, unmatched) => {
  if (!text) return null;
  return text.split(/\s+/).map((word, i) => {
    const lower = word.toLowerCase();
    if (matched.some((m) => m.toLowerCase().includes(lower))) {
      return (
        <span key={`matched-${i}`} className="text-green-700 font-semibold">
          {word}{" "}
        </span>
      );
    }
    if (unmatched.includes(lower)) {
      return (
        <span key={`unmatched-${i}`} className="text-red-600 underline">
          {word}{" "}
        </span>
      );
    }
    return <span key={`plain-${i}`}>{word} </span>;
  });
};

/*Main Component*/
export default function SymptomForm() {
  const { lang } = useContext(LanguageContext);
  const t = STRINGS[lang] || STRINGS.en;
  const { classify } = useTriage();

  const SYMPTOMS = SYMPTOMS_TRANSLATIONS[lang] || SYMPTOMS_TRANSLATIONS.en;
  const ALL_SYMPTOMS = useMemo(() => Object.values(SYMPTOMS).flat(), [SYMPTOMS]);

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [unmatchedTokens, setUnmatchedTokens] = useState([]);
  const [search, setSearch] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const processSpeech = (speech) => {
    setTranscript((prev) => prev + " " + speech);
    const cleaned = normalizeSpeech(speech);

    let matched = [];
    let unmatched = [];

    ALL_SYMPTOMS.forEach((sym) => {
      if (cleaned.includes(sym.toLowerCase())) matched.push(sym);
    });

    cleaned.split(/\s+/).forEach((word) => {
      const best = ALL_SYMPTOMS.reduce(
        (acc, sym) => {
          const score = similarity(word, sym.toLowerCase());
          return score > acc.score ? { symptom: sym, score } : acc;
        },
        { symptom: null, score: 0 }
      );
      if (best.score > 0.75) matched.push(best.symptom);
      else unmatched.push(word);
    });

    if (matched.length)
      setSelectedSymptoms((prev) => [...new Set([...prev, ...matched])]);
    if (unmatched.length)
      setUnmatchedTokens((prev) => [...new Set([...prev, ...unmatched])]);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert(t.noSupport);

    if (status === "listening") {
      recognitionRef.current?.stop();
      setStatus("idle");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang =
      lang === "hi" ? "hi-IN" : lang === "ta" ? "ta-IN" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setStatus("listening");
    recognition.onresult = (event) => {
      const speech = event.results[event.results.length - 1][0].transcript;
      processSpeech(speech);
    };
    recognition.onerror = () => setStatus("error");
    recognition.onend = () => setStatus("idle");

    recognition.start();
    recognitionRef.current = recognition;
  };

  const toggleSymptom = (symptom) =>
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );

  const removeSymptom = (symptom) =>
    setSelectedSymptoms((prev) => prev.filter((s) => s !== symptom));

  const handleClear = () => {
    setSelectedSymptoms([]);
    setTranscript("");
    setResult(null);
    setSearch("");
    setUnmatchedTokens([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) return alert(t.pleaseSelect);
    setResult(null);
    const res = await classify(selectedSymptoms);
    setResult(res);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto bg-white/70 backdrop-blur-md 
                 p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg border border-sky-100"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleSubmit}>
        {/*Header*/}
        <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-sky-600 to-cyan-500 text-transparent bg-clip-text">
          {t.title}
        </h2>
        <p className="text-gray-600 text-sm mb-4">{t.subtitle}</p>

        {/*Voice Input*/}
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" onClick={handleVoiceInput} variant="primary">
            {status === "listening" ? <Square size={16} /> : <Mic size={16} />}
            {status === "listening" ? ` ${t.stop}` : ` ${t.speak}`}
          </Button>
          <AnimatePresence>
            {status === "listening" && (
              <motion.span
                key="listening"
                className="flex items-center gap-1 text-green-600 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="animate-spin" size={14} /> {t.listening}
              </motion.span>
            )}
            {status === "error" && (
              <motion.span
                key="error"
                className="text-red-600 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {t.error}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/*Transcript*/}
        {transcript && (
          <motion.div
            className="mb-3 text-sm p-2 bg-sky-50 rounded-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="font-medium text-gray-700">{t.heard}</div>
            <div>
              {highlightTranscript(transcript, selectedSymptoms, unmatchedTokens)}
            </div>
          </motion.div>
        )}

        {/*Search Box*/}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        </div>

        {/*Selected Symptoms*/}
        <AnimatePresence>
          {selectedSymptoms.length > 0 && (
            <motion.div
              className="mb-4 flex flex-wrap gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {selectedSymptoms.map((symptom, idx) => (
                <motion.span
                  key={`selected-${symptom}-${idx}`}
                  layout
                  className="flex items-center gap-1 bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm shadow-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  {symptom}
                  <button
                    type="button"
                    onClick={() => removeSymptom(symptom)}
                    className="text-sky-600 hover:text-red-600 transition"
                  >
                    <X size={14} />
                  </button>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/*Symptom Categories*/}
        <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scroll">
          {Object.entries(SYMPTOMS).map(([category, items]) => {
            const filtered = items.filter((sym) =>
              sym.toLowerCase().includes(search.toLowerCase())
            );
            if (filtered.length === 0) return null;

            return (
              <motion.div
                key={category}
                className="border-b pb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/*Translated Category*/}
                <h3 className="font-semibold text-sky-700 mb-2">
                  {CATEGORY_LABELS[lang]?.[category] || category}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map((symptom, idx) => (
                    <label
                      key={`${category}-${symptom}-${idx}`}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition ${
                        selectedSymptoms.includes(symptom)
                          ? "bg-sky-100 border-sky-400 shadow-sm"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSymptoms.includes(symptom)}
                        onChange={() => toggleSymptom(symptom)}
                        className="accent-sky-600"
                      />
                      <span className="text-sm">{symptom}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/*Actions*/}
        <div className="mt-4 flex gap-3">
          <Button type="submit" disabled={selectedSymptoms.length === 0}>
            {t.check}
          </Button>
          <Button type="button" variant="secondary" onClick={handleClear}>
            {t.clear}
          </Button>
        </div>
      </form>

      {/*Results*/}
      <AnimatePresence>
        {result && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ResultsCard result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
