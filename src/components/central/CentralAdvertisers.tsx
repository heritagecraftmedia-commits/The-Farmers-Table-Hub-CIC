import React from 'react';
import { motion } from 'motion/react';
import { Store, Radio, Coins, Calendar, ArrowUpRight, Plus, Filter, MoreVertical } from 'lucide-react';

export const CentralAdvertisers: React.FC = () => {
    const advertisers = [
        { name: "Surrey Ironworks", package: "Radio & Directory", type: "Featured", renewal: "Mar 12, 2026", status: "Paid", color: "text-green-600", bg: "bg-green-50" },
        { name: "Local Veg Co.", package: "Radio Spot", type: "Standard", renewal: "Feb 28, 2026", status: "Overdue", color: "text-red-600", bg: "bg-red-50" },
        { name: "The Potters Studio", package: "Directory Tier 2", type: "Premium", renewal: "Mar 05, 2026", status: "Due Soon", color: "text-amber-600", bg: "bg-amber-50" },
        { name: "Rural Candle Co.", package: "Radio & Directory", type: "Standard", renewal: "Feb 26, 2026", status: "Overdue", color: "text-red-600", bg: "bg-red-50" },
        { name: "Farnham Brewery", package: "Sponsorship", type: "Featured", renewal: "Apr 15, 2026", status: "Paid", color: "text-green-600", bg: "bg-green-50" },
    ];

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">Advertisers <span className="italic text-brand-olive">& Listings</span></h2>
                    <p className="text-brand-ink/50 mt-1">Synced with HubSpot · Track revenue and renewals.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10">
                    <Plus size={18} /> New Advertiser
                </button>
            </div>

            <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-brand-olive/5 bg-brand-cream/10 flex justify-between items-center text-sm">
                    <div className="flex gap-4">
                        <button className="font-bold text-brand-olive border-b-2 border-brand-olive">All Partners</button>
                        <button className="font-bold text-brand-ink/40 hover:text-brand-olive">Radio Ads</button>
                        <button className="font-bold text-brand-ink/40 hover:text-brand-olive">Directory</button>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold uppercase tracking-widest flex leading-none">
                            <div className="w-1 h-1 bg-blue-600 rounded-full" /> HubSpot Synced
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
                            {advertisers.map((adv, idx) => (
                                <tr key={idx} className="hover:bg-brand-cream/20 transition-colors group">
                                    <td className="px-8 py-6">
                                        <span className="font-bold text-sm text-brand-ink">{adv.name}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-brand-ink/60 text-xs font-bold">
                                            {adv.package.includes('Radio') ? <Radio size={14} className="text-brand-olive/40" /> : <Store size={14} className="text-brand-olive/40" />}
                                            {adv.package}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">{adv.type}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-xs text-brand-ink/60">
                                            <Calendar size={14} className="text-brand-olive/20" />
                                            {adv.renewal}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${adv.bg} ${adv.color}`}>
                                            <div className={`w-1 h-1 rounded-full ${adv.status === 'Paid' ? 'bg-green-600' : adv.status === 'Overdue' ? 'bg-red-600' : 'bg-amber-600'}`} />
                                            {adv.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white rounded-full transition-all">
                                            <ArrowUpRight size={16} className="text-brand-ink/30" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-8 border-t border-brand-olive/5 bg-brand-cream/5 text-center">
                    <button className="text-sm font-bold text-brand-olive underline underline-offset-8">Download Billing Report (PDF)</button>
                </div>
            </div>
        </div>
    );
};
