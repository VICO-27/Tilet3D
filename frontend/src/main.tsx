import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { useGLTF } from "@react-three/drei";

import App from "./App";
import "@/styles/globals.css";

// --- 3D ASSET PRE-WARMING ---
// We trigger the download immediately at the entry point to beat the 5s lag.
const DRACO_URL = "https://www.gstatic.com/draco/versioned/decoders/1.5.5/gltf/";
useGLTF.preload("/models/femaleAvatar.glb", DRACO_URL);
useGLTF.preload("/models/maleAvatar.glb", DRACO_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);