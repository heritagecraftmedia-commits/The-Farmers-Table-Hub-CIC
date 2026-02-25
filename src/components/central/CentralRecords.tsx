import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Database, Users, FileText, CheckCircle2, ChevronRight, ExternalLink, RefreshCw, Edit3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CentralRecords: React.FC = () => {
    const notionNotebooks = [
        { name: "Operations Handbook 2026", type: "Wiki", sync: "Synced", time: "2h ago" },
        { name: "Staff Records & HR", type: "Database", sync: "Synced", time: "1d ago" },
        { name: "Radio Station Logbook", type: "Timeline", sync: "Live", time: "Now" },
        { name: "Café Stock Inventories", type: "DB Table", sync: "Synced", time: "4h ago" },
        { name: "Meeting Notes & Agendas", type: "Notes", sync: "Synced", time: "2h ago" },
    ];

    const hubspotItems = [
        { label: "Contacts", value: "47", sub: "+3 this week" },
        { label: "Active Deals", value: "8", sub: "Potential Ads" },
        { label: "Pending Tasks", value: "3", sub: "Follow-ups" },
        { label: "New Leads", value: "12", sub: "Makers waiting" },
    ];

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">Records <span className="italic text-brand-olive">& Integration</span></h2>
                    <p className="text-brand-ink/50 mt-1">External records and CRM synchronization.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 border border-brand-olive/20 text-brand-olive rounded-full text-sm font-bold bg-white hover:bg-brand-olive/5 transition-all">
                        Force Full Sync <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Notion Workspace */}
                <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm p-8 md:p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
                                <span className="font-bold text-xl">N</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif">Notion <span className="italic text-brand-olive">Workspace</span></h3>
                                <p className="text-xs text-brand-ink/40 font-bold uppercase tracking-widest">Main Operations Hub</p>
                            </div>
                        </div>
                        <button className="p-3 bg-brand-cream rounded-2xl text-brand-olive hover:bg-brand-olive hover:text-white transition-all">
                            <ExternalLink size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {notionNotebooks.map((nb, idx) => (
                            <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-brand-cream/10 border border-brand-olive/5 group hover:border-brand-olive/15 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-brand-olive/40 border border-brand-olive/5">
                                        {nb.type === 'Wiki' ? <BookOpen size={18} /> : nb.type === 'Timeline' ? <RefreshCw size={18} /> : <FileText size={18} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-brand-ink group-hover:text-brand-olive transition-colors">{nb.name}</h4>
                                        <p className="text-[10px] text-brand-ink/40 font-bold uppercase tracking-tighter">{nb.type} · {nb.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-green-600 hidden md:block">{nb.sync}</span>
                                    <ChevronRight size={14} className="text-brand-ink/20 group-hover:text-brand-olive transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-8 text-center text-xs text-brand-ink/30 italic">Notion databases are synced daily with this command center.</p>
                </div>

                {/* HubSpot CRM */}
                <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm p-8 md:p-10 flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#ff7a59] text-white rounded-2xl flex items-center justify-center">
                                <Database size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif">HubSpot <span className="italic text-brand-olive">CRM</span></h3>
                                <p className="text-xs text-brand-ink/40 font-bold uppercase tracking-widest">Growth & Partner Data</p>
                            </div>
                        </div>
                        <button className="p-3 bg-brand-cream rounded-2xl text-brand-olive hover:bg-brand-olive hover:text-white transition-all">
                            <ExternalLink size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 flex-1 mb-10">
                        {hubspotItems.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-brand-cream/20 p-6 rounded-[32px] border border-brand-olive/5 flex flex-col justify-center"
                            >
                                <p className="text-4xl font-serif text-brand-olive mb-1">{item.value}</p>
                                <p className="text-sm font-bold text-brand-ink/80">{item.label}</p>
                                <p className="text-xs text-brand-ink/40 mt-1">{item.sub}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="bg-brand-olive p-8 rounded-[40px] text-brand-cream">
                        <div className="flex justify-between items-start mb-6">
                            <h4 className="text-lg font-serif italic">Recent HubSpot Pulse</h4>
                            <div className="p-2 bg-white/10 rounded-xl"><CheckCircle2 size={16} /></div>
                        </div>
                        <p className="text-sm leading-relaxed opacity-80">
                            You have 3 partner renewals due next week. HubSpot has automatically set reminders in your task list.
                        </p>
                        <button className="mt-6 text-xs font-bold uppercase tracking-widest underline underline-offset-8">Open Sales Dashboard</button>
                    </div>
                </div>
            </div>

            {/* Internal Drafts Section */}
            <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm p-8 md:p-12 mt-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive">
                        <Edit3 size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-brand- ink">Internal <span className="italic text-brand-olive">Drafting Spaces</span></h3>
                        <p className="text-sm text-brand-ink/40">Private session-based editors for founder notes.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/changes" className="flex items-center justify-between p-6 bg-brand-cream/20 rounded-3xl border border-brand-olive/5 hover:border-brand-olive/20 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-olive">
                                <Edit3 size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-brand-ink group-hover:text-brand-olive transition-colors">Project Changes</h4>
                                <p className="text-xs text-brand-ink/40">Draft updates & structural shifts</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-brand-ink/20 group-hover:text-brand-olive transition-all" />
                    </Link>
                    <Link to="/notes" className="flex items-center justify-between p-6 bg-brand-cream/20 rounded-3xl border border-brand-olive/5 hover:border-brand-olive/20 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-olive">
                                <FileText size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-brand-ink group-hover:text-brand-olive transition-colors">Community Notes</h4>
                                <p className="text-xs text-brand-ink/40">Personal thoughts & content drafting</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-brand-ink/20 group-hover:text-brand-olive transition-all" />
                    </Link>
                </div>
            </div>
        </div>
    );
};
