import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { getInviteLink } from '../services/discordService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  loginAsRole: (role: UserRole) => void; // fallback for demo/no-Supabase mode
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'https://placeholder.supabase.co' && url.includes('supabase.co');
};

// Demo helpers hand out a founder session with no credentials at all. They must
// never be reachable from a production build, even if Supabase env vars are
// missing on the host — otherwise a misconfigured deploy puts a working
// "Founder Access" button on the public login page.
export const demoModeAvailable = () => import.meta.env.DEV && !isSupabaseConfigured();

const devAutoLogin = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTO_LOGIN === 'true';

/**
 * Resolve a signed-in user's role from the profiles table.
 *
 * This previously read session.user.user_metadata.role. That value is written
 * by the client — any user could call
 * supabase.auth.updateUser({ data: { role: 'founder' } }) and hand themselves
 * the founder dashboard. profiles is writable only by an admin or the
 * service_role key.
 *
 * This drives UI affordances only. The real boundary is RLS on the server: if
 * this lookup is ever wrong, the database still refuses the query.
 */
const resolveUser = async (id: string, email: string | undefined): Promise<User> => {
  const name = email?.split('@')[0] || 'User';

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    // No profile row yet, or the lookup failed. Fail closed.
    if (error) console.error('Could not load profile:', error.message);
    return { id, name, role: 'member', isAdmin: false };
  }

  return {
    id,
    name,
    role: (data.role as UserRole) || 'member',
    isAdmin: Boolean(data.is_admin),
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(
    devAutoLogin ? { id: '1', name: 'Scott', role: 'founder', isAdmin: true } : null
  );
  const [loading, setLoading] = useState(!devAutoLogin);

  useEffect(() => {
    if (devAutoLogin || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let active = true;

    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const resolved = await resolveUser(session.user.id, session.user.email);
        if (active) setUser(resolved);
      }
      if (active) setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        resolveUser(session.user.id, session.user.email).then(resolved => {
          if (active) setUser(resolved);
        });

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

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase not configured. Use demo login.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  // Sends the recovery email that lands the user on /reset-password.
  const requestPasswordReset = async (email: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured, so password reset email cannot be sent.' };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  // Demo/fallback login when Supabase is not yet configured. Dev builds only.
  const loginAsRole = (role: UserRole) => {
    if (!demoModeAvailable()) {
      console.warn('Demo login is disabled outside development.');
      return;
    }
    if (role === 'founder') setUser({ id: '1', name: 'Scott', role: 'founder', isAdmin: true });
    else if (role === 'staff') setUser({ id: '2', name: 'Thalia', role: 'staff', isAdmin: false });
    else if (role === 'customer') setUser({ id: '3', name: 'Local Producer', role: 'customer', isAdmin: false });
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, requestPasswordReset, loginAsRole, logout }}>
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
