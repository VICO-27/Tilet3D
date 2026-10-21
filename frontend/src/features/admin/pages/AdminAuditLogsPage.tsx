import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Search,
  RotateCw,
  AlertCircle,
  Calendar,
  Globe,
  User,
} from "lucide-react";
import adminApi from "../api/adminApi";
import type { AdminAuditLogItem } from "../types/admin";
import AdminLayout from "../components/AdminLayout";
import AccessDenied from "../components/AccessDenied";
import { useAuthStore } from "@/app/store/useAuthStore";

interface AxiosLikeError {
  response?: {
    status?: number;
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

export const AdminAuditLogsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  const pageSize = 15;

  const fetchLogs = useCallback(
    async (page: number = currentPage) => {
      setLoading(true);
      setError(null);
      setIsForbidden(false);

      try {
        const res = await adminApi.getAuditLogs({
          page,
          search,
        });
        setLogs(res.results);
        setTotalCount(res.count);
        setTotalPages(Math.max(1, Math.ceil(res.count / pageSize)));
      } catch (err: unknown) {
        const axiosErr = err as AxiosLikeError;
        if (axiosErr?.response?.status === 403) {
          setIsForbidden(true);
        } else {
          setError(
            axiosErr?.response?.data?.detail ||
              axiosErr?.message ||
              "Failed to load security audit logs."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [currentPage, search]
  );

  useEffect(() => {
    fetchLogs(currentPage);
  }, [fetchLogs, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs(1);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  if (isForbidden) {
    return <AccessDenied userEmail={user?.email} />;
  }

  return (
    <AdminLayout
      title="Security Audit Logs"
      subtitle="Read-only chronological trail of user authentications, credential changes, and security events"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user email, IP address, or event..."
              className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-ink border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
            >
              Search
            </button>
          </form>

          <button
            onClick={() => fetchLogs(currentPage)}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchLogs(currentPage)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Event</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">Client User-Agent</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <RotateCw className="w-6 h-6 text-plum-400 animate-spin" />
                      <span className="text-xs">Loading security audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShieldAlert className="w-8 h-8 text-gray-600" />
                      <span className="text-sm font-medium text-gray-300">
                        No security logs found
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <span className="font-medium text-white block">
                        {log.event}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        <span>{log.user_email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-gray-500" />
                        <span>{log.ip_address || "Internal / Local"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-500 line-clamp-1 max-w-xs truncate">
                      {log.user_agent || "Standard Browser"}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLogsPage;
