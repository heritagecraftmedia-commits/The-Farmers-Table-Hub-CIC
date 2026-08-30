import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { pendingEventsService, PendingEvent } from "../services/pendingEventsService";

/**
 * Reviewer assistance for the What's On queue.
 *
 * This page used to run a "four-agent team" that produced a weekly listing
 * of venues, artists and nights from the model's own recollection of the
 * Farnham area. Nothing it returned came from a source, and it was
 * presented as a ready-to-publish update. That has been removed.
 *
 * Discovery now runs weekly against a configured source and stages
 * candidates in `pending_events` (see src/services/discovery/). This page
 * asks the assistant to comment on ONE of those real candidates, to help
 * the reviewer decide. The assistant recommends. The human approves, in
 * the dashboard. Nothing here writes to `events`.
 */

export default function WhatsOnAgent() {
  const [candidates, setCandidates] = useState<PendingEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const list = await pendingEventsService.list(["pending", "needs_verification"]);
      setCandidates(list);
      if (list.length > 0) setSelectedId(list[0].id);
      setLoadingQueue(false);
    })();
  }, []);

  const selected = candidates.find(c => c.id === selectedId) ?? null;

  async function askAssistant() {
    if (!selected) return;
    setLoading(true);
    setOutput("");
    setError("");
    setCopied(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("whats-on-agent", {
        // The candidate is required. The function will not generate events.
        body: {
          candidate: {
            title: selected.title,
            description: selected.description,
            startDate: selected.startDate,
            endDate: selected.endDate,
            venue: selected.venue,
            location: selected.location,
            organiser: selected.organiser,
            sourceUrl: selected.sourceUrl,
            sourcePlatform: selected.sourcePlatform,
            category: selected.category,
            confidenceScore: selected.confidenceScore,
          },
        },
      });

      if (fnError) {
        setError("Could not reach the assistant. Please try again.");
      } else if (data?.error) {
        setError(data.error);
      } else {
        setOutput(data?.text ?? "");
        if (data?.truncated) {
          setError("The reply was cut short. Run it again if anything looks missing.");
        }
      }
    } catch {
      setError("Could not connect to the assistant. Please try again.");
    }

    setLoading(false);
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="min-h-screen bg-brand-cream/40 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        <header>
          <h1 className="text-3xl font-serif text-brand-ink mb-2">What's On — reviewer assistance</h1>
          <p className="text-brand-ink/60 text-sm leading-relaxed">
            Pick a candidate from the discovery queue and the assistant will suggest a category,
            comment on how well it fits, and draft a plain-English summary — using only that
            candidate's own text. It cannot find events, and it cannot publish. Approving and
            publishing happens in the{" "}
            <Link to="/dashboard" className="font-bold text-brand-olive hover:underline">dashboard</Link>.
          </p>
        </header>

        {loadingQueue && <p className="text-sm text-brand-ink/50">Loading the queue…</p>}

        {!loadingQueue && candidates.length === 0 && (
          <div className="bg-white rounded-2xl border border-brand-olive/10 p-8 text-center">
            <p className="font-bold text-brand-ink mb-1">Nothing waiting for review</p>
            <p className="text-sm text-brand-ink/55 leading-relaxed">
              The weekly discovery run stages candidates every Tuesday. If no source has been
              configured yet, the run exits without staging anything — it will not invent events
              to fill the gap.
            </p>
          </div>
        )}

        {candidates.length > 0 && (
          <div className="bg-white rounded-2xl border border-brand-olive/10 p-6 space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-ink/50">
                Candidate to review
              </span>
              <select
                className="mt-2 w-full p-3 rounded-xl border border-brand-olive/20 text-sm bg-white"
                value={selectedId}
                onChange={e => { setSelectedId(e.target.value); setOutput(""); setError(""); }}
              >
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {new Date(c.startDate).toLocaleDateString("en-GB")}
                  </option>
                ))}
              </select>
            </label>

            {selected && (
              <div className="bg-brand-cream/50 rounded-xl p-4 text-xs space-y-1 text-brand-ink/70">
                <p><strong>Venue:</strong> {selected.venue ?? "(not supplied)"}</p>
                <p><strong>Location:</strong> {selected.location ?? "(not supplied)"}</p>
                <p><strong>Pipeline category:</strong> {selected.category}</p>
                <p><strong>Pipeline score:</strong> {selected.confidenceScore ?? "—"}/100</p>
                <p>
                  <strong>Source:</strong>{" "}
                  <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer"
                     className="font-bold text-brand-olive hover:underline">
                    {selected.sourcePlatform}
                  </a>
                </p>
              </div>
            )}

            <button
              onClick={askAssistant}
              disabled={loading || !selected}
              className="w-full px-6 py-3 rounded-full bg-brand-olive text-white font-bold text-sm disabled:opacity-50"
            >
              {loading ? "Asking the assistant…" : "Ask the assistant about this candidate"}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {output && (
          <div className="bg-white rounded-2xl border border-brand-olive/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-brand-olive/10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-ink/50">
                Recommendation — not a decision
              </span>
              <button
                onClick={copyOutput}
                className="px-3 py-1.5 rounded-lg border border-brand-olive/20 text-xs font-bold text-brand-ink/70 hover:bg-brand-cream"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-6 text-sm leading-relaxed text-brand-ink/85 whitespace-pre-wrap">
              {output}
            </div>
            <div className="px-5 py-3 border-t border-brand-olive/10 text-xs text-brand-ink/50">
              The assistant only sees this candidate's own text. Check anything it says against
              the source listing before you publish.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
