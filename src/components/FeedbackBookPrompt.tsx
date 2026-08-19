import React, { useState } from 'react';
import { BookOpen, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FeedbackBookPrompt: React.FC = () => {
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[60] max-w-sm print:hidden">
      <div className="relative rounded-3xl border-4 border-red-600 bg-white shadow-2xl overflow-hidden">
        <button aria-label="Close feedback prompt" onClick={() => setClosed(true)} className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-red-50 text-brand-ink"><X size={18}/></button>
        <div className="bg-red-600 text-white px-5 py-3 font-black text-sm uppercase tracking-wider">Have your say</div>
        <div className="p-5">
          <div className="flex gap-3 items-start"><div className="p-3 rounded-2xl bg-red-50 text-red-600"><BookOpen size={28}/></div><div><h2 className="text-xl font-black">FEEDBACK BOOK</h2><p className="text-sm text-brand-ink/70 mt-1">Good, bad or ugly — tell us what you really think.</p></div></div>
          <Link to="/feedback" className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-red-600 text-white font-black hover:bg-red-700">START HERE <ArrowRight size={18}/></Link>
        </div>
      </div>
    </div>
  );
};
