// src/App.jsx
import React, { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./context/LanguageContext"; // Ensure correct path
import Navbar from "./components/layout/Navbar";
import AppRouter from "./router/AppRouter";
import VoiceNavigator from "./features/voice/VoiceNavigator"; // 👂 Voice Assistant for Blind Users

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          {/* =========================
              Global Layout Wrapper
          ========================= */}
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">

            {/* =========================
                Global Navbar
            ========================= */}
            <Navbar />

            {/* =========================
                Main App Content
            ========================= */}
            <main className="flex-1">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full py-20 text-sky-600 font-semibold animate-pulse">
                    Loading...
                  </div>
                }
              >
                <AppRouter />
              </Suspense>
            </main>

            {/* =========================
                Global Voice Navigator
                - Always active for accessibility
                - Voice-only support for blind users
            ========================= */}
            <VoiceNavigator />
          </div>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
