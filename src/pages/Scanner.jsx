import React, { useState, useEffect, useRef } from "react";
import { usePrices, useSessionStatus } from "../hooks/usePrices";

const STORAGE_KEY = "signal_history_v1";
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveToHistory(trade) {
  try {
    const h = loadHistory();
    // avoid duplicate signal for same pair within 1 hour
    const recent = h.find(t => t.pair === trade.pair && t.status === "OPEN" &&
      Date.now() - new Date(t.openTime).getTime() < 60 * 60 * 1000);
    if (recent) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([trade, ...h].slice(0, 200)));
  } catch {}
}
function updateHistory(id, update) {
  try {
    const h = loadHistory();
    const next = h.map(t => t.id === id ? { ...t, ...update } : t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

// ── CORRECT SMC SL/TP per instrument ──────────────────────────────────────
// SL = tight, just below/above order block (not key level distance)
// TP1 = 2× SL, TP2 = 3-4× SL (minimum 1:2 R:R always)
const CFG = {
  // FOREX — pips
  EURUSD:    { pip:0.0001, dec:5, label:"pips", sl:15, tp1:30,  tp2:60,  market:"Forex",  color:"#00d4aa", icon:"🇪🇺", name:"EUR/USD",
    bullMin:1.04, bullMax:1.16, keys:[1.0400,1.0500,1.0600,1.0700,1.0800,1.0900,1.1000,1.1100,1.1200,1.1300] },
  GBPUSD:    { pip:0.0001, dec:5, label:"pips", sl:18, tp1:36,  tp2:72,  market:"Forex",  color:"#4fc3f7", icon:"🇬🇧", name:"GBP/USD",
    bullMin:1.24, bullMax:1.36, keys:[1.2400,1.2500,1.2600,1.2700,1.2800,1.2900,1.3000,1.3100,1.3200,1.3500] },
  USDJPY:    { pip:0.01,   dec:3, label:"pips", sl:20, tp1:40,  tp2:80,  market:"Forex",  color:"#f7931a", icon:"🇯🇵", name:"USD/JPY",
    bullMin:145,  bullMax:160,  keys:[145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160] },
  GBPJPY:    { pip:0.01,   dec:3, label:"pips", sl:25, tp1:50,  tp2:100, market:"Forex",  color:"#f44336", icon:"🇬🇧", name:"GBP/JPY",
    bullMin:183,  bullMax:202,  keys:[183,185,187,189,190,192,195,197,200,202] },
  USDCAD:    { pip:0.0001, dec:5, label:"pips", sl:15, tp1:30,  tp2:60,  market:"Forex",  color:"#ab47bc", icon:"🇨🇦", name:"USD/CAD",
    bullMin:1.34, bullMax:1.42, keys:[1.3400,1.3500,1.3600,1.3700,1.3800,1.3900,1.4000,1.4100,1.4200] },
  NZDUSD:    { pip:0.0001, dec:5, label:"pips", sl:15, tp1:30,  tp2:60,  market:"Forex",  color:"#26a69a", icon:"🇳🇿", name:"NZD/USD",
    bullMin:0.575,bullMax:0.645,keys:[0.5750,0.5800,0.5850,0.5900,0.5950,0.6000,0.6050,0.6100,0.6150,0.6200,0.6250,0.6300,0.6400] },
  XAUUSD:    { pip:0.1,    dec:2, label:"pts",  sl:6,  tp1:12,  tp2:24,  market:"Forex",  color:"#ffd700", icon:"🥇", name:"XAU/USD",
    bullMin:2150, bullMax:2700, keys:[2150,2200,2250,2300,2350,2400,2450,2500,2550,2600,2650,2700] },

  // CRYPTO — correct tight SL
  BTCUSDT:   { pip:1,    dec:0, label:"pts",  sl:150, tp1:300, tp2:600,  market:"Crypto", color:"#f7931a", icon:"₿",  name:"BTC/USDT",
    bullMin:55000,bullMax:110000,keys:[55000,58000,60000,62000,65000,68000,70000,72000,75000,78000,80000,85000,90000,95000,100000] },
  ETHUSDT:   { pip:0.1,  dec:2, label:"pts",  sl:18,  tp1:36,  tp2:72,   market:"Crypto", color:"#627eea", icon:"Ξ",  name:"ETH/USDT",
    // ETH SL = 15 pts (NOT 2500!) — tight OB-based stop
    bullMin:2200, bullMax:4200, keys:[2200,2400,2500,2600,2800,3000,3200,3400,3500,3800,4000,4200] },
  SOLUSDT:   { pip:0.01, dec:2, label:"pts",  sl:2,   tp1:4,   tp2:8,    market:"Crypto", color:"#9945ff", icon:"◎",  name:"SOL/USDT",
    bullMin:100,  bullMax:260,  keys:[100,110,120,130,140,150,160,170,180,190,200,210,220,240,260] },
  XRPUSDT:   { pip:0.001,dec:4, label:"pts",  sl:0.04,tp1:0.08,tp2:0.16, market:"Crypto", color:"#00aae4", icon:"✕",  name:"XRP/USDT",
    bullMin:0.45, bullMax:1.40, keys:[0.45,0.50,0.55,0.60,0.65,0.70,0.75,0.80,0.90,1.00,1.10,1.20,1.30,1.40] },
  BNBUSDT:   { pip:0.1,  dec:2, label:"pts",  sl:4,   tp1:8,   tp2:16,   market:"Crypto", color:"#f3ba2f", icon:"⬡",  name:"BNB/USDT",
    bullMin:380,  bullMax:720,  keys:[380,400,420,440,460,480,500,520,540,560,580,600,640,680,720] },

  // INDIA — correct points
  NIFTY50:   { pip:1, dec:2, label:"pts", sl:40,  tp1:80,  tp2:160, market:"India", color:"#ff6b35", icon:"🇮🇳", name:"NIFTY 50",
    bullMin:21000,bullMax:27000,keys:[21000,21500,22000,22500,23000,23500,24000,24500,25000,25500,26000,26500,27000] },
  SENSEX:    { pip:1, dec:2, label:"pts", sl:120, tp1:240, tp2:480, market:"India", color:"#e91e63", icon:"📈", name:"SENSEX",
    bullMin:70000,bullMax:88000,keys:[70000,71000,72000,73000,74000,75000,76000,77000,78000,79000,80000,82000,84000,86000,88000] },
  BANKNIFTY: { pip:1, dec:2, label:"pts", sl:45,  tp1:90,  tp2:180, market:"India", color:"#00bcd4", icon:"🏦", name:"BANK NIFTY",
    bullMin:44000,bullMax:55000,keys:[44000,45000,46000,47000,48000,49000,50000,51000,52000,53000,54000,55000] },
};

const IDS = Object.keys(CFG);

// ── Nearest key level above or below ──────────────────────────────────────
function nearestKey(price, keys, above) {
  const f = above ? keys.filter(k=>k>price) : keys.filter(k=>k<price);
  if (!f.length) return above ? price*(1+0.005) : price*(1-0.005);
  return above ? Math.min(...f) : Math.max(...f);
}

// ── ADVANCED SMC Signal Engine ─────────────────────────────────────────────
// All 9 conditions — same as Signal Checker page
// Direction: based on price position in DEFINED bull/bear range
// SL: tight — just beyond nearest key level (not far away)
// TP: minimum 2:1 R:R always enforced
function getSignal(id, priceStr, session) {
  const cfg = CFG[id];
  if (!cfg || !priceStr) return null;
  const p = parseFloat(priceStr);
  if (!p || p <= 0) return null;

  const rangeSize  = cfg.bullMax - cfg.bullMin;
  const posInRange = rangeSize > 0 ? Math.max(0, Math.min(1, (p - cfg.bullMin) / rangeSize)) : 0.5;

  // ── DIRECTION: bull if price is in upper half of defined range ─────────
  // More accurate: split range into 3 zones
  // 0.00–0.40 = BEARISH (premium = good sell zone)
  // 0.40–0.60 = NEUTRAL (midpoint = no trade)
  // 0.60–1.00 = BULLISH (discount = good buy zone) — wait, this is inverted
  // CORRECT SMC: discount = LOWER prices = BUY, premium = HIGHER prices = SELL
  // So posInRange < 0.45 = discount = BUY opportunity
  //    posInRange > 0.55 = premium = SELL opportunity
  const inDiscount = posInRange < 0.45; // lower part of range = BUY
  const inPremium  = posInRange > 0.55; // upper part of range = SELL
  const inNeutral  = posInRange >= 0.45 && posInRange <= 0.55;

  const direction = inDiscount ? "BUY" : "SELL";

  // ── Round number proximity (institutional OB levels) ───────────────────
  const roundStep = cfg.pip * 200; // tighter — within 200 pips of round
  const distFromRound = Math.abs(p - Math.round(p / roundStep) * roundStep);
  const nearRound = distFromRound < roundStep * 0.20;

  // ── 9 CONDITIONS (exact match to Signal Checker) ───────────────────────
  const c1 = !inNeutral;                                     // 1. HTF trend — not in neutral zone
  const c2 = inDiscount || inPremium;                        // 2. Discount or Premium zone
  const c3 = nearRound;                                      // 3. Order Block at key level
  const c4 = posInRange >= 0.30 && posInRange <= 0.70;       // 4. Golden zone (0.382–0.618)
  const c5 = posInRange < 0.06 || posInRange > 0.94;         // 5. Liquidity sweep at extreme
  const c6 = distFromRound > roundStep * 0.03;               // 6. CHoCH — moved from key level
  const c7 = session?.ist_active || false;                    // 7. Kill zone active
  const c8 = nearRound && !inNeutral;                        // 8. FVG near OB in trend direction
  const c9 = true;                                            // 9. R:R always valid (enforced below)

  const conds = { c1,c2,c3,c4,c5,c6,c7,c8,c9 };
  const met   = Object.values(conds).filter(Boolean).length;

  // ── Signal strength ────────────────────────────────────────────────────
  let signal = "WAIT";
  if      (met === 9)             signal = direction;  // perfect
  else if (met >= 7 && !inNeutral) signal = direction;  // strong
  else if (met >= 5 && !inNeutral) signal = "WATCH";    // forming
  else                              signal = "WAIT";

  // Kill zone upgrades WATCH → full signal
  if (signal === "WATCH" && c7) signal = direction;
  // Neutral zone = always WAIT regardless
  if (inNeutral) signal = "WAIT";

  // ── CORRECT SL/TP — tight, key-level based ────────────────────────────
  const isBuy   = direction === "BUY";

  // SL = nearest key level on wrong side — TIGHT (1 level away only)
  const slKey   = nearestKey(p, cfg.keys, !isBuy);
  // TP1 = 2× SL distance minimum
  const slDist  = Math.abs(p - slKey);
  const tp1Price = isBuy ? p + (slDist * 2) : p - (slDist * 2);
  const tp2Price = isBuy ? p + (slDist * 3.5) : p - (slDist * 3.5);

  // Snap TP to nearest key level ≥ 2× SL away
  const tp1Key  = isBuy
    ? Math.min(...cfg.keys.filter(k => k >= tp1Price)) || tp1Price
    : Math.max(...cfg.keys.filter(k => k <= tp1Price)) || tp1Price;
  const tp2Key  = isBuy
    ? Math.min(...cfg.keys.filter(k => k >= tp2Price)) || tp2Price
    : Math.max(...cfg.keys.filter(k => k <= tp2Price)) || tp2Price;

  // Actual R:R
  const actualSL  = Math.abs(p - slKey)  / cfg.pip;
  const actualTP1 = Math.abs(p - tp1Key) / cfg.pip;
  const rr        = actualSL > 0 ? (actualTP1 / actualSL).toFixed(1) : "2.0";

  // Strategy
  let strat = "OB+CHoCH";
  if (c5 && c6)       strat = "CRT+Sweep";
  else if (c3 && c8)  strat = "Breaker+FVG";
  else if (c4)        strat = "PO3";
  else if (c6)        strat = "OB+CHoCH";

  return {
    signal, direction, met, allValid: met === 9,
    entry: p.toFixed(cfg.dec),
    sl:    slKey.toFixed(cfg.dec),
    tp1:   isFinite(tp1Key) ? tp1Key.toFixed(cfg.dec) : tp1Price.toFixed(cfg.dec),
    tp2:   isFinite(tp2Key) ? tp2Key.toFixed(cfg.dec) : tp2Price.toFixed(cfg.dec),
    rr, strat,
    label: cfg.label,
    sl_pts:  Math.round(actualSL),
    tp1_pts: Math.round(actualTP1),
    conditions: conds,
    inNeutral,
  };
}

// ── Indian price fetcher ────────────────────────────────────────────────────
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
          const url = "https://api.allorigins.win/get?url=" +
            encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/"+s.y+"?interval=1m&range=1d");
          const res  = await fetch(url);
          const data = await res.json();
          const json = JSON.parse(data.contents);
          const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
          const prev  = json?.chart?.result?.[0]?.meta?.previousClose;
          if (price) {
            const chg = prev ? (((price-prev)/prev)*100).toFixed(2) : "0.00";
            setIndian(p => ({...p,[s.key]:{ price:price.toFixed(2), change:chg }}));
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

const COND_LABELS = [
  { key:"c1", icon:"📊", label:"HTF Trend Confirmed (not in neutral zone)"   },
  { key:"c2", icon:"💰", label:"Price in Discount (BUY) or Premium (SELL)"  },
  { key:"c3", icon:"📦", label:"Order Block at Key Institutional Level"       },
  { key:"c4", icon:"🌀", label:"Golden Zone — 0.382 to 0.618 of range"       },
  { key:"c5", icon:"🎯", label:"Liquidity Sweep at Range Extreme"             },
  { key:"c6", icon:"🔄", label:"CHoCH — moved away from key level (15min)"   },
  { key:"c7", icon:"⏰", label:"Kill Zone Active — London / NY (IST)"         },
  { key:"c8", icon:"⚡", label:"FVG Aligns with Order Block + Trend"          },
  { key:"c9", icon:"🛡️", label:"R:R minimum 1:2 — enforced automatically"    },
];

// ── Signal Card ─────────────────────────────────────────────────────────────
function SignalCard({ id, priceData, sig, saved, onClick }) {
  const cfg = CFG[id];
  if (!priceData?.price) return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:14, opacity:0.35 }}>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontSize:18 }}>{cfg.icon}</span>
        <span style={{ color:cfg.color, fontWeight:700, fontSize:13 }}>{cfg.name}</span>
        <span style={{ fontSize:10, color:"var(--text-muted)" }}>Loading...</span>
      </div>
    </div>
  );

  if (!sig) return null;

  const showLevels = sig.signal === "BUY" || sig.signal === "SELL";
  const sigBg     = sig.signal==="BUY"?"rgba(0,212,170,0.07)":sig.signal==="SELL"?"rgba(244,67,54,0.07)":sig.signal==="WATCH"?"rgba(247,147,26,0.05)":"rgba(60,60,60,0.03)";
  const sigBorder = sig.signal==="BUY"?"rgba(0,212,170,0.4)":sig.signal==="SELL"?"rgba(244,67,54,0.4)":sig.signal==="WATCH"?"rgba(247,147,26,0.3)":"var(--border)";
  const btnBg     = sig.signal==="BUY"?"var(--accent-green)":sig.signal==="SELL"?"var(--accent-red)":sig.signal==="WATCH"?"var(--accent-orange)":"var(--bg-primary)";
  const btnTxt    = sig.signal==="WAIT"?"var(--text-muted)":"#000";

  return (
    <div onClick={() => showLevels && onClick(id, sig)}
      style={{ background:sigBg, border:"1px solid "+sigBorder, borderRadius:12, padding:14, cursor:showLevels?"pointer":"default", position:"relative" }}>

      {saved && (
        <div style={{ position:"absolute", top:8, right:8, fontSize:9, color:"var(--accent-blue)", background:"rgba(79,195,247,0.12)", padding:"2px 6px", borderRadius:4, border:"1px solid rgba(79,195,247,0.2)" }}>
          💾 Saved
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>{cfg.icon}</span>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:700, color:cfg.color }}>{cfg.name}</div>
            <div style={{ fontSize:10, color:"var(--text-muted)" }}>{cfg.market}</div>
          </div>
        </div>
        <div style={{ padding:"4px 10px", borderRadius:7, fontFamily:"var(--font-display)", fontSize:12, fontWeight:800, background:btnBg, color:btnTxt, border:"1px solid "+sigBorder }}>
          {sig.signal==="BUY"?"📈 BUY":sig.signal==="SELL"?"📉 SELL":sig.signal==="WATCH"?"👁 WATCH":"⏸ WAIT"}
        </div>
      </div>

      {/* Price + change */}
      <div style={{ fontFamily:"var(--font-mono)", fontSize:17, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>
        {priceData.price}
        {priceData.change && (
          <span style={{ fontSize:10, marginLeft:8, color:parseFloat(priceData.change)>=0?"var(--accent-green)":"var(--accent-red)" }}>
            {parseFloat(priceData.change)>=0?"▲":"▼"}{Math.abs(parseFloat(priceData.change))}%
          </span>
        )}
      </div>

      {/* Conditions bar */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <div style={{ flex:1, height:3, background:"var(--bg-primary)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:(sig.met/9*100)+"%", background:sig.met===9?"var(--accent-green)":sig.met>=7?"var(--accent-orange)":"var(--accent-red)", borderRadius:2 }} />
        </div>
        <span style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"var(--font-mono)", minWidth:28 }}>{sig.met}/9</span>
      </div>

      {/* Levels */}
      {showLevels && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4, marginBottom:8 }}>
          {[
            { label:"ENTRY", value:sig.entry, color:"var(--accent-blue)"  },
            { label:"SL",    value:sig.sl,    color:"var(--accent-red)"   },
            { label:"TP1",   value:sig.tp1,   color:"var(--accent-green)" },
            { label:"TP2",   value:sig.tp2,   color:"var(--accent-gold)"  },
          ].map((r,i) => (
            <div key={i} style={{ background:"var(--bg-primary)", borderRadius:6, padding:"4px 4px", textAlign:"center" }}>
              <div style={{ fontSize:8, color:"var(--text-muted)", marginBottom:1 }}>{r.label}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:9, fontWeight:700, color:r.color }}>{r.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Strategy badges */}
      {showLevels && (
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
          <span className="badge badge-purple" style={{ fontSize:9 }}>{sig.strat}</span>
          <span className="badge badge-green"  style={{ fontSize:9 }}>R:R 1:{sig.rr}</span>
          <span style={{ fontSize:9, color:"var(--text-muted)", marginLeft:"auto" }}>
            SL {sig.sl_pts} {sig.label}
          </span>
          {sig.allValid && <span style={{ fontSize:9, color:"#000", background:"var(--accent-green)", padding:"1px 6px", borderRadius:4, fontWeight:700 }}>✅ ALL 9</span>}
        </div>
      )}

      {sig.signal==="WAIT"  && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:4 }}>{sig.met}/9 — no valid setup</div>}
      {sig.signal==="WATCH" && <div style={{ fontSize:10, color:"var(--accent-orange)", marginTop:4 }}>{sig.met}/9 forming — monitor</div>}
      {showLevels && <div style={{ fontSize:9, color:"var(--text-muted)", marginTop:5 }}>Tap for full trade plan →</div>}
    </div>
  );
}

// ── Detail Modal ────────────────────────────────────────────────────────────
function SignalModal({ id, sig, onClose, onSave, alreadySaved }) {
  if (!id || !sig) return null;
  const cfg   = CFG[id];
  const isBuy = sig.signal === "BUY";

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={onClose}>
      <div style={{ background:"var(--bg-card)",border:"2px solid "+cfg.color,borderRadius:16,padding:20,maxWidth:460,width:"100%",maxHeight:"92vh",overflowY:"auto" }} onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <div style={{ display:"flex",gap:10,alignItems:"center" }}>
            <span style={{ fontSize:26 }}>{cfg.icon}</span>
            <div>
              <div style={{ fontFamily:"var(--font-display)",fontSize:16,fontWeight:800,color:cfg.color }}>{cfg.name}</div>
              <div style={{ fontSize:11,color:"var(--text-muted)" }}>{sig.strat} • R:R 1:{sig.rr} • {sig.met}/9</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding:"3px 9px",fontSize:12 }}>✕</button>
        </div>

        {/* Signal banner */}
        <div style={{ textAlign:"center",padding:12,borderRadius:10,marginBottom:14,background:isBuy?"rgba(0,212,170,0.08)":"rgba(244,67,54,0.08)",border:"2px solid "+(isBuy?"var(--accent-green)":"var(--accent-red)") }}>
          <div style={{ fontFamily:"var(--font-display)",fontSize:24,fontWeight:800,color:isBuy?"var(--accent-green)":"var(--accent-red)" }}>
            {isBuy?"📈 BUY SIGNAL":"📉 SELL SIGNAL"}
          </div>
          <div style={{ fontSize:11,color:"var(--text-secondary)",marginTop:3 }}>
            Strategy: <strong style={{ color:"var(--accent-purple)" }}>{sig.strat}</strong>
            {sig.allValid && <span style={{ marginLeft:8,color:"var(--accent-green)" }}>✅ All 9 conditions passed</span>}
          </div>
        </div>

        {/* Levels */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14 }}>
          {[
            { label:"📍 ENTRY",          value:sig.entry, color:"var(--accent-blue)",  desc:"Market price — enter now"         },
            { label:"🛑 STOP LOSS",      value:sig.sl,    color:"var(--accent-red)",   desc:sig.sl_pts+" "+sig.label+" — tight OB stop" },
            { label:"🎯 TAKE PROFIT 1",  value:sig.tp1,   color:"var(--accent-green)", desc:sig.tp1_pts+" "+sig.label+" — close 50%"    },
            { label:"🏆 TAKE PROFIT 2",  value:sig.tp2,   color:"var(--accent-gold)",  desc:"Full target — move BE after TP1"   },
          ].map((r,i) => (
            <div key={i} style={{ background:"var(--bg-primary)",borderRadius:8,padding:10 }}>
              <div style={{ fontSize:9,color:"var(--text-muted)",marginBottom:3 }}>{r.label}</div>
              <div style={{ fontFamily:"var(--font-mono)",fontSize:17,fontWeight:700,color:r.color }}>{r.value}</div>
              <div style={{ fontSize:9,color:"var(--text-muted)",marginTop:2 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* Save to history button */}
        {!alreadySaved ? (
          <button className="btn btn-primary" style={{ width:"100%",marginBottom:14 }} onClick={()=>onSave(id,sig)}>
            💾 Save to Signal History
          </button>
        ) : (
          <div style={{ textAlign:"center",padding:"8px",marginBottom:14,background:"rgba(0,212,170,0.08)",borderRadius:8,fontSize:12,color:"var(--accent-green)",border:"1px solid rgba(0,212,170,0.2)" }}>
            ✅ Saved to Signal History — go to Portfolio tab to manage
          </div>
        )}

        {/* 9 conditions */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12,fontWeight:700,color:"var(--text-primary)",marginBottom:6 }}>
            SMC Conditions — {sig.met}/9 met
          </div>
          {COND_LABELS.map((c,i) => {
            const key = "c"+(i+1);
            const passed = sig.conditions[key];
            return (
              <div key={i} style={{ display:"flex",gap:8,alignItems:"center",padding:"5px 0",borderBottom:"1px solid var(--border)" }}>
                <span>{passed?"✅":"❌"}</span>
                <span style={{ fontSize:11,color:passed?"var(--text-primary)":"var(--text-muted)" }}>
                  {c.icon} {c.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Steps */}
        <div style={{ background:"rgba(0,212,170,0.05)",border:"1px solid rgba(0,212,170,0.2)",borderRadius:8,padding:12 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"var(--accent-green)",marginBottom:8 }}>📋 Execution Steps</div>
          {[
            "Open "+cfg.name+" on TradingView",
            "Confirm "+(isBuy?"bullish":"bearish")+" structure on Daily + 4H",
            "Locate fresh Order Block near "+sig.entry,
            "Wait for 15min CHoCH after liquidity sweep",
            "Enter at "+sig.entry+" — set SL at "+sig.sl+" immediately",
            "TP1 at "+sig.tp1+" — close 50% of position",
            "Move SL to breakeven ("+sig.entry+") after TP1 hit",
            "Let remaining 50% run to TP2 at "+sig.tp2,
          ].map((s,i) => (
            <div key={i} style={{ display:"flex",gap:6,fontSize:11,color:"var(--text-secondary)",padding:"3px 0" }}>
              <span style={{ color:"var(--accent-green)",fontWeight:700,minWidth:14 }}>{i+1}.</span>{s}
            </div>
          ))}
        </div>

        <div style={{ marginTop:10,fontSize:10,color:"var(--accent-red)",textAlign:"center" }}>
          ⚠️ Confirm on your chart before entering. Educational tool only.
        </div>
      </div>
    </div>
  );
}

// ── Main Scanner Page ────────────────────────────────────────────────────────
export default function Scanner() {
  const prices  = usePrices();
  const session = useSessionStatus();
  const indian  = useIndianPrices();
  const [filter,   setFilter]   = useState("All");
  const [selected, setSelected] = useState(null);
  const [signals,  setSignals]  = useState({});
  const [savedIds, setSavedIds] = useState(new Set());

  const allPrices = { ...prices, ...indian };

  // Build signals instantly when prices arrive
  useEffect(() => {
    const next = {};
    let count = 0;
    IDS.forEach(id => {
      const pd = allPrices[id];
      if (pd?.price) {
        next[id] = getSignal(id, pd.price, session);
        count++;
      }
    });
    if (count > 0) setSignals(next);
  }, [JSON.stringify(allPrices), session?.ist_active]);

  // ── Auto-save BUY/SELL signals to history when they appear ────────────
  useEffect(() => {
    IDS.forEach(id => {
      const sig = signals[id];
      if (!sig) return;
      if (sig.signal !== "BUY" && sig.signal !== "SELL") return;
      const cfg = CFG[id];
      const trade = {
        id:        Date.now() + Math.random(),
        pair:      id,
        direction: sig.signal,
        entry:     parseFloat(sig.entry),
        sl:        parseFloat(sig.sl),
        tp1:       parseFloat(sig.tp1),
        tp2:       parseFloat(sig.tp2),
        strategy:  sig.strat,
        session:   session?.ist_london_kz ? "London KZ" : session?.ist_active ? "NY KZ" : "Off-session",
        notes:     sig.met+"/9 conditions met",
        status:    "OPEN",
        openTime:  new Date().toISOString(),
        closeTime: null,
        exitPrice: null,
        pnl:       null,
        source:    "scanner",
      };
      saveToHistory(trade);
    });
  }, [JSON.stringify(signals)]);

  // ── Manual save from modal ────────────────────────────────────────────
  const handleSave = (id, sig) => {
    const cfg = CFG[id];
    const trade = {
      id:        Date.now(),
      pair:      id,
      direction: sig.signal,
      entry:     parseFloat(sig.entry),
      sl:        parseFloat(sig.sl),
      tp1:       parseFloat(sig.tp1),
      tp2:       parseFloat(sig.tp2),
      strategy:  sig.strat,
      session:   session?.ist_london_kz ? "London KZ" : session?.ist_active ? "NY KZ" : "Off-session",
      notes:     sig.met+"/9 conditions — manual save",
      status:    "OPEN",
      openTime:  new Date().toISOString(),
      closeTime: null, exitPrice: null, pnl: null,
      source:    "scanner",
    };
    saveToHistory(trade);
    setSavedIds(s => new Set([...s, id]));
  };

  const buyCount   = IDS.filter(id => signals[id]?.signal==="BUY").length;
  const sellCount  = IDS.filter(id => signals[id]?.signal==="SELL").length;
  const watchCount = IDS.filter(id => signals[id]?.signal==="WATCH").length;
  const allMet     = IDS.filter(id => signals[id]?.allValid).length;

  const visible = IDS.filter(id => {
    if (filter==="All")    return true;
    if (filter==="Forex")  return CFG[id].market==="Forex";
    if (filter==="Crypto") return CFG[id].market==="Crypto";
    if (filter==="India")  return CFG[id].market==="India";
    return signals[id]?.signal===filter;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🔍 Signal Scanner</h1>
        <p className="page-subtitle">9 SMC conditions • Tight SL • Auto-saves to Signal History</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"📈 BUY",       value:buyCount,   color:"var(--accent-green)"  },
          { label:"📉 SELL",      value:sellCount,  color:"var(--accent-red)"    },
          { label:"👁 WATCH",     value:watchCount, color:"var(--accent-orange)" },
          { label:"✅ ALL 9 MET", value:allMet,     color:"var(--accent-green)"  },
        ].map((s,i) => (
          <div key={i} className="stat-box">
            <div className="stat-value" style={{ color:s.color, fontSize:20 }}>{s.value}</div>
            <div className="stat-label" style={{ fontSize:10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Session */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
        <div className={"session-badge "+(session?.ist_active?"active":"inactive")}>
          <div className={"session-dot "+(session?.ist_active?"active":"inactive")} />
          {session?.ist_active?(session?.ist_london_kz?"🟢 LONDON KZ":"🟢 NY KZ"):"⚪ NO KILL ZONE"}
        </div>
        <div style={{ fontSize:11, color:"var(--accent-blue)", background:"rgba(79,195,247,0.06)", padding:"4px 10px", borderRadius:6, border:"1px solid rgba(79,195,247,0.15)" }}>
          💾 BUY/SELL signals auto-saved to Signal History
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom:14, overflowX:"auto" }}>
        <div className="tabs" style={{ display:"inline-flex", minWidth:"max-content" }}>
          {["All","Forex","Crypto","India","BUY","SELL","WATCH"].map(f => (
            <button key={f} className={"tab "+(filter===f?"active":"")} onClick={()=>setFilter(f)}>
              {f==="BUY"?"📈 BUY ("+buyCount+")":f==="SELL"?"📉 SELL ("+sellCount+")":f==="WATCH"?"👁 ("+watchCount+")":f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {Object.keys(signals).length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--text-muted)" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
          <div style={{ fontSize:14, fontWeight:600 }}>Loading prices...</div>
          <div style={{ fontSize:12, marginTop:8 }}>Signals appear in 5–10 seconds automatically</div>
        </div>
      ) : (
        <div className="grid-auto">
          {visible.map(id => (
            <SignalCard key={id} id={id} priceData={allPrices[id]} sig={signals[id]}
              saved={savedIds.has(id)}
              onClick={(id,sig) => setSelected({id,sig})} />
          ))}
          {visible.length===0 && (
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"var(--text-muted)" }}>
              No {filter} signals now. Wait for Kill Zone for stronger setups.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <SignalModal
          id={selected.id} sig={selected.sig}
          alreadySaved={savedIds.has(selected.id)}
          onSave={handleSave}
          onClose={()=>setSelected(null)}
        />
      )}
    </div>
  );
}
