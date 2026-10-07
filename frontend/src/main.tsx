import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "@/styles/globals.css";
import { useAuthStore } from "./app/store/useAuthStore";

import "./i18n"; // Add this line!






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