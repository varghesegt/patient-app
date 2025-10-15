import React, { useEffect, useRef, useState, useMemo, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

/* ---------- Utilities ---------- */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const vibrate = (ms = 150) => navigator.vibrate && navigator.vibrate(ms);

/* ---------- VoiceNavigator Component ---------- */
export default function VoiceNavigatorHandsFree() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useContext(LanguageContext);

  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [active, setActive] = useState(true);
  const speakerOnRef = useRef(true);

  /* ---------- Language Detection ---------- */
  const detectLanguage = (text) => {
    if (/[\u0B80-\u0BFF]/.test(text)) return "ta"; // Tamil
    if (/[\u0900-\u097F]/.test(text)) return "hi"; // Hindi
    return "en";
  };

  /* ---------- Localized Voice Strings ---------- */
  const VOICE_STRINGS = {
    en: {
      page: (p) => `You are now on the ${p} page.`,
      help: "You can say — open emergency, check symptoms, open appointments, read page, or scroll down.",
      sorry: "Sorry, I did not catch that. Say help for assistance.",
      speakerEnabled: "Speaker enabled.",
      emergency: "Emergency activated. Please stay calm.",
      triggerSOS: "Do you want to trigger SOS? Say yes or no.",
      sosTriggered: "SOS triggered. Ambulance has been alerted.",
      sosCancelled: "SOS cancelled.",
      logout: "You are logged out. Stay safe!",
    },
    hi: {
      page: (p) => `आप अब ${p} पेज पर हैं।`,
      help: "आप कह सकते हैं — इमरजेंसी खोलो, लक्षण जांचो, डॉक्टर अपॉइंटमेंट, पेज पढ़ो, नीचे स्क्रॉल करो।",
      sorry: "माफ करें, मैं समझ नहीं पाया। सहायता के लिए हेल्प बोलें।",
      speakerEnabled: "स्पीकर चालू है।",
      emergency: "आपातकाल सक्रिय किया गया है। शांत रहें।",
      triggerSOS: "क्या आप SOS चालू करना चाहते हैं? हाँ या नहीं कहें।",
      sosTriggered: "SOS चालू किया गया। एम्बुलेंस को सूचना दे दी गई है।",
      sosCancelled: "SOS रद्द किया गया।",
      logout: "आप लॉग आउट हो गए हैं। सुरक्षित रहें!",
    },
    ta: {
      page: (p) => `நீங்கள் இப்போது ${p} பக்கத்தில் இருக்கிறீர்கள்.`,
      help: "நீங்கள் சொல்லலாம் — அவசரம் திற, அறிகுறி பார்க்க, டாக்டர் நேரம், பக்கம் படி, கீழே நகர்த்து.",
      sorry: "மன்னிக்கவும், எனக்கு புரியவில்லை. உதவி என்று சொல்லுங்கள்.",
      speakerEnabled: "ஒலி இயக்கப்பட்டது.",
      emergency: "அவசரம் செயல்படுத்தப்பட்டது. அமைதியாக இருங்கள்.",
      triggerSOS: "SOS இயக்கவா? ஆமாம் அல்லது இல்லை என்று சொல்லுங்கள்.",
      sosTriggered: "SOS இயக்கப்பட்டது. ஆம்புலன்ஸ் தகவல் பெறப்பட்டது.",
      sosCancelled: "SOS ரத்து செய்யப்பட்டது.",
      logout: "நீங்கள் வெளியேறியுள்ளீர்கள். பாதுகாப்பாக இருங்கள்.",
    },
  };

  const L = VOICE_STRINGS[lang];

  /* ---------- Speak Utility ---------- */
  const speak = async (text, rate = 1) => {
    if (!speakerOnRef.current || !synth) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "ta" ? "ta-IN" : lang === "hi" ? "hi-IN" : "en-IN";
      u.rate = rate;
      synth.speak(u);
    } catch (err) {
      console.warn("Speech error:", err);
    }
  };

  const stopAllSpeech = () => {
    try {
      synth.cancel();
    } catch {}
  };

  /* ---------- Commands ---------- */
  const commands = useMemo(
    () => [
      { key: "home", match: /(home|dashboard|main|முகப்பு|मेन)/i, action: () => navigate("/") },
      { key: "appointments", match: /(appointment|doctor|नियम|மருத்துவ நேரம்)/i, action: () => navigate("/appointments") },
      { key: "records", match: /(record|history|इतिहास|பதிவு)/i, action: () => navigate("/records") },
      { key: "doctors", match: /(doctor|hospital|डॉक्टर|மருத்துவர்)/i, action: () => navigate("/doctors") },
      { key: "profile", match: /(profile|account|प्रोफाइल|சுயவிவரம்)/i, action: () => navigate("/profile") },
      { key: "contact", match: /(contact|support|help|संपर्क|தொடர்பு)/i, action: () => navigate("/contact") },
      { key: "about", match: /(about|info|जानकारी|தகவல்)/i, action: () => navigate("/about") },
      { key: "symptom", match: /(symptom|लक्षण|அறிகுறி)/i, action: () => navigate("/symptoms") },

      {
        key: "emergency",
        match: /(emergency|ambulance|sos|आपातकाल|அவசரம்)/i,
        action: async () => {
          vibrate(300);
          await speak(L.emergency);
          navigate("/emergency");
          await delay(2000);
          await speak(L.triggerSOS);
        },
      },
      { key: "sosYes", match: /^(yes|हाँ|ஆமாம்|ஆம்)$/i, action: () => speak(L.sosTriggered) },
      { key: "sosNo", match: /^(no|नहीं|இல்லை)$/i, action: () => speak(L.sosCancelled) },

      { key: "scrollDown", match: /(scroll down|नीचे|கீழே)/i, action: () => window.scrollBy({ top: 600, behavior: "smooth" }) },
      { key: "scrollUp", match: /(scroll up|ऊपर|மேலே)/i, action: () => window.scrollBy({ top: -600, behavior: "smooth" }) },

      {
        key: "read",
        match: /(read|पढ़ो|படி)/i,
        action: () => {
          if (!speakerOnRef.current) return;
          const title = document.querySelector("h1,h2,h3")?.textContent || "this page";
          const text = document.body.innerText.slice(0, 250);
          speak(`${title}. ${text}`);
        },
      },

      { key: "mute", match: /(mute|म्यूट|ம்யூட்)/i, action: () => { speakerOnRef.current = false; setSpeakerOn(false); stopAllSpeech(); vibrate(80); } },
      { key: "unmute", match: /(unmute|अनम्यूट|குரல் திற)/i, action: () => { speakerOnRef.current = true; setSpeakerOn(true); vibrate(80); speak(L.speakerEnabled); } },

      { key: "pause", match: /(pause listening|रुको|நிறுத்து)/i, action: () => stopListening() },
      { key: "resume", match: /(resume listening|सुनो|கேள்)/i, action: () => startListening() },

      { key: "logout", match: /(logout|exit|लॉग आउट|வெளியேறு)/i, action: async () => { await speak(L.logout); navigate("/login"); } },
      { key: "help", match: /(help|assist|सहायता|உதவி)/i, action: () => speak(L.help) },
      { key: "stop", match: /(stop|quiet|चुप|அமைதி)/i, action: () => stopAllSpeech() },
    ],
    [navigate, L]
  );

  /* ---------- Speech Recognition Setup ---------- */
  useEffect(() => {
    if (!SR) {
      setError("Voice recognition not supported.");
      return;
    }

    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.continuous = true;

    rec.onstart = () => setListening(true);
    rec.onerror = (e) => {
      if (["no-speech", "network", "aborted"].includes(e.error)) {
        setTimeout(() => { try { rec.start(); } catch {} }, 1000);
      } else setError(e.error);
    };
    rec.onend = () => {
      if (active) {
        setListening(false);
        setTimeout(() => { try { rec.start(); } catch {} }, 800);
      }
    };
    rec.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      const detectedLang = detectLanguage(transcript);
      if (detectedLang !== lang) setLang(detectedLang); // sync to context
      handleCommand(transcript.toLowerCase());
    };

    recRef.current = rec;
    try { rec.start(); } catch (err) { console.warn(err); }

    return () => {
      try { rec.stop(); } catch {}
      stopAllSpeech();
    };
  }, [active]);

  const stopListening = () => {
    setActive(false);
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  };

  const startListening = () => {
    setActive(true);
    try { recRef.current?.start(); } catch {}
  };

  const handleCommand = async (speech) => {
    const match = commands.find((c) => c.match.test(speech));
    if (match) {
      await speak(lang === "ta" ? "சரி" : lang === "hi" ? "ठीक है" : "Okay");
      await delay(300);
      match.action();
    } else {
      await speak(L.sorry);
    }
  };

  /* ---------- Page Announcer ---------- */
  useEffect(() => {
    if (!speakerOnRef.current) return;
    const pathName = location.pathname.split("/").pop() || "home";
    const pageName =
      t.nav[pathName] ||
      t.home?.title ||
      pathName.charAt(0).toUpperCase() + pathName.slice(1);
    speak(L.page(pageName));
  }, [location.pathname, lang]);

  /* ---------- UI ---------- */
  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col items-center">
      {error ? (
        <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-xs mb-2">
          {error}
        </div>
      ) : (
        <div
          className={`rounded-full w-6 h-6 border-4 ${
            listening ? "border-green-500 animate-pulse" : "border-gray-400"
          }`}
          title={listening ? "Listening…" : "Voice ready"}
        />
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => {
            const next = !speakerOn;
            setSpeakerOn(next);
            speakerOnRef.current = next;
            if (!next) stopAllSpeech();
            else speak(L.speakerEnabled);
          }}
          className={`px-3 py-1 text-xs rounded-full border ${
            speakerOn ? "bg-green-50 border-green-300" : "bg-gray-100 border-gray-300"
          }`}
        >
          {speakerOn ? "🔊 Speaker On" : "🔇 Speaker Off"}
        </button>
        <button
          onClick={() => (active ? stopListening() : startListening())}
          className={`px-3 py-1 text-xs rounded-full border ${
            active ? "bg-blue-50 border-blue-300" : "bg-gray-100 border-gray-300"
          }`}
        >
          {active ? "🎤 Mic On" : "🛑 Mic Off"}
        </button>
      </div>
      <p className="text-[10px] text-gray-500 mt-1">
        🌐 {lang.toUpperCase()} mode
      </p>
    </div>
  );
}
