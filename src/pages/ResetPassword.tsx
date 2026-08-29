import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    // Supabase turns the recovery link's fragment into a session. Without this
    // check, opening /reset-password directly showed a working-looking form
    // that failed on submit with a raw API error.
    const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) setHasRecoverySession(true);
        });
        supabase.auth.getSession().then(({ data: { session } }) => {
            setHasRecoverySession(prev => prev ?? Boolean(session));
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (updateError) { setError(updateError.message); return; }
        setDone(true);
        setTimeout(() => navigate('/login'), 3000);
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
                        <Lock size={32} />
                    </div>
                    <h1 className="text-3xl font-serif mb-2">Reset Password</h1>

                    {hasRecoverySession === false ? (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <AlertCircle size={40} className="text-amber-500" />
                            <p className="text-sm text-brand-ink/60">
                                This reset link is missing or has expired. Go to sign in and choose
                                "Forgot password?" to get a new one.
                            </p>
                            <button onClick={() => navigate('/login')}
                                className="px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm">
                                Back to sign in
                            </button>
                        </div>
                    ) : done ? (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <CheckCircle size={40} className="text-green-500" />
                            <p className="text-sm text-brand-ink/60">Password updated. Redirecting to sign in...</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-brand-ink/60 mb-10">Enter your new password below.</p>
                            <form onSubmit={handleReset} className="space-y-4 text-left">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-brand-ink/60">New Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                                        <input
                                            type="password" value={password} onChange={e => setPassword(e.target.value)} required
                                            className="w-full pl-10 pr-4 py-4 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20 focus:outline-none text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-brand-ink/60">Confirm Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-olive/30" />
                                        <input
                                            type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
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
                                <button type="submit" disabled={loading}
                                    className="w-full py-5 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all disabled:opacity-50 mt-4">
                                    {loading ? 'Updating...' : 'Set New Password'}
                                </button>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
