import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ExternalLink, HelpCircle, Radio, Wifi, Mic2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RadioStudioDashboard } from '../components/central/RadioStudioDashboard';

const LIVE365_PLAYER_URL = import.meta.env.VITE_LIVE365_PLAYER_URL || '';
const LIVE365_DASHBOARD_URL = 'https://dashboard.live365.com/';

export const RadioControl: React.FC = () => {
  const { user, loading } = useAuth();
  const [showExplain, setShowExplain] = useState(false);

  if (loading) return <div className="min-h-screen p-8">Loading…</div>;
  if (!user || !['founder', 'staff', 'radio_manager'].includes(user.role)) {
    return <div className="min-h-screen p-8 max-w-3xl mx-auto"><h1 className="text-3xl font-bold">Radio Control</h1><p className="mt-3">Staff access is required.</p><Link className="underline mt-4 inline-block" to="/login">Go to staff login</Link></div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-brand-olive text-xs font-bold uppercase tracking-widest"><Radio size={15} /> Farmers Table Radio</div>
          <h1 className="text-3xl md:text-4xl font-serif mt-2">Radio Control Centre</h1>
          <p className="mt-2 max-w-3xl text-brand-ink/60">Everything staff need in one place. Prepare the programme here; Live365 handles the station stream and AutoDJ, while BUTT sends live presenter audio when you go live.</p>
        </div>
        <a href={LIVE365_DASHBOARD_URL} target="_blank" rel="noreferrer" className="rounded-2xl px-5 py-3 bg-brand-ink text-brand-cream font-bold inline-flex items-center gap-2">Open Live365 <ExternalLink size={16} /></a>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-brand-olive/10 p-5"><div className="flex items-center gap-2 font-bold"><Radio size={18} className="text-brand-olive" /> 1. Prepare here</div><p className="mt-2 text-sm text-brand-ink/60">Choose music, jingles, adverts and community audio. Put them in the order you want.</p></div>
        <div className="rounded-2xl bg-white border border-brand-olive/10 p-5"><div className="flex items-center gap-2 font-bold"><Wifi size={18} className="text-brand-olive" /> 2. Live365</div><p className="mt-2 text-sm text-brand-ink/60">Use Live365 for AutoDJ, station settings and the public stream.</p></div>
        <div className="rounded-2xl bg-white border border-brand-olive/10 p-5"><div className="flex items-center gap-2 font-bold"><Mic2 size={18} className="text-brand-olive" /> 3. BUTT</div><p className="mt-2 text-sm text-brand-ink/60">When presenting live, start BUTT on the studio computer. Live audio takes over the stream.</p></div>
      </section>

      <section className="rounded-[28px] bg-brand-cream border border-brand-olive/10 overflow-hidden">
        <button onClick={() => setShowExplain(v => !v)} className="w-full px-6 py-5 flex items-center justify-between text-left">
          <span className="flex items-center gap-3"><HelpCircle className="text-brand-olive" /><span><strong>What do I do next?</strong><span className="block text-sm text-brand-ink/50 font-normal">A simple reminder for anyone using the station.</span></span></span>
          <ChevronDown className={`transition-transform ${showExplain ? 'rotate-180' : ''}`} />
        </button>
        {showExplain && <div className="px-6 pb-6 grid md:grid-cols-4 gap-4 text-sm">
          <div className="rounded-2xl bg-white p-4"><strong>Prepare</strong><p className="mt-1 text-brand-ink/60">Load a ready playlist or add individual items to today's slot.</p></div>
          <div className="rounded-2xl bg-white p-4"><strong>Check variety</strong><p className="mt-1 text-brand-ink/60">Mix music with a sensible number of jingles, adverts and local/community features.</p></div>
          <div className="rounded-2xl bg-white p-4"><strong>Save ready</strong><p className="mt-1 text-brand-ink/60">Give the slot a clear name and choose Save ready when it is finished.</p></div>
          <div className="rounded-2xl bg-white p-4"><strong>Go live only when needed</strong><p className="mt-1 text-brand-ink/60">For a live show, use BUTT. For unattended hours, let Live365 AutoDJ run the prepared programming.</p></div>
        </div>}
      </section>

      <RadioStudioDashboard />

      <section className="grid md:grid-cols-2 gap-6">
        <section className="rounded-[28px] bg-white border border-brand-olive/10 p-6">
          <h2 className="text-xl font-serif">Live365</h2>
          <p className="mt-2 text-sm text-brand-ink/60">Live365 provides the public stream, AutoDJ and cloud-side station controls. The Farmers Table website can embed the player, while authorised staff use Live365 for station-level controls.</p>
          <div className="mt-5 rounded-2xl bg-brand-cream p-4"><div className="font-bold">Player connection</div><div className="text-sm mt-1 text-brand-ink/60">{LIVE365_PLAYER_URL ? 'Live365 player configured.' : 'Live365 player URL not configured yet.'}</div></div>
        </section>
        <section className="rounded-[28px] bg-white border border-brand-olive/10 p-6">
          <h2 className="text-xl font-serif">BUTT live encoder</h2>
          <p className="mt-2 text-sm text-brand-ink/60">BUTT runs on the broadcaster's computer and sends live audio to Live365. The website deliberately does not pretend it can remotely press BUTT's buttons.</p>
          <div className="mt-5 rounded-2xl bg-brand-cream p-4"><div className="font-bold">When you are live</div><div className="text-sm mt-1 text-brand-ink/60">Start BUTT, check the connection, then present. Stop BUTT when the live session is finished.</div></div>
        </section>
      </section>

      <div className="flex flex-wrap gap-3"><Link className="rounded-xl px-4 py-3 border border-brand-olive/10 bg-white font-bold" to="/radio">Public Radio Page</Link><Link className="rounded-xl px-4 py-3 border border-brand-olive/10 bg-white font-bold" to="/dashboard">Main Dashboard</Link></div>
    </div>
  );
};
