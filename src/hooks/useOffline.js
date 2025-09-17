import useOffline from "@/hooks/useOffline";

export default function StatusBar() {
  const { online, effectiveType, downlink, saveData } = useOffline();

  return (
    <div className={`p-3 text-sm ${online ? "bg-green-100" : "bg-red-100"}`}>
      {online ? "✅ Online" : "⚠️ Offline"}
      {online && (
        <div className="text-gray-600 text-xs mt-1">
          Network: {effectiveType?.toUpperCase() || "Unknown"} •{" "}
          {downlink ? `${downlink} Mbps` : "?"} •{" "}
          {saveData ? "Data Saver On" : "Normal"}
        </div>
      )}
    </div>
  );
}
