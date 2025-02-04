import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types.js';

interface AuthContextType {
  user: (User & { token?: string }) | null;
  login: (user: User & { token: string }, rememberMe: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderComponent({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(User & { token?: string }) | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  const login = (userData: User & { token: string }, rememberMe: boolean) => {
    setUser(userData);
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  };

  // Check session storage on mount
  useEffect(() => {
    if (!user) {
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        try {
          setUser(JSON.parse(sessionUser));
        } catch {
          sessionStorage.removeItem('user');
        }
      }
    }
  }, [user]);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user?.token,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const AuthProvider = AuthProviderComponent;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};