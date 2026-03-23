import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login as loginRequest, register as registerRequest } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('authUser');
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  function persistSession(authPayload) {
    localStorage.setItem('accessToken', authPayload.token);
    localStorage.setItem('authUser', JSON.stringify(authPayload.user));
    setUser(authPayload.user);
  }

  async function login(payload) {
    const data = await loginRequest(payload);
    persistSession(data);
    return data;
  }

  async function register(payload) {
    const data = await registerRequest(payload);
    persistSession(data);
    return data;
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    setUser(null);
  }

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    async function bootstrapProfile() {
      try {
        const data = await getMe();

        if (mounted && data?.user) {
          localStorage.setItem('authUser', JSON.stringify(data.user));
          setUser(data.user);
        }
      } catch {
        if (mounted) {
          logout();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrapProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      setUser,
      logout,
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
