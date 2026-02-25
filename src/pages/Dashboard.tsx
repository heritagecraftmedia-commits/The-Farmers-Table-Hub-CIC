import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ClipboardList, StickyNote, CloudRain, Settings, Package,
  Users, Radio, CheckCircle2, AlertCircle, Store, Plus, Search, Filter,
  ArrowRight, ExternalLink, ShieldCheck, Zap, Mail, CheckSquare, Map, Coins,
  Calendar, BookOpen, Bot, Battery, Coffee, Trash2, UserPlus, Clock, Download,
  ToggleLeft, ToggleRight, ShieldAlert, Edit, PlayCircle, Check, Circle,
  Layers, Send, Star, Globe, ExternalLink as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiAgentService } from '../services/aiAgentService';
import { hubService } from '../services/hubService';
import { RawLead, QualifiedLead, EnrichedLead, OutreachLog, HubEvent, StaffMember, RadioShow, FounderJob } from '../types';
import { AddTeamMemberModal } from '../components/dashboard/AddTeamMemberModal';
import { TeamMemberDrawer } from '../components/dashboard/TeamMemberDrawer';
import { AddEventModal } from '../components/dashboard/AddEventModal';
import { AddArtisanModal } from '../components/dashboard/AddArtisanModal';
import { RadioScheduleModal } from '../components/dashboard/RadioScheduleModal';

type TabType = 'overview' | 'discovery' | 'enrichment' | 'outreach' | 'roadmap' | 'events' | 'staff' | 'radio' | 'listings' | 'settings';

interface RoadmapStep {
  id: string;
  phase: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  checklist: string[];
}

const ROADMAP_STEPS: RoadmapStep[] = [
  { id: 'rm1', phase: '1', title: 'Launch Core Directory', description: 'Get the artisan directory live with founding members', icon: <Store size={20} />, checklist: ['Add 10 founding artisan profiles', 'Take profile photos for each maker', 'Write bios using AI enrichment', 'Publish to public directory', 'Share on social media'] },
  { id: 'rm2', phase: '2', title: 'Community Radio Live', description: 'Full Live365 integration with scheduled programming', icon: <Radio size={20} />, checklist: ['Set up Live365 account', 'Create show schedule', 'Record first 3 show episodes', 'Set up auto-broadcast playlist', 'Promote on directory site'] },
  { id: 'rm3', phase: '3', title: 'Events & What\'s On', description: 'Populate the events calendar and grow attendance', icon: <Calendar size={20} />, checklist: ['List 5 upcoming markets/events', 'Set up event submission form', 'Integrate Google Calendar export', 'Email community newsletter', 'Grow to 50+ event RSVPs'] },
  { id: 'rm4', phase: '4', title: 'Maker Stories Published', description: 'Launch the storytelling editorial section', icon: <BookOpen size={20} />, checklist: ['Interview 3 founding makers', 'Write and publish stories', 'Add photography to each story', 'Share on Instagram and Facebook', 'Set up monthly publication schedule'] },
  { id: 'rm5', phase: '5', title: 'Revenue & Sustainability', description: 'Establish ethical income streams for the CIC', icon: <Coins size={20} />, checklist: ['Enable optional directory tiers', 'Launch community membership £5/mo', 'Apply for Arts Council grant', 'Set up events ticketing', 'Quarterly impact report published'] },
  { id: 'rm6', phase: '6', title: 'Scale & Partnerships', description: 'Grow the community and forge local partnerships', icon: <Globe size={20} />, checklist: ['Partner with Farnham Town Council', 'Reach 100 directory listings', 'Launch maker training workshops', 'Expand radio to 24/7 programming', 'Annual community festival'] },
];

const MOCK_LISTINGS = [
  { id: 'l1', name: 'Farnham Ironworks', craft: 'Blacksmithing', location: 'Farnham', status: 'approved' as const, image: 'https://picsum.photos/seed/iron/100/100' },
  { id: 'l2', name: 'Surrey Willow Weaving', craft: 'Basketry', location: 'Guildford', status: 'pending' as const, image: 'https://picsum.photos/seed/willow/100/100' },
  { id: 'l3', name: 'Tilford Pottery', craft: 'Ceramics', location: 'Tilford', status: 'approved' as const, image: 'https://picsum.photos/seed/pottery/100/100' },
  { id: 'l4', name: 'Rural Candle Co.', craft: 'Candlemaking', location: 'Hindhead', status: 'pending' as const, image: 'https://picsum.photos/seed/candle/100/100' },
];

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Data state
  const [rawLeads, setRawLeads] = useState<RawLead[]>([]);
  const [qualifiedLeads, setQualifiedLeads] = useState<QualifiedLead[]>([]);
  const [enrichedLeads, setEnrichedLeads] = useState<EnrichedLead[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [radioShows, setRadioShows] = useState<RadioShow[]>([]);
  const [founderJobs, setFounderJobs] = useState<FounderJob[]>([]);
  const [systemSettings, setSystemSettings] = useState(hubService.getSystemSettings());
  const [loadingData, setLoadingData] = useState(false);

  // Modal state
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddArtisan, setShowAddArtisan] = useState(false);
  const [editingShow, setEditingShow] = useState<RadioShow | null>(null);
  const [showManagerOpen, setShowManagerOpen] = useState(false);
  const [newJobText, setNewJobText] = useState('');
  const [discoveryLocation, setDiscoveryLocation] = useState('Farnham, Surrey');
  const [discoveryCraft, setDiscoveryCraft] = useState('');
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  // Roadmap state
  const [roadmapProgress, setRoadmapProgress] = useState<Record<string, boolean[]>>(() => {
    try { return JSON.parse(localStorage.getItem('roadmapProgress') || '{}'); } catch { return {}; }
  });
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const refreshData = async () => {
    setLoadingData(true);
    const [rl, el, ol, ev, st, rs, fj] = await Promise.all([
      aiAgentService.getRawLeads(), aiAgentService.getEnrichedLeads(),
      aiAgentService.getOutreachLogs(), hubService.getEvents(),
      hubService.getStaff(), hubService.getRadioShows(), hubService.getFounderJobs(),
    ]);
    setRawLeads(rl); setEnrichedLeads(el); setOutreachLogs(ol);
    setEvents(ev); setStaff(st); setRadioShows(rs); setFounderJobs(fj);
    setSystemSettings(hubService.getSystemSettings());
    setLoadingData(false);
  };

  useEffect(() => { if (user?.role === 'founder' || user?.role === 'staff') { refreshData(); } }, [user]);

  const updateRoadmap = (stepId: string, checkIdx: number, val: boolean) => {
    const stepChecks = roadmapProgress[stepId] || Array(ROADMAP_STEPS.find(s => s.id === stepId)?.checklist.length || 5).fill(false);
    const updated = [...stepChecks]; updated[checkIdx] = val;
    const next = { ...roadmapProgress, [stepId]: updated };
    setRoadmapProgress(next);
    localStorage.setItem('roadmapProgress', JSON.stringify(next));
  };

  const stepComplete = (step: RoadmapStep) => {
    const checks = roadmapProgress[step.id] || [];
    return checks.filter(Boolean).length;
  };

  // Handlers
  const handleEnrich = async (lead: RawLead) => { await aiAgentService.enrichLead(lead); await refreshData(); };
  const handleOutreach = async (lead: EnrichedLead) => { await aiAgentService.draftOutreach(lead); await refreshData(); };
  const handleDiscard = async (id: string) => { await aiAgentService.discardRawLead(id); await refreshData(); };
  const handleApproveEvent = async (id: string) => { await hubService.approveEvent(id); await refreshData(); };
  const handleDeleteEvent = async (id: string) => { await hubService.deleteEvent(id); await refreshData(); };
  const handleAddEvent = async (ev: Omit<HubEvent, 'id' | 'createdAt'>) => { await hubService.addEvent(ev); await refreshData(); };
  const handleAddStaff = async (m: Omit<StaffMember, 'id' | 'joinedAt'>) => { await hubService.addStaff(m); await refreshData(); };
  const handleRemoveStaff = async (id: string) => { await hubService.removeStaff(id); await refreshData(); };
  const handleCompleteJob = async (id: string) => { await hubService.completeJob(id); await refreshData(); };
  const handleAddJob = async () => { if (!newJobText.trim()) return; await hubService.addJob(newJobText.trim(), 'Medium'); setNewJobText(''); await refreshData(); };
  const handleUpdateRadio = async (show: RadioShow) => { await hubService.updateRadioStatus(show.id, show.status); await refreshData(); };
  const handleAddArtisan = async (lead: Omit<RawLead, 'id' | 'discoveredAt'>) => { await aiAgentService.addRawLeads([lead]); await refreshData(); };
  const handleRunDiscovery = async () => {
    if (!discoveryLocation.trim() || !discoveryCraft.trim()) return;
    setDiscoveryLoading(true);
    await aiAgentService.runDiscoveryAgent(discoveryLocation.trim(), discoveryCraft.trim());
    await refreshData();
    setDiscoveryLoading(false);
  };

  if (!user) return <div className="p-24 text-center">Please login to access this area.</div>;

  const tabNav = (tab: TabType, label: string, icon: React.ReactNode) => (
    <button onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-brand-olive text-white' : 'text-brand-ink/50 hover:bg-brand-cream'}`}>
      {icon}<span className="hidden md:inline">{label}</span>
    </button>
  );

  const StatCard = ({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive">{icon}</div>
      </div>
      <p className="text-3xl font-serif">{value}</p>
      <p className="text-sm font-bold mt-1">{label}</p>
      {sub && <p className="text-xs text-brand-ink/40 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Modals */}
      {showAddMember && <AddTeamMemberModal onClose={() => setShowAddMember(false)} onSave={handleAddStaff} />}
      {selectedMember && <TeamMemberDrawer member={selectedMember} onClose={() => setSelectedMember(null)} onRemove={handleRemoveStaff} />}
      {showAddEvent && <AddEventModal onClose={() => setShowAddEvent(false)} onSave={handleAddEvent} />}
      {showAddArtisan && <AddArtisanModal onClose={() => setShowAddArtisan(false)} onSave={handleAddArtisan} />}
      {editingShow && <RadioScheduleModal show={editingShow} onClose={() => setEditingShow(null)} onSave={async (s) => { await handleUpdateRadio(s); setEditingShow(null); }} />}

      {/* Header */}
      <div className="bg-white border-b border-brand-cream/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-serif">Founder Dashboard</h1>
              <p className="text-xs text-brand-ink/40">Welcome back, {user.name}</p>
            </div>
            <div className="flex items-center gap-3">
              {loadingData && <div className="w-5 h-5 border-2 border-brand-olive/30 border-t-brand-olive rounded-full animate-spin" />}
              <button onClick={logout} className="px-4 py-2 text-sm font-bold border border-brand-olive/20 rounded-full hover:bg-brand-cream">Sign Out</button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {tabNav('overview', 'Overview', <LayoutDashboard size={16} />)}
            {tabNav('discovery', 'Discovery', <Search size={16} />)}
            {tabNav('enrichment', 'Enriched', <ShieldCheck size={16} />)}
            {tabNav('outreach', 'Outreach', <Mail size={16} />)}
            {tabNav('events', "What's On", <Calendar size={16} />)}
            {tabNav('staff', 'Team', <Users size={16} />)}
            {tabNav('radio', 'Radio', <Radio size={16} />)}
            {tabNav('listings', 'Listings', <Store size={16} />)}
            {tabNav('roadmap', 'Roadmap', <Map size={16} />)}
            {tabNav('settings', 'Settings', <Settings size={16} />)}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="mb-6">
              <h2 className="text-3xl font-serif mb-2">Hub Overview</h2>
              <p className="text-brand-ink/60">Your mission control for The Farmers Table Hub CIC.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Raw Leads" value={rawLeads.length} sub="Awaiting review" icon={<Search size={20} />} />
              <StatCard label="Enriched" value={enrichedLeads.length} sub="Ready to invite" icon={<ShieldCheck size={20} />} />
              <StatCard label="Events" value={events.length} sub={`${events.filter(e => e.approved).length} approved`} icon={<Calendar size={20} />} />
              <StatCard label="Team Members" value={staff.length} sub="Active staff" icon={<Users size={20} />} />
            </div>

            {/* Open Manager – Jobs */}
            <div className="bg-white rounded-[40px] p-8 border border-brand-olive/5 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-serif">Open Manager</h3>
                  <p className="text-sm text-brand-ink/50">Your to-do list as founder</p>
                </div>
                <button onClick={() => setShowManagerOpen(!showManagerOpen)}
                  className="px-5 py-3 bg-brand-olive text-white rounded-full text-sm font-bold flex items-center gap-2">
                  <ClipboardList size={16} /> {showManagerOpen ? 'Close' : 'Open Manager'}
                </button>
              </div>
              <AnimatePresence>
                {showManagerOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="space-y-3 mb-4">
                      {founderJobs.map(job => (
                        <div key={job.id} className={`flex items-start gap-4 p-4 rounded-2xl border ${job.status === 'completed' ? 'bg-green-50 border-green-100' : 'bg-brand-cream/50 border-transparent'}`}>
                          <button onClick={() => job.status !== 'completed' && handleCompleteJob(job.id)} className="mt-0.5 flex-shrink-0">
                            {job.status === 'completed' ? <CheckCircle2 size={20} className="text-green-500" /> : <Circle size={20} className="text-brand-ink/20" />}
                          </button>
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${job.status === 'completed' ? 'line-through text-brand-ink/40' : ''}`}>{job.task}</p>
                            {job.dueDate && <p className="text-xs text-brand-ink/40 mt-1">Due: {job.dueDate}</p>}
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${job.priority === 'High' ? 'bg-red-50 text-red-500' : job.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-brand-cream text-brand-ink/40'}`}>{job.priority}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={newJobText} onChange={e => setNewJobText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddJob()}
                        className="flex-1 px-4 py-3 bg-brand-cream rounded-2xl border border-brand-olive/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-olive/20"
                        placeholder="Add a new task..." />
                      <button onClick={handleAddJob} className="px-5 py-3 bg-brand-olive text-white rounded-2xl text-sm font-bold"><Plus size={16} /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!showManagerOpen && founderJobs.filter(j => j.status === 'pending').length > 0 && (
                <p className="text-sm text-brand-ink/50">{founderJobs.filter(j => j.status === 'pending').length} tasks pending — click Open Manager to view</p>
              )}
            </div>

            {/* Quick access tiles */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Add Artisan', icon: <Plus size={20} />, action: () => setShowAddArtisan(true) },
                { label: 'Add Event', icon: <Calendar size={20} />, action: () => setShowAddEvent(true) },
                { label: 'Add Team Member', icon: <UserPlus size={20} />, action: () => setShowAddMember(true) },
                { label: 'View Discovery', icon: <Search size={20} />, action: () => setActiveTab('discovery') },
                { label: 'Radio Ops', icon: <Radio size={20} />, action: () => setActiveTab('radio') },
                { label: 'View Roadmap', icon: <Map size={20} />, action: () => setActiveTab('roadmap') },
              ].map(t => (
                <button key={t.label} onClick={t.action} className="bg-white border border-brand-olive/10 rounded-[28px] p-6 text-left hover:shadow-md transition-all hover:border-brand-olive/30 flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-cream rounded-xl flex items-center justify-center text-brand-olive">{t.icon}</div>
                  <span className="font-bold text-sm">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCOVERY ── */}
        {activeTab === 'discovery' && (
          <div className="space-y-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-serif mb-1">AI Discovery Pipeline</h2>
                <p className="text-brand-ink/60">Run the AI agent to find new makers, or add manually.</p>
              </div>
              <button onClick={() => setShowAddArtisan(true)} className="flex items-center gap-2 px-5 py-3 bg-brand-olive text-white rounded-full text-sm font-bold">
                <Plus size={16} /> Add Artisan Manually
              </button>
            </div>

            {/* Run Discovery Agent */}
            <div className="bg-white rounded-[32px] p-6 border border-brand-olive/10 shadow-sm">
              <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Bot size={16} className="text-brand-olive" /> Run Discovery Agent</h4>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Location (e.g. Farnham, Surrey)"
                  value={discoveryLocation}
                  onChange={e => setDiscoveryLocation(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-brand-olive/10 text-sm focus:ring-2 focus:ring-brand-olive/20"
                />
                <input
                  type="text"
                  placeholder="Craft (e.g. Woodwork, Pottery)"
                  value={discoveryCraft}
                  onChange={e => setDiscoveryCraft(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-brand-olive/10 text-sm focus:ring-2 focus:ring-brand-olive/20"
                />
                <button
                  onClick={handleRunDiscovery}
                  disabled={discoveryLoading || !discoveryLocation.trim() || !discoveryCraft.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold disabled:opacity-40"
                >
                  {discoveryLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching…</> : <><Zap size={16} /> Find Makers</>}
                </button>
              </div>
              <p className="text-[11px] text-brand-ink/30 mt-2">Uses Gemini AI to suggest fictional example profiles. No real data is scraped.</p>
            </div>

            {rawLeads.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[40px]">
                <Search size={40} className="text-brand-ink/20 mx-auto mb-4" />
                <p className="font-serif text-xl mb-2">No new leads</p>
                <p className="text-brand-ink/50 text-sm mb-6">Use the discovery agent above or add one manually</p>
                <button onClick={() => setShowAddArtisan(true)} className="px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm">
                  <Plus size={16} className="inline mr-2" />Add Manually
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {rawLeads.map(lead => (
                  <div key={lead.id} className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold">{lead.displayName}</h4>
                        <span className="text-[10px] font-bold bg-brand-cream px-2 py-0.5 rounded-full text-brand-ink/50">{lead.sourcePlatform}</span>
                      </div>
                      <p className="text-xs text-brand-ink/50 mb-2">{lead.categoryHint} · {lead.locationHint}</p>
                      <p className="text-sm text-brand-ink/70 line-clamp-2">{lead.bioText}</p>
                      {lead.profileUrl && <a href={lead.profileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-olive mt-2 inline-flex items-center gap-1"><ExternalLink size={12} /> View Profile</a>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEnrich(lead)} className="px-4 py-2 bg-brand-olive text-white rounded-full text-xs font-bold flex items-center gap-1"><Zap size={12} /> Enrich</button>
                      <button onClick={() => handleDiscard(lead.id)} className="px-4 py-2 border border-red-100 text-red-400 rounded-full text-xs font-bold hover:bg-red-50"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ENRICHMENT ── */}
        {activeTab === 'enrichment' && (
          <div className="space-y-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-serif mb-1">Enriched Leads</h2>
                <p className="text-brand-ink/60">Leads enriched and ready for outreach or directory listing.</p>
              </div>
              <button onClick={() => setShowAddArtisan(true)} className="flex items-center gap-2 px-5 py-3 bg-brand-olive text-white rounded-full text-sm font-bold">
                <Plus size={16} /> Add Artisan Manually
              </button>
            </div>
            {enrichedLeads.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[40px]">
                <ShieldCheck size={40} className="text-brand-ink/20 mx-auto mb-4" />
                <p className="font-serif text-xl mb-2">No enriched leads yet</p>
                <p className="text-brand-ink/50 text-sm">Enrich raw leads from the Discovery tab</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {enrichedLeads.map(lead => (
                  <div key={lead.id} className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold">{lead.vendorName}</h4>
                        <p className="text-xs text-brand-ink/50">{lead.craftCategory} · {lead.location}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${lead.status === 'invited' ? 'bg-blue-50 text-blue-600' : lead.status === 'claimed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{lead.status}</span>
                    </div>
                    <p className="text-sm text-brand-ink/70 mb-4 line-clamp-3">{lead.summary}</p>
                    {lead.status === 'draft' && (
                      <button onClick={() => handleOutreach(lead)} className="w-full py-2 flex items-center justify-center gap-2 bg-brand-olive text-white rounded-full text-xs font-bold">
                        <Send size={12} /> Send Invite
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── OUTREACH ── */}
        {activeTab === 'outreach' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-serif mb-1">Outreach Log</h2>
              <p className="text-brand-ink/60">Track invitations sent to artisans and makers.</p>
            </div>
            {outreachLogs.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[40px]">
                <Mail size={40} className="text-brand-ink/20 mx-auto mb-4" />
                <p className="font-serif text-xl mb-2">No outreach sent yet</p>
                <p className="text-brand-ink/50 text-sm">Invite enriched leads from the Enriched tab</p>
              </div>
            ) : (
              <div className="space-y-4">
                {outreachLogs.map(log => (
                  <div key={log.id} className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-brand-olive" />
                        <span className="font-bold text-sm">{log.contactMethod}</span>
                      </div>
                      <span className="text-xs text-brand-ink/40">{new Date(log.sentAt).toLocaleDateString('en-GB')}</span>
                    </div>
                    <p className="text-sm text-brand-ink/70 bg-brand-cream/50 p-4 rounded-2xl">{log.messageSent}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EVENTS ── */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-serif mb-1">What's On</h2>
                <p className="text-brand-ink/60">Manage events and community listings.</p>
              </div>
              <button onClick={() => setShowAddEvent(true)} className="flex items-center gap-2 px-5 py-3 bg-brand-olive text-white rounded-full text-sm font-bold">
                <Plus size={16} /> Add Event Manually
              </button>
            </div>
            {events.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[40px]">
                <Calendar size={40} className="text-brand-ink/20 mx-auto mb-4" />
                <p className="font-serif text-xl mb-2">No events yet</p>
                <button onClick={() => setShowAddEvent(true)} className="mt-4 px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm">Add Your First Event</button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map(event => (
                  <div key={event.id} className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold">{event.title}</h4>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${event.approved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{event.approved ? 'Published' : 'Pending'}</span>
                      </div>
                      <p className="text-xs text-brand-ink/50 mb-1">{event.venue} · {event.location}</p>
                      <p className="text-xs text-brand-ink/40">{event.startDate ? new Date(event.startDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                      <p className="text-sm text-brand-ink/70 mt-2 line-clamp-2">{event.description}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!event.approved && <button onClick={() => handleApproveEvent(event.id)} className="px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-bold"><CheckCircle2 size={12} className="inline mr-1" />Approve</button>}
                      {event.websiteUrl && <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-brand-olive/20 text-brand-olive rounded-full text-xs font-bold flex items-center gap-1"><ExternalLink size={12} /> Link</a>}
                      <button onClick={() => handleDeleteEvent(event.id)} className="px-4 py-2 border border-red-100 text-red-400 rounded-full text-xs font-bold hover:bg-red-50"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STAFF ── */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-serif mb-1">Team Members</h2>
                <p className="text-brand-ink/60">Click a member to manage rota, holiday and payroll.</p>
              </div>
              <button onClick={() => setShowAddMember(true)} className="flex items-center gap-2 px-5 py-3 bg-brand-olive text-white rounded-full text-sm font-bold">
                <UserPlus size={16} /> Add Team Member
              </button>
            </div>
            {staff.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[40px]">
                <Users size={40} className="text-brand-ink/20 mx-auto mb-4" />
                <p className="font-serif text-xl mb-2">No team members yet</p>
                <button onClick={() => setShowAddMember(true)} className="mt-4 px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm">Add First Member</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map(member => (
                  <button key={member.id} onClick={() => setSelectedMember(member)} className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm text-left hover:shadow-md hover:border-brand-olive/20 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-brand-cream rounded-full flex items-center justify-center text-brand-olive font-bold text-xl">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{member.name}</p>
                        <p className="text-xs text-brand-ink/50">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${member.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-brand-cream text-brand-ink/40'}`}>{member.status}</span>
                      <span className="text-xs text-brand-ink/40 group-hover:text-brand-olive transition-colors flex items-center gap-1">View details <ArrowRight size={12} /></span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RADIO ── */}
        {activeTab === 'radio' && (
          <div className="space-y-8">
            <div className="mb-6">
              <h2 className="text-3xl font-serif mb-1">Radio Operations</h2>
              <p className="text-brand-ink/60">Monitor Live365 and manage your show schedule.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xl font-serif">Show Schedule</h3>
                {radioShows.map(show => (
                  <div key={show.id} className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold">{show.title}</h4>
                      <p className="text-xs text-brand-ink/40 mt-1">{show.schedule} · Host: {show.host}</p>
                      {show.lastBroadcast && <p className="text-xs text-brand-ink/30 mt-0.5">Last broadcast: {show.lastBroadcast}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${show.status === 'live' ? 'bg-red-50 text-red-600 animate-pulse' : show.status === 'recorded' ? 'bg-blue-50 text-blue-600' : 'bg-brand-cream text-brand-ink/40'}`}>{show.status}</span>
                      <button onClick={() => setEditingShow(show)} title="Edit show" className="w-9 h-9 flex items-center justify-center rounded-full bg-brand-cream hover:bg-brand-olive/10 transition-colors">
                        <Settings size={16} className="text-brand-ink/40 hover:text-brand-olive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live365 Panel */}
              <div className="bg-brand-olive text-brand-cream p-8 rounded-[40px] shadow-lg">
                <h3 className="text-xl font-serif mb-6">Live365 Status</h3>
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-70">Stream Status</span>
                    <span className="flex items-center gap-2 text-sm font-bold"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Online</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-70">Shows Scheduled</span>
                    <span className="text-sm font-bold">{radioShows.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-70">Live Shows</span>
                    <span className="text-sm font-bold">{radioShows.filter(s => s.status === 'live').length}</span>
                  </div>
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <a href="https://live365.com" target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-white text-brand-olive rounded-full font-bold text-sm text-center hover:bg-brand-cream transition-all">
                      Open Live365 Studio ↗
                    </a>
                    <a href="https://live365.com/dashboard" target="_blank" rel="noopener noreferrer" className="block w-full py-3 border border-white/20 text-white rounded-full font-bold text-sm text-center hover:bg-white/10 transition-all">
                      Dashboard & Analytics
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LISTINGS ── */}
        {activeTab === 'listings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-serif mb-1">Artisan Directory</h2>
                <p className="text-brand-ink/60">Manage all directory listings.</p>
              </div>
              <button onClick={() => setShowAddArtisan(true)} className="flex items-center gap-2 px-5 py-3 bg-brand-olive text-white rounded-full text-sm font-bold">
                <Plus size={16} /> Add Artisan
              </button>
            </div>
            <div className="space-y-3">
              {MOCK_LISTINGS.map(listing => (
                <div key={listing.id} className="bg-white p-5 rounded-[28px] border border-brand-olive/5 shadow-sm flex items-center gap-4">
                  <img src={listing.image} alt={listing.name} className="w-14 h-14 rounded-2xl object-cover bg-brand-cream flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-bold">{listing.name}</h4>
                    <p className="text-xs text-brand-ink/50">{listing.craft} · {listing.location}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${listing.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{listing.status}</span>
                    <button className="px-4 py-2 border border-brand-olive/20 text-brand-olive rounded-full text-xs font-bold hover:bg-brand-cream flex items-center gap-1">
                      <Edit size={12} /> Edit
                    </button>
                    {listing.status === 'pending' && (
                      <button className="px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ROADMAP ── */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-serif mb-1">Next Steps Roadmap</h2>
              <p className="text-brand-ink/60">Click any phase to expand and start working through it.</p>
            </div>
            <div className="space-y-4">
              {ROADMAP_STEPS.map((step, idx) => {
                const done = stepComplete(step);
                const total = step.checklist.length;
                const pct = Math.round((done / total) * 100);
                const isExpanded = expandedStep === step.id;
                const checks = roadmapProgress[step.id] || new Array(total).fill(false);

                return (
                  <div key={step.id} className={`bg-white rounded-[32px] border shadow-sm overflow-hidden transition-all ${isExpanded ? 'border-brand-olive/30' : 'border-brand-olive/5'}`}>
                    <button onClick={() => setExpandedStep(isExpanded ? null : step.id)} className="w-full p-6 flex items-center gap-4 text-left">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${done === total ? 'bg-green-50 text-green-600' : isExpanded ? 'bg-brand-olive text-white' : 'bg-brand-cream text-brand-olive'}`}>
                        {done === total ? <CheckCircle2 size={20} /> : step.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-brand-ink/30 uppercase tracking-wider">Phase {step.phase}</span>
                          {done === total && <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Complete</span>}
                        </div>
                        <p className="font-bold">{step.title}</p>
                        <p className="text-xs text-brand-ink/50 mt-0.5">{step.description}</p>
                        {/* Progress bar */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-brand-cream rounded-full overflow-hidden">
                            <div className="h-full bg-brand-olive rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-brand-ink/40 font-bold">{done}/{total}</span>
                        </div>
                      </div>
                      <ArrowRight size={18} className={`text-brand-ink/20 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-6 pb-6 space-y-3">
                            <div className="h-px bg-brand-cream mb-4" />
                            {step.checklist.map((item, ci) => (
                              <label key={ci} className="flex items-start gap-3 cursor-pointer group">
                                <div onClick={() => updateRoadmap(step.id, ci, !checks[ci])}
                                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${checks[ci] ? 'bg-brand-olive border-brand-olive' : 'border-brand-ink/20 group-hover:border-brand-olive/50'}`}>
                                  {checks[ci] && <Check size={11} className="text-white" />}
                                </div>
                                <span className={`text-sm ${checks[ci] ? 'line-through text-brand-ink/30' : 'text-brand-ink/80'}`}>{item}</span>
                              </label>
                            ))}
                            <div className="pt-4 flex gap-3">
                              <button onClick={() => setActiveTab('overview')} className="px-4 py-2 bg-brand-olive text-white rounded-full text-xs font-bold flex items-center gap-1">
                                <PlayCircle size={13} /> Start Now
                              </button>
                              {pct > 0 && pct < 100 && <span className="text-xs text-brand-ink/40 self-center">{pct}% complete</span>}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-serif mb-1">System Controls</h2>
              <p className="text-brand-ink/60">Manage AI agent permissions and global application state.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                <h3 className="text-xl font-serif mb-6 flex items-center gap-2"><Bot className="text-brand-olive" /> AI Agent Permissions</h3>
                <div className="space-y-6">
                  {[
                    { id: 'discoveryAgentEnabled', label: 'Discovery Agent', desc: 'Allows AI to search for new maker leads' },
                    { id: 'qualificationAgentEnabled', label: 'Qualification Agent', desc: 'Allows AI to score and filter leads' },
                    { id: 'enrichmentAgentEnabled', label: 'Enrichment Agent', desc: 'Allows AI to draft listing content' },
                    { id: 'outreachAgentEnabled', label: 'Outreach Agent', desc: 'Allows AI to prepare outreach drafts' },
                  ].map(agent => (
                    <div key={agent.id} className="flex items-center justify-between">
                      <div><p className="font-bold text-sm">{agent.label}</p><p className="text-xs text-brand-ink/40">{agent.desc}</p></div>
                      <button onClick={() => { const n = hubService.updateSystemSettings({ [agent.id]: !systemSettings[agent.id as keyof typeof systemSettings] }); setSystemSettings(n); }}
                        className={`p-1 rounded-full transition-colors ${systemSettings[agent.id as keyof typeof systemSettings] ? 'text-brand-olive' : 'text-brand-ink/20'}`}>
                        {systemSettings[agent.id as keyof typeof systemSettings] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                <h3 className="text-xl font-serif mb-6 flex items-center gap-2"><ShieldAlert className="text-red-400" /> Global Safety</h3>
                <div className="flex items-center justify-between mb-8">
                  <div><p className="font-bold text-sm">Maintenance Mode</p><p className="text-xs text-brand-ink/40">Disable all public-facing features</p></div>
                  <button onClick={() => { const n = hubService.updateSystemSettings({ maintenanceMode: !systemSettings.maintenanceMode }); setSystemSettings(n); }}
                    className={`p-1 rounded-full transition-colors ${systemSettings.maintenanceMode ? 'text-red-400' : 'text-brand-ink/20'}`}>
                    {systemSettings.maintenanceMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
                <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                  <h4 className="text-red-600 font-bold text-sm mb-2">Danger Zone</h4>
                  <p className="text-xs text-red-400 mb-4">Permanently clear all AI discovery logs and raw lead data.</p>
                  <button className="px-4 py-2 bg-red-100 text-red-600 rounded-full text-xs font-bold">Clear Data Cache</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
