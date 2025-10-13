/**
 * VoiceNavigatorBlind.jsx
 * MediLink Voice Assistant for Blind Users
 * - Fully voice-operated navigation
 * - Multi-language (English, Hindi, Tamil)
 * - Reads pages aloud automatically
 * - Supports emergency SOS and accessibility feedback
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, MicOff, Volume2, HelpCircle } from "lucide-react";

const SR =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

const speak = (text, lang = "en-IN", rate = 1) => {
  if (!synth) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = rate;
  synth.cancel();
  synth.speak(utter);
};

const vibrate = (ms = 100) => {
  if (navigator.vibrate) navigator.vibrate(ms);
};

/* ------------------------------------------------------------------ */
export default function VoiceNavigatorBlind() {
  const navigate = useNavigate();
  const location = useLocation();
  const [supported] = useState(!!SR);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [error, setError] = useState("");

  const recRef = useRef(null);

  /* -------------------- Command Patterns -------------------- */
  const commands = useMemo(
    () => [
      { key: "home", match: /(home|dashboard|main|मेन|முகப்பு)/i, action: () => navigate("/") },
      { key: "appointments", match: /(appointment|book|अपॉइंटमेंट|மருத்துவ நேரம்)/i, action: () => navigate("/appointments") },
      { key: "records", match: /(record|history|medical|इतिहास|வரலாறு)/i, action: () => navigate("/records") },
      { key: "doctors", match: /(doctor|डॉक्टर|மருத்துவர்)/i, action: () => navigate("/doctors") },
      {
        key: "emergency",
        match: /(emergency|ambulance|help|sos|आपातकालीन|அவசரம்)/i,
        action: () => {
          vibrate(300);
          speak("Emergency mode activated. Contacting nearest help...");
          navigate("/emergency");
        },
      },
      { key: "profile", match: /(profile|account|प्रोफाइल|சுயவிவரம்)/i, action: () => navigate("/profile") },
      { key: "back", match: /(go back|back|पीछे|பின்னால்)/i, action: () => navigate(-1) },
      {
        key: "scrollDown",
        match: /(scroll down|नीचे|கீழே)/i,
        action: () => window.scrollBy({ top: 400, behavior: "smooth" }),
      },
      {
        key: "scrollUp",
        match: /(scroll up|ऊपर|மேலே)/i,
        action: () => window.scrollBy({ top: -400, behavior: "smooth" }),
      },
      {
        key: "read",
        match: /(read|speak|सुनाओ|படி)/i,
        action: () => {
          const title =
            document.querySelector("h1,h2,h3")?.textContent || "this page";
          const text = document.body.innerText.slice(0, 300);
          speak(`${title}. ${text}`);
        },
      },
      {
        key: "help",
        match: /(help|commands|सहायता|உதவி)/i,
        action: () =>
          speak(
            "You can say: open appointments, open emergency, read page, scroll down, or go back."
          ),
      },
      {
        key: "logout",
        match: /(logout|sign out|लॉग आउट|வெளியேறு)/i,
        action: () => {
          speak("You have been logged out. Stay safe!");
          navigate("/login");
        },
      },
      {
        key: "stop",
        match: /(stop|रुको|நிறுத்து)/i,
        action: () => synth.cancel(),
      },
    ],
    [navigate]
  );

  /* -------------------- Setup Recognition -------------------- */
  useEffect(() => {
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e) => {
      let interimTxt = "",
        finalTxt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalTxt += res[0].transcript;
        else interimTxt += res[0].transcript;
      }
      setInterim(interimTxt);
      if (finalTxt) setFinalText(finalTxt);
    };
    rec.onerror = (e) => {
      setError(e.error);
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
  }, []);

  /* -------------------- Start / Stop -------------------- */
  const startListening = () => {
    if (!recRef.current) return;
    setInterim("");
    setFinalText("");
    setError("");
    try {
      recRef.current.start();
      setListening(true);
      speak("Listening… Please say a command.");
      vibrate(100);
    } catch (err) {
      console.warn(err);
    }
  };

  const stopListening = () => {
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
  };

  /* -------------------- Execute Commands -------------------- */
  useEffect(() => {
    const text = finalText.trim().toLowerCase();
    if (!text) return;

    const found = commands.find((c) => c.match.test(text));
    if (found) {
      found.action();
      speak(`Okay, ${found.key} page`);
    } else {
      speak("Sorry, I didn’t understand. Say help to hear available commands.");
    }
  }, [finalText, commands]);

  /* -------------------- Announce Page -------------------- */
  useEffect(() => {
    const path = location.pathname.split("/").pop() || "home";
    const name = path.charAt(0).toUpperCase() + path.slice(1);
    speak(`You are now on the ${name} page`);
  }, [location.pathname]);

  /* -------------------- UI -------------------- */
  if (!supported)
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 text-red-800 border border-red-300 px-3 py-2 rounded-lg text-sm">
        Voice Assistant not supported
      </div>
    );

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {listening && (
        <div className="text-sm bg-white border border-sky-400 shadow px-3 py-2 rounded-lg animate-pulse">
          🎙️ Listening: <span className="italic text-gray-500">{interim}</span>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-300 px-3 py-2 rounded-lg text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
        aria-label="Voice control button"
        className={`rounded-full h-16 w-16 flex items-center justify-center shadow-lg border-4 transition-all ${
          listening
            ? "bg-sky-500 border-sky-700 text-white animate-pulse"
            : "bg-white border-sky-400 text-sky-600 hover:bg-sky-50"
        }`}
      >
        {listening ? <MicOff size={28} /> : <Mic size={28} />}
      </button>

      <button
        onClick={() =>
          speak(
            "Say open appointments, open emergency, read page, or go back. Hold the microphone button while speaking."
          )
        }
        className="rounded-full h-12 w-12 flex items-center justify-center bg-gray-100 border border-gray-300 hover:bg-gray-200"
        aria-label="Voice help"
      >
        <HelpCircle size={22} />
      </button>
    </div>
  );
}
