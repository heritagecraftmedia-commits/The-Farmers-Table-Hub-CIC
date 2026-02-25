import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Quote, Hammer, Sun, ArrowRight } from 'lucide-react';
import { hubService } from '../services/hubService';
import { MakerStory } from '../types';

export const MakerStories: React.FC = () => {
  const [stories, setStories] = useState<MakerStory[]>([]);

  useEffect(() => {
    setStories(hubService.getMakerStories().filter(s => s.published));
  }, []);

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Maker <span className="italic text-brand-olive">Stories</span></h1>
          <p className="text-xl text-brand-ink/70 leading-relaxed">
            Going beyond the directory. We ask local artisans about their journey, their tools, and what makes a perfect day of making.
          </p>
        </div>

        {/* Stories Grid */}
        <div className="space-y-24">
          {stories.map((story, index) => (
            <motion.div 
              key={story.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}
            >
              <div className="flex-1 w-full">
                <div className="relative aspect-[4/3] rounded-[60px] overflow-hidden shadow-2xl">
                  <img 
                    src={story.image} 
                    alt={story.makerName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/40 to-transparent"></div>
                  <div className="absolute bottom-10 left-10 text-white">
                    <p className="text-xs font-bold uppercase tracking-widest mb-2">Featured Artisan</p>
                    <h2 className="text-3xl font-serif">{story.makerName}</h2>
                    <p className="text-sm opacity-80">{story.craft}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-brand-olive">
                    <Quote size={20} />
                    <h3 className="font-bold text-lg">How did you learn your craft?</h3>
                  </div>
                  <p className="text-brand-ink/70 leading-relaxed italic">"{story.q1}"</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-brand-olive">
                    <Hammer size={20} />
                    <h3 className="font-bold text-lg">What tools can't you work without?</h3>
                  </div>
                  <p className="text-brand-ink/70 leading-relaxed italic">"{story.q2}"</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-brand-olive">
                    <Sun size={20} />
                    <h3 className="font-bold text-lg">What does a good making day look like?</h3>
                  </div>
                  <p className="text-brand-ink/70 leading-relaxed italic">"{story.q3}"</p>
                </div>

                <div className="pt-6">
                  <button className="flex items-center gap-2 text-brand-olive font-bold group">
                    View Thomas's Full Profile <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-32 bg-brand-olive text-brand-cream p-12 md:p-20 rounded-[60px] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-64 h-64 border border-white rounded-full"></div>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif mb-6 relative z-10">Are you a local maker?</h2>
          <p className="text-xl opacity-80 mb-10 max-w-2xl mx-auto relative z-10">
            We'd love to tell your story. It takes 5 minutes and helps the community connect with the person behind the craft.
          </p>
          <button className="px-10 py-4 bg-white text-brand-olive rounded-full font-bold text-lg hover:scale-105 transition-transform relative z-10">
            Share Your Story
          </button>
        </div>
      </div>
    </div>
  );
};
