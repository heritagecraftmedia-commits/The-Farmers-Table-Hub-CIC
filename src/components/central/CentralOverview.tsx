import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, ClipboardList, Plus, Radio, Edit3, FileText, Store, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { hubService } from '../../services/hubService';
import { radioService, RadioBroadcast } from '../../services/radioService';
import { FounderJob, StaffMember, SponsorRotation, HubEvent } from '../../types';

interface CentralOverviewProps {
    /** Supplied by CommandCenter to switch tabs. */
    onNavigate?: (tab: string) => void;
}

/**
 * Command Centre overview.
 *
 * Everything here previously came from hardcoded literals — "12 Active People",
 * "£3.4k Monthly Income", "9 Advertisers", a fabricated day's schedule, three
 * invented urgent tasks, and four integrations all showing green "synced" dots.
 * A founder dashboard presenting invented figures as real is a bad failure
 * mode: it invites decisions based on numbers nobody produced.
 *
 * Every figure below is now read from the database, and anything not wired up
 * says so rather than showing a plausible number.
 */
export const CentralOverview: React.FC<CentralOverviewProps> = ({ onNavigate }) => {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [jobs, setJobs] = useState<FounderJob[]>([]);
    const [sponsors, setSponsors] = useState<SponsorRotation[]>([]);
    const [listingCount, setListingCount] = useState(0);
    const [broadcasts, setBroadcasts] = useState<RadioBroadcast[]>([]);
    const [events, setEvents] = useState<HubEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            try {
                const [s, j, sp, listings, ev] = await Promise.all([
                    hubService.getStaff(),
                    hubService.getFounderJobs(),
                    hubService.getSponsors(),
                    hubService.getListings(),
                    hubService.getEvents(),
                ]);
                // Radio is a separate service and may not be provisioned yet;
                // a failure there must not blank the whole overview.
                let bc: RadioBroadcast[] = [];
                try { bc = await radioService.getUpcomingBroadcasts(6); } catch { bc = []; }

                if (!active) return;
                setStaff(s); setJobs(j); setSponsors(sp);
                setListingCount(listings.length); setEvents(ev); setBroadcasts(bc);
            } catch (err) {
                if (active) setError(err instanceof Error ? err.message : 'Could not load overview data.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, []);

    const openJobs = jobs.filter(j => j.status === 'pending');
    const urgentJobs = [...openJobs].sort((a, b) => {
        const rank = { High: 0, Medium: 1, Low: 2 } as const;
        return rank[a.priority] - rank[b.priority];
    }).slice(0, 4);

    const stats = [
        { label: 'Active People', value: String(staff.filter(m => m.status === 'active').length), sub: 'Staff & volunteers', icon: <Users size={20} />, tab: 'people' },
        { label: 'Directory Listings', value: String(listingCount), sub: 'Published businesses', icon: <Store size={20} />, tab: 'records' },
        { label: 'Active Advertisers', value: String(sponsors.filter(s => s.status === 'active').length), sub: 'Live radio campaigns', icon: <Radio size={20} />, tab: 'advertisers' },
        { label: 'Open Tasks', value: String(openJobs.length), sub: 'Not yet completed', icon: <ClipboardList size={20} />, tab: 'tasks' },
    ];

    // Today's radio broadcasts and approved events, merged into one timeline.
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay); endOfDay.setDate(endOfDay.getDate() + 1);
    const inToday = (iso?: string) => {
        if (!iso) return false;
        const d = new Date(iso);
        return d >= startOfDay && d < endOfDay;
    };

    const schedule = [
        ...broadcasts.filter(b => inToday(b.startsAt)).map(b => ({
            at: new Date(b.startsAt), title: b.title, meta: `Radio · ${b.broadcastType}`, live: b.status === 'live',
        })),
        ...events.filter(e => e.approved && inToday(e.startDate)).map(e => ({
            at: new Date(e.startDate), title: e.title, meta: e.venue || e.location || 'Event', live: false,
        })),
    ].sort((a, b) => a.at.getTime() - b.at.getTime());

    // Only claim an integration is connected when its credential is actually
    // present. These used to be hardcoded green dots; hubService's Xero /
    // HubSpot / Notion helpers still return placeholder data and perform no
    // real fetch, so nothing here is genuinely syncing yet.
    const systems = [
        { name: 'Supabase', connected: Boolean(import.meta.env.VITE_SUPABASE_URL?.includes('supabase.co')) },
        { name: 'Stripe', connected: Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) },
        { name: 'Discord', connected: Boolean(import.meta.env.VITE_DISCORD_SERVER_ID) },
        { name: 'Live365', connected: Boolean(import.meta.env.VITE_LIVE365_PLAYER_URL) },
    ];

    const card = 'bg-white rounded-[40px] p-8 border border-brand-olive/5 shadow-sm';

    if (loading) {
        return (
            <div className="py-24 flex justify-center">
                <div className="w-8 h-8 border-2 border-brand-olive/30 border-t-brand-olive rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {error && (
                <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <motion.button
                        key={stat.label}
                        type="button"
                        onClick={() => onNavigate?.(stat.tab)}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm text-left hover:border-brand-olive/20 transition-all"
                    >
                        <div className="w-10 h-10 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive mb-4">
                            {stat.icon}
                        </div>
                        <p className="text-3xl font-serif text-brand-olive">{stat.value}</p>
                        <p className="text-sm font-bold mt-1">{stat.label}</p>
                        <p className="text-xs text-brand-ink/40 mt-1">{stat.sub}</p>
                    </motion.button>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <Link to="/changes" className="px-6 py-3 bg-white border border-brand-olive/10 text-brand-olive rounded-full text-sm font-bold hover:bg-brand-olive/5 transition-all shadow-sm flex items-center gap-2">
                    <Edit3 size={16} /> Edit Changes
                </Link>
                <Link to="/notes" className="px-6 py-3 bg-white border border-brand-olive/10 text-brand-olive rounded-full text-sm font-bold hover:bg-brand-olive/5 transition-all shadow-sm flex items-center gap-2">
                    <FileText size={16} /> Draft Notes
                </Link>
                {([
                    { action: 'Add Person', tab: 'people' },
                    { action: 'Log Stock', tab: 'stock' },
                    { action: 'Add Task', tab: 'tasks' },
                ]).map(({ action, tab }) => (
                    <button
                        key={action}
                        onClick={() => onNavigate?.(tab)}
                        className="px-6 py-3 bg-white border border-brand-olive/10 text-brand-ink/60 rounded-full text-sm font-bold hover:bg-brand-olive/5 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Plus size={16} /> {action}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Today's Schedule */}
                <div className={`lg:col-span-2 ${card}`}>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-serif italic text-brand-olive">Today's Schedule</h3>
                        <span className="text-xs font-bold text-brand-ink/30 uppercase tracking-widest">
                            {startOfDay.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                    {schedule.length === 0 ? (
                        <p className="py-10 text-center text-sm text-brand-ink/40">
                            Nothing scheduled today. Broadcasts and approved events appear here.
                        </p>
                    ) : (
                        <div className="space-y-8">
                            {schedule.map((slot, idx) => (
                                <div key={`${slot.title}-${idx}`} className="flex gap-6 relative">
                                    <div className="w-16 pt-1">
                                        <span className="text-xs font-bold font-mono text-brand-ink/40">
                                            {slot.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="relative flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full z-10 ${slot.live ? 'bg-brand-olive animate-pulse' : 'bg-brand-cream border-2 border-brand-olive/20'}`} />
                                        {idx !== schedule.length - 1 && <div className="w-px h-full bg-brand-olive/10 absolute top-3" />}
                                    </div>
                                    <div className="flex-1 pb-6">
                                        <h4 className="font-bold text-brand-ink">{slot.title}</h4>
                                        <p className="text-xs text-brand-ink/50 mt-1">{slot.meta}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar panels */}
                <div className="space-y-8">
                    {/* Urgent Actions */}
                    <div className={card}>
                        <h3 className="text-xl font-serif mb-6">Urgent Actions</h3>
                        {urgentJobs.length === 0 ? (
                            <p className="py-6 text-center text-sm text-brand-ink/40">No open tasks.</p>
                        ) : (
                            <div className="space-y-4">
                                {urgentJobs.map(task => (
                                    <button
                                        key={task.id}
                                        type="button"
                                        onClick={() => onNavigate?.('tasks')}
                                        className="w-full text-left p-4 bg-brand-cream/30 rounded-2xl border border-brand-olive/5 group hover:border-brand-olive/20 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-brand-cream text-brand-ink/50'}`}>
                                                {task.priority.toUpperCase()}
                                            </span>
                                            {task.dueDate && (
                                                <span className="text-[10px] font-bold text-brand-ink/30 uppercase tracking-tight">{task.dueDate}</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-brand-ink/80 group-hover:text-brand-olive transition-colors">{task.task}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => onNavigate?.('tasks')}
                            className="w-full mt-6 py-3 border border-dashed border-brand-olive/20 rounded-2xl text-xs font-bold text-brand-olive hover:bg-brand-olive/5 transition-all"
                        >
                            View All Tasks
                        </button>
                    </div>

                    {/* Connected Systems */}
                    <div className={card}>
                        <h3 className="text-xl font-serif mb-2">Connected Systems</h3>
                        <p className="text-[11px] text-brand-ink/40 mb-5">
                            Based on which credentials are configured.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {systems.map(system => (
                                <div key={system.name} className="flex items-center justify-between p-3 bg-brand-cream/20 rounded-xl">
                                    <span className="text-xs font-bold text-brand-ink/70">{system.name}</span>
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full ${system.connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-brand-ink/20'}`}
                                        title={system.connected ? 'Configured' : 'Not configured'}
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-brand-ink/40 mt-4">
                            Xero, HubSpot and Notion are not wired up — those helpers still
                            return placeholder data and perform no real fetch.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
