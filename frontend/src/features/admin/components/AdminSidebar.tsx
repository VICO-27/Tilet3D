import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Warehouse,
  Users,
  Settings,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  X,
  LucideIcon,
  Tag,
  CreditCard,
  BarChart3,
  ShieldAlert,
  Percent,
} from "lucide-react";
import { useAuthStore } from "@/app/store/useAuthStore";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  isAvailable: boolean;
  statusLabel?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Overview",
    path: "/admin",
    icon: LayoutDashboard,
    isAvailable: true,
  },
  {
    name: "Products",
    path: "/admin/products",
    icon: Package,
    isAvailable: true,
  },
  {
    name: "Categories",
    path: "/admin/categories",
    icon: Tag,
    isAvailable: true,
  },
  {
    name: "Inventory",
    path: "/admin/inventory",
    icon: Warehouse,
    isAvailable: true,
  },
  {
    name: "Orders",
    path: "/admin/orders",
    icon: ShoppingBag,
    isAvailable: true,
  },
  {
    name: "Customers",
    path: "/admin/customers",
    icon: Users,
    isAvailable: true,
  },
  {
    name: "Payments",
    path: "/admin/payments",
    icon: CreditCard,
    isAvailable: true,
  },
  {
    name: "Analytics",
    path: "/admin/analytics",
    icon: BarChart3,
    isAvailable: true,
  },
  {
    name: "Promotions",
    path: "/admin/promotions",
    icon: Percent,
    isAvailable: true,
    statusLabel: "Post-Launch",
  },
  {
    name: "Audit Logs",
    path: "/admin/audit-logs",
    icon: ShieldAlert,
    isAvailable: true,
  },
  {
    name: "Settings",
    path: "/admin/settings",
    icon: Settings,
    isAvailable: true,
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const isActive = (itemPath: string) => {
    if (itemPath === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-ink border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-plum-700 to-plum-500 flex items-center justify-center text-white shadow-lg shadow-plum-900/50">
              <span className="font-serif font-black text-lg">T</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-serif font-bold text-lg tracking-wide group-hover:text-plum-300 transition-colors">
                  Tilet3D
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-plum-500/20 text-plum-300 border border-plum-500/30">
                  Admin
                </span>
              </div>
              <span className="text-[11px] text-gray-400 block font-sans">
                Management Portal
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
            Administration
          </div>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-plum-600/30 text-plum-200 border border-plum-500/40 shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-plum-400" : "text-gray-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {!item.isAvailable && item.statusLabel && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                    {item.statusLabel}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer: User Identity & Actions */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-white/[0.02]">
          {/* Staff Badge & Email */}
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-plum-500/20 text-plum-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-white truncate">
                {user?.email || "Authorized Staff"}
              </div>
              <div className="text-[10px] text-plum-400 font-mono">
                Staff Authorization
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              to="/"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Store
            </Link>

            <button
              onClick={() => signOut()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-300 hover:text-red-200 hover:bg-red-500/10 border border-red-500/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
