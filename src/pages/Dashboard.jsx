import React, { useState } from "react";
import { usePrices, useSessionStatus } from "../hooks/usePrices";
import { FOREX_PAIRS, CRYPTO_PAIRS, INDIAN_MARKETS } from "../data/markets";

function PriceCard({ item, prices, onClick, type }) {
  const key = item.binanceSymbol || item.id;
  const p = prices[key] || prices[item.id] || {};

  return (
    <div
      className="pair-card"
      style={{ "--pair-color": item.color, borderTopColor: item.color, cursor: "pointer" }}
      onClick={() => onClick(item)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 16 }}>{item.flags || item.icon}</span>
            <span className="pair-name" style={{ color: item.color }}>{item.name}</span>
          </div>
          <div className="pair-nickname">{item.nickname}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className={`badge ${item.volatility === "VERY HIGH" || item.volatility === "EXTREME" ? "badge-red" : item.volatility === "HIGH" ? "badge-orange" : "badge-blue"}`}>
            {item.volatility}
          </span>
          {item.beginner && (
            <div style={{ marginTop: 4 }}>
              <span className="badge badge-green">BEGINNER</span>
            </div>
          )}
          {item.isLeader && (
            <div style={{ marginTop: 4 }}>
              <span className="badge badge-gold">LEADER</span>
            </div>
          )}
          {item.avoid && (
            <div style={{ marginTop: 4 }}>
              <span className="badge badge-red">⚠️ ADVANCED</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div className="price-tag">
            {p.price ? p.price : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading...</span>}
          </div>
          {p.change && (
            <div className={`price-change ${parseFloat(p.change) >= 0 ? "up" : "down"}`}>
              {parseFloat(p.change) >= 0 ? "▲" : "▼"} {Math.abs(parseFloat(p.change))}%
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {type === "forex" ? `Spread: ${item.spread}` : `Target: ${item.minTarget}${item.maxTarget !== item.minTarget ? `–${item.maxTarget}` : ""} ${type === "indian" ? "pts" : "pips"}`}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
            {type === "forex" ? item.session : item.bestTime || item.session || ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function KillZoneBar({ session }) {
  const zones = [
    { key: "asian", label: "Asian", time: "5:30AM–2:30PM IST", color: "#4fc3f7" },
    { key: "london_open", label: "London Open KZ ⭐", time: "1:30–3:30PM IST", color: "#00d4aa" },
    { key: "london_full", label: "London Full", time: "1:30–10:30PM IST", color: "#26a69a" },
    { key: "ny_open", label: "NY Open KZ ⭐", time: "6:30–8:30PM IST", color: "#f7931a" },
    { key: "overlap", label: "Overlap 🔥", time: "6:30–10:30PM IST", color: "#ffd700" },
  ];

  return (
    <div className="kill-zone-timer">
      <div style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, marginBottom: 10, color: "var(--text-primary)" }}>
        ⏰ SESSION STATUS — IST
      </div>
      {zones.map(z => (
        <div key={z.key} className="kill-zone-row">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: session[z.key]?.active ? z.color : "var(--text-muted)", boxShadow: session[z.key]?.active ? `0 0 8px ${z.color}` : "none" }} />
            <span className="kill-zone-name">{z.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>{z.time}</span>
            <span className="kill-zone-status" style={{
              background: session[z.key]?.active ? `rgba(${z.color === "#00d4aa" ? "0,212,170" : "247,147,26"},0.12)` : "rgba(122,144,168,0.08)",
              color: session[z.key]?.active ? z.color : "var(--text-muted)"
            }}>
              {session[z.key]?.active ? "ACTIVE" : "CLOSED"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const prices = usePrices();
  const session = useSessionStatus();
  const [tab, setTab] = useState("forex");

  const handlePairClick = (item) => {
    onNavigate("markets", item);
  };

  const allPairs = { forex: FOREX_PAIRS, crypto: CRYPTO_PAIRS, indian: INDIAN_MARKETS };
  const currentPairs = allPairs[tab];

  return (
    <div className="page">
      {/* Alert banner */}
      {session.ist_active && (
        <div style={{
          background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.3)",
          borderRadius: 8, padding: "10px 16px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 10
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-green)", boxShadow: "0 0 10px var(--accent-green)", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--accent-green)" }}>
            {session.ist_london_kz ? "🎯 LONDON KILL ZONE ACTIVE — 1:30–3:30PM IST — HIGH PROBABILITY WINDOW" : "🎯 NY KILL ZONE ACTIVE — 6:30–8:30PM IST — HIGH PROBABILITY WINDOW"}
          </span>
          <button className="btn btn-primary" style={{ marginLeft: "auto", padding: "4px 12px", fontSize: 11 }} onClick={() => onNavigate("signals")}>
            Check Signal →
          </button>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">📊 Trading Dashboard</h1>
        <p className="page-subtitle">Live market overview — Forex | Crypto | Indian Markets</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div className="stat-box">
            <div className="stat-value" style={{ color: "var(--accent-green)", fontSize: 18 }}>15</div>
            <div className="stat-label">Total Pairs</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: "var(--accent-orange)", fontSize: 18 }}>5</div>
            <div className="stat-label">Strategies</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: "var(--accent-blue)", fontSize: 18 }}>9</div>
            <div className="stat-label">Conditions</div>
          </div>
        </div>

        {/* Kill zone timer */}
        <KillZoneBar session={session} />
      </div>

      {/* Market tabs */}
      <div style={{ marginBottom: 16 }}>
        <div className="tabs" style={{ display: "inline-flex" }}>
          <button className={`tab ${tab === "forex" ? "active" : ""}`} onClick={() => setTab("forex")}>💱 Forex (7)</button>
          <button className={`tab ${tab === "crypto" ? "active" : ""}`} onClick={() => setTab("crypto")}>🪙 Crypto (5)</button>
          <button className={`tab ${tab === "indian" ? "active" : ""}`} onClick={() => setTab("indian")}>🇮🇳 Indian (3)</button>
        </div>
      </div>

      {/* Market section header */}
      {tab === "forex" && (
        <div style={{ background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "var(--text-secondary)" }}>
          💡 <strong style={{ color: "var(--accent-green)" }}>Beginner:</strong> Start with EURUSD or GBPUSD only. Pairs marked ⚠️ ADVANCED require $500+ account. Pip target: 300–600 pips per trade setup.
        </div>
      )}
      {tab === "crypto" && (
        <div style={{ background: "rgba(247,147,26,0.05)", border: "1px solid rgba(247,147,26,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "var(--text-secondary)" }}>
          💡 <strong style={{ color: "var(--accent-orange)" }}>Rule:</strong> Always check BTC structure FIRST before trading ETH, SOL, XRP, or BNB. BTC leads crypto 80–90% of the time.
        </div>
      )}
      {tab === "indian" && (
        <div style={{ background: "rgba(255,107,53,0.05)", border: "1px solid rgba(255,107,53,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "var(--text-secondary)" }}>
          💡 <strong style={{ color: "var(--accent-orange)" }}>Timing:</strong> Best kill zones: 9:15–11:15AM IST (market open) + 1:30–3:30PM IST. Point targets: 200–800 points per setup.
        </div>
      )}

      <div className="grid-auto">
        {currentPairs.map(item => (
          <PriceCard key={item.id} item={item} prices={prices} onClick={handlePairClick} type={tab} />
        ))}
      </div>

      {/* Bottom info row */}
      <div className="grid-3" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-title">⚡ Entry Conditions</div>
          <div style={{ marginTop: 10 }}>
            {["HTF Trend Confirmed","Price in Discount/Premium","Fresh Order Block","Golden Zone + OB","Liquidity Sweep","CHoCH on 15min","Kill Zone Active","FVG Aligned","1.5% Risk + 1:3 RR"].map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", borderBottom: "1px solid var(--border)", fontSize: 11 }}>
                <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>{i+1}.</span>
                <span style={{ color: "var(--text-secondary)" }}>{c}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: "var(--accent-red)", fontFamily: "var(--font-mono)" }}>
              IF 1 MISSING → NO TRADE
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">📏 Pip Targets</div>
          <div style={{ marginTop: 10 }}>
            {[
              { name: "BTC/USD", target: "800 pips", color: "#f7931a" },
              { name: "ETH/USD", target: "50–60 pips", color: "#627eea" },
              { name: "SOL, XRP, BNB", target: "400–800 pips", color: "#9945ff" },
              { name: "All Forex Pairs", target: "300–600 pips", color: "#00d4aa" },
              { name: "NIFTY 50", target: "200–800 pts", color: "#ff6b35" },
              { name: "SENSEX", target: "200–800 pts", color: "#e91e63" },
              { name: "BANK NIFTY", target: "200–800 pts", color: "#00bcd4" },
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                <span style={{ color: t.color, fontWeight: 600 }}>{t.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{t.target}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">📅 Session Guide (IST)</div>
          <div style={{ marginTop: 10 }}>
            {[
              { name: "Asian Session", time: "5:30AM–2:30PM", note: "Mark range only", color: "#4fc3f7" },
              { name: "⭐ London KZ", time: "1:30–3:30PM", note: "HIGHEST PROB", color: "#00d4aa" },
              { name: "London Full", time: "1:30–10:30PM", note: "All 7 pairs", color: "#26a69a" },
              { name: "⭐ NY Open KZ", time: "6:30–8:30PM", note: "2nd highest", color: "#f7931a" },
              { name: "🔥 Overlap", time: "6:30–10:30PM", note: "Best 4 hours", color: "#ffd700" },
              { name: "India Open", time: "9:15–11:15AM", note: "NIFTY/SENSEX", color: "#ff6b35" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.note}</div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-secondary)" }}>{s.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
