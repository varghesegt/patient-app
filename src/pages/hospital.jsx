import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
} from "react";
import { LanguageContext } from "../context/LanguageContext";
import { motion } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* ✅ Fix Leaflet Default Icon Paths */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url
  ).href,
  iconUrl: new URL(
    "leaflet/dist/images/marker-icon.png",
    import.meta.url
  ).href,
  shadowUrl: new URL(
    "leaflet/dist/images/marker-shadow.png",
    import.meta.url
  ).href,
});

/* ✅ Custom Icons */
const ICONS_URLS = {
  hospital: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
  clinic: "https://cdn-icons-png.flaticon.com/512/4320/4320337.png",
  pharmacy: "https://cdn-icons-png.flaticon.com/512/2966/2966386.png",
  doctors: "https://cdn-icons-png.flaticon.com/512/387/387561.png",
  dentist: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  blood_bank: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png",
  laboratory: "https://cdn-icons-png.flaticon.com/512/3177/3177440.png",
  medical_college: "https://cdn-icons-png.flaticon.com/512/3135/3135810.png",
  default: "https://cdn-icons-png.flaticon.com/512/3177/3177361.png",
};

const buildIcon = (url, size = 38) =>
  new L.Icon({
    iconUrl: url,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size / 1.5],
    shadowUrl: new URL(
      "leaflet/dist/images/marker-shadow.png",
      import.meta.url
    ).href,
    shadowSize: [40, 40],
    shadowAnchor: [12, 40],
  });

const icons = {
  hospital: buildIcon(ICONS_URLS.hospital, 42),
  clinic: buildIcon(ICONS_URLS.clinic, 36),
  pharmacy: buildIcon(ICONS_URLS.pharmacy, 34),
  doctors: buildIcon(ICONS_URLS.doctors, 36),
  dentist: buildIcon(ICONS_URLS.dentist, 34),
  blood_bank: buildIcon(ICONS_URLS.blood_bank, 36),
  laboratory: buildIcon(ICONS_URLS.laboratory, 34),
  medical_college: buildIcon(ICONS_URLS.medical_college, 40),
  default: buildIcon(ICONS_URLS.default, 32),
};

const getIcon = (type = "") => {
  const key = type.toLowerCase();
  if (icons[key]) return icons[key];
  if (key.includes("hospital")) return icons.hospital;
  if (key.includes("clinic")) return icons.clinic;
  if (key.includes("pharmacy")) return icons.pharmacy;
  if (key.includes("dentist")) return icons.dentist;
  if (key.includes("blood")) return icons.blood_bank;
  if (key.includes("lab")) return icons.laboratory;
  if (key.includes("college") || key.includes("education"))
    return icons.medical_college;
  return icons.default;
};

/* ✅ Recenter Map Component */
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 13, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

/* ✅ Debounce Hook */
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

/* ✅ Distance Calculator */
const getDistanceKm = (loc1, loc2) => {
  const R = 6371;
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ✅ Overpass Query */
const buildOverpassQuery = (lat, lng, radius = 20000) => `
  [out:json];
  (
    node["amenity"~"hospital|clinic|pharmacy|doctors|dentist|blood_bank|laboratory"](around:${radius},${lat},${lng});
    way["amenity"~"hospital|clinic|pharmacy|doctors|dentist|blood_bank|laboratory"](around:${radius},${lat},${lng});
    relation["amenity"~"hospital|clinic|pharmacy|doctors|dentist|blood_bank|laboratory"](around:${radius},${lat},${lng});
    node["healthcare"](around:${radius},${lat},${lng});
    way["healthcare"](around:${radius},${lat},${lng});
    relation["healthcare"](around:${radius},${lat},${lng});
    node["education"="medical"](around:${radius},${lat},${lng});
    way["education"="medical"](around:${radius},${lat},${lng});
    relation["education"="medical"](around:${radius},${lat},${lng});
  );
  out center;
`;

export default function Hospital() {
  const { t } = useContext(LanguageContext);
  const [userLocation, setUserLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [maxDistance, setMaxDistance] = useState(10);
  const [category, setCategory] = useState("all");

  const mapRef = useRef(null);
  const debouncedSearch = useDebounce(search, 400);

  /* ✅ Get User Location (with permission handling) */
  useEffect(() => {
    async function getLocation() {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        setUserLocation({ lat: 28.6139, lng: 77.209 });
        return;
      }

      try {
        const permission = await navigator.permissions?.query({
          name: "geolocation",
        });

        if (permission?.state === "denied") {
          alert(
            "⚠️ Location permission is blocked. Please enable it in your browser settings for better results."
          );
          setUserLocation({ lat: 28.6139, lng: 77.209 });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) =>
            setUserLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          (err) => {
            console.error("Location error:", err.message);
            alert(
              "⚠️ Could not get live location — using fallback city (Delhi). Please allow location."
            );
            setUserLocation({ lat: 28.6139, lng: 77.209 });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } catch (err) {
        console.error("Location permission check failed", err);
        setUserLocation({ lat: 28.6139, lng: 77.209 });
      }
    }

    getLocation();
  }, []);

  /* ✅ Fetch Hospitals from Overpass API */
  const fetchHospitals = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);

    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: buildOverpassQuery(userLocation.lat, userLocation.lng, 20000),
      });

      if (!res.ok) throw new Error("Overpass API failed");
      const data = await res.json();

      const mapped = data.elements
        .map((el) => {
          const lat = el.lat || el.center?.lat;
          const lng = el.lon || el.center?.lon;
          if (!lat || !lng) return null;

          return {
            id: el.id,
            name: el.tags?.name || "Unnamed Medical Facility",
            type:
              el.tags?.amenity || el.tags?.healthcare || el.tags?.education || "medical",
            lat,
            lng,
            address: el.tags?.["addr:street"] || "No address available",
            distance: getDistanceKm(userLocation, { lat, lng }),
          };
        })
        .filter(Boolean);

      const unique = Array.from(new Map(mapped.map((p) => [p.id, p])).values());
      setPlaces(unique);
    } catch (e) {
      console.error("Overpass fetch failed:", e.message);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  /* ✅ Filter & Sort Results */
  useEffect(() => {
    let result = places.filter(
      (p) =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
        p.distance <= maxDistance &&
        (category === "all" ||
          p.type.toLowerCase() === category.toLowerCase())
    );
    result.sort((a, b) => a.distance - b.distance);
    setFilteredPlaces(result);
  }, [debouncedSearch, maxDistance, category, places]);

  /* ✅ Loading Screen */
  if (!userLocation || loading) {
    return (
      <div className="flex flex-col gap-3 items-center justify-center h-screen text-blue-600">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="font-medium">Finding hospitals & clinics near you...</p>
      </div>
    );
  }

  /* ✅ UI */
  return (
    <div className="max-w-7xl mx-auto p-6 text-gray-800">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">
        {t?.nav?.hospital || "Nearby Hospitals & Clinics"}
      </h1>

      {/* Search & Filters */}
      <div className="bg-white shadow-lg rounded-lg p-4 mb-6 flex flex-col gap-4">
        <input
          type="text"
          placeholder="🔍 Search hospitals, clinics, pharmacies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-blue-400"
        />

        <div>
          <label className="font-medium">📏 Max Distance: {maxDistance} km</label>
          <input
            type="range"
            min="1"
            max="20"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            "all",
            "hospital",
            "clinic",
            "pharmacy",
            "doctors",
            "dentist",
            "blood_bank",
            "laboratory",
            "medical_college",
          ].map((c) => (
            <motion.button
              key={c}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                category === c
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-50"
              }`}
            >
              {c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden shadow-xl">
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ width: "100%", height: "500px" }}
          whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
        >
          <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={userLocation}>
            <Popup>📍 You are here</Popup>
          </Marker>
          {filteredPlaces.map((p) => (
            <Marker
              key={p.id}
              position={{ lat: p.lat, lng: p.lng }}
              icon={getIcon(p.type)}
            >
              <Popup>
                <h2 className="font-semibold">{p.name}</h2>
                <p>{p.address}</p>
                <p>📍 {p.distance.toFixed(2)} km</p>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Cards */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlaces.map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.04 }}
            className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-xl transition flex flex-col justify-between cursor-pointer"
            onClick={() => {
              mapRef.current?.setView([p.lat, p.lng], 15, { animate: true });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div>
              <h2 className="text-lg font-semibold text-blue-700">{p.name}</h2>
              <p className="text-sm text-gray-700 mt-2 flex items-center gap-1">
                {p.distance < 2 ? "🚶" : "🚗"}{" "}
                <span className="font-medium">{p.distance.toFixed(1)} km</span>{" "}
                away
              </p>
              <span className="inline-block mt-3 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full capitalize">
                {p.type}
              </span>
            </div>
            <div className="mt-5">
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${
                  userLocation
                    ? `${userLocation.lat},${userLocation.lng}`
                    : ""
                }&destination=${p.lat},${p.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 w-full rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-medium shadow hover:from-red-700 hover:to-red-600 transition"
              >
                🚀 Get Directions
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
