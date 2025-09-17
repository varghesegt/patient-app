// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css"; // Make sure this path exists

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found. Make sure your index.html has a div with id='root'");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
