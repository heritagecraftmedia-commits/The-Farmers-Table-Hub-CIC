import React from 'react';
import { Store, Plus } from 'lucide-react';
import { EmptyState } from '../EmptyState';

/**
 * Advertising Centre.
 *
 * Previously listed five advertisers — named local businesses with packages,
 * tiers, renewal dates and "Paid" / "Overdue" payment statuses — none of whom
 * are Farmers Table advertisers. The header also carried a "HubSpot Synced"
 * badge; there is no HubSpot integration in this application, so the badge
 * asserted a live sync that does not exist. Both are removed.
 *
 * Recording that a real business owes money, when it does not, is the kind of
 * error that is expensive to discover late. The table structure is kept for
 * whoever wires up the real source; only the invented rows are gone.
 */
export const CentralAdvertisers: React.FC = () => (
    <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h2 className="text-3xl font-serif">Advertising <span className="italic text-brand-olive">Centre</span></h2>
                <p className="text-brand-ink/50 mt-1">Track sponsors, listings and renewals.</p>
            </div>
            <button
                disabled
                title="Available once the advertising system is connected"
                className="flex items-center gap-2 px-6 py-3 bg-brand-olive/30 text-white rounded-full text-sm font-bold cursor-not-allowed"
            >
                <Plus size={18} /> New Advertiser
            </button>
        </div>

        <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm">
            <EmptyState
                icon={Store}
                title="Advertiser management is being prepared"
                description="Advertiser records, campaign packages and renewal tracking will appear here as the advertising system is brought online."
                comingSoon
                note="Radio sponsors already recorded in the studio tools are managed under Radio."
            />
        </div>
    </div>
);
