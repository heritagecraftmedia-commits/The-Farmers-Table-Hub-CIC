import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, Hash, ExternalLink, ArrowRight, Radio, RefreshCw, Copy, Check } from 'lucide-react';
import { getServerInfo, getChannels, DiscordServerInfo } from '../services/discordService';

export const Community: React.FC = () => {
  const [serverInfo, setServerInfo] = useState<DiscordServerInfo | null>(null);
  const [loadingServer, setLoadingServer] = useState(true);
  const [copied, setCopied] = useState(false);

  const channels = getChannels();

  const fetchServer = async () => {
    setLoadingServer(true);
    const info = await getServerInfo();
    setServerInfo(info);
    setLoadingServer(false);
  };

  useEffect(() => { fetchServer(); }, []);

  const handleCopyInvite = async () => {
    if (!serverInfo?.inviteUrl) return;
    await navigator.clipboard.writeText(serverInfo.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConfigured = !!import.meta.env.VITE_DISCORD_SERVER_ID &&
    import.meta.env.VITE_DISCORD_SERVER_ID !== 'placeholder';

  return (
    <div className="min-h-screen bg-brand-cream py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-olive bg-brand-olive/10 px-4 py-2 rounded-full inline-block mb-6">
            Farmers Table Network
          </span>
          <h1 className="text-5xl md:text-7xl font-serif mb-6">
            Our <span className="italic text-brand-olive">Community</span>
          </h1>
          <p className="text-xl text-brand-ink/70 max-w-2xl">
            Join growers, beekeepers, makers, and crafters from across Surrey and Hampshire.
            A private space to share, learn, and connect.
          </p>
        </div>

        {/* What's On Banner */}
        <Link
          to="/community-radio"
          className="flex items-center justify-between gap-4 bg-brand-olive text-white px-8 py-5 rounded-[28px] mb-12 hover:bg-brand-olive/90 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Radio size={20} />
            <span className="font-bold">See what's on — Community Radio schedule</span>
          </div>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column — Server stats + Join */}
          <div className="space-y-6">

            {/* Server stats card */}
            <div className="bg-white rounded-[32px] p-8 border border-brand-olive/5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Discord Server</h2>
                <button
                  onClick={fetchServer}
                  disabled={loadingServer}
                  className="p-2 rounded-full hover:bg-brand-cream transition-all text-brand-ink/40 hover:text-brand-olive"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={loadingServer ? 'animate-spin' : ''} />
                </button>
              </div>

              {!isConfigured ? (
                <p className="text-sm text-brand-ink/40 italic">
                  Server not yet connected. Add <code className="bg-brand-cream px-1 rounded text-xs">VITE_DISCORD_SERVER_ID</code> to your env vars.
                </p>
              ) : loadingServer ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-12 bg-brand-cream/60 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : serverInfo ? (
                <>
                  <p className="text-sm font-bold text-brand-ink/50 mb-4">{serverInfo.name}</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-brand-cream/60 rounded-2xl p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                        <span className="text-2xl font-serif">{serverInfo.presenceCount}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Online Now</span>
                    </div>
                    <div className="bg-brand-cream/60 rounded-2xl p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Users size={14} className="text-brand-olive" />
                        <span className="text-2xl font-serif">—</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Members</span>
                    </div>
                  </div>
                  {serverInfo.inviteUrl && (
                    <div className="space-y-2">
                      <a
                        href={serverInfo.inviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-brand-olive text-white rounded-full font-bold text-sm hover:bg-brand-olive/90 transition-all"
                      >
                        <ExternalLink size={14} /> Open Discord Server
                      </a>
                      <button
                        onClick={handleCopyInvite}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-brand-cream text-brand-ink/60 rounded-full font-bold text-sm hover:bg-brand-olive/10 transition-all"
                      >
                        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Invite Link</>}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-brand-ink/40 mb-2">Couldn't load server stats.</p>
                  <p className="text-xs text-brand-ink/30">
                    Make sure the Discord Widget is enabled:<br />
                    Server Settings → Widget → Enable Server Widget
                  </p>
                </div>
              )}
            </div>

            {/* Join CTA if no invite yet */}
            {!serverInfo?.inviteUrl && isConfigured && !loadingServer && (
              <div className="bg-brand-olive text-white rounded-[32px] p-8">
                <h3 className="text-lg font-serif mb-3">Want to join?</h3>
                <p className="text-sm opacity-80 mb-4">Contact us and we'll send you a direct invite to the community server.</p>
                <a
                  href="mailto:hello@thefarmerstable.co.uk?subject=Discord invite request"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-olive rounded-full font-bold text-sm"
                >
                  Request Invite <ArrowRight size={14} />
                </a>
              </div>
            )}
          </div>

          {/* Right column — Channels */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[32px] p-8 border border-brand-olive/5 shadow-sm">
              <h2 className="text-2xl font-serif mb-2">Channels</h2>
              <p className="text-sm text-brand-ink/50 mb-8">Join the conversation — each channel has its own focus.</p>
              <div className="space-y-3">
                {channels.map((ch, i) => (
                  <motion.div
                    key={ch.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-brand-cream/60 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-olive/10 flex items-center justify-center shrink-0 group-hover:bg-brand-olive/20 transition-all">
                      <Hash size={14} className="text-brand-olive" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">#{ch.name}</p>
                      <p className="text-sm text-brand-ink/50 leading-snug">{ch.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* About the community */}
            <div className="bg-brand-cream/80 rounded-[32px] p-8 border border-brand-olive/10">
              <h3 className="text-xl font-serif mb-3">About the Network</h3>
              <p className="text-sm text-brand-ink/60 leading-relaxed mb-4">
                The Farmers Table Network is a private Discord community for verified members of the Farmers Table Hub CIC.
                It's a space to share knowledge, collaborate, and build connections across Surrey and Hampshire.
              </p>
              <p className="text-sm text-brand-ink/60 leading-relaxed">
                Not a member yet?{' '}
                <Link to="/apply" className="text-brand-olive font-bold hover:underline">
                  Apply to join
                </Link>
                {' '}— applications reviewed within 3 working days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
