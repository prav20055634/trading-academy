import React, { useState } from "react";
import { usePortfolio } from "../hooks/usePortfolio";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FOREX_PAIRS, CRYPTO_PAIRS, INDIAN_MARKETS, STRATEGIES } from "../data/markets";

const ALL_PAIRS = [...FOREX_PAIRS, ...CRYPTO_PAIRS, ...INDIAN_MARKETS];

const defaultForm = {
  pair: "EURUSD", direction: "BUY", strategy: "OB + CHoCH",
  entryPrice: "", stopLoss: "", takeProfit: "",
  lotSize: "0.01", riskAmount: "3.60", session: "London", notes: ""
};

export default function Portfolio() {
  const { trades, stats, addTrade, closeTrade, deleteTrade, updateAccountSize, portfolio } = usePortfolio();
  const [view, setView] = useState("overview");
  const [form, setForm] = useState(defaultForm);
  const [exitPrice, setExitPrice] = useState({});
  const [accountInput, setAccountInput] = useState(portfolio.accountSize.toString());

  const handleAdd = () => {
    if (!form.entryPrice || !form.stopLoss || !form.takeProfit) {
      alert("Please fill Entry, Stop Loss, and Take Profit");
      return;
    }
    addTrade(form);
    setForm(defaultForm);
    setView("trades");
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">💼 Portfolio Tracker</h1>
        <p className="page-subtitle">Log every trade. Review ruthlessly. Improve continuously.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Balance", value: `$${stats.currentBalance}`, color: parseFloat(stats.totalPnL) >= 0 ? "var(--accent-green)" : "var(--accent-red)" },
          { label: "Total P&L", value: `${parseFloat(stats.totalPnL) >= 0 ? "+" : ""}$${stats.totalPnL}`, color: parseFloat(stats.totalPnL) >= 0 ? "var(--accent-green)" : "var(--accent-red)" },
          { label: "Win Rate", value: `${stats.winRate}%`, color: parseFloat(stats.winRate) >= 50 ? "var(--accent-green)" : "var(--accent-orange)" },
          { label: "Avg R:R", value: `1:${stats.avgRR}`, color: "var(--accent-blue)" },
          { label: "Profit Factor", value: stats.profitFactor, color: "var(--accent-gold)" },
          { label: "Best Pair", value: stats.bestPair, color: "var(--accent-purple)" },
        ].map((s, i) => (
          <div key={i} className="stat-box">
            <div className="stat-value" style={{ color: s.color, fontSize: 18 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${view === "overview" ? "active" : ""}`} onClick={() => setView("overview")}>📊 Overview</button>
        <button className={`tab ${view === "add" ? "active" : ""}`} onClick={() => setView("add")}>➕ Add Trade</button>
        <button className={`tab ${view === "trades" ? "active" : ""}`} onClick={() => setView("trades")}>📋 Trade History</button>
        <button className={`tab ${view === "settings" ? "active" : ""}`} onClick={() => setView("settings")}>⚙️ Settings</button>
      </div>

      {view === "overview" && (
        <div>
          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            {/* Equity curve */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>📈 Equity Curve</div>
              {stats.equityCurve.length > 1 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={stats.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="trade" stroke="var(--text-muted)" fontSize={10} label={{ value: "Trade #", position: "insideBottom", fill: "var(--text-muted)", fontSize: 10 }} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} formatter={(v) => [`$${v}`, "Balance"]} />
                    <Line type="monotone" dataKey="balance" stroke="var(--accent-green)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  Add trades to see equity curve
                </div>
              )}
            </div>

            {/* Win/Loss breakdown */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>📊 Trade Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Wins", value: stats.wins, color: "var(--accent-green)" },
                  { label: "Losses", value: stats.losses, color: "var(--accent-red)" },
                  { label: "Open", value: stats.openTrades, color: "var(--accent-orange)" },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center", background: "var(--bg-primary)", padding: 12, borderRadius: 8 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {stats.totalTrades === 0 && (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 20 }}>
                  No closed trades yet. Add your first trade →
                </div>
              )}

              {/* Recent trades */}
              {trades.slice(0, 5).map(t => (
                <div key={t.id} className={`trade-row ${t.status.toLowerCase()}`} style={{ gridTemplateColumns: "70px 50px 90px 70px 70px 60px 1fr", marginBottom: 4, borderRadius: 6, display: "grid" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-primary)" }}>{t.pair}</span>
                  <span style={{ fontSize: 11, color: t.direction === "BUY" ? "var(--accent-green)" : "var(--accent-red)", fontWeight: 700 }}>{t.direction}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{t.strategy}</span>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{t.entryPrice}</span>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: t.status === "WIN" ? "var(--accent-green)" : t.status === "LOSS" ? "var(--accent-red)" : "var(--accent-orange)" }}>
                    {t.status === "OPEN" ? "OPEN" : t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.rr ? `1:${t.rr}` : "—"}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{t.session}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "add" && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>➕ Log New Trade</div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>PAIR</label>
              <select className="select" style={{ width: "100%" }} value={form.pair} onChange={e => setForm(p => ({...p, pair: e.target.value}))}>
                {ALL_PAIRS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>DIRECTION</label>
              <select className="select" style={{ width: "100%" }} value={form.direction} onChange={e => setForm(p => ({...p, direction: e.target.value}))}>
                <option value="BUY">📈 BUY (Long)</option>
                <option value="SELL">📉 SELL (Short)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>STRATEGY</label>
              <select className="select" style={{ width: "100%" }} value={form.strategy} onChange={e => setForm(p => ({...p, strategy: e.target.value}))}>
                {STRATEGIES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>SESSION</label>
              <select className="select" style={{ width: "100%" }} value={form.session} onChange={e => setForm(p => ({...p, session: e.target.value}))}>
                <option>London Open KZ</option>
                <option>NY Open KZ</option>
                <option>London Full</option>
                <option>NY Full</option>
                <option>India Open</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>ENTRY PRICE</label>
              <input className="input" value={form.entryPrice} onChange={e => setForm(p => ({...p, entryPrice: e.target.value}))} placeholder="e.g. 1.08420" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>STOP LOSS</label>
              <input className="input" value={form.stopLoss} onChange={e => setForm(p => ({...p, stopLoss: e.target.value}))} placeholder="e.g. 1.08020" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>TAKE PROFIT</label>
              <input className="input" value={form.takeProfit} onChange={e => setForm(p => ({...p, takeProfit: e.target.value}))} placeholder="e.g. 1.09220" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>RISK AMOUNT ($)</label>
              <input className="input" value={form.riskAmount} onChange={e => setForm(p => ({...p, riskAmount: e.target.value}))} placeholder="e.g. 3.60 (1.5% of $240)" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>NOTES (optional)</label>
            <textarea className="input" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="What confluences confirmed this trade?" style={{ resize: "vertical", minHeight: 60 }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleAdd}>Save Trade</button>
            <button className="btn btn-secondary" onClick={() => setForm(defaultForm)}>Reset</button>
          </div>
        </div>
      )}

      {view === "trades" && (
        <div>
          {trades.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40, fontSize: 14 }}>
              No trades logged yet. Add your first trade →
            </div>
          ) : (
            trades.map(t => (
              <div key={t.id} style={{
                background: "var(--bg-card)", border: `1px solid var(--border)`,
                borderLeft: `3px solid ${t.status === "WIN" ? "var(--accent-green)" : t.status === "LOSS" ? "var(--accent-red)" : "var(--accent-orange)"}`,
                borderRadius: 8, padding: "12px 14px", marginBottom: 8
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700 }}>{t.pair}</span>
                    <span className={`badge ${t.direction === "BUY" ? "badge-green" : "badge-red"}`}>{t.direction}</span>
                    <span className="badge badge-purple">{t.strategy}</span>
                    <span className="badge badge-blue">{t.session}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700,
                      color: t.status === "WIN" ? "var(--accent-green)" : t.status === "LOSS" ? "var(--accent-red)" : "var(--accent-orange)"
                    }}>
                      {t.status === "OPEN" ? "🟡 OPEN" : t.status === "WIN" ? `✅ +$${t.pnl}` : `❌ -$${Math.abs(t.pnl)}`}
                    </span>
                    {t.status === "OPEN" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input className="input" placeholder="Exit price" style={{ width: 110, padding: "4px 8px", fontSize: 11 }}
                          value={exitPrice[t.id] || ""}
                          onChange={e => setExitPrice(prev => ({...prev, [t.id]: e.target.value}))} />
                        <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={() => closeTrade(t.id, exitPrice[t.id])}>Close</button>
                      </div>
                    )}
                    <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => deleteTrade(t.id)}>✕</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
                  <span>Entry: <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{t.entryPrice}</span></span>
                  <span>SL: <span style={{ color: "var(--accent-red)", fontFamily: "var(--font-mono)" }}>{t.stopLoss}</span></span>
                  <span>TP: <span style={{ color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>{t.takeProfit}</span></span>
                  <span>Risk: <span style={{ color: "var(--accent-orange)" }}>${t.riskAmount}</span></span>
                  {t.rr && <span>R:R: <span style={{ color: "var(--accent-blue)" }}>1:{t.rr}</span></span>}
                  <span style={{ marginLeft: "auto" }}>{new Date(t.date).toLocaleDateString("en-IN")}</span>
                </div>
                {t.notes && <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-secondary)", fontStyle: "italic" }}>📝 {t.notes}</div>}
              </div>
            ))
          )}
        </div>
      )}

      {view === "settings" && (
        <div className="card" style={{ maxWidth: 400 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>⚙️ Account Settings</div>
          <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>ACCOUNT SIZE ($)</label>
          <input className="input" value={accountInput} onChange={e => setAccountInput(e.target.value)} style={{ marginBottom: 12 }} />
          <button className="btn btn-primary" onClick={() => updateAccountSize(accountInput)}>Update Account Size</button>
          <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
            <div>Current account: <strong style={{ color: "var(--text-primary)" }}>${portfolio.accountSize}</strong></div>
            <div>1.5% risk per trade: <strong style={{ color: "var(--accent-orange)" }}>${(portfolio.accountSize * 0.015).toFixed(2)}</strong></div>
            <div>2% risk per trade: <strong style={{ color: "var(--accent-red)" }}>${(portfolio.accountSize * 0.02).toFixed(2)}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
