import React from 'react';
import { motion } from 'motion/react';
import { Coins, TrendingUp, TrendingDown, Clock, ExternalLink, ChevronRight, FileText } from 'lucide-react';

export const CentralFinance: React.FC = () => {
    const financeStats = [
        { label: "This Month", value: "£3,420", trend: "+12%", up: true, icon: <TrendingUp size={16} /> },
        { label: "Outstanding", value: "£640", trend: "4 bills", up: false, icon: <FileText size={16} /> },
        { label: "Expenses", value: "£1,150", trend: "-5%", up: false, icon: <TrendingDown size={16} /> },
        { label: "Overdue", value: "£240", trend: "2 urgent", up: true, icon: <Clock size={16} /> },
    ];

    const recentInvoices = [
        { id: "INV-0842", client: "Surrey Hills Radio", amount: "£450.00", status: "Paid", color: "text-green-600" },
        { id: "INV-0841", client: "Local Veg Co.", amount: "£120.00", status: "Overdue", color: "text-red-600" },
        { id: "INV-0840", client: "Farnham Brewery", amount: "£280.00", status: "Paid", color: "text-green-600" },
        { id: "INV-0839", client: "Rural Candle Co.", amount: "£120.00", status: "Unpaid", color: "text-amber-600" },
    ];

    const breakdown = [
        { label: "Radio Advertising", percentage: 53, amount: "£1,812" },
        { label: "Café Sales", percentage: 36, amount: "£1,231" },
        { label: "Grants & Donations", percentage: 11, amount: "£377" },
    ];

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">Finance <span className="italic text-brand-olive">& Xero Overview</span></h2>
                    <p className="text-brand-ink/50 mt-1">Ethical income tracking for the CIC.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10 transition-transform active:scale-95">
                    Open Xero <ExternalLink size={16} />
                </button>
            </div>

            {/* Finance Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {financeStats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm"
                    >
                        <div className="w-10 h-10 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive mb-4">
                            {stat.icon}
                        </div>
                        <p className="text-3xl font-serif text-brand-olive">{stat.value}</p>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-xs font-bold text-brand-ink/40 uppercase tracking-widest">{stat.label}</p>
                            <span className={`text-[10px] font-bold ${stat.up && stat.label !== 'Overdue' ? 'text-green-600' : 'text-amber-600'}`}>{stat.trend}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Recent Invoices */}
                <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm p-8 md:p-10">
                    <h3 className="text-2xl font-serif italic text-brand-olive mb-8">Recent Invoices</h3>
                    <div className="space-y-4">
                        {recentInvoices.map((inv, idx) => (
                            <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-brand-cream/10 border border-brand-olive/5 group hover:border-brand-olive/15 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xs font-mono font-bold text-brand-ink/30 border border-brand-olive/5">
                                        #
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-brand-ink">{inv.client}</h4>
                                        <p className="text-[10px] text-brand-ink/40 uppercase font-bold tracking-tight">{inv.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-brand-ink">{inv.amount}</p>
                                    <span className={`text-[10px] font-bold uppercase ${inv.color}`}>{inv.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-10 py-4 bg-brand-cream/50 text-brand-olive font-bold text-xs rounded-3xl hover:bg-brand-olive/5 transition-all flex items-center justify-center gap-2">
                        View All Transactions <ChevronRight size={14} />
                    </button>
                </div>

                {/* Income Breakdown */}
                <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm p-8 md:p-10">
                    <h3 className="text-2xl font-serif mb-10">Income Breakdown</h3>
                    <div className="space-y-8">
                        {breakdown.map((item, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h4 className="font-bold text-sm text-brand-ink">{item.label}</h4>
                                        <p className="text-[10px] text-brand-ink/40 font-bold uppercase tracking-widest">{item.percentage}% of total</p>
                                    </div>
                                    <p className="text-lg font-serif italic text-brand-olive">{item.amount}</p>
                                </div>
                                <div className="w-full h-2.5 bg-brand-cream rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.percentage}%` }}
                                        transition={{ duration: 1.2, delay: idx * 0.1 }}
                                        className="h-full bg-brand-olive rounded-full"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 p-6 rounded-3xl bg-brand-olive text-brand-cream flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Total CIC Assets</p>
                            <h4 className="text-2xl font-serif italic">£14,842.50</h4>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
