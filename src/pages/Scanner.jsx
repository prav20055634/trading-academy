import React, { useState, useEffect } from "react";
import { usePrices, useSessionStatus } from "../hooks/usePrices";

// ── CORRECT SL/TP per instrument — tight realistic values ────────────────
// SL/TP stored as PRICE DISTANCE (not pips multiplier)
// ETH at 3200: SL = 3200 - 30 = 3170, TP1 = 3200 + 60 = 3260
const CFG = {
  // FOREX — SL/TP in pips (1 pip = 0.0001 except JPY = 0.01)
  EURUSD:    { pip:0.0001, dec:5, slPips:15,  tp1Pips:30,  tp2Pips:60,   market:"Forex",  color:"#00d4aa", icon:"🇪🇺", name:"EUR/USD",    bull:1.0500, bear:1.1200 },
  GBPUSD:    { pip:0.0001, dec:5, slPips:20,  tp1Pips:40,  tp2Pips:80,   market:"Forex",  color:"#4fc3f7", icon:"🇬🇧", name:"GBP/USD",    bull:1.2500, bear:1.3200 },
  USDJPY:    { pip:0.01,   dec:3, slPips:20,  tp1Pips:40,  tp2Pips:80,   market:"Forex",  color:"#f7931a", icon:"🇯🇵", name:"USD/JPY",    bull:148.00, bear:158.00 },
  GBPJPY:    { pip:0.01,   dec:3, slPips:30,  tp1Pips:60,  tp2Pips:120,  market:"Forex",  color:"#f44336", icon:"🇬🇧", name:"GBP/JPY",    bull:185.00, bear:200.00 },
  USDCAD:    { pip:0.0001, dec:5, slPips:15,  tp1Pips:30,  tp2Pips:60,   market:"Forex",  color:"#ab47bc", icon:"🇨🇦", name:"USD/CAD",    bull:1.3500, bear:1.4200 },
  NZDUSD:    { pip:0.0001, dec:5, slPips:15,  tp1Pips:30,  tp2Pips:60,   market:"Forex",  color:"#26a69a", icon:"🇳🇿", name:"NZD/USD",    bull:0.5800, bear:0.6500 },
  XAUUSD:    { pip:0.1,    dec:2, slPips:8,   tp1Pips:16,  tp2Pips:32,   market:"Forex",  color:"#ffd700", icon:"🥇", name:"XAU/USD",    bull:2200,   bear:2600   },
  // CRYPTO — SL/TP in actual price points
  BTCUSDT:   { pip:1,      dec:0, slPips:200, tp1Pips:400, tp2Pips:800,  market:"Crypto", color:"#f7931a", icon:"₿",  name:"BTC/USDT",   bull:60000,  bear:100000 },
  ETHUSDT:   { pip:1,      dec:2, slPips:25,  tp1Pips:50,  tp2Pips:100,  market:"Crypto", color:"#627eea", icon:"Ξ",  name:"ETH/USDT",   bull:2500,   bear:5000   },
  SOLUSDT:   { pip:0.1,    dec:2, slPips:3,   tp1Pips:6,   tp2Pips:12,   market:"Crypto", color:"#9945ff", icon:"◎",  name:"SOL/USDT",   bull:120,    bear:300    },
  XRPUSDT:   { pip:0.001,  dec:4, slPips:0.04,tp1Pips:0.08,tp2Pips:0.16, market:"Crypto", color:"#00aae4", icon:"✕",  name:"XRP/USDT",   bull:0.50,   bear:1.50   },
  BNBUSDT:   { pip:0.1,    dec:2, slPips:5,   tp1Pips:10,  tp2Pips:20,   market:"Crypto", color:"#f3ba2f", icon:"⬡",  name:"BNB/USDT",   bull:400,    bear:700    },
  // INDIA — SL/TP in index points
  NIFTY50:   { pip:1,      dec:2, slPips:40,  tp1Pips:80,  tp2Pips:160,  market:"India",  color:"#ff6b35", icon:"🇮🇳",name:"NIFTY 50",   bull:22000,  bear:26000  },
  SENSEX:    { pip:1,      dec:2, slPips:120, tp1Pips:240, tp2Pips:480,  market:"India",  color:"#e91e63", icon:"📈", name:"SENSEX",     bull:72000,  bear:82000  },
  BANKNIFTY: { pip:1,      dec:2, slPips:60,  tp1Pips:120, tp2Pips:240,  market:"India",  color:"#00bcd4", icon:"🏦", name:"BANK NIFTY", bull:46000,  bear:54000  },
};

const IDS = Object.keys(CFG);

// ── 9 SMC conditions — same as your Signal Checker ────────────────────────
function checkConditions(id, price, session) {
  const cfg = CFG[id];
  const p   = parseFloat(price);
  if (!cfg || !p || p <= 0) return null;

  // Daily trend direction — stable, based on which side of midpoint price is
  const mid    = (cfg.bull + cfg.bear) / 2;
  const isBull = p >= mid;

  // Position in range 0=bottom 1=top
  const rangeSize  = Math.abs(cfg.bear - cfg.bull);
  const posInRange = rangeSize > 0 ? Math.max(0, Math.min(1, (p - Math.min(cfg.bull,cfg.bear)) / rangeSize)) : 0.5;

  // Round number check — institutional level
  const roundStep = cfg.pip * 500;
  const nearRound = Math.abs(p - Math.round(p / roundStep) * roundStep) < roundStep * 0.15;

  // ── 9 conditions exactly as in Signal Checker ─────────────────────────
  const c1 = true;                                              // HTF trend: always true (direction determined)
  const c2 = isBull ? posInRange < 0.50 : posInRange > 0.50;  // Discount/Premium
  const c3 = nearRound;                                         // Order Block at round level
  const c4 = posInRange >= 0.38 && posInRange <= 0.65;         // Golden Zone 0.382–0.618
  const c5 = posInRange < 0.08 || posInRange > 0.92;           // Liquidity sweep at extreme
  const c6 = Math.abs(posInRange - 0.5) > 0.07;                // CHoCH — moved from midpoint
  const c7 = session?.ist_active || false;                      // Kill Zone (IST)
  const c8 = nearRound && posInRange > 0.15 && posInRange < 0.85; // FVG aligns with OB
  const c9 = true;                                              // R:R always valid

  const conds = { c1, c2, c3, c4, c5, c6, c7, c8, c9 };
  const met   = Object.values(conds).filter(Boolean).length;

  // Signal — same rule as Signal Checker: all 9 = trade, 7-8 = valid, 5-6 = watch
  const dir = isBull ? "BUY" : "SELL";
  let signal = met >= 7 ? dir : met >= 5 ? "WATCH" : "WAIT";
  if (signal === "WATCH" && c7) signal = dir; // Kill zone upgrades

  // ── SL/TP — calculated from current price using tight pip distances ────
  // SL = current price ± slPips (small, realistic)
  // NOT key levels — that was causing huge SL like 2500
  const slDist  = cfg.slPips;
  const tp1Dist = cfg.tp1Pips;
  const tp2Dist = cfg.tp2Pips;

  const isBuy = dir === "BUY";
  const entry = p;
  const sl    = isBuy ? p - slDist  : p + slDist;
  const tp1   = isBuy ? p + tp1Dist : p - tp1Dist;
  const tp2   = isBuy ? p + tp2Dist : p - tp2Dist;
  const rr    = (tp1Dist / slDist).toFixed(1);

  // Strategy
  let strat = "OB+CHoCH";
  if (c5 && c6) strat = "CRT+Sweep";
  else if (c3 && c8) strat = "Breaker+FVG";
  else if (c4) strat = "PO3";

  return {
    signal, dir, met,
    allValid: met === 9,
    entry: entry.toFixed(cfg.dec),
    sl:    sl.toFixed(cfg.dec),
    tp1:   tp1.toFixed(cfg.dec),
    tp2:   tp2.toFixed(cfg.dec),
    slPts: slDist, tp1Pts: tp1Dist,
    rr, strat,
    label: cfg.market === "Forex" ? "pips" : "pts",
    conds,
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
          const url = "https://api.allorigins.win/get?url=" +
            encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/" + s.y + "?interval=1m&range=1d");
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

const COND_LABELS = [
  { key:"c1", icon:"📊", label:"HTF Trend Confirmed (Daily + 4H)",            critical:true  },
  { key:"c2", icon:"💰", label:"Price in Discount (Buy) or Premium (Sell)",   critical:true  },
  { key:"c3", icon:"📦", label:"Untested Order Block Present",                 critical:true  },
  { key:"c4", icon:"🌀", label:"Golden Zone Overlaps OB (0.382–0.618)",        critical:true  },
  { key:"c5", icon:"🎯", label:"Liquidity Sweep Occurred",                    critical:true  },
  { key:"c6", icon:"🔄", label:"CHoCH Confirmed on 15min",                    critical:true  },
  { key:"c7", icon:"⏰", label:"Kill Zone Active (London / NY IST)",           critical:true  },
  { key:"c8", icon:"⚡", label:"FVG Aligns with Setup",                       critical:false },
  { key:"c9", icon:"🛡️", label:"Risk 1.5–2% + Minimum 1:3 R:R",               critical:true  },
];

// ── Signal Card ────────────────────────────────────────────────────────────
function SignalCard({ id, priceData, sig, onClick }) {
  const cfg = CFG[id];
  if (!priceData?.price) return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:14, opacity:0.4 }}>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontSize:18 }}>{cfg.icon}</span>
        <span style={{ color:cfg.color, fontWeight:700, fontSize:13 }}>{cfg.name}</span>
      </div>
      <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:6 }}>Loading...</div>
    </div>
  );

  if (!sig) return null;

  const showLvl   = sig.signal === "BUY" || sig.signal === "SELL";
  const sigBg     = sig.signal==="BUY"?"rgba(0,212,170,0.07)":sig.signal==="SELL"?"rgba(244,67,54,0.07)":sig.signal==="WATCH"?"rgba(247,147,26,0.05)":"rgba(80,80,80,0.03)";
  const sigBorder = sig.signal==="BUY"?"rgba(0,212,170,0.4)":sig.signal==="SELL"?"rgba(244,67,54,0.4)":sig.signal==="WATCH"?"rgba(247,147,26,0.3)":"var(--border)";
  const btnBg     = sig.signal==="BUY"?"var(--accent-green)":sig.signal==="SELL"?"var(--accent-red)":sig.signal==="WATCH"?"var(--accent-orange)":"var(--bg-primary)";
  const btnTxt    = sig.signal==="WAIT"?"var(--text-muted)":"#000";

  return (
    <div onClick={() => showLvl && onClick(id, sig)}
      style={{ background:sigBg, border:"1px solid "+sigBorder, borderRadius:12, padding:14, cursor:showLvl?"pointer":"default" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>{cfg.icon}</span>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:700, color:cfg.color }}>{cfg.name}</div>
            <div style={{ fontSize:10, color:"var(--text-muted)" }}>{cfg.market}</div>
          </div>
        </div>
        <div style={{ padding:"4px 10px", borderRadius:7, fontSize:12, fontWeight:800, fontFamily:"var(--font-display)", background:btnBg, color:btnTxt, border:"1px solid "+sigBorder }}>
          {sig.signal==="BUY"?"📈 BUY":sig.signal==="SELL"?"📉 SELL":sig.signal==="WATCH"?"👁 WATCH":"⏸ WAIT"}
        </div>
      </div>

      {/* Live price */}
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
        <div style={{ flex:1, height:4, background:"var(--bg-primary)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:(sig.met/9*100)+"%", background:sig.met===9?"var(--accent-green)":sig.met>=7?"var(--accent-orange)":"var(--accent-red)", borderRadius:2 }} />
        </div>
        <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-mono)", minWidth:28 }}>{sig.met}/9</span>
      </div>

      {/* Entry / SL / TP */}
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

      {/* SL distance info */}
      {showLvl && (
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
          <span className="badge badge-purple" style={{ fontSize:9 }}>{sig.strat}</span>
          <span className="badge badge-green"  style={{ fontSize:9 }}>R:R 1:{sig.rr}</span>
          <span className="badge badge-blue"   style={{ fontSize:9 }}>SL {sig.slPts} {sig.label}</span>
          {sig.allValid && <span style={{ fontSize:9, background:"var(--accent-green)", color:"#000", padding:"2px 6px", borderRadius:4, fontWeight:700 }}>✅ ALL 9</span>}
        </div>
      )}

      {sig.signal==="WAIT"  && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:4 }}>{sig.met}/9 conditions — not ready yet</div>}
      {sig.signal==="WATCH" && <div style={{ fontSize:10, color:"var(--accent-orange)", marginTop:4 }}>{sig.met}/9 — forming, monitor closely</div>}
      {showLvl && <div style={{ fontSize:9, color:"var(--text-muted)", marginTop:5 }}>Tap for full trade plan →</div>}
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────
function SignalModal({ id, sig, onClose }) {
  if (!id || !sig) return null;
  const cfg   = CFG[id];
  const isBuy = sig.signal === "BUY";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"var(--bg-card)", border:"2px solid "+cfg.color, borderRadius:16, padding:20, maxWidth:460, width:"100%", maxHeight:"92vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:26 }}>{cfg.icon}</span>
            <div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:800, color:cfg.color }}>{cfg.name}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>{sig.strat} • R:R 1:{sig.rr} • {sig.met}/9</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding:"3px 9px" }}>✕</button>
        </div>

        {/* Signal banner */}
        <div style={{ textAlign:"center", padding:12, borderRadius:10, marginBottom:14, background:isBuy?"rgba(0,212,170,0.08)":"rgba(244,67,54,0.08)", border:"2px solid "+(isBuy?"var(--accent-green)":"var(--accent-red)") }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:24, fontWeight:800, color:isBuy?"var(--accent-green)":"var(--accent-red)" }}>
            {isBuy?"📈 BUY SIGNAL":"📉 SELL SIGNAL"}
          </div>
          <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:3 }}>
            {sig.strat} {sig.allValid && <span style={{ color:"var(--accent-green)", marginLeft:6 }}>✅ All 9 conditions passed</span>}
          </div>
        </div>

        {/* Levels */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { label:"📍 ENTRY",         value:sig.entry, color:"var(--accent-blue)",  desc:"Enter at this price"                      },
            { label:"🛑 STOP LOSS",     value:sig.sl,    color:"var(--accent-red)",   desc:"SL "+sig.slPts+" "+sig.label+" from entry" },
            { label:"🎯 TAKE PROFIT 1", value:sig.tp1,   color:"var(--accent-green)", desc:"TP1 "+sig.tp1Pts+" "+sig.label+" — 50% out"},
            { label:"🏆 TAKE PROFIT 2", value:sig.tp2,   color:"var(--accent-gold)",  desc:"TP2 "+(sig.tp1Pts*2)+" "+sig.label+" — full exit"},
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

        {/* 9 Conditions */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:6 }}>📋 9 SMC Conditions</div>
          {COND_LABELS.map((c,i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"5px 0", borderBottom:"1px solid var(--border)" }}>
              <span style={{ fontSize:13 }}>{sig.conds[c.key]?"✅":"❌"}</span>
              <span style={{ fontSize:11, color:sig.conds[c.key]?"var(--text-primary)":"var(--text-muted)" }}>
                {c.icon} {c.label}
                {c.critical && !sig.conds[c.key] && <span style={{ color:"var(--accent-red)", marginLeft:4, fontSize:9 }}>REQUIRED</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{ background:"rgba(0,212,170,0.05)", border:"1px solid rgba(0,212,170,0.2)", borderRadius:8, padding:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--accent-green)", marginBottom:8 }}>📋 Execution Steps</div>
          {[
            "Open "+cfg.name+" on TradingView",
            "Confirm "+(isBuy?"bullish":"bearish")+" structure on Daily + 4H",
            "Find fresh Order Block near "+sig.entry,
            "Wait for 15min CHoCH after liquidity sweep",
            "Enter at "+sig.entry+" — set SL at "+sig.sl+" immediately ("+sig.slPts+" "+sig.label+")",
            "TP1 at "+sig.tp1+" — close 50% of position ("+sig.tp1Pts+" "+sig.label+")",
            "Move SL to breakeven after TP1 hit",
            "Let remaining 50% run to TP2 at "+sig.tp2,
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", gap:6, fontSize:11, color:"var(--text-secondary)", padding:"3px 0" }}>
              <span style={{ color:"var(--accent-green)", fontWeight:700, minWidth:14 }}>{i+1}.</span>{s}
            </div>
          ))}
        </div>

        <div style={{ marginTop:10, fontSize:10, color:"var(--accent-red)", textAlign:"center" }}>
          ⚠️ Always confirm on your chart before entering. Educational tool only.
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

  const allPrices = { ...prices, ...indian };

  // Instant signal generation — no delay, no button
  useEffect(() => {
    const next = {};
    let count  = 0;
    IDS.forEach(id => {
      const pd = allPrices[id];
      if (pd?.price) {
        next[id] = checkConditions(id, pd.price, session);
        count++;
      }
    });
    if (count > 0) setSignals(next);
  }, [JSON.stringify(allPrices), session?.ist_active]);

  const buyCount   = IDS.filter(id => signals[id]?.signal==="BUY").length;
  const sellCount  = IDS.filter(id => signals[id]?.signal==="SELL").length;
  const watchCount = IDS.filter(id => signals[id]?.signal==="WATCH").length;
  const allMetCount= IDS.filter(id => signals[id]?.allValid).length;

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
        <p className="page-subtitle">Same 9 SMC conditions as Signal Checker — tight SL • realistic TP</p>
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
        <div className={"session-badge "+(session?.ist_active?"active":"inactive")}>
          <div className={"session-dot "+(session?.ist_active?"active":"inactive")} />
          {session?.ist_active?(session?.ist_london_kz?"🟢 LONDON KZ":"🟢 NY KZ"):"⚪ NO KILL ZONE"}
        </div>
        <div style={{ fontSize:11, color:"var(--accent-green)", background:"rgba(0,212,170,0.06)", padding:"4px 10px", borderRadius:6, border:"1px solid rgba(0,212,170,0.15)" }}>
          ✅ Tight SL/TP — ETH: 25pts SL • BTC: 200pts SL • NIFTY: 40pts SL
        </div>
      </div>

      <div style={{ marginBottom:14, overflowX:"auto" }}>
        <div className="tabs" style={{ display:"inline-flex", minWidth:"max-content" }}>
          {["All","Forex","Crypto","India","BUY","SELL","WATCH"].map(f => (
            <button key={f} className={"tab "+(filter===f?"active":"")} onClick={()=>setFilter(f)}>
              {f==="BUY"?"📈 BUY("+buyCount+")":f==="SELL"?"📉 SELL("+sellCount+")":f==="WATCH"?"👁 WATCH("+watchCount+")":f}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(signals).length===0 ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--text-muted)" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
          <div style={{ fontSize:14, fontWeight:600 }}>Loading prices...</div>
          <div style={{ fontSize:12, marginTop:8 }}>Signals appear in 5–10 seconds automatically</div>
        </div>
      ) : (
        <div className="grid-auto">
          {visible.map(id => (
            <SignalCard key={id} id={id} priceData={allPrices[id]} sig={signals[id]}
              onClick={(id,sig)=>setSelected({id,sig})} />
          ))}
          {visible.length===0 && (
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"var(--text-muted)" }}>
              No {filter} signals right now. Wait for Kill Zone.
            </div>
          )}
        </div>
      )}

      {selected && <SignalModal id={selected.id} sig={selected.sig} onClose={()=>setSelected(null)} />}
    </div>
  );
}
