import React from 'react';
import { Coffee, Clock, Moon, Sun, Utensils, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const Cafe: React.FC = () => {
  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">24-Hour <span className="italic text-brand-olive">Café</span></h1>
          <p className="text-xl text-brand-ink/70 max-w-2xl">
            A sanctuary for early birds, night owls, and everyone in between. Serving local produce around the clock in the heart of Farnham.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-24">
          <div className="lg:col-span-2 relative h-[500px] rounded-[40px] overflow-hidden shadow-2xl">
            <img src="https://picsum.photos/seed/cafe/1200/800" alt="Cafe Interior" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/80 to-transparent flex flex-col justify-end p-12">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-bold">
                  <Sun size={16} /> Day Menu
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-bold">
                  <Moon size={16} /> Night Menu
                </div>
              </div>
              <h2 className="text-4xl font-serif text-white mb-4">Always Open, Always Local</h2>
              <p className="text-white/70 text-lg max-w-md">
                From morning sourdough to midnight stews, our menu rotates to reflect the freshest local ingredients.
              </p>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[40px] border border-brand-olive/5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive mb-8">
                <Clock size={32} />
              </div>
              <h3 className="text-3xl font-serif mb-6">Current Specials</h3>
              <div className="space-y-6">
                <div className="border-b border-brand-cream pb-4">
                  <h4 className="font-bold flex justify-between"><span>Wild Mushroom Toast</span> <span>£8.50</span></h4>
                  <p className="text-sm opacity-50">Local chanterelles on Old Mill sourdough</p>
                </div>
                <div className="border-b border-brand-cream pb-4">
                  <h4 className="font-bold flex justify-between"><span>Midnight Beef Stew</span> <span>£12.00</span></h4>
                  <p className="text-sm opacity-50">Slow-cooked Surrey beef with root veg</p>
                </div>
                <div>
                  <h4 className="font-bold flex justify-between"><span>Artisan Coffee</span> <span>£3.20</span></h4>
                  <p className="text-sm opacity-50">Roasted in small batches locally</p>
                </div>
              </div>
            </div>
            <button className="w-full py-4 bg-brand-olive text-white rounded-full font-bold mt-12 flex items-center justify-center gap-2">
              View Full Menu <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-3xl border border-brand-olive/5 text-center">
            <Coffee size={32} className="mx-auto mb-6 text-brand-olive" />
            <h4 className="text-xl font-bold mb-2">Work Space</h4>
            <p className="text-sm opacity-60">High-speed Wi-Fi and quiet corners for focused work.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-brand-olive/5 text-center">
            <Utensils size={32} className="mx-auto mb-6 text-brand-olive" />
            <h4 className="text-xl font-bold mb-2">Community Table</h4>
            <p className="text-sm opacity-60">A large table for meeting new people and sharing meals.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-brand-olive/5 text-center">
            <Moon size={32} className="mx-auto mb-6 text-brand-olive" />
            <h4 className="text-xl font-bold mb-2">Night Sanctuary</h4>
            <p className="text-sm opacity-60">A safe, welcoming space for those who work or live late.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
