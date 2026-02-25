import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Edit3, User, Check, Info } from 'lucide-react';

export const CentralSchedules: React.FC = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const staff = [
        { name: 'Alice S.', roles: ['✓', '✓', '✓', '✓', '–'] },
        { name: 'Tom B.', roles: ['–', '✓', '✓', '✓', '✓'] },
        { name: 'Sarah W.', roles: ['NOW', '–', 'VOL', '–', '✓'] },
        { name: 'James I.', roles: ['✓', 'NOW', '–', '✓', '–'] },
        { name: 'Emma G.', roles: ['VOL', '✓', '✓', '–', 'VOL'] },
    ];

    const timeline = [
        { time: '09:00', title: 'Breakfast Show', status: 'done' },
        { time: '11:00', title: 'Artisan Morning Live', status: 'now' },
        { time: '13:00', title: 'Classical Lunch', status: 'upcoming' },
        { time: '14:00', title: 'Weekly Maker Spotlight', status: 'upcoming' },
        { time: '16:00', title: 'The Drive Home', status: 'upcoming' },
    ];

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">Schedules <span className="italic text-brand-olive">& Rotas</span></h2>
                    <p className="text-brand-ink/50 mt-1">Weekly staff attendance and radio broadcast timelines.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10">
                    <Edit3 size={18} /> Edit Rota
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Staff Rota Grid */}
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-brand-olive/5 shadow-sm overflow-hidden p-8 md:p-10">
                    <h3 className="text-2xl font-serif italic text-brand-olive mb-8">Weekly Staff Rota</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-left py-4 px-2 text-[10px] font-bold uppercase tracking-widest text-brand-ink/30 border-b border-brand-olive/5">Staff Member</th>
                                    {days.map(d => (
                                        <th key={d} className="py-4 px-2 text-[10px] font-bold uppercase tracking-widest text-brand-ink/60 border-b border-brand-olive/5">
                                            {d}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map((p, i) => (
                                    <tr key={i} className="group">
                                        <td className="text-left py-6 px-2 border-b border-brand-olive/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-brand-cream border border-brand-olive/10 flex items-center justify-center text-[10px] font-bold text-brand-olive">
                                                    {p.name.split(' ')[0][0]}
                                                </div>
                                                <span className="font-bold text-sm text-brand-ink">{p.name}</span>
                                            </div>
                                        </td>
                                        {p.roles.map((r, ri) => (
                                            <td key={ri} className="py-6 px-2 border-b border-brand-olive/5">
                                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl text-[10px] font-bold transition-all ${r === 'NOW' ? 'bg-brand-olive text-white shadow-md animate-pulse scale-110' :
                                                        r === '✓' ? 'bg-green-50 text-green-600' :
                                                            r === 'VOL' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                                'text-brand-ink/20'
                                                    }`}>
                                                    {r}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-10 flex gap-6">
                        {[
                            { label: 'Staff Shift', mark: '✓', color: 'bg-green-50 text-green-600' },
                            { label: 'Volunteer', mark: 'VOL', color: 'bg-blue-50 text-blue-600' },
                            { label: 'Live Now', mark: 'NOW', color: 'bg-brand-olive text-white' },
                            { label: 'Off Duty', mark: '–', color: 'text-brand-ink/20' },
                        ].map(l => (
                            <div key={l.label} className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-lg font-bold text-[8px] flex items-center justify-center ${l.color}`}>{l.mark}</span>
                                <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Radio Timeline */}
                <div className="bg-white rounded-[40px] p-8 md:p-10 border border-brand-olive/10 shadow-lg shadow-brand-olive/5">
                    <h3 className="text-xl font-serif mb-10 italic text-brand-olive">Radio Timeline</h3>
                    <div className="space-y-0 relative">
                        <div className="absolute left-[3.25rem] top-2 bottom-2 w-px bg-brand-olive/10" />

                        {timeline.map((item, idx) => (
                            <div key={idx} className="flex gap-8 relative pb-10 last:pb-0">
                                <div className="w-10 text-right">
                                    <span className="text-[10px] font-mono font-bold text-brand-ink/30">{item.time}</span>
                                </div>
                                <div className="relative z-10 pt-1">
                                    <div className={`w-2.5 h-2.5 rounded-full ${item.status === 'done' ? 'bg-brand-olive/20' :
                                            item.status === 'now' ? 'bg-brand-olive ring-4 ring-brand-olive/10' :
                                                'bg-white border-2 border-brand-olive/20'
                                        }`} />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-bold ${item.status === 'done' ? 'text-brand-ink/30 line-through' : 'text-brand-ink'}`}>
                                        {item.title}
                                    </h4>
                                    {item.status === 'now' && (
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-olive/10 text-brand-olive text-[10px] font-bold uppercase tracking-widest">
                                            On Air
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
