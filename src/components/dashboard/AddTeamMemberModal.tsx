import React, { useState } from 'react';
import { X, User, Mail, Briefcase } from 'lucide-react';
import { StaffMember } from '../../types';

interface Props {
    onClose: () => void;
    onSave: (member: Omit<StaffMember, 'id' | 'joinedAt'>) => void;
}

export const AddTeamMemberModal: React.FC<Props> = ({ onClose, onSave }) => {
    const [form, setForm] = useState({ name: '', role: '', email: '', status: 'active' as StaffMember['status'] });

    const handle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email) return;
        onSave(form);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-serif">Add Team Member</h2>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brand-cream"><X size={20} /></button>
                </div>
                <form onSubmit={handle} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Full Name *</label>
                        <div className="relative">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm"
                                placeholder="Thalia Smith" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Role</label>
                        <div className="relative">
                            <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                            <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm"
                                placeholder="Operations PA" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Email *</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm"
                                placeholder="thalia@farmerstable.org" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Status</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as StaffMember['status'] })}
                            className="w-full px-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none text-sm">
                            <option value="active">Active</option>
                            <option value="on-leave">On Leave</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-brand-olive/20 rounded-full font-bold text-sm">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-brand-olive text-white rounded-full font-bold text-sm">Add Member</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
