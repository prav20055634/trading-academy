import React, { useState } from "react";
import { useNews, useEconomicCalendar } from "../hooks/useNews";

function hexToRgb(hex) {
  if (!hex || !hex.startsWith("#")) return "0,212,170";
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "0,212,170";
}

export default function News() {
  const { news, loading, lastUpdate, refetch, usingFallback } = useNews();
  const calendar = useEconomicCalendar();
  const [filter, setFilter] = useState("All");

  const tags = ["All", "Forex", "Crypto", "India"];
  const filtered = filter === "All" ? news : news.filter(n => n.tag === filter);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📰 Market News</h1>
        <p className="page-subtitle">CoinDesk • MoneyControl • LiveMint • FX Street</p>
      </div>

      {usingFallback ? (
        <div style={{ background: "rgba(247,147,26,0.08)", border: "1px solid rgba(247,147,26,0.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>📡</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-orange)" }}>Live feeds temporarily unavailable — showing curated market headlines</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Click Retry to reload live news.</div>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: "5px 12px", fontSize: 11 }} onClick={refetch}>🔄 Retry</button>
        </div>
      ) : (
        <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 8, padding: "8px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--accent-green)" }}>✅ Live news loaded — {news.length} articles</span>
          {lastUpdate && <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Updated: {lastUpdate.toLocaleTimeString("en-IN")} IST</span>}
        </div>
      )}

      <div className="grid-2" style={{ gap: 16, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="tabs">
              {tags.map(t => <button key={t} className={`tab ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)}>{t}</button>)}
            </div>
            <button className="btn btn-secondary" style={{ padding: "5px 10px", fontSize: 11 }} onClick={refetch}>{loading ? "⏳" : "🔄"} Refresh</button>
          </div>

          <div className="card" style={{ padding: "4px 16px", maxHeight: 600, overflowY: "auto" }}>
            {filtered.map((item, i) => (
              <div key={i} className="news-item">
                <div className="news-headline">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a>
                </div>
                <div className="news-source" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="badge" style={{ background: `rgba(${hexToRgb(item.color)},0.1)`, color: item.color, border: `1px solid ${item.color}30`, fontSize: 9 }}>{item.tag}</span>
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{item.date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>📌 Read Direct from Source</div>
            {[
              { name: "CoinDesk", url: "https://coindesk.com", tag: "Crypto", color: "#f7931a" },
              { name: "MoneyControl", url: "https://moneycontrol.com/news/business/markets", tag: "India", color: "#ff6b35" },
              { name: "LiveMint Markets", url: "https://livemint.com/market", tag: "India", color: "#e91e63" },
              { name: "FX Street", url: "https://fxstreet.com/news", tag: "Forex", color: "#00d4aa" },
              { name: "Forex Factory", url: "https://forexfactory.com", tag: "Forex", color: "#4fc3f7" },
              { name: "NSE India", url: "https://nseindia.com", tag: "India", color: "#ab47bc" },
            ].map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{s.name}</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>↗</span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📅 Economic Calendar</div>
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "75px 45px 65px 1fr 70px 70px", gap: 4, padding: "8px 14px", borderBottom: "1px solid var(--border)", fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              <span>TIME IST</span><span>CCY</span><span>IMPACT</span><span>EVENT</span><span>FORECAST</span><span>PREV</span>
            </div>
            {calendar.map((e, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "75px 45px 65px 1fr 70px 70px", gap: 4, padding: "10px 14px", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-primary)" }}>{e.time}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-blue)" }}>{e.currency}</span>
                <span className={`badge ${e.impact === "HIGH" ? "badge-red" : "badge-orange"}`} style={{ fontSize: 9 }}>{e.impact}</span>
                <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{e.event}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-green)" }}>{e.forecast}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{e.previous}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: "rgba(244,67,54,0.04)", borderColor: "rgba(244,67,54,0.2)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--accent-red)", marginBottom: 10 }}>⚠️ HIGH IMPACT NEWS — Rules</div>
            {["CLOSE all trades 30 minutes BEFORE any HIGH impact event","NFP — avoid EUR/USD and GBP/USD from 5:30 PM IST","RBI Policy — avoid all Indian instruments 1 hour before","FOMC — avoid all USD pairs from 11:00 PM IST","After news spike: wait for FVG to form THEN enter — never chase","If IN a trade during news — move SL to breakeven minimum"].map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", padding: "5px 0", display: "flex", gap: 8, borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--accent-red)" }}>→</span> {r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}