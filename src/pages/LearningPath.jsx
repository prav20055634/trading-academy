import React, { useState } from "react";
import { LEARNING_PATH, STRATEGIES } from "../data/markets";

function PhaseCard({ phase, isExpanded, onToggle, isCompleted, onComplete }) {
  return (
    <div className="phase-card" style={{ borderLeftColor: phase.color, borderLeftWidth: 3 }}>
      <div className="phase-header" style={{ cursor: "pointer" }} onClick={onToggle}>
        <div className="phase-icon" style={{ background: `rgba(${hexToRgb(phase.color)},0.12)` }}>
          {phase.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: phase.color, color: "#000", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
              Phase {phase.phase}
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              {phase.title}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
            ⏱ {phase.duration} • {phase.pair}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isCompleted && <span className="badge badge-green">✓ DONE</span>}
          {phase.strategy && <span className="badge badge-orange">{phase.strategy}</span>}
          <span style={{ color: "var(--text-muted)", fontSize: 16 }}>{isExpanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="phase-body">
          <div style={{ fontSize: 12, color: "var(--accent-green)", fontWeight: 600, marginBottom: 10 }}>
            🎯 Goal: {phase.goal}
          </div>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Topics to Master</div>
              <ul className="phase-topics">
                {phase.topics.map((t, i) => (
                  <li key={i}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{t.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Daily Task</div>
              <div style={{ background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 8, padding: 12, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
                📋 {phase.dailyTask}
              </div>

              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>PLATFORM</div>
              <div style={{ fontSize: 12, color: "var(--accent-blue)", marginBottom: 12 }}>🖥 {phase.platform}</div>

              <div style={{ background: "rgba(244,67,54,0.05)", border: "1px solid rgba(244,67,54,0.15)", borderRadius: 8, padding: 10, fontSize: 11, color: "var(--accent-red)" }}>
                ⛔ {phase.doNot}
              </div>
            </div>
          </div>

          {/* Quiz questions */}
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Self-Check Questions</div>
            {phase.quiz.map((q, i) => (
              <div key={i} style={{ background: "var(--bg-primary)", borderRadius: 6, padding: "8px 12px", marginBottom: 6, fontSize: 12, color: "var(--text-secondary)", borderLeft: `2px solid ${phase.color}` }}>
                Q{i+1}: {q}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={() => onComplete(phase.phase)}
              style={{ opacity: isCompleted ? 0.6 : 1 }}
            >
              {isCompleted ? "✓ Completed" : "Mark as Complete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StrategyCard({ strategy, onSelect }) {
  const levelColors = {
    "Beginner": "var(--accent-green)",
    "Intermediate": "var(--accent-orange)",
    "Advanced": "var(--accent-purple)",
    "Expert": "var(--accent-red)"
  };

  return (
    <div className="card" style={{ borderTopColor: strategy.color, borderTopWidth: 3, cursor: "pointer" }} onClick={() => onSelect(strategy)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: strategy.color }}>{strategy.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Phase {strategy.levelNum} • {strategy.timeframes}</div>
        </div>
        <span className="badge" style={{ background: `rgba(${hexToRgb(levelColors[strategy.level])},0.1)`, color: levelColors[strategy.level], border: `1px solid ${levelColors[strategy.level]}30` }}>
          {strategy.level}
        </span>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>{strategy.summary}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent-green)" }}>R:R {strategy.rr}</span>
        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>•</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{strategy.killzone}</span>
        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>•</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{strategy.frequency}</span>
      </div>
    </div>
  );
}

function StrategyModal({ strategy, onClose }) {
  if (!strategy) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--bg-card)", border: `1px solid ${strategy.color}`, borderRadius: 16, padding: 24, maxWidth: 700, width: "100%", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: strategy.color }}>{strategy.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{strategy.level} • {strategy.rr} R:R • {strategy.winRate}</div>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>✕ Close</button>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>{strategy.description}</p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>📋 EXECUTION STEPS</div>
          {strategy.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
              <span style={{ color: strategy.color, fontWeight: 700, minWidth: 20 }}>{i+1}.</span>
              <span style={{ color: "var(--text-secondary)" }}>{step}</span>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>BEST PAIRS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {strategy.bestPairs.map(p => <span key={p} className="badge badge-blue">{p}</span>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>PREREQUISITES</div>
            {strategy.prerequisites.map((p, i) => (
              <div key={i} style={{ fontSize: 11, color: "var(--text-secondary)", padding: "2px 0" }}>→ {p}</div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12, background: "rgba(244,67,54,0.06)", border: "1px solid rgba(244,67,54,0.2)", borderRadius: 8, padding: 12, fontSize: 12, color: "var(--accent-red)" }}>
          ⛔ AVOID: {strategy.avoid}
        </div>
      </div>
    </div>
  );
}

export default function LearningPath() {
  const [expanded, setExpanded] = useState(1);
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem("completed_phases") || "[]"); }
    catch { return []; }
  });
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [view, setView] = useState("path");

  const togglePhase = (id) => setExpanded(prev => prev === id ? null : id);

  const markComplete = (phase) => {
    const updated = completed.includes(phase) ? completed.filter(p => p !== phase) : [...completed, phase];
    setCompleted(updated);
    try { localStorage.setItem("completed_phases", JSON.stringify(updated)); } catch {}
  };

  const progressPct = (completed.length / LEARNING_PATH.length) * 100;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🎓 Learning Path</h1>
        <p className="page-subtitle">Beginner → Professional Trader — Step by step, like a mentor. No shortcuts.</p>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700 }}>Your Progress</div>
          <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-green)", fontSize: 14 }}>
            {completed.length}/{LEARNING_PATH.length} phases complete
          </div>
        </div>
        <div style={{ background: "var(--bg-primary)", borderRadius: 6, height: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--accent-green)", borderRadius: 6, transition: "width 0.4s" }} />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
          {completed.length === 0 && "Start from Phase 1. Do not skip phases. Each phase builds on the last."}
          {completed.length > 0 && completed.length < 8 && `Great progress! Next: Phase ${Math.max(...completed) + 1}. Keep going.`}
          {completed.length === 8 && "🎉 All phases complete. You are ready for real money trading with strict risk rules."}
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab ${view === "path" ? "active" : ""}`} onClick={() => setView("path")}>📚 Learning Path</button>
        <button className={`tab ${view === "strategies" ? "active" : ""}`} onClick={() => setView("strategies")}>🧠 Strategies</button>
        <button className={`tab ${view === "roadmap" ? "active" : ""}`} onClick={() => setView("roadmap")}>🗺 Roadmap</button>
      </div>

      {view === "path" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {LEARNING_PATH.map(phase => (
            <PhaseCard
              key={phase.phase}
              phase={phase}
              isExpanded={expanded === phase.phase}
              onToggle={() => togglePhase(phase.phase)}
              isCompleted={completed.includes(phase.phase)}
              onComplete={markComplete}
            />
          ))}
        </div>
      )}

      {view === "strategies" && (
        <div>
          <div style={{ background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "var(--text-secondary)" }}>
            💡 <strong style={{ color: "var(--accent-green)" }}>Learn in order.</strong> Master Strategy 1 completely before moving to Strategy 2. Each builds on the previous. Click any strategy for full details.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {STRATEGIES.map(s => (
              <StrategyCard key={s.id} strategy={s} onSelect={setSelectedStrategy} />
            ))}
          </div>
        </div>
      )}

      {view === "roadmap" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, marginBottom: 14, color: "var(--accent-green)" }}>
              🗺 Realistic Trading Roadmap — 6 Months to Profitability
            </div>
            {[
              { period: "Month 1", title: "Market Structure Only", color: "#00d4aa", tasks: ["Trade EURUSD demo only", "Mark HH/HL/LH/LL every day", "Identify every BOS and CHoCH", "Draw S&R zones — zones not lines", "DO NOT place any trades yet"] },
              { period: "Month 2", title: "Add S&R + Order Blocks", color: "#4fc3f7", tasks: ["Continue EURUSD only", "Add Fibonacci Golden Zone", "Find and mark OBs daily", "Paper trade OB+CHoCH during London Open", "Journal every trade — even paper trades"] },
              { period: "Month 3", title: "Sessions + CRT + SMC", color: "#f7931a", tasks: ["Watch London Open live every day at 1:30PM IST", "Add CRT + Liquidity Sweep strategy", "Learn FVG and Breaker Blocks", "Add GBPUSD to watch list", "Still demo/paper trading only"] },
              { period: "Month 4", title: "Full System + All Strategies", color: "#ab47bc", tasks: ["Weekly top-down analysis every Sunday", "Add ICT Breaker+FVG strategy", "Begin watching BTC for crypto structure", "Full 9-condition checklist on every setup", "Target: 70%+ simulated accuracy"] },
              { period: "Month 5", title: "Nano Real Money ($0.001 lots)", color: "#ff6b35", tasks: ["Open real account — $240 minimum", "Trade at NANO size only ($0.001 lot) first 30 days", "Real money psychology is different from demo", "Maximum loss this month: $20", "If consistently profitable → move to micro lots"] },
              { period: "Month 6+", title: "Micro Lots + Full System", color: "#ffd700", tasks: ["Move to 0.01 micro lots", "Apply all 5 strategies", "Add second pair (GBPUSD)", "Scale only after 2 profitable months in a row", "Never risk more than 1.5% per trade"] },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                <div style={{ minWidth: 90, textAlign: "center" }}>
                  <div style={{ background: m.color, color: "#000", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{m.period}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Phase {i+1}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.color, marginBottom: 8 }}>{m.title}</div>
                  {m.tasks.map((t, j) => (
                    <div key={j} style={{ fontSize: 12, color: "var(--text-secondary)", padding: "3px 0", display: "flex", gap: 8 }}>
                      <span style={{ color: m.color }}>→</span> {t}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StrategyModal strategy={selectedStrategy} onClose={() => setSelectedStrategy(null)} />
    </div>
  );
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith("#")) return "0,212,170";
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "0,212,170";
}
