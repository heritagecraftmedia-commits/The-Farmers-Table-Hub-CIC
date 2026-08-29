import React from 'react';
import { Coins, ExternalLink } from 'lucide-react';
import { EmptyState } from '../EmptyState';

/**
 * Finance Centre.
 *
 * Everything on this screen was previously hardcoded and invented: a "£3,420
 * this month" headline, four named client invoices with payment statuses, an
 * income breakdown by percentage, and a "£14,842.50 Total CIC Assets" figure.
 * None of it came from anywhere — there is no finance data source in the
 * application, and no Xero integration behind the button.
 *
 * A founder dashboard showing invented money is worse than showing none: it
 * invites decisions, and eventually filings, based on numbers nobody produced.
 *
 * The screen is kept, and says plainly that it is not connected yet. When a
 * real source is wired up, render it here in place of the empty state; the
 * Xero link is retained because it goes to the genuine external product.
 */
export const CentralFinance: React.FC = () => (
    <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h2 className="text-3xl font-serif">Finance <span className="italic text-brand-olive">Centre</span></h2>
                <p className="text-brand-ink/50 mt-1">Ethical income tracking for the CIC.</p>
            </div>
            <a
                href="https://go.xero.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10 transition-transform active:scale-95"
            >
                Open Xero <ExternalLink size={16} />
            </a>
        </div>

        <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm">
            <EmptyState
                icon={Coins}
                title="Finance tools are being prepared"
                description="No financial records are currently available. Income, invoices and expenditure will appear here once the finance system is connected."
                comingSoon
                note="Bookkeeping continues in Xero in the meantime — use the link above."
            />
        </div>
    </div>
);
