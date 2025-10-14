import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

const speak = (text, rate = 1, lang = "en-IN") => {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  synth.cancel();
  synth.speak(u);
};
const vibrate = (ms = 150) => navigator.vibrate && navigator.vibrate(ms);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export default function VoiceNavigatorHandsFree() {
  const navigate = useNavigate();
  const location = useLocation();
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [active, setActive] = useState(true);
  const [lang, setLang] = useState("en-IN"); // Dynamic language mode

  /* ---------- Smart Speak with Stop ---------- */
  const safeSpeak = (text) => {
    if (!speakerOn || !synth) return;
    synth.cancel();
    speak(text, 1, lang);
  };

  /* ---------- Command Map (Ultra Expanded) ---------- */
  const commands = useMemo(
    () => [
      { key: "home", match: /(home|dashboard|main|start|homepage|begin|मेन|मुख्य|முகப்பு|மெயின்)/i, action: () => navigate("/") },
      { key: "appointments", match: /(appointment|book|booking|meeting|consult|doctor|visit|अपॉइंटमेंट|மருத்துவ நேரம்|நேரம்|புக்கிங்)/i, action: () => navigate("/appointments") },
      { key: "records", match: /(record|records|history|medical|report|data|इतिहास|வரலாறு|பதிவு)/i, action: () => navigate("/records") },
      { key: "doctors", match: /(doctor|specialist|consultant|physician|hospital|clinic|डॉक्टर|மருத்துவர்|மருத்துவமனை)/i, action: () => navigate("/doctors") },
      { key: "profile", match: /(profile|account|user|details|my info|प्रोफाइल|சுயவிவரம்|பயனர்)/i, action: () => navigate("/profile") },
      { key: "contact", match: /(contact|support|help|call|reach|email|संपर्क|உதவி|தொடர்பு|அதரவு)/i, action: () => navigate("/contact") },
      { key: "about", match: /(about|info|information|team|company|जानकारी|எங்களை பற்றி|தகவல்)/i, action: () => navigate("/about") },

      // Emergency
      {
        key: "emergency",
        match: /(emergency|ambulance|sos|urgent|critical|help|save|आपातकाल|அவசரம்|ஆம்புலன்ஸ்)/i,
        action: async () => {
          vibrate(300);
          safeSpeak("Emergency mode activated. Please stay calm.");
          navigate("/emergency");
          await delay(1500);
          safeSpeak("Do you want to trigger SOS? Say yes or no.");
        },
      },
      { key: "sosYes", match: /(yes|yeah|trigger|go ahead|confirm|हाँ|ஆமாம்|ஆம்)/i, action: () => safeSpeak("SOS triggered. Ambulance alerted.") },
      { key: "sosNo", match: /(no|cancel|stop|नहीं|இல்லை)/i, action: () => safeSpeak("SOS cancelled.") },

      // Symptom Checker
      {
        key: "symptom",
        match: /(symptom|check health|checkup|pain|problem|issue|diagnosis|लक्षण|அறிகுறி|பிரச்சனை)/i,
        action: async () => {
          navigate("/symptoms");
          await delay(1000);
          safeSpeak("Symptom checker opened. Describe your issue, like I have fever or headache.");
        },
      },

      // Reading & Scroll
      { key: "scrollDown", match: /(scroll down|move down|नीचे|கீழே|பக்கம் கீழே)/i, action: () => window.scrollBy({ top: 600, behavior: "smooth" }) },
      { key: "scrollUp", match: /(scroll up|move up|ऊपर|மேலே|பக்கம் மேலே)/i, action: () => window.scrollBy({ top: -600, behavior: "smooth" }) },
      {
        key: "read",
        match: /(read|speak|listen|describe|tell|सुनाओ|पढ़ो|படி|சொல்)/i,
        action: () => {
          if (!speakerOn) return;
          const title = document.querySelector("h1,h2,h3")?.textContent || "this page";
          const text = document.body.innerText.slice(0, 300);
          safeSpeak(`${title}. ${text}`);
        },
      },

      // Voice Controls
      { key: "mute", match: /(mute|speaker off|voice off|stop speaking|quiet|म्यूट|चुप|ம்யூட்|அமைதி)/i, action: () => { setSpeakerOn(false); synth.cancel(); vibrate(100); } },
      { key: "unmute", match: /(unmute|speaker on|voice on|enable speaker|अनम्यूट|குரல் திற)/i, action: () => { setSpeakerOn(true); vibrate(100); safeSpeak("Speaker enabled."); } },
      { key: "stop speaking", match: /(stop voice|stop reading|चुप रहो|speak stop|reading off|பேச்சு நிறுத்து)/i, action: () => synth.cancel() },

      // Mic Controls
      { key: "pause", match: /(pause listening|stop listening|halt mic|mic off|रुको|நிறுத்து)/i, action: () => stopListening() },
      { key: "resume", match: /(resume listening|start listening|listen again|mic on|सुनो|கேள்)/i, action: () => startListening() },

      // Navigation
      { key: "logout", match: /(logout|sign out|exit|log off|लॉग आउट|வெளியேறு)/i, action: () => { safeSpeak("You are logged out. Stay safe!"); navigate("/login"); } },
      { key: "back", match: /(go back|previous|पीछे|பின்னால்)/i, action: () => navigate(-1) },

      // Language Switching
      { key: "english", match: /(english|set english|switch to english)/i, action: () => { setLang("en-IN"); safeSpeak("Language set to English."); } },
      { key: "hindi", match: /(hindi|set hindi|switch to hindi|हिंदी)/i, action: () => { setLang("hi-IN"); safeSpeak("भाषा हिंदी में सेट कर दी गई है।"); } },
      { key: "tamil", match: /(tamil|set tamil|switch to tamil|தமிழ்)/i, action: () => { setLang("ta-IN"); safeSpeak("மொழி தமிழ் அமைக்கப்பட்டது."); } },

      // Help
      {
        key: "help",
        match: /(help|commands|guide|options|assist|सहायता|உதவி)/i,
        action: () => safeSpeak("You can say — open emergency, check symptoms, open appointments, mute speaker, or change language."),
      },
      { key: "stop", match: /(stop|quiet|चुप|அமைதி)/i, action: () => synth.cancel() },
    ],
    [navigate, speakerOn, lang]
  );

  /* ---------- Initialize with Continuous Listening ---------- */
  useEffect(() => {
    if (!SR) {
      setError("Voice recognition not supported.");
      return;
    }

    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.continuous = true;

    rec.onstart = () => setListening(true);
    rec.onerror = (e) => {
      if (["no-speech", "network", "aborted"].includes(e.error)) {
        setTimeout(() => {
          try { rec.start(); } catch {}
        }, 500);
      } else {
        setError(e.error);
      }
    };
    rec.onend = () => {
      if (active) {
        setListening(false);
        setTimeout(() => {
          try { rec.start(); } catch {}
        }, 500);
      }
    };

    rec.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      handleCommand(transcript);
    };

    recRef.current = rec;
    try { rec.start(); } catch (err) { console.warn(err); }

    return () => {
      try { rec.stop(); } catch {}
    };
  }, [active, lang]);

  /* ---------- Mic Control ---------- */
  const stopListening = () => {
    setActive(false);
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  };
  const startListening = () => {
    setActive(true);
    try { recRef.current?.start(); } catch {}
  };

  /* ---------- Command Handler ---------- */
  const handleCommand = async (speech) => {
    const match = commands.find((c) => c.match.test(speech));
    if (match) {
      safeSpeak(`Okay, ${match.key}`);
      await delay(400);
      match.action();
    } else {
      safeSpeak("Sorry, I did not catch that. Say help for assistance.");
    }
  };

  /* ---------- Page Announcer ---------- */
  useEffect(() => {
    if (speakerOn) {
      const name = location.pathname.split("/").pop() || "home";
      const title = name.replace("-", " ");
      safeSpeak(`You are now on the ${title} page.`);
    }
  }, [location.pathname, speakerOn, lang]);

  /* ---------- UI Indicator ---------- */
  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col items-center">
      {error ? (
        <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-xs mb-2">
          {error}
        </div>
      ) : (
        <div className={`rounded-full w-6 h-6 border-4 ${listening ? "border-green-500 animate-pulse" : "border-gray-400"}`} title={listening ? "Listening…" : "Voice ready"} />
      )}

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => { synth.cancel(); setSpeakerOn(!speakerOn); }}
          className={`px-3 py-1 text-xs rounded-full border ${speakerOn ? "bg-green-50 border-green-300" : "bg-gray-100 border-gray-300"}`}
        >
          {speakerOn ? "🔊 Speaker On" : "🔇 Speaker Off"}
        </button>
        <button
          onClick={() => (active ? stopListening() : startListening())}
          className={`px-3 py-1 text-xs rounded-full border ${active ? "bg-blue-50 border-blue-300" : "bg-gray-100 border-gray-300"}`}
        >
          {active ? "🎤 Mic On" : "🛑 Mic Off"}
        </button>
      </div>
      <div className="mt-1 text-[10px] text-gray-500">Lang: {lang.replace("-IN", "")}</div>
    </div>
  );
}
