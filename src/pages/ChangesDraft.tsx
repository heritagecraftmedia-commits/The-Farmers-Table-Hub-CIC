import React, { useState } from 'react';
import { Edit3, Copy, Check, Info } from 'lucide-react';

export const ChangesDraft: React.FC = () => {
    const [text, setText] = useState('');
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
                        <Edit3 size={12} /> Work in Progress
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif mb-4">Changes <span className="italic text-brand-olive">Draft</span></h1>
                    <p className="text-lg text-brand-ink/60">
                        Use this clean space to paste your text, draft project updates, or outline structural changes.
                        This page is for your own drafting and will not be displayed to the public.
                    </p>
                </div>

                <div className="bg-white rounded-[40px] shadow-sm border border-brand-olive/5 overflow-hidden">
                    <div className="flex items-center justify-between px-8 py-4 bg-brand-cream/30 border-b border-brand-olive/5">
                        <span className="text-xs font-bold text-brand-ink/40">PLAIN TEXT EDITOR</span>
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
                        className="w-full h-[500px] p-8 md:p-12 text-lg font-mono focus:ring-0 border-none resize-none placeholder:text-brand-ink/20"
                    ></textarea>
                </div>

                <div className="mt-8 flex gap-4 p-6 bg-brand-olive/5 rounded-3xl border border-brand-olive/10">
                    <Info className="text-brand-olive shrink-0" size={20} />
                    <p className="text-sm text-brand-ink/60 leading-relaxed">
                        <strong>Note:</strong> Changes made here are saved in your current session. Make sure to copy your text if you need to save it permanently or apply it to specific page files.
                    </p>
                </div>

            </div>
        </div>
    );
};
