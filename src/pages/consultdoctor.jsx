import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Phone,
  Info,
  Brain,
  HeartPulse,
  Baby,
  Eye,
  Bone,
  Smile,
  Star,
  MapPin,
  Languages,
  Search,
  Filter,
  Video,
  MessageSquare,
  Award,
  TestTube,
  CheckCircle,
  Clock,
  Microscope,
  SortAsc,
  Wind, 
} from "lucide-react";

export default function ConsultDoctor() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [location, setLocation] = useState("All");
  const [sortBy, setSortBy] = useState("rating");

  const specialties = [
    { icon: <HeartPulse className="w-6 h-6 text-red-500" />, title: "Cardiology" },
    { icon: <Brain className="w-6 h-6 text-purple-600" />, title: "Neurology" },
    { icon: <Baby className="w-6 h-6 text-pink-500" />, title: "Pediatrics" },
    { icon: <Eye className="w-6 h-6 text-sky-500" />, title: "Ophthalmology" },
    { icon: <Bone className="w-6 h-6 text-amber-600" />, title: "Orthopedics" },
    { icon: <Smile className="w-6 h-6 text-green-500" />, title: "Dentistry" },
    { icon: <Stethoscope className="w-6 h-6 text-blue-600" />, title: "General Medicine" },
    { icon: <TestTube className="w-6 h-6 text-pink-700" />, title: "Pathology" },
    { icon: <Microscope className="w-6 h-6 text-indigo-600" />, title: "Oncology" },
    { icon: <Wind className="w-6 h-6 text-cyan-600" />, title: "Pulmonology" },
  ];

const locations = [
  "All",
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
];

const doctors = [
  {
    name: "Dr. Anjali Mehta",
    specialty: "Cardiology",
    experience: "12+ Years",
    rating: 4.8,
    hospital: "Apollo Hospitals, Delhi",
    languages: "English, Hindi",
    phone: "+911234567890",
    whatsapp: "https://wa.me/911234567890",
    city: "Delhi",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    available: ["10:00 AM", "12:30 PM", "4:00 PM"],
    verified: true,
  },
  {
    name: "Dr. Rajesh Kumar",
    specialty: "Neurology",
    experience: "15+ Years",
    rating: 4.9,
    hospital: "Fortis Hospitals, Mumbai",
    languages: "English, Hindi, Marathi",
    phone: "+911122334455",
    whatsapp: "https://wa.me/911122334455",
    city: "Mumbai",
    image: "https://randomuser.me/api/portraits/men/46.jpg",
    available: ["9:30 AM", "1:00 PM", "5:30 PM"],
    verified: true,
  },
  {
    name: "Dr. Priya Sharma",
    specialty: "Pediatrics",
    experience: "10+ Years",
    rating: 4.7,
    hospital: "Rainbow Hospitals, Bangalore",
    languages: "English, Kannada, Hindi",
    phone: "+919876543210",
    whatsapp: "https://wa.me/919876543210",
    city: "Bangalore",
    image: "https://randomuser.me/api/portraits/women/47.jpg",
    available: ["11:00 AM", "3:00 PM"],
    verified: false,
  },
  {
    name: "Dr. Suresh Reddy",
    specialty: "Orthopedics",
    experience: "18+ Years",
    rating: 4.6,
    hospital: "Yashoda Hospitals, Hyderabad",
    languages: "English, Telugu, Hindi",
    phone: "+919944556677",
    whatsapp: "https://wa.me/919944556677",
    city: "Hyderabad",
    image: "https://randomuser.me/api/portraits/men/52.jpg",
    available: ["10:30 AM", "2:00 PM", "6:00 PM"],
    verified: true,
  },
  {
    name: "Dr. Kavita Nair",
    specialty: "Ophthalmology",
    experience: "14+ Years",
    rating: 4.9,
    hospital: "Narayana Nethralaya, Chennai",
    languages: "English, Tamil, Hindi",
    phone: "+919876512340",
    whatsapp: "https://wa.me/919876512340",
    city: "Chennai",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    available: ["9:00 AM", "1:30 PM", "5:00 PM"],
    verified: true,
  },
  {
    name: "Dr. Arjun Patel",
    specialty: "Dentistry",
    experience: "9+ Years",
    rating: 4.5,
    hospital: "Smile Dental Care, Ahmedabad",
    languages: "English, Gujarati, Hindi",
    phone: "+919855667788",
    whatsapp: "https://wa.me/919855667788",
    city: "Ahmedabad",
    image: "https://randomuser.me/api/portraits/men/67.jpg",
    available: ["10:00 AM", "12:00 PM", "4:30 PM"],
    verified: false,
  },
  {
    name: "Dr. Ritu Chatterjee",
    specialty: "Oncology",
    experience: "20+ Years",
    rating: 4.9,
    hospital: "Tata Medical Center, Kolkata",
    languages: "English, Bengali, Hindi",
    phone: "+919811223344",
    whatsapp: "https://wa.me/919811223344",
    city: "Kolkata",
    image: "https://randomuser.me/api/portraits/women/72.jpg",
    available: ["9:30 AM", "1:00 PM"],
    verified: true,
  },
  {
    name: "Dr. Manish Gupta",
    specialty: "Pulmonology",
    experience: "16+ Years",
    rating: 4.7,
    hospital: "Manipal Hospitals, Pune",
    languages: "English, Hindi, Marathi",
    phone: "+919922334455",
    whatsapp: "https://wa.me/919922334455",
    city: "Pune",
    image: "https://randomuser.me/api/portraits/men/74.jpg",
    available: ["11:00 AM", "2:30 PM", "6:30 PM"],
    verified: true,
  },
];

  let filteredDoctors = doctors.filter(
    (doc) =>
      (filter === "All" || doc.specialty === filter) &&
      (location === "All" || doc.city === location) &&
      doc.name.toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy === "rating") {
    filteredDoctors = filteredDoctors.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "experience") {
    filteredDoctors = filteredDoctors.sort(
      (a, b) => parseInt(b.experience) - parseInt(a.experience)
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-sky-50 text-gray-900 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center px-6 pt-12 sm:pt-20"
      >
        <Stethoscope className="w-20 h-20 sm:w-24 sm:h-24 text-indigo-600 mx-auto drop-shadow-lg" />
        <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold mt-6 bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
          Consult a Doctor
        </h2>
        <p className="mt-5 text-gray-700 max-w-2xl mx-auto text-lg">
          Find <span className="font-semibold text-indigo-600">specialists</span>, 
          compare experience, and book consultations across{" "}
          <span className="text-sky-600 font-semibold">India</span>.
        </p>
      </motion.div>
      <div className="max-w-6xl mx-auto px-6 mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {specialties.map((s, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            onClick={() => setFilter(s.title)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-md ${
              filter === s.title ? "bg-indigo-100 border border-indigo-400" : "bg-white"
            }`}
          >
            {s.icon}
            <span className="text-sm mt-2 font-medium">{s.title}</span>
          </motion.button>
        ))}
      </div>
      <div className="max-w-6xl mx-auto mt-12 px-4 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative w-full lg:w-1/3">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search doctor by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="relative w-full lg:w-1/4">
          <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {locations.map((loc, i) => (
              <option key={i} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <div className="relative w-full lg:w-1/4">
          <SortAsc className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="rating">Sort by Rating</option>
            <option value="experience">Sort by Experience</option>
          </select>
        </div>
      </div>
      <div className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-8">
        {filteredDoctors.length === 0 ? (
          <p className="text-center text-gray-500">No doctors found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doc, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03 }}
                className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-lg p-6 flex flex-col gap-4 hover:shadow-2xl transition-all"
              >
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-indigo-100"
                />
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-indigo-700 flex items-center justify-center gap-2">
                    {doc.name}
                    {doc.verified && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </h4>
                  <p className="text-sm text-gray-600">{doc.experience}</p>
                </div>

                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-sky-500" /> {doc.specialty}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" /> {doc.hospital} ({doc.city})
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-green-600" /> {doc.languages}
                </p>
                <p className="text-sm flex items-center gap-1 text-yellow-500">
                  {Array.from({ length: 5 }, (_, idx) => (
                    <Star
                      key={idx}
                      className={`w-4 h-4 ${
                        idx < Math.round(doc.rating) ? "fill-yellow-400" : "fill-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-gray-700 ml-2">{doc.rating} / 5</span>
                </p>
                <div className="text-sm text-gray-700 mt-2">
                  <Clock className="w-4 h-4 inline text-indigo-500 mr-1" />
                  Available: {doc.available.join(", ")}
                </div>
                <div className="flex flex-col gap-3 mt-4">
                  <button className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-2 rounded-lg font-medium shadow hover:scale-[1.02] transition">
                    <Video className="w-4 h-4" /> Video Consult
                  </button>
                  <a
                    href={doc.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-2 rounded-lg font-medium shadow hover:scale-[1.02] transition"
                  >
                    <MessageSquare className="w-4 h-4" /> Chat on WhatsApp
                  </a>
                  <a
                    href={`tel:${doc.phone}`}
                    className="flex items-center justify-center gap-2 w-full bg-red-500 text-white py-2 rounded-lg font-medium shadow hover:scale-[1.02] transition"
                  >
                    <Phone className="w-4 h-4" /> Call Now
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="flex justify-center mt-16"
      >
        <a
          href="tel:108"
          className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <Phone className="w-5 h-5" />
          Call Ambulance (108)
        </a>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mt-12 mx-4 sm:mx-10 lg:mx-20 flex items-start gap-4 bg-gradient-to-r from-amber-50 to-yellow-100 border border-yellow-200 rounded-2xl shadow-lg p-6"
      >
        <Info className="w-7 h-7 text-yellow-600 shrink-0" />
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
          <span className="font-semibold">Disclaimer:</span> Online consultation
          provides medical guidance only and cannot replace in-person diagnosis. 
          For emergencies, call 108 or rush to the nearest hospital.
        </p>
      </motion.div>

      <div className="h-10 sm:h-16" />
    </div>
  );
}
