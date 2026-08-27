// Shared building blocks for the Radio Control Centre panels.

import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export const inputClasses =
  'mt-1 w-full rounded-xl border border-brand-olive/20 bg-white px-3 py-2.5 text-sm focus:border-brand-olive focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-brand-olive';

export const Panel: React.FC<{
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon: Icon, action, children }) => (
  <section className="rounded-[28px] border border-brand-olive/10 bg-white p-6 md:p-8">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2.5 font-serif text-2xl">
          {Icon && <Icon size={20} className="text-brand-olive" aria-hidden="true" />}
          {title}
        </h2>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-brand-ink/55">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="text-sm font-bold">{label}</span>
    {hint && <span className="mt-0.5 block text-xs text-brand-ink/50">{hint}</span>}
    {children}
  </label>
);

export const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}> = ({ label, value, onChange, hint, type = 'text', required, placeholder, className }) => (
  <Field label={label} hint={hint} className={className}>
    <input
      type={type}
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={inputClasses}
    />
  </Field>
);

export const TextArea: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
  className?: string;
}> = ({ label, value, onChange, hint, rows = 3, className }) => (
  <Field label={label} hint={hint} className={className}>
    <textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={inputClasses}
    />
  </Field>
);

export const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
  className?: string;
}> = ({ label, value, onChange, options, hint, className }) => (
  <Field label={label} hint={hint} className={className}>
    <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClasses}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </Field>
);

export const CheckboxField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}> = ({ label, checked, onChange, hint }) => (
  <label className="flex items-start gap-3 rounded-xl bg-brand-cream p-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-0.5 h-5 w-5 shrink-0 accent-brand-olive"
    />
    <span>
      <span className="text-sm font-bold">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-brand-ink/50">{hint}</span>}
    </span>
  </label>
);

export const PrimaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  busy?: boolean;
}> = ({ children, onClick, type = 'button', disabled, busy }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || busy}
    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-olive px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
  >
    {busy && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
    {children}
  </button>
);

export const SecondaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  tone?: 'default' | 'danger';
}> = ({ children, onClick, type = 'button', disabled, tone = 'default' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
      tone === 'danger'
        ? 'border-rose-200 bg-rose-50 text-rose-900 focus-visible:outline-rose-500'
        : 'border-brand-olive/20 bg-white text-brand-ink/75 focus-visible:outline-brand-olive'
    }`}
  >
    {children}
  </button>
);

export const ErrorNote: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <p role="alert" className="mb-5 flex items-start gap-2 rounded-2xl bg-rose-50 p-4 text-sm text-rose-900">
      <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" /> {message}
    </p>
  ) : null;

export const EmptyNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-2xl bg-brand-cream p-5 text-sm text-brand-ink/60">{children}</p>
);

/** Standard message when a write fails because the migration is not applied. */
export const describeError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (/does not exist|42P01/i.test(message)) {
    return 'The radio V3 migration has not been applied to this Supabase project yet. Run supabase/migrations/20260827_radio_v3_station.sql, then try again.';
  }
  if (/row-level security|violates/i.test(message)) {
    return 'That change was refused. Radio content can only be managed by founder, staff or radio manager accounts.';
  }
  return message;
};
