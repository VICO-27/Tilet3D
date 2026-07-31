import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Building2, Check, Clock, Loader2, ArrowRight } from 'lucide-react';

interface PremiumPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

const PremiumPlanModal: React.FC<PremiumPlanModalProps> = ({ isOpen, onClose, productName }) => {
  const [loadingGateway, setLoadingGateway] = useState<string | null>(null);
  const [comingSoonBadge, setComingSoonBadge] = useState<string | null>(null);

  // Lock the background from scrolling when the modal is open!
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayment = (gateway: string) => {
    if (gateway === 'Chapa' || gateway === 'Telebirr') {
      setLoadingGateway(gateway);
      setTimeout(() => {
        setLoadingGateway(null);
        alert(`Redirecting to ${gateway} Payment Gateway...`);
      }, 1200);
    } else {
      setComingSoonBadge(gateway);
      setTimeout(() => setComingSoonBadge(null), 2500);
    }
  };

  // We use createPortal to break out of the GSAP slider transform trap!
  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 select-none"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      {/* Dark Blurred Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl transition-opacity" />

      {/* Modal Content - Wide Responsive Container */}
      <div 
        className="relative w-full max-w-[760px] bg-neutral-950 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-fade-in flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Purple Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-plum-600/20 blur-[100px] rounded-full pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2.5 rounded-full z-50 border border-white/5"
        >
          <X size={18} />
        </button>

        {/* ================= LEFT COLUMN: ATELIER DETAILS ================= */}
        <div className="w-full md:w-1/2 p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-plum-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-serif text-white tracking-wide">Atelier Premium</h2>
                <p className="text-[10px] font-mono tracking-widest text-plum-400 uppercase">Virtual Fitting Room</p>
              </div>
            </div>

            <p className="text-sm text-neutral-400 font-light leading-relaxed mb-6">
              Unlock our high-fidelity 3D physics engine to test the <span className="text-white font-medium">{productName}</span> on your personalized avatar.
            </p>
            
            <ul className="space-y-3.5 mb-8">
              {[
                "True-to-life fabric drape physics",
                "Custom body measurement scaling",
                "360° interactive lighting environments"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-neutral-300">
                  <div className="w-5 h-5 rounded-full bg-plum-500/10 flex items-center justify-center flex-shrink-0 border border-plum-500/20">
                    <Check size={12} className="text-plum-400" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-light text-white">450</span>
              <span className="text-sm font-bold text-neutral-500 tracking-widest uppercase">ETB</span>
            </div>
            <span className="text-xs text-neutral-500 mt-1 block">One-time payment per garment simulation</span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: OFFICIAL PAYMENT GATEWAYS ================= */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center relative">
          
          <p className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase mb-6 text-center md:text-left">
            Select Payment Gateway
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            
            {/* OFFICIAL TELEBIRR BUTTON */}
            <button 
              onClick={() => handlePayment('Telebirr')}
              disabled={!!loadingGateway}
              className="flex items-center justify-between py-4 px-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-[#00AEEF]/10 hover:border-[#00AEEF]/30 transition-all group w-full text-left relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                  {/* REAL TELEBIRR LOGO FROM WEB */}
                  <img src="https://pbs.twimg.com/profile_images/1392067727189196803/kG_kLqUj_400x400.jpg" alt="Telebirr" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-200 group-hover:text-[#00AEEF] transition-colors">telebirr</span>
                  <span className="text-[10px] text-neutral-500">Ethio Telecom Mobile Money</span>
                </div>
              </div>
              {loadingGateway === 'Telebirr' ? (
                <Loader2 size={18} className="animate-spin text-[#00AEEF]" />
              ) : (
                <ArrowRight size={16} className="text-white/20 group-hover:text-[#00AEEF] group-hover:translate-x-1 transition-all" />
              )}
            </button>

            {/* OFFICIAL CHAPA BUTTON */}
            <button 
              onClick={() => handlePayment('Chapa')}
              disabled={!!loadingGateway}
              className="flex items-center justify-between py-4 px-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-[#82C341]/10 hover:border-[#82C341]/30 transition-all group w-full text-left relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                  {/* REAL CHAPA LOGO FROM WEB */}
                  <img src="https://avatars.githubusercontent.com/u/82544079?s=200&v=4" alt="Chapa" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-200 group-hover:text-[#82C341] transition-colors">Chapa</span>
                  <span className="text-[10px] text-neutral-500">Local Cards & Bank Transfer</span>
                </div>
              </div>
              {loadingGateway === 'Chapa' ? (
                <Loader2 size={18} className="animate-spin text-[#82C341]" />
              ) : (
                <ArrowRight size={16} className="text-white/20 group-hover:text-[#82C341] group-hover:translate-x-1 transition-all" />
              )}
            </button>

            {/* BANK TRANSFER */}
            <button 
              onClick={() => handlePayment('Bank Transfer')}
              className="flex items-center justify-between py-4 px-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all group w-full text-left relative"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                  <Building2 size={20} className="text-yellow-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-200 group-hover:text-yellow-500 transition-colors">Bank Transfer</span>
                  <span className="text-[10px] text-neutral-500">CBE, Dashen, Awash</span>
                </div>
              </div>
              
              {comingSoonBadge === 'Bank Transfer' ? (
                <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/20 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
                  <Clock size={10} /> Coming Soon
                </span>
              ) : (
                <span className="text-[9px] font-mono tracking-widest text-neutral-600 uppercase border border-neutral-800 px-2 py-0.5 rounded">
                  Soon
                </span>
              )}
            </button>

            {/* CARD PAYMENT */}
            <button 
              onClick={() => handlePayment('Card')}
              className="flex items-center justify-between py-4 px-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all group w-full text-left relative"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {/* MasterCard / Visa overlapping circles */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="12" r="6" fill="#EA001B" fillOpacity="0.9" />
                    <circle cx="15" cy="12" r="6" fill="#FFA200" fillOpacity="0.8" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-200 group-hover:text-rose-400 transition-colors">International Card</span>
                  <span className="text-[10px] text-neutral-500">Visa & Mastercard</span>
                </div>
              </div>

              {comingSoonBadge === 'Card' ? (
                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
                  <Clock size={10} /> Coming Soon
                </span>
              ) : (
                <span className="text-[9px] font-mono tracking-widest text-neutral-600 uppercase border border-neutral-800 px-2 py-0.5 rounded">
                  Soon
                </span>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PremiumPlanModal;