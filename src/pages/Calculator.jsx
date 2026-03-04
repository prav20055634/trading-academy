// Calculator.jsx
import React, { useState } from "react";
import { FOREX_PAIRS, CRYPTO_PAIRS, INDIAN_MARKETS } from "../data/markets";

const ALL_PAIRS = [...FOREX_PAIRS, ...CRYPTO_PAIRS, ...INDIAN_MARKETS];

export function Calculator() {
  const [account, setAccount] = useState("240");
  const [risk, setRisk] = useState("1.5");
  const [slPips, setSlPips] = useState("40");
  const [pairId, setPairId] = useState("EURUSD");
  const [rr, setRr] = useState("3");

  const pair = ALL_PAIRS.find(p => p.id === pairId);
  const riskAmt = parseFloat(account) * parseFloat(risk) / 100;
  const pipVal = pair?.pipValue || 0.10;
  const lots = Math.max(0.001, riskAmt / (parseFloat(slPips) * pipVal * 100));
  const tp1Pips = parseFloat(slPips) * parseFloat(rr);
  const tp2Pips = parseFloat(slPips) * 5;
  const potentialWin = riskAmt * parseFloat(rr);
  const potentialWin2 = riskAmt * 5;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🧮 Position Size Calculator</h1>
        <p className="page-subtitle">Calculate exact lot size to never risk more than your defined percentage.</p>
      </div>
      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Input Parameters</div>
          {[
            { label: "Account Size ($)", val: account, set: setAccount, placeholder: "240" },
            { label: "Risk % (1.5 recommended)", val: risk, set: setRisk, placeholder: "1.5" },
            { label: "Stop Loss (pips)", val: slPips, set: setSlPips, placeholder: "40" },
            { label: "Target R:R (minimum 3)", val: rr, set: setRr, placeholder: "3" },
          ].map((f, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>{f.label}</label>
              <input className="input" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>PAIR</label>
            <select className="select" style={{ width: "100%" }} value={pairId} onChange={e => setPairId(e.target.value)}>
              {ALL_PAIRS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-title" style={{ marginBottom: 16, color: "var(--accent-green)" }}>Results</div>
            {[
              { label: "Risk Amount", value: `$${riskAmt.toFixed(2)}`, color: "var(--accent-orange)", size: 28 },
              { label: "Position Size", value: `${Math.min(lots, 0.10).toFixed(3)} lots`, color: "var(--accent-blue)", size: 28 },
              { label: "Max Lots ($240 acct)", value: "0.01 micro lot", color: "var(--accent-green)", size: 18 },
              { label: "TP1 Pips (1:" + rr + ")", value: `${tp1Pips.toFixed(0)} pips`, color: "var(--accent-green)", size: 18 },
              { label: "TP1 Profit", value: `+$${potentialWin.toFixed(2)}`, color: "var(--accent-green)", size: 18 },
              { label: "TP2 Pips (1:5)", value: `${tp2Pips.toFixed(0)} pips`, color: "var(--accent-gold)", size: 18 },
              { label: "TP2 Profit", value: `+$${potentialWin2.toFixed(2)}`, color: "var(--accent-gold)", size: 18 },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: r.size, fontWeight: 700, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: "rgba(0,212,170,0.04)", borderColor: "rgba(0,212,170,0.2)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-green)", marginBottom: 10 }}>📏 Target Reference Guide</div>
            {[
              { pair: "BTC/USD", target: "800 pips", color: "#f7931a" },
              { pair: "ETH/USD", target: "50–60 pips", color: "#627eea" },
              { pair: "SOL / XRP / BNB", target: "400–800 pips", color: "#9945ff" },
              { pair: "All Forex Pairs", target: "300–600 pips", color: "#00d4aa" },
              { pair: "NIFTY / SENSEX / BANKNIFTY", target: "200–800 points", color: "#ff6b35" },
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                <span style={{ color: t.color }}>{t.pair}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{t.target}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
