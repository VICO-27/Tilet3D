import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { useAuthStore } from "@/app/store/useAuthStore";

interface AccessDeniedProps {
  userEmail?: string | null;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ userEmail }) => {
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);

  const handleSwitchAccount = async () => {
    await signOut();
    navigate("/login?redirect=/admin");
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 mb-3">
          HTTP 403 • Forbidden
        </span>

        <h1 className="text-2xl font-serif font-bold text-white mb-2">
          Staff Authorization Required
        </h1>

        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          This area is restricted to authorized Tilet3D administrative personnel.
          {userEmail && (
            <span className="block mt-2 font-mono text-xs text-plum-300 bg-plum-950/40 py-1.5 px-3 rounded-lg border border-plum-800/40">
              Authenticated as: {userEmail}
            </span>
          )}
        </p>

        <div className="space-y-3">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-plum-600 hover:bg-plum-500 text-white font-medium text-sm transition-all shadow-lg shadow-plum-900/40"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Store
          </Link>

          <button
            onClick={handleSwitchAccount}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-medium text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
