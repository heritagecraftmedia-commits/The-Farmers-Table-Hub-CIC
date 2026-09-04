import React from 'react';
import { CalendarDays } from 'lucide-react';
import { EmptyState } from '../EmptyState';

/**
 * Rotas & Schedules.
 *
 * Previously rendered a week grid for five invented people ("Alice S.",
 * "Tom B.", "Sarah W.", "James I.", "Emma G.") with ticks, "NOW" and "VOL"
 * markers — a staffing rota for a team that does not exist.
 *
 * There is no rota table in the schema, so unlike People and Tasks there is
 * no real source to point this at. It says so rather than showing a plausible
 * week. Building it needs a shifts table first.
 */
export const CentralSchedules: React.FC = () => (
    <div className="space-y-10">
        <div>
            <h2 className="text-3xl font-serif">Rotas <span className="italic text-brand-olive">&amp; Schedules</span></h2>
            <p className="text-brand-ink/50 mt-1">Shift planning for staff and volunteers.</p>
        </div>

        <div className="bg-white rounded-[40px] border border-brand-olive/5 shadow-sm">
            <EmptyState
                icon={CalendarDays}
                title="Shift planning is being prepared"
                description="Weekly rotas for staff and volunteers will appear here once shift scheduling is built."
                comingSoon
                note="Team members themselves are managed under People."
            />
        </div>
    </div>
);
