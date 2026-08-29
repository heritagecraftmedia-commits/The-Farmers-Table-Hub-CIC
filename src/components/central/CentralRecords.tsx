import React from 'react';
import { BookOpen, ChevronRight, ExternalLink, Edit3, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../EmptyState';

/**
 * Records & Integration.
 *
 * Previously showed a Notion workspace panel listing five notebooks with
 * "Synced 2h ago" / "Live · Now" statuses, and a HubSpot panel reporting
 * "47 Contacts", "8 Active Deals" and "12 New Leads". There is no Notion or
 * HubSpot integration in this application: every status and count was
 * invented, and the "Force Full Sync" button called nothing.
 *
 * Claiming a sync that does not exist is worse than claiming a number: it
 * implies records are being backed up somewhere they are not.
 *
 * The Internal Drafting Spaces below are real routes and are unchanged.
 */
export const CentralRecords: React.FC = () => (
    <div className="space-y-10">
        <div>
            <h2 className="text-3xl font-serif">Records <span className="italic text-brand-olive">&amp; Integration</span></h2>
            <p className="text-brand-ink/50 mt-1">External records and CRM synchronisation.</p>
        </div>

        <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm">
            <EmptyState
                icon={Database}
                title="No integrations connected"
                description="Once an external records or CRM system is connected, its synchronisation status will be reported here."
                comingSoon
                note="Nothing is currently syncing to or from this application."
            />
        </div>

        <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm p-8 md:p-10">
            <div className="mb-8">
                <h3 className="text-2xl font-serif text-brand-ink">Internal <span className="italic text-brand-olive">Drafting Spaces</span></h3>
                <p className="text-sm text-brand-ink/40">Private session-based editors for founder notes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/changes" className="flex items-center justify-between p-6 bg-brand-cream/20 rounded-3xl border border-brand-olive/5 hover:border-brand-olive/20 transition-all group">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 flex-shrink-0 bg-white rounded-xl flex items-center justify-center text-brand-olive">
                            <Edit3 size={18} />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-brand-ink group-hover:text-brand-olive transition-colors">Project Changes</h4>
                            <p className="text-xs text-brand-ink/40">Draft updates &amp; structural shifts</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-brand-ink/20 group-hover:text-brand-olive transition-all flex-shrink-0" />
                </Link>

                <Link to="/notes" className="flex items-center justify-between p-4 bg-white rounded-2xl border border-brand-olive/10 hover:bg-brand-olive/5 transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-brand-cream text-brand-olive flex-shrink-0">
                            <BookOpen size={18} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm">Notes Archive</h3>
                            <p className="text-[10px] text-brand-ink/40">Secondary drafting space</p>
                        </div>
                    </div>
                    <ExternalLink size={14} className="text-brand-ink/20 group-hover:text-brand-olive transition-all flex-shrink-0" />
                </Link>

                <Link to="/draft" className="flex items-center justify-between p-4 bg-brand-olive/5 rounded-2xl border border-brand-olive/20 hover:bg-brand-olive/10 transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-brand-olive text-white flex-shrink-0">
                            <Edit3 size={18} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm">Clear Sandbox</h3>
                            <p className="text-[10px] text-brand-olive/60">Dedicated paste space</p>
                        </div>
                    </div>
                    <ExternalLink size={14} className="text-brand-olive/40 group-hover:text-brand-olive transition-all flex-shrink-0" />
                </Link>
            </div>
        </div>
    </div>
);
