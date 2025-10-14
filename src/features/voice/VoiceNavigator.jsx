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
    // Home & Dashboard
    { key: "home", match: /(home|dashboard|main|start|homepage|begin|go to start|open dashboard|root page|முகப்பு|மெயின்|முதன்மை|முதற்பக்கம்|मेन|मुख्य|मुख पृष्ठ|शुरू|होम पेज)/i, action: () => navigate("/") },

    // Appointments / Booking
    { key: "appointments", match: /(appointment|book|booking|meeting|consult|doctor|visit|schedule|fix|arrange|reserve|अपॉइंटमेंट|डॉक्टर की मुलाकात|नियुक्ति|மருத்துவ நேரம்|நேரம்|புக்கிங்|சந்திப்பு|அப்பாயின்மென்ட்)/i, action: () => navigate("/appointments") },

    // Records & History
    { key: "records", match: /(record|records|history|medical|report|data|results|past|files|documents|इतिहास|मेडिकल रिपोर्ट|रिकॉर्ड्स|வரலாறு|பதிவு|பேதைகள்|முன்னைய தகவல்)/i, action: () => navigate("/records") },

    // Doctors / Specialists
    { key: "doctors", match: /(doctor|specialist|consultant|physician|hospital|clinic|nurse|health staff|medical staff|डॉक्टर|विशेषज्ञ|मेडिकल स्टाफ|மருத்துவர்|மருத்துவமனை|வைத்தியர்|நர்ஸ்)/i, action: () => navigate("/doctors") },

    // Profile / Account
    { key: "profile", match: /(profile|account|user|details|my info|personal|identity|my account|user page|settings|प्रोफाइल|अकाउंट|मेरी जानकारी|सदस्य|சுயவிவரம்|பயனர்|அக்கவுண்ட்|அடையாளம்)/i, action: () => navigate("/profile") },

    // Contact & Support
    { key: "contact", match: /(contact|support|help|call|reach|email|helpdesk|talk|assist|connect|संपर्क|मदद|सपोर्ट|हेल्प डेस्क|உதவி|தொடர்பு|அதரவு|ஹெல்ப் டெஸ்க்)/i, action: () => navigate("/contact") },

    // About / Info / Team
    { key: "about", match: /(about|info|information|team|company|organization|group|background|जानकारी|हमारे बारे में|कंपनी|टीम|எங்களை பற்றி|தகவல்|அமைப்பு|நிறுவனம்|குழு)/i, action: () => navigate("/about") },

    // Emergency / SOS
    {
      key: "emergency",
      match: /(emergency|ambulance|sos|urgent|critical|help|save|救护车|आपातकाल|एम्बुलेंस|अर्जेंट|危急|அவசரம்|ஆம்புலன்ஸ்|உதவி|அடையாளம்|பாதுகாப்பு)/i,
      action: async () => {
        vibrate(300);
        safeSpeak("Emergency mode activated. Please stay calm.");
        navigate("/emergency");
        await delay(1500);
        safeSpeak("Do you want to trigger SOS? Say yes or no.");
      },
    },
    { key: "sosYes", match: /(yes|yeah|trigger|go ahead|confirm|affirmative|हाँ|हां|ठीक है|ஆமாம்|ஆம்|சரி|ஆம் போதும்)/i, action: () => safeSpeak("SOS triggered. Ambulance alerted.") },
    { key: "sosNo", match: /(no|cancel|stop|not now|negative|नहीं|இல்லை|வேண்டாம்|இல்லை இப்போது)/i, action: () => safeSpeak("SOS cancelled.") },

    // Symptom Checker
    {
      key: "symptom",
      match: /(symptom|check health|checkup|pain|problem|issue|disease|diagnosis|health|examine|लक्षण|जाँच|बुखार|दर्द|அறிகுறி|பிரச்சனை|நோய்|பாதிப்பு|பிரச்சனை)/i,
      action: async () => {
        navigate("/symptoms");
        await delay(1000);
        safeSpeak("Symptom checker opened. Describe your issue, for example say I have chest pain or fever.");
      },
    },

    // Reading / Scrolling
    { key: "scrollDown", match: /(scroll down|move down|go down|next section|नीचे|नीचे जाओ|கீழே|கீழே செல்|கீழ் பக்கம்|தாழ்|down)/i, action: () => window.scrollBy({ top: 600, behavior: "smooth" }) },
    { key: "scrollUp", match: /(scroll up|move up|go up|previous section|ऊपर|ऊपर जाओ|மேலே|மேலே செல்|மேல் பக்கம்|up)/i, action: () => window.scrollBy({ top: -600, behavior: "smooth" }) },

    // Read Page
    {
      key: "read",
      match: /(read|speak|listen|describe|tell|explain|summarize|सुनाओ|पढ़ो|बताओ|படி|சொல்|வாசி|சுருக்கம்|பேசு)/i,
      action: () => {
        if (!speakerOn) return;
        const title = document.querySelector("h1,h2,h3")?.textContent || "this page";
        const text = document.body.innerText.slice(0, 300);
        safeSpeak(`${title}. ${text}`);
      },
    },

    // Voice Controls
    { key: "mute", match: /(mute|speaker off|voice off|stop speaking|quiet|hush|silence|म्यूट|चुप|शांत|ம்யூட்|அமைதி|மவுண்ட்|சத்தம் நிறுத்து)/i, action: () => { setSpeakerOn(false); synth.cancel(); vibrate(100); } },
    { key: "unmute", match: /(unmute|speaker on|voice on|enable speaker|resume sound|enable voice|अनम्यूट|आवाज चालू|குரல் திற|சத்தம் ஓடு|சத்தம் திற)/i, action: () => { setSpeakerOn(true); vibrate(100); safeSpeak("Speaker enabled."); } },
    { key: "stop speaking", match: /(stop voice|stop reading|quiet|reading off|stop talking|silent|speak stop|चुप रहो|पढ़ना बंद|பேச்சு நிறுத்து|சத்தம் நிறுத்து)/i, action: () => synth.cancel() },

    // Mic Controls
    { key: "pause", match: /(pause listening|stop listening|halt mic|mic off|disable mic|voice pause|रुको|सुनना बंद|நிறுத்து|மைக் ஆஃப்)/i, action: () => stopListening() },
    { key: "resume", match: /(resume listening|start listening|listen again|mic on|enable mic|activate mic|सुनो|सुनना शुरू|கேள்|மைக் ஆன்)/i, action: () => startListening() },

    // Navigation / Account
    { key: "logout", match: /(logout|sign out|exit|log off|close account|लॉग आउट|बाहर निकलो|वापस जाओ|வெளியேறு|லாக் அவுட்)/i, action: () => { safeSpeak("You are logged out. Stay safe!"); navigate("/login"); } },
    { key: "back", match: /(go back|previous|backward|पीछे|पिछला पेज|பின்னால்|முந்தைய|முந்தைய பக்கம்)/i, action: () => navigate(-1) },

    // Language Switching
    { key: "english", match: /(english|set english|switch to english|change to english|talk in english)/i, action: () => { setLang("en-IN"); safeSpeak("Language set to English."); } },
    { key: "hindi", match: /(hindi|set hindi|switch to hindi|हिंदी|बदल हिंदी में|talk in hindi)/i, action: () => { setLang("hi-IN"); safeSpeak("भाषा हिंदी में सेट कर दी गई है।"); } },
    { key: "tamil", match: /(tamil|set tamil|switch to tamil|தமிழ்|தமிழ் மொழி|talk in tamil)/i, action: () => { setLang("ta-IN"); safeSpeak("மொழி தமிழ் அமைக்கப்பட்டது."); } },

    // Help / Commands
    {
      key: "help",
      match: /(help|commands|guide|options|assist|support|instructions|सहायता|हेल्प|उपाय|உதவி|ஆப்ஷன்|வழிகாட்டி)/i,
      action: () => safeSpeak("You can say — open emergency, check symptoms, open appointments, scroll down, change language, or stop reading."),
    },

    // Stop
    { key: "stop", match: /(stop|quiet|halt|freeze|रुको|चुप|அமைதி|நிறுத்து)/i, action: () => synth.cancel() },
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
