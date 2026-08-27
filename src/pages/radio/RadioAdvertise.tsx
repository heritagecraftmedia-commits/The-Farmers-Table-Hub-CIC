// Advertising and sponsorship information (spec §12, §13).
//
// This page explains the packages and invites enquiries. It deliberately shows
// NO example advertisers or sponsors — placement slots are shown until real
// clients exist in the database (spec §29).

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Megaphone, Radio as RadioIcon } from 'lucide-react';

import { ContentSlot, ContentSlotGrid } from '../../components/radio/ContentSlot';
import { getPublishedProgrammes } from '../../services/radio/stationService';
import type { RadioProgramme } from '../../services/radio/types';

const SPOT_PACKAGES = [
  { name: '10-second spot', detail: 'A short mention, ideal for a simple message or an opening time.' },
  { name: '20-second spot', detail: 'Room for a little more detail about what you do.' },
  { name: '30-second spot', detail: 'A full advert with space for an offer or a call to action.' },
];

const SPONSORSHIP_PACKAGES = [
  { name: 'Programme sponsorship', detail: 'Your name at the start and end of a regular programme.' },
  { name: 'Station sponsorship', detail: 'Support the station as a whole rather than one show.' },
  { name: 'Event sponsorship', detail: 'Back an outside broadcast from a market, show or festival.' },
  { name: 'Community announcement', detail: 'For charities and community groups with something to share.' },
  { name: 'Sponsored feature', detail: 'A regular segment such as a weather, market or diary slot.' },
];

export const RadioAdvertise: React.FC = () => {
  const [programmes, setProgrammes] = useState<RadioProgramme[]>([]);

  useEffect(() => {
    let cancelled = false;
    getPublishedProgrammes()
      .then((rows) => { if (!cancelled) setProgrammes(rows); })
      .catch((error) => console.error('Advertise page:', error));
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-brand-cream py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-brand-olive">
            Farmers Table Hub Community Radio
          </p>
          <h1 className="font-serif text-5xl md:text-6xl">Advertise &amp; sponsor</h1>
          <p className="mt-4 max-w-3xl text-lg text-brand-ink/70">
            The station exists to support the community it broadcasts to. Free community promotion
            comes first; paid advertising and sponsorship help keep the station running.
          </p>
        </header>

        {/* --- Advertising packages --- */}
        <section className="rounded-[32px] border border-brand-olive/5 bg-white p-8 md:p-10">
          <h2 className="flex items-center gap-3 font-serif text-3xl">
            <Megaphone className="text-brand-olive" aria-hidden="true" /> Advertising spots
          </h2>
          <ul className="mt-7 grid gap-4 sm:grid-cols-3">
            {SPOT_PACKAGES.map((spot) => (
              <li key={spot.name} className="rounded-2xl bg-brand-cream p-6">
                <p className="font-bold">{spot.name}</p>
                <p className="mt-2 text-sm text-brand-ink/65">{spot.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Sponsorship --- */}
        <section className="mt-8 rounded-[32px] border border-brand-olive/5 bg-white p-8 md:p-10">
          <h2 className="flex items-center gap-3 font-serif text-3xl">
            <Handshake className="text-brand-olive" aria-hidden="true" /> Sponsorship
          </h2>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2">
            {SPONSORSHIP_PACKAGES.map((option) => (
              <li key={option.name} className="rounded-2xl bg-brand-cream p-6">
                <p className="font-bold">{option.name}</p>
                <p className="mt-2 text-sm text-brand-ink/65">{option.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Programmes available to sponsor --- */}
        <section className="mt-8 rounded-[32px] border border-brand-olive/5 bg-white p-8 md:p-10">
          <h2 className="flex items-center gap-3 font-serif text-3xl">
            <RadioIcon className="text-brand-olive" aria-hidden="true" /> Programmes you could sponsor
          </h2>
          {programmes.length === 0 ? (
            <div className="mt-7">
              <ContentSlot
                kind="sponsorship"
                hint="Published programmes appear here as sponsorship opportunities once the schedule is live."
              />
            </div>
          ) : (
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {programmes.map((programme) => (
                <li key={programme.id} className="rounded-2xl bg-brand-cream p-5">
                  <p className="font-bold">{programme.title}</p>
                  {programme.category && (
                    <p className="mt-0.5 text-sm text-brand-ink/50">{programme.category}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- Current advertisers: intentionally empty until real clients exist --- */}
        <section className="mt-8 rounded-[32px] border border-brand-olive/5 bg-white p-8 md:p-10">
          <h2 className="font-serif text-3xl">Our advertisers</h2>
          <p className="mt-2 text-brand-ink/60">
            These places are reserved for real local businesses. Nothing here is invented.
          </p>
          <div className="mt-7">
            <ContentSlotGrid count={3} kind="advertisement" />
          </div>
        </section>

        <section className="mt-8 rounded-[32px] bg-brand-ink p-8 text-brand-cream md:p-12">
          <h2 className="font-serif text-3xl">Talk to us</h2>
          <p className="mt-3 max-w-2xl text-brand-cream/75">
            Tell us about your business or organisation and we will find the right fit. Community
            groups and charities should ask about free promotion first.
          </p>
          <Link
            to="/radio/get-involved?type=announcement"
            className="mt-6 inline-flex min-h-14 items-center rounded-full bg-brand-cream px-8 py-4 font-bold text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream"
          >
            Send an enquiry
          </Link>
        </section>
      </div>
    </div>
  );
};
