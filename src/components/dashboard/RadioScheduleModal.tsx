import React, { useState } from 'react';
import { X, Radio } from 'lucide-react';
import { RadioShow } from '../../types';

interface Props {
    show: RadioShow;
    onClose: () => void;
    onSave: (updated: RadioShow) => void;
}

export const RadioScheduleModal: React.FC<Props> = ({ show, onClose, onSave }) => {
    const [form, setForm] = useState({ ...show });

    const handle = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-brand-cream text-brand-olive">
                            <Radio size={20} />
                        </div>
                        <h2 className="text-2xl font-serif">Edit Show</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brand-cream"><X size={20} /></button>
                </div>
                <form onSubmit={handle} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Show Title *</label>
                        <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                            className="w-full px-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm"
                            placeholder="Morning Maker Melodies" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Host</label>
                        <input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })}
                            className="w-full px-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm"
                            placeholder="Scott" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Schedule</label>
                        <input value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })}
                            className="w-full px-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm"
                            placeholder="Mon-Fri 08:00 - 10:00" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Status</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as RadioShow['status'] })}
                            className="w-full px-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none text-sm">
                            <option value="live">🔴 Live Now</option>
                            <option value="planned">📅 Planned</option>
                            <option value="recorded">🎙️ Recorded / On-Demand</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Last Broadcast Date</label>
                        <input type="date" value={form.lastBroadcast || ''} onChange={e => setForm({ ...form, lastBroadcast: e.target.value })}
                            className="w-full px-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm" />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-brand-olive/20 rounded-full font-bold text-sm">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-brand-olive text-white rounded-full font-bold text-sm">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
