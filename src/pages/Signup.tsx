import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Member signup.
 *
 * There was previously no signup anywhere in the app: Login only signed
 * existing users in, and nothing called supabase.auth.signUp. Members.tsx and
 * MembersArea.tsx both assume accounts exist, and Privacy.tsx tells visitors
 * they can "register for a member account".
 *
 * New accounts are always unprivileged — see the note on signup() in
 * AuthContext, and the handle_new_user trigger in
 * supabase/migrations/20260826_rls_admin_hardening.sql.
 */
export const Signup: React.FC = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkInbox, setCheckInbox] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

        setLoading(true);
        const { error: signupError, needsConfirmation } = await signup(email, password);
        setLoading(false);

        if (signupError) { setError(signupError); return; }
        if (needsConfirmation) { setCheckInbox(true); return; }
        navigate('/members');
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
                        <UserPlus size={32} />
                    </div>

                    {checkInbox ? (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <CheckCircle size={40} className="text-green-500" />
                            <h1 className="text-3xl font-serif">Check your inbox</h1>
                            <p className="text-sm text-brand-ink/60">
                                We've sent a confirmation link to <strong>{email}</strong>. Open it to
                                finish setting up your account.
                            </p>
                            <Link to="/login" className="text-sm text-brand-olive hover:underline mt-2">
                                Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-serif mb-2">Join the Hub</h1>
                            <p className="text-brand-ink/60 mb-10">Create your free member account.</p>

                            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                                <div>
                                    <label htmlFor="signup-email" className="block text-sm font-bold mb-2 text-brand-ink/60">Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                                        <input
                                            id="signup-email" type="email" autoComplete="email" required
                                            value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-4 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20 focus:outline-none text-sm"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="signup-password" className="block text-sm font-bold mb-2 text-brand-ink/60">Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                                        <input
                                            id="signup-password" type="password" autoComplete="new-password" required
                                            value={password} onChange={e => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-4 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20 focus:outline-none text-sm"
                                            placeholder="At least 8 characters"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="signup-confirm" className="block text-sm font-bold mb-2 text-brand-ink/60">Confirm password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                                        <input
                                            id="signup-confirm" type="password" autoComplete="new-password" required
                                            value={confirm} onChange={e => setConfirm(e.target.value)}
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
                                    {loading ? 'Creating account...' : 'Create account'}
                                </button>
                            </form>

                            <p className="text-sm text-brand-ink/50 mt-6">
                                Already have an account?{' '}
                                <Link to="/login" className="text-brand-olive font-bold hover:underline">Sign in</Link>
                            </p>
                            <p className="text-xs text-brand-ink/40 mt-4">
                                By joining you agree to our{' '}
                                <Link to="/terms" className="underline">Terms</Link> and{' '}
                                <Link to="/privacy" className="underline">Privacy Policy</Link>.
                            </p>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
