import React, { useEffect, useState } from 'react';
import { Store, Radio, Calendar, ArrowUpRight, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

import { getAllAdverts } from '../../services/radio/stationService';
import { ADVERT_PACKAGES } from '../../services/radio/types';
import type { RadioAdvert } from '../../services/radio/types';

// This view previously listed five invented businesses with invented payment
// statuses. It now reads the real radio_sponsors records created in the Radio
// Control Centre, and shows an honest empty state when there are none.
const renewalTone = (advert: RadioAdvert): { label: string; color: string; bg: string; dot: string } => {
    if (advert.contentStatus === 'archived') return { label: 'Archived', color: 'text-brand-ink/50', bg: 'bg-brand-ink/5', dot: 'bg-brand-ink/30' };
    if (advert.runState === 'paused') return { label: 'Paused', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-600' };
    if (advert.runState === 'expired') return { label: 'Expired', color: 'text-brand-ink/50', bg: 'bg-brand-ink/5', dot: 'bg-brand-ink/30' };
    if (advert.contentStatus === 'published') return { label: 'Live', color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-600' };
    return { label: 'Draft', color: 'text-brand-ink/60', bg: 'bg-brand-ink/5', dot: 'bg-brand-ink/30' };
};

const formatDate = (value: string | null) =>
    value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';

export const CentralAdvertisers: React.FC = () => {
    const [advertisers, setAdvertisers] = useState<RadioAdvert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getAllAdverts()
            .then((rows) => { if (!cancelled) setAdvertisers(rows); })
            .catch((loadError) => {
                console.error('CentralAdvertisers:', loadError);
                if (!cancelled) setError('Advertiser records could not be loaded.');
            })
            .finally(() => { if (!cancelled) setIsLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">Advertisers <span className="italic text-brand-olive">& Listings</span></h2>
                    <p className="text-brand-ink/50 mt-1">Real advertiser records from the radio system. Track packages and renewals.</p>
                </div>
                <Link to="/radio/control" className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10">
                    Manage in Radio Control Centre <ArrowUpRight size={18} />
                </Link>
            </div>

            <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-brand-olive/5 bg-brand-cream/10 flex justify-between items-center text-sm">
                    <div className="flex gap-4">
                        <button className="font-bold text-brand-olive border-b-2 border-brand-olive">All Partners</button>
                        <button className="font-bold text-brand-ink/40 hover:text-brand-olive">Radio Ads</button>
                        <button className="font-bold text-brand-ink/40 hover:text-brand-olive">Directory</button>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] items-center gap-1.5 px-3 py-1 rounded-full bg-brand-olive/10 text-brand-olive font-bold uppercase tracking-widest flex leading-none">
                            <div className="w-1 h-1 bg-brand-olive rounded-full" /> Live data
                        </span>
                        <button className="p-2 text-brand-ink/40 hover:text-brand-olive"><Filter size={18} /></button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-brand-olive/5">
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">Business</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">Package</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">Tier</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">Renewal</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">Payment</th>
                                <th className="px-8 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-olive/5">
                            {isLoading && (
                                <tr><td colSpan={6} className="px-8 py-10 text-center text-sm text-brand-ink/50">Loading advertisers…</td></tr>
                            )}
                            {!isLoading && error && (
                                <tr><td colSpan={6} className="px-8 py-10 text-center text-sm text-brand-ink/60">{error}</td></tr>
                            )}
                            {!isLoading && !error && advertisers.length === 0 && (
                                <tr><td colSpan={6} className="px-8 py-10 text-center text-sm text-brand-ink/60">
                                    No advertisers yet. Real local businesses are added in the Radio Control Centre — none are invented here.
                                </td></tr>
                            )}
                            {advertisers.map((adv) => {
                                const tone = renewalTone(adv);
                                const pkg = ADVERT_PACKAGES.find(p => p.value === adv.package)?.label ?? adv.package;
                                return (
                                <tr key={adv.id} className="hover:bg-brand-cream/20 transition-colors group">
                                    <td className="px-8 py-6">
                                        <span className="font-bold text-sm text-brand-ink">{adv.businessName}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-brand-ink/60 text-xs font-bold">
                                            {adv.package.includes('sponsor') ? <Store size={14} className="text-brand-olive/40" /> : <Radio size={14} className="text-brand-olive/40" />}
                                            {pkg}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">{adv.category ?? '—'}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-xs text-brand-ink/60">
                                            <Calendar size={14} className="text-brand-olive/20" />
                                            {formatDate(adv.renewalDate ?? adv.endDate)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${tone.bg} ${tone.color}`}>
                                            <div className={`w-1 h-1 rounded-full ${tone.dot}`} />
                                            {tone.label}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Link to="/radio/control" aria-label={`Manage ${adv.businessName} in the Radio Control Centre`} className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 hover:bg-white rounded-full transition-all inline-block">
                                            <ArrowUpRight size={16} className="text-brand-ink/30" />
                                        </Link>
                                    </td>
                                </tr>
                            );})}
                        </tbody>
                    </table>
                </div>
                <div className="p-8 border-t border-brand-olive/5 bg-brand-cream/5 text-center text-xs text-brand-ink/45">
                    Package and renewal details come from the radio advertising records. Invoicing is handled outside this system.
                </div>
            </div>
        </div>
    );
};
