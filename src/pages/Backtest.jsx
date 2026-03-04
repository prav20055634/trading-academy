import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const SAMPLE_RESULTS = Array.from({ length: 30 }, (_, i) => {
  const win = Math.random() > 0.4;
  return {
    trade: i + 1, win,
    rr: win ? (Math.random() * 3 + 2).toFixed(2) : 0,
    strategy: ["OB+CHoCH", "CRT+Sweep", "Breaker+FVG"][Math.floor(Math.random() * 3)],
    pair: ["EURUSD", "GBPUSD", "BTCUSD"][Math.floor(Math.random() * 3)],
    session: Math.random() > 0.5 ? "London KZ" : "NY KZ",
  };
});

export default function Backtest() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [account, setAccount] = useState("240");
  const [risk, setRisk] = useState("1.5");
  const [trades, setTrades] = useState("30");

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      let bal = parseFloat(account);
      const riskPct = parseFloat(risk) / 100;
      const res = SAMPLE_RESULTS.slice(0, parseInt(trades)).map((t, i) => {
        const riskAmt = bal * riskPct;
        const pnl = t.win ? riskAmt * parseFloat(t.rr) : -riskAmt;
        bal = Math.max(0, bal + pnl);
        return { ...t, balance: parseFloat(bal.toFixed(2)), pnl: parseFloat(pnl.toFixed(2)) };
      });
      setResults(res);
      setRunning(false);
    }, 800);
  };

  const wins = results.filter(r => r.win).length;
  const losses = results.filter(r => !r.win).length;
  const finalBal = results.length > 0 ? results[results.length - 1].balance : parseFloat(account);
  const totalPnL = finalBal - parseFloat(account);
  const winRate = results.length > 0 ? ((wins / results.length) * 100).toFixed(1) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🔬 Strategy Backtester</h1>
        <p className="page-subtitle">Simulate SMC strategy performance. For real backtesting, use TradingView Strategy Tester.</p>
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: "start" }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>⚙️ Parameters</div>
            {[
              { label: "Starting Account ($)", val: account, set: setAccount },
              { label: "Risk per Trade (%)", val: risk, set: setRisk },
              { label: "Number of Trades", val: trades, set: setTrades },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>{f.label}</label>
                <input className="input" value={f.val} onChange={e => f.set(e.target.value)} />
              </div>
            ))}
            <button className="btn btn-primary" onClick={run} disabled={running} style={{ width: "100%" }}>
              {running ? "⏳ Running..." : "▶ Run Simulation"}
            </button>
          </div>

          <div className="card" style={{ background: "rgba(0,212,170,0.04)", borderColor: "rgba(0,212,170,0.15)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-green)", marginBottom: 10 }}>📚 How to Properly Backtest</div>
            {[
              "Open TradingView — go to any chart",
              "Set to 4H timeframe, scroll back 6 months",
              "Apply the 9-condition checklist to each potential setup",
              "Record: would this have been a valid trade?",
              "Mark entry, SL, TP on the chart",
              "Forward scroll to see result — did it hit TP or SL?",
              "Log in the Portfolio section as a demo trade",
              "Complete minimum 50 backtests before demo trading",
              "Target: 55%+ win rate with 1:3+ R:R in backtest",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>{i+1}.</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        <div>
          {results.length > 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Final Balance", value: `$${finalBal.toFixed(2)}`, color: totalPnL >= 0 ? "var(--accent-green)" : "var(--accent-red)" },
                  { label: "Total P&L", value: `${totalPnL >= 0 ? "+" : ""}$${totalPnL.toFixed(2)}`, color: totalPnL >= 0 ? "var(--accent-green)" : "var(--accent-red)" },
                  { label: "Win Rate", value: `${winRate}%`, color: parseFloat(winRate) >= 50 ? "var(--accent-green)" : "var(--accent-orange)" },
                ].map((s, i) => (
                  <div key={i} className="stat-box">
                    <div className="stat-value" style={{ color: s.color, fontSize: 20 }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-title" style={{ marginBottom: 12 }}>Simulated Equity Curve</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={results}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="trade" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }} formatter={(v) => [`$${v}`, "Balance"]} />
                    <Line type="monotone" dataKey="balance" stroke="var(--accent-green)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom: 10 }}>Trade Log (last 10)</div>
                {results.slice(-10).reverse().map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 11, alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", minWidth: 30 }}>#{t.trade}</span>
                    <span style={{ color: "var(--accent-blue)" }}>{t.pair}</span>
                    <span style={{ color: "var(--text-muted)" }}>{t.strategy}</span>
                    <span style={{ color: "var(--text-muted)" }}>{t.session}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", color: t.win ? "var(--accent-green)" : "var(--accent-red)", fontWeight: 700 }}>
                      {t.win ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}
                    </span>
                    {t.win && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>1:{t.rr}</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {results.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🔬</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Run a simulation to see results</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>For real backtesting, use TradingView's Strategy Tester with your charts.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
