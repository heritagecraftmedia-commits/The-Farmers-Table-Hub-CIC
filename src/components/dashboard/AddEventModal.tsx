import React, { useState } from 'react';
import { X, Calendar, MapPin, Globe, Info } from 'lucide-react';
import { HubEvent } from '../../types';

interface Props {
    onClose: () => void;
    onSave: (event: Omit<HubEvent, 'id' | 'createdAt'>) => void;
}

export const AddEventModal: React.FC<Props> = ({ onClose, onSave }) => {
    const [form, setForm] = useState({
        title: '', description: '', startDate: '', endDate: '',
        location: '', venue: '', websiteUrl: '', source: 'Manual', approved: true,
    });

    const handle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.startDate) return;
        onSave(form);
        onClose();
    };

    const Field = ({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) => (
        <div>
            <label className="block text-sm font-bold text-brand-ink/60 mb-2">{label}</label>
            <div className={Icon ? 'relative' : ''}>
                {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />}
                {children}
            </div>
        </div>
    );

    const inputCls = (hasIcon = true) =>
        `w-full ${hasIcon ? 'pl-10' : 'px-4'} pr-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm`;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-lg shadow-2xl my-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-serif">Add Event Manually</h2>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brand-cream"><X size={20} /></button>
                </div>
                <form onSubmit={handle} className="space-y-4">
                    <Field label="Event Title *" icon={Info}>
                        <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                            className={inputCls()} placeholder="Artisan Market Day" />
                    </Field>

                    <Field label="Description">
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            rows={3} className={`${inputCls(false)} resize-none`} placeholder="A wonderful gathering of local makers..." />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Start Date & Time *" icon={Calendar}>
                            <input required type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                                className={inputCls()} />
                        </Field>
                        <Field label="End Date & Time" icon={Calendar}>
                            <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                                className={inputCls()} />
                        </Field>
                    </div>

                    <Field label="City / Area" icon={MapPin}>
                        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                            className={inputCls()} placeholder="Farnham, Surrey" />
                    </Field>

                    <Field label="Venue Name">
                        <input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })}
                            className={inputCls(false)} placeholder="Market Square" />
                    </Field>

                    <Field label="Website URL" icon={Globe}>
                        <input type="url" value={form.websiteUrl} onChange={e => setForm({ ...form, websiteUrl: e.target.value })}
                            className={inputCls()} placeholder="https://example.com/event" />
                    </Field>

                    <div className="flex items-center gap-3 pt-2">
                        <input type="checkbox" id="approved" checked={form.approved} onChange={e => setForm({ ...form, approved: e.target.checked })}
                            className="w-4 h-4 accent-brand-olive" />
                        <label htmlFor="approved" className="text-sm text-brand-ink/70">Approve immediately (publish to What's On)</label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-brand-olive/20 rounded-full font-bold text-sm">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-brand-olive text-white rounded-full font-bold text-sm">Add Event</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
