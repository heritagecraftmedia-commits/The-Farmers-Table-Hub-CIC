import React from 'react';
import { Package } from 'lucide-react';
import { EmptyState } from '../EmptyState';

/**
 * Stock & Inventory.
 *
 * Previously showed invented counts ("3 Critical", "18 Good Stock",
 * "Next Delivery: Tomorrow") over a list of invented café stock lines such as
 * "Organic Whole Milk — 4/24 units — Critical". Nothing was measured; a
 * "Critical" badge implied someone should reorder something that was never
 * counted.
 *
 * There is no stock or inventory table in the schema, so there is nothing
 * truthful to show until one exists.
 */
export const CentralStock: React.FC = () => (
    <div className="space-y-10">
        <div>
            <h2 className="text-3xl font-serif">Stock <span className="italic text-brand-olive">&amp; Inventory</span></h2>
            <p className="text-brand-ink/50 mt-1">Café and kitchen stock levels.</p>
        </div>

        <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm">
            <EmptyState
                icon={Package}
                title="Stock tracking is being prepared"
                description="Stock levels, reorder alerts and delivery scheduling will appear here once inventory tracking is connected."
                comingSoon
            />
        </div>
    </div>
);
