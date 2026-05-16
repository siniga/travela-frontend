'use client';

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

// Simulated delay to mimic a real network request
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

    // Keep auth state in sync if storage is modified elsewhere.
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user' || e.key === null) {
        syncFromStorage();
      }
    };
    window.addEventListener('storage', onStorage);
    setIsLoading(false);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    await delay();
    // Simulate successful login — replace with real API when backend is ready
    const mockToken = `mock_token_${Date.now()}`;
    const mockUser: User = {
      id: 1,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
    };
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    setToken(mockToken);
    setUser(mockUser);
  }, []);

  const register = useCallback(async (data: Record<string, unknown>) => {
    await delay();
    // Simulate successful registration — replace with real API when backend is ready
    const mockToken = `mock_token_${Date.now()}`;
    const mockUser: User = {
      id: 1,
      name: data.name as string ?? 'Traveller',
      email: data.email as string ?? '',
    };
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    setToken(mockToken);
    setUser(mockUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastPurchase');
    localStorage.removeItem('pendingExternalPayment');
    setToken(null);
    setUser(null);
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
