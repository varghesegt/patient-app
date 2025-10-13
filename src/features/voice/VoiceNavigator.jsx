import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

/* ---------- Utilities ---------- */
const speak = (text, rate = 1, lang = "en-IN") => {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  synth.cancel();
  synth.speak(u);
};
const vibrate = (ms = 120) => navigator.vibrate && navigator.vibrate(ms);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export default function VoiceNavigatorHandsFree() {
  const navigate = useNavigate();
  const location = useLocation();

  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [active, setActive] = useState(false); // voice mode toggle
  const [error, setError] = useState("");

  /* ---------- Commands ---------- */
  const commands = useMemo(
    () => [
      { key: "home", match: /(home|dashboard|main|முகப்பு|होम)/i, action: () => navigate("/") },
      { key: "appointments", match: /(appointment|booking|अपॉइंटमेंट|மருத்துவ நேரம்)/i, action: () => navigate("/appointments") },
      { key: "records", match: /(record|history|medical|इतिहास|வரலாறு)/i, action: () => navigate("/records") },
      { key: "doctors", match: /(doctor|specialist|डॉक्टर|மருத்துவர்)/i, action: () => navigate("/doctors") },
      { key: "profile", match: /(profile|account|प्रोफाइल|சுயவிவரம்)/i, action: () => navigate("/profile") },
      { key: "contact", match: /(contact|support|help desk|संपर्क|தொடர்பு)/i, action: () => navigate("/contact") },
      { key: "about", match: /(about|info|जानकारी|எங்களை பற்றி)/i, action: () => navigate("/about") },

      /* --- Emergency / SOS --- */
      {
        key: "emergency",
        match: /(emergency|ambulance|sos|help|आपातकाल|அவசரம்)/i,
        action: async () => {
          vibrate(300);
          speak("Emergency activated. Please stay calm. Connecting to the nearest ambulance service.");
          navigate("/emergency");
          await delay(2500);
          speak("Do you want to trigger the SOS? Say yes or no.");
        },
      },
      {
        key: "sosYes",
        match: /^(yes|yeah|trigger|go ahead|हाँ|ஆமாம்)$/i,
        action: () => speak("SOS triggered successfully. Ambulance has been alerted."),
      },
      { key: "sosNo", match: /^(no|cancel|stop|नहीं|இல்லை)$/i, action: () => speak("Okay, SOS cancelled.") },

      /* --- Symptom Checker --- */
      {
        key: "symptom",
        match: /(symptom|check health|fever|pain|लक्षण|அறிகுறி)/i,
        action: async () => {
          navigate("/symptoms");
          await delay(1000);
          speak("Symptom checker opened. Please describe your problem, for example say — I have chest pain or fever.");
        },
      },

      /* --- Reading / Navigation --- */
      { key: "scrollDown", match: /(scroll down|नीचे|கீழே)/i, action: () => window.scrollBy({ top: 600, behavior: "smooth" }) },
      { key: "scrollUp", match: /(scroll up|ऊपर|மேலே)/i, action: () => window.scrollBy({ top: -600, behavior: "smooth" }) },
      {
        key: "read",
        match: /(read|speak|listen|सुनाओ|படி)/i,
        action: () => {
          const title = document.querySelector("h1,h2,h3")?.textContent || "this page";
          const text = document.body.innerText.slice(0, 300);
          speak(`${title}. ${text}`);
        },
      },
      { key: "logout", match: /(logout|sign out|लॉग आउट|வெளியேறு)/i, action: () => { speak("You are logged out. Stay safe!"); navigate("/login"); } },
      { key: "back", match: /(go back|back|पीछे|பின்னால்)/i, action: () => navigate(-1) },

      /* --- Help & Mode --- */
      {
        key: "help",
        match: /(help|commands|guide|सहायता|உதவி)/i,
        action: () => speak("Say for example: open emergency, check symptoms, read page, or scroll down."),
      },
      { key: "stop", match: /(stop|quiet|mute|रुको|நிறுத்து)/i, action: () => synth.cancel() },
    ],
    [navigate]
  );

  /* ---------- Init SR ---------- */
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
    rec.onend = () => {
      setListening(false);
      setTimeout(() => {
        try { rec.start(); } catch {}
      }, 1500);
    };
    rec.onerror = (e) => setError(e.error);

    rec.onresult = async (e) => {
      const text = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();

      // Wake-word detection
      if (!active && /(hey medilink|hi medilink|ok medilink)/i.test(text)) {
        vibrate(200);
        speak("Yes, I'm listening.");
        setActive(true);
        return;
      }

      // Enable or disable voice mode
      if (/start voice mode/i.test(text)) {
        setActive(true);
        speak("Voice mode activated.");
        return;
      }
      if (/stop voice mode/i.test(text)) {
        setActive(false);
        speak("Voice mode paused. Say Hey MediLink to wake me again.");
        return;
      }

      // If in active mode → parse commands
      if (active) handleCommand(text);
    };

    recRef.current = rec;
    try { rec.start(); } catch (err) { console.warn(err); }
    return () => rec.stop();
  }, [active]);

  /* ---------- Command Handler ---------- */
  const handleCommand = async (speech) => {
    const match = commands.find((c) => c.match.test(speech));
    if (match) {
      speak(`Okay, ${match.key}`);
      await delay(400);
      match.action();
    } else {
      speak("Sorry, I didn’t catch that. Say help for commands.");
    }
  };

  /* ---------- Announce Page ---------- */
  useEffect(() => {
    const page = location.pathname.split("/").pop() || "home";
    speak(`You are now on the ${page.replace("-", " ")} page.`);
  }, [location.pathname]);

  /* ---------- UI ---------- */
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {error ? (
        <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-xs">
          {error}
        </div>
      ) : (
        <div
          className={`rounded-full w-8 h-8 border-[3px] flex items-center justify-center
            ${active ? "border-green-500 animate-ping" : "border-gray-400"}
            ${listening ? "shadow-[0_0_10px_rgba(34,197,94,0.6)]" : ""}
          `}
          title={listening ? "Listening…" : "Voice ready"}
        >
          🎤
        </div>
      )}
    </div>
  );
}
