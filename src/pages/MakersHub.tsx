import React, { useState } from 'react';
import { ArrowRight, Play, ShoppingBag, Users, CheckCircle, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

const projects = [
  {
    id: 'jam',
    icon: '🫙',
    category: 'Food & Kitchen',
    kitAvailable: true,
    title: 'Seasonal Jam & Preserve Making',
    description: 'Step-by-step guidance to make your own jams, chutneys and preserves using local seasonal fruit. Includes printable labels.',
    duration: '2–3 hours',
    level: 'Beginner',
    season: 'Spring / Summer',
    outcome: '3–4 jars of preserve',
    linkText: 'Get your jars & pectin'
  },
  {
    id: 'sourdough',
    icon: '🍞',
    category: 'Food & Kitchen',
    kitAvailable: false,
    title: 'Sourdough Bread from Scratch',
    description: 'Build your own sourdough starter and bake your first loaf. Audio guide included. Local flour suppliers listed.',
    duration: '3 days (low effort)',
    level: 'Intermediate',
    season: 'All Year',
    outcome: '1 sourdough loaf + live starter',
    linkText: 'Source local flour'
  },
  {
    id: 'wraps',
    icon: '🐝',
    category: 'Home & Eco',
    kitAvailable: true,
    title: 'Beeswax Wraps & Natural Packaging',
    description: 'Make reusable beeswax food wraps to replace clingfilm. Zero waste, beautiful, and surprisingly simple.',
    duration: '1–2 hours',
    level: 'Beginner',
    season: 'All Year',
    outcome: '6 beeswax wraps in assorted sizes',
    linkText: 'Get beeswax & cotton fabric'
  },
  {
    id: 'herbs',
    icon: '🌿',
    category: 'Garden & Growing',
    kitAvailable: true,
    title: 'Grow Your Own Herb Garden',
    description: 'From seed to harvest — a guided project to grow 5 essential culinary herbs at home. Perfect for windowsills.',
    duration: 'Weekend project',
    level: 'Beginner',
    season: 'Spring',
    outcome: '5 thriving herb plants',
    linkText: 'Get heritage herb seeds'
  },
  {
    id: 'candles',
    icon: '🕯️',
    category: 'Home & Craft',
    kitAvailable: true,
    title: 'Homemade Candles with Local Botanicals',
    description: 'Pour your own soy or beeswax candles with dried lavender, rosemary and other local botanicals. Great gifts.',
    duration: '2 hours',
    level: 'Beginner',
    season: 'Autumn / Winter',
    outcome: '4–6 candles',
    linkText: 'Get wax & wicks'
  },
  {
    id: 'cleaning',
    icon: '🧴',
    category: 'Home & Eco',
    kitAvailable: false,
    title: 'Natural Cleaning Products',
    description: 'Make your own non-toxic cleaning sprays, scrubs and laundry powder from simple natural ingredients.',
    duration: '1 hour',
    level: 'Beginner',
    season: 'All Year',
    outcome: 'Full kitchen & bathroom cleaning kit',
    linkText: 'Get base ingredients'
  }
];

export const MakersHub: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Food & Kitchen', 'Home & Eco', 'Garden & Growing', 'Home & Craft'];

  const filteredProjects = activeCategory === 'All' 
    ? projects 
    : projects.filter(p => p.category === activeCategory);

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-20">
          <div className="flex gap-4 mb-6 text-4xl">
            <span>🫙</span>
            <span>👨‍🍳</span>
            <span>🌿</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Makers <span className="italic text-brand-olive">Hub</span></h1>
          <h2 className="text-2xl md:text-3xl font-serif text-brand-olive mb-6">
            Learn to make. Watch local chefs cook. Source trusted supplies.
          </h2>
          <p className="text-xl text-brand-ink/70 max-w-3xl leading-relaxed">
            Guided craft projects, local chef video masterclasses, curated material kits — all rooted in the Farmers Table community.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {[
            { title: 'Pick a project', desc: 'Guided making projects for all skill levels', icon: <CheckCircle className="text-brand-olive" /> },
            { title: 'Watch chefs cook', desc: 'Local chefs filmed in their own kitchens', icon: <Play className="text-brand-olive" /> },
            { title: 'Get your materials', desc: 'Direct links to trusted suppliers with discount codes', icon: <ShoppingBag className="text-brand-olive" /> },
            { title: 'Join the community', desc: 'Group sessions, forums and seasonal showcases', icon: <Users className="text-brand-olive" /> },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-brand-olive/5 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-brand-ink/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Tabs Section */}
        <div className="mb-16">
          <div className="flex flex-wrap gap-8 border-b border-brand-olive/10 mb-12">
            {['Making Projects', 'Chef Videos', 'Subscriptions', 'Ready-Made Kits'].map((tab, i) => (
              <button 
                key={tab} 
                className={`pb-4 text-lg font-bold transition-all relative ${i === 0 ? 'text-brand-olive' : 'text-brand-ink/40 hover:text-brand-ink'}`}
              >
                {tab}
                {i === 0 && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-olive" />}
              </button>
            ))}
          </div>

          <div className="mb-12">
            <h3 className="text-3xl font-serif mb-4">Guided Making Projects</h3>
            <p className="text-lg text-brand-ink/60">Step-by-step guides with trusted supplier links. No stock held.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-12">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat 
                    ? 'bg-brand-olive text-white' 
                    : 'bg-white text-brand-ink/60 border border-brand-olive/10 hover:bg-brand-olive/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <motion.div 
                key={project.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[40px] p-8 border border-brand-olive/5 shadow-sm flex flex-col"
              >
                <div className="text-5xl mb-6">{project.icon}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-olive/60">{project.category}</span>
                  {project.kitAvailable && (
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-olive/10 text-brand-olive px-2 py-0.5 rounded-full">
                      Kit available
                    </span>
                  )}
                </div>
                <h4 className="text-2xl font-serif mb-4">{project.title}</h4>
                <p className="text-brand-ink/70 mb-8 text-sm leading-relaxed flex-grow">
                  {project.description}
                </p>
                
                <div className="space-y-4 pt-6 border-t border-brand-cream mb-8 text-xs font-medium text-brand-ink/50">
                  <div className="flex justify-between">
                    <span>{project.duration}</span>
                    <span>·</span>
                    <span>{project.level}</span>
                    <span>·</span>
                    <span>{project.season}</span>
                  </div>
                  <p className="text-brand-olive">You make: {project.outcome}</p>
                </div>

                <div className="space-y-3">
                  <button className="w-full py-4 bg-brand-cream text-brand-ink/40 rounded-full font-bold text-sm cursor-not-allowed">
                    View Guide — Coming Soon
                  </button>
                  <button className="w-full py-4 border border-brand-olive/20 text-brand-olive rounded-full font-bold text-sm hover:bg-brand-olive hover:text-white transition-all flex items-center justify-center gap-2">
                    {project.linkText} <ExternalLink size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Early Access Section */}
        <section className="py-24">
          <div className="bg-brand-olive text-brand-cream rounded-[60px] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full -ml-32 -mt-32"></div>
            <h2 className="text-4xl md:text-6xl font-serif mb-8 leading-tight">Get Early Access</h2>
            <p className="text-xl opacity-80 mb-12 max-w-2xl mx-auto leading-relaxed">
              Be first to access new guides, chef videos and seasonal kits when they launch.
            </p>
            <button className="px-12 py-5 bg-white text-brand-olive rounded-full font-bold hover:bg-brand-cream transition-all shadow-xl">
              Join the Early Access List
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

