import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { useGLTF } from "@react-three/drei";

import App from "./App";
import "@/styles/globals.css";
import { useAuthStore } from "./app/store/useAuthStore";

// --- 3D ASSET PRE-WARMING ---
const DRACO_URL =
  "https://www.gstatic.com/draco/versioned/decoders/1.5.5/gltf/";

useGLTF.preload("/models/femaleAvatar.glb", DRACO_URL);
useGLTF.preload("/models/maleAvatar.glb", DRACO_URL);


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