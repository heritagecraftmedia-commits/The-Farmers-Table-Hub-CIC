import React from 'react';
import { motion } from 'motion/react';
import {
    TrendingUp, Users, Coins, ClipboardList, Plus,
    Clock, AlertCircle, Database, LayoutDashboard, Radio
} from 'lucide-react';

export const CentralOverview: React.FC = () => {
    const stats = [
        { label: "Active People", value: "12", sub: "Staff & Volunteers", icon: <Users size={20} /> },
        { label: "Monthly Income", value: "£3.4k", sub: "Radio & Directory", icon: <Coins size={20} /> },
        { label: "Advertisers", value: "9", sub: "Live campaigns", icon: <Radio size={20} /> },
        { label: "Open Tasks", value: "5", sub: "Assigned to team", icon: <ClipboardList size={20} /> },
    ];

    const schedule = [
        { time: "09:00", status: "done", title: "Café Opening & Stock Check", meta: "Staff: Alice & Tom" },
        { time: "11:30", status: "now", title: "Surrey Hills Morning Live", meta: "Presenter: Sarah Willow" },
        { time: "14:00", status: "upcoming", title: "Maker Spotlight Interview", meta: "Guest: Thomas Ironworks" },
        { time: "16:30", status: "upcoming", title: "Inventory Delivery", meta: "Supplier: Local Dairy" },
    ];

    const urgentTasks = [
        { title: "Review Overdue Radio Ad Invoices", priority: "HIGH", assigned: "Finance" },
        { title: "Approve 3 New Directory Drafts", priority: "MED", assigned: "Ops" },
        { title: "Update Staff Rota for Weekend", priority: "MED", assigned: "Admin" },
    ];

    const systems = [
        { name: "Xero", status: "synced" },
        { name: "Notion", status: "synced" },
        { name: "HubSpot", status: "pending" },
        { name: "Live365", status: "synced" },
    ];

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm"
                    >
                        <div className="w-10 h-10 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive mb-4">
                            {stat.icon}
                        </div>
                        <p className="text-3xl font-serif text-brand-olive">{stat.value}</p>
                        <p className="text-sm font-bold mt-1">{stat.label}</p>
                        <p className="text-xs text-brand-ink/40 mt-1">{stat.sub}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                {['Add Person', 'Log Stock', 'Add Task', 'New Note'].map(action => (
                    <button key={action} className="px-6 py-3 bg-white border border-brand-olive/10 text-brand-olive rounded-full text-sm font-bold hover:bg-brand-olive/5 transition-all shadow-sm flex items-center gap-2">
                        <Plus size={16} /> {action}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Today's Schedule */}
                <div className="lg:col-span-2 bg-white rounded-[40px] p-8 border border-brand-olive/5 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-serif italic text-brand-olive">Today's Schedule</h3>
                        <button className="p-2 hover:bg-brand-cream rounded-full"><Clock size={18} className="text-brand-ink/40" /></button>
                    </div>
                    <div className="space-y-8">
                        {schedule.map((slot, idx) => (
                            <div key={idx} className="flex gap-6 relative">
                                <div className="w-16 pt-1">
                                    <span className="text-xs font-bold font-mono text-brand-ink/40">{slot.time}</span>
                                </div>
                                <div className="relative flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-full z-10 ${slot.status === 'done' ? 'bg-green-500' : slot.status === 'now' ? 'bg-brand-olive animate-pulse' : 'bg-brand-cream border-2 border-brand-olive/20'
                                        }`} />
                                    {idx !== schedule.length - 1 && <div className="w-px h-full bg-brand-olive/10 absolute top-3" />}
                                </div>
                                <div className="flex-1 pb-6">
                                    <h4 className={`font-bold ${slot.status === 'done' ? 'text-brand-ink/40 line-through' : 'text-brand-ink'}`}>{slot.title}</h4>
                                    <p className="text-xs text-brand-ink/50 mt-1">{slot.meta}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar panels */}
                <div className="space-y-8">
                    {/* Urgent Actions */}
                    <div className="bg-white rounded-[40px] p-8 border border-brand-olive/5 shadow-sm">
                        <h3 className="text-xl font-serif mb-6">Urgent Actions</h3>
                        <div className="space-y-4">
                            {urgentTasks.map((task, idx) => (
                                <div key={idx} className="p-4 bg-brand-cream/30 rounded-2xl border border-brand-olive/5 group hover:border-brand-olive/20 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                            }`}>{task.priority}</span>
                                        <span className="text-[10px] font-bold text-brand-ink/30 uppercase tracking-tight">{task.assigned}</span>
                                    </div>
                                    <p className="text-sm font-bold text-brand-ink/80 group-hover:text-brand-olive transition-colors">{task.title}</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 border border-dashed border-brand-olive/20 rounded-2xl text-xs font-bold text-brand-olive hover:bg-brand-olive/5 transition-all">
                            View All Tasks
                        </button>
                    </div>

                    {/* Connected Systems */}
                    <div className="bg-white rounded-[40px] p-8 border border-brand-olive/5 shadow-sm">
                        <h3 className="text-xl font-serif mb-6">Connected Systems</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {systems.map(system => (
                                <div key={system.name} className="flex items-center justify-between p-3 bg-brand-cream/20 rounded-xl">
                                    <span className="text-xs font-bold text-brand-ink/70">{system.name}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${system.status === 'synced' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-amber-500 animate-pulse'}`} title={system.status} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
