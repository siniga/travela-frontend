'use client';

import {
  apiErrorMessage,
  AuthApi,
  extractAuthTokenFromBody,
  extractUserFromAuthBody,
} from '@/lib/api';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface User {
  id?: string | number;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Dispatched when auth keys in localStorage change in the same tab. */
export const AUTH_STORAGE_SYNC = 'travela-auth-storage-sync';

// Simulated delay to mimic a real network request (register only)
const delay = (ms = 800) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser) as User;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  });
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((authToken: string, authUser: User) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
    window.dispatchEvent(new Event(AUTH_STORAGE_SYNC));
  }, []);

  useEffect(() => {
    const syncFromStorage = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    syncFromStorage();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user' || e.key === null) {
        syncFromStorage();
      }
    };
    const onAuthSync = () => syncFromStorage();

    window.addEventListener('storage', onStorage);
    window.addEventListener(AUTH_STORAGE_SYNC, onAuthSync);
    setIsLoading(false);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(AUTH_STORAGE_SYNC, onAuthSync);
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const trimmedEmail = email.trim();
      const result = await AuthApi.login({
        email: trimmedEmail,
        password,
      });

      if (!result.ok) {
        throw new Error(
          apiErrorMessage(result.body, 'Invalid email or password.')
        );
      }

      const authToken = extractAuthTokenFromBody(result.body);
      if (!authToken) {
        throw new Error('Login succeeded but no access token was returned.');
      }

      const apiUser = extractUserFromAuthBody(result.body);
      const authUser: User = {
        id: apiUser?.id,
        name: apiUser?.name,
        email: apiUser?.email ?? trimmedEmail,
      };

      persistSession(authToken, authUser);
    },
    [persistSession]
  );

  const register = useCallback(async (data: Record<string, unknown>) => {
    await delay();
    // Simulate successful registration — replace with real API when backend is ready
    const mockToken = `mock_token_${Date.now()}`;
    const mockUser: User = {
      id: 1,
      name: (data.name as string) ?? 'Traveller',
      email: (data.email as string) ?? '',
    };
    persistSession(mockToken, mockUser);
  }, [persistSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastPurchase');
    localStorage.removeItem('pendingExternalPayment');
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event(AUTH_STORAGE_SYNC));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
