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

  /* ---------- Command Map (Expanded & Optimized) ---------- */
  const commands = useMemo(
    () => [
      { key: "home", match: /(home|dashboard|main|start|homepage|begin|முகப்பு|மெயின்|मेन|मुख्य)/i, action: () => navigate("/") },
      { key: "appointments", match: /(appointment|book|booking|meeting|visit|consult|doctor|अपॉइंटमेंट|மருத்துவ நேரம்|நேரம்)/i, action: () => navigate("/appointments") },
      { key: "records", match: /(record|records|history|medical|report|data|इतिहास|வரலாறு|பதிவு)/i, action: () => navigate("/records") },
      { key: "doctors", match: /(doctor|specialist|consultant|physician|hospital|डॉक्टर|மருத்துவர்)/i, action: () => navigate("/doctors") },
      { key: "profile", match: /(profile|account|user|details|प्रोफाइल|சுயவிவரம்)/i, action: () => navigate("/profile") },
      { key: "contact", match: /(contact|support|help|help desk|call|email|reach|संपर्क|உதவி|தொடர்பு)/i, action: () => navigate("/contact") },
      { key: "about", match: /(about|info|information|who are you|team|company|जानकारी|எங்களை பற்றி|தகவல்)/i, action: () => navigate("/about") },

      // Emergency & SOS
      {
        key: "emergency",
        match: /(emergency|ambulance|sos|urgent|critical|help|save|आपातकाल|அவசரம்|ஆம்புலன்ஸ்)/i,
        action: async () => {
          vibrate(300);
          if (speakerOn) speak("Emergency activated. Please stay calm.");
          navigate("/emergency");
          await delay(2000);
          if (speakerOn) speak("Do you want to trigger SOS? Say yes or no.");
        },
      },
      { key: "sosYes", match: /^(yes|yeah|trigger|go ahead|confirm|हाँ|ஆமாம்|ஆம்)$/i, action: () => speakerOn && speak("SOS triggered. Ambulance has been alerted.") },
      { key: "sosNo", match: /^(no|cancel|stop|नहीं|இல்லை)$/i, action: () => speakerOn && speak("SOS cancelled.") },

      // Symptom Checker
      {
        key: "symptom",
        match: /(symptom|check health|checkup|pain|problem|issue|consult|diagnosis|लक्षण|அறிகுறி|பிரச்சனை)/i,
        action: async () => {
          navigate("/symptoms");
          await delay(1000);
          if (speakerOn) speak("Symptom checker opened. Describe your problem — like I have chest pain or fever.");
        },
      },

      // Reading / Scrolling / Help
      { key: "scrollDown", match: /(scroll down|move down|नीचे|கீழே)/i, action: () => window.scrollBy({ top: 600, behavior: "smooth" }) },
      { key: "scrollUp", match: /(scroll up|move up|ऊपर|மேலே)/i, action: () => window.scrollBy({ top: -600, behavior: "smooth" }) },
      {
        key: "read",
        match: /(read|speak|listen|describe|tell|सुनाओ|पढ़ो|படி|சொல்)/i,
        action: () => {
          if (!speakerOn) return;
          const title = document.querySelector("h1,h2,h3")?.textContent || "this page";
          const text = document.body.innerText.slice(0, 300);
          speak(`${title}. ${text}`);
        },
      },

      // Speaker Toggle
      { key: "mute", match: /(mute|speaker off|voice off|म्यूट|ம்யூட்)/i, action: () => { setSpeakerOn(false); synth.cancel(); vibrate(80); } },
      { key: "unmute", match: /(unmute|speaker on|voice on|अनम्यूट|குரல் திற)/i, action: () => { setSpeakerOn(true); vibrate(80); speak("Speaker enabled."); } },

      // Stop / Pause listening
      { key: "pause", match: /(pause listening|stop listening|halt mic|रुको|நிறுத்து)/i, action: () => stopListening() },
      { key: "resume", match: /(resume listening|start listening|listen again|सुनो|கேள்)/i, action: () => startListening() },

      // Logout & Back
      { key: "logout", match: /(logout|sign out|exit|लॉग आउट|வெளியேறு)/i, action: () => { if (speakerOn) speak("You are logged out. Stay safe!"); navigate("/login"); } },
      { key: "back", match: /(go back|previous|पीछे|பின்னால்)/i, action: () => navigate(-1) },

      // Help
      {
        key: "help",
        match: /(help|commands|guide|options|assist|सहायता|உதவி)/i,
        action: () => speakerOn && speak("You can say — open emergency, check symptoms, open appointments, read page, or scroll down."),
      },
      { key: "stop", match: /(stop|quiet|चुप|அமைதி)/i, action: () => synth.cancel() },
    ],
    [navigate, speakerOn]
  );

  /* ---------- Initialize & Prevent Mic Abort ---------- */
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
      if (e.error === "no-speech" || e.error === "network" || e.error === "aborted") {
        setTimeout(() => {
          try { rec.start(); } catch {}
        }, 1000);
      } else {
        setError(e.error);
      }
    };
    rec.onend = () => {
      if (active) {
        setListening(false);
        setTimeout(() => {
          try { rec.start(); } catch {}
        }, 800);
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

  /* ---------- Command Handler ---------- */
  const handleCommand = async (speech) => {
    const match = commands.find((c) => c.match.test(speech));
    if (match) {
      if (speakerOn) speak(`Okay, ${match.key}`);
      await delay(400);
      match.action();
    } else {
      if (speakerOn) speak("Sorry, I did not catch that. Say help for assistance.");
    }
  };

  /* ---------- Page Announcer ---------- */
  useEffect(() => {
    if (speakerOn) {
      const name = location.pathname.split("/").pop() || "home";
      const title = name.replace("-", " ");
      speak(`You are now on the ${title} page.`);
    }
  }, [location.pathname, speakerOn]);

  /* ---------- UI Indicator ---------- */
  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col items-center">
      {error ? (
        <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-xs mb-2">
          {error}
        </div>
      ) : (
        <div
          className={`rounded-full w-6 h-6 border-4 ${listening ? "border-green-500 animate-pulse" : "border-gray-400"}`}
          title={listening ? "Listening…" : "Voice ready"}
        />
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setSpeakerOn(!speakerOn)}
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
    </div>
  );
}