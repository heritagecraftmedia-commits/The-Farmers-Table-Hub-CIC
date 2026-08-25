import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, ExternalLink, Headphones, Info, ListMusic, Radio as RadioIcon, Users } from 'lucide-react';
import { radioService, RadioBroadcast, RadioShow } from '../services/radioService';

const streamUrl = import.meta.env.VITE_RADIO_STREAM_URL as string | undefined;

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(value));

export const Radio: React.FC = () => {
  const [shows, setShows] = useState<RadioShow[]>([]);
  const [broadcasts, setBroadcasts] = useState<RadioBroadcast[]>([]);
  const [directory, setDirectory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      radioService.getShows(),
      radioService.getUpcomingBroadcasts(),
      radioService.getPublicDirectory(),
    ])
      .then(([loadedShows, loadedBroadcasts, loadedDirectory]) => {
        if (!mounted) return;
        setShows(loadedShows);
        setBroadcasts(loadedBroadcasts);
        setDirectory(loadedDirectory);
      })
      .catch((err) => {
        console.error('Radio page:', err);
        if (mounted) setError('Radio information is temporarily unavailable.');
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  const current = broadcasts.find((b) => b.status === 'live');
  const upcoming = useMemo(() => broadcasts.filter((b) => b.status === 'scheduled'), [broadcasts]);

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-brand-olive font-bold uppercase tracking-[0.2em] text-sm mb-4">Farmers Table Radio</p>
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Local <span className="italic text-brand-olive">voices</span>, locally made.</h1>
          <p className="text-xl text-brand-ink/70 max-w-3xl">
            Community radio for Farnham and the surrounding area. We are starting simply: prepared programmes, local stories, community notices and outside broadcasts — built around real local people and businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 bg-brand-ink text-brand-cream rounded-[40px] p-8 md:p-12 shadow-2xl">
            <div className="flex items-center gap-3 mb-10">
              <span className={`w-3 h-3 rounded-full ${current ? 'bg-red-500 animate-pulse' : 'bg-brand-cream/30'}`} />
              <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">{current ? 'Live now' : 'Ready to broadcast'}</span>
            </div>

            {current ? (
              <div>
                <h2 className="text-4xl md:text-5xl font-serif mb-4">{current.title}</h2>
                <p className="text-brand-cream/60 mb-8">Started at {formatTime(current.startsAt)}</p>
                {streamUrl ? (
                  <audio className="w-full" controls src={streamUrl} />
                ) : (
                  <div className="rounded-2xl border border-brand-cream/10 p-5 text-brand-cream/70">
                    <Headphones className="inline-block mr-2" size={18} />
                    The live stream will appear here when the radio stream is connected.
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-4xl md:text-5xl font-serif mb-4">Farmers Table Radio is getting ready.</h2>
                <p className="text-brand-cream/60 text-lg max-w-2xl mb-8">
                  There is no fictional “live show” here. Once a real programme is scheduled, it will appear on this page.
                </p>
                {streamUrl && <audio className="w-full" controls src={streamUrl} />}
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-brand-cream/10 grid sm:grid-cols-3 gap-6 text-sm text-brand-cream/60">
              <div className="flex items-center gap-2"><RadioIcon size={16} /> Outside broadcasts</div>
              <div className="flex items-center gap-2"><ListMusic size={16} /> Pre-produced playlists</div>
              <div className="flex items-center gap-2"><Users size={16} /> Local community</div>
            </div>
          </section>

          <aside className="space-y-8">
            <div className="bg-brand-olive text-white rounded-[32px] p-8">
              <h3 className="text-2xl font-serif mb-4">Advertise with us</h3>
              <p className="text-white/75 leading-relaxed mb-6">
                We are starting by giving local businesses and community organisations a chance to be seen and heard. Free community promotion comes first; paid advertising and sponsorship can grow from there.
              </p>
              <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-olive rounded-full font-bold">Talk to Farmers Table <ExternalLink size={16} /></a>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-brand-olive/5">
              <h3 className="text-2xl font-serif mb-5">How we're starting</h3>
              <ol className="space-y-4 text-sm text-brand-ink/70">
                <li><strong>1.</strong> Build the local directory.</li>
                <li><strong>2.</strong> Promote real local businesses and organisations.</li>
                <li><strong>3.</strong> Create playlists, jingles and community notices.</li>
                <li><strong>4.</strong> Add adverts and sponsorship as customers develop.</li>
                <li><strong>5.</strong> Take the radio outside to local events.</li>
              </ol>
            </div>
          </aside>
        </div>

        <section className="mt-10 bg-white rounded-[32px] p-8 md:p-10 border border-brand-olive/5">
          <h3 className="text-3xl font-serif mb-8 flex items-center gap-3"><Calendar className="text-brand-olive" /> Upcoming broadcasts</h3>
          {loading ? (
            <p className="text-brand-ink/50">Loading the real radio schedule…</p>
          ) : error ? (
            <p className="text-brand-ink/50">{error}</p>
          ) : upcoming.length === 0 ? (
            <div className="rounded-2xl bg-brand-cream p-6 text-brand-ink/60">
              No broadcasts have been scheduled yet. This is where the real Farmers Table programme schedule will appear.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {upcoming.map((broadcast) => (
                <div key={broadcast.id} className="p-5 rounded-2xl bg-brand-cream flex items-start gap-4">
                  <Clock className="text-brand-olive mt-1" size={20} />
                  <div>
                    <p className="font-bold">{broadcast.title}</p>
                    <p className="text-sm text-brand-ink/50">{formatDate(broadcast.startsAt)} · {formatTime(broadcast.startsAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[32px] p-8 border border-brand-olive/5">
            <h3 className="text-2xl font-serif mb-5">Programmes</h3>
            {shows.length === 0 ? (
              <p className="text-brand-ink/50">No programmes have been published yet.</p>
            ) : (
              <div className="space-y-4">
                {shows.map((show) => (
                  <div key={show.id} className="flex justify-between gap-4 border-b border-brand-ink/5 pb-4 last:border-0">
                    <div><p className="font-bold">{show.title}</p><p className="text-sm text-brand-ink/50">{show.host}</p></div>
                    <span className="text-sm text-brand-olive">{show.schedule}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-brand-olive/5">
            <h3 className="text-2xl font-serif mb-5">Local businesses & organisations</h3>
            {directory.length === 0 ? (
              <p className="text-brand-ink/50">The real directory will appear here as listings are approved.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {directory.map((listing) => (
                  <a key={listing.id} href={listing.website || '#'} target={listing.website ? '_blank' : undefined} rel="noreferrer" className="rounded-2xl bg-brand-cream p-4 hover:-translate-y-0.5 transition-transform">
                    <p className="font-bold">{listing.name}</p>
                    <p className="text-xs text-brand-ink/50 mt-1">{listing.category} · {listing.location}</p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mt-10 text-sm text-brand-ink/50 flex gap-2 items-start"><Info size={16} className="mt-0.5" /> Only real database records are shown on the live radio page. Demo businesses and fictional advertisers are not used in production.</div>
      </div>
    </div>
  );
};
