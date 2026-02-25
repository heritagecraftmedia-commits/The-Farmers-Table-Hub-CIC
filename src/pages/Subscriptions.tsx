import React from 'react';
import { Crown, Star, CheckCircle2, ArrowRight, ShieldCheck, Heart, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { stripeService } from '../services/stripeService';

export const Subscriptions: React.FC = () => {
    const tiers = [
        {
            name: 'Supporter',
            price: '£5',
            id: 'supporter',
            icon: <Star className="text-brand-olive" size={24} />,
            description: 'Support local food radio and get basic community benefits.',
            features: [
                'Verified Supporter badge',
                'Early access to Maker Hub projects',
                'Monthly newsletter with local recipes',
                'Support community broadcasting'
            ],
            color: 'bg-brand-olive/5',
            buttonText: 'Join as Supporter'
        },
        {
            name: 'Featured',
            price: '£15',
            id: 'featured',
            icon: <Crown className="text-amber-500" size={24} />,
            description: 'Priority placement and maximum visibility for your business.',
            features: [
                'Top-tier priority in directory rows',
                'Rotating "Featured Spotlight" placement',
                'Full business bio & social links',
                'Manage product affiliate links',
                'Community Radio ad slot priority'
            ],
            color: 'bg-brand-olive text-white',
            buttonText: 'Go Platinum',
            highlight: true
        }
    ];

    return (
        <div className="py-24 bg-brand-cream min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-7xl font-serif mb-6">Support the <span className="italic text-brand-olive">Community</span></h1>
                    <p className="text-xl text-brand-ink/60 max-w-2xl mx-auto leading-relaxed">
                        The Farmers Table Hub is a Social Enterprise. 100% of our surplus goes back into local programs, inclusive training, and supporting our producers.
                    </p>
                </div>

                {/* Tiers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
                    {tiers.map((tier) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-[48px] p-8 md:p-12 border border-brand-olive/10 shadow-sm flex flex-col ${tier.color} relative overflow-hidden`}
                        >
                            {tier.highlight && (
                                <div className="absolute top-0 right-12 bg-amber-400 text-brand-ink text-[10px] font-bold px-4 py-1 rounded-b-lg uppercase tracking-widest">
                                    Best Value
                                </div>
                            )}

                            <div className="mb-8">
                                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center mb-6 ${tier.highlight ? 'bg-white/10' : 'bg-brand-olive/10'}`}>
                                    {tier.icon}
                                </div>
                                <h3 className="text-3xl font-serif mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-serif">{tier.price}</span>
                                    <span className={`text-sm font-bold ${tier.highlight ? 'opacity-60' : 'text-brand-ink/40'}`}>/month</span>
                                </div>
                            </div>

                            <p className={`mb-10 text-lg leading-relaxed ${tier.highlight ? 'opacity-80' : 'text-brand-ink/60'}`}>
                                {tier.description}
                            </p>

                            <ul className="space-y-4 mb-12 flex-grow">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <CheckCircle2 size={20} className={tier.highlight ? 'text-white' : 'text-brand-olive'} />
                                        <span className={`text-sm font-medium ${tier.highlight ? 'opacity-90' : 'text-brand-ink/70'}`}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => stripeService.redirectToCheckout(tier.id as 'supporter' | 'featured')}
                                className={`w-full py-5 rounded-full font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${tier.highlight
                                        ? 'bg-white text-brand-olive hover:bg-brand-cream'
                                        : 'bg-brand-olive text-white hover:bg-brand-olive/90'
                                    }`}
                            >
                                {tier.buttonText} <ArrowRight size={20} />
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Trust/Social Impact Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {[
                        {
                            icon: <ShieldCheck className="text-brand-olive" />,
                            title: 'Secure Payments',
                            desc: 'Handled safely via Stripe Checkout. Encrypted and verified.'
                        },
                        {
                            icon: <Heart className="text-brand-olive" />,
                            title: 'Social Impact',
                            desc: 'Your support funds inclusive training and community radio.'
                        },
                        {
                            icon: <Zap className="text-brand-olive" />,
                            title: 'Cancel Anytime',
                            desc: 'No long-term contracts. Manage your subscription in one click.'
                        }
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-8 rounded-[32px] border border-brand-olive/5 text-center">
                            <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-4">
                                {item.icon}
                            </div>
                            <h4 className="font-bold mb-2">{item.title}</h4>
                            <p className="text-xs text-brand-ink/50 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-sm text-brand-ink/40">
                        Questions about membership? <a href="mailto:hello@thefarmerstable.co.uk" className="text-brand-olive underline">Contact our team</a>
                    </p>
                </div>
            </div>
        </div>
    );
};
