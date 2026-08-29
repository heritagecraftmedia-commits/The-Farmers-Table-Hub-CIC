import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, AlertCircle } from 'lucide-react';
import { hubService } from '../../services/hubService';
import { StaffMember } from '../../types';
import { EmptyState } from '../EmptyState';

/**
 * People & Directory.
 *
 * Previously listed six invented colleagues — "Alice Smith, Café Manager",
 * "Sarah Willow, Radio Presenter" and so on — plus a "Today's Shift" panel
 * showing three of them clocked in. None of these people exist. A staff
 * screen that invents staff is indistinguishable from a real one to anyone
 * who did not write it.
 *
 * There is a real `staff` table and `hubService.getStaff()` already reads it,
 * so this now shows the actual team and an explicit empty state when nobody
 * has been added yet.
 *
 * The "Today's Shift" panel is not restored: rota data has no table behind it
 * (see CentralSchedules), so there is nothing truthful to render.
 */
export const CentralPeople: React.FC = () => {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const rows = await hubService.getStaff();
                if (active) setStaff(rows);
            } catch {
                if (active) setError('Could not load the team list.');
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    const statusLabel = (s: StaffMember['status']) =>
        s === 'active' ? 'Active' : s === 'on-leave' ? 'On Leave' : 'Inactive';

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">People <span className="italic text-brand-olive">&amp; Directory</span></h2>
                    <p className="text-brand-ink/50 mt-1">Staff and volunteers recorded for the CIC.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10">
                    <UserPlus size={18} /> Add Person
                </button>
            </div>

            <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-brand-cream/60 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="p-10 flex items-center gap-3 text-sm text-brand-ink/60">
                        <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                        {error}
                    </div>
                ) : staff.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No team members recorded yet"
                        description="Staff and volunteers will be listed here once they have been added."
                        note="Use “Add Person” to create the first record."
                    />
                ) : (
                    <div className="divide-y divide-brand-olive/5">
                        {staff.map((person, idx) => (
                            <motion.div
                                key={person.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(idx, 8) * 0.04 }}
                                className="flex items-center justify-between gap-4 px-8 py-6 hover:bg-brand-cream/20 transition-colors"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-11 h-11 flex-shrink-0 rounded-2xl bg-brand-cream flex items-center justify-center text-xs font-bold text-brand-olive">
                                        {person.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-brand-ink truncate">{person.name}</h4>
                                        <p className="text-[10px] text-brand-ink/40 uppercase font-bold tracking-widest truncate">
                                            {person.role || 'Role not set'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 flex-shrink-0">
                                    {statusLabel(person.status)}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
