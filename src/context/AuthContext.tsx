import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { getInviteLink } from '../services/discordService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  loginAsRole: (role: UserRole) => void; // fallback for demo/no-Supabase mode
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'https://placeholder.supabase.co' && url.includes('supabase.co');
};

const devAutoLogin = import.meta.env.VITE_DEV_AUTO_LOGIN === 'true';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(
    devAutoLogin ? { id: '1', name: 'Scott', role: 'founder' } : null
  );
  const [loading, setLoading] = useState(!devAutoLogin);

  useEffect(() => {
    if (devAutoLogin || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const role = (session.user.user_metadata?.role as UserRole) || 'customer';
        setUser({ id: session.user.id, name: session.user.email?.split('@')[0] || 'User', role });
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const role = (session.user.user_metadata?.role as UserRole) || 'customer';
        setUser({ id: session.user.id, name: session.user.email?.split('@')[0] || 'User', role });

        // On new signup: log Discord invite link (replace with email send when email service is ready)
        if (event === 'SIGNED_IN' && session.user.created_at === session.user.last_sign_in_at) {
          getInviteLink().then(url => {
            if (url) {
              console.log(
                `[FTH] New member signup — ${session.user.email}. Send Discord invite: ${url}`
              );
            }
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase not configured. Use demo login.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  // Demo/fallback login when Supabase is not yet configured
  const loginAsRole = (role: UserRole) => {
    if (role === 'founder') setUser({ id: '1', name: 'Scott', role: 'founder' });
    else if (role === 'staff') setUser({ id: '2', name: 'Thalia', role: 'staff' });
    else if (role === 'customer') setUser({ id: '3', name: 'Local Producer', role: 'customer' });
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
