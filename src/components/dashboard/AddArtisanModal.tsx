import React, { useState } from 'react';
import { X, User, MapPin, Tag, Link, FileText } from 'lucide-react';
import { RawLead } from '../../types';

interface Props {
    onClose: () => void;
    onSave: (lead: Omit<RawLead, 'id' | 'discoveredAt'>) => void;
}

export const AddArtisanModal: React.FC<Props> = ({ onClose, onSave }) => {
    const [form, setForm] = useState({
        displayName: '', categoryHint: '', locationHint: '',
        sourcePlatform: 'Manual', profileUrl: '', bioText: '',
    });

    const handle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.displayName) return;
        onSave(form);
        onClose();
    };

    const inputCls = 'w-full pl-10 pr-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm';

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-lg shadow-2xl my-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-serif">Add Artisan Manually</h2>
                        <p className="text-xs text-brand-ink/50 mt-1">Adds directly to your discovery pipeline</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brand-cream"><X size={20} /></button>
                </div>
                <form onSubmit={handle} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Artisan / Business Name *</label>
                        <div className="relative">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                            <input required value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
                                className={inputCls} placeholder="Farnham Ironworks" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-brand-ink/60 mb-2">Craft Category</label>
                            <div className="relative">
                                <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                                <input value={form.categoryHint} onChange={e => setForm({ ...form, categoryHint: e.target.value })}
                                    className={inputCls} placeholder="Blacksmithing" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-brand-ink/60 mb-2">Location</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                                <input value={form.locationHint} onChange={e => setForm({ ...form, locationHint: e.target.value })}
                                    className={inputCls} placeholder="Farnham, Surrey" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Platform / Source</label>
                        <select value={form.sourcePlatform} onChange={e => setForm({ ...form, sourcePlatform: e.target.value })}
                            className="w-full px-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none text-sm">
                            {['Manual', 'Instagram', 'Facebook', 'YouTube', 'Website', 'Market', 'Referral', 'Other'].map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Profile / Website URL</label>
                        <div className="relative">
                            <Link size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                            <input type="url" value={form.profileUrl} onChange={e => setForm({ ...form, profileUrl: e.target.value })}
                                className={inputCls} placeholder="https://instagram.com/farnhamironworks" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Bio / Description</label>
                        <div className="relative">
                            <FileText size={16} className="absolute left-4 top-3 text-brand-ink/30" />
                            <textarea value={form.bioText} onChange={e => setForm({ ...form, bioText: e.target.value })}
                                rows={3} className="w-full pl-10 pr-4 py-3 bg-brand-cream/50 rounded-2xl border border-brand-olive/10 focus:outline-none focus:ring-2 focus:ring-brand-olive/20 text-sm resize-none"
                                placeholder="Hand-forged ironwork made in Surrey..." />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-brand-olive/20 rounded-full font-bold text-sm">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-brand-olive text-white rounded-full font-bold text-sm">Add to Pipeline</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
