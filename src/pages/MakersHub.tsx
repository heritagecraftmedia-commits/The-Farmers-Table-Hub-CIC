import React, { useState } from 'react';
import { ArrowRight, ShoppingBag, Users, CheckCircle, ExternalLink, Info, Edit3, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArtisanSpotlight } from '../components/makers/ArtisanSpotlight';

const projects = [
  {
    id: 1,
    title: 'Seasonal Jam & Preserve Making',
    category: 'Food & Kitchen',
    description: 'Step-by-step guidance to make your own jams, chutneys and preserves using local seasonal fruit. Includes printable labels.',
    duration: '2–3 hours',
    level: 'Beginner',
    season: 'Spring / Summer',
    outcome: '3–4 jars of preserve',
    icon: '🫙',
    kitAvailable: true,
    links: [
      { text: 'Get jars & pectin', url: 'https://www.lakeland.co.uk/cooking-baking/preserving' },
      { text: 'Optional preserving tools', url: 'https://www.lakeland.co.uk/cooking-baking/preserving' }
    ],
    localAngle: 'Use local fruit from markets or hedgerows (guide includes safety notes)'
  },
  {
    id: 2,
    title: 'Sourdough Bread from Scratch',
    category: 'Food & Kitchen',
    description: 'Build your own sourdough starter and bake your first loaf. Audio guide included. Local flour suppliers listed.',
    duration: '3 days (low effort)',
    level: 'Intermediate',
    season: 'All Year',
    outcome: '1 sourdough loaf + live starter',
    icon: '🍞',
    kitAvailable: false,
    links: [
      { text: 'Source sourdough tools', url: 'https://www.lakeland.co.uk/cooking-baking/baking-bread' },
      { text: 'Find quality flour', url: 'https://www.souschef.co.uk/collections/flour-grain' }
    ]
  },
  {
    id: 3,
    title: 'Beeswax Wraps & Natural Packaging',
    category: 'Home & Eco',
    description: 'Make reusable beeswax food wraps to replace clingfilm. Zero waste, beautiful, and surprisingly simple.',
    duration: '1–2 hours',
    level: 'Beginner',
    season: 'All Year',
    outcome: '6 beeswax wraps in assorted sizes',
    icon: '🐝',
    kitAvailable: true,
    links: [
      { text: 'Get beeswax & cotton', url: 'https://www.etsy.com/uk/search?q=beeswax+sheets+organic+cotton' },
      { text: 'Buy a ready-made kit', url: 'https://www.thesoapkitchen.co.uk/beeswax-wrap-making-kit' }
    ]
  },
  {
    id: 4,
    title: 'Grow Your Own Herb Garden',
    category: 'Garden & Growing',
    description: 'From seed to harvest — a guided project to grow 5 essential culinary herbs at home. Perfect for windowsills.',
    duration: 'Weekend project',
    level: 'Beginner',
    season: 'Spring',
    outcome: '5 thriving herb plants',
    icon: '🌿',
    kitAvailable: true,
    links: [
      { text: 'Get a beginner herb kit', url: 'https://www.thompson-morgan.com' },
      { text: 'Source heritage herb seeds', url: 'https://www.suttons.co.uk/flower-seeds/herb-seeds' }
    ],
    localAngle: 'Use recycled pots if you have them'
  },
  {
    id: 5,
    title: 'Homemade Candles with Local Botanicals',
    category: 'Home & Craft',
    description: 'Pour your own soy or beeswax candles with dried lavender, rosemary and other local botanicals. Great gifts.',
    duration: '2 hours',
    level: 'Beginner',
    season: 'Autumn / Winter',
    outcome: '4–6 candles',
    icon: '🕯️',
    kitAvailable: true,
    links: [
      { text: 'Get wax & wicks', url: 'https://www.thesoapkitchen.co.uk/candle-making-supplies' },
      { text: 'Optional candle tools', url: 'https://www.lakeland.co.uk' }
    ]
  },
  {
    id: 6,
    title: 'Natural Cleaning Products',
    category: 'Home & Eco',
    description: 'Make your own non-toxic cleaning sprays, scrubs and laundry powder from simple natural ingredients.',
    duration: '1 hour',
    level: 'Beginner',
    season: 'All Year',
    outcome: 'Full kitchen & bathroom cleaning kit',
    icon: '🧴',
    kitAvailable: false,
    links: [
      { text: 'Get base ingredients', url: 'https://www.thesoapkitchen.co.uk/soap-making-supplies' },
      { text: 'Reusable bottles & labels', url: 'https://www.etsy.com/uk/search?q=amber+glass+spray+bottles' }
    ]
  }
];

export const MakersHub: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Food & Kitchen', 'Home & Eco', 'Garden & Growing', 'Home & Craft'];

  const filteredProjects = activeCategory === 'All'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  return (
    <div className="py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
                Makers <span className="italic text-brand-olive">Hub</span>
              </h1>
              <p className="text-xl text-brand-ink/60 leading-relaxed">
                Step-by-step guides with trusted supplier links. No stock held.
                We earn a small commission if you choose to buy — at no extra cost to you.
              </p>
            </div>
            <div className="flex gap-4">
              <Link to="/makers" className="px-6 py-3 bg-white border border-brand-olive/10 text-brand-olive rounded-full text-sm font-bold hover:bg-brand-olive/5 transition-all shadow-sm flex items-center gap-2">
                <ShoppingBag size={16} /> Makers Directory
              </Link>
              <Link to="/become-a-maker" className="px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold hover:bg-brand-olive/90 transition-all shadow-lg shadow-brand-olive/20 flex items-center gap-2">
                <Users size={16} /> Join the Makers
              </Link>
            </div>
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex overflow-x-auto pb-4 gap-3 mb-12 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeCategory === cat
                ? 'bg-brand-olive text-white border-brand-olive shadow-lg shadow-brand-olive/20'
                : 'bg-white text-brand-olive border-brand-olive/10 hover:border-brand-olive/30'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {filteredProjects.map((project) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={project.id}
              className="bg-white rounded-[40px] overflow-hidden border border-brand-olive/5 shadow-sm hover:shadow-xl transition-all group flex flex-col"
            >
              <div className="p-8 md:p-10 flex-grow">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-4xl">{project.icon}</span>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-brand-cream rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-olive">
                      {project.category}
                    </span>
                    {project.kitAvailable && (
                      <span className="px-3 py-1 bg-green-50 rounded-full text-[10px] font-bold uppercase tracking-widest text-green-600 flex items-center gap-1">
                        <CheckCircle size={10} /> Kit
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-serif mb-4 group-hover:text-brand-olive transition-colors leading-tight">
                  {project.title}
                </h3>
                <p className="text-brand-ink/60 text-sm leading-relaxed mb-8">
                  {project.description}
                </p>

                <div className="grid grid-cols-2 gap-y-4 mb-8 pt-8 border-t border-brand-cream/50">
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-brand-ink/30 font-bold mb-1">Time</span>
                    <span className="text-xs font-medium text-brand-ink/60">{project.duration}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-brand-ink/30 font-bold mb-1">Skill</span>
                    <span className="text-xs font-medium text-brand-ink/60">{project.level}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-brand-ink/30 font-bold mb-1">Season</span>
                    <span className="text-xs font-medium text-brand-ink/60">{project.season}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-brand-ink/30 font-bold mb-1">Yield</span>
                    <span className="text-xs font-medium text-brand-ink/60">{project.outcome}</span>
                  </div>
                </div>

                {project.localAngle && (
                  <div className="mt-4 p-4 bg-brand-cream/30 rounded-2xl border border-brand-olive/5 text-[11px] text-brand-ink/60 italic">
                    <Heart size={12} className="inline mr-2 text-brand-olive/40" />
                    {project.localAngle}
                  </div>
                )}
              </div>

              <div className="p-8 md:p-10 pt-0 space-y-3">
                {project.id === 1 ? (
                  <Link
                    to="/guides/jam"
                    className="w-full flex items-center justify-between p-5 bg-brand-olive text-white rounded-2xl font-bold text-sm hover:bg-brand-olive/90 transition-all group/btn shadow-lg shadow-brand-olive/10"
                  >
                    View Guided Project
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <button className="w-full flex items-center justify-between p-5 bg-brand-cream text-brand-olive rounded-2xl font-bold text-sm hover:bg-brand-olive hover:text-white transition-all group/btn">
                    View Guide — Coming Soon
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                )}

                <div className="space-y-2">
                  {project.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full p-4 bg-white border border-brand-olive/10 text-brand-olive rounded-2xl font-bold text-xs hover:bg-brand-olive/5 transition-all"
                    >
                      {link.text} (affiliate)
                      <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
                <p className="text-[10px] text-center text-brand-ink/30 italic">No stock held. Affiliate supported.</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Local Artisan Showcase */}
        <ArtisanSpotlight />

        {/* Footer Admin Bar */}
        <div className="mt-20 flex justify-center">
          <Link to="/changes" className="flex items-center gap-2 text-xs font-bold text-brand-ink/20 hover:text-brand-olive transition-all">
            <Edit3 size={14} /> Internal Drafting Space
          </Link>
        </div>
      </div>
    </div>
  );
};
