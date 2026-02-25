import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  StickyNote,
  CloudRain,
  Settings,
  Package,
  Users,
  Radio,
  CheckCircle2,
  AlertCircle,
  Store,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Mail,
  CheckSquare,
  Map,
  Coins,
  Calendar,
  BookOpen,
  Bot,
  Battery,
  Coffee,
  Trash2,
  UserPlus,
  Clock,
  Download,
  ToggleLeft,
  ToggleRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiAgentService } from '../services/aiAgentService';
import { hubService } from '../services/hubService';
import { RawLead, QualifiedLead, EnrichedLead, OutreachLog, HubEvent, StaffMember, RadioShow, FounderJob } from '../types';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'discovery' | 'qualification' | 'enrichment' | 'outreach' | 'roadmap' | 'events' | 'staff' | 'radio' | 'listings' | 'settings'>('overview');

  // State for AI workflow
  const [rawLeads, setRawLeads] = useState<RawLead[]>([]);
  const [qualifiedLeads, setQualifiedLeads] = useState<QualifiedLead[]>([]);
  const [enrichedLeads, setEnrichedLeads] = useState<EnrichedLead[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);

  // State for Hub Management
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [radioShows, setRadioShows] = useState<RadioShow[]>([]);
  const [founderJobs, setFounderJobs] = useState<FounderJob[]>([]);
  const [systemSettings, setSystemSettings] = useState(hubService.getSystemSettings());
  const [loadingData, setLoadingData] = useState(false);

  const refreshData = async () => {
    setLoadingData(true);
    const [rl, el, ol, ev, st, rs, fj] = await Promise.all([
      aiAgentService.getRawLeads(),
      aiAgentService.getEnrichedLeads(),
      aiAgentService.getOutreachLogs(),
      hubService.getEvents(),
      hubService.getStaff(),
      hubService.getRadioShows(),
      hubService.getFounderJobs(),
    ]);
    setRawLeads(rl);
    setEnrichedLeads(el);
    setOutreachLogs(ol);
    setEvents(ev);
    setStaff(st);
    setRadioShows(rs);
    setFounderJobs(fj);
    setSystemSettings(hubService.getSystemSettings());
    setLoadingData(false);
  };

  useEffect(() => {
    if (user?.role === 'founder' || user?.role === 'staff') {
      refreshData();
    }
  }, [user]);

  if (!user) return <div className="p-24 text-center">Please login to access this area.</div>;

  const handleQualify = async (lead: RawLead) => {
    await aiAgentService.enrichLead(lead);
    await refreshData();
  };

  const handleEnrich = async (lead: RawLead) => {
    await aiAgentService.enrichLead(lead);
    await refreshData();
  };

  const handleOutreach = async (lead: EnrichedLead) => {
    await aiAgentService.draftOutreach(lead);
    await refreshData();
  };

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif mb-2">
              Hello, <span className="italic text-brand-olive">{user.name}</span>
            </h1>
            <p className="text-brand-ink/60">
              {user.role === 'founder' ? 'Founder Dashboard' : user.role === 'staff' ? 'Staff Portal' : 'Customer Portal'}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-6 py-2 border border-brand-olive/20 rounded-full text-sm font-bold hover:bg-brand-olive hover:text-white transition-all"
          >
            Logout
          </button>
        </div>

        {/* Founder Tabs */}
        {user.role === 'founder' && (
          <div className="flex flex-wrap gap-4 mb-12 border-b border-brand-olive/10 pb-4">
            {[
              { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
              { id: 'discovery', label: 'AI Discoveries', icon: <Search size={18} />, count: rawLeads.length },
              { id: 'qualification', label: 'Qualified Makers', icon: <ShieldCheck size={18} />, count: qualifiedLeads.length },
              { id: 'enrichment', label: 'Draft Listings', icon: <Zap size={18} />, count: enrichedLeads.length },
              { id: 'outreach', label: 'Outreach Queue', icon: <Mail size={18} />, count: outreachLogs.length },
              { id: 'events', label: "What's On", icon: <Calendar size={18} />, count: events.filter(e => !e.approved).length },
              { id: 'staff', label: 'Staff & Payroll', icon: <Users size={18} /> },
              { id: 'radio', label: 'Radio', icon: <Radio size={18} /> },
              { id: 'settings', label: 'System', icon: <Settings size={18} /> },
              { id: 'roadmap', label: 'Next Steps', icon: <Map size={18} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab.id
                    ? 'bg-brand-olive text-white shadow-md'
                    : 'text-brand-ink/60 hover:bg-brand-olive/5'
                  }`}
              >
                {tab.icon} {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white text-brand-olive' : 'bg-brand-olive text-white'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Founder Specific: Fog Day Survival Guide */}
              {user.role === 'founder' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="md:col-span-3 bg-brand-olive text-brand-cream p-8 md:p-12 rounded-[40px] shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <CloudRain size={32} />
                      <h2 className="text-3xl font-serif">Fog Day Survival Guide</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div>
                        <p className="text-lg opacity-80 mb-8 leading-relaxed">
                          Open this when your head feels full, foggy, or overwhelmed. You are not failing. Nothing is urgent by default.
                        </p>
                        <ul className="space-y-4">
                          <li className="flex items-center gap-3"><CheckCircle2 size={20} className="opacity-50" /> Do one thing only</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={20} className="opacity-50" /> Do no new decisions</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={20} className="opacity-50" /> It is OK to stop early</li>
                        </ul>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10">
                        <h3 className="font-bold mb-4">Emergency Handover</h3>
                        <p className="text-sm opacity-70 mb-6">Click below to notify PAs that today is a fog day. They will follow their checklists automatically.</p>
                        <button className="w-full py-4 bg-white text-brand-olive rounded-full font-bold hover:bg-brand-cream transition-all">
                          Activate Fog Day Mode
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Founder Specific: Management Tools */}
              {user.role === 'founder' && (
                <>
                  <div className="md:col-span-2 bg-white p-8 md:p-12 rounded-[40px] border border-brand-olive/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                      <ClipboardList className="text-brand-olive" />
                      <h3 className="text-2xl font-serif">Founder Jobs List</h3>
                    </div>
                    <div className="space-y-4">
                      {founderJobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-4 bg-brand-cream/50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${job.priority === 'High' ? 'bg-red-400' : job.priority === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                            <span className={`font-medium ${job.status === 'completed' ? 'line-through opacity-40' : ''}`}>{job.task}</span>
                          </div>
                          {job.status === 'pending' && (
                            <button
                              onClick={() => {
                                hubService.completeJob(job.id);
                                setFounderJobs(hubService.getFounderJobs());
                              }}
                              className="text-xs font-bold uppercase tracking-widest text-brand-olive"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                    <div className="w-12 h-12 bg-brand-cream rounded-xl flex items-center justify-center text-brand-olive mb-6">
                      <Package size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-4">Manage Listings</h3>
                    <p className="text-sm text-brand-ink/60 mb-8">Review, approve, or edit all directory and marketplace listings.</p>
                    <button
                      onClick={() => setActiveTab('listings')}
                      className="w-full py-3 bg-brand-cream text-brand-olive rounded-full font-bold text-sm"
                    >
                      Open Manager
                    </button>
                  </div>
                  <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                    <div className="w-12 h-12 bg-brand-cream rounded-xl flex items-center justify-center text-brand-olive mb-6">
                      <Users size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-4">Staff & Volunteers</h3>
                    <p className="text-sm text-brand-ink/60 mb-8">Manage PA tasks, volunteer schedules, and board communications.</p>
                    <button
                      onClick={() => setActiveTab('staff')}
                      className="w-full py-3 bg-brand-cream text-brand-olive rounded-full font-bold text-sm"
                    >
                      Manage Team
                    </button>
                  </div>
                  <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                    <div className="w-12 h-12 bg-brand-cream rounded-xl flex items-center justify-center text-brand-olive mb-6">
                      <Radio size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-4">Radio Operations</h3>
                    <p className="text-sm text-brand-ink/60 mb-8">Monitor Live365 status, show logs, and upcoming broadcasts.</p>
                    <button
                      onClick={() => setActiveTab('radio')}
                      className="w-full py-3 bg-brand-cream text-brand-olive rounded-full font-bold text-sm"
                    >
                      Radio Studio
                    </button>
                  </div>
                </>
              )}

              {/* Staff Specific: Jobs & Notes */}
              {user.role === 'staff' && (
                <>
                  <div className="md:col-span-2 bg-white p-8 md:p-12 rounded-[40px] border border-brand-olive/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                      <ClipboardList className="text-brand-olive" />
                      <h3 className="text-2xl font-serif">Jobs to Do</h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        { task: 'Review new producer applications', priority: 'High' },
                        { task: 'Update radio schedule for next week', priority: 'Medium' },
                        { task: 'Send membership renewal emails', priority: 'Low' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-brand-cream/50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${item.priority === 'High' ? 'bg-red-400' : item.priority === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                            <span className="font-medium">{item.task}</span>
                          </div>
                          <button className="text-xs font-bold uppercase tracking-widest text-brand-olive">Complete</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-8 md:p-12 rounded-[40px] border border-brand-olive/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                      <StickyNote className="text-brand-olive" />
                      <h3 className="text-2xl font-serif">Notes</h3>
                    </div>
                    <textarea
                      className="w-full h-48 p-4 bg-brand-cream/50 rounded-2xl border-none focus:ring-2 focus:ring-brand-olive/20 text-sm"
                      placeholder="Type your notes here..."
                    ></textarea>
                    <button className="w-full mt-4 py-3 bg-brand-olive text-white rounded-full font-bold text-sm">Save Notes</button>
                  </div>
                </>
              )}

              {/* Customer Specific: Manage Listings */}
              {user.role === 'customer' && (
                <div className="md:col-span-3 bg-white p-8 md:p-12 rounded-[40px] border border-brand-olive/5 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <Store className="text-brand-olive" />
                    <h3 className="text-2xl font-serif">Your Listings</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border border-brand-cream rounded-3xl flex justify-between items-center">
                      <div>
                        <h4 className="font-bold">Organic Honey Jars</h4>
                        <p className="text-xs opacity-50">Active • Marketplace</p>
                      </div>
                      <button className="text-brand-olive font-bold text-sm">Edit</button>
                    </div>
                    <button className="p-6 border-2 border-dashed border-brand-cream rounded-3xl flex items-center justify-center gap-2 text-brand-ink/40 hover:border-brand-olive/20 hover:text-brand-olive transition-all">
                      <Plus size={20} /> Add New Listing
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DISCOVERY TAB */}
          {activeTab === 'discovery' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-serif mb-2">AI Discoveries</h2>
                  <p className="text-brand-ink/60">Raw findings from public platforms. Review and qualify potential artisans.</p>
                </div>
                <button className="px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm flex items-center gap-2">
                  <Zap size={16} /> Run Discovery Agent
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {rawLeads.map(lead => (
                  <div key={lead.id} className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-cream px-2 py-0.5 rounded-full text-brand-olive">{lead.sourcePlatform}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">{lead.categoryHint}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{lead.displayName}</h3>
                      <p className="text-sm text-brand-ink/60 mb-4">{lead.bioText}</p>
                      <a href={lead.profileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-olive font-bold flex items-center gap-1 hover:underline">
                        View Profile <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleQualify(lead.id)}
                        className="px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm hover:bg-brand-olive/90 transition-all"
                      >
                        Qualify Artisan
                      </button>
                      <button
                        onClick={() => aiAgentService.discardRawLead(lead.id)}
                        className="px-6 py-3 border border-brand-olive/20 text-brand-ink/60 rounded-full font-bold text-sm hover:bg-brand-cream transition-all"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                ))}
                {rawLeads.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-[32px] border border-dashed border-brand-olive/20">
                    <p className="text-brand-ink/40 italic">No new discoveries to review.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QUALIFICATION TAB */}
          {activeTab === 'qualification' && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-serif mb-2">Qualified Makers</h2>
                <p className="text-brand-ink/60">Artisans verified by the Qualification Agent. Approve to create directory drafts.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {qualifiedLeads.map(lead => (
                  <div key={lead.id} className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1 px-2 py-1 bg-brand-olive/10 text-brand-olive rounded-lg font-bold text-xs">
                          <ShieldCheck size={14} /> Score: {lead.artisanScore}/5
                        </div>
                        <span className="text-xs text-brand-ink/40 italic">{lead.qualificationNotes}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-4">Lead ID: {lead.id}</h3>
                      <button
                        onClick={() => handleEnrich(lead.id)}
                        className="px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm flex items-center gap-2"
                      >
                        <Zap size={16} /> Enrich & Create Draft
                      </button>
                    </div>
                  </div>
                ))}
                {qualifiedLeads.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-[32px] border border-dashed border-brand-olive/20">
                    <p className="text-brand-ink/40 italic">No qualified leads waiting for enrichment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ENRICHMENT TAB */}
          {activeTab === 'enrichment' && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-serif mb-2">Draft Listings</h2>
                <p className="text-brand-ink/60">AI-generated directory entries. Edit and approve for outreach.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrichedLeads.map(lead => (
                  <div key={lead.id} className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-olive/60 mb-1 block">{lead.craftCategory}</span>
                        <h3 className="text-2xl font-serif">{lead.vendorName}</h3>
                      </div>
                      <span className="px-3 py-1 bg-brand-cream rounded-full text-[10px] font-bold uppercase tracking-wider text-brand-olive">
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-sm text-brand-ink/70 mb-8 leading-relaxed flex-grow">
                      {lead.summary}
                    </p>
                    <div className="space-y-3">
                      <button className="w-full py-3 border border-brand-olive/20 text-brand-olive rounded-full font-bold text-sm hover:bg-brand-olive hover:text-white transition-all">
                        Edit Details
                      </button>
                      <button
                        onClick={() => handleOutreach(lead.id)}
                        className="w-full py-3 bg-brand-olive text-white rounded-full font-bold text-sm flex items-center justify-center gap-2"
                      >
                        <Mail size={16} /> Approve & Draft Outreach
                      </button>
                    </div>
                  </div>
                ))}
                {enrichedLeads.length === 0 && (
                  <div className="md:col-span-2 text-center py-12 bg-white rounded-[32px] border border-dashed border-brand-olive/20">
                    <p className="text-brand-ink/40 italic">No draft listings to review.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OUTREACH TAB */}
          {activeTab === 'outreach' && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-serif mb-2">Outreach Queue</h2>
                <p className="text-brand-ink/60">Invitations ready to be sent. Track responses and claimed listings.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {outreachLogs.map(log => (
                  <div key={log.id} className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center text-brand-olive">
                          <Mail size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold">Outreach to Lead {log.enrichedLeadId.substr(0, 8)}</h4>
                          <p className="text-xs text-brand-ink/40">Sent via {log.contactMethod} on {new Date(log.sentAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Sent
                      </span>
                    </div>
                    <div className="bg-brand-cream/50 p-4 rounded-2xl text-sm italic text-brand-ink/70 mb-4">
                      "{log.messageSent}"
                    </div>
                    <div className="flex justify-end gap-3">
                      <button className="text-xs font-bold uppercase tracking-widest text-brand-olive">View Response</button>
                      <button className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Resend</button>
                    </div>
                  </div>
                ))}
                {outreachLogs.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-[32px] border border-dashed border-brand-olive/20">
                    <p className="text-brand-ink/40 italic">No outreach history to display.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ROADMAP TAB */}
          {activeTab === 'roadmap' && (
            <div className="space-y-12">
              <div className="mb-12">
                <h2 className="text-4xl font-serif mb-4">Next Steps <span className="italic text-brand-olive">Roadmap</span></h2>
                <p className="text-xl text-brand-ink/60 max-w-3xl">
                  A clear, calm set of next steps to make the project real but manageable. Pause, resume, or skip without breaking anything.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Step 7 */}
                <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive">
                      <Coins size={24} />
                    </div>
                    <h3 className="text-2xl font-serif">Step 7: Ethical Monetisation</h3>
                  </div>
                  <p className="text-brand-ink/60 mb-6">Only do this after trust is established. Maker-friendly and low pressure.</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> Free basic listing (permanent)</li>
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> Supporter listing (badge + longer bio)</li>
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> Featured artisan of the month (editorial)</li>
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> No pay-to-rank / No forced upgrades</li>
                  </ul>
                  <div className="p-4 bg-brand-cream/50 rounded-2xl border border-brand-olive/10">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-olive mb-2">Rule Locked</p>
                    <p className="text-xs text-brand-ink/60">Support is optional, not required. You can leave this off for months.</p>
                  </div>
                </div>

                {/* Step 8 */}
                <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive">
                      <Calendar size={24} />
                    </div>
                    <h3 className="text-2xl font-serif">Step 8: Events & Markets</h3>
                  </div>
                  <p className="text-brand-ink/60 mb-6">This is where directories shine. Connect makers to real-world events.</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> Craft fairs & Open studios</li>
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> Demonstrations & Workshops</li>
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> Community markets</li>
                  </ul>
                  <div className="p-4 bg-brand-cream/50 rounded-2xl border border-brand-olive/10">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-olive mb-2">Safe & Automated</p>
                    <p className="text-xs text-brand-ink/60">Pull in public event listings without scraping people or risking GDPR.</p>
                  </div>
                </div>

                {/* Step 9 */}
                <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive">
                      <BookOpen size={24} />
                    </div>
                    <h3 className="text-2xl font-serif">Step 9: Maker Stories</h3>
                  </div>
                  <p className="text-brand-ink/60 mb-6">Human over AI. Turn your directory into living heritage.</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> "How did you learn your craft?"</li>
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> "What tools do you rely on?"</li>
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> "What does a good making day look like?"</li>
                  </ul>
                  <div className="p-4 bg-brand-cream/50 rounded-2xl border border-brand-olive/10">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-olive mb-2">AI Role</p>
                    <p className="text-xs text-brand-ink/60">Clean up text and summarise long answers. Never invent background.</p>
                  </div>
                </div>

                {/* Step 10 */}
                <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive">
                      <Bot size={24} />
                    </div>
                    <h3 className="text-2xl font-serif">Step 10: Visitor AI</h3>
                  </div>
                  <p className="text-brand-ink/60 mb-6">Librarian AI, not hunter AI. Helps visitors find what they need.</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> "Show me leather workers near Farnham"</li>
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> "Who teaches weaving?"</li>
                    <li className="flex items-center gap-3 text-sm"><CheckSquare size={16} className="text-brand-olive/40" /> "Which makers use local materials?"</li>
                  </ul>
                  <div className="p-4 bg-brand-cream/50 rounded-2xl border border-brand-olive/10">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-olive mb-2">Safe Stop</p>
                    <p className="text-xs text-brand-ink/60">No outreach. No discovery. No contact. Just helpful search.</p>
                  </div>
                </div>
              </div>

              {/* Energy Safe Path */}
              <div className="bg-brand-olive text-brand-cream p-12 md:p-16 rounded-[40px] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <Battery size={32} />
                    <h2 className="text-3xl font-serif">Energy-Safe Path (Safe Mode)</h2>
                  </div>
                  <p className="text-xl opacity-80 mb-12 max-w-2xl">
                    If you're tired, foggy, or short on time — do ONLY this. Progress without burnout.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <Coffee size={20} className="opacity-50" />
                        <h4 className="font-bold">Session 1</h4>
                      </div>
                      <p className="text-sm opacity-70">Review 5 draft listings. Approve or reject. Stop.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <Coffee size={20} className="opacity-50" />
                        <h4 className="font-bold">Session 2</h4>
                      </div>
                      <p className="text-sm opacity-70">Send 2–3 invite messages. No follow-ups. Stop.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <Coffee size={20} className="opacity-50" />
                        <h4 className="font-bold">Session 3</h4>
                      </div>
                      <p className="text-sm opacity-70">Publish 3 listings. Add "More coming soon" text. Stop.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What not to do */}
              <div className="bg-white p-12 rounded-[40px] border border-brand-olive/10 text-center">
                <AlertCircle className="mx-auto text-red-400 mb-6" size={48} />
                <h3 className="text-2xl font-serif mb-4">What NOT to do next</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {['Build more automation', 'Add more platforms', 'Chase numbers', 'Worry about scale'].map(item => (
                    <span key={item} className="px-6 py-2 bg-red-50 text-red-600 rounded-full text-sm font-bold">
                      🚫 {item}
                    </span>
                  ))}
                </div>
                <p className="mt-8 text-brand-ink/60">You already built the hard part correctly. Take it slow.</p>
              </div>

              {/* Pre-Flight Checklist */}
              <div className="bg-white p-12 md:p-16 rounded-[40px] border border-brand-olive/10">
                <h2 className="text-3xl font-serif mb-8">Pre-Flight Checklist <span className="text-brand-olive italic">(Before Antigravity Build)</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="font-bold text-lg flex items-center gap-2"><ShieldCheck className="text-brand-olive" /> 1. Database & Auth</h4>
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-brand-olive/20 flex-shrink-0 mt-1"></div>
                        <p className="text-sm text-brand-ink/70">Set up Supabase tables for <code className="bg-brand-cream px-1">leads</code>, <code className="bg-brand-cream px-1">events</code>, <code className="bg-brand-cream px-1">staff</code>, and <code className="bg-brand-cream px-1">stories</code>.</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-brand-olive/20 flex-shrink-0 mt-1"></div>
                        <p className="text-sm text-brand-ink/70">Configure Row Level Security (RLS) so only you can see the Fog Day guide.</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-brand-olive/20 flex-shrink-0 mt-1"></div>
                        <p className="text-sm text-brand-ink/70">Map your <code className="bg-brand-cream px-1">UserRole</code> to Supabase metadata.</p>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-6">
                    <h4 className="font-bold text-lg flex items-center gap-2"><Zap className="text-brand-olive" /> 2. Automation & AI</h4>
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-brand-olive/20 flex-shrink-0 mt-1"></div>
                        <p className="text-sm text-brand-ink/70">Connect Make.com to your Supabase <code className="bg-brand-cream px-1">events</code> table for automated fetching.</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-brand-olive/20 flex-shrink-0 mt-1"></div>
                        <p className="text-sm text-brand-ink/70">Set up the Gemini API keys in your production environment variables.</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-brand-olive/20 flex-shrink-0 mt-1"></div>
                        <p className="text-sm text-brand-ink/70">Test the "Librarian AI" prompt with 5 sample directory listings.</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-serif mb-2">What's On Management</h2>
                  <p className="text-brand-ink/60">Review and approve public event listings for the community noticeboard.</p>
                </div>
                <button className="px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm flex items-center gap-2">
                  <Plus size={16} /> Add Event Manually
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {events.map(event => (
                  <div key={event.id} className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-cream px-2 py-0.5 rounded-full text-brand-olive">{event.source}</span>
                        {!event.approved && (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">Pending Review</span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-1">{event.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-brand-ink/40 mb-3">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(event.startDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Map size={12} /> {event.venue}, {event.location}</span>
                      </div>
                      <p className="text-sm text-brand-ink/60">{event.description}</p>
                    </div>
                    <div className="flex gap-3">
                      {!event.approved && (
                        <button
                          onClick={() => {
                            hubService.approveEvent(event.id);
                            setEvents(hubService.getEvents());
                          }}
                          className="px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => {
                          hubService.deleteEvent(event.id);
                          setEvents(hubService.getEvents());
                        }}
                        className="px-4 py-3 border border-red-100 text-red-400 rounded-full font-bold text-sm hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-brand-cream/30 p-8 rounded-[40px] border border-brand-olive/10">
                <h4 className="font-bold mb-4">Noticeboard Rules</h4>
                <p className="text-sm text-brand-ink/60 leading-relaxed">
                  Events listed here are publicly advertised by organisers. We link out to organisers – we do not sell tickets. No attendee data is collected.
                </p>
              </div>
            </div>
          )}

          {/* STAFF TAB */}
          {activeTab === 'staff' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-serif mb-2">Staff & Volunteers Hub</h2>
                  <p className="text-brand-ink/60">Manage your team, roles, and status for payroll and coordination.</p>
                </div>
                <button className="px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm flex items-center gap-2">
                  <UserPlus size={16} /> Add Team Member
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {staff.map(member => (
                  <div key={member.id} className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center text-brand-olive font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{member.name}</h3>
                          <p className="text-xs text-brand-ink/40">{member.role}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${member.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-brand-cream text-brand-ink/40'
                        }`}>
                        {member.status}
                      </span>
                    </div>
                    <div className="space-y-2 mb-8">
                      <p className="text-sm text-brand-ink/60 flex items-center gap-2"><Mail size={14} /> {member.email}</p>
                      <p className="text-sm text-brand-ink/60 flex items-center gap-2"><Clock size={14} /> Joined {member.joinedAt}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => alert(`Exporting payroll data for ${member.name}...`)}
                        className="flex-1 py-3 bg-brand-cream text-brand-olive rounded-full font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <Download size={14} /> Payroll Info
                      </button>
                      <button
                        onClick={() => {
                          hubService.removeStaff(member.id);
                          setStaff(hubService.getStaff());
                        }}
                        className="px-4 py-3 border border-red-100 text-red-400 rounded-full font-bold text-xs hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RADIO TAB */}
          {activeTab === 'radio' && (
            <div className="space-y-8">
              <div className="mb-8">
                <h2 className="text-3xl font-serif mb-2">Radio Operations</h2>
                <p className="text-brand-ink/60">Monitor Live365 status, show logs, and upcoming broadcasts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-xl font-serif">Show Schedule</h3>
                  {radioShows.map(show => (
                    <div key={show.id} className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm flex justify-between items-center">
                      <div>
                        <h4 className="font-bold">{show.title}</h4>
                        <p className="text-xs text-brand-ink/40">{show.schedule} • Host: {show.host}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${show.status === 'live' ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-brand-cream text-brand-ink/40'
                          }`}>
                          {show.status}
                        </span>
                        <Settings size={18} className="text-brand-ink/20 cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-brand-olive text-brand-cream p-8 rounded-[40px] shadow-lg">
                  <h3 className="text-xl font-serif mb-6">Live365 Status</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm opacity-70">Stream Status</span>
                      <span className="flex items-center gap-2 text-sm font-bold"><div className="w-2 h-2 bg-green-400 rounded-full"></div> Online</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm opacity-70">Current Listeners</span>
                      <span className="text-sm font-bold">42</span>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                      <button className="w-full py-4 bg-white text-brand-olive rounded-full font-bold text-sm">Open Live365 Studio</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="mb-8">
                <h2 className="text-3xl font-serif mb-2">System Controls</h2>
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
                        <div>
                          <p className="font-bold text-sm">{agent.label}</p>
                          <p className="text-xs text-brand-ink/40">{agent.desc}</p>
                        </div>
                        <button
                          onClick={() => {
                            const newSettings = hubService.updateSystemSettings({ [agent.id]: !systemSettings[agent.id as keyof typeof systemSettings] });
                            setSystemSettings(newSettings);
                          }}
                          className={`p-1 rounded-full transition-colors ${systemSettings[agent.id as keyof typeof systemSettings] ? 'text-brand-olive' : 'text-brand-ink/20'}`}
                        >
                          {systemSettings[agent.id as keyof typeof systemSettings] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
                  <h3 className="text-xl font-serif mb-6 flex items-center gap-2"><ShieldAlert className="text-red-400" /> Global Safety</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">Maintenance Mode</p>
                        <p className="text-xs text-brand-ink/40">Disable all public-facing features</p>
                      </div>
                      <button
                        onClick={() => {
                          const newSettings = hubService.updateSystemSettings({ maintenanceMode: !systemSettings.maintenanceMode });
                          setSystemSettings(newSettings);
                        }}
                        className={`p-1 rounded-full transition-colors ${systemSettings.maintenanceMode ? 'text-red-400' : 'text-brand-ink/20'}`}
                      >
                        {systemSettings.maintenanceMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-12 p-6 bg-red-50 rounded-3xl border border-red-100">
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
    </div>
  );
};


