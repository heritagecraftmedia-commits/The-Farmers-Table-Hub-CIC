import React from 'react';
import { User, Settings, LogOut, Star, Calendar, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

export const Members: React.FC = () => {
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
            <button className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 border-4 border-brand-cream shadow-lg">
                <img src="https://picsum.photos/seed/member/400/400" alt="Member" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-2xl font-serif mb-2">Alex Community</h3>
              <p className="text-sm font-bold uppercase tracking-widest text-brand-olive/60 mb-8">Premium Supporter</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-brand-cream/50 rounded-2xl">
                  <span className="block font-bold text-lg">12</span>
                  <span className="opacity-50">Events Attended</span>
                </div>
                <div className="p-4 bg-brand-cream/50 rounded-2xl">
                  <span className="block font-bold text-lg">24</span>
                  <span className="opacity-50">Local Purchases</span>
                </div>
              </div>
            </div>

            <div className="bg-brand-olive text-brand-cream p-8 rounded-[40px] shadow-xl">
              <h4 className="text-xl font-serif mb-4 flex items-center gap-2">
                <Star size={20} fill="currentColor" /> Exclusive Perk
              </h4>
              <p className="text-sm opacity-80 leading-relaxed mb-6">
                As a Premium Supporter, you have early access to our upcoming "Harvest Festival" tickets.
              </p>
              <button className="w-full py-3 bg-white text-brand-olive rounded-full font-bold text-sm">
                Claim Early Access
              </button>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-[40px] border border-brand-olive/5 shadow-sm">
              <h3 className="text-3xl font-serif mb-8">Recent Activity</h3>
              <div className="space-y-8">
                {[
                  { icon: <Calendar size={20} />, title: 'RSVP confirmed for Radio Workshop', time: '2 hours ago' },
                  { icon: <MessageSquare size={20} />, title: 'New comment on your producer review', time: 'Yesterday' },
                  { icon: <Star size={20} />, title: 'Earned "Local Hero" badge', time: '3 days ago' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center text-brand-olive shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{item.title}</h4>
                      <p className="text-sm opacity-50">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[40px] border border-brand-olive/5 shadow-sm">
              <h3 className="text-3xl font-serif mb-8">Member Downloads</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Seasonal Recipe Book', 'Community Radio Guide', 'Local Map (Printable)', 'Impact Report 2024'].map(doc => (
                  <button key={doc} className="p-4 bg-brand-cream/50 rounded-2xl text-left hover:bg-brand-olive/5 transition-all font-medium flex justify-between items-center">
                    {doc}
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">PDF</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
