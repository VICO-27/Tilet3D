import React, { useState } from "react";
import { Menu, Shield } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = "Dashboard Overview",
  subtitle = "Live operational and catalog telemetry",
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink text-white font-sans flex">
      {/* Sidebar Navigation */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-ink/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-serif font-bold text-white tracking-wide">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-gray-400 hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-plum-500/10 text-plum-300 border border-plum-500/20">
              <Shield className="w-3.5 h-3.5" />
              Staff Environment
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
