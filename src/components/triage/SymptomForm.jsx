import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";
import ResultsCard from "./ResultsCard";
import useTriage from "../../features/symptom-checker/useTriage";
import { Mic, Square, X, Loader2, Search } from "lucide-react";

/* ✅ Symptom categories */
const SYMPTOMS = {
  General: [
    "Fever",
    "Fatigue",
    "Weakness",
    "Loss of appetite",
    "Night sweats",
    "Chills",
    "Weight loss",
    "Malaise",
    "Swelling",
    "Dehydration",
    "Excessive sweating",
    "Paleness",
    "Generalized body pain",
  ],
  Cardiac: [
    "Chest pain",
    "Shortness of breath",
    "Palpitations",
    "Dizziness",
    "Fainting",
    "Rapid heartbeat",
    "Irregular heartbeat",
    "Swelling in legs",
    "Cold extremities",
    "Blue lips",
    "Chest pressure",
    "Orthopnea (difficulty breathing while lying down)",
  ],
  Respiratory: [
    "Cough",
    "Sore throat",
    "Wheezing",
    "Difficulty breathing",
    "Runny nose",
    "Nasal congestion",
    "Sneezing",
    "Chest tightness",
    "Bloody cough",
    "Hoarseness",
    "Stridor (noisy breathing)",
    "Rapid breathing",
  ],
  Neurological: [
    "Headache",
    "Confusion",
    "Seizures",
    "Slurred speech",
    "Numbness",
    "Tingling",
    "Weakness on one side",
    "Memory loss",
    "Tremors",
    "Loss of consciousness",
    "Dizziness",
    "Balance problems",
    "Vision problems",
    "Difficulty concentrating",
    "Sleep disturbances",
    "Facial droop",
  ],
  Gastrointestinal: [
    "Nausea",
    "Vomiting",
    "Diarrhea",
    "Loose motion",
    "Abdominal pain",
    "Constipation",
    "Heartburn",
    "Indigestion",
    "Bloating",
    "Blood in stool",
    "Loss of appetite",
    "Difficulty swallowing",
    "Acid reflux",
    "Rectal pain",
    "Black/tarry stool",
  ],
  Musculoskeletal: [
    "Joint pain",
    "Back pain",
    "Neck pain",
    "Shoulder pain",
    "Knee pain",
    "Foot pain",
    "Ankle pain",
    "Hip pain",
    "Elbow pain",
    "Wrist pain",
    "Muscle weakness",
    "Muscle pain",
    "Stiffness",
    "Swelling of joints",
    "Cramps",
    "Limited mobility",
    "Bone pain",
  ],
  Dermatology: [
    "Rash",
    "Itching",
    "Skin dryness",
    "Bruising easily",
    "Redness",
    "Swelling",
    "Hives",
    "Hair loss",
    "Acne",
    "Skin peeling",
    "Ulcers",
    "Skin darkening",
    "Skin lightening",
    "Blisters",
    "Scaly patches",
  ],
  Endocrine: [
    "Excessive thirst",
    "Frequent urination",
    "Heat intolerance",
    "Cold intolerance",
    "Weight gain",
    "Weight loss",
    "Hair thinning",
    "Sweating",
    "Increased appetite",
    "Goiter (neck swelling)",
  ],
  MentalHealth: [
    "Anxiety",
    "Depression",
    "Insomnia",
    "Irritability",
    "Mood swings",
    "Hallucinations",
    "Paranoia",
    "Loss of interest",
    "Poor concentration",
    "Social withdrawal",
    "Suicidal thoughts",
  ],
  Ophthalmology: [
    "Blurred vision",
    "Double vision",
    "Eye pain",
    "Red eyes",
    "Watery eyes",
    "Light sensitivity",
    "Loss of vision",
    "Itchy eyes",
    "Swollen eyelids",
    "Floaters",
    "Dry eyes",
  ],
  ENT: [
    "Ear pain",
    "Hearing loss",
    "Ringing in ears",
    "Vertigo",
    "Nasal blockage",
    "Postnasal drip",
    "Loss of smell",
    "Sinus pain",
    "Nosebleeds",
    "Sore mouth",
    "Swollen tonsils",
  ],
  Urology: [
    "Painful urination",
    "Blood in urine",
    "Frequent urination",
    "Urgency",
    "Incontinence",
    "Difficulty urinating",
    "Lower abdominal pain",
    "Flank pain",
    "Weak urine stream",
    "Urinary retention",
  ],
  Gynecology: [
    "Irregular periods",
    "Heavy bleeding",
    "Pelvic pain",
    "Vaginal discharge",
    "Pain during intercourse",
    "Missed period",
    "Breast tenderness",
    "Menstrual cramps",
    "Hot flashes",
  ],
  Pediatrics: [
    "Irritability in child",
    "Poor feeding",
    "Failure to thrive",
    "Developmental delay",
    "Seizures in child",
    "Persistent crying",
    "Delayed speech",
    "Recurrent infections",
    "Feeding difficulties",
  ],
  Orthopedics: [
    "Fracture",
    "Dislocation",
    "Swelling of bone",
    "Difficulty walking",
    "Stiff joints",
    "Shoulder stiffness",
    "Hip stiffness",
  ]
};


const ALL_SYMPTOMS = Object.values(SYMPTOMS).flat();

/* ✅ Levenshtein-based similarity */
const similarity = (a, b) => {
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

/* ✅ Normalize spoken text */
const normalizeSpeech = (text) => {
  return text
    .toLowerCase()
    .replace(/i have|i am|feeling|suffering from|with|and/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/* ✅ Extract symptoms (multi-word + fuzzy matching) */
const extractSymptoms = (speech) => {
  const cleaned = normalizeSpeech(speech);
  let matched = [];
  let unmatched = [];

  // 1. Find multi-word symptoms directly
  ALL_SYMPTOMS.forEach((sym) => {
    const symLower = sym.toLowerCase();
    if (cleaned.includes(symLower)) {
      matched.push(sym);
    }
  });

  // 2. Check each word for fuzzy matches
  const words = cleaned.split(/\s+/).filter(Boolean);
  words.forEach((word) => {
    const bestMatch = ALL_SYMPTOMS.reduce(
      (acc, sym) => {
        const score = similarity(word, sym.toLowerCase());
        return score > acc.score ? { symptom: sym, score } : acc;
      },
      { symptom: null, score: 0 }
    );
    if (bestMatch.score > 0.75) {
      matched.push(bestMatch.symptom);
    } else {
      if (!matched.some((m) => m.toLowerCase().includes(word))) {
        unmatched.push(word);
      }
    }
  });

  return { matched: [...new Set(matched)], unmatched };
};

/* ✅ Highlight transcript */
const highlightTranscript = (text, matched, unmatched) => {
  if (!text) return null;
  const words = text.split(/\s+/);

  return words.map((word, i) => {
    const lower = word.toLowerCase();
    if (matched.some((m) => m.toLowerCase() === lower || m.toLowerCase().includes(lower))) {
      return (
        <span key={i} className="text-green-700 font-semibold">
          {word}{" "}
        </span>
      );
    }
    if (unmatched.includes(lower)) {
      return (
        <span key={i} className="text-red-600 underline">
          {word}{" "}
        </span>
      );
    }
    return <span key={i}>{word} </span>;
  });
};

export default function SymptomForm() {
  const { classify } = useTriage();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | listening | error
  const [transcript, setTranscript] = useState("");
  const [unmatchedTokens, setUnmatchedTokens] = useState([]);
  const [search, setSearch] = useState("");
  const recognitionRef = useRef(null);

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const removeSymptom = (symptom) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s !== symptom));
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("❌ Your browser does not support voice input. Please use Chrome.");
      return;
    }

    if (status === "listening") {
      recognitionRef.current?.stop();
      setStatus("idle");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event) => {
      const speech = event.results[event.results.length - 1][0].transcript;
      setTranscript((prev) => prev + " " + speech);

      const { matched, unmatched } = extractSymptoms(speech);

      if (matched.length > 0) {
        setSelectedSymptoms((prev) => [...new Set([...prev, ...matched])]);
      }
      if (unmatched.length > 0) {
        setUnmatchedTokens((prev) => [...new Set([...prev, ...unmatched])]);
      }
    };

    recognition.onerror = (err) => {
      console.error("Voice error:", err);
      setStatus("error");
    };

    recognition.onend = () => setStatus("idle");

    recognition.start();
    recognitionRef.current = recognition;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      alert("Please select at least one symptom.");
      return;
    }
    setResult(null);
    const res = await classify(selectedSymptoms);
    setResult(res);
  };

  return (
    <motion.div
  className="w-full max-w-4xl mx-auto bg-white/70 backdrop-blur-md 
             p-4 sm:p-6 md:p-8 rounded-none sm:rounded-2xl 
             shadow-lg border border-sky-100"
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>

      <form onSubmit={submit}>
        <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-sky-600 to-cyan-500 text-transparent bg-clip-text">
          🧑‍⚕️ AI Symptom Triage
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Select or <strong>speak</strong> your symptoms. AI will calculate possible conditions and risk.
        </p>

        {/* 🎤 Voice Input */}
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" onClick={handleVoiceInput} variant="primary">
            {status === "listening" ? <Square size={16} /> : <Mic size={16} />}
            {status === "listening" ? " Stop Listening" : " Speak Symptoms"}
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
                <Loader2 className="animate-spin" size={14} /> Listening...
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
                ⚠️ Mic error
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Transcript */}
        {transcript && (
          <motion.div
            className="mb-3 text-sm p-2 bg-sky-50 rounded-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="font-medium text-gray-700">Heard:</div>
            <div>{highlightTranscript(transcript, selectedSymptoms, unmatchedTokens)}</div>
          </motion.div>
        )}

        {/* Search Symptoms */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search symptoms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        </div>

        {/* Selected Symptoms */}
        <AnimatePresence>
          {selectedSymptoms.length > 0 && (
            <motion.div
              className="mb-4 flex flex-wrap gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {selectedSymptoms.map((symptom) => (
                <motion.span
                  key={symptom}
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

        {/* Symptom Categories */}
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
                <h3 className="font-semibold text-sky-700 mb-2">{category}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map((symptom) => (
                    <label
                      key={symptom}
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

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3">
          <Button type="submit">Check Risk</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSelectedSymptoms([]);
              setTranscript("");
              setResult(null);
              setSearch("");
              setUnmatchedTokens([]);
            }}
          >
            Clear
          </Button>
        </div>
      </form>

      {/* Results */}
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
