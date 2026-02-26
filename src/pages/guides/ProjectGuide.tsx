import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, CheckCircle, Flame, ShoppingCart, Printer, Music, Info, HelpCircle } from 'lucide-react';
import { guides } from '../../data/guides';

export const ProjectGuide: React.FC = () => {
    const { guideId } = useParams<{ guideId: string }>();
    const guide = guides.find(g => g.id === guideId);

    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);

    if (!guide) {
        return (
            <div className="py-24 bg-brand-cream min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-serif mb-4">Guide Not Found</h2>
                    <Link to="/makers-hub" className="text-brand-olive font-bold hover:underline">Back to Hub</Link>
                </div>
            </div>
        );
    }

    const toggleStep = (id: number) => {
        if (completedSteps.includes(id)) {
            setCompletedSteps(completedSteps.filter(s => s !== id));
        } else {
            setCompletedSteps([...completedSteps, id]);
        }
    };

    const toggleIngredient = (ingredient: string) => {
        if (checkedIngredients.includes(ingredient)) {
            setCheckedIngredients(checkedIngredients.filter(i => i !== ingredient));
        } else {
            setCheckedIngredients([...checkedIngredients, ingredient]);
        }
    };

    return (
        <div className="py-24 bg-brand-cream min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                <Link to="/makers-hub" className="inline-flex items-center gap-2 text-brand-olive font-bold text-sm mb-8 hover:opacity-70 transition-all">
                    <ArrowLeft size={16} /> Back to Hub
                </Link>

                <div className="mb-12 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Flame size={12} /> {guide.subtitle || 'Guided Project'}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif mb-6">
                        {guide.title.split('&').map((part, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && ' & '}
                                {i === 1 ? <span className="italic text-brand-olive">{part}</span> : part}
                            </React.Fragment>
                        ))}
                    </h1>
                    <p className="text-lg text-brand-ink/60 leading-relaxed max-w-2xl mx-auto md:mx-0">
                        {guide.introduction}
                    </p>
                </div>

                {/* Utility Bar */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-12">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-brand-olive/10 text-brand-olive text-xs font-bold hover:bg-brand-olive/5 transition-all shadow-sm">
                        <Printer size={16} /> Print Instructions
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-brand-olive/10 text-brand-olive text-xs font-bold hover:bg-brand-olive/5 transition-all shadow-sm opacity-50 cursor-not-allowed">
                        <Music size={16} /> Audio Guide (Coming Soon)
                    </button>
                    <div className="flex items-center gap-2 px-6 py-3 bg-brand-olive/5 rounded-full border border-brand-olive/10 text-brand-olive text-xs font-bold">
                        <Clock size={16} /> {guide.duration}
                    </div>
                </div>

                {/* Checklist Section */}
                <div className="bg-white rounded-[40px] p-8 md:p-12 mb-12 border border-brand-olive/5 shadow-sm">
                    <h2 className="text-2xl font-serif mb-8 flex items-center gap-3">
                        <ShoppingCart className="text-brand-olive" /> Preparation Checklist
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {guide.ingredients.map((item, i) => (
                            <label
                                key={i}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${checkedIngredients.includes(item)
                                        ? 'bg-brand-olive/5 border-brand-olive/20'
                                        : 'bg-brand-cream/20 border-brand-olive/5 hover:bg-brand-cream/40'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checkedIngredients.includes(item)}
                                    onChange={() => toggleIngredient(item)}
                                    className="w-5 h-5 rounded-md border-brand-olive/20 text-brand-olive focus:ring-brand-olive/20"
                                />
                                <span className={`text-sm font-medium transition-all ${checkedIngredients.includes(item) ? 'text-brand-ink/40 line-through' : 'text-brand-ink/70'
                                    }`}>
                                    {item}
                                </span>
                            </label>
                        ))}
                    </div>

                    {guide.equipment.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-brand-cream/50">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-ink/30 mb-4">Required Equipment</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                {guide.equipment.map((item, i) => (
                                    <li key={i} className="text-sm text-brand-ink/60 flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-brand-olive/40" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Steps Section */}
                <div className="space-y-6">
                    {guide.steps.map((step, idx) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
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

                {/* Troubleshooting Section */}
                {guide.troubleshooting.length > 0 && (
                    <div className="mt-24">
                        <h2 className="text-2xl font-serif mb-8 flex items-center gap-3">
                            <HelpCircle className="text-brand-olive" /> Troubleshooting
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {guide.troubleshooting.map((item, i) => (
                                <div key={i} className="bg-white rounded-3xl p-8 border border-brand-olive/5 shadow-sm">
                                    <h3 className="text-lg font-bold text-brand-ink mb-2">"{item.issue}"</h3>
                                    <p className="text-sm text-brand-ink/60 leading-relaxed">{item.solution}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Final Call to Action */}
                <div className="mt-24 bg-brand-olive text-brand-cream p-12 md:p-16 rounded-[60px] text-center shadow-xl">
                    <h2 className="text-3xl font-serif mb-6">Mastered this Project?</h2>
                    <p className="opacity-80 mb-8 max-w-xl mx-auto leading-relaxed text-lg">
                        {guide.outcome === '1 Loaf + live starter'
                            ? "There's nothing quite like the smell of fresh sourdough in the kitchen."
                            : "A wonderful addition to your sustainable home."}
                        You've earned the <strong>{guide.title}</strong> explorer badge.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="px-12 py-5 bg-white text-brand-olive rounded-full font-bold hover:bg-brand-cream transition-all shadow-lg text-sm">
                            Complete Project
                        </button>
                        <Link to="/makers-hub" className="px-12 py-5 bg-black/10 text-brand-cream rounded-full font-bold hover:bg-black/20 transition-all text-sm">
                            Back to Hub
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};
