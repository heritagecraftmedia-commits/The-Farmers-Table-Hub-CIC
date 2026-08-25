import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LIVE365_PLAYER_URL = import.meta.env.VITE_LIVE365_PLAYER_URL || '';
const LIVE365_DASHBOARD_URL = 'https://dashboard.live365.com/';

export const RadioControl: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen p-8">Loading…</div>;
  if (!user || !['founder', 'staff'].includes(user.role)) {
    return <div className="min-h-screen p-8 max-w-3xl mx-auto"><h1 className="text-3xl font-bold">Radio Control</h1><p className="mt-3">Staff access is required.</p><Link className="underline mt-4 inline-block" to="/login">Go to staff login</Link></div>;
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide opacity-70">Farmers Table Radio</p>
          <h1 className="text-3xl md:text-4xl font-bold">Radio Control Centre</h1>
          <p className="mt-2 max-w-2xl opacity-80">One place for staff to manage the schedule, prepare programmes and access the Live365 station.</p>
        </div>
        <a href={LIVE365_DASHBOARD_URL} target="_blank" rel="noreferrer" className="rounded-lg px-4 py-3 border font-semibold">Open Live365 Dashboard ↗</a>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <section className="rounded-xl border p-6">
          <h2 className="text-xl font-semibold">Live365</h2>
          <p className="mt-2 text-sm opacity-80">Live365 provides the public stream, AutoDJ and cloud-side station controls. The Farmers Table website can embed the player, while authorised staff use Live365 for station-level controls.</p>
          <div className="mt-5 rounded-lg p-4 border"><div className="font-medium">Player connection</div><div className="text-sm mt-1 opacity-75">{LIVE365_PLAYER_URL ? 'Live365 player configured.' : 'Live365 player URL not configured yet.'}</div></div>
        </section>

        <section className="rounded-xl border p-6">
          <h2 className="text-xl font-semibold">BUTT live encoder</h2>
          <p className="mt-2 text-sm opacity-80">BUTT runs on the broadcaster's computer and sends live audio to Live365 using Icecast. Staff start/stop the encoder on the computer; the website does not pretend it can remotely press BUTT's buttons.</p>
          <div className="mt-5 rounded-lg p-4 border"><div className="font-medium">Live encoder</div><div className="text-sm mt-1 opacity-75">Configure BUTT with the Live365 LiveDJ credentials supplied in Live365.</div></div>
        </section>
      </div>

      <section className="rounded-xl border p-6 mt-6">
        <h2 className="text-xl font-semibold">How the station works</h2>
        <div className="grid md:grid-cols-4 gap-4 mt-5 text-sm">
          <div><strong>1. Prepare</strong><p className="mt-1 opacity-75">Build playlists, jingles and adverts in Farmers Table.</p></div>
          <div><strong>2. Schedule</strong><p className="mt-1 opacity-75">Set programmes and broadcasts ahead of time.</p></div>
          <div><strong>3. AutoDJ</strong><p className="mt-1 opacity-75">Let Live365 run scheduled/prepared programming when nobody is live.</p></div>
          <div><strong>4. Go live</strong><p className="mt-1 opacity-75">Start BUTT for interviews, presenters and outside broadcasts. Live audio takes priority.</p></div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3"><Link className="rounded-lg px-4 py-3 border" to="/radio">Public Radio Page</Link><Link className="rounded-lg px-4 py-3 border" to="/dashboard">Main Dashboard</Link></div>
    </div>
  );
};
