import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, CheckCircle, Printer, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

export const Feedback: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [overall, setOverall] = useState('');
  const [form, setForm] = useState({name:'',email:'',what_works:'',what_doesnt_work:'',whats_missing:'',would_use:'',who_benefits:'',support_condition:'',money_thoughts:'',community_impact:'',change_one_thing:'',add_one_thing:'',anything_else:''});
  const update = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overall) { setError('Please choose Great, Suggestions, or Concerns.'); return; }
    setSaving(true); setError('');
    const { error: saveError } = await supabase.from('feedback_book_responses').insert({...form, overall});
    setSaving(false);
    if (saveError) { setError('We could not save this feedback just now. Please try again, or use the printed workbook.'); return; }
    setSubmitted(true);
  };
  const Field = ({label, value, field, placeholder, rows=4}:{label:string;value:string;field:keyof typeof form;placeholder:string;rows?:number}) => (
    <div className="space-y-2"><label className="text-sm font-bold uppercase tracking-widest opacity-70">{label}</label><textarea value={value} onChange={e=>update(field,e.target.value)} rows={rows} className="w-full p-4 rounded-2xl bg-brand-cream/50 border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/30 focus:outline-none" placeholder={placeholder}/></div>
  );
  return <div className="py-10 md:py-16 bg-brand-cream min-h-screen print:bg-white print:py-0">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10 print:mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white font-black text-sm uppercase tracking-wider mb-5 print:bg-black"><BookOpen size={18}/> FEEDBACK BOOK — START HERE</div>
        <h1 className="text-5xl md:text-7xl font-serif mb-5">Tell us what you <span className="italic text-brand-olive">really think.</span></h1>
        <p className="text-xl text-brand-ink/70 max-w-3xl mx-auto">This is deliberately not a sales form. Tell us if the Farmers Table idea is good, bad, unrealistic, confusing or missing something. <strong>Good criticism is useful.</strong></p>
        <div className="mt-5 flex justify-center print:hidden"><button onClick={()=>window.print()} className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-2 border-brand-olive font-bold"><Printer size={18}/> Print this workbook</button></div>
      </div>
      <div className="bg-white rounded-[32px] p-7 md:p-12 shadow-sm border border-brand-olive/10 print:shadow-none print:border print:rounded-none">
        <AnimatePresence mode="wait">{!submitted ? <motion.form key="feedback-form" initial={{opacity:0}} animate={{opacity:1}} onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-brand-cream/60 rounded-2xl p-5 border-l-4 border-red-600"><p className="font-bold">No need to be polite.</p><p className="text-brand-ink/70">If you think it will not work, tell us why. If something is missing, tell us what. If you love it, tell us what should never be changed.</p></div>
          <div className="space-y-4"><label className="text-sm font-bold uppercase tracking-widest opacity-70 block">First impression</label><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{([['Great',ThumbsUp],['Suggestions',MessageSquare],['Concerns',ThumbsDown] ] as const).map(([label,Icon])=><button key={label} type="button" onClick={()=>setOverall(label)} className={`py-5 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${overall===label?'border-red-600 bg-red-50':'border-brand-olive/10 bg-brand-cream/40 hover:border-brand-olive/30'}`}><Icon size={26} className="text-brand-olive"/><span className="font-bold">{label}</span></button>)}</div></div>
          <Field label="What works?" field="what_works" value={form.what_works} placeholder="What caught your attention or made sense?"/>
          <Field label="What doesn't work?" field="what_doesnt_work" value={form.what_doesnt_work} placeholder="What would put you off, confuse you or make you walk away?"/>
          <Field label="What's missing?" field="whats_missing" value={form.whats_missing} placeholder="What should be here that isn't?"/>
          <Field label="Would you actually use it? Why?" field="would_use" value={form.would_use} placeholder="Be honest — yes, no, maybe, or only if..."/>
          <Field label="Who benefits most?" field="who_benefits" value={form.who_benefits} placeholder="Who do you think this could genuinely help?"/>
          <Field label="What would make you support it?" field="support_condition" value={form.support_condition} placeholder="What would need to happen for you to back the idea?"/>
          <Field label="Thoughts on the money / sustainability side?" field="money_thoughts" value={form.money_thoughts} placeholder="Does the idea look financially realistic? What would you change?"/>
          <Field label="What could it do for the community?" field="community_impact" value={form.community_impact} placeholder="Jobs, skills, food, loneliness, business support, local producers, etc."/>
          <Field label="If you could change ONE thing..." field="change_one_thing" value={form.change_one_thing} placeholder="Your single biggest change."/>
          <Field label="If you could add ONE thing..." field="add_one_thing" value={form.add_one_thing} placeholder="Your single best addition."/>
          <Field label="Anything else?" field="anything_else" value={form.anything_else} placeholder="Anything we have missed — good, bad or ugly."/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden"><div className="space-y-2"><label className="text-sm font-bold uppercase tracking-widest opacity-70">Name (optional)</label><input value={form.name} onChange={e=>update('name',e.target.value)} className="w-full p-4 rounded-2xl bg-brand-cream/50 border border-brand-olive/10"/></div><div className="space-y-2"><label className="text-sm font-bold uppercase tracking-widest opacity-70">Email (optional)</label><input type="email" value={form.email} onChange={e=>update('email',e.target.value)} className="w-full p-4 rounded-2xl bg-brand-cream/50 border border-brand-olive/10"/></div></div>
          {error&&<div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 font-bold">{error}</div>}
          <button disabled={saving} type="submit" className="w-full py-5 bg-red-600 text-white rounded-full font-black text-lg flex items-center justify-center gap-3 hover:bg-red-700 transition-all disabled:opacity-60 print:hidden">{saving?'Saving your feedback...':<>Submit Feedback <Send size={20}/></>}</button>
          <p className="text-center text-sm text-brand-ink/50 print:hidden">You can leave your name and email blank. Honest feedback is more important than who said it.</p>
        </motion.form> : <motion.div key="success" initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} className="text-center py-12 space-y-7"><div className="w-24 h-24 bg-brand-olive/10 text-brand-olive rounded-full flex items-center justify-center mx-auto"><CheckCircle size={48}/></div><h3 className="text-4xl font-serif">Thank you — genuinely.</h3><p className="text-xl text-brand-ink/60 max-w-2xl mx-auto">You've done exactly what we need: you've helped test the idea rather than simply agreeing with it.</p><button onClick={()=>{setSubmitted(false);setOverall('')}} className="px-10 py-4 bg-brand-olive text-white rounded-full font-bold print:hidden">Send Another Response</button></motion.div>}</AnimatePresence>
      </div>
      <div className="text-center mt-8 text-sm text-brand-ink/50 print:mt-4"><p><strong>Farmers Table CIC — Community Resilience Centre</strong></p><p>Feedback is being collected to improve the proposal. It is not a commitment to support or fund the project.</p></div>
    </div>
  </div>;
};
