import React, { useState } from 'react';
import { FileText, Copy, Check, Info } from 'lucide-react';

export const Notes: React.FC = () => {
    const [text, setText] = useState('// Personal Notes & Content Space\n// This is an additional space for your drafting.\n\n' +
        'Ideas:\n' +
        '- Local seasonal recipes\n' +
        '- Volunteer onboarding ideas\n' +
        '- Radio ad scripts');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="py-24 bg-brand-cream min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-[10px] font-bold uppercase tracking-widest mb-4">
                        <FileText size={12} /> Personal Workspace
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif mb-4">Community <span className="italic text-brand-olive">Notes</span></h1>
                    <p className="text-lg text-brand-ink/60">
                        An additional clean space for your thoughts, planning, and content drafting.
                    </p>
                </div>

                <div className="bg-white rounded-[40px] shadow-sm border border-brand-olive/5 overflow-hidden">
                    <div className="flex items-center justify-between px-8 py-4 bg-brand-cream/30 border-b border-brand-olive/5">
                        <span className="text-xs font-bold text-brand-ink/40">DRAFT EDITOR</span>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 text-xs font-bold text-brand-olive hover:opacity-70 transition-all"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your text here..."
                        className="w-full h-[600px] p-8 md:p-12 text-lg font-mono focus:ring-0 border-none resize-none placeholder:text-brand-ink/20"
                    ></textarea>
                </div>

                <div className="mt-8 flex gap-4 p-6 bg-brand-olive/5 rounded-3xl border border-brand-olive/10">
                    <Info className="text-brand-olive shrink-0" size={20} />
                    <p className="text-sm text-brand-ink/60 leading-relaxed">
                        This workspace is private to your current session. Use it to organize long-form text before moving it to specific pages.
                    </p>
                </div>

            </div>
        </div>
    );
};
