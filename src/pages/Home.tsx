import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Radio, MapPin, Users, Heart, BookOpen, HandHeart, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';

const membershipTiers = [
  { name: 'Basic', price: '£0', description: 'A free way to be part of the Farmers Table community.', path: '/members' },
  { name: 'Supporter', price: '£5', description: 'Help strengthen the project and support local community work.', path: '/members' },
  { name: 'Featured', price: '£15', description: 'For eligible members and directory participants who want greater visibility.', path: '/members' },
];

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-block px-4 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-sm font-bold uppercase tracking-widest mb-6">
              Farnham Community Interest Company
            </motion.span>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-6xl md:text-8xl font-serif text-brand-ink leading-[0.9] mb-8">
              Connecting <span className="italic">Local</span> Food & <span className="italic text-brand-olive">Community</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl md:text-2xl text-brand-ink/70 mb-12 leading-relaxed max-w-2xl">
              The Farmers Table Hub is a community-led social enterprise bringing local food, producers, community projects, learning and participation together in one place.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4">
              <Link to="/directory" className="px-8 py-4 bg-brand-olive text-white rounded-full font-bold flex items-center gap-2 hover:bg-brand-olive/90 transition-all shadow-lg shadow-brand-olive/20">
                Explore Food Directory <ArrowRight size={20} />
              </Link>
              <Link to="/join" className="px-8 py-4 bg-white text-brand-olive border border-brand-olive/20 rounded-full font-bold flex items-center gap-2 hover:bg-brand-cream transition-all">
                Get Involved <HandHeart size={20} />
              </Link>
            </motion.div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none hidden lg:block">
          <img src="https://picsum.photos/seed/farm/1000/1000" alt="Local farm landscape" className="w-full h-full object-cover rounded-l-[100px]" referrerPolicy="no-referrer" />
        </div>
      </section>

      <section className="py-20 bg-white" aria-labelledby="explore-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-olive mb-3">Explore</p>
            <h2 id="explore-heading" className="text-4xl md:text-5xl font-serif mb-4">A hub for local food and community</h2>
            <p className="text-lg text-brand-ink/70 leading-relaxed">Find producers, discover what is happening locally, learn something useful, and see where you can take part.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Food Directory', text: 'Discover local food producers and suppliers.', icon: MapPin, path: '/directory' },
              { title: "What's On", text: 'Events, markets, workshops and community activity.', icon: Users, path: '/whats-on' },
              { title: 'Community Radio', text: 'Local voices, stories and conversations.', icon: Radio, path: '/radio' },
              { title: 'Learn', text: 'Resources, guides and practical food knowledge.', icon: BookOpen, path: '/resources' },
            ].map(({ title, text, icon: Icon, path }) => (
              <Link key={title} to={path} className="group rounded-3xl border border-brand-olive/10 p-7 hover:border-brand-olive/30 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive mb-6"><Icon size={28} /></div>
                <h3 className="text-2xl font-serif mb-3">{title}</h3>
                <p className="text-brand-ink/65 leading-relaxed mb-5">{text}</p>
                <span className="text-brand-olive font-bold inline-flex items-center gap-2">Explore <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-cream" aria-labelledby="involved-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brand-olive mb-3">Get Involved</p>
              <h2 id="involved-heading" className="text-4xl md:text-5xl font-serif mb-6">There is more than one way to help build the hub.</h2>
              <p className="text-lg text-brand-ink/70 leading-relaxed mb-8">Join as a member, volunteer, partner, sponsor or help us connect local food and community opportunities.</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/join" className="px-6 py-3 bg-brand-olive text-white rounded-full font-bold">Join</Link>
                <Link to="/volunteer" className="px-6 py-3 bg-white text-brand-olive rounded-full font-bold border border-brand-olive/20">Volunteer</Link>
                <Link to="/support-the-makers" className="px-6 py-3 bg-white text-brand-olive rounded-full font-bold border border-brand-olive/20">Support</Link>
              </div>
            </div>
            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-brand-olive/10">
              <div className="flex items-center gap-3 mb-6"><Sprout className="text-brand-olive" size={26} /><h3 className="text-2xl font-serif">Membership</h3></div>
              <div className="space-y-4">
                {membershipTiers.map((tier) => (
                  <Link key={tier.name} to={tier.path} className="flex items-start justify-between gap-5 p-4 rounded-2xl hover:bg-brand-cream transition-colors">
                    <div><div className="font-bold text-brand-ink">{tier.name}</div><p className="text-sm text-brand-ink/60 mt-1">{tier.description}</p></div>
                    <span className="font-bold text-brand-olive whitespace-nowrap">{tier.price}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white" aria-labelledby="mission-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-cream rounded-[40px] p-10 md:p-20 flex flex-col md:flex-row gap-14 items-center">
            <div className="flex-1">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-olive mb-3">Our Purpose</p>
              <h2 id="mission-heading" className="text-4xl md:text-5xl font-serif mb-7 leading-tight">A community hub built around local resilience.</h2>
              <p className="text-xl text-brand-ink/70 mb-8 leading-relaxed">Farmers Table exists to make local food, community participation, learning and practical support easier to find and easier to join.</p>
              <div className="space-y-4 mb-8">
                {['Supporting local producers and community activity', 'Creating opportunities to participate and learn', 'Building a sustainable CIC model for the community'].map((item) => (
                  <div key={item} className="flex items-center gap-4"><div className="w-7 h-7 rounded-full bg-brand-olive/15 flex items-center justify-center text-brand-olive"><Heart size={14} fill="currentColor" /></div><span className="font-medium">{item}</span></div>
                ))}
              </div>
              <Link to="/about" className="text-brand-olive font-bold flex items-center gap-2 hover:gap-4 transition-all">Read about Farmers Table <ArrowRight size={20} /></Link>
            </div>
            <div className="flex-1 w-full aspect-square md:aspect-auto md:h-[440px] rounded-3xl overflow-hidden">
              <img src="https://picsum.photos/seed/community/800/1000" alt="People gathering in a community setting" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
