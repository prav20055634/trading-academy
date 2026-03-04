import React, { useState } from "react";
import { STRATEGIES } from "../data/markets";

export default function Strategies() {
  const [active, setActive] = useState(STRATEGIES[0]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🧠 Strategy Reference</h1>
        <p className="page-subtitle">5 SMC strategies — learn in order. Each builds on the previous.</p>
      </div>
      <div className="grid-2" style={{ gap: 16, alignItems: "start" }}>
        {/* Left: strategy list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STRATEGIES.map(s => (
            <div
              key={s.id}
              onClick={() => setActive(s)}
              style={{
                background: active.id === s.id ? `rgba(${hexToRgb(s.color)},0.08)` : "var(--bg-card)",
                border: `1px solid ${active.id === s.id ? s.color : "var(--border)"}`,
                borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: s.color }}>
                  {s.id}. {s.name}
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: `rgba(${hexToRgb(s.levelColor)},0.1)`, color: s.levelColor, border: `1px solid ${s.levelColor}30` }}>
                  {s.level}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.summary}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 10, color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>R:R {s.rr}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>• {s.frequency}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: detail */}
        {active && (
          <div className="card" style={{ borderTopColor: active.color, borderTopWidth: 3 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: active.color, marginBottom: 4 }}>
                {active.name}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <span className="badge badge-green">{active.rr} R:R</span>
                <span className="badge badge-blue">{active.killzone}</span>
                <span className="badge badge-orange">{active.winRate}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{active.description}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>📋 EXECUTION STEPS</div>
              {active.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                  <span style={{ color: active.color, fontWeight: 700, minWidth: 20 }}>{i+1}.</span>
                  <span style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Best Pairs</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {active.bestPairs.map(p => <span key={p} className="badge badge-blue">{p}</span>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Timeframes</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{active.timeframes}</div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Prerequisites</div>
              {active.prerequisites.map((p, i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", padding: "3px 0" }}>→ {p}</div>
              ))}
            </div>

            <div style={{ background: "rgba(244,67,54,0.06)", border: "1px solid rgba(244,67,54,0.2)", borderRadius: 8, padding: 12, fontSize: 12, color: "var(--accent-red)" }}>
              ⛔ AVOID: {active.avoid}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith("#")) return "0,212,170";
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "0,212,170";
}
