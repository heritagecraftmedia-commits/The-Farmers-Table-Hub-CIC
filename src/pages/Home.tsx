import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Radio, MapPin, Users, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-block px-4 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-sm font-bold uppercase tracking-widest mb-6"
            >
              Farnham Community Interest Company
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-serif text-brand-ink leading-[0.9] mb-8"
            >
              Connecting <span className="italic">Local</span> Food & <span className="italic text-brand-olive">Community</span> Radio
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-brand-ink/70 mb-12 leading-relaxed max-w-2xl"
            >
              The Farmers Table Hub is a social enterprise dedicated to strengthening local food systems and providing inclusive employment for our community.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-6"
            >
              <Link 
                to="/directory" 
                className="px-8 py-4 bg-brand-olive text-white rounded-full font-bold flex items-center gap-2 hover:bg-brand-olive/90 transition-all shadow-lg shadow-brand-olive/20"
              >
                Find Local Producers <ArrowRight size={20} />
              </Link>
              <Link 
                to="/radio" 
                className="px-8 py-4 bg-white text-brand-olive border border-brand-olive/20 rounded-full font-bold flex items-center gap-2 hover:bg-brand-cream transition-all"
              >
                Listen to Radio <Radio size={20} />
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Background Image/Shape */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none hidden lg:block">
          <img 
            src="https://picsum.photos/seed/farm/1000/1000" 
            alt="Farm" 
            className="w-full h-full object-cover rounded-l-[100px]"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive">
                <MapPin size={32} />
              </div>
              <h3 className="text-3xl font-serif">Local Directory</h3>
              <p className="text-brand-ink/70 leading-relaxed text-lg">
                Discover the best food producers in and around Farnham. From organic farms to artisanal bakeries, we connect you directly with the source.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="w-16 h-16 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive">
                <Radio size={32} />
              </div>
              <h3 className="text-3xl font-serif">Community Radio</h3>
              <p className="text-brand-ink/70 leading-relaxed text-lg">
                Our community radio station features local stories, producer spotlights, and educational content about food and sustainability.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="w-16 h-16 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive">
                <Users size={32} />
              </div>
              <h3 className="text-3xl font-serif">Inclusive Training</h3>
              <p className="text-brand-ink/70 leading-relaxed text-lg">
                We are a training hub for stroke survivors, people with disabilities, and single parents returning to work, providing flexible, supportive roles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-brand-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[40px] p-12 md:p-24 shadow-sm border border-brand-olive/5 flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-5xl md:text-6xl font-serif mb-8 leading-tight">
                A Mission Rooted in <span className="italic text-brand-olive">Resilience</span>
              </h2>
              <p className="text-xl text-brand-ink/70 mb-8 leading-relaxed">
                Founded by a stroke survivor, The Farmers Table Hub CIC is built on the belief that community systems should be robust enough to support everyone.
              </p>
              <div className="space-y-4 mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-olive/20 flex items-center justify-center text-brand-olive">
                    <Heart size={14} fill="currentColor" />
                  </div>
                  <span className="font-medium">Supporting 50+ Local Producers</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-olive/20 flex items-center justify-center text-brand-olive">
                    <Heart size={14} fill="currentColor" />
                  </div>
                  <span className="font-medium">100% Reinvested Profits</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-olive/20 flex items-center justify-center text-brand-olive">
                    <Heart size={14} fill="currentColor" />
                  </div>
                  <span className="font-medium">Inclusive Employment Model</span>
                </div>
              </div>
              <Link to="/about" className="text-brand-olive font-bold flex items-center gap-2 hover:gap-4 transition-all">
                Read Our Full Story <ArrowRight size={20} />
              </Link>
            </div>
            <div className="flex-1 w-full aspect-square md:aspect-auto md:h-[500px] bg-brand-cream rounded-3xl overflow-hidden">
              <img 
                src="https://picsum.photos/seed/community/800/1000" 
                alt="Community" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
