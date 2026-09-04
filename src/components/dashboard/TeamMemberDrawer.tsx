import React, { useState } from 'react';
import { X, Calendar, Clock, Coins } from 'lucide-react';
import { StaffMember } from '../../types';
import { EmptyState } from '../EmptyState';

/**
 * Team member drawer.
 *
 * This is the most consequential of the invented-data screens, because the
 * fabrications were attached to a REAL person: the drawer is opened for an
 * actual `staff` row, showing their real name, role and email, and then
 * presented alongside them:
 *
 *   - MOCK_PAYROLL — three months of pay at "£14.50/hr", totals near
 *     "£2,436.00", exportable to CSV as `payroll_<their name>.csv`
 *   - MOCK_ROTA — three shifts they never worked
 *   - MOCK_HOLIDAYS — leave requests they never made, including one
 *     annotated "Family holiday", which a manager could approve or reject
 *   - "160 hrs" this month and "18 days left" holiday balance
 *
 * A downloadable payroll CSV bearing a real employee's name and invented
 * hours is a payroll record that could be acted on. All of it is removed.
 *
 * What is kept: the drawer, the tabs, the real fields from the staff record,
 * and Remove from Team — which is genuine and writes to the database. The
 * rota, holiday and payroll tabs now say plainly that nothing is recorded,
 * because no rota, leave or payroll table exists in the schema.
 */

interface Props { member: StaffMember; onClose: () => void; onRemove: (id: string) => void; }

export const TeamMemberDrawer: React.FC<Props> = ({ member, onClose, onRemove }) => {
    const [tab, setTab] = useState<'overview' | 'rota' | 'holiday' | 'payroll'>('overview');

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
                <div className="p-8 border-b border-brand-cream sticky top-0 bg-white z-10">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-14 h-14 flex-shrink-0 bg-brand-cream rounded-full flex items-center justify-center text-brand-olive font-bold text-xl">
                                {member.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-2xl font-serif truncate">{member.name}</h2>
                                <p className="text-sm text-brand-ink/50 truncate">
                                    {member.role} · <span className={member.status === 'active' ? 'text-green-600' : 'text-brand-ink/30'}>{member.status}</span>
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-brand-cream">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-6">
                        {(['overview', 'rota', 'holiday', 'payroll'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all capitalize ${tab === t ? 'bg-brand-olive text-white' : 'text-brand-ink/50 hover:bg-brand-cream'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-8 flex-1">
                    {tab === 'overview' && (
                        <div className="space-y-6">
                            {/* Only fields that actually exist on the staff record. */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-brand-cream/50 p-4 rounded-2xl">
                                    <p className="text-xs text-brand-ink/40 mb-1">Email</p>
                                    <p className="text-sm font-bold break-all">{member.email || '—'}</p>
                                </div>
                                <div className="bg-brand-cream/50 p-4 rounded-2xl">
                                    <p className="text-xs text-brand-ink/40 mb-1">Joined</p>
                                    <p className="text-sm font-bold">{member.joinedAt || '—'}</p>
                                </div>
                            </div>

                            <p className="text-xs text-brand-ink/35 leading-relaxed">
                                Hours, holiday balance and pay are not tracked in this system yet.
                            </p>

                            <button
                                onClick={() => {
                                    if (confirm(`Remove ${member.name} from the team?`)) { onRemove(member.id); onClose(); }
                                }}
                                className="w-full py-3 border border-red-100 text-red-500 rounded-full font-bold text-sm hover:bg-red-50 transition-colors"
                            >
                                Remove from Team
                            </button>
                        </div>
                    )}

                    {tab === 'rota' && (
                        <EmptyState
                            compact
                            icon={Calendar}
                            title="No shifts recorded"
                            description="Shift patterns for this person will appear here once rota scheduling is built."
                            comingSoon
                        />
                    )}

                    {tab === 'holiday' && (
                        <EmptyState
                            compact
                            icon={Clock}
                            title="No holiday recorded"
                            description="Leave requests and remaining allowance will appear here once holiday tracking is built."
                            comingSoon
                        />
                    )}

                    {tab === 'payroll' && (
                        <EmptyState
                            compact
                            icon={Coins}
                            title="No payroll records"
                            description="Pay history for this person will appear here once payroll is connected."
                            comingSoon
                            note="Payroll is not processed in this application."
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
