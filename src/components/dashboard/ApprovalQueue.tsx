import React from 'react';
import { Check, X, Clock, ExternalLink } from 'lucide-react';
import { PendingListing } from '../../types';

interface Props {
    listings: PendingListing[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onAdd?: (listing: Omit<PendingListing, 'id' | 'discoveredAt' | 'status'>) => void;
}

export const ApprovalQueue: React.FC<Props> = ({ listings, onApprove, onReject }) => {
    const pending = (listings || []).filter((l: any) => !l.status || l.status === 'pending');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-serif mb-1">Approval Queue</h2>
                    <p className="text-brand-ink/60">Review pending listings before they go live.</p>
                </div>
                {pending.length > 0 && (
                    <span className="px-3 py-1 bg-brand-olive/10 text-brand-olive rounded-full text-xs font-bold">
                        {pending.length} pending
                    </span>
                )}
            </div>

            {pending.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[40px]">
                    <Clock size={40} className="text-brand-ink/20 mx-auto mb-4" />
                    <p className="font-serif text-xl mb-2">Nothing waiting on approval</p>
                    <p className="text-brand-ink/50 text-sm">New submissions will appear here for review.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pending.map((listing: any) => (
                        <div
                            key={listing.id}
                            className="bg-white p-6 rounded-[32px] border border-brand-olive/5 shadow-sm flex flex-col md:flex-row md:items-center gap-4"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold">
                                        {listing.displayName || listing.vendorName || listing.title || 'Untitled listing'}
                                    </h4>
                                    {listing.sourcePlatform && (
                                        <span className="text-[10px] font-bold bg-brand-cream px-2 py-0.5 rounded-full text-brand-ink/50">
                                            {listing.sourcePlatform}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-brand-ink/50 mb-2">
                                    {[listing.categoryHint || listing.craftCategory, listing.locationHint || listing.location]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                                {(listing.bioText || listing.description) && (
                                    <p className="text-sm text-brand-ink/70 line-clamp-2">
                                        {listing.bioText || listing.description}
                                    </p>
                                )}
                                {(listing.profileUrl || listing.website) && (
                                    
                                        href={listing.profileUrl || listing.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-brand-olive mt-2 inline-flex items-center gap-1"
                                    >
                                        <ExternalLink size={12} /> View Profile
                                    </a>
                                )}
                                {listing.discoveredAt && (
                                    <p className="text-[10px] text-brand-ink/30 mt-2">
                                        Submitted {new Date(listing.discoveredAt).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    onClick={() => onReject(listing.id)}
                                    className="px-4 py-2 border border-red-100 text-red-400 rounded-full text-xs font-bold hover:bg-red-50 flex items-center gap-1"
                                >
                                    <X size={12} /> Reject
                                </button>
                                <button
                                    onClick={() => onApprove(listing.id)}
                                    className="px-4 py-2 bg-brand-olive text-white rounded-full text-xs font-bold flex items-center gap-1"
                                >
                                    <Check size={12} /> Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApprovalQueue;
