import React, { useState, useEffect } from 'react';
import { Settings, LogOut, Star, Calendar, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface MemberProfile {
  id: string;
  full_name?: string;
  role?: string;
  bio?: string;
  joined_at?: string;
}

export const Members: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [eventsCount, setEventsCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileData) setProfile(profileData);

      const { count } = await supabase
        .from('event_makers')
        .select('*', { count: 'exact', head: true })
        .eq('maker_id', user.id);
      setEventsCount(count ?? 0);
    };

    fetchData();
  }, [user]);

  // Auth guard — after all hooks
  if (loading) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-olive/30 border-t-brand-olive rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  const displayName = profile?.full_name || user.name || 'Member';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const tierLabel =
    user.role === 'founder' ? 'Founder' :
    user.role === 'staff' ? 'Team Member' :
    'Community Member';

  const joinedYear = profile?.joined_at
    ? new Date(profile.joined_at).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <h1 className="text-5xl md:text-7xl font-serif mb-6">Members <span className="italic text-brand-olive">Area</span></h1>
            <p className="text-xl text-brand-ink/70 max-w-2xl">
              Welcome back! Here you can manage your membership, access exclusive content, and connect with the community.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 rounded-full bg-white border border-brand-olive/10 text-brand-ink/60 hover:text-brand-olive transition-all">
              <Settings size={20} />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm text-center">
              <div className="w-32 h-32 rounded-full bg-brand-olive/10 border-4 border-brand-cream shadow-lg flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-brand-olive">{initials}</span>
              </div>
              <h3 className="text-2xl font-serif mb-2">{displayName}</h3>
              <p className="text-sm font-bold uppercase tracking-widest text-brand-olive/60 mb-1">{tierLabel}</p>
              <p className="text-xs text-brand-ink/40 mb-8">Member since {joinedYear}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-brand-cream/50 rounded-2xl">
                  <span className="block font-bold text-lg">{eventsCount}</span>
                  <span className="opacity-50">Events Linked</span>
                </div>
                <div className="p-4 bg-brand-cream/50 rounded-2xl">
                  <span className="block font-bold text-lg">—</span>
                  <span className="opacity-50">Coming Soon</span>
                </div>
              </div>
            </div>

            {user.role === 'customer' && (
              <div className="bg-brand-olive text-brand-cream p-8 rounded-[40px] shadow-xl">
                <h4 className="text-xl font-serif mb-4 flex items-center gap-2">
                  <Star size={20} fill="currentColor" /> Upgrade
                </h4>
                <p className="text-sm opacity-80 leading-relaxed mb-6">
                  Become a Supporter to unlock early event access, featured listings, and more.
                </p>
                <a
                  href="/subscriptions"
                  className="block w-full py-3 bg-white text-brand-olive rounded-full font-bold text-sm text-center"
                >
                  See Plans
                </a>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 md:p-12 rounded-[40px] border border-brand-olive/5 shadow-sm"
            >
              <h3 className="text-3xl font-serif mb-8">Recent Activity</h3>
              <div className="space-y-8">
                {eventsCount > 0 ? (
                  <div className="flex gap-6 items-start">
                    <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center text-brand-olive shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Linked to {eventsCount} event{eventsCount !== 1 ? 's' : ''}</h4>
                      <p className="text-sm opacity-50">via the makers directory</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-6 items-start">
                    <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center text-brand-olive/40 shrink-0">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-brand-ink/40">No activity yet</h4>
                      <p className="text-sm opacity-50">Your activity will appear here as you engage with the community.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 md:p-12 rounded-[40px] border border-brand-olive/5 shadow-sm"
            >
              <h3 className="text-3xl font-serif mb-4">Member Downloads</h3>
              <p className="text-sm text-brand-ink/40 mb-6">Resources will appear here once published.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Seasonal Recipe Book', 'Community Radio Guide', 'Local Map (Printable)', 'Impact Report 2024'].map(doc => (
                  <div
                    key={doc}
                    className="p-4 bg-brand-cream/50 rounded-2xl text-left font-medium flex justify-between items-center opacity-40 cursor-not-allowed"
                  >
                    {doc}
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Soon</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
