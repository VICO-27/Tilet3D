import { useCallback, useEffect, useState } from "react";

/**
 * Lightweight front-end-only auth (no backend).
 * Demo credentials are persisted to localStorage — passwords are base64-obfuscated,
 * which is NOT real security, only enough for a local prototype sign-in flow.
 */

export interface AuthUser {
  name: string;
  email: string;
}

interface StoredUser extends AuthUser {
  pw: string; // btoa(password)
}

const USERS_KEY = "tilet3d_users";
const SESSION_KEY = "tilet3d_auth_user";

function loadUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const useAuthStore = () => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  }, [user]);

  const signUp = useCallback(
    (name: string, email: string, password: string): string | null => {
      const e = email.trim().toLowerCase();
      const users = loadUsers();
      if (users.some((u) => u.email === e)) {
        return "An account with this email already exists.";
      }
      users.push({ name: name.trim(), email: e, pw: btoa(password) });
      saveUsers(users);
      setUser({ name: name.trim(), email: e });
      return null;
    },
    [],
  );

  const signIn = useCallback(
    (email: string, password: string): string | null => {
      const e = email.trim().toLowerCase();
      const found = loadUsers().find((u) => u.email === e);
      if (!found || found.pw !== btoa(password)) {
        return "Incorrect email or password.";
      }
      setUser({ name: found.name, email: found.email });
      return null;
    },
    [],
  );

  const signOut = useCallback(() => setUser(null), []);

  return { user, signUp, signIn, signOut };
};
