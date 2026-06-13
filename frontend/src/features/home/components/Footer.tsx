import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Collection",
    links: [
      { label: "Habesha Kemis", to: "/products" },
      { label: "Suri & Sets", to: "/products" },
      { label: "Shemiz", to: "/products" },
      { label: "Netela & Gabi", to: "/products" },
    ],
  },
  {
    title: "Studio",
    links: [
      { label: "Fitting Room", to: "/avatar" },
      { label: "Create Avatar", to: "/avatar" },
      { label: "Order History", to: "/orders" },
      { label: "Account", to: "/account" },
    ],
  },
  {
    title: "Atelier",
    links: [
      { label: "Our Weavers", to: "/" },
      { label: "Sustainability", to: "/" },
      { label: "Heritage Patterns", to: "/" },
      { label: "Contact", to: "/" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-ink/[0.06] bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-base font-black text-white">
                ጥ
              </span>
              <span className="display text-xl font-semibold text-ink">
                Tilet<span className="text-plum-600">3D</span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink/50">
              Bringing traditional Ethiopian fashion into the 3D era — handwoven
              by master artisans in Addis Ababa.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/80">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink/50 transition-colors hover:text-plum-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-ink/[0.06] pt-7 text-xs text-ink/40 sm:flex-row sm:items-center">
          <p>© 2026 ጥለት3D Inc. Handcrafted in Addis Ababa, Ethiopia.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-ink">Privacy</a>
            <a href="#" className="hover:text-ink">Terms</a>
            <a href="#" className="hover:text-ink">Shipping</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
