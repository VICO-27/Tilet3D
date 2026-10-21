import React from 'react';
import { motion } from 'framer-motion';
import type { Gender } from '../../avatar/types/avatar.types';

interface HeroBrandAnimationProps {
  gender?: Gender;
}

export const HeroBrandAnimation: React.FC<HeroBrandAnimationProps> = ({ gender = 'female' }) => {
  return (
    <div className="relative w-full h-full max-w-[540px] max-h-[580px] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      <style>{`
        /* Continuous Shimmer across brand letters */
        @keyframes brandShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* 3D Loom Ring Rotation */
        @keyframes spinRingSlow {
          0% { transform: rotate3d(1, 1, 0, 0deg); }
          100% { transform: rotate3d(1, 1, 0, 360deg); }
        }

        @keyframes spinRingReverse {
          0% { transform: rotate3d(1, -1, 0, 360deg); }
          100% { transform: rotate3d(1, -1, 0, 0deg); }
        }

        /* Ambient Breathing Pulse */
        @keyframes ambientAuraPulse {
          0%, 100% { transform: scale(0.92); opacity: 0.35; filter: blur(50px); }
          50% { transform: scale(1.1); opacity: 0.65; filter: blur(65px); }
        }

        /* Geometric Diamond Weave Pulse */
        @keyframes tiletLatticePulse {
          0%, 100% { transform: scale(0.95) rotate(0deg); opacity: 0.4; }
          50% { transform: scale(1.05) rotate(180deg); opacity: 0.8; }
        }

        /* Thread Equalizer Wave */
        @keyframes threadWave {
          0%, 100% { height: 4px; opacity: 0.4; }
          50% { height: 18px; opacity: 1; }
        }

        .animate-brand-shimmer {
          background: linear-gradient(
            90deg,
            #1e1b4b 0%,
            #7c3aed 25%,
            #f59e0b 50%,
            #7c3aed 75%,
            #1e1b4b 100%
          );
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: brandShimmer 4s linear infinite;
        }

        .animate-aura-pulse {
          animation: ambientAuraPulse 5s ease-in-out infinite;
        }

        .animate-tilet-lattice {
          animation: tiletLatticePulse 20s linear infinite;
        }

        .ring-spin-1 {
          animation: spinRingSlow 14s linear infinite;
          transform-style: preserve-3d;
        }

        .ring-spin-2 {
          animation: spinRingReverse 18s linear infinite;
          transform-style: preserve-3d;
        }
      `}</style>

      {/* ─── 1. ATMOSPHERIC AURA & BACKLIGHT ─── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div className="w-72 h-72 sm:w-88 sm:h-88 rounded-full bg-gradient-to-tr from-purple-400/30 via-plum-500/25 to-amber-300/35 animate-aura-pulse" />
      </div>

      {/* ─── 2. HOLOGRAPHIC 3D TILET LOOM (GEOMETRIC WEAVE) ─── */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
        
        {/* Outer 3D Gyroscopic Thread Ring 1 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none ring-spin-1">
          <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-plum-400/30 border-dashed shadow-[0_0_25px_rgba(168,85,247,0.15)]" />
        </div>

        {/* Outer 3D Gyroscopic Thread Ring 2 (Counter-Rotating) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none ring-spin-2">
          <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-amber-400/25 shadow-[0_0_20px_rgba(245,158,11,0.15)]" />
        </div>

        {/* Sacred Ethiopian Tilet Geometric Weave SVG */}
        <svg
          viewBox="0 0 200 200"
          className="w-48 h-48 sm:w-60 sm:h-60 animate-tilet-lattice opacity-75 pointer-events-none"
        >
          <defs>
            <linearGradient id="tiletGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="tiletPurple" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Central Ethiopian Diamond Motif (የጥለት መስቀል) */}
          <polygon
            points="100,20 180,100 100,180 20,100"
            fill="none"
            stroke="url(#tiletGold)"
            strokeWidth="1.2"
            strokeDasharray="4 2"
          />
          <polygon
            points="100,40 160,100 100,160 40,100"
            fill="none"
            stroke="url(#tiletPurple)"
            strokeWidth="1"
          />
          <polygon
            points="100,60 140,100 100,140 60,100"
            fill="none"
            stroke="url(#tiletGold)"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />

          {/* 4 Radial Weave Points */}
          <circle cx="100" cy="20" r="3.5" fill="#f59e0b" className="animate-ping opacity-60" />
          <circle cx="180" cy="100" r="3.5" fill="#c084fc" className="animate-ping opacity-60" />
          <circle cx="100" cy="180" r="3.5" fill="#f59e0b" className="animate-ping opacity-60" />
          <circle cx="20" cy="100" r="3.5" fill="#c084fc" className="animate-ping opacity-60" />

          {/* Corner Cross Details */}
          <path d="M 100 35 L 100 165 M 35 100 L 165 100" stroke="url(#tiletGold)" strokeWidth="0.5" strokeOpacity="0.4" />
        </svg>

        {/* ─── 3. CENTRAL FLOATING LUXURY BRAND EMBLEM ─── */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute z-10 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_rgba(124,58,237,0.12)]"
        >
          {/* Authentic Ge'ez Heritage Calligraphy Watermark */}
          <span 
            className="text-xs sm:text-sm font-serif font-light text-amber-700/80 tracking-[0.35em] uppercase mb-1"
            style={{ fontFamily: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif" }}
          >
            ጥለት
          </span>

          {/* Core Brand Title with Iridescent Shimmer */}
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[0.18em] leading-none animate-brand-shimmer">
              TILET
            </h2>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-gradient-to-r from-plum-600 to-plum-800 text-white font-mono font-bold text-xs sm:text-sm shadow-md shadow-plum-600/30">
              3D
            </span>
          </div>

          {/* Editorial Atelier Tagline */}
          <p className="mt-2.5 text-[8.5px] sm:text-[10px] font-mono uppercase tracking-[0.35em] text-stone-500 font-medium">
            Virtual Atelier • Couture
          </p>

          {/* Active Model Indicator */}
          <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-plum-50/80 border border-plum-100 text-[10px] font-medium text-plum-900">
            <span className="w-1.5 h-1.5 rounded-full bg-plum-600 animate-pulse" />
            <span className="capitalize">
              Weaving {gender} Avatar
            </span>
          </div>

          {/* Digital Thread Equalizer Bars */}
          <div className="mt-3.5 flex items-center gap-1.5 h-5">
            {[0.1, 0.4, 0.2, 0.6, 0.3, 0.5, 0.2].map((delay, idx) => (
              <span
                key={idx}
                className="w-1 rounded-full bg-gradient-to-t from-plum-600 to-amber-400"
                style={{
                  animation: `threadWave 1.2s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Floating Micro-Badges at Bottom */}
      <div className="mt-6 flex items-center gap-3 text-[10px] font-mono text-stone-400 uppercase tracking-widest">
        <span>Handcrafted Heritage</span>
        <span className="w-1 h-1 rounded-full bg-stone-300" />
        <span>3D Dimension</span>
      </div>
    </div>
  );
};

export default HeroBrandAnimation;
