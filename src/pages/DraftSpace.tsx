import React from 'react';
import { motion } from 'motion/react';
import { FileText, Copy, Trash2 } from 'lucide-react';

export const DraftSpace: React.FC = () => {
    return (
        <div className="py-24 bg-brand-cream min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-12 flex items-center justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-[10px] font-bold uppercase tracking-widest mb-4">
                            <FileText size={12} /> Sandbox
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif">Drafting <span className="italic text-brand-olive">Space</span></h1>
                        <p className="text-brand-ink/60 mt-4">A clean, private canvas for pasting and organizing project text.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="p-4 bg-white rounded-2xl border border-brand-olive/10 text-brand-olive hover:bg-brand-olive/5 transition-all shadow-sm" title="Copy All">
                            <Copy size={20} />
                        </button>
                        <button className="p-4 bg-white rounded-2xl border border-brand-olive/10 text-red-500 hover:bg-red-50 transition-all shadow-sm" title="Clear Space">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Main Text Area Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[40px] p-8 md:p-16 border border-brand-olive/5 shadow-inner min-h-[600px] flex flex-col"
                >
                    <textarea
                        className="w-full flex-grow bg-transparent border-none focus:ring-0 text-xl text-brand-ink/80 leading-relaxed resize-none placeholder:text-brand-ink/20 font-serif"
                        placeholder="Paste your recipes, outreach notes, or strategy text here..."
                    />

                    <div className="mt-8 pt-8 border-t border-brand-cream flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-brand-ink/30">
                        <span>Private Drafting Space</span>
                        <span>Auto-formatting: Enabled</span>
                    </div>
                </motion.div>

                {/* Instructions / Helpful Tidbits */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 bg-white/50 rounded-3xl border border-brand-olive/5">
                        <h3 className="font-bold text-brand-ink mb-2">Clean Slate</h3>
                        <p className="text-sm text-brand-ink/60">Use this for messy copy-pastes. I can help you clean them up into formatted components later.</p>
                    </div>
                    <div className="p-8 bg-white/50 rounded-3xl border border-brand-olive/5">
                        <h3 className="font-bold text-brand-ink mb-2">No Formatting Lost</h3>
                        <p className="text-sm text-brand-ink/60">This space handles raw text efficiently. Paste recipes, lists, or long-form mission statements.</p>
                    </div>
                    <div className="p-8 bg-white/50 rounded-3xl border border-brand-olive/5">
                        <h3 className="font-bold text-brand-ink mb-2">Private Access</h3>
                        <p className="text-sm text-brand-ink/60">This page is located at /draft and is intended for internal project coordination only.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
