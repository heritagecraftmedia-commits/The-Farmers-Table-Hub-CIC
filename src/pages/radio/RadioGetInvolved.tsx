// Community submissions (spec §16).
//
// Every submission enters the moderation queue as 'pending'. The RLS policy
// rejects any insert that arrives pre-approved, so nothing here can put itself
// on air.

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, Music, Megaphone, CalendarPlus, Lightbulb, Mic2 } from 'lucide-react';

import { createSubmission, isRadioConfigured, uploadRadioFile } from '../../services/radio/stationService';
import type { SubmissionType } from '../../services/radio/types';

interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'date' | 'textarea';
  required?: boolean;
  help?: string;
}

interface FormConfig {
  value: SubmissionType;
  label: string;
  icon: React.ElementType;
  blurb: string;
  titleLabel: string;
  fields: FieldConfig[];
  allowsFile?: boolean;
}

const FORMS: FormConfig[] = [
  {
    value: 'music',
    label: 'Submit music',
    icon: Music,
    blurb: 'Send us your music. Nothing is broadcast until the station has checked that it is cleared for airplay.',
    titleLabel: 'Track title',
    allowsFile: true,
    fields: [
      { name: 'artist', label: 'Artist or band name', required: true },
      { name: 'description', label: 'About the track', type: 'textarea' },
      { name: 'localConnection', label: 'Your local connection', type: 'textarea', help: 'How are you connected to Farnham, Surrey, Hampshire or the surrounding rural communities?' },
      { name: 'website', label: 'Website or streaming link', type: 'url' },
    ],
  },
  {
    value: 'announcement',
    label: 'Community announcement',
    icon: Megaphone,
    blurb: 'Tell the community about a meeting, fundraiser, charity appeal or public notice.',
    titleLabel: 'Announcement title',
    fields: [
      { name: 'organisation', label: 'Organisation', required: true },
      { name: 'description', label: 'Announcement', type: 'textarea', required: true },
      { name: 'preferredDate', label: 'Preferred broadcast date', type: 'date' },
      { name: 'website', label: 'Website', type: 'url' },
    ],
  },
  {
    value: 'event',
    label: 'Submit an event',
    icon: CalendarPlus,
    blurb: 'Let us know about a local event so it can be considered for the noticeboard and on-air diary.',
    titleLabel: 'Event name',
    fields: [
      { name: 'organisation', label: 'Organisation', required: true },
      { name: 'description', label: 'Event details', type: 'textarea', required: true, help: 'Date, time, venue and what happens.' },
      { name: 'preferredDate', label: 'Event date', type: 'date' },
      { name: 'website', label: 'Event website', type: 'url' },
    ],
  },
  {
    value: 'programme_idea',
    label: 'Propose a programme',
    icon: Lightbulb,
    blurb: 'Got an idea for a show? Tell us what it would be and how often it would run.',
    titleLabel: 'Proposed programme name',
    fields: [
      { name: 'description', label: 'What would the programme be?', type: 'textarea', required: true },
      { name: 'frequency', label: 'How often would it run?', help: 'For example weekly, monthly, or a one-off series.' },
      { name: 'localConnection', label: 'Who would present it?', type: 'textarea' },
    ],
  },
  {
    value: 'presenter',
    label: 'Become a presenter',
    icon: Mic2,
    blurb: 'Tell us about yourself and what you would like to bring to the station.',
    titleLabel: 'What would you like to present?',
    fields: [
      { name: 'description', label: 'About you', type: 'textarea', required: true },
      { name: 'localConnection', label: 'Your local connection', type: 'textarea' },
      { name: 'frequency', label: 'Your availability' },
    ],
  },
];

const inputClasses =
  'mt-1.5 w-full rounded-2xl border border-brand-olive/20 bg-white px-4 py-3 text-brand-ink focus:border-brand-olive focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-brand-olive';

export const RadioGetInvolved: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('type') as SubmissionType | null;

  const [activeType, setActiveType] = useState<SubmissionType>(
    FORMS.some((form) => form.value === requested) ? (requested as SubmissionType) : 'music',
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requested && FORMS.some((form) => form.value === requested)) {
      setActiveType(requested);
    }
  }, [requested]);

  const form = useMemo(
    () => FORMS.find((candidate) => candidate.value === activeType) ?? FORMS[0],
    [activeType],
  );

  const switchForm = (type: SubmissionType) => {
    setActiveType(type);
    setValues({});
    setFile(null);
    setSubmitted(false);
    setError(null);
    setSearchParams({ type }, { replace: true });
  };

  const setValue = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isRadioConfigured()) {
      setError('Submissions are not connected yet. Please try again once the station database is configured.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let fileUrl: string | undefined;
      if (file) {
        fileUrl = await uploadRadioFile(file, 'radio-audio');
      }

      // Fields that are not first-class columns travel in the payload, so the
      // schema does not need a column per submission type.
      const { artist, frequency, ...rest } = values;
      const payload: Record<string, unknown> = {};
      if (artist) payload.artist = artist;
      if (frequency) payload.frequency = frequency;

      await createSubmission({
        submissionType: form.value,
        submitterName: rest.submitterName ?? '',
        submitterEmail: rest.submitterEmail ?? '',
        submitterPhone: rest.submitterPhone || undefined,
        organisation: rest.organisation || undefined,
        title: rest.title ?? '',
        description: rest.description || undefined,
        localConnection: rest.localConnection || undefined,
        website: rest.website || undefined,
        preferredDate: rest.preferredDate || undefined,
        fileUrl,
        payload,
      });

      setSubmitted(true);
      setValues({});
      setFile(null);
    } catch (submitError) {
      console.error('Radio submission:', submitError);
      setError('Your submission could not be sent. Please check the form and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-brand-olive">
            Farmers Table Hub Community Radio
          </p>
          <h1 className="font-serif text-5xl md:text-6xl">Get involved</h1>
          <p className="mt-4 max-w-3xl text-lg text-brand-ink/70">
            The station is built by the community it serves. Everything sent here is read by a real
            person before anything goes on air.
          </p>
        </header>

        {/* --- Form picker --- */}
        <div role="group" aria-label="What would you like to send?" className="mb-8 flex flex-wrap gap-2">
          {FORMS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => switchForm(value)}
              aria-pressed={activeType === value}
              className={`inline-flex min-h-12 items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive ${
                activeType === value ? 'bg-brand-olive text-white' : 'border border-brand-olive/15 bg-white text-brand-ink/70'
              }`}
            >
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>

        <section className="rounded-[32px] border border-brand-olive/5 bg-white p-8 md:p-10">
          <h2 className="font-serif text-3xl">{form.label}</h2>
          <p className="mt-2 text-brand-ink/65">{form.blurb}</p>

          {submitted ? (
            <div role="status" className="mt-8 rounded-2xl bg-emerald-50 p-6 text-emerald-900">
              <p className="flex items-center gap-2 font-bold">
                <CheckCircle2 size={20} aria-hidden="true" /> Thank you — your submission has been received.
              </p>
              <p className="mt-2 text-sm">
                It is now in the station&rsquo;s moderation queue. Someone will be in touch using the
                contact details you gave.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold">Your name <span aria-hidden="true">*</span></span>
                  <input
                    required
                    type="text"
                    autoComplete="name"
                    value={values.submitterName ?? ''}
                    onChange={(event) => setValue('submitterName', event.target.value)}
                    className={inputClasses}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold">Email <span aria-hidden="true">*</span></span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={values.submitterEmail ?? ''}
                    onChange={(event) => setValue('submitterEmail', event.target.value)}
                    className={inputClasses}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold">Phone (optional)</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={values.submitterPhone ?? ''}
                  onChange={(event) => setValue('submitterPhone', event.target.value)}
                  className={inputClasses}
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold">{form.titleLabel} <span aria-hidden="true">*</span></span>
                <input
                  required
                  type="text"
                  value={values.title ?? ''}
                  onChange={(event) => setValue('title', event.target.value)}
                  className={inputClasses}
                />
              </label>

              {form.fields.map((field) => (
                <label key={field.name} className="block">
                  <span className="text-sm font-bold">
                    {field.label}
                    {field.required && <span aria-hidden="true"> *</span>}
                  </span>
                  {field.help && <span className="mt-0.5 block text-sm text-brand-ink/55">{field.help}</span>}
                  {field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      rows={4}
                      value={values[field.name] ?? ''}
                      onChange={(event) => setValue(field.name, event.target.value)}
                      className={inputClasses}
                    />
                  ) : (
                    <input
                      required={field.required}
                      type={field.type ?? 'text'}
                      value={values[field.name] ?? ''}
                      onChange={(event) => setValue(field.name, event.target.value)}
                      className={inputClasses}
                    />
                  )}
                </label>
              ))}

              {form.allowsFile && (
                <label className="block">
                  <span className="text-sm font-bold">Audio file (optional)</span>
                  <span className="mt-0.5 block text-sm text-brand-ink/55">
                    Uploading music does not mean it is cleared for broadcast — the station checks
                    licensing before anything is played.
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="mt-1.5 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-brand-olive file:px-5 file:py-2.5 file:font-bold file:text-white"
                  />
                </label>
              )}

              {error && (
                <p role="alert" className="flex items-start gap-2 rounded-2xl bg-rose-50 p-4 text-sm text-rose-900">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand-ink px-8 py-4 font-bold text-brand-cream disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                {isSubmitting ? 'Sending…' : 'Send to the station'}
              </button>

              <p className="text-sm text-brand-ink/50">
                Your details are used only to contact you about this submission.
              </p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};
