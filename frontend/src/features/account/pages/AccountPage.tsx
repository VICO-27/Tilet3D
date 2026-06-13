import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  LogOut,
  Package,
  Ruler,
  Heart,
  Bookmark,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import Navbar from "../../../shared/components/layout/Navbar";
import { useAuthStore } from "../../../app/store/useAuthStore";
import { useEngagementStore } from "../../../app/store/useEngagementStore";
import { useAvatarStore } from "../../avatar/store/useAvatarStore";
import {
  PRODUCTS_BY_CATEGORY,
  toClothingVariants,
  type CatalogProduct,
} from "../../products/data/catalog";

const ALL_PRODUCTS = Object.values(PRODUCTS_BY_CATEGORY).flat();
const productById = (id: string) => ALL_PRODUCTS.find((p) => p.id === id);

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn, signOut } = useAuthStore();

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <AuthScreen onSignUp={signUp} onSignIn={signIn} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Dashboard user={user} onSignOut={signOut} onNavigate={navigate} />
    </div>
  );
};

/* ────────────────────────────── Auth screen ────────────────────────────── */

const AuthScreen: React.FC<{
  onSignUp: (n: string, e: string, p: string) => string | null;
  onSignIn: (e: string, p: string) => string | null;
}> = ({ onSignUp, onSignIn }) => {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (mode === "up" && !form.name.trim()) return setError("Enter your name.");
    if (!form.email.trim()) return setError("Enter your email.");
    if (form.password.length < 4)
      return setError("Password must be at least 4 characters.");
    const err =
      mode === "up"
        ? onSignUp(form.name, form.email, form.password)
        : onSignIn(form.email, form.password);
    setError(err);
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 items-center gap-12 px-6 pt-[68px] md:px-10 lg:grid-cols-2">
      {/* Editorial side */}
      <div className="hidden lg:block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-plum-600">
          Your Atelier Account
        </span>
        <h1 className="display mt-5 text-5xl font-semibold leading-[1.02] text-ink">
          Your measurements,
          <br />
          <span className="italic text-plum-600">remembered.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/55">
          Save your 3D avatar, track bespoke orders, and keep the pieces you love
          — all in one place.
        </p>
        <div className="mt-10 flex gap-8">
          <Perk icon={<Ruler className="h-5 w-5" />} label="Saved avatar" />
          <Perk icon={<Package className="h-5 w-5" />} label="Order tracking" />
          <Perk icon={<Heart className="h-5 w-5" />} label="Saved pieces" />
        </div>
      </div>

      {/* Form card */}
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-[26px] border border-ink/[0.07] bg-white p-8 shadow-2xl shadow-ink/5">
          <div className="mb-6 flex rounded-full bg-ink/[0.04] p-1">
            {(["in", "up"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 rounded-full py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === m ? "bg-ink text-white" : "text-ink/50"
                }`}
              >
                {m === "in" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3.5"
            >
              <h2 className="display text-2xl font-semibold text-ink">
                {mode === "in" ? "Welcome back" : "Create your account"}
              </h2>

              {mode === "up" && (
                <InputRow
                  icon={<User className="h-4 w-4" />}
                  placeholder="Full name"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                />
              )}
              <InputRow
                icon={<Mail className="h-4 w-4" />}
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
              <InputRow
                icon={<Lock className="h-4 w-4" />}
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                onEnter={submit}
              />

              {error && (
                <p className="rounded-xl bg-rose-50 py-2 text-center text-xs font-medium text-rose-600">
                  {error}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={submit}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-600"
              >
                {mode === "in" ? "Sign In" : "Create Account"}
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="mt-4 text-center text-xs text-ink/40">
          Demo account — data is stored locally in your browser.
        </p>
      </div>
    </div>
  );
};

/* ────────────────────────────── Dashboard ────────────────────────────── */

const Dashboard: React.FC<{
  user: { name: string; email: string };
  onSignOut: () => void;
  onNavigate: (to: string, opts?: { state?: unknown }) => void;
}> = ({ user, onSignOut, onNavigate }) => {
  const { profile, orders } = useAvatarStore();
  const eng = useEngagementStore();
  const saved = eng.savedIds().map(productById).filter(Boolean) as CatalogProduct[];
  const liked = eng.likedIds().map(productById).filter(Boolean) as CatalogProduct[];
  const tryOn = (p: CatalogProduct) =>
    onNavigate("/avatar", { state: { clothing: toClothingVariants(p) } });
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-20 pt-[100px] md:px-10">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-ink/[0.06] pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-xl font-black text-white">
            {initials || <User className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-plum-600">
              Member
            </p>
            <h1 className="display text-3xl font-semibold text-ink">
              {user.name}
            </h1>
            <p className="text-sm text-ink/45">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 transition-colors hover:bg-ink/[0.03] sm:self-auto"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>

      {/* Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Avatar settings */}
        <Card
          icon={<Ruler className="h-5 w-5" />}
          title="Avatar Settings"
          action={() => onNavigate("/avatar")}
          actionLabel={profile ? "Edit avatar" : "Create avatar"}
        >
          {profile ? (
            <div className="grid grid-cols-2 gap-3">
              <Spec label="Nickname" value={profile.nickname} />
              <Spec label="Gender" value={profile.gender} />
              <Spec label="Height" value={`${profile.height} cm`} />
              <Spec label="Weight" value={`${profile.weight} kg`} />
              <Spec label="Body type" value={profile.bodyType} />
              <Spec label="Skin tone" value={profile.skinTone} />
            </div>
          ) : (
            <Empty text="No avatar yet. Create one to start trying on couture." />
          )}
        </Card>

        {/* Saved items */}
        <Card
          icon={<Bookmark className="h-5 w-5" />}
          title="Saved Pieces"
          action={() => onNavigate("/products")}
          actionLabel="Browse collection"
        >
          {saved.length === 0 ? (
            <Empty text="Tap the bookmark on any piece to save it here." />
          ) : (
            <EngagementGrid products={saved} onTryOn={tryOn} />
          )}
        </Card>

        {/* Liked items */}
        <Card
          icon={<Heart className="h-5 w-5" />}
          title="Liked Pieces"
          action={() => onNavigate("/products")}
          actionLabel="Browse collection"
        >
          {liked.length === 0 ? (
            <Empty text="Tap the heart on any piece to like it here." />
          ) : (
            <EngagementGrid products={liked} onTryOn={tryOn} />
          )}
        </Card>

        {/* Order history */}
        <div className="md:col-span-2">
          <Card
            icon={<Package className="h-5 w-5" />}
            title="Order History"
            action={() => onNavigate("/orders")}
            actionLabel="View all"
          >
            {orders.length === 0 ? (
              <Empty text="No bespoke orders yet." />
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center gap-4 rounded-2xl border border-ink/[0.06] bg-neutral-50 p-3"
                  >
                    <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                      {o.clothing.image && (
                        <img
                          src={o.clothing.image}
                          alt={o.clothing.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] font-bold text-plum-600">
                        {o.id}
                      </p>
                      <p className="truncate font-serif text-sm font-semibold text-ink">
                        {o.clothing.name}
                      </p>
                      <p className="text-[11px] text-ink/45">{o.date}</p>
                    </div>
                    <p className="text-sm font-bold text-ink">
                      ETB {o.clothing.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 transition-colors hover:text-plum-600"
      >
        Back to home
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
};

/* ────────────────────────────── Small parts ────────────────────────────── */

const InputRow: React.FC<{
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
}> = ({ icon, placeholder, value, type = "text", onChange, onEnter }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35">
      {icon}
    </span>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      className="w-full rounded-xl border border-ink/10 bg-neutral-50 py-3 pl-10 pr-4 text-sm text-ink placeholder-ink/35 transition-colors focus:border-plum-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-plum-100"
    />
  </div>
);

const Perk: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <div className="flex flex-col items-center gap-2 text-center">
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-plum-50 text-plum-600">
      {icon}
    </span>
    <span className="text-xs font-medium text-ink/55">{label}</span>
  </div>
);

const Card: React.FC<{
  icon: React.ReactNode;
  title: string;
  action: () => void;
  actionLabel: string;
  children: React.ReactNode;
}> = ({ icon, title, action, actionLabel, children }) => (
  <div className="rounded-3xl border border-ink/[0.07] bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-plum-50 text-plum-600">
          {icon}
        </span>
        <h3 className="display text-lg font-semibold text-ink">{title}</h3>
      </div>
      <button
        onClick={action}
        className="inline-flex items-center gap-1 text-xs font-semibold text-plum-600 transition-colors hover:text-plum-700"
      >
        {actionLabel}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </div>
    {children}
  </div>
);

const Spec: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-ink/[0.06] bg-neutral-50 px-3 py-2.5">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">
      {label}
    </p>
    <p className="mt-0.5 text-sm font-semibold capitalize text-ink">{value}</p>
  </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-ink/10 bg-neutral-50/60 px-5 py-8 text-center">
    <p className="text-sm text-ink/45">{text}</p>
  </div>
);

const EngagementGrid: React.FC<{
  products: CatalogProduct[];
  onTryOn: (p: CatalogProduct) => void;
}> = ({ products, onTryOn }) => (
  <div className="grid grid-cols-3 gap-2.5">
    {products.slice(0, 6).map((p) => (
      <button key={p.id} onClick={() => onTryOn(p)} className="group text-left">
        <div className="aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100">
          <img
            src={p.img}
            alt={p.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <p className="mt-1.5 truncate text-[11px] font-semibold text-ink">{p.name}</p>
        <p className="text-[10px] text-ink/45">ETB {p.price.toLocaleString()}</p>
      </button>
    ))}
  </div>
);

export default AccountPage;
