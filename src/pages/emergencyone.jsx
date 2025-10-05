// ==========================================
// Emergency.jsx — Fully Commented, Production-Ready Rewrite
// ==========================================
// 
// PURPOSE
// -------
// A rich Emergency screen for a web/mobile PWA that offers:
// 1) Manual SOS with OTP confirmation
// 2) Online/offline delivery with local queue + SMS fallback
// 3) Nearby hospitals lookup via OpenStreetMap Overpass API
// 4) Basic crash detection using the DeviceMotion API (demo)
// 5) History of recent SOS events
// 6) Quick actions (call 112, share location, etc.)
// 
// NOTES
// -----
// • This file is intentionally verbose with comments so you can edit safely.
// • Crash detection in the browser is not as reliable as native; consider Capacitor/native for production.
// • Overpass API is a shared resource; respect rate limits and consider caching.
// • The UI uses Tailwind classes + Framer Motion + lucide-react icons.
// • All strings are inline for simplicity; extract to i18n for multilingual use.
// 
// ------------------------------------------
// Imports
// ------------------------------------------
import React, { useEffect, useState, useRef } from "react";
import {
  AlertTriangle,
  PhoneCall,
  Shield,
  MapPin,
  Loader2,
  CheckCircle2,
  X,
  WifiOff,
  Wifi,
  History,
  KeyRound,
} from "lucide-react"; // Icon library
import { motion, AnimatePresence } from "framer-motion"; // Animations
import OfflineSMS from "../features/emergency/OfflineSMS"; // Your offline/SMS helper component

// ------------------------------------------
// Component
// ------------------------------------------
export default function Emergency() {
  // =============================
  //  STATE — Core UI / Flow
  // =============================
  const [sending, setSending] = useState(false); // true while posting SOS
  const [sent, setSent] = useState(false); // one-shot flag to show success checkmark
  const [modalOpen, setModalOpen] = useState(false); // main SOS modal visibility

  // =============================
  //  STATE — Location Handling
  // =============================
  const [manualLocation, setManualLocation] = useState({ lat: "", lng: "" }); // manual lat/lng inputs
  const [useLiveLoc, setUseLiveLoc] = useState(true); // true => navigator.geolocation, false => manual

  // =============================
  //  STATE — Connectivity & Persistence
  // =============================
  const [isOnline, setIsOnline] = useState(navigator.onLine); // current network status
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("sosHistory")) || [] // last ~10 SOS logs
  );
  const [sosQueue, setSosQueue] = useState(
    JSON.parse(localStorage.getItem("sosQueue")) || [] // offline queue for retry
  );

  // =============================
  //  STATE — Device features
  // =============================
  const [vibrateSupported, setVibrateSupported] = useState(false); // navigator.vibrate availability

  // =============================
  //  STATE — Hospitals
  // =============================
  const [nearbyHospitals, setNearbyHospitals] = useState({ gov: [], priv: [] }); // lists split by ownership
  const [loadingHospitals, setLoadingHospitals] = useState(false); // spinner while fetching

  // =============================
  //  STATE — OTP Flow
  // =============================
  const [otpStep, setOtpStep] = useState(false); // true while verifying OTP
  const [generatedOtp, setGeneratedOtp] = useState(""); // server/mock-generated OTP
  const [enteredOtp, setEnteredOtp] = useState(""); // user's input OTP
  const [selectedType, setSelectedType] = useState(null); // type selected before OTP (e.g., accident)

  // =============================
  //  STATE — One-tap controls
  // =============================
  const [hiddenTypes, setHiddenTypes] = useState([]); // once used, hide that type button until refresh

  // =============================
  //  STATE — Crash Detection (demo)
  // =============================
  const DEFAULT_CRASH_COUNTDOWN_MS = 10000; // reset baseline, adjustable later via UI if needed
  const [crashDetectionEnabled, setCrashDetectionEnabled] = useState(false); // toggle
  const [crashDetected, setCrashDetected] = useState(false); // modal flag when impact detected
  const [crashCountdownMs, setCrashCountdownMs] = useState(DEFAULT_CRASH_COUNTDOWN_MS); // live countdown

  // =============================
  //  CONSTANTS — Tuning knobs
  // =============================
  const IMPACT_THRESHOLD = 35; // acceleration magnitude threshold to trigger crash (demo value)
  const DEVICE_MOTION_POLL_INTERVAL = 250; // throttle DeviceMotion sampling in ms

  // =============================
  //  REFS — Timers & Constants
  // =============================
  const crashTimerRef = useRef(null); // final auto-SOS timer
  const countdownIntervalRef = useRef(null); // updates countdown display
  const crashTimeoutRef = useRef(null); // safety autoclose fallback

  // Use a ref for static emergency type descriptors (no re-renders)
  const emergencyTypesRef = useRef([
    { id: "accident", label: "Accident" },
    { id: "stroke", label: "Stroke" },
    { id: "fire", label: "Fire" },
    { id: "assault", label: "Assault" },
    { id: "other", label: "Other" },
  ]);

  // ------------------------------------------
  // EFFECT — Connectivity & Vibrate & Queue flush
  // ------------------------------------------
  useEffect(() => {
    // Handler: user goes online
    const handleOnline = () => setIsOnline(true);
    // Handler: user goes offline
    const handleOffline = () => setIsOnline(false);

    // Subscribe to browser online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check vibrate support once (no permission required)
    setVibrateSupported("vibrate" in navigator);

    // If we *start* online, attempt to flush queue immediately
    if (isOnline) flushQueue();

    // Cleanup subscriptions
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOnline]); // intentionally depends on isOnline so flush attempts re-run

  // ------------------------------------------
  // EFFECT — Persist queue & history to localStorage
  // ------------------------------------------
  useEffect(() => {
    localStorage.setItem("sosQueue", JSON.stringify(sosQueue));
  }, [sosQueue]);

  useEffect(() => {
    localStorage.setItem("sosHistory", JSON.stringify(history));
  }, [history]);

  // ------------------------------------------
  // HELPERS — History/Queue management
  // ------------------------------------------
  /**
   * saveToHistory — prepend a record and cap to last 10
   */
  const saveToHistory = (data) => setHistory((prev) => [data, ...prev].slice(0, 10));

  /**
   * addToQueue — prepend an offline item and cap to 20
   */
  const addToQueue = (data) => setSosQueue((prev) => [data, ...prev].slice(0, 20));

  /**
   * clearHistoryItem — remove one item by index
   */
  const clearHistoryItem = (idx) => setHistory((prev) => prev.filter((_, i) => i !== idx));

  /**
   * clearQueue — remove all queued items (user action)
   */
  const clearQueue = () => setSosQueue([]);

  // ------------------------------------------
  // HELPERS — Hospital classification
  // ------------------------------------------
  /**
   * isGovernmentHospital — naive keyword test to categorize gov vs private.
   * NOTE: Improve with better heuristics (tags/operator/ownership) if needed.
   */
  const isGovernmentHospital = (name) => {
    if (!name) return false;
    const keywords = [
      "govt",
      "government",
      "municipal",
      "state",
      "public",
      "regional",
      "rural hospital",
      "district hospital",
      "medical college",
    ];
    return keywords.some((k) => name.toLowerCase().includes(k));
  };

  // ------------------------------------------
  // DATA — Fetch nearby hospitals via Overpass API
  // ------------------------------------------
  /**
   * fetchNearbyHospitals — searches OSM for nearby hospitals around a point.
   * @param {number} lat
   * @param {number} lng
   * @param {number} radius meters (default 5000)
   * @returns {Promise<{gov: Array, priv: Array}>}
   */
  const fetchNearbyHospitals = async (lat, lng, radius = 5000) => {
    try {
      setLoadingHospitals(true);

      // Overpass QL query that returns hospital nodes/ways/relations
      const query = `[out:json][timeout:25];
        (
          node[amenity=hospital](around:${radius},${lat},${lng});
          way[amenity=hospital](around:${radius},${lat},${lng});
          relation[amenity=hospital](around:${radius},${lat},${lng});
        );
        out center 20;`;

      // Overpass recommends POST with urlencoded body: data=<QUERY>
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!res.ok) throw new Error("Failed to fetch hospital data");

      const data = await res.json();
      const places = (data.elements || []).map((el) => ({
        id: el.id,
        name: el.tags?.name || el.tags?.operator, // operator fallback if name missing
        lat: el.lat || el.center?.lat, // ways/relations carry center
        lng: el.lon || el.center?.lon,
        addr: el.tags?.["addr:full"] || el.tags?.["addr:street"],
        tags: el.tags || {},
      }));

      // Split by ownership guess
      const gov = places.filter((p) => isGovernmentHospital(p.name));
      const priv = places.filter((p) => !isGovernmentHospital(p.name));

      setNearbyHospitals({ gov, priv });
      return { gov, priv };
    } catch (err) {
      console.error("Hospital lookup failed:", err);
      setNearbyHospitals({ gov: [], priv: [] });
      return { gov: [], priv: [] };
    } finally {
      setLoadingHospitals(false);
    }
  };

  // ------------------------------------------
  // ACTION — Try sending any queued items (online only)
  // ------------------------------------------
  const flushQueue = async () => {
    if (!isOnline || sosQueue.length === 0) return; // nothing to do

    const remaining = [];
    for (const item of sosQueue) {
      try {
        const res = await fetch("/api/emergency/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error("Failed to send");
      } catch {
        // Keep item in queue if any failure occurs
        remaining.push(item);
      }
    }
    setSosQueue(remaining);
  };

  // ------------------------------------------
  // OTP — Request + Confirm
  // ------------------------------------------
  /**
   * requestOtp — starts OTP step for a selected type + location mode
   * In production, generate & deliver OTP from server (SMS/voice/WhatsApp)
   */
  const requestOtp = (type, useLive) => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit mock OTP
    setGeneratedOtp(otp);
    setOtpStep(true);
    setSelectedType(type);
    setUseLiveLoc(useLive);
    console.log("Generated OTP:", otp); // dev aid; remove in production
  };

  /**
   * confirmOtpAndSend — validates the OTP and calls handleSOS
   */
  const confirmOtpAndSend = async () => {
    if (enteredOtp !== generatedOtp) {
      alert("❌ Incorrect OTP. Please try again.");
      return;
    }
    // Cleanup OTP state first to avoid stale UI
    setOtpStep(false);
    setEnteredOtp("");
    setGeneratedOtp("");

    // Kick off SOS
    await handleSOS(useLiveLoc, selectedType);
  };

  // ------------------------------------------
  // ACTION — Create & send the SOS payload
  // ------------------------------------------
  /**
   * handleSOS — resolves coordinates, fetches hospitals, sends/queues payload
   * @param {boolean} useLiveLocation - whether to use GPS or manual inputs
   * @param {string} type - emergency type id
   */
  const handleSOS = async (useLiveLocation, type = "other") => {
    try {
      setSending(true);
      setSent(false);
      setModalOpen(false);

      let latitude, longitude;

      // 1) Resolve coordinates (GPS or manual)
      if (useLiveLocation) {
        try {
          // Wrap geolocation in a Promise for async/await
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000, // 10s timeout to avoid hanging UX
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch {
          alert("⚠️ Location access denied. Please enable GPS or use manual input.");
          setSending(false);
          return; // abort flow if we need live GPS but failed
        }
      } else {
        // Validate manual input (string → float)
        latitude = parseFloat(manualLocation.lat);
        longitude = parseFloat(manualLocation.lng);
      }

      // 2) Fetch up to 20 nearby hospitals (we'll show top 3 for each category)
      const nearest = await fetchNearbyHospitals(latitude, longitude, 10000);

      // 3) Assemble payload
      const sosData = {
        lat: latitude,
        lng: longitude,
        timestamp: new Date().toISOString(),
        status: isOnline ? "Sent Online" : "Queued Offline",
        type,
        nearestGovHospitals: nearest.gov?.slice(0, 3),
        nearestPrivateHospitals: nearest.priv?.slice(0, 3),
      };

      // 4) Send to server or queue + SMS fallback
      if (isOnline) {
        try {
          const res = await fetch("/api/emergency/sos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sosData),
          });
          if (!res.ok) throw new Error("Server POST failed");
        } catch {
          // If the POST fails, keep it in queue
          addToQueue(sosData);
        }
      } else {
        // Offline path: open SMS compose (best-effort) + queue
        const smsBody = encodeURIComponent(
          `🚨 EMERGENCY (${type.toUpperCase()})! Location: https://maps.google.com/?q=${latitude},${longitude}`
        );
        window.location.href = `sms:?body=${smsBody}`; // works on mobile; desktop may do nothing
        addToQueue({ ...sosData, status: "Queued Offline - SMS Sent" });
      }

      // 5) Persist in history + UI affordances
      saveToHistory(sosData);
      setHiddenTypes((prev) => (prev.includes(type) ? prev : [...prev, type]));

      // 6) UX feedback
      setSending(false);
      setSent(true);
      if (vibrateSupported) navigator.vibrate([200, 100, 200]);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      console.error("SOS failed:", err);
      setSending(false);
    }
  };

  // ------------------------------------------
  // UI — Open SOS modal + prime hospitals list
  // ------------------------------------------
  const openModal = () => {
    setModalOpen(true);
    // Try to prefetch hospitals for a smoother experience
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearbyHospitals(pos.coords.latitude, pos.coords.longitude, 8000),
      () => console.warn("Location access denied for hospitals lookup")
    );
  };

  // ------------------------------------------
  // MOTION — Permissions for DeviceMotion on iOS
  // ------------------------------------------
  const requestMotionPermission = async () => {
    try {
      // iOS Safari requires a user gesture + this method call at runtime
      if (typeof DeviceMotionEvent !== "undefined" && DeviceMotionEvent.requestPermission) {
        const perm = await DeviceMotionEvent.requestPermission();
        if (perm === "granted") {
          console.log("DeviceMotion permission granted");
          return true;
        } else {
          console.warn("DeviceMotion permission denied");
          return false;
        }
      }
      // Non-iOS browsers: no explicit permission step
      return true;
    } catch (err) {
      console.warn("Motion permission request failed:", err);
      return false;
    }
  };

  // ------------------------------------------
  // EFFECT — Crash detection listener lifecycle
  // ------------------------------------------
  useEffect(() => {
    let lastSampleTime = 0; // throttle clock

    // Handler for device motion samples
    const handleMotion = (event) => {
      const now = Date.now();
      if (now - lastSampleTime < DEVICE_MOTION_POLL_INTERVAL) return; // throttle
      lastSampleTime = now;

      const acc = event.accelerationIncludingGravity; // includes gravity, useful for big impacts
      if (!acc) return; // some browsers/devices may not populate

      const ax = acc.x || 0;
      const ay = acc.y || 0;
      const az = acc.z || 0;

      // Simple magnitude check (demo). Consider high-pass filtering for better signal.
      const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
      if (magnitude > IMPACT_THRESHOLD && !crashDetected) {
        console.log("Impact detected, magnitude:", magnitude);
        triggerCrashDetected();
      }
    };

    if (crashDetectionEnabled) {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      clearCrashTimers(); // ensure no timers leak when toggling off or unmounting
    };
  }, [crashDetectionEnabled, crashDetected]);

  // ------------------------------------------
  // HELPERS — Crash detection timers
  // ------------------------------------------
  /**
   * clearCrashTimers — cancels all crash-related timers/intervals
   */
  const clearCrashTimers = () => {
    if (crashTimerRef.current) {
      clearTimeout(crashTimerRef.current);
      crashTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (crashTimeoutRef.current) {
      clearTimeout(crashTimeoutRef.current);
      crashTimeoutRef.current = null;
    }
  };

  /**
   * triggerCrashDetected — opens modal, starts countdown, and auto-sends SOS
   */
  const triggerCrashDetected = () => {
    setCrashDetected(true);
    if (vibrateSupported) navigator.vibrate([300, 100, 300]);

    // Reset countdown to default each time a crash is detected
    setCrashCountdownMs(DEFAULT_CRASH_COUNTDOWN_MS);

    const startedAt = Date.now();
    const intervalMs = 250; // how often to update the visible countdown

    // Update countdown display on an interval
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, DEFAULT_CRASH_COUNTDOWN_MS - elapsed);
      setCrashCountdownMs(remaining);
      if (remaining <= 0 && countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }, intervalMs);

    // When countdown ends, send SOS automatically (accident)
    crashTimerRef.current = setTimeout(async () => {
      try {
        await handleSOS(true, "accident");
      } catch (e) {
        console.error("Auto SOS failed:", e);
      } finally {
        setCrashDetected(false);
        setCrashCountdownMs(DEFAULT_CRASH_COUNTDOWN_MS);
        clearCrashTimers();
      }
    }, DEFAULT_CRASH_COUNTDOWN_MS);

    // Safety autoclose in case something hangs (countdown + 15s)
    crashTimeoutRef.current = setTimeout(() => {
      setCrashDetected(false);
      setCrashCountdownMs(DEFAULT_CRASH_COUNTDOWN_MS);
      clearCrashTimers();
    }, DEFAULT_CRASH_COUNTDOWN_MS + 15000);
  };

  /**
   * cancelCrashDetection — user cancels the auto-send flow
   */
  const cancelCrashDetection = () => {
    clearCrashTimers();
    setCrashDetected(false);
    setCrashCountdownMs(DEFAULT_CRASH_COUNTDOWN_MS);
    if (vibrateSupported) navigator.vibrate([100, 50]);
  };

  /**
   * toggleCrashDetection — toggles motion listeners with permission checks
   */
  const toggleCrashDetection = async (enable) => {
    if (enable) {
      const permissionOk = await requestMotionPermission();
      if (!permissionOk) {
        alert(
          "Motion access denied. For crash detection to work you must grant Device Motion permission in your browser."
        );
        setCrashDetectionEnabled(false);
        return;
      }
      setCrashDetectionEnabled(true);
    } else {
      setCrashDetectionEnabled(false);
      clearCrashTimers();
    }
  };

  // ------------------------------------------
  // RENDER — UI
  // ------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6 sm:p-10 relative overflow-hidden">
      {/** Decorative glowing orb in the background */}
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-60 h-60 bg-red-300 rounded-full blur-3xl opacity-20 pointer-events-none"
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/** --------------------------------------------------
         * HEADER
         * -------------------------------------------------- */}
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
          <p className="mt-2 text-gray-600 dark:text-gray-300 text-base sm:text-lg">
            Quick emergency actions with OTP confirmation. Select a type, verify, and send
            location with nearby hospitals.
          </p>
          <div className="flex items-center justify-center mt-2 gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Wifi size={16} /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500 text-sm">
                <WifiOff size={16} /> Offline Mode
              </span>
            )}
          </div>
        </motion.div>

        {/** --------------------------------------------------
         * MAIN SOS CARD (button + crash detection toggle)
         * -------------------------------------------------- */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl border border-red-200 dark:border-red-800 p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Immediate SOS
          </h3>

          {/** Big SOS button with three states: idle / sending / sent */}
          <div className="flex flex-col items-center gap-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openModal}
              disabled={sending}
              className={`relative w-40 h-40 flex items-center justify-center rounded-full font-bold text-2xl uppercase tracking-wide ${
                sending ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
              } text-white shadow-2xl transition`}
            >
              {sending ? (
                <Loader2 className="animate-spin w-10 h-10" />
              ) : sent ? (
                <CheckCircle2 className="w-12 h-12 text-green-400 animate-bounce" />
              ) : (
                "SOS"
              )}
              {!sending && !sent && (
                <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping"></span>
              )}
            </motion.button>

            {!sending && !sent && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tap to choose emergency type & confirm with OTP.
              </p>
            )}
            {sending && (
              <p className="text-sm text-gray-600 dark:text-gray-400">Sending location…</p>
            )}
            {sent && (
              <p className="text-sm text-green-600 dark:text-green-400 font-semibold">SOS triggered ✅</p>
            )}
          </div>

          {/** Crash detection toggle + status text */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={crashDetectionEnabled}
                onChange={(e) => toggleCrashDetection(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-600">Enable Crash Detection (Demo)</span>
            </label>
            {crashDetectionEnabled && (
              <span className="text-xs text-green-600">Monitoring sensors…</span>
            )}
            {!crashDetectionEnabled && (
              <span className="text-xs text-gray-500">Not monitoring</span>
            )}
          </div>
        </motion.div>

        {/** --------------------------------------------------
         * MODAL — Crash detected confirm/cancel
         * -------------------------------------------------- */}
        <AnimatePresence>
          {crashDetected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-full max-w-md text-center"
              >
                <AlertTriangle className="mx-auto text-red-600 mb-3" size={48} />
                <h3 className="text-xl font-bold mb-2">Possible Crash Detected</h3>
                <p className="text-gray-600 mb-3">
                  We detected a sudden impact. An SOS will be sent automatically in{" "}
                  <strong>{Math.ceil(crashCountdownMs / 1000)}</strong> seconds unless cancelled.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={cancelCrashDetection}
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/** --------------------------------------------------
         * MODAL — Emergency type + location + OTP flow
         * -------------------------------------------------- */}
        <AnimatePresence>
          {modalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-full max-w-2xl relative"
              >
                {/** Close X */}
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setOtpStep(false);
                    setEnteredOtp("");
                  }}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>

                {!otpStep ? (
                  <>
                    <h4 className="text-lg font-semibold mb-4">Choose Emergency Type & Location</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/** Left: emergency type + manual coordinates */}
                      <div>
                        <p className="font-medium mb-2">Emergency Type</p>
                        <div className="flex flex-wrap gap-2">
                          {emergencyTypesRef.current.map((t) => {
                            if (hiddenTypes.includes(t.id)) return null; // hide types once used
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
                          <input
                            type="text"
                            placeholder="Latitude"
                            value={manualLocation.lat}
                            onChange={(e) =>
                              setManualLocation({ ...manualLocation, lat: e.target.value })
                            }
                            className="border rounded p-2 w-full mb-2"
                          />
                          <input
                            type="text"
                            placeholder="Longitude"
                            value={manualLocation.lng}
                            onChange={(e) =>
                              setManualLocation({ ...manualLocation, lng: e.target.value })
                            }
                            className="border rounded p-2 w-full mb-2"
                          />
                          <div className="flex gap-2">
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
                                  setManualLocation({
                                    lat: p.coords.latitude,
                                    lng: p.coords.longitude,
                                  });
                                });
                              }}
                              className="px-4 py-2 bg-gray-200 rounded-lg"
                            >
                              Use Current Loc
                            </button>
                          </div>
                        </div>
                      </div>

                      {/** Right: hospital list (gov first) */}
                      <div>
                        <p className="font-medium mb-2">Nearby Hospitals (government first)</p>
                        <div className="h-56 overflow-auto border rounded p-2">
                          {loadingHospitals ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="animate-spin" /> Loading…
                            </div>
                          ) : (
                            <>
                              {nearbyHospitals.gov.length === 0 &&
                              nearbyHospitals.priv.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  No hospitals found yet. Allow location and reopen modal or try
                                  again.
                                </p>
                              ) : (
                                <>
                                  {nearbyHospitals.gov.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-green-700">
                                        Government Hospitals
                                      </p>
                                      <ul className="space-y-2 mt-2">
                                        {nearbyHospitals.gov.map((h) => (
                                          <li
                                            key={h.id}
                                            className="flex justify-between items-start"
                                          >
                                            <div>
                                              <div className="font-medium">
                                                {h.name || "Unnamed Gov Hospital"}
                                              </div>
                                              <div className="text-xs text-gray-500">{h.addr}</div>
                                            </div>
                                            <a
                                              href={`https://maps.google.com/?q=${h.lat},${h.lng}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-sm text-blue-600"
                                            >
                                              Map
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {nearbyHospitals.priv.length > 0 && (
                                    <div className="mt-4">
                                      <p className="text-xs font-semibold text-gray-700">
                                        Private Hospitals
                                      </p>
                                      <ul className="space-y-2 mt-2">
                                        {nearbyHospitals.priv.map((h) => (
                                          <li
                                            key={h.id}
                                            className="flex justify-between items-start"
                                          >
                                            <div>
                                              <div className="font-medium">
                                                {h.name || "Unnamed Private Hospital"}
                                              </div>
                                              <div className="text-xs text-gray-500">{h.addr}</div>
                                            </div>
                                            <a
                                              href={`https://maps.google.com/?q=${h.lat},${h.lng}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-sm text-blue-600"
                                            >
                                              Map
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
                      Enter the OTP below to confirm SOS request.
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
                        onClick={() => {
                          setOtpStep(false);
                          setEnteredOtp("");
                        }}
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

        {/** --------------------------------------------------
         * OFFLINE QUEUE — items waiting to be sent
         * -------------------------------------------------- */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-md"
        >
          <OfflineSMS />
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Offline Queue</div>
              <div className="text-sm text-gray-500">{sosQueue.length} pending</div>
            </div>
            {sosQueue.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {sosQueue.map((q, i) => (
                  <li key={i} className="flex justify-between items-start border-b pb-1">
                    <div>
                      <div className="font-medium">{q.type?.toUpperCase() || "SOS"}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(q.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {navigator.share && (
                        <button
                          onClick={() => {
                            navigator.share({
                              title: "SOS",
                              text: `SOS: ${q.type} - https://maps.google.com/?q=${q.lat},${q.lng}`,
                            });
                          }}
                          className="text-xs px-2 py-1 bg-gray-100 rounded"
                        >
                          Share
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No pending items</p>
            )}
            <div className="mt-3 flex gap-2">
              <button onClick={flushQueue} className="px-3 py-2 bg-green-600 text-white rounded">
                Try Send Now
              </button>
              <button onClick={clearQueue} className="px-3 py-2 bg-gray-200 rounded">
                Clear Queue
              </button>
            </div>
          </div>
        </motion.div>

        {/** --------------------------------------------------
         * EXTRAS — quick action cards
         * -------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-10 grid gap-6 sm:grid-cols-2"
        >
          {[
            {
              icon: PhoneCall,
              title: "Direct Helpline",
              desc: "Instantly dial 112 or your nearest emergency number.",
              color: "text-blue-500",
              action: () => (window.location.href = "tel:112"),
            },
            {
              icon: Shield,
              title: "Safety Tips",
              desc: "Stay calm, secure your surroundings, and follow steps.",
              color: "text-green-500",
            },
            {
              icon: MapPin,
              title: "Share Location",
              desc: "Share your current map link with a contact.",
              color: "text-purple-500",
              action: () =>
                navigator.share &&
                navigator.share({
                  title: "My Location",
                  text: `I'm here: ${window.location.href}`,
                }),
            },
            {
              icon: AlertTriangle,
              title: "Critical Alerts",
              desc: "Get notified of nearby incidents or hazards.",
              color: "text-orange-500",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              onClick={card.action}
              className="bg-white/90 dark:bg-gray-800/90 p-5 rounded-xl shadow hover:shadow-lg transition cursor-pointer flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <card.icon className={`${card.color}`} size={24} />
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{card.title}</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
