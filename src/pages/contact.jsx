import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, Info } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can integrate email sending or API call
    setSubmitted(true);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-sky-50 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center px-6 pt-16 sm:pt-24"
      >
        <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
          Get in Touch
        </h1>
        <p className="mt-5 text-gray-700 max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed">
          Have questions or need support? Reach out to our team and we will respond promptly.
        </p>
      </motion.div>

      {/* Contact Info Cards */}
      <div className="max-w-6xl mx-auto mt-16 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            icon: <Phone className="w-6 h-6 text-indigo-600" />,
            title: "Call Us",
            info: "+91 1234 567 890",
            link: "tel:+911234567890",
            bg: "bg-white/70",
          },
          {
            icon: <Mail className="w-6 h-6 text-red-500" />,
            title: "Email",
            info: "support@healthapp.com",
            link: "mailto:support@healthapp.com",
            bg: "bg-white/70",
          },
          {
            icon: <MapPin className="w-6 h-6 text-green-500" />,
            title: "Visit Us",
            info: "123 Health St, Bengaluru, India",
            link: "https://goo.gl/maps/example",
            bg: "bg-white/70",
          },
        ].map((card, i) => (
          <motion.a
            key={i}
            href={card.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl ${card.bg} backdrop-blur-lg border border-gray-200 shadow-lg hover:scale-105 transition-transform`}
          >
            {card.icon}
            <h4 className="mt-3 font-semibold text-indigo-700">{card.title}</h4>
            <p className="mt-1 text-gray-700 text-center">{card.info}</p>
          </motion.a>
        ))}
      </div>

      {/* Contact Form + Map */}
      <div className="max-w-7xl mx-auto mt-20 px-4 flex flex-col lg:flex-row gap-10">
        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex-1 bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-8 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-indigo-700 mb-6">Send a Message</h2>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Your Email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Your Message"
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            ></textarea>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 rounded-xl font-medium shadow hover:scale-[1.02] transition"
            >
              <Send className="w-5 h-5" /> Send Message
            </button>
          </div>
          {submitted && (
            <p className="mt-4 text-green-600 font-medium text-center">
              Thank you! Your message has been sent.
            </p>
          )}
        </motion.form>
      </div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-16 mx-4 sm:mx-10 lg:mx-20 flex items-start gap-4 bg-gradient-to-r from-amber-50 to-yellow-100 border border-yellow-200 rounded-2xl shadow-lg p-6"
      >
        <Info className="w-7 h-7 text-yellow-600 shrink-0" />
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
          <span className="font-semibold">Disclaimer:</span> Contact form submissions are for queries and support only. 
          In case of emergencies, call 108 or visit the nearest hospital.
        </p>
      </motion.div>

      <div className="h-16"></div>
    </div>
  );
}
