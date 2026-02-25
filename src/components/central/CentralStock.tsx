import React from 'react';
import { motion } from 'motion/react';
import { Package, AlertTriangle, CheckCircle2, ShoppingCart, Truck, MoreVertical } from 'lucide-react';

export const CentralStock: React.FC = () => {
    const stockStats = [
        { label: "Critical", value: "3", color: "text-red-600", bg: "bg-red-50" },
        { label: "Low Stock", value: "5", color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Good Stock", value: "18", color: "text-green-600", bg: "bg-green-50" },
        { label: "Next Delivery", value: "Tomorrow", color: "text-blue-600", bg: "bg-blue-50" },
    ];

    const stockItems = [
        { name: "Organic Whole Milk", category: "Dairy", quantity: "4/24 units", progress: 15, status: "Critical" },
        { name: "Artisan Coffee Beans", category: "Dry Goods", quantity: "2/10 kg", progress: 20, status: "Low" },
        { name: "Sourdough Flour", category: "Dry Goods", quantity: "15/50 kg", progress: 30, status: "Low" },
        { name: "Local Salted Butter", category: "Dairy", quantity: "12/20 units", progress: 60, status: "Good" },
        { name: "Oat Milk (Barista)", category: "Dairy", quantity: "40/48 units", progress: 95, status: "Good" },
    ];

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">Café Stock <span className="italic text-brand-olive">& Inventory</span></h2>
                    <p className="text-brand-ink/50 mt-1">Real-time inventory levels from the café floor.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10">
                    <Truck size={18} /> Log Delivery
                </button>
            </div>

            {/* Stock Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stockStats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm"
                    >
                        <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                            {stat.label === 'Critical' ? <AlertTriangle size={16} /> : stat.label === 'Next Delivery' ? <Truck size={16} /> : <Package size={16} />}
                        </div>
                        <p className={`text-3xl font-serif ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs font-bold text-brand-ink/40 uppercase tracking-widest mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-brand-olive/5 bg-brand-cream/10 flex justify-between items-center">
                    <h3 className="text-xl font-serif italic text-brand-olive">Inventory Status</h3>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-brand-olive/10 rounded-full text-xs font-bold text-brand-ink/60">Filter by Dept</button>
                        <button className="px-4 py-2 bg-white border border-brand-olive/10 rounded-full text-xs font-bold text-brand-ink/60">Search Stock</button>
                    </div>
                </div>
                <div className="p-8">
                    <div className="space-y-8">
                        {stockItems.map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h4 className="font-bold text-brand-ink">{item.name}</h4>
                                        <p className="text-[10px] text-brand-ink/40 uppercase tracking-tight">{item.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${item.status === 'Critical' ? 'bg-red-50 text-red-600' : item.status === 'Low' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {item.status}
                                        </span>
                                        <p className="text-xs font-mono text-brand-ink/60 mt-1">{item.quantity}</p>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-brand-cream rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.progress}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className={`h-full rounded-full ${item.status === 'Critical' ? 'bg-red-500' : item.status === 'Low' ? 'bg-amber-500' : 'bg-green-500'
                                            }`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-12 py-4 border border-dashed border-brand-olive/20 rounded-3xl text-sm font-bold text-brand-olive hover:bg-brand-olive/5 transition-all">
                        View Full Inventory Audit
                    </button>
                </div>
            </div>
        </div>
    );
};
