import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const CentralSafeMode: React.FC = () => {
    const sessionCards = [
        {
            id: 1,
            title: "Session 1: Urgent Pulse",
            description: "Check today's urgent tasks only. Tick off anything already done. Stop.",
            icon: <CheckCircle2 className="text-white" size={24} />
        },
        {
            id: 2,
            title: "Session 2: Stock Check",
            description: "Check café stock alerts. Send one message if needed. No follow-ups. Stop.",
            icon: <AlertTriangle className="text-white" size={24} />
        },
        {
            id: 3,
            title: "Session 3: Team Check",
            description: "Check who's on shift. Confirm radio is running. Add one Notion note. Stop.",
            icon: <ShieldCheck className="text-white" size={24} />
        }
    ];

    return (
        <div className="space-y-10">
            {/* Energy Safe Path Card */}
            <div className="bg-brand-olive text-brand-cream p-10 md:p-14 rounded-[40px] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <ShieldCheck size={160} />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-bold mb-8">
                        <Zap size={16} className="text-amber-400" /> Energy-Safe Path (Safe Mode)
                    </div>
                    <h2 className="text-4xl md:text-6xl font-serif mb-6 italic">Slow down, Scott.</h2>
                    <p className="text-xl text-white/80 leading-relaxed mb-8">
                        If you're tired, foggy, or short on time — do <span className="text-white font-bold">ONLY</span> this.
                        Progress without burnout.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {sessionCards.map((card, idx) => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-8 rounded-[32px] border border-brand-olive/5 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="w-12 h-12 bg-brand-olive rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            {card.icon}
                        </div>
                        <h3 className="text-xl font-serif mb-4">{card.title}</h3>
                        <p className="text-brand-ink/60 text-sm leading-relaxed">
                            {card.description}
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                    <h3 className="text-2xl font-serif mb-8 flex items-center gap-3">
                        <span className="italic text-brand-olive">Your 3 Things</span> Today
                    </h3>
                    <div className="space-y-6">
                        {[
                            "Review the café stock alerts for critical items",
                            "Confirm the afternoon radio presenters are synced",
                            "Check for any urgent Xero invoice flags"
                        ].map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-start">
                                <span className="text-2xl font-serif text-brand-olive/30 italic">{idx + 1}.</span>
                                <p className="text-lg text-brand-ink/80 pt-1">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-brand-olive/5 p-10 rounded-[40px] border border-brand-olive/10 flex flex-col justify-center text-center">
                    <p className="text-2xl font-serif text-brand-olive leading-relaxed italic mb-6">
                        "The Farmers Table Hub CIC is running. The radio is on. The café opened this morning. Your team is in."
                    </p>
                    <p className="text-brand-ink/60 leading-relaxed">
                        You don't need to do everything today. Pause, resume, or skip — nothing will break.
                    </p>
                </div>
            </div>
        </div>
    );
};

const Zap = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);
