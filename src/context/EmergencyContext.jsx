import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const STORAGE_KEY = "emergency_alerts";
const ALERT_TTL = 5 * 60 * 1000; // 5 minutes auto-expiry

export const EmergencyContext = createContext({
  alerts: [],
  dispatchSOS: () => {},
  clearAlert: () => {},
});

export function EmergencyProvider({ children, onDispatch }) {
  const [alerts, setAlerts] = useState([]);

  // ✅ Load persisted alerts
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAlerts(parsed.filter((a) => Date.now() - a.timestamp < ALERT_TTL));
      } catch {
        console.warn("Invalid stored alerts");
      }
    }
  }, []);

  // ✅ Persist + auto-clean expired
  useEffect(() => {
    const active = alerts.filter((a) => Date.now() - a.timestamp < ALERT_TTL);
    if (active.length !== alerts.length) setAlerts(active);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
  }, [alerts]);

  // ✅ Cross-tab sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setAlerts(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // ✅ Dispatch new SOS
  const dispatchSOS = useCallback(
    (data) => {
      const alert = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...data,
      };

      setAlerts((prev) => [alert, ...prev]);

      // 🔔 Play sound + vibrate if supported
      try {
        new Audio("/sos-alert.mp3").play().catch(() => {});
        if ("vibrate" in navigator) navigator.vibrate([300, 200, 300]);
      } catch (e) {
        console.warn("Notification error:", e);
      }

      // 📤 External hook (e.g., API/webhook)
      if (onDispatch) onDispatch(alert);
    },
    [onDispatch]
  );

  // ✅ Clear specific alert
  const clearAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const value = useMemo(
    () => ({ alerts, dispatchSOS, clearAlert }),
    [alerts, dispatchSOS, clearAlert]
  );

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
}
