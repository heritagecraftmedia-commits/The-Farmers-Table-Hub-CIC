import { Send, CheckCircle, ArrowLeft, Info, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const BecomeAMaker: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        businessName: '',
        category: 'Tool Makers',
        website: '',
        location: '',
        description: '',
        affiliateInterested: 'Yes'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would send to Supabase or an email service
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="py-24 bg-brand-cream min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full mx-4 bg-white rounded-[60px] p-12 text-center shadow-xl border border-brand-olive/5"
                >
                    <div className="w-20 h-20 bg-brand-olive/10 text-brand-olive rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle size={40} />
                    </div>
                    <h1 className="text-4xl font-serif mb-4">Application Received!</h1>
                    <p className="text-brand-ink/60 mb-12">
                        Thank you for your interest in joining The Farmers Table makers community.
                        We review every application manually to ensure a perfect fit for our heritage craft directory.
                    </p>
                    <Link to="/makers" className="inline-flex items-center gap-2 px-12 py-5 bg-brand-olive text-white rounded-full font-bold text-lg hover:bg-brand-olive/90 transition-all">
                        <ArrowLeft size={20} /> Back to Directory
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="py-24 bg-brand-cream min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-16">
                    <Link to="/makers" className="inline-flex items-center gap-2 text-brand-olive font-bold text-sm mb-8 hover:opacity-70 transition-all">
                        <ArrowLeft size={16} /> Back to Directory
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-serif mb-6">Become a <span className="italic text-brand-olive">Maker</span></h1>
                    <p className="text-xl text-brand-ink/60 max-w-2xl leading-relaxed">
                        Join our curated directory of heritage craftspeople and independent artisans.
                        Support the community and get noticed by people who value quality craftsmanship.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Benefits Sidebar */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-brand-olive text-brand-cream p-8 rounded-[40px] shadow-sm">
                            <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                                <Star size={20} fill="currentColor" /> Why Join?
                            </h3>
                            <ul className="space-y-4 text-sm opacity-90">
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                                    <span>Curated visibility to a targeted audience of craft lovers.</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                                    <span>No stock management or fees – we link directly to your shop.</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                                    <span>Inclusive and heritage-focused community support.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm flex gap-4">
                            <Info className="text-brand-olive shrink-0" size={20} />
                            <p className="text-xs text-brand-ink/50 leading-relaxed">
                                <strong>Note:</strong> We prioritize UK-based makers using traditional techniques or sustainable materials.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-brand-olive/5">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full p-4 rounded-xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Business / Maker Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full p-4 rounded-xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20"
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Category</label>
                                        <select
                                            className="w-full p-4 rounded-xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option>Tool Makers</option>
                                            <option>Artisan Clothing</option>
                                            <option>Footwear & Leather</option>
                                            <option>Woodcraft & Furniture</option>
                                            <option>Textiles & Fibres</option>
                                            <option>Outdoor Builds</option>
                                            <option>Metalwork & Ironcraft</option>
                                            <option>Home & Living</option>
                                            <option>Heritage Crafts</option>
                                            <option>Garden & Land-Based</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Website / Shop URL</label>
                                        <input
                                            required
                                            type="url"
                                            placeholder="https://..."
                                            className="w-full p-4 rounded-xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Location (Town/City)</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-4 rounded-xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Tell us about your craft</label>
                                    <textarea
                                        required
                                        rows={4}
                                        className="w-full p-4 rounded-xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20 resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Do you offer affiliate/referral links?</label>
                                    <div className="flex gap-4">
                                        {['Yes', 'No', 'Interested'].map(option => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, affiliateInterested: option })}
                                                className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${formData.affiliateInterested === option
                                                    ? 'bg-brand-olive text-white'
                                                    : 'bg-brand-cream/50 text-brand-ink/40 hover:bg-brand-cream'
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-brand-olive text-white rounded-2xl font-bold text-lg hover:bg-brand-olive/90 transition-all shadow-xl shadow-brand-olive/20 flex items-center justify-center gap-2"
                                >
                                    Submit Application <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
