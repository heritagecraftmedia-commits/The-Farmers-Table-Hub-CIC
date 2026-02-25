import React from 'react';
import { motion } from 'motion/react';
import { Radio as RadioIcon, Play, Users, Clock, ExternalLink, Activity, Info } from 'lucide-react';

export const CentralRadio: React.FC = () => {
    const adSlots = [
        { time: "11:15", client: "Surrey Ironworks", length: "30s", status: "Invoiced", overdue: false },
        { time: "11:45", client: "Local Veg Co.", length: "15s", status: "Unpaid", overdue: true },
        { time: "12:15", client: "The Potters Studio", length: "30s", status: "Paid", overdue: false },
        { time: "12:45", client: "Rural Candle Co.", length: "30s", status: "Unpaid", overdue: true },
    ];

    const schedule = [
        { show: "Surrey Hills Morning Live", host: "Sarah Willow", days: "Mon-Fri", time: "10:00 - 12:00", status: "Live Now" },
        { show: "Afternoon Artisan Hour", host: "Tom Baker", days: "Tue, Thu", time: "14:00 - 15:00", status: "Scheduled" },
        { show: "Local Music Showcase", host: "Alice Smith", days: "Friday", time: "17:00 - 19:00", status: "Scheduled" },
    ];

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">Community Radio <span className="italic text-brand-olive">FM 107.2</span></h2>
                    <p className="text-brand-ink/50 mt-1">Live from The Farmers Table Hub.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 border border-brand-olive/20 text-brand-olive rounded-full text-sm font-bold bg-white hover:bg-brand-olive/5 transition-all">
                        Schedule Show
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10">
                        <Activity size={18} /> Station Health
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    {/* Now On Air Card */}
                    <div className="bg-brand-olive text-brand-cream p-10 md:p-12 rounded-[40px] shadow-xl relative overflow-hidden">
                        <div className="absolute top-10 right-10 flex flex-col items-center gap-2 opacity-20">
                            <RadioIcon size={120} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="px-3 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" /> Live On Air
                                </div>
                                <span className="text-white/60 text-xs font-mono">FM 107.2 · Online ✓</span>
                            </div>

                            <div className="mb-10">
                                <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">Current Show</p>
                                <h3 className="text-4xl md:text-5xl font-serif italic mb-4">Surrey Hills Morning Live</h3>
                                <div className="flex items-center gap-6 text-white/80">
                                    <div className="flex items-center gap-2">
                                        <Users size={18} className="text-amber-400" />
                                        <span className="font-bold">342 Listeners</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-amber-400" />
                                        <span className="font-bold">Starts: 10:00</span>
                                    </div>
                                </div>
                            </div>

                            {/* Waveform Animation */}
                            <div className="flex items-end gap-1.5 h-12 mb-4">
                                {[4, 8, 5, 10, 6, 9, 7, 12, 5, 8, 4, 10, 6, 9, 3, 7, 5, 8, 4, 10].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [`${h * 4}px`, `${(h + 2) * 4}px`, `${h * 4}px`] }}
                                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                                        className="w-1.5 bg-white/40 rounded-full"
                                    />
                                ))}
                            </div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Signal Output Peak — High Fidelity</p>
                        </div>
                    </div>

                    {/* Ad Slots Section */}
                    <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm p-8 md:p-10">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-serif italic text-brand-olive">Today's Ad Slots</h3>
                            <button className="text-xs font-bold text-brand-olive underline underline-offset-4">Manage Ad Scripts</button>
                        </div>
                        <div className="space-y-4">
                            {adSlots.map((slot, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-5 rounded-3xl bg-brand-cream/10 border border-brand-olive/5 group hover:border-brand-olive/20 transition-all">
                                    <div className="w-16 font-mono text-xs font-bold text-brand-ink/40">{slot.time}</div>
                                    <div className="flex-1">
                                        <p className="font-bold text-brand-ink">{slot.client}</p>
                                        <p className="text-[10px] text-brand-ink/40 font-bold uppercase tracking-tight">Length: {slot.length} · {slot.status}</p>
                                    </div>
                                    {slot.overdue && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                                            Payment Overdue
                                        </div>
                                    )}
                                    <button className="p-2 opacity-0 group-hover:opacity-100 transition-all"><ExternalLink size={14} className="text-brand-olive" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Schedule Sidebar */}
                <div className="bg-white rounded-[40px] p-8 border border-brand-olive/10 shadow-lg shadow-brand-olive/5">
                    <h3 className="text-xl font-serif mb-8 text-brand-olive italic">Weekly Schedule</h3>
                    <div className="space-y-8">
                        {schedule.map((show, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${show.status === 'Live Now' ? 'bg-brand-olive text-white' : 'bg-brand-cream text-brand-olive/50'
                                        }`}>
                                        {show.status}
                                    </span>
                                    <span className="text-[10px] font-mono text-brand-ink/40">{show.days}</span>
                                </div>
                                <h4 className="font-bold text-lg leading-tight">{show.show}</h4>
                                <div className="flex items-center justify-between text-brand-ink/60">
                                    <span className="text-xs">{show.host}</span>
                                    <span className="text-xs font-bold">{show.time}</span>
                                </div>
                                {idx !== schedule.length - 1 && <div className="pt-4 border-b border-brand-olive/5" />}
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-10 py-4 bg-brand-cream/50 border border-brand-olive/10 text-brand-olive rounded-3xl text-sm font-bold hover:bg-brand-olive/5 transition-all">
                        Open Full Planner
                    </button>
                </div>
            </div>
        </div>
    );
};
