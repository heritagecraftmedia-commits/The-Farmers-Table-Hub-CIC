import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Feedback: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Your <span className="italic text-brand-olive">Feedback</span></h1>
          <p className="text-xl text-brand-ink/70 max-w-2xl mx-auto">
            Help us grow. Whether it's a suggestion, a compliment, or a concern, we value your input on how we can better serve Farnham.
          </p>
        </div>

        <div className="bg-white rounded-[40px] p-8 md:p-16 shadow-sm border border-brand-olive/5">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="feedback-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest opacity-50">Name (Optional)</label>
                    <input type="text" className="w-full p-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest opacity-50">Email (Optional)</label>
                    <input type="email" className="w-full p-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-widest opacity-50 block">How are we doing?</label>
                  <div className="flex gap-4">
                    <button type="button" className="flex-1 py-4 rounded-2xl bg-brand-cream/50 flex flex-col items-center gap-2 hover:bg-brand-olive/10 transition-all border-2 border-transparent hover:border-brand-olive/20">
                      <ThumbsUp size={24} className="text-brand-olive" />
                      <span className="text-xs font-bold">Great</span>
                    </button>
                    <button type="button" className="flex-1 py-4 rounded-2xl bg-brand-cream/50 flex flex-col items-center gap-2 hover:bg-brand-olive/10 transition-all border-2 border-transparent hover:border-brand-olive/20">
                      <MessageSquare size={24} className="text-brand-olive" />
                      <span className="text-xs font-bold">Suggestions</span>
                    </button>
                    <button type="button" className="flex-1 py-4 rounded-2xl bg-brand-cream/50 flex flex-col items-center gap-2 hover:bg-brand-olive/10 transition-all border-2 border-transparent hover:border-brand-olive/20">
                      <ThumbsDown size={24} className="text-brand-olive" />
                      <span className="text-xs font-bold">Concerns</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest opacity-50">Your Message</label>
                  <textarea 
                    rows={6}
                    className="w-full p-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20"
                    placeholder="Tell us what's on your mind..."
                    required
                  ></textarea>
                </div>

                <button type="submit" className="w-full py-5 bg-brand-olive text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-brand-olive/90 transition-all">
                  Send Feedback <Send size={20} />
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-8"
              >
                <div className="w-24 h-24 bg-brand-olive/10 text-brand-olive rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={48} />
                </div>
                <h3 className="text-4xl font-serif">Thank You!</h3>
                <p className="text-xl text-brand-ink/60 max-w-md mx-auto">
                  Your feedback has been received. We review every message and use it to improve our community hub.
                </p>
                <button onClick={() => setSubmitted(false)} className="px-12 py-5 bg-brand-olive text-white rounded-full font-bold">
                  Send Another Message
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
