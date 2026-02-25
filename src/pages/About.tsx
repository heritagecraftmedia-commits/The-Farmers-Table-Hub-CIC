import React from 'react';
import { Heart, ShieldCheck, Users, Briefcase, Award } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="bg-brand-cream min-h-screen">
      {/* Hero */}
      <section className="py-24 md:py-32 bg-brand-olive text-brand-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-6xl md:text-8xl font-serif mb-8 leading-tight">
              A Community <span className="italic">Interest</span> Company with a <span className="italic">Heart</span>
            </h1>
            <p className="text-xl md:text-2xl opacity-80 leading-relaxed">
              The Farmers Table Hub CIC was founded to bridge the gap between local producers and our community, 
              while creating a supportive environment for those returning to work.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-serif">The Founder's Story</h2>
              <div className="space-y-6 text-lg text-brand-ink/70 leading-relaxed">
                <p>
                  Our founder, Scott Andrew, is a stroke survivor who understands first-hand the challenges of navigating life and work with cognitive fatigue and "mind fog."
                </p>
                <p>
                  After his stroke, Scott realized that many existing systems weren't designed for people with varying capacities. He envisioned a business that was not only resilient but also actively supportive of people in similar situations.
                </p>
                <p>
                  The Farmers Table Hub CIC is the realization of that vision—a social enterprise that combines a passion for local food with a commitment to inclusive employment.
                </p>
              </div>
              <div className="pt-8 flex gap-12">
                <div>
                  <span className="block text-4xl font-serif text-brand-olive">2024</span>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-50">Founded</span>
                </div>
                <div>
                  <span className="block text-4xl font-serif text-brand-olive">50+</span>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-50">Producers</span>
                </div>
                <div>
                  <span className="block text-4xl font-serif text-brand-olive">100%</span>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-50">Social</span>
                </div>
              </div>
            </div>
            <div className="rounded-[40px] overflow-hidden shadow-2xl rotate-2">
              <img 
                src="https://picsum.photos/seed/founder/800/1000" 
                alt="Founder" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Our Core Values</h2>
            <p className="text-xl text-brand-ink/60 max-w-2xl mx-auto">
              These principles guide every decision we make, from producer onboarding to radio programming.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                icon: <ShieldCheck size={32} />, 
                title: 'Transparency', 
                desc: 'We operate with an open-book policy. Every penny we make is reinvested back into the community interest.' 
              },
              { 
                icon: <Users size={32} />, 
                title: 'Inclusivity', 
                desc: 'Our systems are designed for everyone. We provide flexible roles for single parents and people with disabilities.' 
              },
              { 
                icon: <Award size={32} />, 
                title: 'Quality', 
                desc: 'We only feature producers who meet our high standards for ethical production and local sourcing.' 
              }
            ].map((value, i) => (
              <div key={i} className="p-10 rounded-[32px] bg-brand-cream/50 border border-brand-olive/5 text-center space-y-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-olive mx-auto shadow-sm">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-serif">{value.title}</h3>
                <p className="text-brand-ink/70 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Hub */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-olive text-brand-cream rounded-[60px] p-12 md:p-24 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 blur-[100px] rounded-full -ml-48 -mb-48"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-5xl md:text-6xl font-serif mb-8 leading-tight">
                  A <span className="italic">Training Hub</span> for the Future
                </h2>
                <p className="text-xl opacity-80 mb-12 leading-relaxed">
                  We don't just provide jobs; we provide pathways. Our training program is specifically designed for:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex items-start gap-4">
                    <div className="mt-1"><Briefcase size={20} className="text-white/40" /></div>
                    <div>
                      <h4 className="font-bold mb-1">Single Parents</h4>
                      <p className="text-sm opacity-60">Flexible hours that work around childcare.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1"><Heart size={20} className="text-white/40" /></div>
                    <div>
                      <h4 className="font-bold mb-1">Stroke Survivors</h4>
                      <p className="text-sm opacity-60">Supportive systems for cognitive recovery.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-[40px] p-8 md:p-12 border border-white/10">
                <h3 className="text-3xl font-serif mb-6">Want to join us?</h3>
                <p className="opacity-80 mb-8 leading-relaxed">
                  We are always looking for passionate individuals to join our team as trainees or volunteers. No experience necessary—we provide all the tools and support you need.
                </p>
                <button className="w-full py-4 bg-white text-brand-olive rounded-full font-bold hover:bg-brand-cream transition-all">
                  Apply to the Hub
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
