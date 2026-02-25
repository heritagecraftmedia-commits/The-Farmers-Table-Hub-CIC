import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, Store, User, CreditCard, ShieldCheck } from 'lucide-react';

export const Join: React.FC = () => {
  const [type, setType] = useState<'producer' | 'member'>('producer');
  const [step, setStep] = useState(1);

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Join the <span className="italic text-brand-olive">Farmers Table Hub</span></h1>
          <p className="text-xl text-brand-ink/70 max-w-2xl mx-auto">
            Whether you're a local producer looking for visibility or a community member wanting to support our mission, we'd love to have you.
          </p>
        </div>

        {/* Type Selector */}
        <div className="flex p-2 bg-white rounded-full shadow-sm border border-brand-olive/5 mb-12 max-w-md mx-auto">
          <button 
            onClick={() => { setType('producer'); setStep(1); }}
            className={`flex-1 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${type === 'producer' ? 'bg-brand-olive text-white shadow-lg shadow-brand-olive/20' : 'text-brand-ink/50 hover:text-brand-ink'}`}
          >
            <Store size={20} /> I'm a Producer
          </button>
          <button 
            onClick={() => { setType('member'); setStep(1); }}
            className={`flex-1 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${type === 'member' ? 'bg-brand-olive text-white shadow-lg shadow-brand-olive/20' : 'text-brand-ink/50 hover:text-brand-ink'}`}
          >
            <User size={20} /> I'm a Member
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-[40px] p-8 md:p-16 shadow-sm border border-brand-olive/5">
          <AnimatePresence mode="wait">
            {type === 'producer' ? (
              <motion.div 
                key="producer-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="flex justify-between items-center mb-12">
                  <div className="flex gap-4">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`w-3 h-3 rounded-full ${step >= s ? 'bg-brand-olive' : 'bg-brand-cream'}`}></div>
                    ))}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest opacity-40">Step {step} of 3</span>
                </div>

                {step === 1 && (
                  <div className="space-y-8">
                    <h3 className="text-3xl font-serif">Tell us about your business</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-widest opacity-50">Business Name</label>
                        <input type="text" className="w-full p-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20" placeholder="e.g. Green Valley Farm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-widest opacity-50">Produce Type</label>
                        <select className="w-full p-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20">
                          <option>Vegetables & Herbs</option>
                          <option>Bread & Pastries</option>
                          <option>Dairy & Eggs</option>
                          <option>Meat & Poultry</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-bold uppercase tracking-widest opacity-50">Location</label>
                        <input type="text" className="w-full p-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20" placeholder="e.g. Farnham, Surrey" />
                      </div>
                    </div>
                    <button onClick={() => setStep(2)} className="w-full py-5 bg-brand-olive text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-brand-olive/90 transition-all">
                      Continue <ArrowRight size={20} />
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8">
                    <h3 className="text-3xl font-serif">Choose your listing tier</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 rounded-3xl border-2 border-brand-cream hover:border-brand-olive/20 transition-all cursor-pointer group">
                        <h4 className="text-xl font-bold mb-2">Basic Listing</h4>
                        <p className="text-brand-ink/50 text-sm mb-6">Free for local micro-producers</p>
                        <ul className="space-y-3 mb-8">
                          <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-brand-olive" /> Directory presence</li>
                          <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-brand-olive" /> Basic profile</li>
                        </ul>
                        <button className="w-full py-3 rounded-full border border-brand-olive/20 font-bold group-hover:bg-brand-olive group-hover:text-white transition-all">Select</button>
                      </div>
                      <div className="p-8 rounded-3xl border-2 border-brand-olive bg-brand-olive/5 relative">
                        <div className="absolute top-4 right-4 bg-brand-olive text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Recommended</div>
                        <h4 className="text-xl font-bold mb-2">Premium Partner</h4>
                        <p className="text-brand-ink/50 text-sm mb-6">£10 / month</p>
                        <ul className="space-y-3 mb-8">
                          <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-brand-olive" /> Featured directory spot</li>
                          <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-brand-olive" /> Radio spotlight show</li>
                          <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-brand-olive" /> Social media promotion</li>
                        </ul>
                        <button className="w-full py-3 rounded-full bg-brand-olive text-white font-bold">Select</button>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setStep(1)} className="flex-1 py-5 border border-brand-olive/20 rounded-full font-bold">Back</button>
                      <button onClick={() => setStep(3)} className="flex-[2] py-5 bg-brand-olive text-white rounded-full font-bold">Continue</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="text-center space-y-8 py-12">
                    <div className="w-24 h-24 bg-brand-olive/10 text-brand-olive rounded-full flex items-center justify-center mx-auto">
                      <ShieldCheck size={48} />
                    </div>
                    <h3 className="text-4xl font-serif">Application Received!</h3>
                    <p className="text-xl text-brand-ink/60 max-w-md mx-auto">
                      Our Office PA (Thalia) will review your details and get back to you within 48 hours to finalize your listing.
                    </p>
                    <button onClick={() => { setStep(1); setType('producer'); }} className="px-12 py-5 bg-brand-olive text-white rounded-full font-bold">
                      Back to Home
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="member-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-8">
                  <h3 className="text-3xl font-serif">Become a Community Supporter</h3>
                  <p className="text-lg text-brand-ink/60 leading-relaxed">
                    Your membership directly funds our radio programming and training hub. Choose a contribution level that works for you.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['£5', '£10', '£25'].map(amount => (
                      <button key={amount} className="p-6 rounded-2xl border-2 border-brand-cream hover:border-brand-olive/20 transition-all text-center">
                        <span className="block text-2xl font-serif mb-1">{amount}</span>
                        <span className="text-xs font-bold uppercase tracking-widest opacity-40">Monthly</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6 pt-8">
                    <div className="space-y-2">
                      <label className="text-sm font-bold uppercase tracking-widest opacity-50">Full Name</label>
                      <input type="text" className="w-full p-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold uppercase tracking-widest opacity-50">Email Address</label>
                      <input type="email" className="w-full p-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20" />
                    </div>
                  </div>

                  <button className="w-full py-5 bg-brand-olive text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-brand-olive/90 transition-all">
                    Proceed to Payment <CreditCard size={20} />
                  </button>
                  
                  <p className="text-center text-xs text-brand-ink/40">
                    Payments are processed securely via Stripe. You can cancel your membership at any time.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
