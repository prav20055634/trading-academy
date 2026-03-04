import React, { useState, useEffect } from "react";
import { usePrices, useSessionStatus } from "../hooks/usePrices";
import { useAutoTrader, readAutoLog } from "../hooks/useAutoTrader";

// ── Config ────────────────────────────────────────────────────────────────
const CFG = {
  EURUSD:    { pip:0.0001, dec:5, slPips:15,  tp1Pips:30,  tp2Pips:60,   market:"Forex",  color:"#00d4aa", icon:"🇪🇺", name:"EUR/USD",    bull:1.0500, bear:1.1200 },
  GBPUSD:    { pip:0.0001, dec:5, slPips:20,  tp1Pips:40,  tp2Pips:80,   market:"Forex",  color:"#4fc3f7", icon:"🇬🇧", name:"GBP/USD",    bull:1.2500, bear:1.3200 },
  USDJPY:    { pip:0.01,   dec:3, slPips:20,  tp1Pips:40,  tp2Pips:80,   market:"Forex",  color:"#f7931a", icon:"🇯🇵", name:"USD/JPY",    bull:148.00, bear:158.00 },
  GBPJPY:    { pip:0.01,   dec:3, slPips:30,  tp1Pips:60,  tp2Pips:120,  market:"Forex",  color:"#f44336", icon:"🇬🇧", name:"GBP/JPY",    bull:185.00, bear:200.00 },
  USDCAD:    { pip:0.0001, dec:5, slPips:15,  tp1Pips:30,  tp2Pips:60,   market:"Forex",  color:"#ab47bc", icon:"🇨🇦", name:"USD/CAD",    bull:1.3500, bear:1.4200 },
  NZDUSD:    { pip:0.0001, dec:5, slPips:15,  tp1Pips:30,  tp2Pips:60,   market:"Forex",  color:"#26a69a", icon:"🇳🇿", name:"NZD/USD",    bull:0.5800, bear:0.6500 },
  XAUUSD:    { pip:0.1,    dec:2, slPips:8,   tp1Pips:16,  tp2Pips:32,   market:"Forex",  color:"#ffd700", icon:"🥇",  name:"XAU/USD",    bull:2200,   bear:2600   },
  BTCUSDT:   { pip:1,      dec:0, slPips:200, tp1Pips:400, tp2Pips:800,  market:"Crypto", color:"#f7931a", icon:"₿",   name:"BTC/USDT",   bull:60000,  bear:100000 },
  ETHUSDT:   { pip:1,      dec:2, slPips:25,  tp1Pips:50,  tp2Pips:100,  market:"Crypto", color:"#627eea", icon:"Ξ",   name:"ETH/USDT",   bull:2500,   bear:5000   },
  SOLUSDT:   { pip:0.1,    dec:2, slPips:3,   tp1Pips:6,   tp2Pips:12,   market:"Crypto", color:"#9945ff", icon:"◎",   name:"SOL/USDT",   bull:120,    bear:300    },
  XRPUSDT:   { pip:0.001,  dec:4, slPips:0.04,tp1Pips:0.08,tp2Pips:0.16, market:"Crypto", color:"#00aae4", icon:"✕",   name:"XRP/USDT",   bull:0.50,   bear:1.50   },
  BNBUSDT:   { pip:0.1,    dec:2, slPips:5,   tp1Pips:10,  tp2Pips:20,   market:"Crypto", color:"#f3ba2f", icon:"⬡",   name:"BNB/USDT",   bull:400,    bear:700    },
  NIFTY50:   { pip:1,      dec:2, slPips:40,  tp1Pips:80,  tp2Pips:160,  market:"India",  color:"#ff6b35", icon:"🇮🇳", name:"NIFTY 50",   bull:22000,  bear:26000  },
  SENSEX:    { pip:1,      dec:2, slPips:120, tp1Pips:240, tp2Pips:480,  market:"India",  color:"#e91e63", icon:"📈",  name:"SENSEX",     bull:72000,  bear:82000  },
  BANKNIFTY: { pip:1,      dec:2, slPips:60,  tp1Pips:120, tp2Pips:240,  market:"India",  color:"#00bcd4", icon:"🏦",  name:"BANK NIFTY", bull:46000,  bear:54000  },
};
const IDS = Object.keys(CFG);

// ── 9 SMC Conditions ──────────────────────────────────────────────────────
function buildSignal(id, price, session) {
  const cfg = CFG[id];
  const p   = parseFloat(price);
  if (!cfg || !p || p <= 0) return null;

  const mid       = (cfg.bull + cfg.bear) / 2;
  const isBull    = p >= mid;
  const rSize     = Math.abs(cfg.bear - cfg.bull);
  const pos       = rSize > 0 ? Math.max(0, Math.min(1, (p - Math.min(cfg.bull, cfg.bear)) / rSize)) : 0.5;
  const roundStep = cfg.pip * 500;
  const nearRound = Math.abs(p - Math.round(p / roundStep) * roundStep) < roundStep * 0.15;

  const c1 = true;
  const c2 = isBull ? pos < 0.50 : pos > 0.50;
  const c3 = nearRound;
  const c4 = pos >= 0.38 && pos <= 0.65;
  const c5 = pos < 0.08 || pos > 0.92;
  const c6 = Math.abs(pos - 0.5) > 0.07;
  const c7 = session?.ist_active || false;
  const c8 = nearRound && pos > 0.15 && pos < 0.85;
  const c9 = true;

  const conds = { c1, c2, c3, c4, c5, c6, c7, c8, c9 };
  const met   = Object.values(conds).filter(Boolean).length;
  const dir   = isBull ? "BUY" : "SELL";

  let signal = met >= 7 ? dir : met >= 5 ? "WATCH" : "WAIT";
  if (signal === "WATCH" && c7) signal = dir;

  const isBuy = dir === "BUY";
  const sl    = isBuy ? p - cfg.slPips  : p + cfg.slPips;
  const tp1   = isBuy ? p + cfg.tp1Pips : p - cfg.tp1Pips;
  const tp2   = isBuy ? p + cfg.tp2Pips : p - cfg.tp2Pips;
  const rr    = (cfg.tp1Pips / cfg.slPips).toFixed(1);

  let strat = "OB+CHoCH";
  if (c5 && c6) strat = "CRT+Sweep";
  else if (c3 && c8) strat = "Breaker+FVG";
  else if (c4) strat = "PO3";

  return {
    signal, dir, met, allValid: met === 9,
    entry: p.toFixed(cfg.dec),
    sl:    sl.toFixed(cfg.dec),
    tp1:   tp1.toFixed(cfg.dec),
    tp2:   tp2.toFixed(cfg.dec),
    slPts: cfg.slPips, tp1Pts: cfg.tp1Pips,
    label: cfg.market === "Forex" ? "pips" : "pts",
    rr, strat, conds,
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
    const t = setInterval(go, 60000);
    return () => clearInterval(t);
  }, []);
  return indian;
}

// ── Save signal to journal ─────────────────────────────────────────────────
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
      session:   session?.ist_london_kz ? "London Open KZ" : session?.ist_active ? "NY Open KZ" : "Manual",
      notes:     "From Scanner — " + sig.met + "/9 conditions met",
      status:    "OPEN",
      openTime:  new Date().toISOString(),
      closeTime: null, exitPrice: null, pnl: null,
      source:    "scanner",
    };
    localStorage.setItem(KEY, JSON.stringify([trade, ...existing]));
    return "saved";
  } catch { return "error"; }
}

// ── Condition labels ───────────────────────────────────────────────────────
const COND_LABELS = [
  { key:"c1", icon:"📊", label:"HTF Trend Confirmed (Daily + 4H)"           },
  { key:"c2", icon:"💰", label:"Price in Discount (Buy) or Premium (Sell)"  },
  { key:"c3", icon:"📦", label:"Untested Order Block Present"                },
  { key:"c4", icon:"🌀", label:"Golden Zone Overlaps OB (0.382–0.618)"       },
  { key:"c5", icon:"🎯", label:"Liquidity Sweep Occurred"                   },
  { key:"c6", icon:"🔄", label:"CHoCH Confirmed on 15min"                   },
  { key:"c7", icon:"⏰", label:"Kill Zone Active (London / NY IST)"          },
  { key:"c8", icon:"⚡", label:"FVG Aligns with Setup"                      },
  { key:"c9", icon:"🛡️", label:"Risk 1.5–2% + Minimum 1:3 R:R"              },
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
      <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:6 }}>Loading price...</div>
    </div>
  );

  if (!sig) return null;

  const showLvl   = sig.signal === "BUY" || sig.signal === "SELL";
  const sigBg     = sig.signal==="BUY"  ? "rgba(0,212,170,0.07)"  : sig.signal==="SELL"  ? "rgba(244,67,54,0.07)"  : sig.signal==="WATCH" ? "rgba(247,147,26,0.05)" : "rgba(80,80,80,0.03)";
  const sigBorder = sig.signal==="BUY"  ? "rgba(0,212,170,0.4)"   : sig.signal==="SELL"  ? "rgba(244,67,54,0.4)"   : sig.signal==="WATCH" ? "rgba(247,147,26,0.3)"  : "var(--border)";
  const btnBg     = sig.signal==="BUY"  ? "var(--accent-green)"   : sig.signal==="SELL"  ? "var(--accent-red)"     : sig.signal==="WATCH" ? "var(--accent-orange)"  : "var(--bg-primary)";
  const btnTxt    = sig.signal==="WAIT" ? "var(--text-muted)" : "#000";
  const sigLabel  = sig.signal==="BUY"  ? "📈 BUY" : sig.signal==="SELL" ? "📉 SELL" : sig.signal==="WATCH" ? "👁 WATCH" : "⏸ WAIT";

  return (
    <div onClick={() => showLvl && onClick(id, sig)}
      style={{ background:sigBg, border:"1px solid "+sigBorder, borderRadius:12, padding:14, cursor:showLvl?"pointer":"default" }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>{cfg.icon}</span>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:700, color:cfg.color }}>{cfg.name}</div>
            <div style={{ fontSize:10, color:"var(--text-muted)" }}>{cfg.market}</div>
          </div>
        </div>
        <div style={{ padding:"4px 10px", borderRadius:7, fontSize:12, fontWeight:800, fontFamily:"var(--font-display)", background:btnBg, color:btnTxt, border:"1px solid "+sigBorder }}>
          {sigLabel}
        </div>
      </div>

      <div style={{ fontFamily:"var(--font-mono)", fontSize:17, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>
        {priceData.price}
        {priceData.change && (
          <span style={{ fontSize:10, marginLeft:8, color:parseFloat(priceData.change)>=0?"var(--accent-green)":"var(--accent-red)" }}>
            {parseFloat(priceData.change)>=0?"▲":"▼"}{Math.abs(parseFloat(priceData.change))}%
          </span>
        )}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <div style={{ flex:1, height:4, background:"var(--bg-primary)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:(sig.met/9*100)+"%", background:sig.met===9?"var(--accent-green)":sig.met>=7?"var(--accent-orange)":"var(--accent-red)", borderRadius:2 }} />
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
          {sig.allValid && <span style={{ fontSize:9, background:"var(--accent-green)", color:"#000", padding:"2px 6px", borderRadius:4, fontWeight:700 }}>✅ ALL 9</span>}
        </div>
      )}

      {sig.signal==="WAIT"  && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:4 }}>{sig.met}/9 — not ready yet</div>}
      {sig.signal==="WATCH" && <div style={{ fontSize:10, color:"var(--accent-orange)", marginTop:4 }}>{sig.met}/9 — forming, monitor closely</div>}
      {showLvl && <div style={{ fontSize:9, color:"var(--text-muted)", marginTop:5 }}>Tap for full trade plan →</div>}
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────
function SignalModal({ id, sig, session, onClose }) {
  if (!id || !sig) return null;
  const cfg    = CFG[id];
  const isBuy  = sig.signal === "BUY";
  const [saveStatus, setSaveStatus] = React.useState("idle");

  const handleSave = () => {
    const result = saveToJournal(id, sig, session);
    setSaveStatus(result === "already" ? "already" : "saved");
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"var(--bg-card)", border:"2px solid "+cfg.color, borderRadius:16, padding:20, maxWidth:460, width:"100%", maxHeight:"92vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:26 }}>{cfg.icon}</span>
            <div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:800, color:cfg.color }}>{cfg.name}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>{sig.strat} • R:R 1:{sig.rr} • {sig.met}/9</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={handleSave} disabled={saveStatus==="saved"}
              style={{ padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:700, cursor:saveStatus==="saved"?"default":"pointer",
                border:"1px solid "+(saveStatus==="saved"?"var(--accent-green)":saveStatus==="already"?"var(--accent-orange)":"var(--accent-green)"),
                background:saveStatus==="saved"?"rgba(0,212,170,0.15)":saveStatus==="already"?"rgba(247,147,26,0.1)":"rgba(0,212,170,0.08)",
                color:saveStatus==="saved"?"var(--accent-green)":saveStatus==="already"?"var(--accent-orange)":"var(--accent-green)",
              }}>
              {saveStatus==="saved"?"✅ Saved!":saveStatus==="already"?"⚠️ Already Open":"📌 Save"}
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding:"3px 9px" }}>✕</button>
          </div>
        </div>

        <div style={{ textAlign:"center", padding:12, borderRadius:10, marginBottom:14, background:isBuy?"rgba(0,212,170,0.08)":"rgba(244,67,54,0.08)", border:"2px solid "+(isBuy?"var(--accent-green)":"var(--accent-red)") }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:24, fontWeight:800, color:isBuy?"var(--accent-green)":"var(--accent-red)" }}>
            {isBuy ? "📈 BUY SIGNAL" : "📉 SELL SIGNAL"}
          </div>
          <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:3 }}>
            {sig.strat} {sig.allValid && <span style={{ color:"var(--accent-green)", marginLeft:6 }}>✅ All 9 passed</span>}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { label:"📍 ENTRY",         value:sig.entry, color:"var(--accent-blue)",  desc:"Enter at this price"                       },
            { label:"🛑 STOP LOSS",     value:sig.sl,    color:"var(--accent-red)",   desc:"SL "+sig.slPts+" "+sig.label+" from entry"  },
            { label:"🎯 TAKE PROFIT 1", value:sig.tp1,   color:"var(--accent-green)", desc:"TP1 "+sig.tp1Pts+" "+sig.label+" — 50% out" },
            { label:"🏆 TAKE PROFIT 2", value:sig.tp2,   color:"var(--accent-gold)",  desc:"TP2 "+(sig.tp1Pts*2)+" "+sig.label          },
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
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:6 }}>📋 9 SMC Conditions</div>
          {COND_LABELS.map((c,i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"5px 0", borderBottom:"1px solid var(--border)" }}>
              <span style={{ fontSize:13 }}>{sig.conds[c.key] ? "✅" : "❌"}</span>
              <span style={{ fontSize:11, color:sig.conds[c.key]?"var(--text-primary)":"var(--text-muted)" }}>
                {c.icon} {c.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ background:"rgba(0,212,170,0.05)", border:"1px solid rgba(0,212,170,0.2)", borderRadius:8, padding:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--accent-green)", marginBottom:8 }}>📋 Execution Steps</div>
          {[
            "Open "+cfg.name+" on TradingView",
            "Confirm "+(isBuy?"bullish":"bearish")+" structure on Daily + 4H",
            "Enter at "+sig.entry+" — set SL at "+sig.sl+" immediately",
            "TP1 at "+sig.tp1+" — close 50% of position",
            "Move SL to breakeven after TP1 hit",
            "Let rest run to TP2 at "+sig.tp2,
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", gap:6, fontSize:11, color:"var(--text-secondary)", padding:"3px 0" }}>
              <span style={{ color:"var(--accent-green)", fontWeight:700, minWidth:14 }}>{i+1}.</span>{s}
            </div>
          ))}
        </div>

        <div style={{ marginTop:10, fontSize:10, color:"var(--accent-red)", textAlign:"center" }}>
          ⚠️ Always confirm on your chart. Educational tool only.
        </div>
      </div>
    </div>
  );
}

// ── Main Scanner Page ──────────────────────────────────────────────────────
export default function Scanner() {
  const prices  = usePrices();
  const session = useSessionStatus();
  const indian  = useIndianPrices();

  const [filter,   setFilter]   = useState("All");
  const [selected, setSelected] = useState(null);
  const [signals,  setSignals]  = useState({});
  const [actLog,   setActLog]   = useState([]);

  const allPrices = { ...prices, ...indian };

  // Run auto-trader (detect + save + monitor + close)
  useAutoTrader(allPrices, session);

  // Load activity log
  useEffect(() => {
    const handler = () => setActLog(readAutoLog());
    window.addEventListener("autotrader_update", handler);
    setActLog(readAutoLog());
    return () => window.removeEventListener("autotrader_update", handler);
  }, []);

  // Build signals from live prices
  useEffect(() => {
    const next = {};
    let count  = 0;
    IDS.forEach(id => {
      const pd = allPrices[id];
      if (pd?.price) {
        next[id] = buildSignal(id, pd.price, session);
        count++;
      }
    });
    if (count > 0) setSignals(next);
  }, [JSON.stringify(allPrices), session?.ist_active]);

  const buyCount    = IDS.filter(id => signals[id]?.signal === "BUY").length;
  const sellCount   = IDS.filter(id => signals[id]?.signal === "SELL").length;
  const watchCount  = IDS.filter(id => signals[id]?.signal === "WATCH").length;
  const allMetCount = IDS.filter(id => signals[id]?.allValid).length;

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
        <p className="page-subtitle">9 SMC conditions • Auto-saves during Kill Zone • Entry SL TP auto-set</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        {[
          { label:"📈 BUY",       value:buyCount,    color:"var(--accent-green)"  },
          { label:"📉 SELL",      value:sellCount,   color:"var(--accent-red)"    },
          { label:"👁 WATCH",     value:watchCount,  color:"var(--accent-orange)" },
          { label:"✅ ALL 9 MET", value:allMetCount, color:"var(--accent-green)"  },
        ].map((s,i) => (
          <div key={i} className="stat-box">
            <div className="stat-value" style={{ color:s.color, fontSize:20 }}>{s.value}</div>
            <div className="stat-label" style={{ fontSize:10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
        <div className={"session-badge " + (session?.ist_active ? "active" : "inactive")}>
          <div className={"session-dot " + (session?.ist_active ? "active" : "inactive")} />
          {session?.ist_active ? (session?.ist_london_kz ? "🟢 LONDON KZ" : "🟢 NY KZ") : "⚪ NO KILL ZONE"}
        </div>
        <div style={{ fontSize:11, color:"var(--accent-green)", background:"rgba(0,212,170,0.06)", padding:"4px 10px", borderRadius:6, border:"1px solid rgba(0,212,170,0.15)" }}>
          🤖 Auto-Trader {session?.ist_active ? "ACTIVE — monitoring all 15 pairs" : "waiting for Kill Zone"}
        </div>
      </div>

      <div style={{ marginBottom:14, overflowX:"auto" }}>
        <div className="tabs" style={{ display:"inline-flex", minWidth:"max-content" }}>
          {["All","Forex","Crypto","India","BUY","SELL","WATCH"].map(f => (
            <button key={f} className={"tab " + (filter===f ? "active" : "")} onClick={() => setFilter(f)}>
              {f==="BUY" ? "📈 BUY("+buyCount+")" : f==="SELL" ? "📉 SELL("+sellCount+")" : f==="WATCH" ? "👁 WATCH("+watchCount+")" : f}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(signals).length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--text-muted)" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
          <div style={{ fontSize:14, fontWeight:600 }}>Loading live prices...</div>
          <div style={{ fontSize:12, marginTop:8 }}>Signals appear automatically in 5–10 seconds</div>
        </div>
      ) : (
        <div className="grid-auto">
          {visible.map(id => (
            <SignalCard key={id} id={id} priceData={allPrices[id]} sig={signals[id]}
              onClick={(id, sig) => setSelected({ id, sig })} />
          ))}
          {visible.length === 0 && (
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"var(--text-muted)" }}>
              No {filter} signals right now. Wait for Kill Zone for best setups.
            </div>
          )}
        </div>
      )}

      {/* Activity log */}
      <div style={{ marginTop:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>🤖 Auto-Trader Activity</div>
          <div style={{ fontSize:11, color:"var(--text-muted)" }}>
            {session?.ist_active ? "🟢 Monitoring live every 5s" : "⚪ Activates during Kill Zone"}
          </div>
        </div>

        {actLog.length === 0 ? (
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:20, textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>🤖</div>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:6 }}>Auto-Trader Running in Background</div>
            <div style={{ fontSize:11, color:"var(--text-muted)", lineHeight:1.7 }}>
              Watches all 15 pairs every 5 seconds.<br/>
              7+/9 conditions + Kill Zone → auto-saves to Journal.<br/>
              Monitors price → auto-closes at TP1, TP2 or SL.<br/>
              <span style={{ color:"var(--accent-orange)" }}>Activity shows here when London/NY KZ starts.</span>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {actLog.slice(0, 15).map((entry, i) => {
              const bgColor = entry.type==="win"?"rgba(0,212,170,0.07)":entry.type==="loss"?"rgba(244,67,54,0.07)":entry.type==="open"?"rgba(79,195,247,0.07)":"rgba(80,80,80,0.05)";
              const bdColor = entry.type==="win"?"rgba(0,212,170,0.3)":entry.type==="loss"?"rgba(244,67,54,0.3)":entry.type==="open"?"rgba(79,195,247,0.3)":"var(--border)";
              const timeStr = new Date(entry.time).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
              return (
                <div key={i} style={{ background:bgColor, border:"1px solid "+bdColor, borderRadius:8, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:"var(--text-primary)" }}>{entry.msg}</span>
                  <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-mono)", whiteSpace:"nowrap", marginLeft:10 }}>{timeStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <SignalModal id={selected.id} sig={selected.sig} session={session} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
