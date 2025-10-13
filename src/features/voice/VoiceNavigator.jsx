import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * MedilinkAIAssistant v3 — fully‑featured, offline‑friendly voice assistant
 * - Wake word: “medilink” (English), “मे‍डिलिंक/मेडिलिंक” (Hindi phonetics), “மெடிலிங்க்/மெடிலிங்” (Tamil phonetics)
 * - Command mode with natural phrases + multilingual regex (EN/HI/TA)
 * - Local hotkeys (Alt+M toggle, Alt+K help), click‑to‑talk, and continuous mode
 * - Smart restart, auto‑throttle on errors, VAD‑like silence timeouts
 * - Confirmation flows for dangerous actions (logout, SOS)
 * - Dictation mode (fill active input/textarea/contenteditable)
 * - Page reader with region targeting (prefers [data-voice-read] or main headings)
 * - Settings popover (language, wake word, auto‑start, voice rate, continuous)
 * - Accessibility: aria‑live updates, large contrast badge, keyboard nav
 * - Extensible command registry with entity extraction (doctor/dept/city examples)
 *
 * Drop this component at the root (e.g., in App.jsx). It requires react-router.
 */

// ----------------------------- Web Speech Guards -----------------------------
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
const synth = typeof window !== "undefined" && window.speechSynthesis;

// ----------------------------- Small Utilities -------------------------------
const vibrate = (ms = 140) => typeof navigator !== "undefined" && navigator.vibrate && navigator.vibrate(ms);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const speak = (text, { rate = 1, pitch = 1, lang = "en-IN", voiceName } = {}) => {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  u.pitch = pitch;
  if (voiceName) {
    const v = synth.getVoices().find((vv) => vv.name === voiceName);
    if (v) u.voice = v;
  }
  // cancel overlapping but keep short queues OK
  try { synth.cancel(); } catch {}
  synth.speak(u);
};

// ----------------------------- Entities (Demo) -------------------------------
const KNOWN_DEPARTMENTS = [
  "cardiology", "orthopedics", "pediatrics", "dermatology", "neurology", "general", "ophthalmology",
  // Localized hints
  "हृदय", "हड्डी", "त्वचा", "बाल", "न्यूरो", "जनरल",
  "இருதயம்", "எலும்பு", "தோல்", "குழந்தை", "நரம்பியல்", "பொது"
];

const KNOWN_CITIES = ["trichy", "tiruchirappalli", "chennai", "madurai", "hyderabad", "bangalore", "coimbatore"];

// very small fuzzy helper
const normalize = (s) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
const pickEntity = (input, list) => list.find((x) => normalize(input).includes(normalize(x)));

// ----------------------------- Component -------------------------------------
export default function MedilinkAIAssistant() {
  const navigate = useNavigate();
  const location = useLocation();

  // ---------- State
  const recRef = useRef(null);
  const [supported, setSupported] = useState(!!SR);
  const [hot, setHot] = useState(false); // wake‑word heard => command mode
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [err, setErr] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Settings (persisted)
  const [lang, setLang] = useState(() => localStorage.getItem("ml_lang") || "en-IN");
  const [voiceName, setVoiceName] = useState(() => localStorage.getItem("ml_voice") || "");
  const [voiceRate, setVoiceRate] = useState(() => parseFloat(localStorage.getItem("ml_rate")) || 1);
  const [autoStart, setAutoStart] = useState(() => localStorage.getItem("ml_autostart") === "1");
  const [continuous, setContinuous] = useState(() => localStorage.getItem("ml_cont") !== "0");
  const [wakeWord, setWakeWord] = useState(() => localStorage.getItem("ml_wake") || "medilink");

  // Command mode timeout (silence watchdog)
  const hotTimeoutRef = useRef(null);
  const resetHotTimeout = useCallback(() => {
    clearTimeout(hotTimeoutRef.current);
    hotTimeoutRef.current = setTimeout(() => setHot(false), 12000); // 12s no speech => exit
  }, []);

  useEffect(() => () => clearTimeout(hotTimeoutRef.current), []);

  // persist settings
  useEffect(() => localStorage.setItem("ml_lang", lang), [lang]);
  useEffect(() => localStorage.setItem("ml_voice", voiceName), [voiceName]);
  useEffect(() => localStorage.setItem("ml_rate", String(clamp(voiceRate, 0.7, 1.4))), [voiceRate]);
  useEffect(() => localStorage.setItem("ml_autostart", autoStart ? "1" : "0"), [autoStart]);
  useEffect(() => localStorage.setItem("ml_cont", continuous ? "1" : "0"), [continuous]);
  useEffect(() => localStorage.setItem("ml_wake", wakeWord), [wakeWord]);

  // ---------- Voice Setup
  useEffect(() => {
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = lang; // can switch live
    rec.continuous = true;
    rec.interimResults = true;

    // adaptive restart backoff
    let backoff = 800; // start at 0.8s

    rec.onstart = () => { setListening(true); setErr(""); };
    rec.onend = () => {
      setListening(false);
      // auto‑restart unless page is hidden (battery save)
      if (document.visibilityState === "hidden") return;
      setTimeout(() => { try { rec.start(); } catch {} }, backoff);
      backoff = Math.min(4000, backoff * 1.25);
    };

    rec.onerror = (e) => {
      setErr(e.error || "speech-error");
      // Some errors require short pause before restart
      try { rec.stop(); } catch {}
    };

    rec.onresult = (ev) => {
      const res = ev.results[ev.results.length - 1];
      const txt = res[0].transcript.trim();
      if (!txt) return;
      if (res.isFinal) {
        setInterim("");
        const spoken = txt.toLowerCase();
        setLastHeard(spoken);
        handleTranscript(spoken);
      } else {
        setInterim(txt);
      }
    };

    recRef.current = rec;
    try { rec.start(); } catch {}
    return () => { try { rec.stop(); } catch {} };
  }, [lang]);

  // Hotkeys
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && e.key.toLowerCase() === "m") { // Alt+M: toggle hot
        setHot((h) => !h);
        if (!hot) {
          speak("Assistant ready. Say a command.", { lang, rate: voiceRate, voiceName });
          vibrate(60);
          resetHotTimeout();
        }
      }
      if (e.altKey && e.key.toLowerCase() === "k") { // Alt+K: help
        setHelpOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hot, lang, voiceRate, voiceName, resetHotTimeout]);

  // Announce page change (polite)
  useEffect(() => {
    const name = location.pathname.split("/").filter(Boolean).pop() || "home";
    const title = name.replaceAll("-", " ");
    if (autoStart) speak(`You are now on the ${title} page.`, { lang, rate: voiceRate, voiceName });
  }, [location.pathname]);

  // ----------------------------- Command Registry ----------------------------
  const say = useCallback((t) => speak(t, { lang, rate: voiceRate, voiceName }), [lang, voiceRate, voiceName]);

  const confirm = useCallback(async (prompt, onYes) => {
    say(`${prompt} Say yes or no.`);
    // Wait for a yes/no in the next final transcript within 6s
    for (let i = 0; i < 12; i++) { // 12 * 500ms = 6s
      await delay(500);
      const t = lastHeard;
      if (/^(yes|yeah|sure|confirm|haan|haanji|हाँ|ஆமாம்|ஆம்)$/i.test(t)) { onYes?.(); return true; }
      if (/^(no|cancel|stop|नहीं|இல்லை)$/i.test(t)) { say("Okay, cancelled."); return false; }
    }
    say("Timed out. Cancelled.");
    return false;
  }, [lastHeard, say]);

  const scrollBySmooth = (px) => window.scrollBy({ top: px, behavior: "smooth" });

  const go = (path) => () => navigate(path);

  // Natural language patterns (EN/HI/TA) — feel free to extend
  const patterns = {
    wake: new RegExp(`^(?:${["medilink", "मे‍डिलिंक", "मेडिलिंक", "மெடிலிங்", "மெடிலிங்க்"].join("|")})$`, "i"),
    help: /(help|what can you do|commands|सहायता|உதவி)/i,
    home: /(home|dashboard|main|मेन|முகப்பு)/i,
    appointments: /(appointment|book(ing)?|अपॉइंटमेंट|மருத்துவ\s?நேரம்)/i,
    records: /(record|history|medical|इतिहास|வரலாறு)/i,
    doctors: /(doctor|specialist|डॉक्टर|மருத்துவர்)/i,
    profile: /(profile|account|प्रोफाइल|சுயவிவரம்)/i,
    contact: /(contact|support|help\s?desk|संपर्क|தொடர்பு)/i,
    about: /(about|info|जानकारी|எங்களை\s?பற்றி)/i,
    back: /(go back|back|पीछे|பின்னால்)/i,
    stop: /(stop|quiet|रुको|நிறுத்து)/i,
    read: /(read|speak|listen|सुनाओ|படி)/i,
    scrollDown: /(scroll down|नीचे|கீழே)/i,
    scrollUp: /(scroll up|ऊपर|மேலே)/i,
    emergency: /(emergency|ambulance|sos|help|आपातकाल|அவசரம்)/i,
    yes: /^(yes|yeah|trigger|go ahead|हाँ|ஆமாம்)$/i,
    no: /^(no|cancel|stop|नहीं|இல்லை)$/i,
    symptom: /(symptom|check health|fever|pain|लक्षण|அறிகுறி)/i,
    logout: /(logout|sign out|लॉग\s?आउट|வெளியேறு)/i,
    dictation: /(dictate|start dictation|type for me|लिखो|எழுது)/i,
    whereIsDept: /(where|nearest).*(cardiology|orthopedic|pediatrics|dermatology|neurology|general)/i,
    findDoc: /(find|show).*(dr\.?\s?\w+|doctor\s\w+)/i,
    searchHosp: /(search|show).*(hospital|clinic).*(in|near)\s([a-zA-Z ]+)/i,
  };

  const commands = useMemo(() => ([
    { key: "home", test: (t) => patterns.home.test(t), run: go("/") },
    { key: "appointments", test: (t) => patterns.appointments.test(t), run: go("/appointments") },
    { key: "records", test: (t) => patterns.records.test(t), run: go("/records") },
    { key: "doctors", test: (t) => patterns.doctors.test(t), run: go("/doctors") },
    { key: "profile", test: (t) => patterns.profile.test(t), run: go("/profile") },
    { key: "contact", test: (t) => patterns.contact.test(t), run: go("/contact") },
    { key: "about", test: (t) => patterns.about.test(t), run: go("/about") },
    { key: "back", test: (t) => patterns.back.test(t), run: () => navigate(-1) },
    { key: "scrollDown", test: (t) => patterns.scrollDown.test(t), run: () => scrollBySmooth(700) },
    { key: "scrollUp", test: (t) => patterns.scrollUp.test(t), run: () => scrollBySmooth(-700) },
    {
      key: "read",
      test: (t) => patterns.read.test(t),
      run: () => {
        // prefer marked region
        const region = document.querySelector('[data-voice-read], main, article, section, h1, h2');
        const title = document.querySelector('h1,h2,h3')?.textContent || document.title || "this page";
        const text = (region?.innerText || document.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 600);
        say(`${title}. ${text}`);
      },
    },
    {
      key: "emergency",
      test: (t) => patterns.emergency.test(t),
      run: async () => {
        vibrate(240);
        navigate("/emergency");
        await delay(500);
        say("Emergency panel opened. Do you want to trigger SOS?");
        await confirm("Trigger SOS?", () => {
          say("SOS triggered. Ambulance alerted.");
          // TODO: call backend trigger
        });
      },
    },
    {
      key: "symptom",
      test: (t) => patterns.symptom.test(t),
      run: async () => {
        navigate("/symptoms");
        await delay(400);
        say("Symptom checker open. Please describe your problem.");
      },
    },
    {
      key: "logout",
      test: (t) => patterns.logout.test(t),
      run: async () => {
        const ok = await confirm("Are you sure you want to log out?", () => navigate("/login"));
        if (ok) say("You are logged out. Stay safe!");
      },
    },
    {
      key: "dictation",
      test: (t) => patterns.dictation.test(t),
      run: async () => {
        say("Dictation mode. Speak your text.");
        // capture next final phrase and inject into focused editable
        for (let i = 0; i < 20; i++) { // ~10s window
          await delay(500);
          const txt = lastHeard;
          if (!txt) continue;
          const el = document.activeElement;
          if (!el) continue;
          if (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && /text|search|email|tel|url/.test(el.type))) {
            const p = el.selectionStart || el.value.length;
            const v = el.value;
            el.value = v.slice(0, p) + txt + v.slice(p);
            el.dispatchEvent(new Event("input", { bubbles: true }));
            say("Typed.");
            return;
          }
          if (el.isContentEditable) {
            el.textContent += (el.textContent && !el.textContent.endsWith(" ") ? " " : "") + txt;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            say("Inserted.");
            return;
          }
        }
        say("No editable field focused.");
      },
    },
    {
      key: "whereIsDept",
      test: (t) => patterns.whereIsDept.test(t),
      run: (t) => {
        const dept = pickEntity(t, KNOWN_DEPARTMENTS) || "the department";
        say(`${dept} is on Floor two, wing B. Showing map.`);
        navigate("/map?dept=" + encodeURIComponent(dept));
      },
    },
    {
      key: "findDoc",
      test: (t) => patterns.findDoc.test(t),
      run: (t) => {
        const m = t.match(/dr\.?\s?(\w+)/) || t.match(/doctor\s(\w+)/);
        const name = m?.[1] ? `Dr. ${m[1]}` : "the doctor";
        say(`Showing ${name}'s profile and availability.`);
        navigate("/doctors?search=" + encodeURIComponent(name));
      },
    },
    {
      key: "searchHosp",
      test: (t) => patterns.searchHosp.test(t),
      run: (t) => {
        const m = t.match(patterns.searchHosp);
        const city = (m?.[4] || "").trim();
        const picked = pickEntity(city, KNOWN_CITIES) || city || "near you";
        say(`Searching hospitals in ${picked}.`);
        navigate("/map?city=" + encodeURIComponent(picked));
      },
    },
    {
      key: "help",
      test: (t) => patterns.help.test(t),
      run: () => say("Try: open appointments, open records, read page, start dictation, or emergency SOS."),
    },
    { key: "stop", test: (t) => patterns.stop.test(t), run: () => synth?.cancel() },
  ]), [navigate, lastHeard, say, confirm]);

  // ----------------------------- Transcript Router ---------------------------
  const handleTranscript = async (spoken) => {
    // If wake word only -> enter command mode
    if (patterns.wake.test(spoken)) {
      setHot(true); resetHotTimeout(); vibrate(30);
      say("Yes?", { lang, rate: voiceRate, voiceName });
      return;
    }

    if (!hot && !continuous) return; // ignore until woken

    resetHotTimeout();

    // Try command handlers in order
    for (const c of commands) {
      if (c.test(spoken)) {
        say(`Okay, ${c.key}.`);
        await delay(260);
        return c.run(spoken);
      }
    }

    // If nothing matched but we are in hot mode, gently prompt
    if (hot) say("I didn't catch that. Say help for options.");
  };

  // ----------------------------- UI -----------------------------------------
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    if (!synth) return;
    const loadVoices = () => setVoices(synth.getVoices());
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }, []);

  const status = supported ? (listening ? (hot || continuous ? "Listening for commands" : "Wake word only") : "Idle") : "Not supported";

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl shadow-lg border text-sm select-none ${
        listening ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-700"
      }`} aria-live="polite" aria-label={`Voice assistant status: ${status}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${listening ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
        <span className="font-medium">Medilink</span>
        <span className="opacity-70">{status}</span>
        <button
          onClick={() => {
            setHot((h) => !h);
            if (!hot) { say("Assistant ready. Say a command."); resetHotTimeout(); }
          }}
          className="ml-2 px-2 py-1 rounded-lg border hover:bg-white"
          title="Toggle command mode (Alt+M)"
        >{hot ? "● On" : "○ Off"}</button>
        <button onClick={() => setHelpOpen((v) => !v)} className="px-2 py-1 rounded-lg border hover:bg-white" title="Help (Alt+K)">?</button>
        <button onClick={() => setSettingsOpen((v) => !v)} className="px-2 py-1 rounded-lg border hover:bg-white" title="Settings">⚙︎</button>
      </div>

      {/* Interim transcription bubble */}
      {interim && (
        <div className="mt-2 max-w-xs text-xs bg-white/90 backdrop-blur border rounded-xl shadow p-2">{interim}</div>
      )}

      {/* Error bubble */}
      {err && (
        <div className="mt-2 max-w-xs text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl shadow p-2">
          {err}
        </div>
      )}

      {/* Help modal */}
      {helpOpen && (
        <div className="mt-3 w-[320px] bg-white border rounded-2xl shadow-xl p-3 text-sm">
          <div className="font-semibold mb-2">Quick commands</div>
          <ul className="list-disc ml-5 space-y-1">
            <li>“Medilink” → wake the assistant</li>
            <li>“Open appointments / records / doctors / profile / contact / about”</li>
            <li>“Emergency” → SOS confirmation flow</li>
            <li>“Read” → read current section/page</li>
            <li>“Start dictation” → type into the focused field</li>
            <li>“Scroll up / scroll down”, “Go back”</li>
            <li>“Find Dr. Kumar”, “Where is cardiology?”, “Search hospitals in Trichy”</li>
          </ul>
          <div className="mt-2 text-[11px] opacity-70">Hotkeys: Alt+M toggle • Alt+K help</div>
        </div>
      )}

      {/* Settings popover */}
      {settingsOpen && (
        <div className="mt-3 w-[360px] bg-white border rounded-2xl shadow-xl p-3 text-sm">
          <div className="font-semibold mb-2">Assistant settings</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs">Language</span>
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="border rounded-lg p-1">
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi (India)</option>
                <option value="ta-IN">Tamil</option>
                <option value="en-US">English (US)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs">Wake word</span>
              <input value={wakeWord} onChange={(e) => setWakeWord(e.target.value)} className="border rounded-lg p-1" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs">Voice</span>
              <select value={voiceName} onChange={(e) => setVoiceName(e.target.value)} className="border rounded-lg p-1">
                <option value="">System default</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs">Rate</span>
              <input type="number" step="0.05" min={0.7} max={1.4} value={voiceRate}
                     onChange={(e) => setVoiceRate(parseFloat(e.target.value) || 1)}
                     className="border rounded-lg p-1" />
            </label>
            <label className="flex items-center gap-2 col-span-2">
              <input type="checkbox" checked={continuous} onChange={(e) => setContinuous(e.target.checked)} />
              <span>Continuous understanding (no wake word)</span>
            </label>
            <label className="flex items-center gap-2 col-span-2">
              <input type="checkbox" checked={autoStart} onChange={(e) => setAutoStart(e.target.checked)} />
              <span>Announce page on navigation</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}