import { useState } from "react";

const SYSTEM_PROMPT = `You are an AI agent team working for a UK community radio station and CIC called TFT-Radio (The Farmers Table Hub).

Your goal is to collect, verify, and summarise local live music, arts, and cultural events in and around Farnham, Surrey on a weekly basis.

The output must be clear, calm, non-technical, and suitable for people with cognitive fatigue or memory issues.

You operate as four agents working together:

AGENT 1 – VENUE SCOUT
Find local venues in Farnham and nearby villages (pubs, bars, community halls, arts centres, cafes). Look for live music nights, open mic nights, folk/acoustic sessions, DJ nights.

AGENT 2 – ARTIST & PERFORMER SCOUT
Identify local artists, bands, DJs, and performers connected to Farnham / West Surrey. Focus on regular gigging artists, community musicians, folk, indie, acoustic, jazz, local DJs.

AGENT 3 – EVENT VERIFIER
Cross-check events to ensure they are current or upcoming, dates are clear, and locations are correct. Flag events as: "Weekly regular", "One-off event", or "Monthly night".

AGENT 4 – EDITOR (ACCESSIBILITY & RADIO-FRIENDLY)
Rewrite everything in plain English. No hype language. No emojis. Short sentences. Friendly but calm tone. Suitable for website "What's On" section, radio mentions, and weekly update posts.

IMPORTANT RULES:
- Do NOT invent events. If unsure, clearly say "unconfirmed".
- Focus on local community scale, not major touring acts.
- Prioritise Farnham, then nearby Surrey villages.
- Prefer Thursday to Sunday events.
- Include next 7 to 10 days only.

OUTPUT FORMAT — use exactly this structure:

What's On This Week – Farnham Area

Live Music and Events
[List venues, day, type of event, one-line description]

Local Artists to Look Out For
[List artist name, genre, where playing if known]

Regular Nights
[List venue, weekly/monthly, type of night]

Notes
[Any changes, new venues discovered, events needing confirmation]`;

const USER_PROMPT = `You are running the weekly What's On update for TFT-Radio, Farnham, Surrey.

Today's date is: ${new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

Using your knowledge of Farnham, Surrey and the surrounding area (including Alton, Guildford, Godalming, Haslemere, and nearby villages), produce the weekly What's On update now.

If you do not have confirmed real-time data, clearly label items as "check to confirm" rather than inventing details. Focus on venues and nights that are known to run regularly in this area.

Produce the full weekly update in the format specified. Plain English only. No emojis. Short sentences.`;

export default function WhatsOnAgent() {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function runAgentTeam() {
    setLoading(true);
    setOutput("");
    setError("");
    setCopied(false);

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setError("No API key configured. Add VITE_ANTHROPIC_API_KEY to your .env file.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-allow-browser": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: USER_PROMPT }],
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError("Something went wrong: " + data.error.message);
      } else {
        const text = data.content?.map((b: { text?: string }) => b.text || "").join("\n") || "";
        setOutput(text);
      }
    } catch (err) {
      setError("Could not connect to the AI. Please try again.");
    }

    setLoading(false);
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      fontFamily: "'Georgia', serif",
      padding: "0",
      margin: "0",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "24px 32px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <div style={{
          width: "44px", height: "44px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #e63946, #c1121f)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px", flexShrink: 0,
          boxShadow: "0 0 16px rgba(230,57,70,0.4)",
        }}>📻</div>
        <div>
          <div style={{ color: "#fff", fontSize: "20px", fontWeight: "bold", letterSpacing: "0.02em" }}>
            TFT-Radio
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            What's On — AI Agent Team
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          {["Venue Scout", "Artist Scout", "Verifier", "Editor"].map((role, i) => (
            <div key={i} style={{
              background: loading ? "rgba(230,57,70,0.2)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${loading ? "rgba(230,57,70,0.4)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "11px",
              color: loading ? "#e63946" : "rgba(255,255,255,0.5)",
              transition: "all 0.3s",
              animationDelay: `${i * 0.15}s`,
            }}>
              {role}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Intro card */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "28px",
          marginBottom: "28px",
        }}>
          <h1 style={{
            color: "#fff",
            fontSize: "26px",
            margin: "0 0 10px 0",
            fontWeight: "normal",
            letterSpacing: "-0.01em",
          }}>
            Weekly What's On — Farnham Area
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "15px",
            margin: "0",
            lineHeight: "1.6",
          }}>
            Press the button below. Your four-agent team will search, verify, and write your weekly events update.
            Output is ready to paste into your website, radio notes, or social posts.
          </p>
        </div>

        {/* Run button */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <button
            onClick={runAgentTeam}
            disabled={loading}
            style={{
              background: loading
                ? "rgba(230,57,70,0.3)"
                : "linear-gradient(135deg, #e63946, #c1121f)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "17px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
              padding: "18px 48px",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.02em",
              boxShadow: loading ? "none" : "0 4px 24px rgba(230,57,70,0.4)",
              transition: "all 0.2s",
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                Agents working...
              </>
            ) : (
              <>Run Agent Team — Get This Week's Events</>
            )}
          </button>

          {loading && (
            <p style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "13px",
              marginTop: "14px",
              letterSpacing: "0.03em",
            }}>
              Venue Scout → Artist Scout → Verifier → Editor
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(230,57,70,0.1)",
            border: "1px solid rgba(230,57,70,0.3)",
            borderRadius: "12px",
            padding: "20px",
            color: "#ff8a8a",
            marginBottom: "24px",
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            overflow: "hidden",
          }}>
            {/* Output header */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                This Week's Update — Ready to Copy
              </span>
              <button
                onClick={copyOutput}
                style={{
                  background: copied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)",
                  border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.15)"}`,
                  borderRadius: "8px",
                  color: copied ? "#4ade80" : "rgba(255,255,255,0.7)",
                  fontSize: "13px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontFamily: "'Georgia', serif",
                  transition: "all 0.2s",
                }}
              >
                {copied ? "Copied ✓" : "Copy All"}
              </button>
            </div>

            {/* Output text */}
            <div style={{
              padding: "28px",
              color: "rgba(255,255,255,0.85)",
              fontSize: "15px",
              lineHeight: "1.75",
              whiteSpace: "pre-wrap",
              fontFamily: "'Georgia', serif",
            }}>
              {output}
            </div>

            {/* Footer actions */}
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "16px 24px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}>
              {["Website", "Radio Notes", "Social Post"].map(label => (
                <div key={label} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "12px",
                  letterSpacing: "0.04em",
                }}>
                  → Paste into {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: "center",
          marginTop: "48px",
          color: "rgba(255,255,255,0.2)",
          fontSize: "12px",
          letterSpacing: "0.04em",
        }}>
          THE FARMERS TABLE HUB CIC — FARNHAM, SURREY
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
