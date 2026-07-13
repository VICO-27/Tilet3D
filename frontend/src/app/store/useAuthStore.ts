import { useCallback, useState } from "react";

/**
 * Tilet3D Authentication Store
 * Integrated with Django JWT Backend
 */

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
}

const API_URL = "http://127.0.0.1:8000/api";
const ACCESS_TOKEN_KEY = "tilet3d_access_token";
const REFRESH_TOKEN_KEY = "tilet3d_refresh_token";
const USER_DATA_KEY = "tilet3d_user_data";

export const useAuthStore = () => {
  // Fix: Initialize state directly from localStorage to avoid cascading renders in useEffect
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem(USER_DATA_KEY);
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    return savedUser && token ? (JSON.parse(savedUser) as AuthUser) : null;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Sign Out (Declared first because others depend on it)
  const signOut = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (refreshToken) {
      await fetch(`${API_URL}/auth/logout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      }).catch(() => { /* ignore silent fail */ });
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    setUser(null);
    setError(null);
  }, []);

  // 2. Fetch Profile (Depends on signOut)
  const fetchProfile = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await response.json();

      if (response.ok) {
        setUser(userData);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        return null;
      }
      throw new Error("Failed to fetch profile");
    } catch (err: unknown) {
      await signOut();
      return err instanceof Error ? err.message : "An unknown error occurred";
    }
  }, [signOut]);

  // 3. Sign In (Depends on fetchProfile)
  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/auth/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Incorrect email or password.");
        }

        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
        
        return await fetchProfile(data.access);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Login failed";
        setError(msg);
        return msg;
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile]
  );

  // 4. Sign Up (Depends on signIn)
  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/auth/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: name,
            email: email.trim().toLowerCase(),
            password: password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || data.email || "Registration failed");
        }

        return await signIn(email, password);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Registration failed";
        setError(msg);
        return msg;
      } finally {
        setLoading(false);
      }
    },
    [signIn]
  );

  return { 
    user, 
    loading, 
    error, 
    signUp, 
    signIn, 
    signOut, 
    isAuthenticated: !!user 
  };
};