import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Shirt, Sparkles, ShoppingBag, Package, MessageSquare } from 'lucide-react';
import { useCartStore } from '../../../app/store/useCartStore';
import { useAssistantStore } from '../../../features/ai/store/useAssistantStore';
import { useTranslation } from 'react-i18next';

interface MobileDockProps {
  onOpenCart: () => void;
}

export const MobileDock: React.FC<MobileDockProps> = ({ onOpenCart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const itemCount = useCartStore((state) => state.cartItems?.reduce((total, item) => total + item.quantity, 0) || 0);
  const { toggleAssistant } = useAssistantStore();
  const dockRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [location.pathname]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click/touch outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('touchstart', handleOutsideClick, { passive: true });
      document.addEventListener('mousedown', handleOutsideClick);
    }, 40);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const navItems = [
    { name: t("nav.collection", "Collection"), path: '/products', icon: Shirt, isAction: false },
    { name: t("nav.avatar", "Avatar"), path: '/avatar', icon: Sparkles, isAction: false },
    { name: t("nav.bag", "Bag"), path: '#', icon: ShoppingBag, isAction: true, action: () => { setIsOpen(false); onOpenCart(); } },
    { name: t("nav.orders", "Orders"), path: '/orders', icon: Package, isAction: false },
    { name: t("nav.chat", "Chat"), path: '#', icon: MessageSquare, isAction: true, action: () => { setIsOpen(false); toggleAssistant(); } },
  ];

  return (
    <>
      {/* Fullscreen Backdrop: Clicking anywhere outside closes the dock */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            onTouchStart={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 z-[95] bg-black/30 backdrop-blur-[2px] pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* Dock Container: Fixed in place, stays rock-still on scroll without moving up or down */}
      <div 
        ref={dockRef}
        className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-[100] flex items-center pointer-events-none select-none"
      >
        <div className="relative flex items-center justify-end w-[80px] pointer-events-auto">
          {/* Handle when closed */}
          <AnimatePresence>
            {!isOpen && (
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                onClick={() => setIsOpen(true)}
                aria-label="Open Navigation"
                className="absolute right-0 w-[44px] h-[80px] flex justify-end items-center group cursor-pointer focus:outline-none"
              >
                <div className="w-[14px] h-[52px] bg-plum-600/90 backdrop-blur-xl border border-plum-400/30 shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-l-xl transition-all duration-300 group-hover:bg-plum-500 group-hover:scale-x-110 group-active:scale-x-95 flex items-center justify-center">
                  <div className="w-[3px] h-4 bg-white/50 rounded-full" />
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Tray when open */}
          <AnimatePresence>
            {isOpen && (
              <motion.nav
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                aria-label="Mobile Navigation"
                className="mr-1.5 w-[68px] py-3.5 bg-white/90 backdrop-blur-xl border border-black/5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] rounded-2xl flex flex-col items-center gap-2.5"
              >
                {navItems.map((item) => {
                  const isActive = !item.isAction && location.pathname === item.path;
                  const Icon = item.icon;

                  const content = (
                    <div className="flex flex-col items-center justify-center gap-1 w-full">
                      <div className="relative flex items-center justify-center">
                        <Icon 
                          className={`w-[20px] h-[20px] transition-colors duration-300 drop-shadow-xs ${
                            isActive ? 'text-plum-700' : 'text-zinc-700 group-hover:text-plum-700'
                          }`} 
                          strokeWidth={isActive ? 2.4 : 2} 
                        />
                        {item.name === t("nav.bag", "Bag") && itemCount > 0 && (
                          <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-plum-600 px-1 text-[9px] font-bold text-white shadow-xs border border-white">
                            {itemCount}
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] font-medium tracking-tight text-center leading-none ${
                        isActive ? 'text-plum-700 font-bold' : 'text-zinc-600 group-hover:text-plum-700'
                      }`}>
                        {item.name}
                      </span>
                    </div>
                  );

                  const btnClass = `group relative flex items-center justify-center w-[58px] py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
                    isActive ? 'bg-plum-100/80 shadow-xs' : 'hover:bg-zinc-100/80'
                  }`;

                  if (item.isAction) {
                    return (
                      <button
                        key={item.name}
                        onClick={item.action}
                        aria-label={item.name}
                        className={btnClass}
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      aria-label={item.name}
                      className={btnClass}
                    >
                      {content}
                    </Link>
                  );
                })}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};
