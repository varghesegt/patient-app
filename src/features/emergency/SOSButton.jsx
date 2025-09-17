import React, { useState, useContext, useEffect } from "react";
import { EmergencyContext } from "../../context/EmergencyContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import Button from "../../components/ui/Button";

export default function SOSButton() {
  const { triggerSOS } = useContext(EmergencyContext);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  // Keyboard shortcut: press "S" for SOS
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key.toLowerCase() === "s" && status === "idle") {
        handleSOS();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [status]);

  const handleSOS = async () => {
    setStatus("sending");
    try {
      // Vibrate on mobile for feedback
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);

      await triggerSOS();

      setStatus("success");
      setTimeout(() => setStatus("idle"), 4000); // reset after 4s
    } catch (err) {
      console.error("SOS failed:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000); // reset after 4s
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case "sending":
        return (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Sending...
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle2 className="w-6 h-6 text-green-300 animate-bounce" />
            Sent!
          </>
        );
      case "error":
        return (
          <>
            <XCircle className="w-6 h-6 text-red-200 animate-shake" />
            Failed
          </>
        );
      default:
        return (
          <>
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            🚨 SOS
          </>
        );
    }
  };

  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={
        status === "sending"
          ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 0.8 } }
          : { scale: 1 }
      }
      className="relative inline-block"
    >
      <Button
        onClick={handleSOS}
        aria-label="Emergency SOS Button"
        disabled={status === "sending"}
        className={`flex items-center gap-2 px-10 py-5 rounded-full font-extrabold text-lg 
        shadow-2xl transition relative z-10
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
      </Button>

      {/* Concentric Glowing Rings */}
      {status === "idle" && (
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-4 border-red-500"
              style={{
                width: "100%",
                height: "100%",
                scale: 1 + i * 0.3,
              }}
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{
                opacity: [0.6, 0, 0.6],
                scale: [1, 1.4 + i * 0.3, 1],
              }}
              transition={{
                duration: 2 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Floating Success/Error Badge */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-sm font-semibold text-green-600"
          >
            ✅ Location sent to hospital & ambulance
          </motion.div>
        )}
        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-sm font-semibold text-red-600"
          >
            ❌ Failed to send SOS. Try again.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
