import React from 'react';
import { Coffee, Moon, Utensils } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

/**
 * Farmers Table Café.
 *
 * This page previously described a café that is open and trading. It carried
 * "Always Open, Always Local", a tagline about "serving local produce around
 * the clock in the heart of Farnham", Day Menu / Night Menu badges, and three
 * priced dishes under "Current Specials" — Wild Mushroom Toast £8.50,
 * Midnight Beef Stew £12.00, Artisan Coffee £3.20, one crediting "Old Mill
 * sourdough". None of it could be substantiated, and a "View Full Menu"
 * button led nowhere.
 *
 * Of everything found in the fabricated-content audit this was the most
 * actionable by a member of the public: opening hours and prices are the
 * things someone travels to a town for. It has been rewritten as the café
 * concept, clearly marked as in development.
 *
 * The stock photograph captioned "Cafe Interior" was also removed. It was an
 * unrelated random image and implied the premises exist and look like that.
 *
 * The three cards below are retained deliberately: they describe what the
 * café is intended to be, and are now written in the future tense rather
 * than as services currently on offer. No hours, prices, dishes, suppliers
 * or staff are stated anywhere on this page.
 */
export const Cafe: React.FC = () => {
  const planned = [
    {
      icon: Coffee,
      title: 'Work Space',
      text: 'Somewhere to work quietly, with room to spread out and settle in.',
    },
    {
      icon: Utensils,
      title: 'Community Table',
      text: 'A large shared table for meeting people over a meal rather than eating alone.',
    },
    {
      icon: Moon,
      title: 'Night Sanctuary',
      text: 'A welcoming place for people who work late or keep unusual hours.',
    },
  ];

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-olive bg-brand-olive/10 px-4 py-2 rounded-full mb-6">
            In Development
          </span>
          <h1 className="text-5xl md:text-7xl font-serif mb-6">
            Farmers Table <span className="italic text-brand-olive">Café</span>
          </h1>
          <p className="text-xl text-brand-ink/70 max-w-2xl">
            The café is part of the Farmers Table vision — a place built around local
            producers, open to people who work early, late, or somewhere in between.
          </p>
        </div>

        <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm mb-24">
          <EmptyState
            icon={Coffee}
            title="Farmers Table Café — Coming Soon"
            description="Our café is currently being developed. Opening times, menus, pricing and services will appear here once they have been confirmed."
            comingSoon
            note="Nothing on this page is a live menu or a trading commitment yet."
          />
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-serif mb-2">What we are planning</h2>
          <p className="text-brand-ink/50">
            The intent behind the space. Details will be confirmed as the project develops.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {planned.map(({ icon: Icon, title, text }) => (
            <div key={title} className="p-8 bg-white rounded-3xl border border-brand-olive/5 text-center">
              <Icon size={32} className="mx-auto mb-6 text-brand-olive" />
              <h4 className="text-xl font-bold mb-2">{title}</h4>
              <p className="text-sm opacity-60 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
