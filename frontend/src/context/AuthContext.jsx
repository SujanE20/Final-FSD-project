import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);
const tokenKey = 'workflow_auth_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setChecking(false);
      return;
    }

    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem(tokenKey);
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  async function authenticate(path, credentials) {
    const { data } = await api.post(path, credentials);
    localStorage.setItem(tokenKey, data.token);
    setUser(data.user);
    return data.user;
  }

  const value = useMemo(() => ({
    user,
    checking,
    register: (credentials) => authenticate('/auth/register', credentials),
    login: (credentials) => authenticate('/auth/login', credentials),
    updateUser: (nextUser) => setUser(nextUser),
    logout: () => {
      localStorage.removeItem(tokenKey);
      setUser(null);
    },
  }), [user, checking]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
}
