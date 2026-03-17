import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

type ApplicantType = 'Grower' | 'Beekeeper' | 'Maker' | 'Other';

interface FormState {
  name: string;
  email: string;
  businessName: string;
  type: ApplicantType | '';
  description: string;
  location: string;
}

const EMPTY_FORM: FormState = {
  name: '', email: '', businessName: '', type: '', description: '', location: '',
};

export const Apply: React.FC = () => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.type) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    setSubmitting(true);

    const { error: dbError } = await supabase.from('applications').insert({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      business_name: form.businessName.trim() || null,
      type: form.type,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      status: 'pending',
    });

    if (dbError) {
      console.error('Application insert error:', dbError);
      setError('Something went wrong. Please try again or email us directly at hello@thefarmerstable.co.uk');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const inputClass = 'w-full px-5 py-4 rounded-2xl bg-brand-cream/60 border border-brand-olive/10 focus:outline-none focus:ring-2 focus:ring-brand-olive/30 text-brand-ink placeholder:text-brand-ink/30 text-sm';
  const labelClass = 'block text-xs font-bold uppercase tracking-widest text-brand-ink/50 mb-2';

  return (
    <div className="min-h-screen bg-brand-cream py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-olive/10 flex items-center justify-center mx-auto mb-6">
            <ClipboardList size={24} className="text-brand-olive" />
          </div>
          <h1 className="text-5xl font-serif mb-4">Apply to Join</h1>
          <p className="text-brand-ink/60 max-w-md mx-auto">
            Apply to become a listed maker, grower, or producer in the Farmers Table community.
            Applications are reviewed within 3 working days.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] p-12 border border-brand-olive/5 shadow-sm text-center"
            >
              <CheckCircle2 size={52} className="text-brand-olive mx-auto mb-6" />
              <h2 className="text-3xl font-serif mb-3">Application received!</h2>
              <p className="text-brand-ink/60 mb-8 max-w-sm mx-auto">
                Thanks, <strong>{form.name.split(' ')[0]}</strong>. We'll review your application and
                be in touch at <strong>{form.email}</strong> within 3 working days.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all"
              >
                Back to Home <ArrowRight size={18} />
              </Link>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="bg-white rounded-[40px] p-8 md:p-12 border border-brand-olive/5 shadow-sm space-y-6"
            >
              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name <span className="text-red-400">*</span></label>
                  <input type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith" className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Email <span className="text-red-400">*</span></label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" className={inputClass} required />
                </div>
              </div>

              {/* Business name + Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Business / Project Name</label>
                  <input type="text" value={form.businessName} onChange={set('businessName')} placeholder="Optional" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Type <span className="text-red-400">*</span></label>
                  <select value={form.type} onChange={set('type')} className={inputClass} required>
                    <option value="">Select one…</option>
                    <option value="Grower">Grower</option>
                    <option value="Beekeeper">Beekeeper</option>
                    <option value="Maker">Maker</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className={labelClass}>Location</label>
                <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Farnham, Surrey" className={inputClass} />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Short Description</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Tell us a bit about what you make or grow…"
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-2xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : (
                  <>Submit Application <ArrowRight size={16} /></>
                )}
              </button>

              <p className="text-center text-xs text-brand-ink/30">
                Already applied?{' '}
                <a href="mailto:hello@thefarmerstable.co.uk" className="underline hover:text-brand-olive">
                  Get in touch
                </a>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
