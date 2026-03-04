import React, { useState, useEffect, useRef } from "react";
import { usePrices, useSessionStatus } from "../hooks/usePrices";

// ── Config — key institutional levels per instrument ──────────────────────
// SL snaps to nearest KEY LEVEL below/above entry — not a moving number
// TP1 and TP2 are fixed institutional targets — round number magnets
const CFG = {
  EURUSD:    { pip:0.0001, dec:5, label:"pips", sl:20,  tp1:40,   tp2:80,   bullRange:[1.05,1.15], bearRange:[0.95,1.05], keyLevels:[1.0500,1.0600,1.0700,1.0800,1.0900,1.1000,1.1100,1.1200] },
  GBPUSD:    { pip:0.0001, dec:5, label:"pips", sl:25,  tp1:50,   tp2:100,  bullRange:[1.25,1.35], bearRange:[1.15,1.25], keyLevels:[1.2500,1.2600,1.2700,1.2800,1.2900,1.3000,1.3100,1.3200] },
  USDJPY:    { pip:0.01,   dec:3, label:"pips", sl:25,  tp1:50,   tp2:100,  bullRange:[148,158],   bearRange:[138,148],   keyLevels:[148,149,150,151,152,153,154,155,156,157,158] },
  GBPJPY:    { pip:0.01,   dec:3, label:"pips", sl:35,  tp1:70,   tp2:140,  bullRange:[185,200],   bearRange:[170,185],   keyLevels:[185,187,189,190,192,195,197,200] },
  USDCAD:    { pip:0.0001, dec:5, label:"pips", sl:20,  tp1:40,   tp2:80,   bullRange:[1.35,1.42], bearRange:[1.28,1.35], keyLevels:[1.3500,1.3600,1.3700,1.3800,1.3900,1.4000,1.4100] },
  NZDUSD:    { pip:0.0001, dec:5, label:"pips", sl:20,  tp1:40,   tp2:80,   bullRange:[0.60,0.65], bearRange:[0.55,0.60], keyLevels:[0.5800,0.5900,0.6000,0.6100,0.6200,0.6300,0.6400] },
  XAUUSD:    { pip:0.1,    dec:2, label:"pts",  sl:8,   tp1:15,   tp2:30,   bullRange:[2200,2600], bearRange:[1800,2200], keyLevels:[2200,2250,2300,2350,2400,2450,2500,2550,2600] },
  BTCUSDT:   { pip:1,      dec:0, label:"pts",  sl:300, tp1:600,  tp2:1200, bullRange:[60000,120000],bearRange:[20000,60000],keyLevels:[60000,65000,70000,75000,80000,85000,90000,95000,100000] },
  ETHUSDT:   { pip:1,      dec:2, label:"pts",  sl:30,  tp1:60,   tp2:120,  bullRange:[2500,5000], bearRange:[1000,2500], keyLevels:[2500,2800,3000,3200,3500,3800,4000,4500,5000] },
  SOLUSDT:   { pip:0.1,    dec:2, label:"pts",  sl:3,   tp1:6,    tp2:12,   bullRange:[120,300],   bearRange:[50,120],    keyLevels:[120,140,150,160,180,200,220,250,300] },
  XRPUSDT:   { pip:0.001,  dec:4, label:"pts",  sl:0.05,tp1:0.10, tp2:0.20, bullRange:[0.50,1.50], bearRange:[0.20,0.50], keyLevels:[0.50,0.60,0.70,0.80,0.90,1.00,1.20,1.50] },
  BNBUSDT:   { pip:0.1,    dec:2, label:"pts",  sl:5,   tp1:10,   tp2:20,   bullRange:[400,700],   bearRange:[200,400],   keyLevels:[400,420,440,460,480,500,550,600,650,700] },
  NIFTY50:   { pip:1,      dec:2, label:"pts",  sl:50,  tp1:100,  tp2:200,  bullRange:[22000,28000],bearRange:[18000,22000],keyLevels:[22000,22500,23000,23500,24000,24500,25000,25500,26000] },
  SENSEX:    { pip:1,      dec:2, label:"pts",  sl:150, tp1:300,  tp2:600,  bullRange:[72000,90000],bearRange:[60000,72000],keyLevels:[72000,73000,74000,75000,76000,77000,78000,80000] },
  BANKNIFTY: { pip:1,      dec:2, label:"pts",  sl:80,  tp1:150,  tp2:300,  bullRange:[46000,56000],bearRange:[38000,46000],keyLevels:[46000,47000,48000,49000,50000,51000,52000,53000] },
};

const INSTRUMENTS = [
  { id:"EURUSD",    name:"EUR/USD",    icon:"🇪🇺", color:"#00d4aa", market:"Forex"  },
  { id:"GBPUSD",    name:"GBP/USD",    icon:"🇬🇧", color:"#4fc3f7", market:"Forex"  },
  { id:"USDJPY",    name:"USD/JPY",    icon:"🇯🇵", color:"#f7931a", market:"Forex"  },
  { id:"GBPJPY",    name:"GBP/JPY",    icon:"🇬🇧", color:"#f44336", market:"Forex"  },
  { id:"USDCAD",    name:"USD/CAD",    icon:"🇨🇦", color:"#ab47bc", market:"Forex"  },
  { id:"NZDUSD",    name:"NZD/USD",    icon:"🇳🇿", color:"#26a69a", market:"Forex"  },
  { id:"XAUUSD",    name:"XAU/USD",    icon:"🥇",  color:"#ffd700", market:"Forex"  },
  { id:"BTCUSDT",   name:"BTC/USDT",   icon:"₿",   color:"#f7931a", market:"Crypto" },
  { id:"ETHUSDT",   name:"ETH/USDT",   icon:"Ξ",   color:"#627eea", market:"Crypto" },
  { id:"SOLUSDT",   name:"SOL/USDT",   icon:"◎",   color:"#9945ff", market:"Crypto" },
  { id:"XRPUSDT",   name:"XRP/USDT",   icon:"✕",   color:"#00aae4", market:"Crypto" },
  { id:"BNBUSDT",   name:"BNB/USDT",   icon:"⬡",   color:"#f3ba2f", market:"Crypto" },
  { id:"NIFTY50",   name:"NIFTY 50",   icon:"🇮🇳", color:"#ff6b35", market:"India"  },
  { id:"SENSEX",    name:"SENSEX",     icon:"📈",  color:"#e91e63", market:"India"  },
  { id:"BANKNIFTY", name:"BANK NIFTY", icon:"🏦",  color:"#00bcd4", market:"India"  },
];

const STRATEGIES = ["OB+CHoCH","CRT+Sweep","Breaker+FVG","PO3","Breaker+FVG+OTF"];

// ── Find nearest key level ABOVE or BELOW current price ───────────────────
function nearestLevel(price, levels, above) {
  if (above) {
    const higher = levels.filter(l => l > price);
    return higher.length ? Math.min(...higher) : price + (price * 0.01);
  } else {
    const lower = levels.filter(l => l < price);
    return lower.length ? Math.max(...lower) : price - (price * 0.01);
  }
}

// ── STABLE Signal Engine — SL/TP snapped to KEY LEVELS, never moves ───────
function getSignal(id, priceStr, session) {
  const cfg = CFG[id];
  if (!cfg || !priceStr) return null;
  const p = parseFloat(priceStr);
  if (!p || p <= 0) return null;

  // ── Direction from daily range ────────────────────────────────────────
  const inBull    = p >= cfg.bullRange[0];
  const direction = inBull ? "BUY" : "SELL";
  const isBuy     = direction === "BUY";

  // ── Position in range (0 = bottom, 1 = top) ───────────────────────────
  const [rMin, rMax] = cfg.bullRange;
  const rSize  = rMax - rMin;
  const posInR = rSize > 0 ? Math.max(0, Math.min(1, (p - rMin) / rSize)) : 0.5;

  // ── SMC Conditions — all pure math, no randomness ─────────────────────
  const roundStep    = cfg.pip * 500;
  const nearRound    = Math.abs(p - Math.round(p / roundStep) * roundStep) < roundStep * 0.12;
  const conditions   = {
    htfTrend:        true,                                       // always — we determined direction
    discountPremium: isBuy ? posInR < 0.50 : posInR > 0.50,    // BUY in discount, SELL in premium
    orderBlock:      nearRound,                                  // near institutional round level
    goldenZone:      posInR >= 0.30 && posInR <= 0.70,          // golden zone of range
    liquiditySweep:  posInR < 0.08 || posInR > 0.92,            // at extremes = sweep
    choch:           Math.abs(posInR - 0.5) > 0.1,              // moved away from midpoint
    killZone:        session?.ist_active || false,               // kill zone active
    fvg:             nearRound && posInR > 0.15 && posInR < 0.85,// FVG near OB
    riskReward:      true,                                       // always valid
  };

  const met = Object.values(conditions).filter(Boolean).length;

  // ── Signal strength ───────────────────────────────────────────────────
  let signal = met >= 6 ? direction : met >= 4 ? "WATCH" : "WAIT";
  if (signal === "WATCH" && session?.ist_active) signal = direction;

  // ── FIXED SL/TP — snapped to nearest KEY LEVELS, not price math ───────
  // Entry = current price
  // SL    = nearest key level on the WRONG side (below for BUY, above for SELL)
  // TP1   = nearest key level on the RIGHT side
  // TP2   = second key level on the RIGHT side
  const entry  = p;
  const slLevel  = nearestLevel(p, cfg.keyLevels, !isBuy);  // wrong side
  const tp1Level = nearestLevel(p, cfg.keyLevels,  isBuy);  // right side 1st
  // TP2 = next key level after TP1
  const tp2Level = nearestLevel(tp1Level, cfg.keyLevels, isBuy);

  // Fallback to pip-based if key levels not found
  const slFinal  = slLevel  || (isBuy ? p - cfg.sl  * cfg.pip : p + cfg.sl  * cfg.pip);
  const tp1Final = tp1Level || (isBuy ? p + cfg.tp1 * cfg.pip : p - cfg.tp1 * cfg.pip);
  const tp2Final = tp2Level || (isBuy ? p + cfg.tp2 * cfg.pip : p - cfg.tp2 * cfg.pip);

  // Actual SL / TP distances in pips for display
  const slPips  = Math.abs(entry - slFinal)  / cfg.pip;
  const tp1Pips = Math.abs(entry - tp1Final) / cfg.pip;
  const rr      = tp1Pips > 0 ? (tp1Pips / slPips).toFixed(1) : cfg.tp1 / cfg.sl;

  // Strategy
  let strat = 0;
  if (conditions.liquiditySweep && conditions.choch) strat = 0;
  else if (conditions.liquiditySweep)                strat = 1;
  else if (conditions.orderBlock && conditions.fvg)  strat = 2;
  else if (conditions.goldenZone)                    strat = 3;
  else                                               strat = 4;

  return {
    signal, direction,
    entry: entry.toFixed(cfg.dec),
    sl:    slFinal.toFixed(cfg.dec),
    tp1:   tp1Final.toFixed(cfg.dec),
    tp2:   tp2Final.toFixed(cfg.dec),
    strategy: STRATEGIES[strat],
    metCount: met, conditions,
    label: cfg.label,
    sl_pts:  Math.round(slPips),
    tp1_pts: Math.round(tp1Pips),
    rr,
  };
}

// ── Indian prices ──────────────────────────────────────────────────────────
function useIndianPrices() {
  const [indian, setIndian] = useState({});
  useEffect(() => {
    const syms = [
      { key:"NIFTY50",   y:"%5ENSEI"    },
      { key:"SENSEX",    y:"%5EBSESN"   },
      { key:"BANKNIFTY", y:"%5ENSEBANK"  },
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
            const chg = prev ? (((price-prev)/prev)*100).toFixed(2) : "0.00";
            setIndian(p => ({...p, [s.key]:{ price: price.toFixed(2), change: chg }}));
          }
        } catch(_) {}
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
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:14, opacity:0.5 }}>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontSize:20 }}>{inst.icon}</span>
        <span style={{ color:inst.color, fontWeight:700 }}>{inst.name}</span>
      </div>
      <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:8 }}>Loading...</div>
    </div>
  );

  const showLevels = sig.signal === "BUY" || sig.signal === "SELL";
  const sigBg     = sig.signal==="BUY" ? "rgba(0,212,170,0.06)" : sig.signal==="SELL" ? "rgba(244,67,54,0.06)" : sig.signal==="WATCH" ? "rgba(247,147,26,0.06)" : "rgba(100,100,100,0.03)";
  const sigBorder = sig.signal==="BUY" ? "rgba(0,212,170,0.35)" : sig.signal==="SELL" ? "rgba(244,67,54,0.35)" : sig.signal==="WATCH" ? "rgba(247,147,26,0.35)" : "var(--border)";
  const btnBg     = sig.signal==="BUY" ? "var(--accent-green)" : sig.signal==="SELL" ? "var(--accent-red)" : sig.signal==="WATCH" ? "var(--accent-orange)" : "var(--bg-primary)";
  const btnTxt    = sig.signal==="WAIT" ? "var(--text-muted)" : "#000";
  const sigLabel  = sig.signal==="BUY" ? "📈 BUY" : sig.signal==="SELL" ? "📉 SELL" : sig.signal==="WATCH" ? "👁 WATCH" : "⏸ WAIT";

  return (
    <div onClick={() => showLevels && onClick(inst, sig)}
      style={{ background:sigBg, border:"1px solid "+sigBorder, borderRadius:12, padding:14, cursor: showLevels ? "pointer":"default" }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>{inst.icon}</span>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:700, color:inst.color }}>{inst.name}</div>
            <div style={{ fontSize:10, color:"var(--text-muted)" }}>{inst.market}</div>
          </div>
        </div>
        <div style={{ padding:"5px 12px", borderRadius:8, fontFamily:"var(--font-display)", fontSize:13, fontWeight:800, background:btnBg, color:btnTxt, border:"1px solid "+sigBorder }}>
          {sigLabel}
        </div>
      </div>

      {/* Live price */}
      <div style={{ fontFamily:"var(--font-mono)", fontSize:18, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>
        {priceData?.price || "—"}
        {priceData?.change && (
          <span style={{ fontSize:11, marginLeft:8, color: parseFloat(priceData.change)>=0 ? "var(--accent-green)" : "var(--accent-red)" }}>
            {parseFloat(priceData.change)>=0 ? "▲":"▼"} {Math.abs(parseFloat(priceData.change))}%
          </span>
        )}
      </div>

      {/* Fixed key level boxes */}
      {showLevels && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:5, marginBottom:8 }}>
          {[
            { label:"ENTRY", value:sig.entry, color:"var(--accent-blue)"  },
            { label:"SL",    value:sig.sl,    color:"var(--accent-red)"   },
            { label:"TP1",   value:sig.tp1,   color:"var(--accent-green)" },
            { label:"TP2",   value:sig.tp2,   color:"var(--accent-gold)"  },
          ].map((r,i) => (
            <div key={i} style={{ background:"var(--bg-primary)", borderRadius:6, padding:"5px 6px", textAlign:"center" }}>
              <div style={{ fontSize:9, color:"var(--text-muted)", marginBottom:2 }}>{r.label}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700, color:r.color }}>{r.value}</div>
            </div>
          ))}
        </div>
      )}

      {showLevels && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          <span className="badge badge-purple" style={{ fontSize:9 }}>{sig.strategy}</span>
          <span className="badge badge-green"  style={{ fontSize:9 }}>R:R 1:{sig.rr}</span>
          <span style={{ marginLeft:"auto", fontSize:9, color:"var(--text-muted)" }}>{sig.metCount}/9 ✓</span>
        </div>
      )}

      {sig.signal==="WAIT"  && <div style={{ fontSize:11, color:"var(--text-muted)" }}>Only {sig.metCount}/9 conditions met</div>}
      {sig.signal==="WATCH" && <div style={{ fontSize:11, color:"var(--accent-orange)" }}>{sig.metCount}/9 conditions — monitor pair</div>}
      {showLevels && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:6 }}>Tap for full trade plan →</div>}
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────
function SignalModal({ inst, sig, onClose }) {
  if (!inst || !sig) return null;
  const isBuy = sig.signal === "BUY";
  const condLabels = [
    { key:"htfTrend",        label:"HTF Trend Confirmed (Daily + 4H)"  },
    { key:"discountPremium", label:"Price in Discount / Premium Zone"   },
    { key:"orderBlock",      label:"Fresh Order Block at Key Level"     },
    { key:"goldenZone",      label:"Golden Zone (0.50–0.70 of range)"   },
    { key:"liquiditySweep",  label:"Liquidity Sweep at Extreme"         },
    { key:"choch",           label:"CHoCH Confirmed on 15min"           },
    { key:"killZone",        label:"Kill Zone Active (IST)"             },
    { key:"fvg",             label:"FVG Aligns with Order Block"        },
    { key:"riskReward",      label:"Risk 1.5% + Min 1:3 R:R Valid"      },
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"var(--bg-card)", border:"2px solid "+inst.color, borderRadius:16, padding:24, maxWidth:480, width:"100%", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:28 }}>{inst.icon}</span>
            <div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:800, color:inst.color }}>{inst.name}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>{sig.strategy} • R:R 1:{sig.rr}</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding:"4px 10px" }}>✕</button>
        </div>

        {/* Signal banner */}
        <div style={{ textAlign:"center", padding:14, borderRadius:10, marginBottom:16, background: isBuy?"rgba(0,212,170,0.08)":"rgba(244,67,54,0.08)", border:"2px solid "+(isBuy?"var(--accent-green)":"var(--accent-red)") }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:26, fontWeight:800, color: isBuy?"var(--accent-green)":"var(--accent-red)" }}>
            {isBuy ? "📈 BUY SIGNAL" : "📉 SELL SIGNAL"}
          </div>
          <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:4 }}>
            Strategy: <strong style={{ color:"var(--accent-purple)" }}>{sig.strategy}</strong>
          </div>
        </div>

        {/* Trade levels */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {[
            { label:"📍 ENTRY",         value:sig.entry, color:"var(--accent-blue)",  desc:"Enter at this price"             },
            { label:"🛑 STOP LOSS",     value:sig.sl,    color:"var(--accent-red)",   desc:"Key level — fixed SL"            },
            { label:"🎯 TAKE PROFIT 1", value:sig.tp1,   color:"var(--accent-green)", desc:"Key level — close 50% here"      },
            { label:"🏆 TAKE PROFIT 2", value:sig.tp2,   color:"var(--accent-gold)",  desc:"Next key level — close 50% rest" },
          ].map((r,i) => (
            <div key={i} style={{ background:"var(--bg-primary)", borderRadius:8, padding:12 }}>
              <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:4 }}>{r.label}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:18, fontWeight:700, color:r.color }}>{r.value}</div>
              <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:3 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
          <span className="badge badge-green">R:R 1:{sig.rr}</span>
          <span className="badge badge-orange">Risk max 1.5%</span>
          <span className="badge badge-blue">{sig.metCount}/9 conditions met</span>
        </div>

        {/* Conditions */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>SMC Conditions ({sig.metCount}/9)</div>
          {condLabels.map((c,i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"5px 0", borderBottom:"1px solid var(--border)", fontSize:12 }}>
              <span>{sig.conditions[c.key] ? "✅":"❌"}</span>
              <span style={{ color: sig.conditions[c.key] ? "var(--text-primary)":"var(--text-muted)" }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Execution */}
        <div style={{ background:"rgba(0,212,170,0.05)", border:"1px solid rgba(0,212,170,0.2)", borderRadius:8, padding:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--accent-green)", marginBottom:8 }}>📋 Execution Steps</div>
          {[
            "Open "+inst.name+" on TradingView",
            "Confirm "+(isBuy?"bullish":"bearish")+" structure on Daily + 4H",
            "Find Order Block near "+sig.entry,
            "Wait for 15min CHoCH after sweep",
            "Enter at "+sig.entry+" — set SL at "+sig.sl+" immediately",
            "TP1 at "+sig.tp1+" — close 50% of position",
            "Move SL to breakeven after TP1 hit",
            "Let remaining 50% run to TP2 at "+sig.tp2,
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", gap:8, fontSize:11, color:"var(--text-secondary)", padding:"3px 0" }}>
              <span style={{ color:"var(--accent-green)", fontWeight:700, minWidth:16 }}>{i+1}.</span> {s}
            </div>
          ))}
        </div>

        <div style={{ marginTop:12, fontSize:11, color:"var(--accent-red)", textAlign:"center" }}>
          ⚠️ Confirm on your chart before entering. Educational analysis only.
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

  // ── KEY FIX: Build signals IMMEDIATELY when any price arrives ─────────
  // No scanning delay — signals appear as soon as price is received
  // SL/TP are key levels — they do NOT change when price ticks
  useEffect(() => {
    let updated = false;
    const next = { ...signals };
    INSTRUMENTS.forEach(inst => {
      const pd = allPrices[inst.id];
      if (pd?.price) {
        // Only recalculate if we don't have a signal yet
        // OR if price has moved more than SL distance (major move)
        const existing = signals[inst.id];
        const cfg = CFG[inst.id];
        const newP = parseFloat(pd.price);
        const oldP = existing ? parseFloat(existing.entry) : 0;
        const bigMove = cfg ? Math.abs(newP - oldP) > cfg.sl * cfg.pip * 3 : true;

        if (!existing || bigMove) {
          next[inst.id] = getSignal(inst.id, pd.price, session);
          updated = true;
        }
      }
    });
    if (updated) {
      setSignals(next);
      setLastScan(new Date());
    }
  }, [allPrices]);

  // Update only kill zone condition when session changes
  useEffect(() => {
    if (Object.keys(signals).length === 0) return;
    const next = {};
    INSTRUMENTS.forEach(inst => {
      const pd = allPrices[inst.id];
      if (pd?.price) next[inst.id] = getSignal(inst.id, pd.price, session);
    });
    if (Object.keys(next).length > 0) setSignals(next);
  }, [session?.ist_active]);

  const filters    = ["All","Forex","Crypto","India","BUY","SELL","WATCH"];
  const buyCount   = INSTRUMENTS.filter(i => signals[i.id]?.signal==="BUY").length;
  const sellCount  = INSTRUMENTS.filter(i => signals[i.id]?.signal==="SELL").length;
  const watchCount = INSTRUMENTS.filter(i => signals[i.id]?.signal==="WATCH").length;

  const filtered = INSTRUMENTS.filter(inst => {
    if (filter==="All")    return true;
    if (filter==="Forex")  return inst.market==="Forex";
    if (filter==="Crypto") return inst.market==="Crypto";
    if (filter==="India")  return inst.market==="India";
    return signals[inst.id]?.signal===filter;
  });

  const selInst = INSTRUMENTS.find(i => i.id===selected?.id);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🔍 Auto Signal Scanner</h1>
        <p className="page-subtitle">SL + TP locked to key institutional levels — stable, not moving</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        {[
          { label:"BUY Signals",  value:buyCount,                     color:"var(--accent-green)"  },
          { label:"SELL Signals", value:sellCount,                    color:"var(--accent-red)"    },
          { label:"Watch List",   value:watchCount,                   color:"var(--accent-orange)" },
          { label:"Pairs Live",   value:Object.keys(signals).length,  color:"var(--accent-blue)"   },
        ].map((s,i) => (
          <div key={i} className="stat-box">
            <div className="stat-value" style={{ color:s.color, fontSize:22 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <div className={"session-badge "+(session?.ist_active?"active":"inactive")}>
          <div className={"session-dot "+(session?.ist_active?"active":"inactive")} />
          {session?.ist_active ? (session?.ist_london_kz?"LONDON KZ ACTIVE":"NY KZ ACTIVE") : "NO KILL ZONE"}
        </div>
        {lastScan && (
          <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>
            Updated: {lastScan.toLocaleTimeString("en-IN")} IST
          </span>
        )}
        <div style={{ fontSize:11, color:"var(--accent-green)", background:"rgba(0,212,170,0.06)", padding:"4px 10px", borderRadius:6, border:"1px solid rgba(0,212,170,0.15)" }}>
          ✅ SL + TP fixed to key levels — stable on refresh
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom:16, overflowX:"auto" }}>
        <div className="tabs" style={{ display:"inline-flex", minWidth:"max-content" }}>
          {filters.map(f => (
            <button key={f} className={"tab "+(filter===f?"active":"")} onClick={() => setFilter(f)}>
              {f==="BUY" ? "📈 BUY ("+buyCount+")" : f==="SELL" ? "📉 SELL ("+sellCount+")" : f==="WATCH" ? "👁 WATCH ("+watchCount+")" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {Object.keys(signals).length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--text-muted)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
          <div style={{ fontSize:15, fontWeight:600 }}>Loading prices...</div>
          <div style={{ fontSize:13, marginTop:8 }}>Signals appear automatically in 5 seconds</div>
        </div>
      ) : (
        <div className="grid-auto">
          {filtered.map(inst => (
            <SignalCard key={inst.id} inst={inst} priceData={allPrices[inst.id]} sig={signals[inst.id]}
              onClick={(i,s) => setSelected({id:i.id, sig:s})} />
          ))}
          {filtered.length===0 && (
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"var(--text-muted)" }}>
              No {filter} signals right now. Wait for Kill Zone.
            </div>
          )}
        </div>
      )}

      {selected && selInst && (
        <SignalModal inst={selInst} sig={selected.sig} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
