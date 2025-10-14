import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* =============================================================
   Advanced Voice Navigator (Hands-Free, Multilingual, Accessible)
   - Auto language detection (English/Hindi/Tamil) + manual override
   - Wake word (optional) — "medilink" / "மெடிலிங்க்" / "मेडीलिंक"
   - Speaker (TTS) on/off + Reading mode toggle
   - Rich, multilingual command synonyms for each page
   - Patient-friendly intents (symptoms, appointments, emergency)
   - Multiple phrasings: “go to”, “open”, “show”, “take me to”, etc.
   - Screen-reader style reading (headings + first paragraphs)
   - Visual status widget + keyboard shortcuts (M = mute, L = listen)
   - Settings persisted in localStorage
   ============================================================= */

// ---- Safe guards for browser APIs ----
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

/* ============================== Storage ============================== */
const LS_KEYS = {
  SETTINGS: "vn_settings_v2",
};
const save = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
};
const load = (k, f) => {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; }
};

/* ============================== Languages ============================== */
const SUPPORTED = {
  en: {
    label: "English",
    srLang: "en-IN", // SpeechRecognition locale
    ttsLang: "en-IN", // SpeechSynthesis locale
    wake: ["medilink"],
    openWords: ["open", "go to", "show", "take me to", "navigate", "launch"],
    sayYes: ["yes", "yeah", "yup", "confirm", "okay", "ok"],
    sayNo: ["no", "nope", "cancel", "stop"],
    helpText:
      "Say: open emergency, check symptoms, open appointments, read page, scroll down, mute voice, or switch to Hindi/Tamil.",
    words: {
      readingOn: "Reading enabled.",
      readingOff: "Reading disabled.",
      voiceMuted: "Voice muted.",
      voiceUnmuted: "Voice unmuted.",
      listeningOn: "Listening on.",
      listeningOff: "Listening off.",
      onPage: (p) => `You are now on the ${p} page.`,
      didNotCatch: "Sorry, I didn't catch that. Say 'help' for options.",
      emergency: "Emergency activated. Connecting to the nearest ambulance service.",
      sosQuery: "Do you want to trigger SOS? Say yes or no.",
      sosYes: "SOS triggered successfully. Ambulance has been alerted.",
      sosNo: "Okay, SOS cancelled.",
      symptomOpen: "Symptom checker opened. Please describe your problem.",
      languageSet: (l) => `Language set to ${l}.`,
    },
    routeSyns: {
      home: ["home", "dashboard", "main"],
      appointments: ["appointments", "appointment", "booking", "book doctor", "book appointment"],
      records: ["records", "record", "history", "medical history"],
      doctors: ["doctors", "doctor", "specialist", "find doctor", "find cardiologist", "find pediatrician"],
      profile: ["profile", "account", "my account"],
      contact: ["contact", "support", "help desk"],
      about: ["about", "info", "information"],
      emergency: ["emergency", "ambulance", "sos", "help"],
      symptoms: ["symptom", "symptoms", "check health", "triage", "fever", "pain"],
      login: ["login", "sign in"],
    },
  },
  hi: {
    label: "हिन्दी",
    srLang: "hi-IN",
    ttsLang: "hi-IN",
    wake: ["मेडीलिंक", "मेडिलिंक"],
    openWords: ["खोलो", "जाओ", "ले चलो", "दिखाओ", "खोल", "ओपन"],
    sayYes: ["हाँ", "हां", "जी", "ठीक है"],
    sayNo: ["नहीं", "रद्द", "रुको"],
    helpText:
      "बोलें: इमरजेंसी खोलो, लक्षण जांचो, अपॉइंटमेंट खोलो, पेज पढ़ो, नीचे स्क्रॉल करो, आवाज़ बन्द करो, भाषा बदलो।",
    words: {
      readingOn: "रीडिंग चालू।",
      readingOff: "रीडिंग बन्द।",
      voiceMuted: "आवाज़ बन्द।",
      voiceUnmuted: "आवाज़ चालू।",
      listeningOn: "सुन रहा हूँ।",
      listeningOff: "सुनना बन्द।",
      onPage: (p) => `${p} पेज पर हैं।`,
      didNotCatch: "माफ़ कीजिए, समझ नहीं पाया। 'help' बोलें।",
      emergency: "इमरजेंसी सक्रिय। नज़दीकी एम्बुलेंस से कनेक्ट कर रहा हूँ।",
      sosQuery: "क्या SOS ट्रिगर करना है? हाँ या नहीं बोलें।",
      sosYes: "SOS ट्रिगर हो गया। एम्बुलेंस को सूचना भेजी गई।",
      sosNo: "ठीक है, SOS रद्द।",
      symptomOpen: "लक्षण जाँच खुल गई है। कृपया समस्या बताइए।",
      languageSet: (l) => `भाषा ${l} पर सेट।`,
    },
    routeSyns: {
      home: ["होम", "डैशबोर्ड", "मुख्य"],
      appointments: ["अपॉइंटमेंट", "बुकिंग", "डॉक्टर बुक करो"],
      records: ["रिकॉर्ड", "इतिहास", "मेडिकल हिस्ट्री"],
      doctors: ["डॉक्टर", "विशेषज्ञ", "डॉक्टर ढूंढो"],
      profile: ["प्रोफाइल", "अकाउंट"],
      contact: ["संपर्क", "हेल्प डेस्क", "सपोर्ट"],
      about: ["अबाउट", "जानकारी"],
      emergency: ["आपातकाल", "इमरजेंसी", "एम्बुलेंस", "एसओएस"],
      symptoms: ["लक्षण", "हेल्थ चेक"],
      login: ["लॉगिन", "साइन इन"],
    },
  },
  ta: {
    label: "தமிழ்",
    srLang: "ta-IN",
    ttsLang: "ta-IN",
    wake: ["மெடிலிங்க்", "மெடிலிங்க"],
    openWords: ["திற", "போ", "காட்டு", "எடுத்து செல்", "ஓப்பன்"],
    sayYes: ["ஆமாம்", "ஆம்", "சரி"],
    sayNo: ["இல்லை", "ரத்து", "நிறுத்து"],
    helpText:
      "சொல்லுங்கள்: அவசரம் திற, அறிகுறி சரி, நேரம் திற, பக்கம் படி, கீழே ஸ்க்ரோல், வாய் மியூட், மொழி மாற்று.",
    words: {
      readingOn: "படித்தல் இயக்கப்பட்டது.",
      readingOff: "படித்தல் நிறுத்தப்பட்டது.",
      voiceMuted: "குரல் ம்யூட் செய்யப்பட்டது.",
      voiceUnmuted: "குரல் ம்யூட் நீக்கப்பட்டது.",
      listeningOn: "கேட்கிறது.",
      listeningOff: "கேட்கவில்லை.",
      onPage: (p) => `${p} பக்கத்தில் இருக்கிறீர்கள்.`,
      didNotCatch: "மன்னிக்கவும், தெளிவாக இல்லை. 'help' என்று சொல்லுங்கள்.",
      emergency: "அவசரம் தொடங்கப்பட்டது. அருகிலுள்ள ஆம்புலன்ஸுடன் இணைக்கிறது.",
      sosQuery: "SOS இயக்க வேண்டுமா? ஆம் அல்லது இல்லை என்று சொல்லுங்கள்.",
      sosYes: "SOS வெற்றிகரமாக இயக்கப்பட்டது. ஆம்புலன்ஸுக்கு தகவல் அனுப்பப்பட்டது.",
      sosNo: "சரி, SOS ரத்து செய்யப்பட்டது.",
      symptomOpen: "அறிகுறி சரிபார்ப்பு திறக்கப்பட்டது. உங்கள் பிரச்சனையை விவரிக்கவும்.",
      languageSet: (l) => `மொழி ${l} ஆக மாற்றப்பட்டது.`,
    },
    routeSyns: {
      home: ["முகப்பு", "டாஷ்போர்டு", "மெயின்"],
      appointments: ["நேரம்", "அப்பாயின்ட்மெண்ட்", "புக்கிங்"],
      records: ["வரலாறு", "பதிவு", "மெடிக்கல் ஹிஸ்டரி"],
      doctors: ["மருத்துவர்", "டாக்டர்", "ஸ்பெஷலிஸ்ட்"],
      profile: ["சுயவிவரம்", "அக்கவுண்ட்"],
      contact: ["தொடர்பு", "சப்போர்ட்", "ஹெல்ப் டெஸ்க்"],
      about: ["எங்களை பற்றி", "தகவல்"],
      emergency: ["அவசரம்", "ஆம்புலன்ஸ்", "எஸ்ஓஎஸ்"],
      symptoms: ["அறிகுறி", "ஹெல்த் செக்"],
      login: ["லாகின்", "சைன் இன்"],
    },
  },
};

// Detect script to infer language quickly
const detectLangFromText = (t) => {
  if (!t) return "en";
  const hasDevanagari = /[\u0900-\u097F]/.test(t);
  const hasTamil = /[\u0B80-\u0BFF]/.test(t);
  if (hasTamil) return "ta";
  if (hasDevanagari) return "hi";
  return "en";
};

// Speak helper with promise so we can stop/start SR around TTS
const speakAsync = (text, lang = "en-IN", enabled = true, rate = 1) =>
  new Promise((resolve) => {
    if (!synth || !enabled || !text) return resolve();
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      u.onend = () => resolve();
      // Cancel any pending utterances to avoid queue pile-up
      synth.cancel();
      synth.speak(u);
    } catch {
      resolve();
    }
  });

export default function VoiceNavigatorHandsFree({
  wakeWordEnabled = false,            // Set true to require wake word
  defaultLang = "auto",               // "auto" | "en" | "hi" | "ta"
  initialReading = true,              // auto read page announce
}) {
  const navigate = useNavigate();
  const location = useLocation();

  /* --------------------------- State & Refs --------------------------- */
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true); // speaker on/off
  const [readingEnabled, setReadingEnabled] = useState(initialReading);
  const [manualLang, setManualLang] = useState(load(LS_KEYS.SETTINGS, { lang: defaultLang }).lang || defaultLang);
  const [activeLang, setActiveLang] = useState(manualLang === "auto" ? "en" : manualLang);
  const [wakeOn, setWakeOn] = useState(wakeWordEnabled);

  // persist settings
  useEffect(() => {
    save(LS_KEYS.SETTINGS, { lang: manualLang });
  }, [manualLang]);

  // Build page route map once
  const routeMap = useMemo(() => ({
    home: "/",
    appointments: "/appointments",
    records: "/records",
    doctors: "/doctors",
    profile: "/profile",
    contact: "/contact",
    about: "/about",
    emergency: "/emergency",
    symptoms: "/symptoms",
    login: "/login",
  }), []);

  // Build commands dynamically per language
  const built = useMemo(() => {
    const perLang = {};
    for (const code of Object.keys(SUPPORTED)) {
      const L = SUPPORTED[code];
      const open = L.openWords.map(escapeRx).join("|");

      // Turn route synonyms into regex
      const routeCmds = Object.entries(L.routeSyns).flatMap(([key, syns]) => {
        const s = syns.map(escapeRx).join("|");
        // e.g., "open appointments", "go to appointment page", plain "appointments"
        const pat1 = new RegExp(`(?:^|\b)(?:${open})\s+(?:the\s+)?(?:${s})(?:\s+page)?(?:\b|$)`, "i");
        const pat2 = new RegExp(`(?:^|\b)(?:${s})(?:\s+page)?(?:\b|$)`, "i");
        return [
          { key, match: pat1 },
          { key, match: pat2 },
        ];
      });

      // Global helpers
      const yesRx = new RegExp(`^(?:${L.sayYes.map(escapeRx).join("|")})$`, "i");
      const noRx = new RegExp(`^(?:${L.sayNo.map(escapeRx).join("|")})$`, "i");
      const helpRx = /(help|commands|guide|सहायता|உதவி)/i; // universal
      const scrollDownRx = /(scroll down|नीचे|கீழே)/i;
      const scrollUpRx = /(scroll up|ऊपर|மேலே)/i;
      const backRx = /(go back|back|पीछे|பின்னால்)/i;
      const readRx = /(read(\s+page)?|speak|listen|सुनाओ|படி)/i;
      const stopReadRx = /(stop reading|stop speak|quiet|रुको|நிறுத்து)/i;
      const muteRx = /(mute voice|voice off|आवाज़ बन्द|குரல் ம்யூட்)/i;
      const unmuteRx = /(unmute voice|voice on|आवाज़ चालू|குரல் ம்யூட் நீக்கு)/i;
      const listenOffRx = /(stop listening|listening off|सुनना बन्द|கேட்கவில்லை)/i;
      const listenOnRx = /(start listening|listening on|सुनना चालू|கேட்கிறது)/i;

      // Language switchers
      const toEn = /(english|इंग्लिश|ஆங்கிலம்)/i;
      const toHi = /(hindi|हिन्दी|हिंदी)/i;
      const toTa = /(tamil|தமிழ்)/i;

      // Patient intents (lightweight)
      const chestPain = /(chest pain|सीने में दर्द|மார்பு வலி)/i;
      const fever = /(fever|बुखार|காய்ச்சல்)/i;
      const dizziness = /(dizzy|चक्कर|சுற்றல்)/i;
      const bookDoctor = /(book doctor|doctor b(oo)?k|डॉक्टर बुक|மருத்துவர் புக்)/i;
      const findCardio = /(cardiolog(ist|y)|कार्डियोलॉजिस्ट|இதய நிபுணர்)/i;

      perLang[code] = {
        L,
        routeCmds,
        yesRx, noRx, helpRx,
        scrollDownRx, scrollUpRx, backRx, readRx, stopReadRx,
        muteRx, unmuteRx, listenOffRx, listenOnRx,
        toEn, toHi, toTa,
        chestPain, fever, dizziness, bookDoctor, findCardio,
      };
    }
    return perLang;
  }, []);

  /* ----------------------- Recognition lifecycle ----------------------- */
  useEffect(() => {
    if (!SR) {
      setError("Voice recognition not supported in this browser.");
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = SUPPORTED[activeLang]?.srLang || "en-IN";

    rec.onstart = () => setListening(true);
    rec.onerror = (e) => setError(e?.error || "speech-error");
    rec.onend = () => {
      setListening(false);
      // Auto-restart unless explicitly stopped via listenOff
      if (!listenStopRef.current) {
        setTimeout(() => { try { rec.start(); } catch {} }, 900);
      }
    };

    rec.onresult = (ev) => {
      const transcript = ev.results[ev.results.length - 1][0].transcript.trim();
      handleSpeech(transcript);
    };

    recRef.current = rec;
    // Start listening (unless explicitly off)
    try { rec.start(); } catch {}

    return () => {
      try { rec.stop(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLang]);

  // To control manual stop of SR so onend doesn't auto-restart
  const listenStopRef = useRef(false);

  const stopRecognition = () => {
    listenStopRef.current = true;
    try { recRef.current?.stop(); } catch {}
  };
  const startRecognition = () => {
    listenStopRef.current = false;
    try { recRef.current?.start(); } catch {}
  };

  /* ------------------------ Language switching ------------------------ */
  const setLanguage = async (code) => {
    const final = code === "auto" ? detectLangFromText("") : code;
    setManualLang(code);
    if (code === "auto") {
      // keep current activeLang; auto will update per utterance
      await speakAsync(SUPPORTED[activeLang].words.languageSet(SUPPORTED[activeLang].label), SUPPORTED[activeLang].ttsLang, voiceEnabled);
      return;
    }
    setActiveLang(final);
    const L = SUPPORTED[final] || SUPPORTED.en;
    if (recRef.current) recRef.current.lang = L.srLang;
    await speakAsync(L.words.languageSet(L.label), L.ttsLang, voiceEnabled);
  };

  /* --------------------------- Command engine --------------------------- */
  const handleSpeech = async (raw) => {
    const speech = raw.toLowerCase();

    // Auto-detect language if manualLang === 'auto'
    let langCode = manualLang === "auto" ? detectLangFromText(speech) : manualLang;
    if (langCode === "auto") langCode = activeLang; // fallback

    if (langCode !== activeLang) {
      setActiveLang(langCode);
      if (recRef.current) recRef.current.lang = SUPPORTED[langCode].srLang;
    }

    const ctx = built[langCode];
    const { L } = ctx;

    // Optional wake word
    if (wakeOn) {
      const wakeHit = [ ...SUPPORTED.en.wake, ...SUPPORTED.hi.wake, ...SUPPORTED.ta.wake ]
        .some(w => speech.startsWith(w.toLowerCase()));
      if (!wakeHit) return; // ignore until wake word
    }

    // Language switch commands
    if (ctx.toEn.test(speech)) return setLanguage("en");
    if (ctx.toHi.test(speech)) return setLanguage("hi");
    if (ctx.toTa.test(speech)) return setLanguage("ta");

    // Listening on/off
    if (ctx.listenOffRx.test(speech)) {
      stopRecognition();
      await speakAsync(L.words.listeningOff, L.ttsLang, voiceEnabled);
      return;
    }
    if (ctx.listenOnRx.test(speech)) {
      await speakAsync(L.words.listeningOn, L.ttsLang, voiceEnabled);
      startRecognition();
      return;
    }

    // Speaker mute/unmute
    if (ctx.muteRx.test(speech)) { setVoiceEnabled(false); vibrate(80); return; }
    if (ctx.unmuteRx.test(speech)) { setVoiceEnabled(true); vibrate(80); await speakAsync(L.words.voiceUnmuted, L.ttsLang, true); return; }

    // Read page / stop reading
    if (ctx.readRx.test(speech)) { vibrate(40); await readCurrentPage(langCode); return; }
    if (ctx.stopReadRx.test(speech)) { synth?.cancel(); vibrate(40); return; }

    // Scrolling & navigation helpers
    if (ctx.scrollDownRx.test(speech)) return window.scrollBy({ top: 650, behavior: "smooth" });
    if (ctx.scrollUpRx.test(speech)) return window.scrollBy({ top: -650, behavior: "smooth" });
    if (ctx.backRx.test(speech)) return navigate(-1);

    // SOS flow (yes/no)
    if (ctx.yesRx.test(speech) && sosAwaitRef.current) { sosAwaitRef.current = false; return speakAsync(L.words.sosYes, L.ttsLang, voiceEnabled); }
    if (ctx.noRx.test(speech) && sosAwaitRef.current)  { sosAwaitRef.current = false; return speakAsync(L.words.sosNo, L.ttsLang, voiceEnabled); }

    // Patient-friendly quick intents
    if (ctx.chestPain.test(speech) || ctx.fever.test(speech) || ctx.dizziness.test(speech)) {
      navigate("/symptoms?from=voice");
      await speakAsync(L.words.symptomOpen, L.ttsLang, voiceEnabled);
      return;
    }
    if (ctx.bookDoctor.test(speech)) { navigate("/appointments?intent=book"); return; }
    if (ctx.findCardio.test(speech)) { navigate("/doctors?specialty=cardiology"); return; }

    // Route commands (multiple styles to open a page)
    const hit = ctx.routeCmds.find((c) => c.match.test(speech));
    if (hit) {
      const path = routeMap[hit.key] || "/";
      vibrate(60);
      navigate(path);
      await speakAsync(`Okay, ${hit.key}.`, L.ttsLang, voiceEnabled);
      if (hit.key === "emergency") {
        await speakAsync(L.words.emergency, L.ttsLang, voiceEnabled);
        sosAwaitRef.current = true;
        await speakAsync(L.words.sosQuery, L.ttsLang, voiceEnabled);
      }
      if (hit.key === "symptoms") {
        await speakAsync(L.words.symptomOpen, L.ttsLang, voiceEnabled);
      }
      return;
    }

    // Help
    if (ctx.helpRx.test(speech)) {
      await speakAsync(L.helpText, L.ttsLang, voiceEnabled);
      return;
    }

    // Fallback: treat as free-form symptom description (assist accessibility)
    navigate(`/symptoms?utterance=${encodeURIComponent(raw)}`);
    await speakAsync(L.words.symptomOpen, L.ttsLang, voiceEnabled);
  };

  // SOS awaiting confirmation state
  const sosAwaitRef = useRef(false);

  // Read the current page in a simple, accessible way
  const readCurrentPage = async (langCode) => {
    const L = SUPPORTED[langCode] || SUPPORTED.en;
    if (!readingEnabled) {
      setReadingEnabled(true);
      await speakAsync(L.words.readingOn, L.ttsLang, voiceEnabled);
    }
    const title = (document.querySelector("h1,h2,h3")?.textContent || "this page").trim();
    // grab some body text but keep it short
    const raw = document.body?.innerText || "";
    const text = raw.replace(/\s+/g, " ").slice(0, 380);
    await speakAsync(`${title}. ${text}`, L.ttsLang, voiceEnabled);
  };

  /* --------------------------- Page announce --------------------------- */
  useEffect(() => {
    const code = manualLang === "auto" ? activeLang : manualLang;
    const L = SUPPORTED[code] || SUPPORTED.en;
    if (!voiceEnabled || !readingEnabled) return;
    const name = location.pathname.split("/").pop() || "home";
    const title = name.replace(/-/g, " ");
    speakAsync(L.words.onPage(title), L.ttsLang, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /* --------------------------- Keyboard helpers --------------------------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === "m") { // mute/unmute
        setVoiceEnabled((v) => !v);
      }
      if (e.key.toLowerCase() === "l") { // listen on/off
        if (listenStopRef.current) {
          startRecognition();
        } else {
          stopRecognition();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------------------ UI Widget ------------------------------ */
  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-end gap-2 select-none">
      {/* Error bubble */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-xs shadow">{error}</div>
      )}

      {/* Control Panel */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-3 w-[280px]">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Voice Assistant</div>
          <div className={`w-2.5 h-2.5 rounded-full ${listening ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} title={listening ? "Listening…" : "Idle"} />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {/* Speaker toggle */}
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            className={`px-2 py-1 rounded-lg border ${voiceEnabled ? "bg-emerald-50 border-emerald-200" : "bg-slate-100 dark:bg-slate-800 border-slate-300"}`}
          >{voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}</button>

          {/* Reading toggle */}
          <button
            onClick={() => setReadingEnabled(r => !r)}
            className={`px-2 py-1 rounded-lg border ${readingEnabled ? "bg-indigo-50 border-indigo-200" : "bg-slate-100 dark:bg-slate-800 border-slate-300"}`}
          >{readingEnabled ? "📖 Read On" : "📘 Read Off"}</button>

          {/* Listening toggle */}
          <button
            onClick={() => (listenStopRef.current ? startRecognition() : stopRecognition())}
            className={`px-2 py-1 rounded-lg border ${!listenStopRef.current ? "bg-green-50 border-green-200" : "bg-slate-100 dark:bg-slate-800 border-slate-300"}`}
          >{!listenStopRef.current ? "🎤 Listening" : "🛑 Not Listening"}</button>

          {/* Wake word toggle */}
          <button
            onClick={() => setWakeOn(w => !w)}
            className={`px-2 py-1 rounded-lg border ${wakeOn ? "bg-yellow-50 border-yellow-200" : "bg-slate-100 dark:bg-slate-800 border-slate-300"}`}
          >{wakeOn ? "🟡 Wake: On" : "⚪ Wake: Off"}</button>
        </div>

        {/* Language selector */}
        <div className="mt-3 text-xs">
          <label className="block text-[11px] opacity-80 mb-1">Language</label>
          <select
            value={manualLang}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full text-xs px-2 py-1 border rounded-lg bg-white dark:bg-slate-900"
          >
            <option value="auto">Auto (Detect)</option>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="ta">தமிழ்</option>
          </select>
        </div>

        {/* Quick tips */}
        <div className="mt-3 text-[11px] leading-snug opacity-90">
          <div className="font-semibold mb-1">Try:</div>
          <ul className="list-disc ml-4">
            <li>“open emergency” / “इमरजेंसी खोलो” / “அவசரம் திற”</li>
            <li>“go to appointments” / “अपॉइंटमेंट” / “நேரம்”</li>
            <li>“read page”, “mute voice”, “start listening”</li>
            <li>“switch to Hindi / Tamil”</li>
          </ul>
          <div className="mt-2 opacity-70">Keys: <b>M</b> mute, <b>L</b> listen.</div>
        </div>
      </div>
    </div>
  );
}

/* ============================== Utilities ============================== */
function escapeRx(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
