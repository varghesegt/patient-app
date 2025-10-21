// src/pages/emergency.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  WifiOff,
  Wifi,
  KeyRound,
  PhoneCall,
  Mic,
  Share2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OfflineSMS from "../features/emergency/OfflineSMS";

/**
 * Ultra-reliable Emergency Page
 * - Works online/offline, queues + retries with backoff
 * - 112 quick dial + backend forward (add /api/erss/dispatch server-side if you have the MoU)
 * - Voice trigger via window "VOICE_CMD"
 * - Geolocation w/ timeout + manual override
 * - Nearby hospitals (gov first) via Overpass
 * - Medical snapshot (minimal PII) + ICE share
 * - sendBeacon on page hide for last-ditch delivery
 */

export default function Emergency() {
  /* -------- State -------- */
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState({ lat: "", lng: "" });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [history, setHistory] = useState(() => safeRead("sosHistory", []));
  const [sosQueue, setSosQueue] = useState(() => safeRead("sosQueue", []));
  const [vibrateSupported, setVibrateSupported] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState({ gov: [], priv: [] });
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState([]);
  const [otpStep, setOtpStep] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [useLiveLoc, setUseLiveLoc] = useState(true);
  const [includeMedicalSnapshot, setIncludeMedicalSnapshot] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    bloodGroup: "",
    iceContacts: [],
  });

  /* -------- Refs -------- */
  const emergencyTypesRef = useRef([
    { id: "accident", label: "Accident" },
    { id: "stroke", label: "Stroke" },
    { id: "fire", label: "Fire" },
    { id: "assault", label: "Assault" },
    { id: "other", label: "Other" },
  ]);
  const voiceCooldownRef = useRef(0);
  const abortersRef = useRef(new Set());
  const wakeLockRef = useRef(null);

  /* -------- Effects -------- */
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    setVibrateSupported("vibrate" in navigator);

    // Attempt wake lock (best effort; ignored if unsupported)
    requestWakeLock();

    // Voice trigger listener (with 1s cooldown)
    const onVoiceCmd = (e) => {
      const { intent, type } = (e && e.detail) || {};
      const now = Date.now();
      if (now - voiceCooldownRef.current < 1000) return;
      voiceCooldownRef.current = now;

      if (intent === "sos") {
        setSelectedType(type || "other");
        setUseLiveLoc(true);
        setModalOpen(true);
      }
      if (intent === "call_112") dial112();
    };
    window.addEventListener("VOICE_CMD", onVoiceCmd);

    // sendBeacon fallback if user hides the page mid-send
    const onHide = () => tryBeaconFlush();
    document.addEventListener("visibilitychange", onHide);

    // First boot: try flush
    if (navigator.onLine) flushQueue();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("VOICE_CMD", onVoiceCmd);
      document.removeEventListener("visibilitychange", onHide);
      releaseWakeLock();
      // Cancel any pending network jobs
      abortersRef.current.forEach((a) => a.abort());
      abortersRef.current.clear();
    };
  }, []);

  useEffect(() => safeWrite("sosQueue", sosQueue), [sosQueue]);
  useEffect(() => safeWrite("sosHistory", history), [history]);

  /* -------- Helpers: storage, wake lock, misc -------- */
  function safeRead(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function safeWrite(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current?.addEventListener?.("release", () => {
          wakeLockRef.current = null;
        });
      }
    } catch {
      // ignore
    }
  }
  function releaseWakeLock() {
    try { wakeLockRef.current?.release?.(); } catch {}
  }

  const saveToHistory = (data) => setHistory((prev) => [data, ...prev].slice(0, 20));
  const addToQueue = (data) => setSosQueue((prev) => [data, ...prev].slice(0, 50));
  const clearQueue = () => setSosQueue([]);

  /* -------- Nearby Hospitals -------- */
  const isGovernmentHospital = (name) => {
    if (!name) return false;
    const keywords = [
      "govt","government","municipal","state","public","regional",
      "rural hospital","district hospital","medical college","esi","phc"
    ];
    return keywords.some((k) => name.toLowerCase().includes(k));
  };

  // Debounced fetch (prevents spam clicking Refresh)
  const fetchNearbyHospitals = debounce(async (lat, lng, radius = 8000) => {
    const ctrl = new AbortController();
    abortersRef.current.add(ctrl);
    try {
      setLoadingHospitals(true);
      const query = `[out:json][timeout:25];
      (
        node[amenity=hospital](around:${radius},${lat},${lng});
        way[amenity=hospital](around:${radius},${lat},${lng});
        relation[amenity=hospital](around:${radius},${lat},${lng});
      );
      out center 30;`;

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("Hospital data fetch failed");

      const data = await res.json();
      const places = (data.elements || []).map((el) => ({
        id: el.id,
        name: el.tags?.name || el.tags?.operator,
        lat: el.lat || el.center?.lat,
        lng: el.lon || el.center?.lon,
        addr: el.tags?.["addr:full"] || el.tags?.["addr:street"] || "",
        phone: el.tags?.phone || el.tags?.["contact:phone"],
        tags: el.tags || {},
      }));
      const gov = places.filter((p) => isGovernmentHospital(p.name));
      const priv = places.filter((p) => !isGovernmentHospital(p.name));
      setNearbyHospitals({ gov, priv });
      return { gov, priv };
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Hospital lookup failed:", err);
        setNearbyHospitals({ gov: [], priv: [] });
      }
      return { gov: [], priv: [] };
    } finally {
      abortersRef.current.delete(ctrl);
      setLoadingHospitals(false);
    }
  }, 600);

  /* -------- Queue flush with backoff -------- */
  const flushQueue = async () => {
    if (!navigator.onLine || sosQueue.length === 0) return;
    const remaining = [];
    for (const item of sosQueue) {
      const ok = await sendToBackendWithBackoff(item);
      if (!ok) remaining.push(item);
    }
    setSosQueue(remaining);
  };

  /* -------- Dispatch helpers -------- */
  const dial112 = () => {
    try { window.location.href = "tel:112"; } catch {}
  };

  const smsOpen = (text) => {
    try {
      // If device supports SMS handler this opens composer. If not, we also copy.
      window.location.href = `sms:?body=${encodeURIComponent(text)}`;
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    } catch {
      // as a last resort, copy the message
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
      alert("SMS couldn't be opened. Copied message to clipboard — paste into your SMS app.");
    }
  };

  const buildMedicalSnapshot = () => {
    if (!includeMedicalSnapshot) return null;
    return {
      name: profile?.name || "",
      bloodGroup: profile?.bloodGroup || "",
      iceContacts: Array.isArray(profile?.iceContacts)
        ? profile.iceContacts.slice(0, 3)
        : [],
    };
  };

  // Exponential backoff sender with sendBeacon fallback on last try
  const sendToBackendWithBackoff = async (payload, maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const ok = await sendToBackend(payload);
      if (ok) return true;
      await sleep(500 * Math.pow(2, attempt - 1)); // 0.5s, 1s, 2s
    }
    // final attempt via sendBeacon (fire-and-forget)
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const beaconOk = navigator.sendBeacon?.("/api/emergency/sos", blob);
      return !!beaconOk;
    } catch { return false; }
  };

  const sendToBackend = async (payload) => {
    const ctrl = new AbortController();
    abortersRef.current.add(ctrl);
    try {
      const res = await fetch("/api/emergency/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("Backend /api/emergency/sos failed");
      // Optionally forward to your secured ERSS relay:
      // await fetch("/api/erss/dispatch", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      return true;
    } catch (e) {
      console.warn("sendToBackend error:", e?.message);
      return false;
    } finally {
      abortersRef.current.delete(ctrl);
    }
  };

  // Try flushing anything queued when user leaves/pauses
  const tryBeaconFlush = () => {
    if (document.visibilityState !== "hidden") return;
    if (!sosQueue.length) return;
    try {
      const toSend = sosQueue.slice(0, 3); // keep small
      const blob = new Blob([JSON.stringify({ batch: toSend })], { type: "application/json" });
      const ok = navigator.sendBeacon?.("/api/emergency/sos/batch", blob);
      if (ok) {
        const remaining = sosQueue.slice(3);
        setSosQueue(remaining);
      }
    } catch { /* ignore */ }
  };

  /* -------- OTP -------- */
  const requestOtp = (type, useLive) => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);
    setOtpStep(true);
    setSelectedType(type);
    setUseLiveLoc(useLive);
    console.log("Generated OTP:", otp);
  };

  const confirmOtpAndSend = async () => {
    if (enteredOtp !== generatedOtp) {
      alert("❌ Incorrect OTP. Please try again.");
      return;
    }
    setOtpStep(false);
    setEnteredOtp("");
    setGeneratedOtp("");
    await handleSOS(useLiveLoc, selectedType);
  };

  /* -------- SOS -------- */
  const handleSOS = async (useLiveLocation, type = "other") => {
    try {
      setSending(true);
      setSent(false);
      setModalOpen(false);

      let latitude, longitude, accuracy = null;
      if (useLiveLocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 12000,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          accuracy = position.coords.accuracy;
        } catch {
          alert("⚠️ Location access denied or timed out. Please enable GPS or choose custom location.");
          setSending(false);
          return;
        }
      } else {
        latitude = parseFloat(manualLocation.lat);
        longitude = parseFloat(manualLocation.lng);
        if (!isFinite(latitude) || !isFinite(longitude)) {
          alert("⚠️ Invalid manual coordinates");
          setSending(false);
          return;
        }
      }

      const { gov, priv } = await fetchNearbyHospitals(latitude, longitude, 10000);
      const med = buildMedicalSnapshot();

      const sosData = {
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: new Date().toISOString(),
        type,
        nearestGovHospitals: gov?.slice(0, 3),
        nearestPrivateHospitals: priv?.slice(0, 3),
        medical: med,
        device: { userAgent: navigator.userAgent, platform: navigator.platform },
        source: "webapp",
      };

      if (navigator.onLine) {
        const ok = await sendToBackendWithBackoff(sosData);
        if (!ok) addToQueue({ ...sosData, status: "Queued ● Retrying" });
      } else {
        const text =
          `🚨 EMERGENCY (${type.toUpperCase()})\n` +
          (med?.name ? `Name: ${med.name}\n` : ``) +
          (med?.bloodGroup ? `BG: ${med.bloodGroup}\n` : ``) +
          `Loc: https://maps.google.com/?q=${latitude},${longitude}`;
        smsOpen(text);
        addToQueue({ ...sosData, status: "Offline Queue ● SMS opened" });
      }

      saveToHistory({ ...sosData, status: navigator.onLine ? "Sent Online" : "Queued Offline" });
      if (vibrateSupported) navigator.vibrate([200, 100, 200]);
      setSending(false);
      setSent(true);
      setTimeout(() => setSent(false), 6000);
    } catch (err) {
      console.error("handleSOS error:", err);
      setSending(false);
    }
  };

  const openModal = () => {
    setModalOpen(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearbyHospitals(pos.coords.latitude, pos.coords.longitude, 8000),
      () => console.warn("Location permissions denied for hospitals lookup")
    );
  };

  /* -------- Render -------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6 sm:p-10 relative overflow-hidden">
      {/* Background */}
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-60 h-60 bg-red-300 rounded-full blur-3xl opacity-20 pointer-events-none"
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl font-extrabold text-red-700 dark:text-red-400 flex items-center justify-center gap-2">
            <AlertTriangle className="text-red-600 animate-pulse" size={32} />
            Emergency Help
          </h2>
          <p className="mt-2 text-gray-700 dark:text-gray-300 text-base sm:text-lg">
            One-tap Call 112 • OTP-verified SOS • Real-time location • Nearby hospitals
          </p>
          <div className="flex items-center justify-center mt-2 gap-3 text-sm">
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-600"><Wifi size={16} /> Online</span>
            ) : (
              <span className="flex items-center gap-1 text-red-500"><WifiOff size={16} /> Offline Mode</span>
            )}
            <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400">
              <Mic size={16} /> Voice: say “Medilink SOS”
            </span>
          </div>
        </motion.div>

        {/* Primary actions */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl border border-red-200 dark:border-red-800 p-6 sm:p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* CALL 112 */}
            <button
              onClick={dial112}
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg"
              aria-label="Call 112 emergency"
            >
              <PhoneCall className="w-8 h-8" />
              <div className="font-semibold">Call 112</div>
              <div className="text-xs opacity-80">National Emergency</div>
            </button>

            {/* SOS modal */}
            <button
              onClick={openModal}
              disabled={sending}
              className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl ${
                sending ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
              } text-white shadow-lg`}
              aria-label="Send SOS"
            >
              {sending ? (
                <Loader2 className="animate-spin w-8 h-8" />
              ) : sent ? (
                <CheckCircle2 className="w-8 h-8 text-green-300" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
              <div className="font-semibold">Send SOS</div>
              <div className="text-xs opacity-80">Location + Snapshot</div>
            </button>

            {/* Notify contacts */}
            <button
              onClick={() => {
                const text = `Emergency for ${profile?.name || "User"} — need help.`;
                if (navigator.share) navigator.share({ title: "SOS Alert", text });
              }}
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border"
              aria-label="Notify Contacts"
            >
              <Share2 className="w-8 h-8" />
              <div className="font-semibold">Notify Contacts</div>
              <div className="text-xs opacity-80">Quick Share</div>
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {sending ? "Sending…" : sent ? "SOS sent" : "Tap an action to begin."}
          </div>
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {modalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-full max-w-2xl relative"
              >
                <button
                  onClick={() => { setModalOpen(false); setOtpStep(false); setEnteredOtp(""); }}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>

                {!otpStep ? (
                  <>
                    <h4 className="text-lg font-semibold mb-4">Choose Emergency Type & Location</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-2">Emergency Type</p>
                        <div className="flex flex-wrap gap-2">
                          {emergencyTypesRef.current.map((t) => {
                            if (hiddenTypes.includes(t.id)) return null;
                            return (
                              <button
                                key={t.id}
                                onClick={() => requestOtp(t.id, true)}
                                className="px-3 py-2 rounded-lg bg-red-600 text-white hover:opacity-90"
                              >
                                {t.label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4">
                          <p className="font-medium mb-2">Or use custom location</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Latitude"
                              value={manualLocation.lat}
                              onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
                              className="border rounded p-2 w-full"
                            />
                            <input
                              type="text"
                              placeholder="Longitude"
                              value={manualLocation.lng}
                              onChange={(e) => setManualLocation({ ...manualLocation, lng: e.target.value })}
                              className="border rounded p-2 w-full"
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => requestOtp("other", false)}
                              disabled={!manualLocation.lat || !manualLocation.lng}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                            >
                              Send From Custom Location
                            </button>
                            <button
                              onClick={() => {
                                navigator.geolocation.getCurrentPosition((p) => {
                                  setManualLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
                                });
                              }}
                              className="px-4 py-2 bg-gray-200 rounded-lg"
                            >
                              Use Current Loc
                            </button>
                          </div>
                        </div>

                        <label className="mt-4 flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={includeMedicalSnapshot}
                            onChange={(e) => setIncludeMedicalSnapshot(e.target.checked)}
                          />
                          <span className="flex items-center gap-1">
                            <ShieldCheck size={16} /> Include medical snapshot (name, BG, ICE)
                          </span>
                        </label>
                      </div>

                      {/* Hospitals */}
                      <div>
                        <p className="font-medium mb-2">Nearby Hospitals (gov first)</p>
                        <div className="h-56 overflow-auto border rounded p-2">
                          {loadingHospitals ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="animate-spin" /> Loading…
                            </div>
                          ) : (
                            <>
                              {nearbyHospitals.gov.length === 0 && nearbyHospitals.priv.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  No hospitals found yet. Allow location & refresh.
                                </p>
                              ) : (
                                <>
                                  {nearbyHospitals.gov.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-green-700">Government Hospitals</p>
                                      <ul className="space-y-2 mt-2">
                                        {nearbyHospitals.gov.map((h) => (
                                          <li key={h.id} className="flex justify-between items-start">
                                            <div>
                                              <div className="font-medium">{h.name || "Unnamed Gov Hospital"}</div>
                                              <div className="text-xs text-gray-500">{h.addr}</div>
                                            </div>
                                            <a
                                              href={`https://maps.google.com/?q=${h.lat},${h.lng}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-sm text-blue-600 flex items-center gap-1"
                                            >
                                              <MapPin size={14} /> Map
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {nearbyHospitals.priv.length > 0 && (
                                    <div className="mt-4">
                                      <p className="text-xs font-semibold text-gray-700">Private Hospitals</p>
                                      <ul className="space-y-2 mt-2">
                                        {nearbyHospitals.priv.map((h) => (
                                          <li key={h.id} className="flex justify-between items-start">
                                            <div>
                                              <div className="font-medium">{h.name || "Unnamed Private Hospital"}</div>
                                              <div className="text-xs text-gray-500">{h.addr}</div>
                                            </div>
                                            <a
                                              href={`https://maps.google.com/?q=${h.lat},${h.lng}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-sm text-blue-600 flex items-center gap-1"
                                            >
                                              <MapPin size={14} /> Map
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() =>
                              navigator.geolocation.getCurrentPosition((p) =>
                                fetchNearbyHospitals(p.coords.latitude, p.coords.longitude, 8000)
                              )
                            }
                            className="flex-1 px-3 py-2 rounded-lg bg-gray-100"
                          >
                            Refresh
                          </button>
                          <button
                            onClick={() => setNearbyHospitals({ gov: [], priv: [] })}
                            className="px-3 py-2 rounded-lg bg-gray-100"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <KeyRound size={40} className="mx-auto text-red-600 mb-3" />
                    <h4 className="text-lg font-bold mb-2">OTP Verification</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Enter the OTP shown below to confirm your SOS request.
                    </p>
                    <div className="bg-gray-100 p-3 rounded-lg inline-block mb-4 font-mono text-xl tracking-widest">
                      {generatedOtp}
                    </div>
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      className="border p-2 rounded w-40 text-center text-lg tracking-wider"
                    />
                    <div className="mt-4 flex justify-center gap-3">
                      <button
                        onClick={confirmOtpAndSend}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg"
                      >
                        Confirm & Send
                      </button>
                      <button
                        onClick={() => { setOtpStep(false); setEnteredOtp(""); }}
                        className="px-4 py-2 bg-gray-200 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Queue + History Panel */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mt-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold flex items-center gap-2">
              <ShieldCheck size={18} /> Reliability
            </div>
            <div className="text-xs text-gray-500">
              Queue {sosQueue.length} • History {history.length}
            </div>
          </div>

          <OfflineSMS />

          {sosQueue.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm">
              {sosQueue.map((q, i) => (
                <li key={i} className="flex justify-between items-start border-b pb-1">
                  <div>
                    <div className="font-medium">{q.type?.toUpperCase() || "SOS"}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(q.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: "SOS Queue Item",
                            text: `SOS: ${q.type} - https://maps.google.com/?q=${q.lat},${q.lng}`,
                          });
                        }
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 rounded"
                    >
                      Share
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No pending queue items.</p>
          )}

          <div className="mt-3 flex gap-2">
            <button onClick={flushQueue} className="px-3 py-2 bg-sky-600 text-white rounded-lg">
              Retry Send
            </button>
            <button onClick={clearQueue} className="px-3 py-2 bg-gray-100 rounded-lg">
              Clear Queue
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            ⚠️ Call <b>112</b> remains the fastest official route. Online forwarding depends on your backend integration.
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ---------------- Utils ---------------- */
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
