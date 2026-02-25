import React, { useState } from 'react';
import { X, Calendar, Clock, Download, CheckCircle, XCircle, Plus } from 'lucide-react';
import { StaffMember } from '../../types';

interface RotaEntry { id: string; date: string; shiftStart: string; shiftEnd: string; type: 'regular' | 'overtime'; }
interface HolidayRequest { id: string; startDate: string; endDate: string; days: number; status: 'pending' | 'approved' | 'rejected'; notes: string; }
interface PayrollMonth { month: string; hours: number; overtime: number; rate: number; total: string; }

const MOCK_ROTA: RotaEntry[] = [
    { id: '1', date: '2026-02-24', shiftStart: '09:00', shiftEnd: '17:00', type: 'regular' },
    { id: '2', date: '2026-02-25', shiftStart: '09:00', shiftEnd: '19:00', type: 'overtime' },
    { id: '3', date: '2026-02-26', shiftStart: '10:00', shiftEnd: '16:00', type: 'regular' },
];

const MOCK_HOLIDAYS: HolidayRequest[] = [
    { id: '1', startDate: '2026-03-10', endDate: '2026-03-14', days: 5, status: 'pending', notes: 'Family holiday' },
    { id: '2', startDate: '2026-04-01', endDate: '2026-04-02', days: 2, status: 'approved', notes: 'Long weekend' },
];

const MOCK_PAYROLL: PayrollMonth[] = [
    { month: 'Feb 2026', hours: 160, overtime: 8, rate: 14.50, total: '£2,436.00' },
    { month: 'Jan 2026', hours: 168, overtime: 0, rate: 14.50, total: '£2,436.00' },
    { month: 'Dec 2025', hours: 152, overtime: 12, rate: 14.50, total: '£2,465.00' },
];

interface Props { member: StaffMember; onClose: () => void; onRemove: (id: string) => void; }

export const TeamMemberDrawer: React.FC<Props> = ({ member, onClose, onRemove }) => {
    const [tab, setTab] = useState<'overview' | 'rota' | 'holiday' | 'payroll'>('overview');
    const [holidays, setHolidays] = useState(MOCK_HOLIDAYS);
    const [showAddRota, setShowAddRota] = useState(false);
    const [newShift, setNewShift] = useState({ date: '', shiftStart: '09:00', shiftEnd: '17:00', type: 'regular' as const });
    const [rota, setRota] = useState(MOCK_ROTA);

    const downloadPayroll = (month?: string) => {
        const data = month ? MOCK_PAYROLL.filter(p => p.month === month) : MOCK_PAYROLL;
        const csv = ['Month,Hours,Overtime,Rate,Total', ...data.map(p => `${p.month},${p.hours},${p.overtime},£${p.rate},${p.total}`)].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `payroll_${member.name.replace(' ', '_')}${month ? '_' + month.replace(' ', '_') : '_all'}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const updateHoliday = (id: string, status: 'approved' | 'rejected') => {
        setHolidays(prev => prev.map(h => h.id === id ? { ...h, status } : h));
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-brand-cream sticky top-0 bg-white z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-brand-cream rounded-full flex items-center justify-center text-brand-olive font-bold text-xl">
                                {member.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-serif">{member.name}</h2>
                                <p className="text-sm text-brand-ink/50">{member.role} · <span className={member.status === 'active' ? 'text-green-500' : 'text-brand-ink/30'}>{member.status}</span></p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brand-cream"><X size={20} /></button>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-2 mt-6">
                        {(['overview', 'rota', 'holiday', 'payroll'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all capitalize ${tab === t ? 'bg-brand-olive text-white' : 'text-brand-ink/50 hover:bg-brand-cream'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-8 flex-1">
                    {/* OVERVIEW */}
                    {tab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-brand-cream/50 p-4 rounded-2xl">
                                    <p className="text-xs text-brand-ink/40 mb-1">Email</p>
                                    <p className="text-sm font-bold break-all">{member.email}</p>
                                </div>
                                <div className="bg-brand-cream/50 p-4 rounded-2xl">
                                    <p className="text-xs text-brand-ink/40 mb-1">Joined</p>
                                    <p className="text-sm font-bold">{member.joinedAt}</p>
                                </div>
                                <div className="bg-brand-cream/50 p-4 rounded-2xl">
                                    <p className="text-xs text-brand-ink/40 mb-1">Hours This Month</p>
                                    <p className="text-sm font-bold">160 hrs</p>
                                </div>
                                <div className="bg-brand-cream/50 p-4 rounded-2xl">
                                    <p className="text-xs text-brand-ink/40 mb-1">Holiday Balance</p>
                                    <p className="text-sm font-bold">18 days left</p>
                                </div>
                            </div>
                            <button onClick={() => downloadPayroll()} className="w-full py-3 bg-brand-cream text-brand-olive rounded-full font-bold text-sm flex items-center justify-center gap-2">
                                <Download size={16} /> Download All Payroll Records
                            </button>
                            <button onClick={() => { if (confirm(`Remove ${member.name} from the team?`)) { onRemove(member.id); onClose(); } }}
                                className="w-full py-3 border border-red-100 text-red-400 rounded-full font-bold text-sm hover:bg-red-50">
                                Remove from Team
                            </button>
                        </div>
                    )}

                    {/* ROTA */}
                    {tab === 'rota' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-serif text-lg">Shift Schedule</h3>
                                <button onClick={() => setShowAddRota(!showAddRota)} className="flex items-center gap-1 text-xs font-bold text-brand-olive"><Plus size={14} /> Add Shift</button>
                            </div>
                            {showAddRota && (
                                <div className="bg-brand-cream/50 p-4 rounded-2xl space-y-3">
                                    <input type="date" value={newShift.date} onChange={e => setNewShift({ ...newShift, date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-brand-olive/10 text-sm bg-white" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="time" value={newShift.shiftStart} onChange={e => setNewShift({ ...newShift, shiftStart: e.target.value })}
                                            className="px-3 py-2 rounded-xl border border-brand-olive/10 text-sm bg-white" />
                                        <input type="time" value={newShift.shiftEnd} onChange={e => setNewShift({ ...newShift, shiftEnd: e.target.value })}
                                            className="px-3 py-2 rounded-xl border border-brand-olive/10 text-sm bg-white" />
                                    </div>
                                    <select value={newShift.type} onChange={e => setNewShift({ ...newShift, type: e.target.value as any })}
                                        className="w-full px-3 py-2 rounded-xl border border-brand-olive/10 text-sm bg-white">
                                        <option value="regular">Regular</option>
                                        <option value="overtime">Overtime</option>
                                    </select>
                                    <button onClick={() => { if (newShift.date) { setRota(prev => [...prev, { ...newShift, id: Math.random().toString(36).substr(2, 6) }]); setShowAddRota(false); setNewShift({ date: '', shiftStart: '09:00', shiftEnd: '17:00', type: 'regular' }); } }}
                                        className="w-full py-2 bg-brand-olive text-white rounded-full text-sm font-bold">Save Shift</button>
                                </div>
                            )}
                            {rota.map(entry => (
                                <div key={entry.id} className="bg-white border border-brand-cream p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-brand-olive" />
                                        <div>
                                            <p className="text-sm font-bold">{new Date(entry.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                            <p className="text-xs text-brand-ink/40">{entry.shiftStart} – {entry.shiftEnd}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${entry.type === 'overtime' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                        {entry.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* HOLIDAY */}
                    {tab === 'holiday' && (
                        <div className="space-y-4">
                            <h3 className="font-serif text-lg mb-2">Holiday Requests</h3>
                            {holidays.map(req => (
                                <div key={req.id} className="bg-white border border-brand-cream p-5 rounded-2xl">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-sm">{new Date(req.startDate).toLocaleDateString('en-GB')} – {new Date(req.endDate).toLocaleDateString('en-GB')}</p>
                                            <p className="text-xs text-brand-ink/40">{req.days} days · {req.notes}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${req.status === 'approved' ? 'bg-green-50 text-green-600' : req.status === 'rejected' ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    {req.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => updateHoliday(req.id, 'approved')} className="flex-1 py-2 flex items-center justify-center gap-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">
                                                <CheckCircle size={14} /> Approve
                                            </button>
                                            <button onClick={() => updateHoliday(req.id, 'rejected')} className="flex-1 py-2 flex items-center justify-center gap-1 bg-red-50 text-red-500 rounded-full text-xs font-bold">
                                                <XCircle size={14} /> Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PAYROLL */}
                    {tab === 'payroll' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-serif text-lg">Payroll Records</h3>
                                <button onClick={() => downloadPayroll()} className="flex items-center gap-1 text-xs font-bold text-brand-olive">
                                    <Download size={14} /> Download All
                                </button>
                            </div>
                            {MOCK_PAYROLL.map(p => (
                                <div key={p.month} className="bg-white border border-brand-cream p-5 rounded-2xl">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="font-bold">{p.month}</p>
                                        <span className="text-lg font-serif text-brand-olive">{p.total}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="text-center bg-brand-cream/50 p-2 rounded-xl">
                                            <p className="text-xs text-brand-ink/40">Reg Hours</p>
                                            <p className="text-sm font-bold">{p.hours}</p>
                                        </div>
                                        <div className="text-center bg-brand-cream/50 p-2 rounded-xl">
                                            <p className="text-xs text-brand-ink/40">Overtime</p>
                                            <p className="text-sm font-bold">{p.overtime}</p>
                                        </div>
                                        <div className="text-center bg-brand-cream/50 p-2 rounded-xl">
                                            <p className="text-xs text-brand-ink/40">Rate/hr</p>
                                            <p className="text-sm font-bold">£{p.rate}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => downloadPayroll(p.month)} className="w-full py-2 flex items-center justify-center gap-1 border border-brand-olive/20 text-brand-olive rounded-full text-xs font-bold">
                                        <Download size={12} /> Download {p.month}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
