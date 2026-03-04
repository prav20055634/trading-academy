import React, { useState } from "react";

const NAV = [
  { section: "TRADING" },
  { id: "home",       label: "Dashboard",     icon: "⚡" },
  { id: "markets",    label: "Markets",        icon: "📈" },
  { id: "signals",    label: "Signal Checker", icon: "🎯" },
  { id: "news",       label: "Live News",      icon: "📰" },
  { section: "ANALYSIS" },
  { id: "backtest",   label: "Backtester",     icon: "🔬" },
  { id: "portfolio",  label: "Portfolio",      icon: "💼" },
  { id: "calculator", label: "Position Calc",  icon: "🧮" },
  { section: "EDUCATION" },
  { id: "learning",   label: "Learning Path",  icon: "🎓" },
  { id: "strategies", label: "Strategies",     icon: "🧠" },
  { id: "rules",      label: "Trading Rules",  icon: "📋" },
];

// Bottom nav items for mobile (most important pages)
const MOBILE_NAV = [
  { id: "home",       label: "Home",      icon: "⚡" },
  { id: "markets",    label: "Markets",   icon: "📈" },
  { id: "signals",    label: "Signals",   icon: "🎯" },
  { id: "portfolio",  label: "Portfolio", icon: "💼" },
  { id: "more",       label: "More",      icon: "☰"  },
];

// All pages shown in "More" drawer on mobile
const MORE_NAV = [
  { id: "news",       label: "Live News",     icon: "📰" },
  { id: "learning",   label: "Learning Path", icon: "🎓" },
  { id: "strategies", label: "Strategies",    icon: "🧠" },
  { id: "calculator", label: "Calculator",    icon: "🧮" },
  { id: "backtest",   label: "Backtester",    icon: "🔬" },
  { id: "rules",      label: "Rules",         icon: "📋" },
];

export default function Sidebar({ active, onNav }) {
  const [showMore, setShowMore] = useState(false);

  const handleNav = (id) => {
    setShowMore(false);
    onNav(id);
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
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

      {/* ── MOBILE BOTTOM NAV ── */}
      <div style={{
        display: "none",
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: "var(--bg-secondary)", borderTop: "1px solid var(--border)",
        padding: "6px 0 10px",
      }} className="mobile-bottom-nav">
        {MOBILE_NAV.map(item => (
          <button
            key={item.id}
            onClick={() => item.id === "more" ? setShowMore(p => !p) : handleNav(item.id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, background: "none", border: "none",
              cursor: "pointer", padding: "4px 0",
              color: active === item.id ? "var(--accent-green)" : "var(--text-muted)",
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{
              fontSize: 9, fontWeight: 600,
              color: active === item.id ? "var(--accent-green)" : "var(--text-muted)"
            }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── MOBILE MORE DRAWER ── */}
      {showMore && (
        <div style={{
          display: "none",
          position: "fixed", bottom: 60, left: 0, right: 0, zIndex: 199,
          background: "var(--bg-card)", borderTop: "1px solid var(--border)",
          padding: "12px 0",
        }} className="mobile-more-drawer">
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            gap: 4, padding: "0 12px",
          }}>
            {MORE_NAV.map(item => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 6, padding: "14px 8px", background: "var(--bg-primary)",
                  border: "1px solid var(--border)", borderRadius: 10,
                  cursor: "pointer", color: "var(--text-secondary)",
                }}
              >
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, textAlign: "center" }}>{item.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowMore(false)}
            style={{
              display: "block", margin: "12px auto 0", background: "none",
              border: "1px solid var(--border)", borderRadius: 6,
              color: "var(--text-muted)", padding: "6px 24px",
              cursor: "pointer", fontSize: 12,
            }}
          >✕ Close</button>
        </div>
      )}

      {/* overlay to close drawer */}
      {showMore && (
        <div
          onClick={() => setShowMore(false)}
          style={{ display: "none", position: "fixed", inset: 0, zIndex: 198 }}
          className="mobile-overlay"
        />
      )}
    </>
  );
}
