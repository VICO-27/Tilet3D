import { Link, useLocation } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Collection" },
  { to: "/avatar", label: "Fitting Room" },
  { to: "/orders", label: "Orders" },
];

/** Shared light luxury top navigation used by Collection + Orders pages. */
const StoreNav = () => {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-10">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-purple-500 text-sm font-black text-white">
            ጥ
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-slate-900">
            Tilet<span className="text-violet-600">3D</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((link) => {
            const active =
              link.to === "/"
                ? pathname === "/"
                : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors sm:text-xs ${
                  active
                    ? "text-violet-600"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-violet-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default StoreNav;
