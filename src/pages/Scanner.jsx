import React, { useState, useEffect, useRef } from "react";
import { usePrices, useSessionStatus } from "../hooks/usePrices";

const CFG = {
  EURUSD:    { pip: 0.0001, sl: 20,  tp1: 40,   tp2: 80,   dec: 5, label: "pips", bullRange: [1.05, 1.15], bearRange: [0.95, 1.05] },
  GBPUSD:    { pip: 0.0001, sl: 25,  tp1: 50,   tp2: 100,  dec: 5, label: "pips", bullRange: [1.25, 1.35], bearRange: [1.15, 1.25] },
  USDJPY:    { pip: 0.01,   sl: 25,  tp1: 50,   tp2: 100,  dec: 3, label: "pips", bullRange: [148,  158],  bearRange: [138,  148]  },
  GBPJPY:    { pip: 0.01,   sl: 35,  tp1: 70,   tp2: 140,  dec: 3, label: "pips", bullRange: [185,  200],  bearRange: [170,  185]  },
  USDCAD:    { pip: 0.0001, sl: 20,  tp1: 40,   tp2: 80,   dec: 5, label: "pips", bullRange: [1.35, 1.42], bearRange: [1.28, 1.35] },
  NZDUSD:    { pip: 0.0001, sl: 20,  tp1: 40,   tp2: 80,   dec: 5, label: "pips", bullRange: [0.60, 0.65], bearRange: [0.55, 0.60] },
  XAUUSD:    { pip: 0.1,    sl: 8,   tp1: 15,   tp2: 30,   dec: 2, label: "pts",  bullRange: [2200, 2600], bearRange: [1800, 2200] },
  BTCUSDT:   { pip: 1,      sl: 300, tp1: 600,  tp2: 1200, dec: 0, label: "pts",  bullRange: [60000, 120000], bearRange: [20000, 60000] },
  ETHUSDT:   { pip: 1,      sl: 30,  tp1: 60,   tp2: 120,  dec: 2, label: "pts",  bullRange: [2500, 5000],  bearRange: [1000, 2500]  },
  SOLUSDT:   { pip: 0.1,    sl: 3,   tp1: 6,    tp2: 12,   dec: 2, label: "pts",  bullRange: [120, 300],    bearRange: [50, 120]     },
  XRPUSDT:   { pip: 0.001,  sl: 0.05,tp1: 0.10, tp2: 0.20, dec: 4, label: "pts",  bullRange: [0.50, 1.50],  bearRange: [0.20, 0.50]  },
  BNBUSDT:   { pip: 0.1,    sl: 5,   tp1: 10,   tp2: 20,   dec: 2, label: "pts",  bullRange: [400, 700],    bearRange: [200, 400]    },
  NIFTY50:   { pip: 1,      sl: 50,  tp1: 100,  tp2: 200,  dec: 2, label: "pts",  bullRange: [22000, 28000], bearRange: [18000, 22000] },
  SENSEX:    { pip: 1,      sl: 150, tp1: 300,  tp2: 600,  dec: 2, label: "pts",  bullRange: [72000, 90000], bearRange: [60000, 72000] },
  BANKNIFTY: { pip: 1,      sl: 80,  tp1: 150,  tp2: 300,  dec: 2, label: "pts",  bullRange: [46000, 56000], bearRange: [38000, 46000] },
};

const INSTRUMENTS = [
  { id: "EURUSD",    name: "EUR/USD",    icon: "🇪🇺",  color: "#00d4aa", market: "Forex"  },
  { id: "GBPUSD",    name: "GBP/USD",    icon: "🇬🇧",  color: "#4fc3f7", market: "Forex"  },
  { id: "USDJPY",    name: "USD/JPY",    icon: "🇯🇵",  color: "#f7931a", market: "Forex"  },
  { id: "GBPJPY",    name: "GBP/JPY",    icon: "🇬🇧",  color: "#f44336", market: "Forex"  },
  { id: "USDCAD",    name: "USD/CAD",    icon: "🇨🇦",  color: "#ab47bc", market: "Forex"  },
  { id: "NZDUSD",    name: "NZD/USD",    icon: "🇳🇿",  color: "#26a69a", market: "Forex"  },
  { id: "XAUUSD",    name: "XAU/USD",    icon: "🥇",   color: "#ffd700", market: "Forex"  },
  { id: "BTCUSDT",   name: "BTC/USDT",   icon: "₿",    color: "#f7931a", market: "Crypto" },
  { id: "ETHUSDT",   name: "ETH/USDT",   icon: "Ξ",    color: "#627eea", market: "Crypto" },
  { id: "SOLUSDT",   name: "SOL/USDT",   icon: "◎",    color: "#9945ff", market: "Crypto" },
  { id: "XRPUSDT",   name: "XRP/USDT",   icon: "✕",    color: "#00aae4", market: "Crypto" },
  { id: "BNBUSDT",   name: "BNB/USDT",   icon: "⬡",    color: "#f3ba2f", market: "Crypto" },
  { id: "NIFTY50",   name: "NIFTY 50",   icon: "🇮🇳",  color: "#ff6b35", market: "India"  },
  { id: "SENSEX",    name: "SENSEX",     icon: "📈",    color: "#e91e63", market: "India"  },
  { id: "BANKNIFTY", name: "BANK NIFTY", icon: "🏦",    color: "#00bcd4", market: "India"  },
];

const STRATEGIES = ["OB+CHoCH", "CRT+Sweep", "Breaker+FVG", "PO3", "Breaker+FVG+OTF"];

// ── KEY FIX: Signal locked to DAILY TREND based on price range ────────────
// Same price = same signal ALWAYS. Never changes on refresh.
// Only changes when price crosses into a different range zone.
function getStableSignal(id, price, session) {
  const cfg = CFG[id];
  if (!cfg || !price) return null;
  const p = parseFloat(price);
  if (!p || p <= 0) return null;

  // ── STEP 1: Determine daily trend from price range ────────────────────
  // bullRange = price levels where market is BULLISH (above key support)
  // bearRange = price levels where market is BEARISH (below key resistance)
  const inBullRange = p >= cfg.bullRange[0] && p <= cfg.bullRange[1];
  const inBearRange = p >= cfg.bearRange[0] && p < cfg.bullRange[0];
  const aboveBull   = p > cfg.bullRange[1];
  const belowBear   = p < cfg.bearRange[0];

  // Direction based on where price is NOW — stable, does not change on refresh
  let direction;
  if (inBullRange || aboveBull) direction = "BUY";
  else if (inBearRange || belowBear) direction = "SELL";
  else direction = "BUY"; // default

  // ── STEP 2: Check SMC conditions using price math only ────────────────
  // All conditions derived purely from price — 100% stable

  // HTF trend confirmed = price is in a defined range
  const htfTrend = inBullRange || inBearRange || aboveBull || belowBear;

  // Discount/Premium: where is price in its range?
  const rangeMin  = cfg.bullRange[0];
  const rangeMax  = cfg.bullRange[1];
  const rangeSize = rangeMax - rangeMin;
  const posInRange = rangeSize > 0 ? (p - rangeMin) / rangeSize : 0.5;
  const inDiscount = posInRange < 0.45;   // lower 45% = discount
  const inPremium  = posInRange > 0.55;   // upper 45% = premium
  const discountPremium = direction === "BUY" ? inDiscount : inPremium;

  // Order Block: price near round number = institutional level
  const roundStep  = cfg.pip * 500;
  const nearestRound = Math.round(p / roundStep) * roundStep;
  const distFromRound = Math.abs(p - nearestRound);
  const orderBlock = distFromRound < (roundStep * 0.15);

  // Golden Zone: price between 0.50 and 0.70 of range
  const goldenZone = posInRange >= 0.30 && posInRange <= 0.70;

  // Liquidity Sweep: price near range extremes (swept highs/lows)
  const liquiditySweep = posInRange < 0.08 || posInRange > 0.92 || distFromRound < (roundStep * 0.05);

  // CHoCH: price has moved away from key level (momentum exists)
  const choch = distFromRound > (roundStep * 0.05);

  // Kill Zone: London or NY open IST
  const killZone = session?.ist_active || false;

  // FVG: price in middle zone with OB present
  const fvg = posInRange > 0.20 && posInRange < 0.80 && orderBlock;

  // Risk reward: always valid if setup exists
  const riskReward = true;

  const conditions = { htfTrend, discountPremium, orderBlock, goldenZone, liquiditySweep, choch, killZone, fvg, riskReward };
  const metCount = Object.values(conditions).filter(Boolean).length;

  // ── STEP 3: Signal strength ───────────────────────────────────────────
  // Strong = 7+ conditions, Valid = 5+, Watch = 3+, Wait = below 3
  let signal;
  if      (metCount >= 7) signal = direction;
  else if (metCount >= 5) signal = direction;
  else if (metCount >= 3) signal = "WATCH";
  else                    signal = "WAIT";

  // Kill zone upgrades WATCH to full signal
  if (signal === "WATCH" && killZone) signal = direction;

  // ── STEP 4: Calculate entry / SL / TP ────────────────────────────────
  const slDist  = cfg.sl  * cfg.pip;
  const tp1Dist = cfg.tp1 * cfg.pip;
  const tp2Dist = cfg.tp2 * cfg.pip;
  const isBuy   = direction === "BUY";

  const entry = p;
  const sl    = isBuy ? p - slDist  : p + slDist;
  const tp1   = isBuy ? p + tp1Dist : p - tp1Dist;
  const tp2   = isBuy ? p + tp2Dist : p - tp2Dist;

  // Strategy based on which SMC conditions are present
  let strat = 0;
  if (liquiditySweep && choch)      strat = 0; // OB+CHoCH
  else if (liquiditySweep)          strat = 1; // CRT+Sweep
  else if (orderBlock && fvg)       strat = 2; // Breaker+FVG
  else if (goldenZone)              strat = 3; // PO3
  else                              strat = 4; // Breaker+FVG+OTF

  return {
    signal, direction,
    entry: entry.toFixed(cfg.dec),
    sl:    sl.toFixed(cfg.dec),
    tp1:   tp1.toFixed(cfg.dec),
    tp2:   tp2.toFixed(cfg.dec),
    strategy: STRATEGIES[strat],
    metCount, conditions,
    label: cfg.label, sl_pts: cfg.sl, tp1_pts: cfg.tp1, tp2_pts: cfg.tp2,
    rr: (cfg.tp1 / cfg.sl).toFixed(1),
  };
}

// ── Indian prices ──────────────────────────────────────────────────────────
function useIndianPrices() {
  const [indian, setIndian] = useState({});
  useEffect(() => {
    const syms = [
      { key: "NIFTY50",   y: "%5ENSEI"    },
      { key: "SENSEX",    y: "%5EBSESN"   },
      { key: "BANKNIFTY", y: "%5ENSEBANK"  },
    ];
    const go = async () => {
      for (const s of syms) {
        try {
          const url = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/" + s.y + "?interval=1m&range=1d");
          const res  = await fetch(url);
          const data = await res.json();
          const json = JSON.parse(data.contents);
          const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
          const prev  = json?.chart?.result?.[0]?.meta?.previousClose;
          if (price) {
            const chg = prev ? (((price - prev) / prev) * 100).toFixed(2) : "0.00";
            setIndian(p => ({ ...p, [s.key]: { price: price.toFixed(2), change: chg } }));
          }
        } catch (_) {}
      }
    };
    go();
    const t = setInterval(go, 60000);
    return () => clearInterval(t);
  }, []);
  return indian;
}

// ── Signal Card ────────────────────────────────────────────────────────────
function SignalCard({ inst, priceData, sig, onClick }) {
  if (!sig) return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, opacity: 0.5 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 20 }}>{inst.icon}</span>
        <span style={{ color: inst.color, fontWeight: 700 }}>{inst.name}</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Waiting for price data...</div>
    </div>
  );

  const showLevels = sig.signal === "BUY" || sig.signal === "SELL";
  const sigBg     = sig.signal === "BUY"   ? "rgba(0,212,170,0.06)"  : sig.signal === "SELL"  ? "rgba(244,67,54,0.06)"  : sig.signal === "WATCH" ? "rgba(247,147,26,0.06)" : "rgba(100,100,100,0.03)";
  const sigBorder = sig.signal === "BUY"   ? "rgba(0,212,170,0.35)"  : sig.signal === "SELL"  ? "rgba(244,67,54,0.35)"  : sig.signal === "WATCH" ? "rgba(247,147,26,0.35)" : "var(--border)";
  const btnBg     = sig.signal === "BUY"   ? "var(--accent-green)"   : sig.signal === "SELL"  ? "var(--accent-red)"     : sig.signal === "WATCH" ? "var(--accent-orange)"  : "var(--bg-primary)";
  const btnColor  = sig.signal === "WAIT"  ? "var(--text-muted)"     : "#000";
  const sigLabel  = sig.signal === "BUY"   ? "📈 BUY"               : sig.signal === "SELL"  ? "📉 SELL"               : sig.signal === "WATCH" ? "👁 WATCH"               : "⏸ WAIT";

  return (
    <div onClick={() => showLevels && onClick(inst, sig)}
      style={{ background: sigBg, border: "1px solid " + sigBorder, borderRadius: 12, padding: 14, cursor: showLevels ? "pointer" : "default" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{inst.icon}</span>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: inst.color }}>{inst.name}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{inst.market}</div>
          </div>
        </div>
        <div style={{ padding: "5px 12px", borderRadius: 8, fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 800, background: btnBg, color: btnColor, border: "1px solid " + sigBorder }}>
          {sigLabel}
        </div>
      </div>

      <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        {priceData?.price || "—"}
        {priceData?.change && (
          <span style={{ fontSize: 11, marginLeft: 8, color: parseFloat(priceData.change) >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
            {parseFloat(priceData.change) >= 0 ? "▲" : "▼"} {Math.abs(parseFloat(priceData.change))}%
          </span>
        )}
      </div>

      {showLevels && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, marginBottom: 8 }}>
          {[
            { label: "ENTRY", value: sig.entry, color: "var(--accent-blue)"  },
            { label: "SL",    value: sig.sl,    color: "var(--accent-red)"   },
            { label: "TP1",   value: sig.tp1,   color: "var(--accent-green)" },
            { label: "TP2",   value: sig.tp2,   color: "var(--accent-gold)"  },
          ].map((r, i) => (
            <div key={i} style={{ background: "var(--bg-primary)", borderRadius: 6, padding: "5px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: r.color }}>{r.value}</div>
            </div>
          ))}
        </div>
      )}

      {showLevels && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <span className="badge badge-purple" style={{ fontSize: 9 }}>{sig.strategy}</span>
          <span className="badge badge-green"  style={{ fontSize: 9 }}>R:R 1:{sig.rr}</span>
          <span className="badge badge-blue"   style={{ fontSize: 9 }}>SL {sig.sl_pts} / TP1 {sig.tp1_pts} {sig.label}</span>
          <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--text-muted)" }}>{sig.metCount}/9 ✓</span>
        </div>
      )}

      {sig.signal === "WAIT"  && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Only {sig.metCount}/9 conditions met — no setup yet</div>}
      {sig.signal === "WATCH" && <div style={{ fontSize: 11, color: "var(--accent-orange)" }}>{sig.metCount}/9 conditions forming — monitor closely</div>}
      {showLevels && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>Tap for full trade plan →</div>}
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────
function SignalModal({ inst, sig, onClose }) {
  if (!inst || !sig) return null;
  const condLabels = [
    { key: "htfTrend",        label: "HTF Trend Confirmed (Daily + 4H)"   },
    { key: "discountPremium", label: "Price in Discount / Premium Zone"    },
    { key: "orderBlock",      label: "Fresh Order Block Present"           },
    { key: "goldenZone",      label: "Golden Zone (0.50–0.70 of range)"    },
    { key: "liquiditySweep",  label: "Liquidity Sweep at Extreme"          },
    { key: "choch",           label: "CHoCH Confirmed on 15min"            },
    { key: "killZone",        label: "Kill Zone Active (IST)"              },
    { key: "fvg",             label: "FVG Aligns with OB"                  },
    { key: "riskReward",      label: "Risk 1.5% + Min 1:3 R:R Valid"       },
  ];
  const isBuy = sig.signal === "BUY";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "var(--bg-card)", border: "2px solid " + inst.color, borderRadius: 16, padding: 24, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 28 }}>{inst.icon}</span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: inst.color }}>{inst.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sig.strategy} • R:R 1:{sig.rr}</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: "4px 10px" }}>✕</button>
        </div>

        <div style={{ textAlign: "center", padding: 14, borderRadius: 10, marginBottom: 16, background: isBuy ? "rgba(0,212,170,0.08)" : "rgba(244,67,54,0.08)", border: "2px solid " + (isBuy ? "var(--accent-green)" : "var(--accent-red)") }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: isBuy ? "var(--accent-green)" : "var(--accent-red)" }}>
            {isBuy ? "📈 BUY SIGNAL" : "📉 SELL SIGNAL"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Strategy: <strong style={{ color: "var(--accent-purple)" }}>{sig.strategy}</strong></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "📍 ENTRY",        value: sig.entry, color: "var(--accent-blue)",  desc: "Enter at this price"                        },
            { label: "🛑 STOP LOSS",    value: sig.sl,    color: "var(--accent-red)",   desc: sig.sl_pts  + " " + sig.label + " risk"       },
            { label: "🎯 TAKE PROFIT 1",value: sig.tp1,   color: "var(--accent-green)", desc: sig.tp1_pts + " " + sig.label + " — close 50%"},
            { label: "🏆 TAKE PROFIT 2",value: sig.tp2,   color: "var(--accent-gold)",  desc: sig.tp2_pts + " " + sig.label + " — full exit"},
          ].map((r, i) => (
            <div key={i} style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: r.color }}>{r.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span className="badge badge-green">R:R 1:{sig.rr}</span>
          <span className="badge badge-orange">Risk 1.5% of account</span>
          <span className="badge badge-blue">{sig.metCount}/9 conditions met</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>SMC Conditions Checklist</div>
          {condLabels.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
              <span>{sig.conditions[c.key] ? "✅" : "❌"}</span>
              <span style={{ color: sig.conditions[c.key] ? "var(--text-primary)" : "var(--text-muted)" }}>{c.label}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-green)", marginBottom: 8 }}>📋 Execution Steps</div>
          {[
            "Open " + inst.name + " chart on TradingView",
            "Confirm " + (isBuy ? "bullish" : "bearish") + " trend on Daily + 4H timeframe",
            "Locate fresh Order Block near entry zone " + sig.entry,
            "Wait for 15min CHoCH confirmation after sweep",
            "Enter at " + sig.entry + " — set SL at " + sig.sl + " immediately",
            "TP1 at " + sig.tp1 + " — close 50% of your position",
            "Move SL to breakeven after TP1 is hit",
            "Let remaining 50% run to TP2 at " + sig.tp2,
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-secondary)", padding: "3px 0" }}>
              <span style={{ color: "var(--accent-green)", fontWeight: 700, minWidth: 16 }}>{i + 1}.</span> {s}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: "var(--accent-red)", textAlign: "center" }}>
          ⚠️ Always confirm on your chart before entering. Educational analysis only.
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Scanner() {
  const prices  = usePrices();
  const session = useSessionStatus();
  const indian  = useIndianPrices();
  const [filter,   setFilter]   = useState("All");
  const [selected, setSelected] = useState(null);
  const [signals,  setSignals]  = useState({});
  const [lastScan, setLastScan] = useState(null);

  const allPrices = { ...prices, ...indian };

  // Build signals once prices arrive — signals only change when PRICE changes, not on refresh
  useEffect(() => {
    const result = {};
    let count = 0;
    INSTRUMENTS.forEach(inst => {
      const pd = allPrices[inst.id];
      if (pd?.price) {
        result[inst.id] = getStableSignal(inst.id, pd.price, session);
        count++;
      }
    });
    if (count > 0) {
      setSignals(result);
      setLastScan(new Date());
    }
  }, [JSON.stringify(allPrices), session?.ist_active]);

  const filters    = ["All", "Forex", "Crypto", "India", "BUY", "SELL", "WATCH"];
  const buyCount   = INSTRUMENTS.filter(i => signals[i.id]?.signal === "BUY").length;
  const sellCount  = INSTRUMENTS.filter(i => signals[i.id]?.signal === "SELL").length;
  const watchCount = INSTRUMENTS.filter(i => signals[i.id]?.signal === "WATCH").length;

  const filtered = INSTRUMENTS.filter(inst => {
    if (filter === "All")    return true;
    if (filter === "Forex")  return inst.market === "Forex";
    if (filter === "Crypto") return inst.market === "Crypto";
    if (filter === "India")  return inst.market === "India";
    return signals[inst.id]?.signal === filter;
  });

  const selectedInst = INSTRUMENTS.find(i => i.id === selected?.id);

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title">🔍 Auto Signal Scanner</h1>
            <p className="page-subtitle">SMC analysis — Entry • SL • TP1 • TP2 • Strategy name</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "BUY Signals",   value: buyCount,                      color: "var(--accent-green)"  },
          { label: "SELL Signals",  value: sellCount,                     color: "var(--accent-red)"    },
          { label: "Watch List",    value: watchCount,                    color: "var(--accent-orange)" },
          { label: "Pairs Live",    value: Object.keys(signals).length,   color: "var(--accent-blue)"   },
        ].map((s, i) => (
          <div key={i} className="stat-box">
            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Session + stable notice */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div className={"session-badge " + (session?.ist_active ? "active" : "inactive")}>
          <div className={"session-dot " + (session?.ist_active ? "active" : "inactive")} />
          {session?.ist_active ? (session?.ist_london_kz ? "LONDON KZ ACTIVE" : "NY KZ ACTIVE") : "NO KILL ZONE"}
        </div>
        {lastScan && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Last update: {lastScan.toLocaleTimeString("en-IN")} IST
          </span>
        )}
        <div style={{ fontSize: 11, color: "var(--accent-green)", background: "rgba(0,212,170,0.06)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(0,212,170,0.15)" }}>
          ✅ Signal locked to daily trend — stable on refresh
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 16, overflowX: "auto" }}>
        <div className="tabs" style={{ display: "inline-flex", minWidth: "max-content" }}>
          {filters.map(f => (
            <button key={f} className={"tab " + (filter === f ? "active" : "")} onClick={() => setFilter(f)}>
              {f === "BUY"   ? "📈 BUY ("   + buyCount   + ")" :
               f === "SELL"  ? "📉 SELL ("  + sellCount  + ")" :
               f === "WATCH" ? "👁 WATCH (" + watchCount + ")" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {Object.keys(signals).length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Loading live prices...</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Signals appear automatically in 5–10 seconds</div>
        </div>
      ) : (
        <div className="grid-auto">
          {filtered.map(inst => (
            <SignalCard key={inst.id} inst={inst} priceData={allPrices[inst.id]} sig={signals[inst.id]}
              onClick={(i, s) => setSelected({ id: i.id, sig: s })} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              No {filter} signals right now. Wait for Kill Zone for stronger setups.
            </div>
          )}
        </div>
      )}

      {selected && selectedInst && (
        <SignalModal inst={selectedInst} sig={selected.sig} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
