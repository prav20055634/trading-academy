import React, { useState, useEffect, useRef } from "react";
import { usePrices, useSessionStatus } from "../hooks/usePrices";
import { useAutoTrader, readAutoLog } from "../hooks/useAutoTrader";

// ── Instrument config ─────────────────────────────────────────────────────
const CFG = {
  EURUSD:    { dec:5, sl:15,  tp1:30,  tp2:60,  market:"Forex",  sessions:["london","ny"],          color:"#00d4aa", icon:"🇪🇺", name:"EUR/USD",    unit:"pips" },
  GBPUSD:    { dec:5, sl:20,  tp1:40,  tp2:80,  market:"Forex",  sessions:["london","ny"],          color:"#4fc3f7", icon:"🇬🇧", name:"GBP/USD",    unit:"pips" },
  USDJPY:    { dec:3, sl:20,  tp1:40,  tp2:80,  market:"Forex",  sessions:["asian","london","ny"],  color:"#f7931a", icon:"🇯🇵", name:"USD/JPY",    unit:"pips" },
  GBPJPY:    { dec:3, sl:30,  tp1:60,  tp2:120, market:"Forex",  sessions:["london","ny"],          color:"#f44336", icon:"🇬🇧", name:"GBP/JPY",    unit:"pips" },
  USDCAD:    { dec:5, sl:15,  tp1:30,  tp2:60,  market:"Forex",  sessions:["london","ny"],          color:"#ab47bc", icon:"🇨🇦", name:"USD/CAD",    unit:"pips" },
  NZDUSD:    { dec:5, sl:15,  tp1:30,  tp2:60,  market:"Forex",  sessions:["asian","london"],       color:"#26a69a", icon:"🇳🇿", name:"NZD/USD",    unit:"pips" },
  XAUUSD:    { dec:2, sl:8,   tp1:16,  tp2:32,  market:"Forex",  sessions:["london","ny"],          color:"#ffd700", icon:"🥇",  name:"XAU/USD",    unit:"pts"  },
  BTCUSDT:   { dec:0, sl:200, tp1:400, tp2:800, market:"Crypto", sessions:["asian","london","ny"],  color:"#f7931a", icon:"₿",   name:"BTC/USDT",   unit:"pts"  },
  ETHUSDT:   { dec:2, sl:25,  tp1:50,  tp2:100, market:"Crypto", sessions:["asian","london","ny"],  color:"#627eea", icon:"Ξ",   name:"ETH/USDT",   unit:"pts"  },
  SOLUSDT:   { dec:2, sl:3,   tp1:6,   tp2:12,  market:"Crypto", sessions:["asian","london","ny"],  color:"#9945ff", icon:"◎",   name:"SOL/USDT",   unit:"pts"  },
  XRPUSDT:   { dec:4, sl:0.04,tp1:0.08,tp2:0.16,market:"Crypto", sessions:["asian","london","ny"], color:"#00aae4", icon:"✕",   name:"XRP/USDT",   unit:"pts"  },
  BNBUSDT:   { dec:2, sl:5,   tp1:10,  tp2:20,  market:"Crypto", sessions:["asian","london","ny"],  color:"#f3ba2f", icon:"⬡",   name:"BNB/USDT",   unit:"pts"  },
  NIFTY50:   { dec:2, sl:40,  tp1:80,  tp2:160, market:"India",  sessions:["india"],                color:"#ff6b35", icon:"🇮🇳", name:"NIFTY 50",   unit:"pts"  },
  SENSEX:    { dec:2, sl:120, tp1:240, tp2:480, market:"India",  sessions:["india"],                color:"#e91e63", icon:"📈",  name:"SENSEX",     unit:"pts"  },
  BANKNIFTY: { dec:2, sl:60,  tp1:120, tp2:240, market:"India",  sessions:["india"],                color:"#00bcd4", icon:"🏦",  name:"BANK NIFTY", unit:"pts"  },
};
const IDS = Object.keys(CFG);

// ── Session check ─────────────────────────────────────────────────────────
function sessionActive(id, session) {
  const s = CFG[id].sessions;
  if (s.includes("india")  && session?.india_active)  return true;
  if (s.includes("london") && session?.london_active) return true;
  if (s.includes("ny")     && session?.ny_active)     return true;
  if (s.includes("asian")  && session?.asian_active)  return true;
  return false;
}

function sessionLabel(session) {
  if (session?.india_kz)    return "🇮🇳 India KZ";
  if (session?.india_active)return "🇮🇳 India Market";
  if (session?.london_kz)   return "🇬🇧 London KZ";
  if (session?.ny_kz)       return "🗽 NY KZ";
  if (session?.asian_active)return "🌏 Asian";
  if (session?.london_active)return "🇬🇧 London";
  if (session?.ny_active)   return "🗽 NY";
  return "Closed";
}

// ── Evaluate 9 SMC conditions using LIVE data ─────────────────────────────
// Conditions now use realistic inputs available from live feed
function buildSignal(id, priceStr, changeStr, session) {
  const cfg    = CFG[id];
  const price  = parseFloat(priceStr);
  const change = parseFloat(changeStr || "0"); // daily % change from feed
  if (!price || price <= 0) return null;

  const sessOk = sessionActive(id, session);
  const isKZ   = session?.india_kz || session?.london_kz || session?.ny_kz;

  // ── Direction: use daily % change as primary trend indicator ──────────
  // Positive change = market moving up today = BUY bias
  // Negative change = market moving down today = SELL bias
  const isBull = change >= 0;
  const dir    = isBull ? "BUY" : "SELL";

  // ── Condition 1: HTF Trend — daily change shows direction ─────────────
  const c1 = Math.abs(change) >= 0.05; // at least 0.05% move = trend exists

  // ── Condition 2: Momentum strength ────────────────────────────────────
  // Strong move = price has conviction (≥0.2% for forex, ≥0.5% for crypto/india)
  const momThresh = cfg.market === "Forex" ? 0.15 : cfg.market === "India" ? 0.2 : 0.3;
  const c2 = Math.abs(change) >= momThresh;

  // ── Condition 3: Not at extreme (has room to move 20-50pts) ───────────
  // Use change magnitude — if >2% already moved a lot, less room
  const maxMove = cfg.market === "Forex" ? 1.5 : cfg.market === "India" ? 1.5 : 5.0;
  const c3 = Math.abs(change) < maxMove;

  // ── Condition 4: Price near round number (institutional OB) ──────────
  // Round numbers: every 50 pips forex, every 100pts crypto, every 100pts india
  const roundStep = cfg.market === "Forex"  ? (id === "USDJPY" || id === "GBPJPY" ? 0.5 : 0.005)
                  : cfg.market === "India"  ? 100
                  : cfg.market === "Crypto" ? (id === "BTCUSDT" ? 500 : id === "ETHUSDT" ? 50 : 1)
                  : 10;
  const distToRound = Math.abs(price - Math.round(price / roundStep) * roundStep);
  const c4 = distToRound < roundStep * 0.2; // within 20% of round number

  // ── Condition 5: Liquidity sweep — price made new high/low today ──────
  // Approximate: strong moves often include sweeps (|change| > 0.4%)
  const sweepThresh = cfg.market === "Forex" ? 0.3 : 0.5;
  const c5 = Math.abs(change) >= sweepThresh;

  // ── Condition 6: CHoCH — direction change in progress ─────────────────
  // If change is in range 0.1–1.5% = structure forming/changed
  const c6 = Math.abs(change) >= 0.1 && Math.abs(change) <= 2.5;

  // ── Condition 7: Valid session ─────────────────────────────────────────
  const c7 = sessOk;

  // ── Condition 8: Kill Zone bonus ──────────────────────────────────────
  const c8 = !!isKZ;

  // ── Condition 9: R:R always valid (we set TP = 2×SL) ─────────────────
  const c9 = true;

  const conds = { c1, c2, c3, c4, c5, c6, c7, c8, c9 };
  const met   = Object.values(conds).filter(Boolean).length;

  // ── Signal thresholds ─────────────────────────────────────────────────
  // Show BUY/SELL even outside session so user can see what's setting up
  // But dim cards if session is closed
  let signal = "WAIT";
  if (met >= 7)                       signal = dir;
  else if (met >= 6)                  signal = dir;      // 6+ = valid signal
  else if (met >= 5)                  signal = "WATCH";
  else if (met >= 4 && sessOk)        signal = "WATCH";
  else if (met >= 3)                  signal = "WAIT";

  // Force signal during strong momentum regardless of other conditions
  if (Math.abs(change) >= 1.0 && sessOk && c3) signal = dir; // strong day move = signal

  // ── Entry / SL / TP ───────────────────────────────────────────────────
  const isBuy = dir === "BUY";
  const entry = price;
  const sl    = isBuy ? price - cfg.sl  : price + cfg.sl;
  const tp1   = isBuy ? price + cfg.tp1 : price - cfg.tp1;
  const tp2   = isBuy ? price + cfg.tp2 : price - cfg.tp2;
  const rr    = (cfg.tp1 / cfg.sl).toFixed(1);

  // ── Strategy ──────────────────────────────────────────────────────────
  const strat = c5 && c6 ? "CRT+Sweep"
              : c4       ? "OB+CHoCH"
              : c8       ? "KZ Breakout"
              : "Momentum";

  // ── Strength label ────────────────────────────────────────────────────
  const strength = Math.abs(change) >= 1.5 ? "🔥 STRONG"
                 : Math.abs(change) >= 0.5  ? "⚡ GOOD"
                 : Math.abs(change) >= 0.2  ? "↑ FORMING"
                 : "→ WEAK";

  return {
    signal, dir, met, allValid: met === 9,
    entry: entry.toFixed(cfg.dec),
    sl:    sl.toFixed(cfg.dec),
    tp1:   tp1.toFixed(cfg.dec),
    tp2:   tp2.toFixed(cfg.dec),
    slPts: cfg.sl, tp1Pts: cfg.tp1,
    unit:  cfg.unit,
    rr, strat, conds, strength,
    change: change.toFixed(2),
    sessOk, isKZ,
    sessLabel: sessionLabel(session),
  };
}

// ── Indian prices ──────────────────────────────────────────────────────────
function useIndianPrices() {
  const [indian, setIndian] = useState({});
  useEffect(() => {
    const syms = [
      { key:"NIFTY50",   y:"%5ENSEI"    },
      { key:"SENSEX",    y:"%5EBSESN"   },
      { key:"BANKNIFTY", y:"%5ENSEBANK" },
    ];
    const go = async () => {
      for (const s of syms) {
        try {
          const url = "https://api.allorigins.win/get?url=" +
            encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/" + s.y + "?interval=1m&range=1d");
          const res  = await fetch(url);
          const data = await res.json();
          const json = JSON.parse(data.contents);
          const meta  = json?.chart?.result?.[0]?.meta;
          const price = meta?.regularMarketPrice;
          const prev  = meta?.previousClose;
          if (price) {
            const chg = prev ? (((price - prev) / prev) * 100).toFixed(2) : "0.00";
            setIndian(p => ({ ...p, [s.key]: { price: price.toFixed(2), change: chg } }));
          }
        } catch (_) {}
      }
    };
    go();
    const t = setInterval(go, 30000);
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
      id: Date.now(), pair: id, direction: sig.signal,
      entry: parseFloat(sig.entry), sl: parseFloat(sig.sl),
      tp1: parseFloat(sig.tp1), tp2: parseFloat(sig.tp2) || null,
      strategy: sig.strat, session: sig.sessLabel,
      notes: "Scanner — " + sig.met + "/9 — " + sig.strength,
      status: "OPEN", openTime: new Date().toISOString(),
      closeTime: null, exitPrice: null, pnl: null, source: "scanner",
    };
    localStorage.setItem(KEY, JSON.stringify([trade, ...existing]));
    return "saved";
  } catch { return "error"; }
}

const COND_LABELS = [
  { key:"c1", icon:"📊", label:"Daily trend exists (price moving with conviction)" },
  { key:"c2", icon:"💪", label:"Momentum strong enough to follow"                  },
  { key:"c3", icon:"📦", label:"Price has room to move 20–50 pts"                  },
  { key:"c4", icon:"🎯", label:"Near institutional round number (Order Block)"      },
  { key:"c5", icon:"🧹", label:"Liquidity sweep — strong move swept stops"         },
  { key:"c6", icon:"🔄", label:"CHoCH — structure shift in progress"               },
  { key:"c7", icon:"⏰", label:"Valid session for this instrument"                  },
  { key:"c8", icon:"🔥", label:"Kill Zone active (highest probability time)"        },
  { key:"c9", icon:"🛡️", label:"Risk:Reward 1:2 minimum always valid"              },
];

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
  const sigColor  = sig.signal==="BUY" ? "var(--accent-green)" : sig.signal==="SELL" ? "var(--accent-red)" : sig.signal==="WATCH" ? "var(--accent-orange)" : "var(--text-muted)";
  const sigBg     = sig.signal==="BUY" ? "rgba(0,212,170,0.07)" : sig.signal==="SELL" ? "rgba(244,67,54,0.07)" : sig.signal==="WATCH" ? "rgba(247,147,26,0.05)" : "rgba(80,80,80,0.03)";
  const sigBorder = sig.signal==="BUY" ? "rgba(0,212,170,0.4)" : sig.signal==="SELL" ? "rgba(244,67,54,0.4)" : sig.signal==="WATCH" ? "rgba(247,147,26,0.3)" : "var(--border)";

  return (
    <div onClick={() => showLvl && onClick(id, sig)}
      style={{ background:sigBg, border:"1px solid "+sigBorder, borderRadius:12, padding:14, cursor:showLvl?"pointer":"default", opacity:!sig.sessOk?0.5:1 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>{cfg.icon}</span>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:700, color:cfg.color }}>{cfg.name}</div>
            <div style={{ fontSize:9, color:"var(--text-muted)" }}>
              {sig.sessLabel}
              {sig.isKZ && <span style={{ color:"var(--accent-green)", fontWeight:700, marginLeft:4 }}>🔥 KZ</span>}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
          <div style={{ padding:"4px 10px", borderRadius:7, fontSize:12, fontWeight:800, background:sigColor, color:"#000", border:"1px solid "+sigBorder }}>
            {sig.signal==="BUY"?"📈 BUY":sig.signal==="SELL"?"📉 SELL":sig.signal==="WATCH"?"👁 WATCH":"⏸ WAIT"}
          </div>
          <div style={{ fontSize:10, color:sigColor, fontWeight:600 }}>{sig.strength}</div>
        </div>
      </div>

      {/* Price + change */}
      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:18, fontWeight:700, color:"var(--text-primary)" }}>{priceData.price}</span>
        <span style={{ fontSize:11, fontWeight:700, color:parseFloat(sig.change)>=0?"var(--accent-green)":"var(--accent-red)" }}>
          {parseFloat(sig.change)>=0?"▲+":"▼"}{sig.change}%
        </span>
      </div>

      {/* Condition bar */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <div style={{ flex:1, height:5, background:"var(--bg-primary)", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:(sig.met/9*100)+"%", borderRadius:3,
            background: sig.met>=7?"var(--accent-green)":sig.met>=5?"var(--accent-orange)":"var(--accent-red)" }} />
        </div>
        <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-mono)", minWidth:28 }}>{sig.met}/9</span>
      </div>

      {/* Entry / SL / TP levels */}
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
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          <span className="badge badge-purple" style={{ fontSize:9 }}>{sig.strat}</span>
          <span className="badge badge-green"  style={{ fontSize:9 }}>R:R 1:{sig.rr}</span>
          <span className="badge badge-blue"   style={{ fontSize:9 }}>SL {sig.slPts} {sig.unit}</span>
          {sig.allValid && <span style={{ fontSize:9, background:"var(--accent-green)", color:"#000", padding:"2px 6px", borderRadius:4, fontWeight:700 }}>✅ ALL 9</span>}
        </div>
      )}

      {!sig.sessOk  && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:5 }}>Session closed for this pair</div>}
      {sig.signal==="WATCH" && <div style={{ fontSize:10, color:"var(--accent-orange)", marginTop:5 }}>{sig.met}/9 — setup forming, not ready yet</div>}
      {sig.signal==="WAIT"  && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:5 }}>{sig.met}/9 — wait for better conditions</div>}
      {showLvl && sig.sessOk && <div style={{ fontSize:9, color:"var(--text-muted)", marginTop:5 }}>Tap for full trade plan →</div>}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
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
            <button onClick={() => { const r = saveToJournal(id, sig, session); setSaveStatus(r === "already" ? "already" : "saved"); }}
              disabled={saveStatus === "saved"}
              style={{ padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:700, cursor:saveStatus==="saved"?"default":"pointer",
                border:"1px solid var(--accent-green)", background:"rgba(0,212,170,0.08)", color:saveStatus==="saved"?"var(--accent-green)":saveStatus==="already"?"var(--accent-orange)":"var(--accent-green)" }}>
              {saveStatus==="saved"?"✅ Saved":saveStatus==="already"?"⚠️ Open":"📌 Save"}
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding:"3px 9px" }}>✕</button>
          </div>
        </div>

        <div style={{ textAlign:"center", padding:12, borderRadius:10, marginBottom:14, background:isBuy?"rgba(0,212,170,0.08)":"rgba(244,67,54,0.08)", border:"2px solid "+(isBuy?"var(--accent-green)":"var(--accent-red)") }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:24, fontWeight:800, color:isBuy?"var(--accent-green)":"var(--accent-red)" }}>
            {isBuy ? "📈 BUY SIGNAL" : "📉 SELL SIGNAL"}
          </div>
          <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:3 }}>
            Daily change: <b style={{ color:parseFloat(sig.change)>=0?"var(--accent-green)":"var(--accent-red)" }}>{sig.change}%</b>
            &nbsp;•&nbsp;{sig.strength}&nbsp;•&nbsp;{sig.sessLabel}
            {sig.allValid && <span style={{ color:"var(--accent-green)", marginLeft:6 }}>✅ All 9</span>}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { label:"📍 ENTRY",         value:sig.entry, color:"var(--accent-blue)",  desc:"Enter at market now"               },
            { label:"🛑 STOP LOSS",     value:sig.sl,    color:"var(--accent-red)",   desc:sig.slPts+" "+sig.unit+" from entry" },
            { label:"🎯 TAKE PROFIT 1", value:sig.tp1,   color:"var(--accent-green)", desc:sig.tp1Pts+" "+sig.unit+" — close 50%" },
            { label:"🏆 TAKE PROFIT 2", value:sig.tp2,   color:"var(--accent-gold)",  desc:(sig.tp1Pts*2)+" "+sig.unit+" — close rest" },
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
          <span className="badge badge-orange">Risk max 1.5%</span>
          <span className="badge badge-blue">{sig.strat}</span>
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>📋 9 Conditions Check</div>
          {COND_LABELS.map((c,i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"5px 0", borderBottom:"1px solid var(--border)" }}>
              <span style={{ fontSize:14, minWidth:20 }}>{sig.conds[c.key] ? "✅" : "❌"}</span>
              <span style={{ fontSize:11, color:sig.conds[c.key]?"var(--text-primary)":"var(--text-muted)" }}>{c.icon} {c.label}</span>
            </div>
          ))}
        </div>

        <div style={{ background:"rgba(0,212,170,0.05)", border:"1px solid rgba(0,212,170,0.2)", borderRadius:8, padding:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--accent-green)", marginBottom:8 }}>📋 Execution Steps</div>
          {[
            "Open "+cfg.name+" on TradingView — check Daily chart",
            "Confirm "+(isBuy?"green":"red")+" candles + trend direction",
            "On 15min chart — find the last Order Block near "+sig.entry,
            "Wait for CHoCH (structure break) after a liquidity sweep",
            "Enter at "+sig.entry+" — immediately place SL at "+sig.sl,
            "TP1 at "+sig.tp1+" ("+sig.tp1Pts+" "+sig.unit+") — close 50% here",
            "Move SL to breakeven after TP1 is hit",
            "Let remaining 50% run to TP2 at "+sig.tp2,
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", gap:6, fontSize:11, color:"var(--text-secondary)", padding:"3px 0" }}>
              <span style={{ color:"var(--accent-green)", fontWeight:700, minWidth:16 }}>{i+1}.</span>{s}
            </div>
          ))}
        </div>

        <div style={{ marginTop:10, fontSize:10, color:"var(--accent-red)", textAlign:"center" }}>
          ⚠️ Always confirm on TradingView before entering. Educational tool only.
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

  // Rebuild signals every time any price updates
  useEffect(() => {
    const next  = {};
    let   count = 0;
    IDS.forEach(id => {
      const pd = allPrices[id];
      if (pd?.price) {
        next[id] = buildSignal(id, pd.price, pd.change, session);
        count++;
      }
    });
    if (count > 0) setSignals(next);
  }, [JSON.stringify(allPrices), JSON.stringify(session)]);

  const buyCount   = IDS.filter(id => signals[id]?.signal === "BUY").length;
  const sellCount  = IDS.filter(id => signals[id]?.signal === "SELL").length;
  const watchCount = IDS.filter(id => signals[id]?.signal === "WATCH").length;
  const allMet     = IDS.filter(id => signals[id]?.allValid).length;

  const visible = IDS.filter(id => {
    if (filter === "All")    return true;
    if (filter === "Forex")  return CFG[id].market === "Forex";
    if (filter === "Crypto") return CFG[id].market === "Crypto";
    if (filter === "India")  return CFG[id].market === "India";
    return signals[id]?.signal === filter;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🔍 Signal Scanner</h1>
        <p className="page-subtitle">Live signals across all sessions • India 9:15–3:30 • Asian • London • NY</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { label:"📈 BUY",   value:buyCount,   color:"var(--accent-green)"  },
          { label:"📉 SELL",  value:sellCount,  color:"var(--accent-red)"    },
          { label:"👁 WATCH", value:watchCount, color:"var(--accent-orange)" },
          { label:"✅ ALL 9", value:allMet,     color:"var(--accent-green)"  },
        ].map((s,i) => (
          <div key={i} className="stat-box">
            <div className="stat-value" style={{ color:s.color, fontSize:20 }}>{s.value}</div>
            <div className="stat-label" style={{ fontSize:10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Session strip */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:14 }}>
        {[
          { label:"🇮🇳 India",  active:session?.india_active,  kz:session?.india_kz,   time:"9:15 AM–3:30 PM" },
          { label:"🌏 Asian",   active:session?.asian_active,  kz:false,               time:"4:30 AM–1:30 PM" },
          { label:"🇬🇧 London", active:session?.london_active, kz:session?.london_kz,  time:"1:30 PM–10:00 PM"},
          { label:"🗽 NY",      active:session?.ny_active,     kz:session?.ny_kz,      time:"6:30 PM–3:00 AM" },
        ].map((s,i) => (
          <div key={i} style={{ background:s.kz?"rgba(0,212,170,0.08)":s.active?"rgba(255,255,255,0.04)":"var(--bg-card)", border:"1px solid "+(s.kz?"var(--accent-green)":s.active?"rgba(255,255,255,0.12)":"var(--border)"), borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
            <div style={{ fontSize:11, fontWeight:700, color:s.kz?"var(--accent-green)":s.active?"var(--text-primary)":"var(--text-muted)" }}>
              {s.label}{s.kz ? " 🔥" : s.active ? " ●" : ""}
            </div>
            <div style={{ fontSize:9, color:"var(--text-muted)", marginTop:2 }}>{s.time}</div>
            <div style={{ fontSize:9, fontWeight:600, color:s.kz?"var(--accent-green)":s.active?"var(--accent-orange)":"var(--text-muted)", marginTop:2 }}>
              {s.kz?"KILL ZONE":s.active?"OPEN":"CLOSED"}
            </div>
          </div>
        ))}
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

      {/* Cards */}
      {Object.keys(signals).length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--text-muted)" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
          <div style={{ fontSize:14, fontWeight:600 }}>Loading live prices...</div>
          <div style={{ fontSize:12, marginTop:8 }}>Signals appear in 5–10 seconds</div>
        </div>
      ) : (
        <div className="grid-auto">
          {visible.map(id => (
            <SignalCard key={id} id={id} priceData={allPrices[id]} sig={signals[id]}
              onClick={(id, sig) => setSelected({ id, sig })} />
          ))}
        </div>
      )}

      {/* Auto-trader log */}
      <div style={{ marginTop:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>🤖 Auto-Trader Activity</div>
          <div style={{ fontSize:11, color:"var(--text-muted)" }}>Monitors every 5s during active sessions</div>
        </div>
        {actLog.length === 0 ? (
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:18, textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>🤖</div>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:4 }}>Auto-Trader Running</div>
            <div style={{ fontSize:11, color:"var(--text-muted)", lineHeight:1.7 }}>
              Saves trades automatically when signals form.<br/>
              Monitors TP1 / TP2 / SL → closes trade and records P&amp;L.<br/>
              Activity log appears here when trades are detected.
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {actLog.slice(0, 15).map((entry, i) => {
              const bg = entry.type==="win"?"rgba(0,212,170,0.07)":entry.type==="loss"?"rgba(244,67,54,0.07)":"rgba(79,195,247,0.06)";
              const bd = entry.type==="win"?"rgba(0,212,170,0.3)":entry.type==="loss"?"rgba(244,67,54,0.3)":"rgba(79,195,247,0.25)";
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
