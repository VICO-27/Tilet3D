import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Heart, MessageCircle, Bookmark, Share2, X, Send } from "lucide-react";
import { type CatalogProduct, PRODUCT_FALLBACK_IMG } from "../data/catalog";
import { useEngagementStore, type ProductComment } from "../../../app/store/useEngagementStore";
import { useAuthStore } from "../../../app/store/useAuthStore";

interface Props {
  product: CatalogProduct;
  width: string;
  isVideo: boolean;
  onTryOn: (p: CatalogProduct) => void;
}

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.src !== PRODUCT_FALLBACK_IMG) img.src = PRODUCT_FALLBACK_IMG;
};

export const ProductCard: React.FC<Props> = ({ product, width, isVideo, onTryOn }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toggleLike, addComment, trackShare } = useEngagementStore();
  const { isAuthenticated } = useAuthStore();

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [vidFailed, setVidFailed] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (v) {
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: 0.1 }
    );
    if (v) io.observe(v);
    return () => io.disconnect();
  }, []);

  const handleLike = async () => {
    if (!isAuthenticated) return alert("Please sign in to like products.");
    setIsLiked(!isLiked);
    await toggleLike(product.id);
  };

  const handleShare = () => {
    trackShare(product.id, "copy_link");
    navigator.clipboard.writeText(window.location.origin + `/products?q=${product.id}`);
    alert("Link copied to clipboard!");
  };

  return (
    <div className={`group relative ${width} h-[clamp(380px,46vw,520px)] shrink-0 select-none overflow-hidden bg-neutral-100 rounded-2xl`}>
      <div className="absolute inset-0 z-0">
        <img
          src={product.img}
          onError={onImgError}
          alt={product.name}
          className={`h-full w-full object-cover transition-opacity duration-700 ${isVideo && inView && !vidFailed ? 'opacity-0' : 'opacity-100'}`}
        />
        {isVideo && !vidFailed && (
          <video
            ref={videoRef}
            src={inView ? product.video : ""}
            loop
            muted
            playsInline
            onError={() => setVidFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
          />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3 opacity-0 transition-all duration-500 group-hover:opacity-100">
        <ActionButton label="Try on Avatar" onClick={() => onTryOn(product)}>
          <Plus className="h-4 w-4" />
        </ActionButton>
        
        <ActionButton label="Like" active={isLiked} onClick={handleLike}>
          <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
        </ActionButton>

        <ActionButton label="Comments" onClick={() => setShowComments(true)}>
          <MessageCircle className="h-4 w-4" />
        </ActionButton>

        <ActionButton label="Save" active={isSaved} onClick={() => setIsSaved(!isSaved)}>
          <Bookmark className={`h-4 w-4 ${isSaved ? "fill-plum-600 text-plum-600" : ""}`} />
        </ActionButton>

        <ActionButton label="Share" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </ActionButton>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 p-5 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-plum-400">{product.brand}</p>
        <h3 className="text-lg font-semibold text-white leading-tight mt-1">{product.name}</h3>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-bold text-white">ETB {product.price.toLocaleString()}</span>
          <button 
            onClick={() => onTryOn(product)}
            className="rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-plum-600 hover:text-white transition-colors"
          >
            Try On
          </button>
        </div>
      </div>

      <CommentsModal
        open={showComments}
        product={product}
        onClose={() => setShowComments(false)}
        addComment={addComment}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
};

const ActionButton: React.FC<{ label: string; active?: boolean; onClick: () => void; children: React.ReactNode }> = ({ label, active, onClick, children }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    aria-label={label}
    title={label}
    className={`flex h-10 w-10 items-center justify-center rounded-full shadow-xl backdrop-blur-md transition-colors ${active ? "bg-white text-plum-600" : "bg-white/90 text-black/70 hover:bg-white"}`}
  >
    {children}
  </motion.button>
);

const CommentsModal: React.FC<{
  open: boolean;
  product: CatalogProduct;
  onClose: () => void;
  addComment: (id: string, text: string) => Promise<ProductComment | null>;
  isAuthenticated: boolean;
}> = ({ open, product, onClose, addComment, isAuthenticated }) => {
  const [text, setText] = useState("");
  const [localComments, setLocalComments] = useState<ProductComment[]>([]);

  const handlePost = async () => {
    if (!text.trim() || !isAuthenticated) return;
    const newComment = await addComment(product.id, text);
    if (newComment) {
      setLocalComments([newComment, ...localComments]);
      setText("");
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-[500px] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white"
          >
            <div className="flex items-center justify-between border-b p-4">
              <h4 className="font-bold text-ink">Comments</h4>
              <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {localComments.length === 0 && <p className="text-center text-neutral-400 mt-10 text-sm">No comments yet.</p>}
              {localComments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-plum-100 flex items-center justify-center text-[10px] font-bold text-plum-700">
                    {c.user.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{c.user}</p>
                    <p className="text-sm text-neutral-600">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex gap-2">
              <input
                disabled={!isAuthenticated}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isAuthenticated ? "Add a comment..." : "Sign in to comment"}
                className="flex-1 rounded-full bg-neutral-100 px-4 py-2 text-sm outline-none focus:ring-1 ring-plum-500"
              />
              <button
                onClick={handlePost}
                disabled={!text.trim() || !isAuthenticated}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-plum-600 text-white disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};