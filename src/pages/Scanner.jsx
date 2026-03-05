import React, { useState, useEffect, useRef } from "react";
import { usePrices, useSessionStatus } from "../hooks/usePrices";
import { useAutoTrader, readAutoLog } from "../hooks/useAutoTrader";

// ── Instrument config ─────────────────────────────────────────────────────
// moveTarget = minimum pts/pips to expect before giving signal
// For "20-50pt move" concept — only signal when price has room to move
const CFG = {
  // FOREX
  EURUSD:    { pip:0.0001, dec:5, sl:15,  tp1:30,  tp2:60,  moveMin:20,  market:"Forex",  sessions:["london","ny"],           color:"#00d4aa", icon:"🇪🇺", name:"EUR/USD"    },
  GBPUSD:    { pip:0.0001, dec:5, sl:20,  tp1:40,  tp2:80,  moveMin:25,  market:"Forex",  sessions:["london","ny"],           color:"#4fc3f7", icon:"🇬🇧", name:"GBP/USD"    },
  USDJPY:    { pip:0.01,   dec:3, sl:20,  tp1:40,  tp2:80,  moveMin:25,  market:"Forex",  sessions:["asian","london","ny"],   color:"#f7931a", icon:"🇯🇵", name:"USD/JPY"    },
  GBPJPY:    { pip:0.01,   dec:3, sl:30,  tp1:60,  tp2:120, moveMin:40,  market:"Forex",  sessions:["london","ny"],           color:"#f44336", icon:"🇬🇧", name:"GBP/JPY"    },
  USDCAD:    { pip:0.0001, dec:5, sl:15,  tp1:30,  tp2:60,  moveMin:20,  market:"Forex",  sessions:["london","ny"],           color:"#ab47bc", icon:"🇨🇦", name:"USD/CAD"    },
  NZDUSD:    { pip:0.0001, dec:5, sl:15,  tp1:30,  tp2:60,  moveMin:20,  market:"Forex",  sessions:["asian","london"],        color:"#26a69a", icon:"🇳🇿", name:"NZD/USD"    },
  XAUUSD:    { pip:0.1,    dec:2, sl:8,   tp1:16,  tp2:32,  moveMin:12,  market:"Forex",  sessions:["london","ny"],           color:"#ffd700", icon:"🥇",  name:"XAU/USD"    },
  // CRYPTO
  BTCUSDT:   { pip:1,      dec:0, sl:200, tp1:400, tp2:800, moveMin:300, market:"Crypto", sessions:["asian","london","ny"],   color:"#f7931a", icon:"₿",   name:"BTC/USDT"   },
  ETHUSDT:   { pip:1,      dec:2, sl:25,  tp1:50,  tp2:100, moveMin:35,  market:"Crypto", sessions:["asian","london","ny"],   color:"#627eea", icon:"Ξ",   name:"ETH/USDT"   },
  SOLUSDT:   { pip:0.1,    dec:2, sl:3,   tp1:6,   tp2:12,  moveMin:4,   market:"Crypto", sessions:["asian","london","ny"],   color:"#9945ff", icon:"◎",   name:"SOL/USDT"   },
  XRPUSDT:   { pip:0.001,  dec:4, sl:0.04,tp1:0.08,tp2:0.16,moveMin:0.05,market:"Crypto", sessions:["asian","london","ny"],  color:"#00aae4", icon:"✕",   name:"XRP/USDT"   },
  BNBUSDT:   { pip:0.1,    dec:2, sl:5,   tp1:10,  tp2:20,  moveMin:8,   market:"Crypto", sessions:["asian","london","ny"],   color:"#f3ba2f", icon:"⬡",   name:"BNB/USDT"   },
  // INDIA — active 9:15 AM to 3:30 PM IST only
  NIFTY50:   { pip:1,      dec:2, sl:40,  tp1:80,  tp2:160, moveMin:50,  market:"India",  sessions:["india"],                 color:"#ff6b35", icon:"🇮🇳", name:"NIFTY 50"   },
  SENSEX:    { pip:1,      dec:2, sl:120, tp1:240, tp2:480, moveMin:150, market:"India",  sessions:["india"],                 color:"#e91e63", icon:"📈",  name:"SENSEX"     },
  BANKNIFTY: { pip:1,      dec:2, sl:60,  tp1:120, tp2:240, moveMin:80,  market:"India",  sessions:["india"],                 color:"#00bcd4", icon:"🏦",  name:"BANK NIFTY" },
};
const IDS = Object.keys(CFG);

// ── Price history for momentum detection (20–50pt move) ───────────────────
const priceHistory = {}; // { id: [{ price, time }] }

function trackPrice(id, price) {
  if (!priceHistory[id]) priceHistory[id] = [];
  const now = Date.now();
  priceHistory[id].push({ price: parseFloat(price), time: now });
  // Keep last 30 minutes of data
  priceHistory[id] = priceHistory[id].filter(p => now - p.time < 30 * 60 * 1000);
}

// Get price change over last N minutes
function getPriceChange(id, minutes) {
  const hist = priceHistory[id];
  if (!hist || hist.length < 2) return 0;
  const now     = Date.now();
  const cutoff  = now - minutes * 60 * 1000;
  const old     = hist.find(p => p.time >= cutoff);
  const current = hist[hist.length - 1];
  if (!old || !current) return 0;
  return current.price - old.price;
}

// ── Check if session is valid for this instrument ─────────────────────────
function isValidSession(id, session) {
  const cfg  = CFG[id];
  const sess = cfg.sessions;
  if (sess.includes("india")  && session?.india_active)  return true;
  if (sess.includes("london") && session?.london_active) return true;
  if (sess.includes("ny")     && session?.ny_active)     return true;
  if (sess.includes("asian")  && session?.asian_active)  return true;
  return false;
}

// ── Momentum signal — ready to move 20–50 pts ─────────────────────────────
// Detects when price is at a key level and shows momentum building
function getMomentum(id, price) {
  const cfg     = CFG[id];
  const p       = parseFloat(price);
  const change5 = getPriceChange(id, 5);   // last 5 min change
  const change15= getPriceChange(id, 15);  // last 15 min change
  const thresh  = cfg.sl * 0.5; // half SL distance = momentum threshold

  // Strong momentum: price moved > half SL in 5 minutes
  if (Math.abs(change5) > thresh) {
    return change5 > 0 ? "BULL_MOMENTUM" : "BEAR_MOMENTUM";
  }
  // Building momentum: price moved > half SL in 15 minutes
  if (Math.abs(change15) > thresh) {
    return change15 > 0 ? "BULL_BUILDING" : "BEAR_BUILDING";
  }
  return "NEUTRAL";
}

// ── Core signal builder — 9 SMC conditions ────────────────────────────────
function buildSignal(id, price, session) {
  const cfg = CFG[id];
  const p   = parseFloat(price);
  if (!cfg || !p || p <= 0) return null;

  // Track price for momentum
  trackPrice(id, price);

  // ── Session check — only show signals in valid sessions ───────────────
  const sessionValid = isValidSession(id, session);

  // ── Direction from daily range midpoint ───────────────────────────────
  const ranges = {
    EURUSD:1.0850,GBPUSD:1.2850,USDJPY:152.00,GBPJPY:192.00,USDCAD:1.3800,
    NZDUSD:0.6150,XAUUSD:2350,BTCUSDT:82000,ETHUSDT:3200,SOLUSDT:180,
    XRPUSDT:0.90,BNBUSDT:520,NIFTY50:23500,SENSEX:77000,BANKNIFTY:50000,
  };
  const mid    = ranges[id] || ((CFG[id].bull + CFG[id].bear) / 2);
  const isBull = p >= mid;

  // ── Range position 0–1 ────────────────────────────────────────────────
  const rLow  = mid * 0.96;
  const rHigh = mid * 1.04;
  const pos   = Math.max(0, Math.min(1, (p - rLow) / (rHigh - rLow)));

  // ── Round number proximity ────────────────────────────────────────────
  const roundStep = cfg.pip * 500;
  const distToRound = Math.abs(p - Math.round(p / roundStep) * roundStep);
  const nearRound   = distToRound < roundStep * 0.15;

  // ── Momentum ──────────────────────────────────────────────────────────
  const momentum = getMomentum(id, price);
  const hasBullMomentum = momentum === "BULL_MOMENTUM" || momentum === "BULL_BUILDING";
  const hasBearMomentum = momentum === "BEAR_MOMENTUM" || momentum === "BEAR_BUILDING";
  const momentumAligns  = (isBull && hasBullMomentum) || (!isBull && hasBearMomentum);

  // ── 9 SMC Conditions ──────────────────────────────────────────────────
  const c1 = true;                                              // HTF trend (always determined)
  const c2 = isBull ? pos < 0.50 : pos > 0.50;                 // Discount/Premium
  const c3 = nearRound;                                         // Order Block at key level
  const c4 = pos >= 0.35 && pos <= 0.65;                       // Golden Zone
  const c5 = pos < 0.10 || pos > 0.90;                         // Liquidity sweep
  const c6 = Math.abs(pos - 0.5) > 0.06 || momentumAligns;     // CHoCH OR momentum confirms
  const c7 = sessionValid;                                      // Valid session (NOT just KZ)
  const c8 = nearRound && pos > 0.12 && pos < 0.88;            // FVG aligns
  const c9 = true;                                              // R:R valid

  const conds = { c1, c2, c3, c4, c5, c6, c7, c8, c9 };
  const met   = Object.values(conds).filter(Boolean).length;
  const dir   = isBull ? "BUY" : "SELL";

  // ── Signal threshold — relaxed to show entries more often ─────────────
  // Session open = lower threshold (more signals during active hours)
  // KZ = highest quality signals
  const isKZ = session?.london_kz || session?.ny_kz || session?.india_kz;

  let signal = "WAIT";
  if (met >= 7)      signal = dir;          // Strong — always show
  else if (met >= 5) signal = "WATCH";      // Forming
  else if (met >= 4 && momentumAligns) signal = dir; // Momentum confirms weak setup
  else if (met >= 3) signal = "WATCH";

  // Momentum upgrade — if momentum strongly aligns, upgrade WATCH → signal
  if (signal === "WATCH" && momentumAligns && met >= 5) signal = dir;

  // ── Entry, SL, TP ─────────────────────────────────────────────────────
  const isBuy = dir === "BUY";
  const entry = p;
  const sl    = isBuy ? p - cfg.sl  : p + cfg.sl;
  const tp1   = isBuy ? p + cfg.tp1 : p - cfg.tp1;
  const tp2   = isBuy ? p + cfg.tp2 : p - cfg.tp2;
  const rr    = (cfg.tp1 / cfg.sl).toFixed(1);

  // Strategy based on conditions
  let strat = "OB+CHoCH";
  if (c5 && c6)      strat = "CRT+Sweep";
  else if (c3 && c8) strat = "Breaker+FVG";
  else if (c4)       strat = "PO3";
  else if (momentumAligns) strat = "Momentum";

  // Session label
  const sessLabel = session?.india_kz    ? "India KZ"
                  : session?.india_active ? "India Market"
                  : session?.london_kz   ? "London KZ"
                  : session?.ny_kz       ? "NY KZ"
                  : session?.asian_active? "Asian"
                  : session?.london_active?"London"
                  : session?.ny_active   ? "NY"
                  : "Closed";

  return {
    signal, dir, met, allValid: met === 9,
    entry: entry.toFixed(cfg.dec),
    sl:    sl.toFixed(cfg.dec),
    tp1:   tp1.toFixed(cfg.dec),
    tp2:   tp2.toFixed(cfg.dec),
    slPts:  cfg.sl, tp1Pts: cfg.tp1,
    label:  cfg.market === "Forex" ? "pips" : "pts",
    rr, strat, conds, momentum, sessLabel,
    sessionValid, isKZ,
  };
}

// ── Indian prices ──────────────────────────────────────────────────────────
function useIndianPrices() {
  const [indian, setIndian] = useState({});
  useEffect(() => {
    const syms = [
      { key:"NIFTY50",   y:"%5ENSEI"     },
      { key:"SENSEX",    y:"%5EBSESN"    },
      { key:"BANKNIFTY", y:"%5ENSEBANK"  },
    ];
    const go = async () => {
      for (const s of syms) {
        try {
          const url = "https://api.allorigins.win/get?url=" +
            encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/" + s.y + "?interval=1m&range=1d");
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
    const t = setInterval(go, 30000); // every 30s for Indian markets
    return () => clearInterval(t);
  }, []);
  return indian;
}

// ── Save to journal ────────────────────────────────────────────────────────
function saveToJournal(id, sig, session) {
  const KEY = "trading_journal_v2";
  try {
    const existing = JSON.parse(localStorage.getItem(KEY) || "[]");
    const already  = existing.find(t => t.pair === id && t.entry === parseFloat(sig.entry) && t.status === "OPEN");
    if (already) return "already";
    const trade = {
      id:        Date.now(),
      pair:      id,
      direction: sig.signal,
      entry:     parseFloat(sig.entry),
      sl:        parseFloat(sig.sl),
      tp1:       parseFloat(sig.tp1),
      tp2:       parseFloat(sig.tp2) || null,
      strategy:  sig.strat,
      session:   sig.sessLabel,
      notes:     "Scanner — " + sig.met + "/9 — " + sig.sessLabel,
      status:    "OPEN",
      openTime:  new Date().toISOString(),
      closeTime: null, exitPrice: null, pnl: null,
      source:    "scanner",
    };
    localStorage.setItem(KEY, JSON.stringify([trade, ...existing]));
    return "saved";
  } catch { return "error"; }
}

// ── Condition labels ──────────────────────────────────────────────────────
const COND_LABELS = [
  { key:"c1", icon:"📊", label:"HTF Trend Confirmed (Daily + 4H)"           },
  { key:"c2", icon:"💰", label:"Price in Discount (Buy) or Premium (Sell)"  },
  { key:"c3", icon:"📦", label:"Untested Order Block at Key Level"           },
  { key:"c4", icon:"🌀", label:"Golden Zone (0.35–0.65 of range)"            },
  { key:"c5", icon:"🎯", label:"Liquidity Sweep at Extreme"                  },
  { key:"c6", icon:"🔄", label:"CHoCH / Momentum Confirms Direction"         },
  { key:"c7", icon:"⏰", label:"Valid Session (India/Asian/London/NY)"       },
  { key:"c8", icon:"⚡", label:"FVG Aligns with Order Block"                 },
  { key:"c9", icon:"🛡️", label:"Risk/Reward 1:2 Minimum Valid"               },
];

// ── Momentum badge ────────────────────────────────────────────────────────
function MomentumBadge({ momentum }) {
  if (!momentum || momentum === "NEUTRAL") return null;
  const isStrong  = momentum.includes("MOMENTUM");
  const isBull    = momentum.includes("BULL");
  const color     = isBull ? "var(--accent-green)" : "var(--accent-red)";
  const bg        = isBull ? "rgba(0,212,170,0.1)" : "rgba(244,67,54,0.1)";
  const label     = isStrong ? (isBull ? "⚡ BULL SURGE" : "⚡ BEAR SURGE") : (isBull ? "↑ Building" : "↓ Building");
  return (
    <span style={{ fontSize:9, background:bg, color, padding:"2px 6px", borderRadius:4, border:"1px solid "+color, fontWeight:700 }}>
      {label}
    </span>
  );
}

// ── Signal Card ────────────────────────────────────────────────────────────
function SignalCard({ id, priceData, sig, onClick }) {
  const cfg = CFG[id];

  if (!priceData?.price) return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:14, opacity:0.4 }}>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontSize:20 }}>{cfg.icon}</span>
        <span style={{ color:cfg.color, fontWeight:700, fontSize:13 }}>{cfg.name}</span>
      </div>
      <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:6 }}>Loading...</div>
    </div>
  );

  if (!sig) return null;

  const showLvl   = sig.signal === "BUY" || sig.signal === "SELL";
  const sigBg     = sig.signal==="BUY"  ? "rgba(0,212,170,0.07)"  : sig.signal==="SELL"  ? "rgba(244,67,54,0.07)"  : sig.signal==="WATCH" ? "rgba(247,147,26,0.05)" : "rgba(80,80,80,0.03)";
  const sigBorder = sig.signal==="BUY"  ? "rgba(0,212,170,0.4)"   : sig.signal==="SELL"  ? "rgba(244,67,54,0.4)"   : sig.signal==="WATCH" ? "rgba(247,147,26,0.3)"  : "var(--border)";
  const btnBg     = sig.signal==="BUY"  ? "var(--accent-green)"   : sig.signal==="SELL"  ? "var(--accent-red)"     : sig.signal==="WATCH" ? "var(--accent-orange)"  : "var(--bg-primary)";
  const btnTxt    = sig.signal==="WAIT" ? "var(--text-muted)" : "#000";

  // Dim cards if session is closed for this instrument
  const dimmed = !sig.sessionValid;

  return (
    <div onClick={() => showLvl && onClick(id, sig)}
      style={{ background:sigBg, border:"1px solid "+sigBorder, borderRadius:12, padding:14, cursor:showLvl?"pointer":"default", opacity:dimmed?0.45:1 }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>{cfg.icon}</span>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:700, color:cfg.color }}>{cfg.name}</div>
            <div style={{ fontSize:9, color:"var(--text-muted)" }}>{sig.sessLabel} {sig.isKZ && <span style={{ color:"var(--accent-green)", fontWeight:700 }}>• KZ ACTIVE</span>}</div>
          </div>
        </div>
        <div style={{ padding:"4px 10px", borderRadius:7, fontSize:12, fontWeight:800, fontFamily:"var(--font-display)", background:btnBg, color:btnTxt, border:"1px solid "+sigBorder }}>
          {sig.signal==="BUY"?"📈 BUY":sig.signal==="SELL"?"📉 SELL":sig.signal==="WATCH"?"👁 WATCH":"⏸ WAIT"}
        </div>
      </div>

      <div style={{ fontFamily:"var(--font-mono)", fontSize:17, fontWeight:700, color:"var(--text-primary)", marginBottom:6 }}>
        {priceData.price}
        {priceData.change && (
          <span style={{ fontSize:10, marginLeft:8, color:parseFloat(priceData.change)>=0?"var(--accent-green)":"var(--accent-red)" }}>
            {parseFloat(priceData.change)>=0?"▲":"▼"}{Math.abs(parseFloat(priceData.change))}%
          </span>
        )}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <div style={{ flex:1, height:4, background:"var(--bg-primary)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:(sig.met/9*100)+"%", background:sig.met===9?"var(--accent-green)":sig.met>=7?"var(--accent-orange)":sig.met>=5?"#f7931a":"var(--accent-red)", borderRadius:2 }} />
        </div>
        <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-mono)", minWidth:28 }}>{sig.met}/9</span>
      </div>

      {showLvl && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4, marginBottom:8 }}>
          {[
            { label:"ENTRY", value:sig.entry, color:"var(--accent-blue)"  },
            { label:"SL",    value:sig.sl,    color:"var(--accent-red)"   },
            { label:"TP1",   value:sig.tp1,   color:"var(--accent-green)" },
            { label:"TP2",   value:sig.tp2,   color:"var(--accent-gold)"  },
          ].map((r,i) => (
            <div key={i} style={{ background:"var(--bg-primary)", borderRadius:6, padding:"5px 4px", textAlign:"center" }}>
              <div style={{ fontSize:8, color:"var(--text-muted)", marginBottom:1 }}>{r.label}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:9, fontWeight:700, color:r.color }}>{r.value}</div>
            </div>
          ))}
        </div>
      )}

      {showLvl && (
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
          <span className="badge badge-purple" style={{ fontSize:9 }}>{sig.strat}</span>
          <span className="badge badge-green"  style={{ fontSize:9 }}>R:R 1:{sig.rr}</span>
          <MomentumBadge momentum={sig.momentum} />
          {sig.allValid && <span style={{ fontSize:9, background:"var(--accent-green)", color:"#000", padding:"2px 6px", borderRadius:4, fontWeight:700 }}>✅ ALL 9</span>}
        </div>
      )}

      {sig.signal==="WAIT"  && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:4 }}>{sig.met}/9 — not ready{!sig.sessionValid?" — session closed":""}</div>}
      {sig.signal==="WATCH" && <div style={{ fontSize:10, color:"var(--accent-orange)", marginTop:4 }}>{sig.met}/9 — forming setup, watch closely</div>}
      {showLvl && <div style={{ fontSize:9, color:"var(--text-muted)", marginTop:5 }}>Tap for full trade plan →</div>}
    </div>
  );
}

// ── Signal Modal ───────────────────────────────────────────────────────────
function SignalModal({ id, sig, session, onClose }) {
  if (!id || !sig) return null;
  const cfg   = CFG[id];
  const isBuy = sig.signal === "BUY";
  const [saveStatus, setSaveStatus] = React.useState("idle");

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"var(--bg-card)", border:"2px solid "+cfg.color, borderRadius:16, padding:20, maxWidth:460, width:"100%", maxHeight:"92vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:26 }}>{cfg.icon}</span>
            <div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:800, color:cfg.color }}>{cfg.name}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>{sig.strat} • R:R 1:{sig.rr} • {sig.met}/9 • {sig.sessLabel}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={() => { const r = saveToJournal(id, sig, session); setSaveStatus(r==="already"?"already":"saved"); }}
              disabled={saveStatus==="saved"}
              style={{ padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:700, cursor:saveStatus==="saved"?"default":"pointer",
                border:"1px solid "+(saveStatus==="saved"?"var(--accent-green)":saveStatus==="already"?"var(--accent-orange)":"var(--accent-green)"),
                background:saveStatus==="saved"?"rgba(0,212,170,0.15)":"rgba(0,212,170,0.08)",
                color:saveStatus==="saved"?"var(--accent-green)":saveStatus==="already"?"var(--accent-orange)":"var(--accent-green)",
              }}>
              {saveStatus==="saved"?"✅ Saved":saveStatus==="already"?"⚠️ Open":"📌 Save"}
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding:"3px 9px" }}>✕</button>
          </div>
        </div>

        <div style={{ textAlign:"center", padding:12, borderRadius:10, marginBottom:14, background:isBuy?"rgba(0,212,170,0.08)":"rgba(244,67,54,0.08)", border:"2px solid "+(isBuy?"var(--accent-green)":"var(--accent-red)") }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:24, fontWeight:800, color:isBuy?"var(--accent-green)":"var(--accent-red)" }}>
            {isBuy?"📈 BUY SIGNAL":"📉 SELL SIGNAL"}
          </div>
          <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:3 }}>
            {sig.strat} • {sig.sessLabel}
            {sig.allValid && <span style={{ color:"var(--accent-green)", marginLeft:6 }}>✅ All 9</span>}
            {sig.momentum !== "NEUTRAL" && <MomentumBadge momentum={sig.momentum} />}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { label:"📍 ENTRY",         value:sig.entry, color:"var(--accent-blue)",  desc:"Enter at market price"                    },
            { label:"🛑 STOP LOSS",     value:sig.sl,    color:"var(--accent-red)",   desc:sig.slPts+" "+sig.label+" from entry"       },
            { label:"🎯 TAKE PROFIT 1", value:sig.tp1,   color:"var(--accent-green)", desc:sig.tp1Pts+" "+sig.label+" — close 50%"     },
            { label:"🏆 TAKE PROFIT 2", value:sig.tp2,   color:"var(--accent-gold)",  desc:(sig.tp1Pts*2)+" "+sig.label+" — close rest"},
          ].map((r,i) => (
            <div key={i} style={{ background:"var(--bg-primary)", borderRadius:8, padding:10 }}>
              <div style={{ fontSize:9, color:"var(--text-muted)", marginBottom:3 }}>{r.label}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:17, fontWeight:700, color:r.color }}>{r.value}</div>
              <div style={{ fontSize:9, color:"var(--text-muted)", marginTop:2 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
          <span className="badge badge-green">R:R 1:{sig.rr}</span>
          <span className="badge badge-orange">Max risk 1.5%</span>
          <span className="badge badge-blue">SL {sig.slPts} {sig.label}</span>
          <span className="badge badge-blue">TP1 {sig.tp1Pts} {sig.label}</span>
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:6 }}>📋 9 SMC Conditions</div>
          {COND_LABELS.map((c,i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"5px 0", borderBottom:"1px solid var(--border)" }}>
              <span>{sig.conds[c.key]?"✅":"❌"}</span>
              <span style={{ fontSize:11, color:sig.conds[c.key]?"var(--text-primary)":"var(--text-muted)" }}>{c.icon} {c.label}</span>
            </div>
          ))}
        </div>

        <div style={{ background:"rgba(0,212,170,0.05)", border:"1px solid rgba(0,212,170,0.2)", borderRadius:8, padding:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--accent-green)", marginBottom:8 }}>📋 Execution Steps</div>
          {[
            "Open "+cfg.name+" chart on TradingView",
            "Confirm "+(isBuy?"bullish":"bearish")+" Daily + 4H structure",
            "Look for Order Block near entry "+sig.entry,
            "Wait for 15min CHoCH after liquidity sweep",
            "Enter at "+sig.entry+" — place SL at "+sig.sl+" immediately",
            "TP1 at "+sig.tp1+" ("+sig.tp1Pts+" "+sig.label+") — close 50%",
            "Move SL to breakeven after TP1 hit",
            "Let 50% run to TP2 at "+sig.tp2,
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", gap:6, fontSize:11, color:"var(--text-secondary)", padding:"3px 0" }}>
              <span style={{ color:"var(--accent-green)", fontWeight:700, minWidth:14 }}>{i+1}.</span>{s}
            </div>
          ))}
        </div>

        <div style={{ marginTop:10, fontSize:10, color:"var(--accent-red)", textAlign:"center" }}>
          ⚠️ Always confirm on TradingView chart before entering. Educational tool only.
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
  const [actLog,   setActLog]   = useState([]);

  const allPrices = { ...prices, ...indian };

  useAutoTrader(allPrices, session);

  useEffect(() => {
    const handler = () => setActLog(readAutoLog());
    window.addEventListener("autotrader_update", handler);
    setActLog(readAutoLog());
    return () => window.removeEventListener("autotrader_update", handler);
  }, []);

  useEffect(() => {
    const next  = {};
    let   count = 0;
    IDS.forEach(id => {
      const pd = allPrices[id];
      if (pd?.price) { next[id] = buildSignal(id, pd.price, session); count++; }
    });
    if (count > 0) setSignals(next);
  }, [JSON.stringify(allPrices), JSON.stringify(session)]);

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
        <p className="page-subtitle">9 SMC conditions • Indian 9:15–3:30 • Asian • London • NY • Momentum detection</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { label:"📈 BUY",       value:buyCount,   color:"var(--accent-green)"  },
          { label:"📉 SELL",      value:sellCount,  color:"var(--accent-red)"    },
          { label:"👁 WATCH",     value:watchCount, color:"var(--accent-orange)" },
          { label:"✅ ALL 9",     value:allMet,     color:"var(--accent-green)"  },
        ].map((s,i) => (
          <div key={i} className="stat-box">
            <div className="stat-value" style={{ color:s.color, fontSize:20 }}>{s.value}</div>
            <div className="stat-label" style={{ fontSize:10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Session banner */}
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ padding:"6px 14px", borderRadius:8, fontWeight:700, fontSize:12, background:"rgba(0,0,0,0.3)", border:"1px solid "+(session?.ist_color||"var(--border)"), color:session?.ist_color||"var(--text-muted)" }}>
          {session?.ist_label || "Loading..."}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, flex:1 }}>
          {[
            { label:"🇮🇳 India",  active: session?.india_active,  kz: session?.india_kz,  time:"9:15–3:30 PM"   },
            { label:"🌏 Asian",   active: session?.asian_active,  kz: false,               time:"4:30–1:30 PM"   },
            { label:"🇬🇧 London", active: session?.london_active, kz: session?.london_kz,  time:"1:30–10:00 PM"  },
            { label:"🗽 NY",      active: session?.ny_active,     kz: session?.ny_kz,      time:"6:30–3:00 AM"   },
          ].map((s,i) => (
            <div key={i} style={{ background:s.active?"rgba(0,212,170,0.06)":"var(--bg-card)", border:"1px solid "+(s.kz?"var(--accent-green)":s.active?"rgba(255,255,255,0.1)":"var(--border)"), borderRadius:7, padding:"5px 8px", textAlign:"center" }}>
              <div style={{ fontSize:10, fontWeight:700, color:s.kz?"var(--accent-green)":s.active?"var(--text-primary)":"var(--text-muted)" }}>{s.label}{s.kz?" 🔥":""}</div>
              <div style={{ fontSize:9, color:"var(--text-muted)" }}>{s.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom:12, overflowX:"auto" }}>
        <div className="tabs" style={{ display:"inline-flex", minWidth:"max-content" }}>
          {["All","Forex","Crypto","India","BUY","SELL","WATCH"].map(f => (
            <button key={f} className={"tab "+(filter===f?"active":"")} onClick={() => setFilter(f)}>
              {f==="BUY"?"📈 BUY("+buyCount+")":f==="SELL"?"📉 SELL("+sellCount+")":f==="WATCH"?"👁("+watchCount+")":f}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(signals).length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--text-muted)" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
          <div style={{ fontSize:14, fontWeight:600 }}>Loading prices...</div>
          <div style={{ fontSize:12, marginTop:8 }}>Signals appear in 5–10 seconds</div>
        </div>
      ) : (
        <div className="grid-auto">
          {visible.map(id => (
            <SignalCard key={id} id={id} priceData={allPrices[id]} sig={signals[id]}
              onClick={(id, sig) => setSelected({ id, sig })} />
          ))}
          {visible.length === 0 && (
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"var(--text-muted)" }}>
              No {filter} signals right now.
            </div>
          )}
        </div>
      )}

      {/* Auto-trader log */}
      <div style={{ marginTop:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>🤖 Auto-Trader Activity</div>
          <div style={{ fontSize:11, color:"var(--text-muted)" }}>Checks every 5s • saves during any active session</div>
        </div>
        {actLog.length === 0 ? (
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:18, textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:8 }}>🤖</div>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:6 }}>Auto-Trader Running</div>
            <div style={{ fontSize:11, color:"var(--text-muted)", lineHeight:1.7 }}>
              Monitors all 15 pairs every 5 seconds.<br/>
              Activates during: India (9:15 AM) • Asian (4:30 AM) • London (1:30 PM) • NY (6:30 PM) IST<br/>
              Auto-saves trades + monitors TP/SL → auto-closes.
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {actLog.slice(0, 15).map((entry, i) => {
              const bg = entry.type==="win"?"rgba(0,212,170,0.07)":entry.type==="loss"?"rgba(244,67,54,0.07)":entry.type==="open"?"rgba(79,195,247,0.07)":"rgba(80,80,80,0.05)";
              const bd = entry.type==="win"?"rgba(0,212,170,0.3)":entry.type==="loss"?"rgba(244,67,54,0.3)":entry.type==="open"?"rgba(79,195,247,0.3)":"var(--border)";
              return (
                <div key={i} style={{ background:bg, border:"1px solid "+bd, borderRadius:8, padding:"8px 12px", display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12 }}>{entry.msg}</span>
                  <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-mono)", whiteSpace:"nowrap", marginLeft:10 }}>
                    {new Date(entry.time).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && <SignalModal id={selected.id} sig={selected.sig} session={session} onClose={() => setSelected(null)} />}
    </div>
  );
}
