import React, { useState } from 'react';
import { CheckCircle, Feather, Wrench, Sun, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { hubService } from '../services/hubService';

export const SubmitStory: React.FC = () => {
    const [makerName, setMakerName] = useState('');
    const [craft, setCraft] = useState('');
    const [q1, setQ1] = useState('');
    const [q2, setQ2] = useState('');
    const [q3, setQ3] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!makerName.trim() || !craft.trim() || !q1.trim()) {
            setError('Please fill in your name, craft, and at least the first question.');
            return;
        }

        // Use existing hubService to create a story (published=false until admin approves)
        // For now we call addMakerStory if it exists, or just mark submitted
        try {
            // Save via Supabase or mock
            const url = (import.meta as any).env?.VITE_SUPABASE_URL;
            const isConfigured = url && url !== 'https://placeholder.supabase.co' && url.includes('supabase.co');

            if (isConfigured) {
                const { supabase } = await import('../lib/supabase');
                await supabase.from('maker_stories').insert({
                    maker_name: makerName,
                    craft,
                    image: '',
                    q1, q2, q3,
                    published: false,
                });
            }
            setSubmitted(true);
        } catch {
            setError('Something went wrong. Please try again.');
        }
    };

    if (submitted) {
        return (
            <div className="py-32 bg-brand-cream min-h-screen">
                <div className="max-w-xl mx-auto text-center px-6">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <CheckCircle className="mx-auto text-brand-olive mb-6" size={64} />
                        <h1 className="text-4xl font-serif mb-4">Story Submitted!</h1>
                        <p className="text-brand-ink/60 mb-8">
                            Thank you, {makerName}. Your story will be reviewed and published on our Maker Stories page once approved.
                        </p>
                        <Link to="/maker-stories" className="inline-flex items-center gap-2 bg-brand-olive text-white font-bold px-8 py-4 rounded-full hover:bg-brand-olive/90">
                            Read Maker Stories
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <Link to="/maker-stories" className="inline-flex items-center gap-2 text-brand-olive font-bold mb-8 hover:gap-3 transition-all">
                    <ArrowLeft size={16} /> Maker Stories
                </Link>

                <h1 className="text-4xl md:text-5xl font-serif mb-4">Share Your <span className="italic text-brand-olive">Story</span></h1>
                <p className="text-brand-ink/60 mb-12 leading-relaxed">
                    Every maker has a story worth telling. Answer three questions and we'll feature you on our community page.
                </p>

                {error && (
                    <div className="bg-red-50 text-red-700 px-6 py-4 rounded-2xl mb-8 text-sm">{error}</div>
                )}

                <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-brand-olive/10 space-y-8">

                    {/* Name & Craft */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-brand-ink/60 mb-2">Your Name</label>
                            <input
                                type="text" value={makerName} onChange={e => setMakerName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20"
                                placeholder="e.g. Sarah Willow"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-brand-ink/60 mb-2">Your Craft</label>
                            <input
                                type="text" value={craft} onChange={e => setCraft(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20"
                                placeholder="e.g. Basket Weaving"
                            />
                        </div>
                    </div>

                    {/* Question 1 */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-brand-olive/10 rounded-full flex items-center justify-center">
                                <Feather size={16} className="text-brand-olive" />
                            </div>
                            <label className="text-sm font-bold text-brand-ink">How did you learn your craft?</label>
                        </div>
                        <textarea
                            value={q1} onChange={e => setQ1(e.target.value)} rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20"
                            placeholder="Tell us about the first time you picked up a tool, watched someone work, or fell in love with making…"
                        />
                    </div>

                    {/* Question 2 */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-brand-olive/10 rounded-full flex items-center justify-center">
                                <Wrench size={16} className="text-brand-olive" />
                            </div>
                            <label className="text-sm font-bold text-brand-ink">What tools can't you work without?</label>
                        </div>
                        <textarea
                            value={q2} onChange={e => setQ2(e.target.value)} rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20"
                            placeholder="That one trusty hammer, a favourite chisel, the family scissors—what's always by your side?"
                        />
                    </div>

                    {/* Question 3 */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-brand-olive/10 rounded-full flex items-center justify-center">
                                <Sun size={16} className="text-brand-olive" />
                            </div>
                            <label className="text-sm font-bold text-brand-ink">What does a good making day look like?</label>
                        </div>
                        <textarea
                            value={q3} onChange={e => setQ3(e.target.value)} rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20"
                            placeholder="Morning light, a clear bench, Radio on in the background—describe your ideal day in the workshop…"
                        />
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            onClick={handleSubmit}
                            className="w-full bg-brand-olive text-white font-bold py-4 rounded-full hover:bg-brand-olive/90 transition-all flex items-center justify-center gap-2"
                        >
                            <Send size={18} /> Submit My Story
                        </button>
                        <p className="text-center text-xs text-brand-ink/30 mt-3">
                            Your story will be reviewed before publishing. We'll never edit your words without asking first.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
