import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, CheckCircle, Flame, ShoppingCart, Printer, Music, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const JamGuide: React.FC = () => {
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const steps = [
        {
            id: 1,
            title: 'Preparation & Sterilizing',
            description: 'Wash your jars and lids in hot soapy water, then place them in a preheated oven (100°C) for at least 30 minutes to sterilize.',
            tip: 'Place a few small plates in the freezer now — you\'ll need them to test the jam\'s setting point later.'
        },
        {
            id: 2,
            title: 'Fruit & Sugar',
            description: 'Place your prepared local seasonal fruit in a large preserving pan. Add the sugar and lemon juice (or pectin).',
            tip: 'Don\'t fill the pan more than half full; the jam will foam up as it boils.'
        },
        {
            id: 3,
            title: 'The Slow Dissolve',
            description: 'Heat gently, stirring occasionally, until all the sugar has completely dissolved. Do not let it boil yet.',
            tip: 'Run your wooden spoon along the bottom — if you can\'t feel any gritty sugar crystals, it\'s ready.'
        },
        {
            id: 4,
            title: 'The Rolling Boil',
            description: 'Turn up the heat and bring to a full rolling boil. Let it boil hard for about 5-10 minutes without stirring.',
            tip: 'Watch the pan closely! If it looks like it might boil over, remove from heat for a moment.'
        },
        {
            id: 5,
            title: 'The Wrinkle Test',
            description: 'Remove from heat. Place a spoonful of jam on a chilled plate from the freezer. Wait a minute, then push the edge with your finger.',
            tip: 'If it wrinkles, it\'s set! if not, boil for another 2 minutes and test again.'
        }
    ];

    const toggleStep = (id: number) => {
        if (completedSteps.includes(id)) {
            setCompletedSteps(completedSteps.filter(s => s !== id));
        } else {
            setCompletedSteps([...completedSteps, id]);
        }
    };

    return (
        <div className="py-24 bg-brand-cream min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                <Link to="/makers-hub" className="inline-flex items-center gap-2 text-brand-olive font-bold text-sm mb-8 hover:opacity-70 transition-all">
                    <ArrowLeft size={16} /> Back to Hub
                </Link>

                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Flame size={12} /> Guided Project
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif mb-6">Seasonal Jam & <span className="italic text-brand-olive">Preserves</span></h1>
                    <p className="text-lg text-brand-ink/60 leading-relaxed max-w-2xl">
                        A slow, step-by-step guide to preserving the season. Gather your local fruit and let's get started.
                    </p>
                </div>

                {/* Utility Bar */}
                <div className="flex flex-wrap gap-4 mb-12">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-brand-olive/10 text-brand-olive text-xs font-bold hover:bg-brand-olive/5 transition-all shadow-sm">
                        <Printer size={16} /> Print Labels
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-brand-olive/10 text-brand-olive text-xs font-bold hover:bg-brand-olive/5 transition-all shadow-sm opacity-50 cursor-not-allowed">
                        <Music size={16} /> Audio Walkthrough (Coming Soon)
                    </button>
                    <div className="flex items-center gap-2 px-6 py-3 bg-brand-olive/5 rounded-full border border-brand-olive/10 text-brand-olive text-xs font-bold">
                        <Clock size={16} /> 2–3 Hours
                    </div>
                </div>

                {/* Checklist / Ingredients */}
                <div className="bg-white rounded-[40px] p-8 md:p-12 mb-12 border border-brand-olive/5 shadow-sm">
                    <h2 className="text-2xl font-serif mb-8 flex items-center gap-3">
                        <ShoppingCart className="text-brand-olive" /> Preparation Checklist
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            '1kg Local Seasonal Fruit',
                            '1kg Granulated Sugar',
                            'Juice of 1 Lemon (or Pectin)',
                            'Jam Jars & Lids (Sterilized)',
                            'Wax Discs (Optional)',
                            'Large Preserving Pan'
                        ].map((item, i) => (
                            <label key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-brand-cream/20 border border-brand-olive/5 cursor-pointer hover:bg-brand-cream/40 transition-all">
                                <input type="checkbox" className="w-5 h-5 rounded-md border-brand-olive/20 text-brand-olive focus:ring-brand-olive/20" />
                                <span className="text-sm font-medium text-brand-ink/70">{item}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-6">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => toggleStep(step.id)}
                            className={`bg-white rounded-[40px] p-8 md:p-12 border transition-all cursor-pointer group ${completedSteps.includes(step.id)
                                ? 'border-brand-olive/30 bg-brand-cream/10'
                                : 'border-brand-olive/5 shadow-sm hover:border-brand-olive/20'
                                }`}
                        >
                            <div className="flex items-start gap-6">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 transition-all ${completedSteps.includes(step.id)
                                    ? 'bg-brand-olive text-white'
                                    : 'bg-brand-cream text-brand-olive'
                                    }`}>
                                    {completedSteps.includes(step.id) ? <CheckCircle size={20} /> : step.id}
                                </div>
                                <div className="flex-grow">
                                    <h3 className={`text-xl font-bold mb-3 transition-all ${completedSteps.includes(step.id) ? 'text-brand-ink/40 line-through' : 'text-brand-ink'
                                        }`}>
                                        {step.title}
                                    </h3>
                                    <p className={`text-sm leading-relaxed mb-6 transition-all ${completedSteps.includes(step.id) ? 'text-brand-ink/20' : 'text-brand-ink/60'
                                        }`}>
                                        {step.description}
                                    </p>
                                    <div className="p-4 bg-brand-olive/5 rounded-2xl border border-brand-olive/10 flex gap-3 text-xs text-brand-ink/60 leading-relaxed">
                                        <Info className="text-brand-olive shrink-0" size={16} />
                                        <span><strong>Pro Tip:</strong> {step.tip}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 bg-brand-olive text-brand-cream p-12 rounded-[60px] text-center shadow-xl">
                    <h2 className="text-3xl font-serif mb-6">Enjoy Your Preserve</h2>
                    <p className="opacity-80 mb-8 max-w-xl mx-auto leading-relaxed">
                        Don't forget to label your jars with the date and fruit variety.
                        They make wonderful gifts for the community.
                    </p>
                    <button className="px-12 py-5 bg-white text-brand-olive rounded-full font-bold hover:bg-brand-cream transition-all shadow-lg">
                        Complete Project
                    </button>
                </div>

            </div>
        </div>
    );
};
