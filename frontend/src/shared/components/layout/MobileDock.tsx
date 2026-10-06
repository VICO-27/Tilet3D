import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Shirt, Sparkles, ShoppingBag, Package, MessageSquare } from 'lucide-react';
import { useCartStore } from '../../../app/store/useCartStore';
import { useTranslation } from 'react-i18next';

interface MobileDockProps {
  onOpenCart: () => void;
}

export const MobileDock: React.FC<MobileDockProps> = ({ onOpenCart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const itemCount = useCartStore((state) => state.cartItems?.reduce((total, item) => total + item.quantity, 0) || 0);

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

  const navItems = [
    { name: t("nav.collection", "Collection"), path: '/products', icon: Shirt, isAction: false },
    { name: t("nav.avatar", "Avatar"), path: '/avatar', icon: Sparkles, isAction: false },
    { name: t("nav.bag", "Bag"), path: '#', icon: ShoppingBag, isAction: true, action: () => { setIsOpen(false); onOpenCart(); } },
    { name: t("nav.orders", "Orders"), path: '/orders', icon: Package, isAction: false },
    { name: t("nav.chat", "Chat"), path: '/ai-concierge', icon: MessageSquare, isAction: false },
  ];

  return (
    <div className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-[100] flex items-center h-[200px] pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 pointer-events-auto"
          />
        )}
      </AnimatePresence>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.x < -20 || velocity.x < -100) setIsOpen(true);
          else if (offset.x > 20 || velocity.x > 100) setIsOpen(false);
        }}
        className="relative z-50 flex items-center justify-end w-[80px] pointer-events-auto"
      >
        {/* Handle */}
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={() => setIsOpen(true)}
              aria-label="Open Navigation"
              className="absolute right-0 w-[44px] h-[80px] flex justify-end items-center touch-pan-y group"
            >
              <div className="w-[14px] h-[52px] bg-plum-600/90 backdrop-blur-xl border border-plum-400/30 shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-l-xl transition-all duration-300 group-hover:bg-plum-500 group-hover:scale-x-110 group-active:scale-x-95 flex items-center justify-center">
                <div className="w-[3px] h-4 bg-white/40 rounded-full" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Tray */}
        <AnimatePresence>
          {isOpen && (
            <motion.nav
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              aria-label="Mobile Navigation"
              className="mr-1.5 w-[64px] py-4 bg-white/85 dark:bg-neutral-900/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.12)] rounded-3xl flex flex-col items-center gap-5 touch-pan-y"
            >
              {navItems.map((item) => {
                const isActive = !item.isAction && location.pathname === item.path;
                const Icon = item.icon;

                const content = (
                  <>
                    <Icon className={`w-[22px] h-[22px] transition-colors duration-300 ${isActive ? 'text-white dark:text-neutral-900' : 'text-zinc-600 dark:text-zinc-300'}`} strokeWidth={isActive ? 2.5 : 2} />
                    {item.name === t("nav.bag", "Bag") && itemCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-plum-600 px-1 text-[10px] font-bold text-white shadow-sm border-2 border-white">
                        {itemCount}
                      </span>
                    )}
                  </>
                );

                const btnClass = `relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-90 ${
                  isActive ? 'bg-zinc-900 dark:bg-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/10'
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
      </motion.div>
    </div>
  );
};
