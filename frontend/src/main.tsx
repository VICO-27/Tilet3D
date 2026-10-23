import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "@/styles/globals.css";
import { useAuthStore } from "./app/store/useAuthStore";

import "./i18n"; // Add this line!

// Suppress benign THREE.Clock deprecation warning internally emitted by @react-three/fiber v9
const _origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("THREE.Clock: This module has been deprecated")) {
    return;
  }
  _origWarn.apply(console, args);
};






// ==========================================================
// AUTH INITIALIZER
// ==========================================================
// eslint-disable-next-line react-refresh/only-export-components
const AppInitializer = () => {
  const initialize = useAuthStore(
    (state) => state.initialize
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <App />;
};


ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppInitializer />
    </BrowserRouter>
  </React.StrictMode>
);