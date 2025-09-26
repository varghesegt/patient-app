import React, { useState, useContext, useEffect, useRef } from "react";
import { EmergencyContext } from "../../context/EmergencyContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  MapPin,
} from "lucide-react";
import Button from "../../components/ui/Button";

export default function SOSButtonAdvanced({ onSendOTP /* optional hook to integrate SMS */, smsCountryPrefix = "+91" }) {
  const { triggerSOS } = useContext(EmergencyContext);

  // UI state
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [incident, setIncident] = useState("accident"); // accident | stroke | other
  const [useLiveLocation, setUseLiveLocation] = useState(true);
  const [customLocation, setCustomLocation] = useState("");
  const [coords, setCoords] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalFilter, setHospitalFilter] = useState("any"); // any | government | private

  // OTP flow
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const otpRef = useRef(null);
  const otpTimerRef = useRef(null);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // keyboard shortcut S
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key.toLowerCase() === "s" && status === "idle") {
        openConfirmAndStart();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [status, incident, useLiveLocation, coords, selectedHospital]);

  // watch coords to fetch hospitals
  useEffect(() => {
    if (coords) fetchNearbyHospitals(coords.lat, coords.lon);
  }, [coords]);

  // OTP countdown
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setInterval(() => setOtpCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [otpCountdown]);

  // Helper: open confirmation (modal) before sending, here we open OTP modal
  const openConfirmAndStart = () => {
    // bring up OTP flow
    setVerified(false);
    setOtpSent(false);
    setEnteredOtp("");
    setStatus("idle");
    // try to get live location proactively
    if (useLiveLocation) getLiveLocation();
    // fetch hospitals will be triggered by coords effect
    // UI will show OTP modal for verification
    setShowModal(true);
  };

  // Modal control
  const [showModal, setShowModal] = useState(false);

  // ======= LOCATION =======
  async function getLiveLocation() {
    if (!navigator.geolocation) {
      console.warn("Geolocation not available");
      return;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const lat = p.coords.latitude;
          const lon = p.coords.longitude;
          setCoords({ lat, lon });
          resolve({ lat, lon });
        },
        (err) => {
          console.warn("Geolocation denied or failed:", err);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // If user toggles to custom location, try to geocode the custom location using Nominatim
  async function geocodeLocation(query) {
    if (!query) return null;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url, { headers: { "User-Agent": "SOSApp/1.0 (contact@example.com)" } });
      const data = await res.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setCoords({ lat, lon });
        return { lat, lon };
      }
    } catch (err) {
      console.error("Geocode failed:", err);
    }
    return null;
  }

  // ======= HOSPITALS (Overpass) =======
  // Query Overpass API for hospitals within a radius (meters)
  async function fetchNearbyHospitals(lat, lon, radius = 5000) {
    setNearbyHospitals([]);
    try {
      const query = `[
        out:json][timeout:25];(
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        way["amenity"="hospital"](around:${radius},${lat},${lon});
        relation["amenity"="hospital"](around:${radius},${lat},${lon});
      );out center;`;

      const url = "https://overpass-api.de/api/interpreter";
      const res = await fetch(url, { method: "POST", body: query });
      const json = await res.json();
      const items = json.elements || [];

      const normalized = items.map((el) => {
        const tags = el.tags || {};
        const center = el.center || { lat: el.lat, lon: el.lon };
        const name = tags.name || "Unnamed Hospital";
        const operator = (tags.operator || "").toLowerCase();
        const ownership = (tags.owner || tags.ownership || "").toLowerCase();
        const isGovernment = /gov|government|municipal|state|public/.test(operator + " " + ownership);
        const isPrivate = /private|trust|pvt|llp|ltd|clinic/.test(operator + " " + ownership);
        return {
          id: el.id,
          name,
          lat: center.lat,
          lon: center.lon,
          tags,
          isGovernment,
          isPrivate,
          distance: haversineDistance(lat, lon, center.lat, center.lon),
        };
      });

      // sort by distance
      normalized.sort((a, b) => a.distance - b.distance);
      setNearbyHospitals(normalized);

      // auto-select hospital according to filter (govt fallback)
      const gov = normalized.find((h) => h.isGovernment);
      const first = normalized[0] || null;
      if (!selectedHospital) {
        // pick by filter
        if (hospitalFilter === "government") setSelectedHospital(gov || first);
        else if (hospitalFilter === "private") setSelectedHospital(normalized.find((h) => h.isPrivate) || first);
        else setSelectedHospital(first);
      }
    } catch (err) {
      console.error("fetchNearbyHospitals error", err);
    }
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371e3; // meters
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const dphi = toRad(lat2 - lat1);
    const dlambda = toRad(lon2 - lon1);
    const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ======= OTP flow =======
  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async function sendOtpToPhone() {
    if (!phone) return;
    const code = generateOTP();
    setOtp(code);
    setOtpSent(true);
    setOtpCountdown(120); // 2 minutes to verify

    // Hook for real SMS integration
    if (onSendOTP) {
      try {
        await onSendOTP(smsCountryPrefix + phone, code);
      } catch (err) {
        console.warn("onSendOTP failed", err);
      }
    }

    // For developer convenience: log OTP (remove in production)
    // eslint-disable-next-line no-console
    console.log("[DEV] OTP for verification:", code);
  }

  function verifyOtpNow() {
    if (!otpSent) return false;
    if (enteredOtp === otp) {
      setVerified(true);
      return true;
    } else {
      setVerified(false);
      return false;
    }
  }

  // ======= MAIN SEND =======
  const handleSOS = async () => {
    // Ensure OTP verified before proceeding
    if (!verified) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    setStatus("sending");

    try {
      // Vibrate on mobile for feedback
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

      // Determine final hospital selection: if no selection, pick government-first fallback
      let finalHospital = selectedHospital;
      if (!finalHospital && nearbyHospitals.length) {
        finalHospital = nearbyHospitals.find((h) => h.isGovernment) || nearbyHospitals[0];
      }

      const payload = {
        incident,
        coords,
        customLocation: !useLiveLocation ? customLocation : null,
        hospital: finalHospital,
        phone: smsCountryPrefix + phone,
        verified: true,
        timestamp: new Date().toISOString(),
      };

      // allow EmergencyContext to handle the heavy lifting
      if (triggerSOS) await triggerSOS(payload);

      setStatus("success");
      setTimeout(() => setStatus("idle"), 4000);
      setShowModal(false);
    } catch (err) {
      console.error("SOS failed:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  // UI helpers
  const getButtonContent = () => {
    switch (status) {
      case "sending":
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending...
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-300 animate-bounce" />
            Sent!
          </>
        );
      case "error":
        return (
          <>
            <XCircle className="w-5 h-5 text-red-200 animate-shake" />
            Failed
          </>
        );
      default:
        return (
          <>
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            🚨 SOS
          </>
        );
    }
  };

  return (
  <div className="relative flex items-center justify-center h-[300px]">
    {/* SOS Button */}
    <motion.div
      initial={{ scale: 1 }}
      animate={
        status === "sending"
          ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 0.8 } }
          : { scale: 1 }
      }
      className="relative"
    >
      <Button
        onClick={() => openConfirmAndStart()}
        aria-label="Emergency SOS Button"
        disabled={status === "sending"}
        className={`flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 rounded-full font-extrabold text-base sm:text-lg shadow-2xl transition relative z-10
          ${
            status === "sending"
              ? "bg-red-500 cursor-wait"
              : status === "success"
              ? "bg-green-600 hover:bg-green-700"
              : status === "error"
              ? "bg-red-800 hover:bg-red-900"
              : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          }
          text-white`}
      >
        {getButtonContent()}
        <span className="hidden sm:block mt-1 text-xs opacity-80 absolute bottom-2">
          (press "S")
        </span>
      </Button>
    </motion.div>

    {/* Concentric Glowing Rings */}
    {status === "idle" && (
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-4 border-red-500/30"
            style={{
              width: `${140 + i * 80}px`,
              height: `${140 + i * 80}px`,
            }}
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.4 + i * 0.2, 1] }}
            transition={{ duration: 2 + i, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    )}
      {/* OTP & Configure Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />

            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 sm:p-6 z-10">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">Confirm SOS</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Quickly verify your phone and confirm details before sending.
                  </p>
                </div>
                <button
                  className="text-slate-500 hover:text-slate-700 text-lg sm:text-xl"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Content Grid */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Side */}
                <div className="space-y-3">
                  {/* Incident type */}
                  <label className="block text-sm font-semibold">Incident type</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setIncident("accident")}
                      className={`flex-1 min-w-[90px] px-3 py-2 text-sm sm:text-base rounded-md border ${
                        incident === "accident" ? "bg-red-600 text-white" : "bg-white"
                      }`}
                    >
                      Accident
                    </button>
                    <button
                      onClick={() => setIncident("stroke")}
                      className={`flex-1 min-w-[90px] px-3 py-2 text-sm sm:text-base rounded-md border ${
                        incident === "stroke" ? "bg-yellow-500 text-white" : "bg-white"
                      }`}
                    >
                      Stroke
                    </button>
                    <button
                      onClick={() => setIncident("other")}
                      className={`flex-1 min-w-[90px] px-3 py-2 text-sm sm:text-base rounded-md border ${
                        incident === "other" ? "bg-slate-600 text-white" : "bg-white"
                      }`}
                    >
                      Other
                    </button>
                  </div>

                  {/* Location Toggle */}
                  <label className="block text-sm font-semibold mt-3">Location</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={useLiveLocation}
                        onChange={() => {
                          setUseLiveLocation(true);
                          getLiveLocation();
                        }}
                      />{" "}
                      Live
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={!useLiveLocation}
                        onChange={() => setUseLiveLocation(false)}
                      />{" "}
                      Custom
                    </label>
                  </div>

                  {!useLiveLocation && (
                    <input
                      placeholder="Enter an address or landmark"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                      onBlur={() => customLocation && geocodeLocation(customLocation)}
                    />
                  )}

                  {/* Hospital Filter */}
                  <div className="mt-3">
                    <label className="block text-sm font-semibold">
                      Nearby hospital preference
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["any", "government", "private"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setHospitalFilter(f)}
                          className={`flex-1 min-w-[90px] px-3 py-2 text-sm rounded-md ${
                            hospitalFilter === f
                              ? "bg-slate-800 text-white"
                              : "bg-white border"
                          }`}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 space-y-2 max-h-40 sm:max-h-48 overflow-auto">
                      {nearbyHospitals.length === 0 && (
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          No hospitals found yet. Allow location or enter custom location.
                        </div>
                      )}
                      {nearbyHospitals
                        .filter((h) => {
                          if (hospitalFilter === "government") return h.isGovernment;
                          if (hospitalFilter === "private") return h.isPrivate;
                          return true;
                        })
                        .map((h) => (
                          <label
                            key={h.id}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-slate-50 ${
                              selectedHospital?.id === h.id ? "bg-slate-100" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              checked={selectedHospital?.id === h.id}
                              onChange={() => setSelectedHospital(h)}
                            />
                            <div className="flex-1 text-xs sm:text-sm">
                              <div className="font-semibold">{h.name}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">
                                {(h.distance / 1000).toFixed(2)} km •{" "}
                                {h.isGovernment
                                  ? "Government"
                                  : h.isPrivate
                                  ? "Private"
                                  : "Unknown"}
                              </div>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div className="space-y-3">
                  {/* Phone verification */}
                  <label className="block text-sm font-semibold">
                    Phone verification
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center rounded-md border px-2 text-sm">
                      {smsCountryPrefix}
                    </div>
                    <input
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Enter phone number"
                      className="flex-1 rounded-md border px-3 py-2 text-sm"
                    />
                    <button
                      className="px-3 py-2 rounded-md bg-slate-800 text-white text-sm"
                      onClick={sendOtpToPhone}
                      disabled={!phone || otpSent}
                    >
                      {otpSent ? "Sent" : "Send OTP"}
                    </button>
                  </div>

                  {/* OTP field */}
                  {otpSent && (
                    <div className="mt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={enteredOtp}
                          onChange={(e) =>
                            setEnteredOtp(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="Enter OTP"
                          className="rounded-md border px-3 py-2 w-28 sm:w-32 text-sm"
                        />
                        <button
                          className="px-3 py-2 rounded-md bg-green-600 text-white text-sm"
                          onClick={() => {
                            if (verifyOtpNow()) {
                              setOtpSent(false);
                            }
                          }}
                        >
                          Verify
                        </button>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          {otpCountdown > 0 ? `${otpCountdown}s` : "Expired"}
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] sm:text-xs text-muted-foreground">
                        If you don't receive SMS, ensure your phone number is
                        correct. (In development the OTP is logged to console.)
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  <div className="mt-4">
                    <label className="block text-sm font-semibold">Preview</label>
                    <div className="mt-2 p-3 rounded-md border text-xs sm:text-sm space-y-1">
                      <div>
                        <strong>Incident:</strong> {incident}
                      </div>
                      <div>
                        <strong>Location:</strong>{" "}
                        {useLiveLocation
                          ? coords
                            ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
                            : "Locating..."
                          : customLocation || "Not set"}
                      </div>
                      <div>
                        <strong>Hospital:</strong>{" "}
                        {selectedHospital
                          ? `${selectedHospital.name} (${
                              selectedHospital.isGovernment
                                ? "Government"
                                : selectedHospital.isPrivate
                                ? "Private"
                                : "Unknown"
                            })`
                          : "Auto-selected (government preferred)"}
                      </div>
                      <div>
                        <strong>Phone:</strong>{" "}
                        {phone ? smsCountryPrefix + phone : "Not set"}{" "}
                        {verified && (
                          <span className="text-green-600">• Verified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Button
                      onClick={() => {
                        if (!verified) {
                          setStatus("error");
                          setTimeout(() => setStatus("idle"), 2000);
                          return;
                        }
                        handleSOS();
                      }}
                      className="flex-1 bg-red-600 text-sm"
                    >
                      <MapPin className="w-4 h-4 mr-1 sm:mr-2" /> Send SOS Now
                    </Button>
                    <button
                      className="px-3 py-2 rounded-md border text-sm"
                      onClick={() => {
                        setShowModal(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Success/Error Badge */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-semibold text-green-600 text-center"
          >
            ✅ Location & details sent to hospital & ambulance
          </motion.div>
        )}
        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-semibold text-red-600 text-center"
          >
            ❌ Failed to send SOS. Check phone verification & try again.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
