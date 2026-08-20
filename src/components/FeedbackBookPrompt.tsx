import React, { useState } from 'react';
import { BookOpen, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FeedbackBookPrompt: React.FC = () => {
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm print:hidden">
      <div className="relative rounded-3xl border-4 border-red-600 bg-white shadow-2xl overflow-hidden">
        <button aria-label="Close feedback prompt" onClick={() => setClosed(true)} className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-red-50 text-brand-ink z-10"><X size={18}/></button>
        <Link to="/feedback" className="block hover:bg-red-50/30 focus:outline-none focus:ring-4 focus:ring-red-200">
          <div className="bg-red-600 text-white px-5 py-3 font-black text-sm uppercase tracking-wider">Have your say</div>
          <div className="p-5">
            <div className="flex gap-3 items-start"><div className="p-3 rounded-2xl bg-red-50 text-red-600"><BookOpen size={28}/></div><div><h2 className="text-xl font-black">FEEDBACK BOOK</h2><p className="text-sm text-brand-ink/70 mt-1">Good, bad or ugly — tell us what you really think.</p></div></div>
            <div className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-red-600 text-white font-black">START HERE <ArrowRight size={18}/></div>
          </div>
        </Link>
      </div>
    </div>
  );
};
