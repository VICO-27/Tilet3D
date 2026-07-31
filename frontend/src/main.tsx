import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { useGLTF } from "@react-three/drei";

import App from "./App";
import "@/styles/globals.css";
import { useAuthStore } from "./app/store/useAuthStore";

import "./i18n"; // Add this line!


// --- 3D ASSET PRE-WARMING ---
// CRITICAL: import DRACO_URL from AvatarModel so all useGLTF calls share
// the exact same cache key — prevents loading the GLB twice.
import { DRACO_URL } from './features/avatar/components/AvatarModel';

useGLTF.preload('/models/femaleAvatar.glb', DRACO_URL);
useGLTF.preload('/models/maleAvatar.glb', DRACO_URL);



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