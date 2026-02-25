import React from 'react';
import { Radio as RadioIcon, Play, Calendar, Clock, Music, Info } from 'lucide-react';
import { motion } from 'motion/react';

export const Radio: React.FC = () => {
  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Community <span className="italic text-brand-olive">Radio</span></h1>
          <p className="text-xl text-brand-ink/70 max-w-2xl">
            Broadcasting local stories, producer spotlights, and the sounds of our community. Powered by Live365.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Player Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-brand-ink text-brand-cream rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-olive/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Live Now</span>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-12 mb-12">
                  <div className="w-48 h-48 bg-brand-olive rounded-3xl flex items-center justify-center shadow-inner overflow-hidden">
                    <img 
                      src="https://picsum.photos/seed/radio/400/400" 
                      alt="Now Playing" 
                      className="w-full h-full object-cover opacity-80"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-4xl md:text-5xl font-serif mb-4">The Morning Harvest</h2>
                    <p className="text-brand-cream/60 text-lg mb-8">with Scott Andrew & Guests</p>
                    <div className="flex items-center justify-center md:justify-start gap-6">
                      <button className="w-20 h-20 rounded-full bg-brand-cream text-brand-ink flex items-center justify-center hover:scale-105 transition-transform">
                        <Play size={32} fill="currentColor" />
                      </button>
                      <div className="h-1 w-32 md:w-64 bg-brand-cream/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '60%' }}
                          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                          className="h-full bg-brand-olive"
                        ></motion.div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-8 border-t border-brand-cream/10 flex flex-wrap gap-8 text-sm opacity-60">
                  <div className="flex items-center gap-2">
                    <Music size={16} />
                    <span>Acoustic Folk Selection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioIcon size={16} />
                    <span>128kbps Stereo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Shows */}
            <div className="bg-white rounded-[32px] p-8 md:p-12 border border-brand-olive/5">
              <h3 className="text-3xl font-serif mb-8 flex items-center gap-4">
                <Calendar className="text-brand-olive" /> Upcoming Shows
              </h3>
              <div className="space-y-6">
                {[
                  { time: '14:00', title: 'Producer Spotlight: Green Valley', host: 'Rachael' },
                  { time: '16:30', title: 'Sustainable Living 101', host: 'Thalia' },
                  { time: '19:00', title: 'Evening Jazz & Roots', host: 'Auto-DJ' },
                ].map((show, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-brand-cream transition-colors group">
                    <div className="text-brand-olive font-bold flex items-center gap-2">
                      <Clock size={16} />
                      <span>{show.time}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{show.title}</h4>
                      <p className="text-sm text-brand-ink/50">Hosted by {show.host}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-olive">
                      <Info size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-brand-olive text-white rounded-[32px] p-8">
              <h3 className="text-2xl font-serif mb-4">Support Our Radio</h3>
              <p className="text-white/70 mb-8 leading-relaxed">
                Our community radio is 100% non-profit. Your donations and memberships keep us on the air.
              </p>
              <button className="w-full py-4 bg-white text-brand-olive rounded-full font-bold hover:bg-brand-cream transition-all">
                Become a Member
              </button>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-brand-olive/5">
              <h3 className="text-2xl font-serif mb-6">Broadcasting Info</h3>
              <div className="space-y-4 text-sm text-brand-ink/70">
                <p>We broadcast 24/7 via Live365. Our programming is focused on local food, community stories, and inclusive education.</p>
                <p>Want to host a show? We provide full training for stroke survivors and people with disabilities.</p>
                <button className="text-brand-olive font-bold mt-4 underline underline-offset-4">Apply to Present</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
