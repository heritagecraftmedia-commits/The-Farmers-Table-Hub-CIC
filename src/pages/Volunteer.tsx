import React from 'react';
import { Heart, HandHelping, Users, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const Volunteer: React.FC = () => {
  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Volunteer <span className="italic text-brand-olive">Opportunities</span></h1>
          <p className="text-xl text-brand-ink/70 max-w-2xl">
            Give back to your community and gain new skills. We have a variety of roles to suit your interests and availability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {[
            { 
              title: 'Radio Assistant', 
              desc: 'Help with show production, guest coordination, and technical support.', 
              icon: <Users size={24} />,
              time: '4-8 hours / week'
            },
            { 
              title: 'Market Helper', 
              desc: 'Assist local producers during our weekend markets and events.', 
              icon: <HandHelping size={24} />,
              time: 'Weekends'
            },
            { 
              title: 'Community Gardener', 
              desc: 'Help maintain our community garden and teach others about growing food.', 
              icon: <Heart size={24} />,
              time: 'Flexible'
            },
            { 
              title: 'Admin Support', 
              desc: 'Assist with office tasks, database management, and community outreach.', 
              icon: <Calendar size={24} />,
              time: 'Weekdays'
            },
          ].map((role, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-brand-olive/5 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                <div className="w-12 h-12 bg-brand-cream rounded-xl flex items-center justify-center text-brand-olive mb-6">
                  {role.icon}
                </div>
                <h3 className="text-2xl font-serif mb-4">{role.title}</h3>
                <p className="text-brand-ink/70 mb-6 leading-relaxed">{role.desc}</p>
              </div>
              <div className="pt-6 border-t border-brand-cream flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest opacity-40">{role.time}</span>
                <button className="text-brand-olive font-bold flex items-center gap-2">Apply <ArrowRight size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-brand-olive text-brand-cream rounded-[40px] p-12 md:p-24 text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-8">Not sure where you fit?</h2>
          <p className="text-xl opacity-80 mb-12 max-w-2xl mx-auto leading-relaxed">
            We'd love to chat about your skills and how you can help. Every contribution, big or small, makes a difference.
          </p>
          <button className="px-12 py-5 bg-white text-brand-olive rounded-full font-bold hover:bg-brand-cream transition-all">
            Get in Touch
          </button>
        </div>
      </div>
    </div>
  );
};
