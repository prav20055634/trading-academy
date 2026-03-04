import React from "react";

const NAV = [
  { section: "TRADING" },
  { id: "home", label: "Dashboard", icon: "⚡" },
  { id: "markets", label: "Markets & Charts", icon: "📈" },
  { id: "signals", label: "Signal Checker", icon: "🎯" },
  { id: "news", label: "Live News", icon: "📰" },
  { section: "ANALYSIS" },
  { id: "backtest", label: "Backtester", icon: "🔬" },
  { id: "portfolio", label: "Portfolio", icon: "💼" },
  { id: "calculator", label: "Position Calc", icon: "🧮" },
  { section: "EDUCATION" },
  { id: "learning", label: "Learning Path", icon: "🎓" },
  { id: "strategies", label: "Strategies", icon: "🧠" },
  { id: "rules", label: "Trading Rules", icon: "📋" },
];

export default function Sidebar({ active, onNav }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>TRADING<br />ACADEMY PRO</h1>
        <p>SMC • FOREX • CRYPTO • INDIA</p>
      </div>

      {NAV.map((item, i) => {
        if (item.section) {
          return <div key={i} className="sidebar-section-title">{item.section}</div>;
        }
        return (
          <button
            key={item.id}
            className={`sidebar-item ${active === item.id ? "active" : ""}`}
            onClick={() => onNav(item.id)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        );
      })}

      <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1.8 }}>
          <div>⚠️ NOT FINANCIAL ADVICE</div>
          <div>Education only. Trade at your own risk.</div>
          <div style={{ marginTop: 6, color: "var(--accent-green)" }}>v1.0 — Free Forever</div>
        </div>
      </div>
    </div>
  );
}
