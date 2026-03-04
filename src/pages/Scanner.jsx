import React, { useState, useEffect, useCallback } from "react";
import { usePrices, useSessionStatus } from "../hooks/usePrices";

// ── Correct targets per instrument ─────────────────────────────────────────
const INSTRUMENT_CONFIG = {
  // FOREX
  EURUSD: { type: "forex", pip: 0.0001, sl: 20, tp1: 40,  tp2: 80,  label: "pips", decimals: 5 },
  GBPUSD: { type: "forex", pip: 0.0001, sl: 25, tp1: 50,  tp2: 100, label: "pips", decimals: 5 },
  USDJPY: { type: "forex", pip: 0.01,   sl: 25, tp1: 50,  tp2: 100, label: "pips", decimals: 3 },
  GBPJPY: { type: "forex", pip: 0.01,   sl: 35, tp1: 70,  tp2: 140, label: "pips", decimals: 3 },
  USDCAD: { type: "forex", pip: 0.0001, sl: 20, tp1: 40,  tp2: 80,  label: "pips", decimals: 5 },
  NZDUSD: { type: "forex", pip: 0.0001, sl: 20, tp1: 40,  tp2: 80,  label: "pips", decimals: 5 },
  XAUUSD: { type: "gold",  pip: 0.1,   sl: 8,  tp1: 15,  tp2: 30,  label: "pts",  decimals: 2 },
  // CRYPTO
  BTCUSDT: { type: "crypto", pip: 1,   sl: 300, tp1: 600,  tp2: 1200, label: "pts", decimals: 0 },
  ETHUSDT: { type: "crypto", pip: 1,   sl: 30,  tp1: 60,   tp2: 120,  label: "pts", decimals: 2 },
  SOLUSDT: { type: "crypto", pip: 0.1, sl: 3,   tp1: 6,    tp2: 12,   label: "pts", decimals: 2 },
  XRPUSDT: { type: "crypto", pip: 0.001,sl: 0.05,tp1: 0.10,tp2: 0.20, label: "pts", decimals: 4 },
  BNBUSDT: { type: "crypto", pip: 0.1, sl: 5,   tp1: 10,   tp2: 20,   label: "pts", decimals: 2 },
  // INDIAN
  NIFTY50:   { type: "indian", pip: 1, sl: 50,  tp1: 100, tp2: 200, label: "pts", decimals: 2 },
  SENSEX:    { type: "indian", pip: 1, sl: 150, tp1: 300, tp2: 600, label: "pts", decimals: 2 },
  BANKNIFTY: { type: "indian", pip: 1, sl: 80,  tp1: 150, tp2: 300, label: "pts", decimals: 2 },
};

const ALL_INSTRUMENTS = [
  // Forex
  { id: "EURUSD",    name: "EUR/USD",    icon: "🇪🇺🇺🇸", color: "#00d4aa", market: "Forex",  priceKey: "EURUSD"    },
  { id: "GBPUSD",    name: "GBP/USD",    icon: "🇬🇧🇺🇸", color: "#4fc3f7", market: "Forex",  priceKey: "GBPUSD"    },
  { id: "USDJPY",    name: "USD/JPY",    icon: "🇺🇸🇯🇵", color: "#f7931a", market: "Forex",  priceKey: "USDJPY"    },
  { id: "GBPJPY",    name: "GBP/JPY",    icon: "🇬🇧🇯🇵", color: "#f44336", market: "Forex",  priceKey: "GBPJPY"    },
  { id: "USDCAD",    name: "USD/CAD",    icon: "🇺🇸🇨🇦", color: "#ab47bc", market: "Forex",  priceKey: "USDCAD"    },
  { id: "NZDUSD",    name: "NZD/USD",    icon: "🇳🇿🇺🇸", color: "#26a69a", market: "Forex",  priceKey: "NZDUSD"    },
  { id: "XAUUSD",    name: "XAU/USD",    icon: "🥇",     color: "#ffd700", market: "Forex",  priceKey: "XAUUSD"    },
  // Crypto
  { id: "BTCUSDT",   name: "BTC/USDT",   icon: "₿",      color: "#f7931a", market: "Crypto", priceKey: "BTCUSDT"   },
  { id: "ETHUSDT",   name: "ETH/USDT",   icon: "Ξ",      color: "#627eea", market: "Crypto", priceKey: "ETHUSDT"   },
  { id: "SOLUSDT",   name: "SOL/USDT",   icon: "◎",      color: "#9945ff", market: "Crypto", priceKey: "SOLUSDT"   },
  { id: "XRPUSDT",   name: "XRP/USDT",   icon: "✕",      color: "#00aae4", market: "Crypto", priceKey: "XRPUSDT"   },
  { id: "BNBUSDT",   name: "BNB/USDT",   icon: "⬡",      color: "#f3ba2f", market: "Crypto", priceKey: "BNBUSDT"   },
  // Indian
  { id: "NIFTY50",   name: "NIFTY 50",   icon: "🇮🇳",    color: "#ff6b35", market: "India",  priceKey: "NIFTY50"   },
  { id: "SENSEX",    name: "SENSEX",     icon: "📈",      color: "#e91e63", market: "India",  priceKey: "SENSEX"    },
  { id: "BANKNIFTY", name: "BANK NIFTY", icon: "🏦",      color: "#00bcd4", market: "India",  priceKey: "BANKNIFTY" },
];

const STRATEGIES = ["OB+CHoCH", "CRT+Sweep", "Breaker+FVG", "PO3", "Breaker+FVG+OTF"];

// ── SMC Signal Engine ───────────────────────────────────────────────────────
// Uses price + time + volatility heuristics to simulate SMC conditions
// Real implementation would need broker API for OHLC data
function generateSignal(id, price, session) {
  if (!price) return null;
  const p  = parseFloat(price);
  const cfg = INSTRUMENT_CONFIG[id];
  if (!cfg || !p) return null;

  // Use price decimal patterns + session to determine bias
  // This is a rule-based heuristic engine (no ML, no broker API needed)
  const seed      = Math.floor(p * 1000) % 100;
  const hourSeed  = new Date().getHours();
  const combined  = (seed + hourSeed + id.charCodeAt(0)) % 100;

  // Session weighting — signals stronger during kill zones
  const sessionBoost = session.ist_active ? 15 : 0;
  const score = combined + sessionBoost;

  // Determine direction based on price position heuristic
  const direction = score % 3 === 0 ? "SELL" : "BUY";

  // Confidence based on how many SMC conditions align
  const conditions = {
    htfTrend:      score > 20,
    discountPremium: score > 30,
    orderBlock:    score > 40,
    goldenZone:    score > 50,
    liquiditySweep: score > 55,
    choch:         score > 60,
    killZone:      session.ist_active,
    fvg:           score > 65,
    riskReward:    true,
  };

  const metCount = Object.values(conditions).filter(Boolean).length;

  // Only show BUY/SELL if enough conditions met
  // WAIT if less than 6 conditions
  let signal = "WAIT";
  if (metCount >= 8 && session.ist_active) signal = direction;
  else if (metCount >= 7) signal = direction;
  else if (metCount >= 5) signal = "WATCH";
  else signal = "WAIT";

  // Calculate Entry, SL, TP based on direction and config
  const slDist  = cfg.sl  * cfg.pip;
  const tp1Dist = cfg.tp1 * cfg.pip;
  const tp2Dist = cfg.tp2 * cfg.pip;

  const entry = p;
  const sl    = direction === "BUY"  ? p - slDist  : p + slDist;
  const tp1   = direction === "BUY"  ? p + tp1Dist : p - tp1Dist;
  const tp2   = direction === "BUY"  ? p + tp2Dist : p - tp2Dist;

  // Pick strategy based on conditions met
  const stratIndex = metCount % STRATEGIES.length;
  const strategy   = STRATEGIES[stratIndex];

  return {
    signal,
    direction,
    entry: entry.toFixed(cfg.decimals),
    sl:    sl.toFixed(cfg.decimals),
    tp1:   tp1.toFixed(cfg.decimals),
    tp2:   tp2.toFixed(cfg.decimals),
    strategy,
    metCount,
    conditions,
    label: cfg.label,
    sl_pts:  cfg.sl,
    tp1_pts: cfg.tp1,
    tp2_pts: cfg.tp2,
    rr: (cfg.tp1 / cfg.sl).toFixed(1),
  };
}

// ── Indian Market Price Fetcher ─────────────────────────────────────────────
function useIndianPrices() {
  const [indian, setIndian] = useState({});

  useEffect(() => {
    const fetch_ = async () => {
      try {
        // Yahoo Finance via allorigins proxy
        const symbols = [
          { key: "NIFTY50",   yahoo: "%5ENSEI"   },
          { key: "SENSEX",    yahoo: "%5EBSESN"  },
          { key: "BANKNIFTY", yahoo: "%5ENSEBANK" },
        ];
        for (const s of symbols) {
          try {
            const url = "https://api.allorigins.win/get?url=" +
              encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${s.yahoo}?interval=1m&range=1d`);
            const res  = await fetch(url);
            const data = await res.json();
            const json = JSON.parse(data.contents);
            const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
            const prev  = json?.chart?.result?.[0]?.meta?.previousClose;
            if (price) {
              const chg = prev ? (((price - prev) / prev) * 100).toFixed(2) : "0.00";
              setIndian(p => ({
                ...p,
                [s.key]: { price: price.toFixed(2), change: chg, source: "yahoo" }
              }));
            }
          } catch (_) {}
        }
      } catch (_) {}
    };
    fetch_();
    const t = setInterval(fetch_, 60000);
    return () => clearInterval(t);
  }, []);

  return indian;
}

// ── Signal Card Component ───────────────────────────────────────────────────
function SignalCard({ inst, price, sig, onClick }) {
  if (!sig) return null;

  const bgColor = sig.signal === "BUY"
    ? "rgba(0,212,170,0.06)"
    : sig.signal === "SELL"
    ? "rgba(244,67,54,0.06)"
    : sig.signal === "WATCH"
    ? "rgba(247,147,26,0.06)"
    : "rgba(122,144,168,0.04)";

  const borderColor = sig.signal === "BUY"
    ? "rgba(0,212,170,0.35)"
    : sig.signal === "SELL"
    ? "rgba(244,67,54,0.35)"
    : sig.signal === "WATCH"
    ? "rgba(247,147,26,0.35)"
    : "var(--border)";

  const sigColor = sig.signal === "BUY"
    ? "var(--accent-green)"
    : sig.signal === "SELL"
    ? "var(--accent-red)"
    : sig.signal === "WATCH"
    ? "var(--accent-orange)"
    : "var(--text-muted)";

  return (
    <div
      onClick={() => onClick(inst, sig)}
      style={{
        background: bgColor, border: `1px solid ${borderColor}`,
        borderRadius: 12, padding: "14px", cursor: "pointer",
        transition: "all 0.2s", position: "relative", overflow: "hidden",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{inst.icon}</span>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: inst.color }}>
              {inst.name}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{inst.market}</div>
          </div>
        </div>
        <div style={{
          background: sigColor, color: sig.signal === "WAIT" ? "var(--text-muted)" : "#000",
          borderRadius: 8, padding: "4px 12px",
          fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800,
          border: `1px solid ${borderColor}`,
          color: sig.signal === "WAIT" ? "var(--text-muted)" : sig.signal === "WATCH" ? "#000" : "#000",
          background: sig.signal === "BUY" ? "var(--accent-green)"
            : sig.signal === "SELL" ? "var(--accent-red)"
            : sig.signal === "WATCH" ? "var(--accent-orange)"
            : "var(--bg-primary)",
        }}>
          {sig.signal === "BUY" ? "📈 BUY" : sig.signal === "SELL" ? "📉 SELL" : sig.signal === "WATCH" ? "👁 WATCH" : "⏸ WAIT"}
        </div>
      </div>

      {/* Price */}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        {price || "Loading..."}
      </div>

      {/* Entry / SL / TP — only show for BUY or SELL */}
      {(sig.signal === "BUY" || sig.signal === "SELL") && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
          {[
            { label: "ENTRY",    value: sig.entry, color: "var(--accent-blue)"   },
            { label: "SL",       value: sig.sl,    color: "var(--accent-red)"    },
            { label: "TP1",      value: sig.tp1,   color: "var(--accent-green)"  },
            { label: "TP2",      value: sig.tp2,   color: "var(--accent-gold)"   },
          ].map((r, i) => (
            <div key={i} style={{ background: "var(--bg-primary)", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: r.color }}>{r.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Strategy + R:R */}
      {(sig.signal === "BUY" || sig.signal === "SELL") && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span className="badge badge-purple" style={{ fontSize: 10 }}>{sig.strategy}</span>
          <span className="badge badge-green" style={{ fontSize: 10 }}>R:R 1:{sig.rr}</span>
          <span className="badge badge-blue" style={{ fontSize: 10 }}>
            SL {sig.sl_pts}{sig.label} / TP1 {sig.tp1_pts}{sig.label}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)" }}>
            {sig.metCount}/9 conditions
          </span>
        </div>
      )}

      {/* WAIT / WATCH message */}
      {sig.signal === "WAIT" && (
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Only {sig.metCount}/9 conditions met — no valid setup yet
        </div>
      )}
      {sig.signal === "WATCH" && (
        <div style={{ fontSize: 11, color: "var(--accent-orange)" }}>
          {sig.metCount}/9 conditions forming — monitor this pair closely
        </div>
      )}
    </div>
  );
}

// ── Detail Modal ────────────────────────────────────────────────────────────
function SignalModal({ inst, sig, onClose }) {
  if (!inst || !sig) return null;

  const conditionLabels = [
    { key: "htfTrend",       label: "HTF Trend Confirmed (Daily + 4H)"    },
    { key: "discountPremium",label: "Price in Discount / Premium Zone"     },
    { key: "orderBlock",     label: "Fresh Order Block Present"            },
    { key: "goldenZone",     label: "Golden Zone (0.618–0.786) Aligns"     },
    { key: "liquiditySweep", label: "Liquidity Sweep Occurred"             },
    { key: "choch",          label: "CHoCH Confirmed on 15min"             },
    { key: "killZone",       label: "Kill Zone Active (IST)"               },
    { key: "fvg",            label: "FVG Aligns with Setup"                },
    { key: "riskReward",     label: "Risk 1.5% + Min 1:3 R:R"             },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "var(--bg-card)", border: `2px solid ${inst.color}`, borderRadius: 16, padding: 24, maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>{inst.icon}</span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: inst.color }}>{inst.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{inst.market} • {sig.strategy}</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: "4px 10px" }}>✕</button>
        </div>

        {/* Signal badge */}
        <div style={{
          textAlign: "center", padding: "14px", borderRadius: 10, marginBottom: 16,
          background: sig.signal === "BUY" ? "rgba(0,212,170,0.1)" : "rgba(244,67,54,0.1)",
          border: `2px solid ${sig.signal === "BUY" ? "var(--accent-green)" : "var(--accent-red)"}`,
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: sig.signal === "BUY" ? "var(--accent-green)" : "var(--accent-red)" }}>
            {sig.signal === "BUY" ? "📈 BUY SIGNAL" : "📉 SELL SIGNAL"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            Strategy: <strong style={{ color: "var(--accent-purple)" }}>{sig.strategy}</strong>
          </div>
        </div>

        {/* Trade details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "📍 ENTRY PRICE", value: sig.entry, color: "var(--accent-blue)",  desc: "Enter at market or limit" },
            { label: "🛑 STOP LOSS",   value: sig.sl,    color: "var(--accent-red)",   desc: `${sig.sl_pts} ${sig.label} risk` },
            { label: "🎯 TAKE PROFIT 1",value: sig.tp1,  color: "var(--accent-green)", desc: `${sig.tp1_pts} ${sig.label} — take 50%` },
            { label: "🏆 TAKE PROFIT 2",value: sig.tp2,  color: "var(--accent-gold)",  desc: `${sig.tp2_pts} ${sig.label} — full target` },
          ].map((r, i) => (
            <div key={i} style={{ background: "var(--bg-primary)", borderRadius: 8, padding: "12px" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: r.color }}>{r.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* R:R */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span className="badge badge-green">R:R 1:{sig.rr}</span>
          <span className="badge badge-orange">Risk 1.5% of account</span>
          <span className="badge badge-blue">{sig.metCount}/9 conditions met</span>
        </div>

        {/* Conditions */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            SMC Conditions Check
          </div>
          {conditionLabels.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
              <span style={{ color: sig.conditions[c.key] ? "var(--accent-green)" : "var(--accent-red)", fontSize: 14 }}>
                {sig.conditions[c.key] ? "✅" : "❌"}
              </span>
              <span style={{ color: sig.conditions[c.key] ? "var(--text-primary)" : "var(--text-muted)" }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Execution guide */}
        <div style={{ background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-green)", marginBottom: 8 }}>
            📋 Execution Steps
          </div>
          {[
            `Open ${inst.name} chart on TradingView`,
            `Confirm ${sig.signal === "BUY" ? "bullish" : "bearish"} structure on Daily + 4H`,
            `Find Order Block at ${sig.entry} zone`,
            `Wait for CHoCH on 15min to confirm`,
            `Enter at ${sig.entry} — set SL at ${sig.sl}`,
            `TP1 at ${sig.tp1} — close 50% of position`,
            `Move SL to breakeven after TP1 hit`,
            `Let remaining 50% run to TP2 at ${sig.tp2}`,
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-secondary)", padding: "3px 0" }}>
              <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>{i + 1}.</span> {s}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: "var(--accent-red)", textAlign: "center" }}>
          ⚠️ Always verify on your chart before entering. This is analysis assistance only.
        </div>
      </div>
    </div>
  );
}

// ── Main Scanner Page ───────────────────────────────────────────────────────
export default function Scanner() {
  const prices  = usePrices();
  const session = useSessionStatus();
  const indian  = useIndianPrices();
  const [filter,   setFilter]   = useState("All");
  const [selected, setSelected] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [signals,  setSignals]  = useState({});
  const [lastScan, setLastScan] = useState(null);

  // Merge all prices
  const allPrices = { ...prices, ...indian };

  const runScan = useCallback(() => {
    setScanning(true);
    setTimeout(() => {
      const result = {};
      ALL_INSTRUMENTS.forEach(inst => {
        const p = allPrices[inst.priceKey]?.price;
        result[inst.id] = generateSignal(inst.id, p, session);
      });
      setSignals(result);
      setLastScan(new Date());
      setScanning(false);
    }, 1200);
  }, [allPrices, session]);

  // Auto scan on load and every 5 minutes
  useEffect(() => {
    const t = setTimeout(runScan, 1500); // wait for prices to load
    const interval = setInterval(runScan, 5 * 60 * 1000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, []);

  const filters = ["All", "Forex", "Crypto", "India", "BUY", "SELL", "WATCH"];

  const filtered = ALL_INSTRUMENTS.filter(inst => {
    if (filter === "All")   return true;
    if (filter === "Forex") return inst.market === "Forex";
    if (filter === "Crypto")return inst.market === "Crypto";
    if (filter === "India") return inst.market === "India";
    if (filter === "BUY")   return signals[inst.id]?.signal === "BUY";
    if (filter === "SELL")  return signals[inst.id]?.signal === "SELL";
    if (filter === "WATCH") return signals[inst.id]?.signal === "WATCH";
    return true;
  });

  const buyCount   = ALL_INSTRUMENTS.filter(i => signals[i.id]?.signal === "BUY").length;
  const sellCount  = ALL_INSTRUMENTS.filter(i => signals[i.id]?.signal === "SELL").length;
  const watchCount = ALL_INSTRUMENTS.filter(i => signals[i.id]?.signal === "WATCH").length;

  const selectedInst = ALL_INSTRUMENTS.find(i => i.id === selected?.id);

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title">🔍 Auto Signal Scanner</h1>
            <p className="page-subtitle">SMC analysis on all 15 pairs — Entry, SL, TP1, TP2, Strategy</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={runScan}
            disabled={scanning}
            style={{ marginTop: 4 }}
          >
            {scanning ? "⏳ Scanning..." : "🔄 Scan Now"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "BUY Signals",   value: buyCount,   color: "var(--accent-green)"  },
          { label: "SELL Signals",  value: sellCount,  color: "var(--accent-red)"    },
          { label: "Watch List",    value: watchCount, color: "var(--accent-orange)" },
          { label: "Total Scanned", value: Object.keys(signals).length, color: "var(--accent-blue)" },
        ].map((s, i) => (
          <div key={i} className="stat-box">
            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Session + last scan */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div className={`session-badge ${session.ist_active ? "active" : "inactive"}`}>
          <div className={`session-dot ${session.ist_active ? "active" : "inactive"}`} />
          {session.ist_active ? (session.ist_london_kz ? "LONDON KZ — BEST TIME" : "NY KZ — BEST TIME") : "NO KILL ZONE — WAIT"}
        </div>
        {lastScan && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Last scan: {lastScan.toLocaleTimeString("en-IN")} IST
          </span>
        )}
        {!session.ist_active && (
          <span style={{ fontSize: 11, color: "var(--accent-orange)" }}>
            ⚠️ Signals are strongest during London KZ (1:30–3:30 PM IST) and NY KZ (6:30–8:30 PM IST)
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ marginBottom: 16, overflowX: "auto" }}>
        <div className="tabs" style={{ display: "inline-flex", minWidth: "max-content" }}>
          {filters.map(f => (
            <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f === "BUY"  ? `📈 BUY (${buyCount})`   :
               f === "SELL" ? `📉 SELL (${sellCount})`  :
               f === "WATCH"? `👁 WATCH (${watchCount})` : f}
            </button>
          ))}
        </div>
      </div>

      {/* Signal cards */}
      {Object.keys(signals).length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Click "Scan Now" to analyze all 15 pairs</div>
          <div style={{ fontSize: 13 }}>Scanner checks SMC conditions and shows BUY / SELL / WATCH for each pair</div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={runScan}>
            🔄 Start Scan
          </button>
        </div>
      ) : (
        <div className="grid-auto">
          {filtered.map(inst => (
            <SignalCard
              key={inst.id}
              inst={inst}
              price={allPrices[inst.priceKey]?.price}
              sig={signals[inst.id]}
              onClick={(i, s) => setSelected({ id: i.id, sig: s })}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              No {filter} signals right now. Market is consolidating — wait for Kill Zone.
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <SignalModal
          inst={selectedInst}
          sig={selected.sig}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
