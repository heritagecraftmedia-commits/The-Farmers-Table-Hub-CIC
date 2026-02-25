import React from 'react';
import { motion } from 'motion/react';
import { Instagram, MapPin, ExternalLink, Star } from 'lucide-react';
import { makerListings } from '../../data/makerListings';

export const ArtisanSpotlight: React.FC = () => {
    return (
        <section className="py-24 bg-white rounded-[60px] my-16 border border-brand-olive/5 shadow-sm overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-[10px] font-bold uppercase tracking-widest mb-6">
                        <Star size={12} fill="currentColor" /> Local Artisans
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif mb-6">Local <span className="italic text-brand-olive">Artisan Spotlight</span></h2>
                    <p className="text-lg text-brand-ink/60 max-w-2xl mx-auto leading-relaxed">
                        Supporting the independent creators and traditional craftspeople within our local community.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {makerListings.map((maker, idx) => (
                        <motion.div
                            key={maker.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (idx % 3) * 0.1 }}
                            className="bg-brand-cream/20 rounded-[40px] p-8 border border-brand-olive/5 hover:border-brand-olive/20 transition-all group flex flex-col"
                        >
                            <div className="mb-6 flex justify-between items-start">
                                <div className="p-3 bg-white rounded-2xl text-brand-olive border border-brand-olive/5">
                                    <Star size={20} />
                                </div>
                                <div className="text-[10px] uppercase font-bold tracking-widest text-brand-olive bg-brand-olive/5 px-3 py-1 rounded-full">
                                    Local Member
                                </div>
                            </div>

                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-brand-ink mb-1 group-hover:text-brand-olive transition-colors">
                                    {maker.businessName || maker.name}
                                </h3>
                                <p className="text-xs font-bold text-brand-olive/60 uppercase tracking-widest mb-4">
                                    {maker.craft}
                                </p>

                                <div className="flex items-center gap-2 text-xs text-brand-ink/40 mb-2">
                                    <MapPin size={12} className="text-brand-olive" />
                                    Surrey & Surroundings
                                </div>

                                {maker.name && maker.businessName && (
                                    <p className="text-xs text-brand-ink/40 italic mb-6">
                                        Founded by {maker.name}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="pt-6 border-t border-brand-olive/5 mt-auto flex items-center justify-between">
                                {maker.instagramUrl ? (
                                    <a
                                        href={maker.instagramUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs font-bold text-brand-ink/60 hover:text-brand-olive transition-all"
                                    >
                                        <Instagram size={14} /> {maker.instagram}
                                    </a>
                                ) : (
                                    <span className="text-[10px] text-brand-ink/20 uppercase font-bold tracking-widest">Profile Pending</span>
                                )}

                                <button className="p-2 rounded-full hover:bg-brand-olive/5 text-brand-ink/20 hover:text-brand-olive transition-all">
                                    <ExternalLink size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Link */}
                <div className="mt-20 text-center">
                    <p className="text-brand-ink/40 text-sm mb-6">Are you a local maker? Join our community showcase.</p>
                    <a
                        href="/become-a-maker"
                        className="inline-flex items-center gap-2 px-10 py-4 bg-brand-olive text-white rounded-full font-bold text-sm hover:bg-brand-olive/90 transition-all shadow-xl shadow-brand-olive/20"
                    >
                        Apply to be listed
                    </a>
                </div>

            </div>
        </section>
    );
};
