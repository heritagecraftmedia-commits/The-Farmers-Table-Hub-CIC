import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Clock, Users, Coins, ClipboardList, Zap, ArrowRight, ShieldCheck,
    Search, Mail, Calendar, Radio, Settings, Map, Package, Bot,
    ShieldAlert, BookOpen, Globe, LayoutDashboard, Database,
    TrendingUp, AlertTriangle, CheckCircle2, MoreVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// Import sub-components
import { CentralOverview } from '../components/central/CentralOverview';
import { CentralSafeMode } from '../components/central/CentralSafeMode';
import { CentralPeople } from '../components/central/CentralPeople';
import { CentralTasks } from '../components/central/CentralTasks';
import { CentralRadio } from '../components/central/CentralRadio';
import { CentralStock } from '../components/central/CentralStock';
import { CentralAdvertisers } from '../components/central/CentralAdvertisers';
import { CentralFinance } from '../components/central/CentralFinance';
import { CentralSchedules } from '../components/central/CentralSchedules';
import { CentralRecords } from '../components/central/CentralRecords';
import { CentralEvents } from '../components/central/CentralEvents';

type CentralTab =
    | 'overview' | 'people' | 'advertisers' | 'stock'
    | 'radio' | 'finance' | 'schedules' | 'tasks'
    | 'records' | 'safemode' | 'events';

export const CommandCenter: React.FC = () => {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<CentralTab>('overview');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const statusChip = (label: string, status: 'live' | 'pending' | 'inactive') => (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-brand-olive/10 shadow-sm">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'live' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-brand-ink/20'
                }`} />
            <span className="text-[10px] font-bold uppercase tracking-tight text-brand-ink/60">{label}</span>
        </div>
    );

    const tabButton = (id: CentralTab, label: string) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === id
                    ? 'bg-brand-olive text-white shadow-md shadow-brand-olive/10'
                    : 'text-brand-ink/50 hover:bg-white/50 hover:text-brand-olive'
                }`}
        >
            {label}
        </button>
    );

    if (loading) return (
        <div className="min-h-screen bg-brand-cream flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-olive/30 border-t-brand-olive rounded-full animate-spin" />
        </div>
    );

    if (!user || (user.role !== 'founder' && user.role !== 'staff')) {
        return <Navigate to="/login" replace state={{ message: 'Access restricted.' }} />;
    }

    return (
        <div className="min-h-screen bg-brand-cream pb-20">
            {/* Header & Status Bar */}
            <div className="bg-white border-b border-brand-olive/10 sticky top-20 z-40">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-bold text-brand-olive bg-brand-olive/10 px-3 py-1 rounded-full">
                                    Central Command
                                </span>
                                <div className="flex gap-2">
                                    {statusChip('Xero', 'live')}
                                    {statusChip('Notion', 'live')}
                                    {statusChip('HubSpot', 'pending')}
                                    {statusChip('Radio FM', 'live')}
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-serif">
                                {getGreeting()}, <span className="italic text-brand-olive">{user.name.split(' ')[0]}</span>
                            </h1>
                            <p className="text-brand-ink/50 mt-2 flex items-center gap-2">
                                <Clock size={14} /> {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Central Command — everything in one place
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide">
                        {tabButton('overview', 'Overview')}
                        {tabButton('safemode', 'Safe Mode')}
                        {tabButton('people', 'People')}
                        {tabButton('tasks', 'Tasks')}
                        {tabButton('radio', 'Radio')}
                        {tabButton('stock', 'Café Stock')}
                        {tabButton('advertisers', 'Advertisers')}
                        {tabButton('finance', 'Finance')}
                        {tabButton('schedules', 'Rotas')}
                        {tabButton('events', 'Events')}
                        {tabButton('records', 'Records')}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 pt-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'overview' && <CentralOverview onNavigate={(tab) => setActiveTab(tab as CentralTab)} />}
                        {activeTab === 'safemode' && <CentralSafeMode />}
                        {activeTab === 'people' && <CentralPeople />}
                        {activeTab === 'tasks' && <CentralTasks />}
                        {activeTab === 'radio' && <CentralRadio />}
                        {activeTab === 'stock' && <CentralStock />}
                        {activeTab === 'advertisers' && <CentralAdvertisers />}
                        {activeTab === 'finance' && <CentralFinance />}
                        {activeTab === 'schedules' && <CentralSchedules />}
                        {activeTab === 'events' && <CentralEvents />}
                        {activeTab === 'records' && <CentralRecords />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};
