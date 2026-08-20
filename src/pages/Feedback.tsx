import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, CheckCircle, Printer, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

type FeedbackForm = {
  name: string;
  email: string;
  what_works: string;
  what_doesnt_work: string;
  whats_missing: string;
  would_use: string;
  who_benefits: string;
  support_condition: string;
  money_thoughts: string;
  community_impact: string;
  change_one_thing: string;
  add_one_thing: string;
  anything_else: string;
};

type FieldProps = {
  label: string;
  value: string;
  field: keyof FeedbackForm;
  placeholder: string;
  rows?: number;
  update: (key: keyof FeedbackForm, value: string) => void;
};

const FeedbackField: React.FC<FieldProps> = ({ label, value, field, placeholder, rows = 4, update }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold uppercase tracking-widest opacity-70">{label}</label>
    <textarea
      value={value}
      onChange={e => update(field, e.target.value)}
      rows={rows}
      className="w-full p-4 rounded-2xl bg-brand-cream/50 border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/30 focus:outline-none"
      placeholder={placeholder}
    />
  </div>
);

const initialForm: FeedbackForm = {
  name: '',
  email: '',
  what_works: '',
  what_doesnt_work: '',
  whats_missing: '',
  would_use: '',
  who_benefits: '',
  support_condition: '',
  money_thoughts: '',
  community_impact: '',
  change_one_thing: '',
  add_one_thing: '',
  anything_else: '',
};

export const Feedback: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [overall, setOverall] = useState('');
  const [form, setForm] = useState<FeedbackForm>(initialForm);

  const update = (key: keyof FeedbackForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const openForm = () => {
    setError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (!saving) setFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overall) {
      setError('Please choose Great, Suggestions, or Concerns.');
      return;
    }

    setSaving(true);
    setError('');
    const { error: saveError } = await supabase
      .from('feedback_book_responses')
      .insert({ ...form, overall });

    setSaving(false);

    if (saveError) {
      setError('We could not save this feedback just now. Please try again, or use the printed workbook.');
      return;
    }

    setSubmitted(true);
  };

  const sendAnother = () => {
    setSubmitted(false);
    setOverall('');
    setForm(initialForm);
    setError('');
  };

  return (
    <div className="py-10 md:py-16 bg-brand-cream min-h-screen print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 print:mb-6">
          <button
            type="button"
            onClick={openForm}
            className="mx-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white font-black text-sm uppercase tracking-wider shadow-sm hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 transition-all"
            aria-haspopup="dialog"
            aria-expanded={formOpen}
          >
            <BookOpen size={18} aria-hidden="true" />
            FEEDBACK BOOK — START HERE
          </button>

          <h1 className="text-5xl md:text-7xl font-serif mb-5 mt-6">
            Tell us what you <span className="italic text-brand-olive">really think.</span>
          </h1>
          <p className="text-xl text-brand-ink/70 max-w-3xl mx-auto">
            This is deliberately not a sales form. Tell us if the Farmers Table idea is good, bad, unrealistic, confusing or missing something. <strong>Good criticism is useful.</strong>
          </p>

          <div className="mt-5 flex justify-center print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-2 border-brand-olive font-bold"
            >
              <Printer size={18} aria-hidden="true" /> Print this workbook
            </button>
          </div>
        </div>

        <AnimatePresence>
          {formOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-dialog-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseDown={e => {
                if (e.target === e.currentTarget) closeForm();
              }}
            >
              <motion.div
                className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-[32px] shadow-2xl p-7 md:p-12"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
              >
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="absolute top-5 right-5 p-3 rounded-full hover:bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-olive/40 disabled:opacity-50"
                  aria-label="Close feedback form"
                >
                  <X size={22} aria-hidden="true" />
                </button>

                <h2 id="feedback-dialog-title" className="text-3xl md:text-4xl font-serif mb-3 pr-12">
                  Feedback Book
                </h2>
                <p className="text-brand-ink/70 mb-8">
                  No need to be polite. If you think it will not work, tell us why. If something is missing, tell us what. If you love it, tell us what should never be changed.
                </p>

                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-sm font-bold uppercase tracking-widest opacity-70 block">First impression</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {([['Great', ThumbsUp], ['Suggestions', MessageSquare], ['Concerns', ThumbsDown]] as const).map(([label, Icon]) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setOverall(label)}
                            className={`py-5 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${overall === label ? 'border-red-600 bg-red-50' : 'border-brand-olive/10 bg-brand-cream/40 hover:border-brand-olive/30'}`}
                          >
                            <Icon size={26} className="text-brand-olive" aria-hidden="true" />
                            <span className="font-bold">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <FeedbackField label="What works?" field="what_works" value={form.what_works} update={update} placeholder="What caught your attention or made sense?" />
                    <FeedbackField label="What doesn't work?" field="what_doesnt_work" value={form.what_doesnt_work} update={update} placeholder="What would put you off, confuse you or make you walk away?" />
                    <FeedbackField label="What's missing?" field="whats_missing" value={form.whats_missing} update={update} placeholder="What should be here that isn't?" />
                    <FeedbackField label="Would you actually use it? Why?" field="would_use" value={form.would_use} update={update} placeholder="Be honest — yes, no, maybe, or only if..." />
                    <FeedbackField label="Who benefits most?" field="who_benefits" value={form.who_benefits} update={update} placeholder="Who do you think this could genuinely help?" />
                    <FeedbackField label="What would make you support it?" field="support_condition" value={form.support_condition} update={update} placeholder="What would need to happen for you to back the idea?" />
                    <FeedbackField label="Thoughts on the money / sustainability side?" field="money_thoughts" value={form.money_thoughts} update={update} placeholder="Does the idea look financially realistic? What would you change?" />
                    <FeedbackField label="What could it do for the community?" field="community_impact" value={form.community_impact} update={update} placeholder="Jobs, skills, food, loneliness, business support, local producers, etc." />
                    <FeedbackField label="If you could change ONE thing..." field="change_one_thing" value={form.change_one_thing} update={update} placeholder="Your single biggest change." />
                    <FeedbackField label="If you could add ONE thing..." field="add_one_thing" value={form.add_one_thing} update={update} placeholder="Your single best addition." />
                    <FeedbackField label="Anything else?" field="anything_else" value={form.anything_else} update={update} placeholder="Anything we have missed — good, bad or ugly." />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-widest opacity-70">Name (optional)</label>
                        <input value={form.name} onChange={e => update('name', e.target.value)} className="w-full p-4 rounded-2xl bg-brand-cream/50 border border-brand-olive/10" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-widest opacity-70">Email (optional)</label>
                        <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="w-full p-4 rounded-2xl bg-brand-cream/50 border border-brand-olive/10" />
                      </div>
                    </div>

                    {error && <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 font-bold" role="alert">{error}</div>}

                    <button disabled={saving} type="submit" className="w-full py-5 bg-red-600 text-white rounded-full font-black text-lg flex items-center justify-center gap-3 hover:bg-red-700 transition-all disabled:opacity-60">
                      {saving ? 'Saving your feedback...' : <>Submit Feedback <Send size={20} aria-hidden="true" /></>}
                    </button>
                    <p className="text-center text-sm text-brand-ink/50">You can leave your name and email blank. Honest feedback is more important than who said it.</p>
                  </form>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-7">
                    <div className="w-24 h-24 bg-brand-olive/10 text-brand-olive rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle size={48} aria-hidden="true" />
                    </div>
                    <h3 className="text-4xl font-serif">Thank you — genuinely.</h3>
                    <p className="text-xl text-brand-ink/60 max-w-2xl mx-auto">You've done exactly what we need: you've helped test the idea rather than simply agreeing with it.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                      <button type="button" onClick={sendAnother} className="px-10 py-4 bg-brand-olive text-white rounded-full font-bold">Send Another Response</button>
                      <button type="button" onClick={closeForm} className="px-10 py-4 border-2 border-brand-olive rounded-full font-bold">Close</button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-8 text-sm text-brand-ink/50 print:mt-4">
          <p><strong>Farmers Table CIC — Community Resilience Centre</strong></p>
          <p>Feedback is being collected to improve the proposal. It is not a commitment to support or fund the project.</p>
        </div>
      </div>
    </div>
  );
};
