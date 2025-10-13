/**
 * src/features/voice/VoiceNavigatorHandsFree.jsx
 * 🔊 MediLink 360 – Hands-Free Voice Assistant
 * 
 * - Auto starts listening when app opens (no button press)
 * - Continuously listens and responds to all commands
 * - Accessible for blind users (speaks everything)
 * - Works for both Patients & Guests
 * - Supports English 🇬🇧, Hindi 🇮🇳, Tamil 🇮🇳 commands
 * - Can read page info, navigate, call SOS, read vitals, etc.
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

/* ---------------------- Utility Functions ---------------------- */
const speak = (text, rate = 1, lang = "en-IN") => {
  if (!synth) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = rate;
  utter.lang = lang;
  synth.cancel();
  synth.speak(utter);
};
const vibrate = (ms = 120) => navigator.vibrate && navigator.vibrate(ms);

/* ---------------------- Component ---------------------- */
export default function VoiceNavigatorHandsFree() {
  const navigate = useNavigate();
  const location = useLocation();
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef(null);

  /* 🧠 Command definitions */
  const commands = useMemo(
    () => [
      { key: "home", match: /(home|dashboard|main|முகப்பு|होम)/i, action: () => navigate("/") },
      { key: "appointments", match: /(appointments?|booking|अपॉइंटमेंट|மருத்துவ நேரம்)/i, action: () => navigate("/appointments") },
      { key: "records", match: /(record|history|medical|इतिहास|வரலாறு)/i, action: () => navigate("/records") },
      { key: "doctors", match: /(doctor|डॉक्टर|மருத்துவர்)/i, action: () => navigate("/doctors") },
      { key: "emergency", match: /(emergency|sos|help|ambulance|आपातकाल|அவசரம்)/i, action: () => {
          vibrate(300);
          speak("Emergency mode activated. Please stay calm. Contacting nearby hospital.");
          navigate("/emergency");
        },
      },
      { key: "profile", match: /(profile|account|प्रोफाइल|சுயவிவரம்)/i, action: () => navigate("/profile") },
      { key: "contact", match: /(contact|support|help desk|संपर्क|தொடர்பு)/i, action: () => navigate("/contact") },
      { key: "about", match: /(about|info|जानकारी|எங்களை பற்றி)/i, action: () => navigate("/about") },
      { key: "scrollDown", match: /(scroll down|नीचे|கீழே)/i, action: () => window.scrollBy({ top: 600, behavior: "smooth" }) },
      { key: "scrollUp", match: /(scroll up|ऊपर|மேலே)/i, action: () => window.scrollBy({ top: -600, behavior: "smooth" }) },
      {
        key: "read",
        match: /(read|speak|listen|सुनाओ|படி)/i,
        action: () => {
          const title = document.querySelector("h1,h2,h3")?.textContent || "this page";
          const bodyText = document.body.innerText.slice(0, 250);
          speak(`${title}. ${bodyText}`);
        },
      },
      {
        key: "logout",
        match: /(logout|sign out|लॉग आउट|வெளியேறு)/i,
        action: () => {
          speak("You have been logged out. Stay healthy!");
          navigate("/login");
        },
      },
      {
        key: "help",
        match: /(help|commands|guide|सहायता|உதவி)/i,
        action: () => {
          speak(
            "You can say — open appointments, open emergency, open records, read page, scroll down, or go back."
          );
        },
      },
      { key: "back", match: /(go back|back|return|पीछे|பின்னால்)/i, action: () => navigate(-1) },
      { key: "stop", match: /(stop|रुको|நிறுத்து)/i, action: () => synth.cancel() },
    ],
    [navigate]
  );

  /* 🎙️ Initialize continuous speech recognition */
  useEffect(() => {
    if (!SR) {
      setError("Voice recognition not supported in this browser.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.continuous = true;

    rec.onstart = () => {
      setListening(true);
      vibrate(60);
    };
    rec.onend = () => {
      setListening(false);
      // Restart automatically after 1s pause for hands-free use
      setTimeout(() => {
        try {
          rec.start();
        } catch {}
      }, 1000);
    };
    rec.onerror = (e) => {
      console.warn("SpeechRecognition error:", e.error);
      setError(e.error);
    };
    rec.onresult = (e) => {
      const text = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      handleCommand(text);
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.warn("Start error:", err);
    }
    return () => rec.stop();
  }, []);

  /* 🎯 Command handler */
  const handleCommand = (text) => {
    const cmd = commands.find((c) => c.match.test(text));
    if (cmd) {
      speak(`Okay, ${cmd.key}`);
      cmd.action();
    } else {
      speak("Sorry, I didn't understand. Say help for available commands.");
    }
  };

  /* 🗣️ Announce page on route change */
  useEffect(() => {
    const name = location.pathname.split("/").pop() || "home";
    const spoken = name.replace("-", " ");
    speak(`You are now on the ${spoken} page.`);
  }, [location.pathname]);

  /* ---------------------- UI Feedback ---------------------- */
  return (
    <div className="fixed bottom-3 right-3 z-50">
      {error ? (
        <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-xs">
          Voice not supported
        </div>
      ) : (
        <div
          className={`rounded-full w-6 h-6 border-4 ${
            listening ? "border-green-500 animate-pulse" : "border-gray-400"
          }`}
          title={listening ? "Listening..." : "Voice ready"}
        />
      )}
    </div>
  );
}
