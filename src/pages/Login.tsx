import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { LogIn, User, ShieldCheck, Store, Mail, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'https://placeholder.supabase.co' && url.includes('supabase.co');
};

export const Login: React.FC = () => {
  const { login, loginAsRole } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabaseReady = isSupabaseConfigured();

  const handleRealLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await login(email, password);
    setLoading(false);
    if (authError) { setError(authError); return; }
    navigate('/dashboard');
  };

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) { loginAsRole(selectedRole); navigate('/dashboard'); }
  };

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-brand-olive/5 text-center"
        >
          <div className="w-16 h-16 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive mx-auto mb-8">
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-serif mb-2">Welcome Back</h1>

          {supabaseReady ? (
            // Real Supabase email/password login
            <>
              <p className="text-brand-ink/60 mb-10">Sign in to your account</p>
              <form onSubmit={handleRealLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-bold mb-2 text-brand-ink/60">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full pl-10 pr-4 py-4 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20 focus:outline-none text-sm"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-brand-ink/60">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                    <input
                      type="password" value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full pl-10 pr-4 py-4 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20 focus:outline-none text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
                <button
                  type="submit" disabled={loading}
                  className="w-full py-5 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all disabled:opacity-50 mt-4"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </>
          ) : (
            // Demo mode when Supabase not yet configured
            <>
              <p className="text-brand-ink/60 mb-3">Select your access level to continue</p>
              <div className="mb-4 p-3 bg-yellow-50 rounded-xl text-xs text-yellow-700 text-left">
                <strong>Demo Mode:</strong> Add Supabase credentials to enable real login.
              </div>
              <form onSubmit={handleDemoLogin} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {([
                    { role: 'founder' as UserRole, Icon: ShieldCheck, label: 'Founder Access', sub: 'Full site management' },
                    { role: 'staff' as UserRole, Icon: User, label: 'Staff Access', sub: 'Tasks & notes' },
                    { role: 'customer' as UserRole, Icon: Store, label: 'Customer Access', sub: 'Manage your listings' },
                  ]).map(({ role, Icon, label, sub }) => (
                    <button
                      key={role} type="button" onClick={() => setSelectedRole(role)}
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${selectedRole === role ? 'border-brand-olive bg-brand-olive/5' : 'border-brand-cream hover:border-brand-olive/20'}`}
                    >
                      <Icon className={selectedRole === role ? 'text-brand-olive' : 'text-brand-ink/40'} />
                      <div className="text-left">
                        <span className="block font-bold">{label}</span>
                        <span className="text-xs opacity-50">{sub}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="submit" disabled={!selectedRole}
                  className="w-full py-5 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign In
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
