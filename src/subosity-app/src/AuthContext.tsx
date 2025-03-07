import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { useToast } from './ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;  // Add loading to interface
  logout: () => Promise<void>;
  requireAuth: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);  // Add loading state
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isValidReturnUrl = (url: string): boolean => {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
      const returnUrl = new URL(url, baseUrl);
      const hostname = returnUrl.hostname.toLowerCase();
      
      // Parse the base URL to get its hostname
      const baseHostname = new URL(baseUrl).hostname.toLowerCase();
      
      return hostname === 'localhost' ||
             hostname === '127.0.0.1' ||
             hostname === baseHostname ||
             hostname.endsWith('.subosity.com') ||
             returnUrl.origin === baseUrl;
    } catch {
      return url.startsWith('/') && !url.startsWith('//');
    }
  };

  const requireAuth = () => {
    if (!user) {
      const returnUrl = encodeURIComponent(
        `${location.pathname}${location.search}${location.hash}`
      );
      
      // Only redirect if it's a valid URL
      if (isValidReturnUrl(returnUrl)) {
        addToast('Please log in to access this page', 'info');
        navigate(`/login?returnUrl=${returnUrl}`);
      } else {
        // If invalid URL, redirect to login without return URL
        addToast('Please log in to continue', 'info');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } finally {
        setLoading(false);  // Set loading to false when done
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
    addToast('You have been logged out', 'success');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
};