import { useState, useEffect, useCallback } from "react";
import { securityApi, SecurityLog, Session } from "../api/accountApi";
import { useAuthStore } from "../../../app/store/useAuthStore";

export const useSecurity = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const signOut = useAuthStore((state) => state.signOut);

  const fetchSecurityData = useCallback(async () => {
    try {
      const [logsData, sessionsData] = await Promise.all([
        securityApi.getSecurityLogs(),
        securityApi.getSessions(),
      ]);
      setLogs(logsData);
      setSessions(sessionsData);
    } catch (err) {
      console.error("Failed to fetch security data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    securityApi
      .getSecurityLogs()
      .then((logsData) => {
        if (isMounted) setLogs(logsData);
      })
      .catch((err) => console.error(err));

    securityApi
      .getSessions()
      .then((sessionsData) => {
        if (isMounted) setSessions(sessionsData);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChangePassword = async (data: { currentPass: string; newPass: string }) => {
    await securityApi.changePassword(data);
    await fetchSecurityData();
  };

  const handleRevokeSessions = async () => {
    await securityApi.revokeSessions();
    await fetchSecurityData();
  };

  const handleDeleteAccount = async () => {
    await securityApi.deleteAccount();
    if (signOut) {
      await signOut();
    }
    window.location.href = "/";
  };

  return {
    logs,
    sessions,
    loading,
    handleChangePassword,
    handleRevokeSessions,
    handleDeleteAccount,
    refreshSecurityData: fetchSecurityData,
  };
};