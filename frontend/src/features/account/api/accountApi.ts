import apiClient from "../../../shared/api/apiClient";

export interface SecurityLog {
  id: string;
  event: string;
  date: string;
  ip: string;
}

export interface Session {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface BackendSession {
  id: string | number;
  device?: string;
  location?: string;
  ip?: string;
  lastActive?: string;
  created_at?: string;
  isCurrent?: boolean;
}

export const securityApi = {
  // 1. Fetch Audit Logs
  getSecurityLogs: async (): Promise<SecurityLog[]> => {
    const response = await apiClient.get("/accounts/security/logs/");
    return response.data;
  },

  // 2. Fetch Active Sessions
  getSessions: async (): Promise<Session[]> => {
    const response = await apiClient.get<BackendSession[]>("/accounts/security/sessions/");
    return response.data.map((s) => ({
      id: String(s.id),
      device: s.device || "Web Browser",
      location: s.location || "Active Session",
      ip: s.ip || "—",
      lastActive: s.lastActive || s.created_at || "Recently",
      isCurrent: Boolean(s.isCurrent),
    }));
  },

  // 3. Change Password
  changePassword: async (data: { currentPass: string; newPass: string }) => {
    const response = await apiClient.post("/accounts/security/change-password/", {
      current_password: data.currentPass,
      new_password: data.newPass,
    });
    return response.data;
  },

  // 4. Revoke Other Sessions
  revokeSessions: async () => {
    const response = await apiClient.delete("/accounts/security/sessions/");
    return response.data;
  },

  // 5. Delete Account
  deleteAccount: async () => {
    const response = await apiClient.delete("/accounts/security/delete-account/");
    return response.data;
  },
};