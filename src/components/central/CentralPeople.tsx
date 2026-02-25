import React from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, CheckCircle2, Circle, MoreVertical, Search, Filter } from 'lucide-react';

export const CentralPeople: React.FC = () => {
    const staff = [
        { name: "Alice Smith", role: "Café Manager", type: "Staff", status: "Active", initials: "AS" },
        { name: "Tom Baker", role: "Assistant Chef", type: "Staff", status: "Active", initials: "TB" },
        { name: "Sarah Willow", role: "Radio Presenter", type: "Volunteer", status: "Active", initials: "SW" },
        { name: "James Iron", role: "Outreach Lead", type: "Staff", status: "Away", initials: "JI" },
        { name: "Emma Green", role: "Garden Assistant", type: "Volunteer", status: "Active", initials: "EG" },
        { name: "David Cross", role: "Tech Support", type: "Volunteer", status: "On Break", initials: "DC" },
    ];

    const onShift = [
        { name: "Alice Smith", role: "Café Manager", hours: "08:00 - 16:00", status: "Working" },
        { name: "Tom Baker", role: "Assistant Chef", hours: "09:00 - 17:00", status: "Working" },
        { name: "Sarah Willow", role: "Radio Host", hours: "11:00 - 13:00", status: "Live Soon" },
    ];

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">People <span className="italic text-brand-olive">& Directory</span></h2>
                    <p className="text-brand-ink/50 mt-1">Manage staff, volunteers, and today's team.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10">
                    <UserPlus size={18} /> Add Person
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Directory Table */}
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-brand-olive/5 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-brand-olive/5 flex justify-between items-center bg-brand-cream/10">
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-brand-olive/10 w-full max-w-xs">
                            <Search size={16} className="text-brand-ink/30" />
                            <input type="text" placeholder="Search people..." className="bg-transparent border-none text-sm focus:ring-0 w-full" />
                        </div>
                        <button className="p-2 text-brand-ink/40 hover:text-brand-olive"><Filter size={20} /></button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-brand-olive/5">
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">Name</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">Role</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">Type</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">Status</th>
                                    <th className="px-8 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-olive/5">
                                {staff.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-brand-cream/20 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-brand-olive/10 flex items-center justify-center text-[10px] font-bold text-brand-olive">
                                                    {p.initials}
                                                </div>
                                                <span className="font-bold text-sm text-brand-ink">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-brand-ink/60">{p.role}</td>
                                        <td className="px-8 py-5 text-sm">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.type === 'Staff' ? 'bg-blue-50 text-blue-600' : 'bg-brand-olive/10 text-brand-olive/70'
                                                }`}>
                                                {p.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'Active' ? 'bg-green-500' : p.status === 'Away' ? 'bg-red-400' : 'bg-amber-400'
                                                    }`} />
                                                <span className="text-xs text-brand-ink/60">{p.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white rounded-full transition-all">
                                                <MoreVertical size={16} className="text-brand-ink/30" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* On Shift Today */}
                <div className="bg-white rounded-[40px] p-8 border border-brand-olive/10 shadow-lg shadow-brand-olive/5">
                    <h3 className="text-xl font-serif mb-8 flex items-center justify-between">
                        <span>On Shift <span className="italic text-brand-olive">Today</span></span>
                        <span className="text-[10px] font-bold text-brand-olive bg-brand-olive/10 px-2 py-1 rounded-full uppercase tracking-widest">Live</span>
                    </h3>
                    <div className="space-y-6">
                        {onShift.map((s, idx) => (
                            <div key={idx} className="flex gap-4 p-4 rounded-3xl bg-brand-cream/30 border border-brand-olive/5">
                                <div className="w-10 h-10 rounded-2xl bg-brand-olive text-white flex items-center justify-center font-bold text-xs">
                                    {s.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-brand-ink leading-tight">{s.name}</p>
                                    <p className="text-[10px] text-brand-ink/50 uppercase tracking-tight mt-0.5">{s.role}</p>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-olive/5">
                                        <span className="text-[10px] font-mono text-brand-ink/40">{s.hours}</span>
                                        <span className="text-[10px] font-bold text-green-600">{s.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-4 bg-brand-cream text-brand-olive rounded-3xl text-xs font-bold hover:bg-brand-olive/5 transition-all">
                        Full Shift Calendar
                    </button>
                </div>
            </div>
        </div>
    );
};
