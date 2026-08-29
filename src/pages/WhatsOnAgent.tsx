import { useState } from "react";
import { supabase } from "../lib/supabase";

// The prompts and the Anthropic call now live server-side in
// supabase/functions/whats-on-agent. They used to be here, which meant
// VITE_ANTHROPIC_API_KEY was inlined into the public JS bundle at build time
// and readable by anyone who loaded the site.
//
// The agent still only ever returns draft text for a human to review. It does
// not write to `events` and it does not publish anything.

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

    try {
      const { data, error: fnError } = await supabase.functions.invoke("whats-on-agent", {
        body: {},
      });

      if (fnError) {
        setError("Could not reach the What's On agent. Please try again.");
      } else if (data?.error) {
        setError(data.error);
      } else {
        setOutput(data?.text ?? "");
        if (data?.truncated) {
          setError("The update was cut short. Run it again if anything looks missing.");
        }
      }
    } catch {
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
