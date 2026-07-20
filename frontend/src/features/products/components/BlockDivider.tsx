import React from 'react';
import RevealOnScroll from '@/shared/components/RevealOnScroll';

interface BlockDividerProps {
  title?: string;
  subtitle?: string;
  watermark?: string;
  variant?: 'light' | 'dark' | 'plum';
  align?: 'left' | 'right';
}

const BlockDivider: React.FC<BlockDividerProps> = ({ 
  title = "Heritage couture woven", 
  subtitle = "Experience the heart of Ethiopian craftsmanship.",
  watermark = "TILET",
  variant = 'light',
  align = 'left'
}) => {
  
  // Smart Color Theme Matrix for alternating background variations
  const themes = {
    light: {
      bg: 'bg-[#fcfcfc]',
      eyebrow: 'text-plum-600',
      title: 'text-zinc-900',
      lastWord: 'text-plum-600 italic',
      sub: 'text-zinc-500',
      watermarkClass: 'text-zinc-200/40' // Soft grey watermark on light background
    },
    dark: {
      bg: 'bg-[#0b0b0c]', // Sleek pitch black/ink background like screenshot
      eyebrow: 'text-plum-400',
      title: 'text-white',
      lastWord: 'text-plum-400 italic',
      sub: 'text-zinc-400',
      watermarkClass: 'text-zinc-900/30' // Subtle dark watermark behind text
    },
    plum: {
      bg: 'bg-[#1a0a1a]', // Luxury ultra dark brand purple
      eyebrow: 'text-purple-300',
      title: 'text-purple-50',
      lastWord: 'text-purple-300 italic',
      sub: 'text-purple-200/60',
      watermarkClass: 'text-purple-950/40' // Rich tone-on-tone purple watermark
    }
  };

  const currentTheme = themes[variant];

  return (
    <section className={`${currentTheme.bg} min-h-[280px] py-14 md:py-16 px-8 md:px-16 flex items-center relative overflow-hidden border-y border-black/5 select-none transition-colors duration-500`}>
      
      {/* GIANT BACKGROUND WATERMARK TEXT */}
      <div 
        className={`absolute inset-0 flex items-center pointer-events-none font-bold text-[15vw] md:text-[18vw] tracking-tighter leading-none select-none z-0 ${currentTheme.watermarkClass} ${
          align === 'left' ? 'justify-start -left-4 md:left-8' : 'justify-end -right-4 md:right-8'
        }`}
        style={{
          fontFamily: "'Iowan Old Style','Palatino Linotype',serif",
        }}
      >
        {watermark}
      </div>

      {/* FOREGROUND STORY CONTENT CONTAINER */}
      <div className={`w-full max-w-7xl mx-auto z-10 flex ${align === 'left' ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-2xl space-y-3 ${align === 'left' ? 'text-left' : 'text-right'}`}>

          <RevealOnScroll delayMs={0}>
            <span className={`${currentTheme.eyebrow} block text-[10px] uppercase tracking-[0.35em] font-bold`}>
              ✨ The Thread
            </span>
          </RevealOnScroll>

          <RevealOnScroll delayMs={80}>
            <h2 
              className={`${currentTheme.title} text-3xl md:text-[42px] leading-[1.1] font-bold tracking-tight`}
              style={{ fontFamily: "'Iowan Old Style','Palatino Linotype','Book Antiqua',serif" }}
            >
              {title.split(' ').map((word, i, arr) => (
                <span key={i}>
                  {i === arr.length - 1 ? (
                    <span className={currentTheme.lastWord}>{word}</span>
                  ) : (
                    word + ' '
                  )}
                </span>
              ))}
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delayMs={160}>
            <p className={`${currentTheme.sub} text-[14px] md:text-[15px] leading-relaxed max-w-xl ${align === 'right' ? 'ml-auto' : ''}`}>
              {subtitle}
            </p>
          </RevealOnScroll>

        </div>
      </div>
    </section>
  );
};

export default BlockDivider;