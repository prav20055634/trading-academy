import React, { useState } from "react";
import { ENTRY_CONDITIONS, FOREX_PAIRS, CRYPTO_PAIRS, INDIAN_MARKETS } from "../data/markets";
import { useSessionStatus } from "../hooks/usePrices";

const ALL_PAIRS = [
  ...FOREX_PAIRS.map(p => ({ ...p, market: "Forex" })),
  ...CRYPTO_PAIRS.map(p => ({ ...p, market: "Crypto" })),
  ...INDIAN_MARKETS.map(p => ({ ...p, market: "India" })),
];

function PositionCalc({ pair, accountSize, riskPct, slPips, direction }) {
  if (!pair || !accountSize || !slPips) return null;

  const riskAmount = (accountSize * riskPct / 100);
  let lots, pnlPerPip;

  if (pair.market === "Forex") {
    pnlPerPip = pair.pipValue || 0.10;
    lots = riskAmount / (slPips * pnlPerPip * 100);
    lots = Math.min(lots, 0.10).toFixed(2);
  } else if (pair.market === "Crypto") {
    pnlPerPip = 1;
    lots = (riskAmount / slPips).toFixed(4);
  } else {
    pnlPerPip = 1;
    lots = (riskAmount / slPips).toFixed(2);
  }

  const tp1 = (slPips * 2).toFixed(1);
  const tp2 = (slPips * 3).toFixed(1);
  const tp3 = (slPips * 5).toFixed(1);

  return (
    <div style={{ background: "rgba(0,212,170,0.04)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, padding: 16, marginTop: 16 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--accent-green)", marginBottom: 12 }}>
        📊 POSITION SIZE CALCULATION
      </div>
      <div className="grid-2" style={{ gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>RISK AMOUNT</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--accent-orange)" }}>
            ${riskAmount.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>POSITION SIZE</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--accent-blue)" }}>
            {pair.market === "Forex" ? `${lots} lots` : `${lots} units`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>SL ({slPips} pips)</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--accent-red)" }}>-${riskAmount.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>TP1 (1:2) / TP2 (1:3) / TP3 (1:5)</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent-green)" }}>
            {tp1}p / {tp2}p / {tp3}p
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignalChecker() {
  const session = useSessionStatus();
  const [checked, setChecked] = useState({});
  const [pair, setPair] = useState("");
  const [direction, setDirection] = useState("BUY");
  const [account, setAccount] = useState("240");
  const [risk, setRisk] = useState("1.5");
  const [slPips, setSlPips] = useState("");

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const allChecked = ENTRY_CONDITIONS.every(c => checked[c.id]);
  const checkedCount = ENTRY_CONDITIONS.filter(c => checked[c.id]).length;
  const missingCritical = ENTRY_CONDITIONS.filter(c => c.critical && !checked[c.id]);

  const selectedPair = ALL_PAIRS.find(p => p.id === pair);

  const reset = () => {
    setChecked({});
    setPair("");
    setSlPips("");
  };

  // Auto-check session condition based on current time
  const autoCheckSession = () => {
    if (session.ist_active) {
      setChecked(prev => ({ ...prev, 7: true }));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🎯 Signal Checker</h1>
        <p className="page-subtitle">All 9 conditions must be ✅ before entering any trade. If 1 is missing → NO TRADE.</p>
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: "start" }}>
        {/* LEFT: Conditions */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700 }}>
              CHECKLIST — {checkedCount}/9 conditions met
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" style={{ padding: "5px 10px", fontSize: 11 }} onClick={autoCheckSession}>
                ⏰ Auto-Time
              </button>
              <button className="btn btn-danger" style={{ padding: "5px 10px", fontSize: 11 }} onClick={reset}>
                Reset
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background: "var(--bg-primary)", borderRadius: 4, height: 6, marginBottom: 14, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              width: `${(checkedCount / 9) * 100}%`,
              background: checkedCount === 9 ? "var(--accent-green)" : checkedCount >= 6 ? "var(--accent-orange)" : "var(--accent-red)",
              transition: "all 0.3s"
            }} />
          </div>

          {ENTRY_CONDITIONS.map(cond => (
            <div
              key={cond.id}
              className={`condition-item ${checked[cond.id] ? "checked" : "unchecked"}`}
              onClick={() => toggle(cond.id)}
            >
              <div className={`condition-check ${checked[cond.id] ? "checked" : ""}`}>
                {checked[cond.id] ? "✓" : ""}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15 }}>{cond.icon}</span>
                  <div className="condition-label">
                    {cond.id}. {cond.label}
                    {cond.critical && <span style={{ marginLeft: 6, fontSize: 9, color: "var(--accent-red)", fontFamily: "var(--font-mono)" }}>REQUIRED</span>}
                  </div>
                </div>
                <div className="condition-detail">{cond.detail}</div>
              </div>
            </div>
          ))}

          {/* Signal result */}
          {checkedCount > 0 && (
            <div className={`signal-result ${allChecked ? "go" : "nogo"}`}>
              <h2>{allChecked ? "✅ TRADE SIGNAL VALID" : "❌ DO NOT ENTER"}</h2>
              {allChecked ? (
                <p style={{ color: "var(--accent-green)", marginTop: 8, fontSize: 13 }}>
                  All 9 conditions confirmed. Execute with 1.5% risk maximum. Set SL before entry.
                </p>
              ) : (
                <div style={{ marginTop: 10, textAlign: "left" }}>
                  <div style={{ fontSize: 12, color: "var(--accent-red)", fontWeight: 600, marginBottom: 6 }}>
                    Missing {missingCritical.length} required condition{missingCritical.length !== 1 ? "s" : ""}:
                  </div>
                  {missingCritical.map(c => (
                    <div key={c.id} style={{ fontSize: 12, color: "var(--text-secondary)", padding: "3px 0" }}>
                      → {c.icon} {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Trade Setup */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>⚙️ Trade Setup</div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>SELECT PAIR</label>
              <select className="select" style={{ width: "100%" }} value={pair} onChange={e => setPair(e.target.value)}>
                <option value="">-- Choose Pair --</option>
                <optgroup label="💱 Forex">
                  {FOREX_PAIRS.map(p => <option key={p.id} value={p.id}>{p.name} — {p.nickname}</option>)}
                </optgroup>
                <optgroup label="🪙 Crypto">
                  {CRYPTO_PAIRS.map(p => <option key={p.id} value={p.id}>{p.name} — {p.nickname}</option>)}
                </optgroup>
                <optgroup label="🇮🇳 Indian">
                  {INDIAN_MARKETS.map(p => <option key={p.id} value={p.id}>{p.name} — {p.nickname}</option>)}
                </optgroup>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>DIRECTION</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["BUY", "SELL"].map(d => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    style={{
                      flex: 1, padding: "8px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700,
                      border: `1px solid ${direction === d ? (d === "BUY" ? "var(--accent-green)" : "var(--accent-red)") : "var(--border)"}`,
                      background: direction === d ? (d === "BUY" ? "rgba(0,212,170,0.12)" : "rgba(244,67,54,0.12)") : "var(--bg-primary)",
                      color: direction === d ? (d === "BUY" ? "var(--accent-green)" : "var(--accent-red)") : "var(--text-secondary)"
                    }}
                  >{d === "BUY" ? "📈 BUY" : "📉 SELL"}</button>
                ))}
              </div>
            </div>

            <div className="grid-2" style={{ gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>ACCOUNT SIZE ($)</label>
                <input className="input" value={account} onChange={e => setAccount(e.target.value)} placeholder="240" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>RISK % (1.5 recommended)</label>
                <input className="input" value={risk} onChange={e => setRisk(e.target.value)} placeholder="1.5" />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>STOP LOSS (pips / points)</label>
              <input className="input" value={slPips} onChange={e => setSlPips(e.target.value)} placeholder="e.g. 40 pips for EURUSD" />
            </div>

            <PositionCalc
              pair={selectedPair}
              accountSize={parseFloat(account)}
              riskPct={parseFloat(risk)}
              slPips={parseFloat(slPips)}
              direction={direction}
            />
          </div>

          {/* Risk rules */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>🛡️ NON-NEGOTIABLE RULES</div>
            {[
              { rule: "Max 1 trade per session", warn: false },
              { rule: "After 1 loss → STOP for the day", warn: true },
              { rule: "After 2 wins → STOP for the day", warn: false },
              { rule: "NEVER widen Stop Loss", warn: true },
              { rule: "NEVER trade outside Kill Zones", warn: true },
              { rule: "If 1 condition missing → NO TRADE", warn: true },
              { rule: "Max risk: 1.5–2% per trade", warn: false },
              { rule: "Min R:R = 1:3 always", warn: false },
            ].map((r, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, alignItems: "center", padding: "6px 0",
                borderBottom: "1px solid var(--border)", fontSize: 12
              }}>
                <span style={{ color: r.warn ? "var(--accent-red)" : "var(--accent-green)" }}>
                  {r.warn ? "⚠️" : "✅"}
                </span>
                <span style={{ color: r.warn ? "var(--text-primary)" : "var(--text-secondary)" }}>{r.rule}</span>
              </div>
            ))}
          </div>

          {/* Session status */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>⏰ Current Session (IST)</div>
            <div style={{
              padding: "12px", borderRadius: 8, textAlign: "center",
              background: session.ist_active ? "rgba(0,212,170,0.06)" : "rgba(122,144,168,0.06)",
              border: `1px solid ${session.ist_active ? "rgba(0,212,170,0.2)" : "var(--border)"}`
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800,
                color: session.ist_active ? "var(--accent-green)" : "var(--text-muted)"
              }}>
                {session.ist_label || "Checking..."}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                {session.ist_active
                  ? "✅ TRADE WINDOW OPEN — Condition #7 met"
                  : "❌ Outside Kill Zones — Do NOT trade now"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
