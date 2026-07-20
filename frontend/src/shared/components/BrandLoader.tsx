// frontend/src/shared/components/BrandLoader.tsx
import React from 'react';

const BRAND = "ጥለት3D";

const BrandLoader: React.FC = () => {
  const letters = BRAND.split('');

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white relative overflow-hidden select-none">
      <style>{`
        /* The Luxury Shimmer Breath */
        @keyframes luxuryReveal {
          0% {
            opacity: 0;
            filter: blur(12px);
            letter-spacing: -0.2em;
            transform: scale(0.97);
          }
          40% {
            opacity: 0.8;
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            filter: blur(0px);
            letter-spacing: 0.15em;
            transform: scale(1);
          }
        }

        /* Ambient structural studio light behind the brand text */
        @keyframes ambientStudioLight {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          50% { opacity: 0.4; filter: blur(80px); }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.15; filter: blur(120px); }
        }

        /* Subtle minimalist line drawing reveal */
        @keyframes threadStretch {
          0% { width: 0%; opacity: 0; }
          30% { opacity: 0.4; }
          100% { width: 40px; opacity: 0.1; }
        }

        /* Subtitle micro-fade */
        @keyframes subtitleIn {
          0% { opacity: 0; letter-spacing: 0.2em; transform: translateY(4px); }
          100% { opacity: 1; letter-spacing: 0.45em; transform: translateY(0); }
        }

        .animate-luxury-reveal {
          animation: luxuryReveal 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-studio-light {
          animation: ambientStudioLight 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-thread {
          animation: threadStretch 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-subtitle {
          animation: subtitleIn 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
        }
      `}</style>

      {/* AMBIENT LUXURY ILLUMINATION BACKGROUND */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-purple-300/30 via-transparent to-zinc-200/50 mix-blend-multiply pointer-events-none animate-studio-light" />

      {/* CORE IDENTITY FRAME */}
      <div className="flex flex-col items-center justify-center z-10 space-y-8">
        
        {/* BRAND IDENTITY */}
        <div 
          className="animate-luxury-reveal flex items-baseline font-light"
          style={{ 
            fontFamily: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
          }}
        >
          {letters.map((char, i) => (
            <span
              key={i}
              className="inline-block transition-all duration-1000 select-none text-5xl md:text-7xl"
              style={{
                fontWeight: i >= letters.length - 2 ? 600 : 300, // Light for Ge'ez typography, structured bold for 3D
                color: i >= letters.length - 2 ? '#a21caf' : '#09090b', // Deep Plum accent pairing with Rich Ink Black
                textShadow: i >= letters.length - 2 ? '0 0 40px rgba(162, 28, 175, 0.1)' : 'none'
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* ATELIER HORIZONTAL THREAD DIVISION */}
        <div className="h-[1px] bg-zinc-900 animate-thread" />

        {/* EDITORIAL SUBTEXT */}
        <span
          className="animate-subtitle opacity-0 text-[9px] md:text-[10px] uppercase font-medium text-zinc-400 select-none tracking-[0.45em]"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          The Digital Atelier
        </span>
      </div>

      {/* CORNER FRAME BORDERS TO SIMULATE A LUXURY FABRIC CUTTING CANVAS */}
      <div className="absolute top-12 left-12 w-4 h-[1px] bg-zinc-100" />
      <div className="absolute top-12 left-12 h-4 w-[1px] bg-zinc-100" />
      <div className="absolute top-12 right-12 w-4 h-[1px] bg-zinc-100" />
      <div className="absolute top-12 right-12 h-4 w-[1px] bg-zinc-100" />
      <div className="absolute bottom-12 left-12 w-4 h-[1px] bg-zinc-100" />
      <div className="absolute bottom-12 left-12 h-4 w-[1px] bg-zinc-100" />
      <div className="absolute bottom-12 right-12 w-4 h-[1px] bg-zinc-100" />
      <div className="absolute bottom-12 right-12 h-4 w-[1px] bg-zinc-100" />
    </div>
  );
};

export default BrandLoader;