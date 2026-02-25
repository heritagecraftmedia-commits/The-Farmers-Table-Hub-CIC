import React from 'react';
import { Heart, Globe, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const SupportMakers: React.FC = () => {
    return (
        <div className="py-24 bg-brand-cream min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-[10px] font-bold uppercase tracking-widest mb-6">
                        <Heart size={12} fill="currentColor" /> Our Mission
                    </div>
                    <h1 className="text-5xl md:text-6xl font-serif mb-8">Supporting <span className="italic text-brand-olive">Independent Makers</span></h1>
                    <p className="text-xl text-brand-ink/60 leading-relaxed">
                        This directory exists to support independent makers, traditional craftspeople, and heritage skills.
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-12">

                    <div className="bg-white rounded-[40px] p-12 border border-brand-olive/5 shadow-sm">
                        <h2 className="text-3xl font-serif mb-6 flex items-center gap-3">
                            <Globe className="text-brand-olive" /> No Stock Held
                        </h2>
                        <p className="text-brand-ink/70 leading-relaxed mb-6">
                            We don’t hold stock or run a traditional shop. Instead, we link directly to makers and trusted suppliers so you can buy from the source.
                        </p>
                        <p className="text-brand-ink/70 leading-relaxed">
                            This model allows us to showcase a much wider range of independent creators and ensures that the people actually making the goods receive the most support.
                        </p>
                    </div>

                    <div className="bg-white rounded-[40px] p-12 border border-brand-olive/5 shadow-sm">
                        <h2 className="text-3xl font-serif mb-6 flex items-center gap-3">
                            <ShieldCheck className="text-brand-olive" /> Affiliate Disclosure
                        </h2>
                        <p className="text-brand-ink/70 leading-relaxed mb-6">
                            Some of the links on this site are affiliate links. If you choose to buy, we may earn a small commission at no extra cost to you.
                        </p>
                        <p className="text-brand-ink/70 leading-relaxed bg-brand-cream/30 p-6 rounded-2xl border border-brand-olive/5 font-medium italic">
                            "Affiliate support helps keep this directory free, up to date, and independent. Every purchase supports skilled work and crafts worth preserving."
                        </p>
                    </div>

                    <div className="bg-white rounded-[40px] p-12 border border-brand-olive/5 shadow-sm">
                        <h2 className="text-3xl font-serif mb-6 flex items-center gap-3">
                            <HelpCircle className="text-brand-olive" /> How it Works
                        </h2>
                        <div className="space-y-8">
                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-full bg-brand-olive text-white flex items-center justify-center font-bold shrink-0">1</div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Discovery</h3>
                                    <p className="text-sm text-brand-ink/60">We research and curate independent makers from across the UK who share our values of quality and craftsmanship.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-full bg-brand-olive text-white flex items-center justify-center font-bold shrink-0">2</div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Direct Links</h3>
                                    <p className="text-sm text-brand-ink/60">We provide direct links to their shops, allowing you to browse their full collections and buy directly from them.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-full bg-brand-olive text-white flex items-center justify-center font-bold shrink-0">3</div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Cycle of Support</h3>
                                    <p className="text-sm text-brand-ink/60">Your support keeps these traditional skills alive, and our commissions help us continue building this community resource.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* CTA */}
                <div className="mt-16 text-center">
                    <Link to="/makers" className="inline-flex items-center gap-2 px-12 py-5 bg-brand-olive text-white rounded-full font-bold text-lg hover:bg-brand-olive/90 transition-all shadow-xl shadow-brand-olive/20">
                        Back to Directory
                    </Link>
                </div>

            </div>
        </div>
    );
};
