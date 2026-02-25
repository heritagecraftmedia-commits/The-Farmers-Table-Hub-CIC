import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Plus, CheckCircle2, Circle, MoreVertical, Trash2 } from 'lucide-react';

export const CentralTasks: React.FC = () => {
    const [tasks, setTasks] = useState([
        { id: 1, title: "Review Radio Ad Slots for next week", assigned: "Sarah W.", dept: "Radio", priority: "HIGH", done: false },
        { id: 2, title: "Order new espresso cups for the café", assigned: "Alice S.", dept: "Café", priority: "MED", done: false },
        { id: 3, title: "Update Makers Hub member guide PDF", assigned: "James I.", dept: "Ops", priority: "LOW", done: false },
        { id: 4, title: "Call cleaner regarding floor polishing", assigned: "Scott P.", dept: "Facilities", priority: "HIGH", done: false },
        { id: 5, title: "Draft community newsletter", assigned: "Emma G.", dept: "Marketing", priority: "MED", done: false },
    ]);

    const [completedTasks] = useState([
        { id: 101, title: "Stock take for Feb completed", assigned: "Tom B.", dept: "Facilities", priority: "LOW", done: true },
        { id: 102, title: "Radio FM signal test", assigned: "David C.", dept: "Radio", priority: "HIGH", done: true },
    ]);

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">Tasks <span className="italic text-brand-olive">& Operations</span></h2>
                    <p className="text-brand-ink/50 mt-1">Tracked in Notion · Assigned to team.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10">
                    <Plus size={18} /> Add Task
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    {/* Active Tasks */}
                    <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm overflow-hidden p-8 md:p-10">
                        <h3 className="text-xl font-serif mb-8 italic text-brand-olive">Open Tasks</h3>
                        <div className="space-y-4">
                            <AnimatePresence>
                                {tasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${task.done ? 'bg-brand-cream/20 opacity-50 border-transparent scale-[0.98]' : 'bg-white border-brand-olive/5 hover:border-brand-olive/20 shadow-sm'
                                            }`}
                                    >
                                        <button
                                            onClick={() => toggleTask(task.id)}
                                            className="flex-shrink-0 text-brand-olive/30 hover:text-brand-olive transition-colors"
                                        >
                                            {task.done ? <CheckCircle2 size={24} className="text-brand-olive" /> : <Circle size={24} />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-base font-bold truncate ${task.done ? 'line-through text-brand-ink/40' : 'text-brand-ink'}`}>
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                                                <span className="text-[10px] font-bold text-brand-ink/30 uppercase tracking-tighter whitespace-nowrap">{task.assigned} · {task.dept}</span>
                                                <div className="h-2 w-px bg-brand-olive/10" />
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : task.priority === 'MED' ? 'bg-amber-50 text-amber-600' : 'bg-brand-cream text-brand-olive/60'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <button className="p-2 text-brand-ink/20 hover:text-brand-olive"><MoreVertical size={18} /></button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Recently Completed */}
                    <div className="bg-brand-cream/10 rounded-[40px] border border-brand-olive/5 p-8 md:p-10">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-brand-ink/30 mb-6">Completed Recently</h3>
                        <div className="space-y-3">
                            {completedTasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-brand-olive/5 opacity-60 grayscale">
                                    <CheckCircle2 size={20} className="text-brand-olive/40" />
                                    <p className="text-sm font-bold text-brand-ink line-through">{task.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Sidebar */}
                <div className="space-y-8">
                    <div className="bg-brand-olive text-brand-cream p-8 rounded-[40px] shadow-lg">
                        <h4 className="text-lg font-serif mb-6 italic">Operations Stats</h4>
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { label: "Completion Rate", value: "84%" },
                                { label: "Overdue", value: "2" },
                                { label: "Active Team", value: "6" },
                                { label: "Avg. Duration", value: "2.4d" },
                            ].map(stat => (
                                <div key={stat.label}>
                                    <p className="text-2xl font-serif">{stat.value}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-brand-olive/10 shadow-sm">
                        <h4 className="text-lg font-serif mb-6 italic text-brand-olive">Weekly Outlook</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-brand-ink/60">Urgent Repairs</span>
                                <span className="text-xs font-bold text-red-600">3 due</span>
                            </div>
                            <div className="w-full h-1.5 bg-brand-cream rounded-full overflow-hidden">
                                <div className="h-full bg-red-400 w-2/3" />
                            </div>
                            <div className="flex items-center justify-between mt-6">
                                <span className="text-sm text-brand-ink/60">Admin Reviews</span>
                                <span className="text-xs font-bold text-brand-olive">5 due</span>
                            </div>
                            <div className="w-full h-1.5 bg-brand-cream rounded-full overflow-hidden">
                                <div className="h-full bg-brand-olive w-1/3" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
