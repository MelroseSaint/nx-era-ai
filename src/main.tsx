import { createRoot } from "react-dom/client";
import React from "react"; // Import React
import App from "./App.tsx";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);