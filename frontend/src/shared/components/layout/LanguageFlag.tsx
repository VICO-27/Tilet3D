import React from "react";

export const EthiopiaFlag: React.FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg viewBox="0 0 24 16" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Ethiopian flag">
    <rect width="24" height="5.33" fill="#009A44" />
    <rect y="5.33" width="24" height="5.34" fill="#FED100" />
    <rect y="10.67" width="24" height="5.33" fill="#EF3340" />
    <circle cx="12" cy="8" r="3.2" fill="#0F47AF" />
    <polygon
      points="12,5.6 12.8,7.4 14.8,7.4 13.2,8.6 13.8,10.4 12,9.3 10.2,10.4 10.8,8.6 9.2,7.4 11.2,7.4"
      fill="#FED100"
    />
    <line x1="12" y1="5.6" x2="12" y2="4.6" stroke="#FED100" strokeWidth="0.5" strokeLinecap="round" />
    <line x1="14.8" y1="7.4" x2="15.8" y2="7.0" stroke="#FED100" strokeWidth="0.5" strokeLinecap="round" />
    <line x1="13.8" y1="10.4" x2="14.5" y2="11.2" stroke="#FED100" strokeWidth="0.5" strokeLinecap="round" />
    <line x1="10.2" y1="10.4" x2="9.5" y2="11.2" stroke="#FED100" strokeWidth="0.5" strokeLinecap="round" />
    <line x1="9.2" y1="7.4" x2="8.2" y2="7.0" stroke="#FED100" strokeWidth="0.5" strokeLinecap="round" />
  </svg>
);

export const ArabicFlag: React.FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg viewBox="0 0 24 16" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Arabic flag">
    <rect width="24" height="16" fill="#006C35" />
    {/* Stylized Arabic calligraphy representation */}
    <path
      d="M5 6.2h14M6.5 5.0h11M5.8 7.5h12.4"
      stroke="#FFFFFF"
      strokeWidth="0.7"
      strokeLinecap="round"
      strokeDasharray="1.2 0.8"
    />
    {/* Arab sword motif */}
    <path d="M5.5 10.2h12M17.5 10.2l-1.2-1M5.5 10.2l-.7 1.1M7 9.2v2" stroke="#FFFFFF" strokeWidth="0.75" strokeLinecap="round" />
  </svg>
);

export const UkFlag: React.FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg viewBox="0 0 24 16" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="English flag">
    <rect width="24" height="16" fill="#012169" />
    <path d="M0 0l24 16M24 0L0 16" stroke="#FFFFFF" strokeWidth="2.8" />
    <path d="M0 0l24 16M24 0L0 16" stroke="#C8102E" strokeWidth="1.6" />
    <path d="M12 0v16M0 8h24" stroke="#FFFFFF" strokeWidth="4.8" />
    <path d="M12 0v16M0 8h24" stroke="#C8102E" strokeWidth="2.8" />
  </svg>
);

export const FranceFlag: React.FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg viewBox="0 0 24 16" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="French flag">
    <rect width="8" height="16" fill="#002654" />
    <rect x="8" width="8" height="16" fill="#FFFFFF" />
    <rect x="16" width="8" height="16" fill="#CE1126" />
  </svg>
);

export const SwahiliFlag: React.FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg viewBox="0 0 24 16" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Swahili flag">
    <rect width="24" height="4.8" fill="#000000" />
    <rect y="4.8" width="24" height="6.4" fill="#BB0000" />
    <rect y="11.2" width="24" height="4.8" fill="#006600" />
    <line y1="4.8" x2="24" y2="4.8" stroke="#FFFFFF" strokeWidth="0.8" />
    <line y1="11.2" x2="24" y2="11.2" stroke="#FFFFFF" strokeWidth="0.8" />
    <ellipse cx="12" cy="8" rx="2.2" ry="3.8" fill="#880000" stroke="#FFFFFF" strokeWidth="0.4" />
    <circle cx="12" cy="8" r="0.8" fill="#FFFFFF" />
  </svg>
);

export const LanguageFlag: React.FC<{ code: string; className?: string }> = ({
  code,
  className = "w-4 h-3",
}) => {
  const baseClasses = `${className} shrink-0 inline-block rounded-[2px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.15)] ring-1 ring-black/10`;

  switch (code) {
    case "om":
    case "am":
    case "ti":
      return <EthiopiaFlag className={baseClasses} />;
    case "ar":
      return <ArabicFlag className={baseClasses} />;
    case "en":
      return <UkFlag className={baseClasses} />;
    case "fr":
      return <FranceFlag className={baseClasses} />;
    case "sw":
      return <SwahiliFlag className={baseClasses} />;
    default:
      return <EthiopiaFlag className={baseClasses} />;
  }
};

export default LanguageFlag;
