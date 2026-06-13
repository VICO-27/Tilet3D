import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Heart, MessageCircle, Bookmark, Share2, X, Send } from "lucide-react";
import {
  type CatalogProduct,
  PRODUCT_FALLBACK_IMG,
} from "../data/catalog";
import { useEngagementStore } from "../../../app/store/useEngagementStore";
import { useAuthStore } from "../../../app/store/useAuthStore";

interface Props {
  product: CatalogProduct;
  width: string; // tailwind width class — varied per position
  isVideo: boolean;
  onTryOn: (p: CatalogProduct) => void;
}

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.src !== PRODUCT_FALLBACK_IMG) img.src = PRODUCT_FALLBACK_IMG;
};

export const ProductCard: React.FC<Props> = ({
  product,
  width,
  isVideo,
  onTryOn,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const eng = useEngagementStore();
  const { user } = useAuthStore();
  const liked = eng.isLiked(product.id);
  const saved = eng.isSaved(product.id);
  const commentCount = eng.commentCount(product.id);
  const [vidFailed, setVidFailed] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Play videos only while in view (prevents many concurrent decoders).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()),
      { threshold: 0.2 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [isVideo, vidFailed]);

  const useVideo = isVideo && !!product.video && !vidFailed;

  return (
    <div
      className={`group relative ${width} h-[clamp(380px,46vw,520px)] shrink-0 select-none overflow-hidden bg-neutral-200`}
    >
      {/* Media */}
      {isVideo && !!product.video ? (
        <>
          {/* Poster image — always present so the card is never blank */}
          <img
            src={product.img}
            onError={onImgError}
            alt={product.name}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {useVideo && (
            <video
              ref={videoRef}
              src={product.video}
              loop
              muted
              playsInline
              preload="none"
              onError={() => setVidFailed(true)}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
            />
          )}
        </>
      ) : (
        <>
          <img
            src={product.img}
            onError={onImgError}
            alt={product.name}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out group-hover:opacity-0"
          />
          <img
            src={product.imgHover}
            onError={onImgError}
            alt=""
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full scale-[1.04] object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
          />
        </>
      )}

      {/* Hover scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Badge */}
      {product.badge && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-plum-700 backdrop-blur-sm">
          {product.badge}
        </span>
      )}

      {/* TikTok-style action rail */}
      <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2.5 opacity-0 transition-all duration-500 group-hover:opacity-100">
        <ActionButton label="Add to order" onClick={() => onTryOn(product)}>
          <Plus className="h-4 w-4" />
        </ActionButton>
        <ActionButton
          label="Like"
          active={liked}
          onClick={() => eng.toggleLike(product.id)}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
        </ActionButton>
        <ActionButton label="Comment" onClick={() => setShowComments(true)}>
          <MessageCircle className="h-4 w-4" />
          {commentCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-plum-600 px-1 text-[8px] font-bold text-white">
              {commentCount}
            </span>
          )}
        </ActionButton>
        <ActionButton
          label="Save"
          active={saved}
          onClick={() => eng.toggleSave(product.id)}
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-plum-600 text-plum-600" : ""}`} />
        </ActionButton>
        <ActionButton label="Share">
          <Share2 className="h-4 w-4" />
        </ActionButton>
      </div>

      {/* Bottom overlay — title/desc/price hidden until hover, slides up */}
      <div className="absolute inset-x-0 bottom-0 z-10 translate-y-6 p-5 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-plum-300">
          {product.brand}
        </p>
        <h3 className="display mt-1 text-lg font-semibold leading-tight text-white">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-1 text-[11px] text-white/60">
          {product.fabric}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-white">
            ETB {product.price.toLocaleString()}
          </span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onTryOn(product)}
            className="rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ink transition-colors hover:bg-plum-600 hover:text-white"
          >
            Try On Avatar
          </motion.button>
        </div>
      </div>

      <CommentsModal
        open={showComments}
        product={product}
        author={user?.name ?? "Guest"}
        onClose={() => setShowComments(false)}
        eng={eng}
      />
    </div>
  );
};

const ActionButton: React.FC<{
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ label, active, onClick, children }) => (
  <motion.button
    whileHover={{ scale: 1.12 }}
    whileTap={{ scale: 0.9 }}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    aria-label={label}
    title={label}
    className={`relative flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition-colors ${
      active
        ? "bg-white text-plum-600"
        : "bg-white/85 text-ink/70 hover:bg-white hover:text-plum-600"
    }`}
  >
    {children}
  </motion.button>
);

const CommentsModal: React.FC<{
  open: boolean;
  product: CatalogProduct;
  author: string;
  onClose: () => void;
  eng: ReturnType<typeof useEngagementStore>;
}> = ({ open, product, author, onClose, eng }) => {
  const [text, setText] = useState("");
  const comments = eng.getComments(product.id);

  const post = () => {
    if (!text.trim()) return;
    eng.addComment(product.id, author, text);
    setText("");
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Header with product */}
            <div className="flex items-center gap-3 border-b border-ink/[0.06] p-4">
              <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                <img src={product.img} onError={onImgError} alt={product.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-plum-500">
                  {product.brand}
                </p>
                <h4 className="truncate font-serif text-sm font-semibold text-ink">
                  {product.name}
                </h4>
                <p className="text-xs text-ink/50">{comments.length} comments</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 hover:bg-ink/[0.05]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-4">
              {comments.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink/40">
                  No comments yet — be the first to share your thoughts.
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plum-100 text-[11px] font-bold text-plum-700">
                        {c.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs">
                          <span className="font-semibold text-ink">{c.author}</span>{" "}
                          <span className="text-ink/40">· {c.date}</span>
                        </p>
                        <p className="mt-0.5 text-sm text-ink/75">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="flex items-center gap-2 border-t border-ink/[0.06] p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && post()}
                placeholder={`Comment as ${author}…`}
                className="flex-1 rounded-full border border-ink/10 bg-neutral-50 px-4 py-2.5 text-sm text-ink placeholder-ink/35 focus:border-plum-500 focus:bg-white focus:outline-none"
              />
              <button
                onClick={post}
                disabled={!text.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-plum-600 text-white transition-colors hover:bg-plum-500 disabled:bg-ink/10 disabled:text-ink/30"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
