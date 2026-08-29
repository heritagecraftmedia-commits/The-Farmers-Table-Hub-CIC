import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Plus, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { hubService } from '../../services/hubService';
import { FounderJob } from '../../types';
import { EmptyState } from '../EmptyState';

/**
 * Tasks & Operations.
 *
 * Previously held seven invented tasks assigned to invented colleagues
 * ("Order new espresso cups — Alice S.", "Radio FM signal test — David C."),
 * held in component state so ticking one off changed nothing and survived
 * nowhere. The header also claimed the list was "Tracked in Notion"; there is
 * no Notion integration in this application.
 *
 * `founder_jobs` is a real table and `hubService.getFounderJobs()` already
 * reads it, so the list is now genuine and completing a task persists.
 */
export const CentralTasks: React.FC = () => {
    const [jobs, setJobs] = useState<FounderJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const rows = await hubService.getFounderJobs();
                if (active) setJobs(rows);
            } catch {
                if (active) setError('Could not load tasks.');
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    const complete = async (id: string) => {
        const previous = jobs;
        setJobs(js => js.map(j => (j.id === id ? { ...j, status: 'completed' } : j)));
        try {
            await hubService.completeJob(id);
        } catch {
            setJobs(previous);            // put it back rather than lie about it
            setError('That task could not be updated. Please try again.');
        }
    };

    const open = jobs.filter(j => j.status !== 'completed');
    const done = jobs.filter(j => j.status === 'completed');

    const priorityClass = (p: FounderJob['priority']) =>
        p === 'High' ? 'text-red-600' : p === 'Medium' ? 'text-amber-600' : 'text-brand-ink/40';

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">Tasks <span className="italic text-brand-olive">&amp; Operations</span></h2>
                    <p className="text-brand-ink/50 mt-1">Founder job list for the CIC.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10">
                    <Plus size={18} /> Add Task
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-amber-50 text-sm text-brand-ink/70">
                    <AlertCircle size={18} className="text-amber-600 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-brand-cream/60 rounded-3xl animate-pulse" />)}
                    </div>
                ) : jobs.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="No tasks recorded yet"
                        description="Jobs added to the founder task list will appear here."
                        note="Use “Add Task” to create the first one."
                    />
                ) : (
                    <div className="p-8 md:p-10 space-y-8">
                        <div>
                            <h3 className="text-xl font-serif mb-6 italic text-brand-olive">
                                Open Tasks {open.length > 0 && <span className="not-italic text-brand-ink/30 text-sm">({open.length})</span>}
                            </h3>
                            {open.length === 0 ? (
                                <p className="text-sm text-brand-ink/40">Nothing outstanding.</p>
                            ) : (
                                <div className="space-y-3">
                                    {open.map((job, idx) => (
                                        <motion.div
                                            key={job.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(idx, 8) * 0.04 }}
                                            className="flex items-center gap-4 p-5 rounded-3xl bg-brand-cream/10 border border-brand-olive/5"
                                        >
                                            <button
                                                onClick={() => complete(job.id)}
                                                aria-label={`Mark "${job.task}" complete`}
                                                className="text-brand-olive/30 hover:text-brand-olive transition-colors flex-shrink-0"
                                            >
                                                <Circle size={20} />
                                            </button>
                                            <p className="flex-1 text-sm font-bold text-brand-ink min-w-0">{job.task}</p>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest flex-shrink-0 ${priorityClass(job.priority)}`}>
                                                {job.priority}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {done.length > 0 && (
                            <div>
                                <h3 className="text-xl font-serif mb-6 italic text-brand-olive/50">Completed</h3>
                                <div className="space-y-3">
                                    {done.map(job => (
                                        <div key={job.id} className="flex items-center gap-4 p-5 rounded-3xl bg-brand-cream/5 opacity-60">
                                            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                                            <p className="flex-1 text-sm text-brand-ink/60 line-through min-w-0">{job.task}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
