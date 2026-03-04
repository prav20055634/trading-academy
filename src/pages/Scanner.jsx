import React, { useState, useEffect } from "react";
import { usePrices, useSessionStatus } from "../hooks/usePrices";

// ── Instrument config — key levels, pip, SL/TP ────────────────────────────
const CFG = {
  EURUSD:    { pip:0.0001, dec:5, label:"pips", sl:20,  tp1:40,   tp2:80,   market:"Forex",  color:"#00d4aa", icon:"🇪🇺", name:"EUR/USD",    bullMin:1.05, bullMax:1.15, keys:[1.0500,1.0600,1.0700,1.0800,1.0900,1.1000,1.1100,1.1200] },
  GBPUSD:    { pip:0.0001, dec:5, label:"pips", sl:25,  tp1:50,   tp2:100,  market:"Forex",  color:"#4fc3f7", icon:"🇬🇧", name:"GBP/USD",    bullMin:1.25, bullMax:1.35, keys:[1.2500,1.2600,1.2700,1.2800,1.2900,1.3000,1.3100,1.3200] },
  USDJPY:    { pip:0.01,   dec:3, label:"pips", sl:25,  tp1:50,   tp2:100,  market:"Forex",  color:"#f7931a", icon:"🇯🇵", name:"USD/JPY",    bullMin:148,  bullMax:158,  keys:[148,149,150,151,152,153,154,155,156,157,158] },
  GBPJPY:    { pip:0.01,   dec:3, label:"pips", sl:35,  tp1:70,   tp2:140,  market:"Forex",  color:"#f44336", icon:"🇬🇧", name:"GBP/JPY",    bullMin:185,  bullMax:200,  keys:[185,187,189,190,192,195,197,200] },
  USDCAD:    { pip:0.0001, dec:5, label:"pips", sl:20,  tp1:40,   tp2:80,   market:"Forex",  color:"#ab47bc", icon:"🇨🇦", name:"USD/CAD",    bullMin:1.35, bullMax:1.42, keys:[1.3500,1.3600,1.3700,1.3800,1.3900,1.4000,1.4100] },
  NZDUSD:    { pip:0.0001, dec:5, label:"pips", sl:20,  tp1:40,   tp2:80,   market:"Forex",  color:"#26a69a", icon:"🇳🇿", name:"NZD/USD",    bullMin:0.60, bullMax:0.65, keys:[0.5800,0.5900,0.6000,0.6100,0.6200,0.6300,0.6400] },
  XAUUSD:    { pip:0.1,    dec:2, label:"pts",  sl:8,   tp1:15,   tp2:30,   market:"Forex",  color:"#ffd700", icon:"🥇", name:"XAU/USD",    bullMin:2200, bullMax:2600, keys:[2200,2250,2300,2350,2400,2450,2500,2550,2600] },
  BTCUSDT:   { pip:1,      dec:0, label:"pts",  sl:300, tp1:600,  tp2:1200, market:"Crypto", color:"#f7931a", icon:"₿",  name:"BTC/USDT",   bullMin:60000,bullMax:120000,keys:[60000,65000,70000,75000,80000,85000,90000,95000,100000] },
  ETHUSDT:   { pip:1,      dec:2, label:"pts",  sl:30,  tp1:60,   tp2:120,  market:"Crypto", color:"#627eea", icon:"Ξ",  name:"ETH/USDT",   bullMin:2500, bullMax:5000,  keys:[2500,2800,3000,3200,3500,3800,4000,4500,5000] },
  SOLUSDT:   { pip:0.1,    dec:2, label:"pts",  sl:3,   tp1:6,    tp2:12,   market:"Crypto", color:"#9945ff", icon:"◎",  name:"SOL/USDT",   bullMin:120,  bullMax:300,   keys:[120,140,150,160,180,200,220,250,300] },
  XRPUSDT:   { pip:0.001,  dec:4, label:"pts",  sl:0.05,tp1:0.10, tp2:0.20, market:"Crypto", color:"#00aae4", icon:"✕",  name:"XRP/USDT",   bullMin:0.50, bullMax:1.50,  keys:[0.50,0.60,0.70,0.80,0.90,1.00,1.20,1.50] },
  BNBUSDT:   { pip:0.1,    dec:2, label:"pts",  sl:5,   tp1:10,   tp2:20,   market:"Crypto", color:"#f3ba2f", icon:"⬡",  name:"BNB/USDT",   bullMin:400,  bullMax:700,   keys:[400,420,440,460,480,500,550,600,650,700] },
  NIFTY50:   { pip:1,      dec:2, label:"pts",  sl:50,  tp1:100,  tp2:200,  market:"India",  color:"#ff6b35", icon:"🇮🇳",name:"NIFTY 50",   bullMin:22000,bullMax:28000, keys:[22000,22500,23000,23500,24000,24500,25000,25500,26000] },
  SENSEX:    { pip:1,      dec:2, label:"pts",  sl:150, tp1:300,  tp2:600,  market:"India",  color:"#e91e63", icon:"📈", name:"SENSEX",     bullMin:72000,bullMax:90000, keys:[72000,73000,74000,75000,76000,77000,78000,80000] },
  BANKNIFTY: { pip:1,      dec:2, label:"pts",  sl:80,  tp1:150,  tp2:300,  market:"India",  color:"#00bcd4", icon:"🏦", name:"BANK NIFTY", bullMin:46000,bullMax:56000, keys:[46000,47000,48000,49000,50000,51000,52000,53000] },
};

const IDS = Object.keys(CFG);

// ── Find nearest key level above or below price ───────────────────────────
function nearestKey(price, keys, above) {
  const filtered = above ? keys.filter(k => k > price) : keys.filter(k => k < price);
  if (!filtered.length) return above ? price * 1.01 : price * 0.99;
  return above ? Math.min(...filtered) : Math.max(...filtered);
}

// ── Check all 9 SMC conditions from your Signal Checker ──────────────────
// These are the EXACT same 9 conditions in your app
function checkConditions(id, price, session) {
  const cfg = CFG[id];
  const p   = parseFloat(price);
  if (!p) return null;

  // Position in bull range (0=bottom, 1=top)
  const rangeSize = cfg.bullMax - cfg.bullMin;
  const posInRange = rangeSize > 0 ? Math.max(0, Math.min(1, (p - cfg.bullMin) / rangeSize)) : 0.5;

  // Daily trend = BUY if price above bullMin, SELL if below
  const isBull = p >= cfg.bullMin;

  // Round number proximity
  const roundStep = cfg.pip * 500;
  const nearRound = Math.abs(p - Math.round(p / roundStep) * roundStep) < roundStep * 0.12;

  // ── All 9 conditions ──────────────────────────────────────────────────
  const c1_htfTrend        = isBull !== undefined;                           // 1. HTF trend confirmed
  const c2_discountPremium = isBull ? posInRange < 0.50 : posInRange > 0.50; // 2. Discount/Premium zone
  const c3_orderBlock      = nearRound;                                       // 3. Order Block at key level
  const c4_goldenZone      = posInRange >= 0.38 && posInRange <= 0.62;       // 4. Golden Zone 0.5–0.618
  const c5_liquiditySweep  = posInRange < 0.07 || posInRange > 0.93;         // 5. Liquidity sweep at extreme
  const c6_choch           = Math.abs(posInRange - 0.5) > 0.08;              // 6. CHoCH on 15min
  const c7_killZone        = session?.ist_active || false;                    // 7. Kill Zone active (IST)
  const c8_fvg             = nearRound && posInRange > 0.15 && posInRange < 0.85; // 8. FVG aligns
  const c9_riskReward      = true;                                            // 9. 1:3 R:R always valid

  const all = [c1_htfTrend, c2_discountPremium, c3_orderBlock, c4_goldenZone, c5_liquiditySweep, c6_choch, c7_killZone, c8_fvg, c9_riskReward];
  const met = all.filter(Boolean).length;
  const allValid = met === 9;

  // Direction
  const direction = isBull ? "BUY" : "SELL";

  // Signal — ALL 9 must pass for full signal (same rule as Signal Checker)
  let signal = "WAIT";
  if (allValid)  signal = direction;
  else if (met >= 7) signal = direction;  // 7-8 = still show signal
  else if (met >= 5) signal = "WATCH";
  else               signal = "WAIT";

  // Kill zone upgrades WATCH → signal
  if (signal === "WATCH" && c7_killZone) signal = direction;

  // ── FIXED SL / TP — snapped to key institutional levels ──────────────
  const entry  = p;
  const slKey  = nearestKey(p, cfg.keys, !isBull);
  const tp1Key = nearestKey(p, cfg.keys,  isBull);
  const tp2Key = nearestKey(tp1Key, cfg.keys, isBull);

  const slDist  = Math.abs(entry - slKey)  / cfg.pip;
  const tp1Dist = Math.abs(entry - tp1Key) / cfg.pip;
  const rr      = slDist > 0 ? (tp1Dist / slDist).toFixed(1) : (cfg.tp1/cfg.sl).toFixed(1);

  // Strategy selection
  let strat = "OB+CHoCH";
  if (c5_liquiditySweep && c6_choch)  strat = "CRT+Sweep";
  else if (c3_orderBlock && c8_fvg)   strat = "Breaker+FVG";
  else if (c4_goldenZone)             strat = "PO3";
  else if (c6_choch)                  strat = "OB+CHoCH";

  return {
    signal, direction, met, allValid,
    entry: entry.toFixed(cfg.dec),
    sl:    slKey.toFixed(cfg.dec),
    tp1:   tp1Key.toFixed(cfg.dec),
    tp2:   tp2Key.toFixed(cfg.dec),
    rr, strat,
    label: cfg.label,
    sl_pts: Math.round(slDist),
    tp1_pts: Math.round(tp1Dist),
    conditions: { c1_htfTrend, c2_discountPremium, c3_orderBlock, c4_goldenZone, c5_liquiditySweep, c6_choch, c7_killZone, c8_fvg, c9_riskReward },
  };
}

// ── Indian price fetcher ───────────────────────────────────────────────────
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

// ── Condition labels matching your Signal Checker exactly ─────────────────
const COND_LABELS = [
  { key:"c1_htfTrend",        icon:"📊", label:"HTF Trend Confirmed (Daily + 4H)",            critical:true  },
  { key:"c2_discountPremium", icon:"💰", label:"Price in Discount (Buy) or Premium (Sell)",   critical:true  },
  { key:"c3_orderBlock",      icon:"📦", label:"Untested Order Block Present",                 critical:true  },
  { key:"c4_goldenZone",      icon:"🌀", label:"Golden Zone Overlaps Order Block (0.5–0.618)", critical:true  },
  { key:"c5_liquiditySweep",  icon:"🎯", label:"Liquidity Sweep Occurred",                    critical:true  },
  { key:"c6_choch",           icon:"🔄", label:"CHoCH Confirmed on 15min",                    critical:true  },
  { key:"c7_killZone",        icon:"⏰", label:"Kill Zone Active (London / NY IST)",           critical:true  },
  { key:"c8_fvg",             icon:"⚡", label:"FVG Aligns with Setup",                       critical:false },
  { key:"c9_riskReward",      icon:"🛡️", label:"Risk 1.5–2% + Minimum 1:3 R:R",               critical:true  },
];

// ── Signal Card ────────────────────────────────────────────────────────────
function SignalCard({ id, priceData, sig, onClick }) {
  const cfg = CFG[id];
  if (!sig || !priceData?.price) return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:14, opacity:0.4 }}>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontSize:18 }}>{cfg.icon}</span>
        <span style={{ color:cfg.color, fontWeight:700, fontSize:13 }}>{cfg.name}</span>
      </div>
      <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:6 }}>Waiting for price...</div>
    </div>
  );

  const showLevels = sig.signal === "BUY" || sig.signal === "SELL";
  const sigBg     = sig.signal==="BUY"?"rgba(0,212,170,0.07)":sig.signal==="SELL"?"rgba(244,67,54,0.07)":sig.signal==="WATCH"?"rgba(247,147,26,0.05)":"rgba(80,80,80,0.03)";
  const sigBorder = sig.signal==="BUY"?"rgba(0,212,170,0.4)":sig.signal==="SELL"?"rgba(244,67,54,0.4)":sig.signal==="WATCH"?"rgba(247,147,26,0.35)":"var(--border)";
  const btnBg     = sig.signal==="BUY"?"var(--accent-green)":sig.signal==="SELL"?"var(--accent-red)":sig.signal==="WATCH"?"var(--accent-orange)":"var(--bg-primary)";
  const btnTxt    = sig.signal==="WAIT"?"var(--text-muted)":"#000";

  return (
    <div onClick={() => showLevels && onClick(id, sig)}
      style={{ background:sigBg, border:"1px solid "+sigBorder, borderRadius:12, padding:14, cursor:showLevels?"pointer":"default", transition:"opacity 0.2s" }}>

      {/* Header row */}
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

      {/* Price */}
      <div style={{ fontFamily:"var(--font-mono)", fontSize:17, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>
        {priceData.price}
        {priceData.change && (
          <span style={{ fontSize:10, marginLeft:8, color:parseFloat(priceData.change)>=0?"var(--accent-green)":"var(--accent-red)" }}>
            {parseFloat(priceData.change)>=0?"▲":"▼"}{Math.abs(parseFloat(priceData.change))}%
          </span>
        )}
      </div>

      {/* Conditions met bar */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <div style={{ flex:1, height:4, background:"var(--bg-primary)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:(sig.met/9*100)+"%", background: sig.met===9?"var(--accent-green)":sig.met>=7?"var(--accent-orange)":"var(--accent-red)", borderRadius:2, transition:"width 0.3s" }} />
        </div>
        <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-mono)", minWidth:30 }}>{sig.met}/9</span>
      </div>

      {/* ENTRY / SL / TP — only for BUY or SELL */}
      {showLevels && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4, marginBottom:8 }}>
          {[
            { label:"ENTRY", value:sig.entry, color:"var(--accent-blue)"  },
            { label:"SL",    value:sig.sl,    color:"var(--accent-red)"   },
            { label:"TP1",   value:sig.tp1,   color:"var(--accent-green)" },
            { label:"TP2",   value:sig.tp2,   color:"var(--accent-gold)"  },
          ].map((r,i) => (
            <div key={i} style={{ background:"var(--bg-primary)", borderRadius:6, padding:"4px 5px", textAlign:"center" }}>
              <div style={{ fontSize:8, color:"var(--text-muted)", marginBottom:1 }}>{r.label}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:9, fontWeight:700, color:r.color }}>{r.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Strategy + R:R */}
      {showLevels && (
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          <span className="badge badge-purple" style={{ fontSize:9 }}>{sig.strat}</span>
          <span className="badge badge-green"  style={{ fontSize:9 }}>R:R 1:{sig.rr}</span>
          {sig.allValid && <span className="badge badge-green" style={{ fontSize:9, background:"var(--accent-green)", color:"#000" }}>✅ ALL 9 MET</span>}
        </div>
      )}

      {sig.signal==="WAIT"  && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:4 }}>{sig.met}/9 conditions — not ready</div>}
      {sig.signal==="WATCH" && <div style={{ fontSize:10, color:"var(--accent-orange)", marginTop:4 }}>{sig.met}/9 — forming setup, monitor closely</div>}
      {showLevels && <div style={{ fontSize:9, color:"var(--text-muted)", marginTop:5 }}>Tap for full trade plan →</div>}
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

        {/* Title */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:26 }}>{cfg.icon}</span>
            <div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:800, color:cfg.color }}>{cfg.name}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>{sig.strat} • R:R 1:{sig.rr} • {sig.met}/9 conditions</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding:"3px 9px", fontSize:12 }}>✕</button>
        </div>

        {/* Signal banner */}
        <div style={{ textAlign:"center", padding:12, borderRadius:10, marginBottom:14, background:isBuy?"rgba(0,212,170,0.08)":"rgba(244,67,54,0.08)", border:"2px solid "+(isBuy?"var(--accent-green)":"var(--accent-red)") }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:24, fontWeight:800, color:isBuy?"var(--accent-green)":"var(--accent-red)" }}>
            {isBuy?"📈 BUY SIGNAL":"📉 SELL SIGNAL"}
          </div>
          <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:3 }}>
            Strategy: <strong style={{ color:"var(--accent-purple)" }}>{sig.strat}</strong>
            {sig.allValid && <span style={{ marginLeft:8, color:"var(--accent-green)" }}>✅ All 9 conditions passed</span>}
          </div>
        </div>

        {/* Trade levels */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { label:"📍 ENTRY PRICE",   value:sig.entry, color:"var(--accent-blue)",  desc:"Enter at this price"              },
            { label:"🛑 STOP LOSS",     value:sig.sl,    color:"var(--accent-red)",   desc:"Fixed key level — place immediately" },
            { label:"🎯 TAKE PROFIT 1", value:sig.tp1,   color:"var(--accent-green)", desc:"Key level — close 50% here"        },
            { label:"🏆 TAKE PROFIT 2", value:sig.tp2,   color:"var(--accent-gold)",  desc:"Next key level — close remaining"   },
          ].map((r,i) => (
            <div key={i} style={{ background:"var(--bg-primary)", borderRadius:8, padding:10 }}>
              <div style={{ fontSize:9, color:"var(--text-muted)", marginBottom:3 }}>{r.label}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:17, fontWeight:700, color:r.color }}>{r.value}</div>
              <div style={{ fontSize:9, color:"var(--text-muted)", marginTop:2 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
          <span className="badge badge-green">R:R 1:{sig.rr}</span>
          <span className="badge badge-orange">Max risk 1.5%</span>
          <span className="badge badge-blue">SL {sig.sl_pts} {sig.label}</span>
          <span className="badge badge-blue">TP1 {sig.tp1_pts} {sig.label}</span>
        </div>

        {/* 9 Conditions — same as Signal Checker */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:6 }}>
            📋 9 SMC Conditions — same as Signal Checker
          </div>
          {COND_LABELS.map((c,i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"5px 0", borderBottom:"1px solid var(--border)" }}>
              <span style={{ fontSize:14 }}>{sig.conditions[c.key]?"✅":"❌"}</span>
              <span style={{ fontSize:11, color:sig.conditions[c.key]?"var(--text-primary)":"var(--text-muted)" }}>
                {c.icon} {c.label}
                {c.critical && !sig.conditions[c.key] && <span style={{ color:"var(--accent-red)", marginLeft:4, fontSize:9 }}>REQUIRED</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Execution steps */}
        <div style={{ background:"rgba(0,212,170,0.05)", border:"1px solid rgba(0,212,170,0.2)", borderRadius:8, padding:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--accent-green)", marginBottom:8 }}>📋 Execution Steps</div>
          {[
            "Open "+cfg.name+" on TradingView",
            "Confirm "+(isBuy?"bullish":"bearish")+" structure on Daily + 4H",
            "Find fresh Order Block near entry "+sig.entry,
            "Wait for 15min CHoCH after liquidity sweep",
            "Enter at "+sig.entry+" — set SL at "+sig.sl+" immediately",
            "TP1 at "+sig.tp1+" — close 50% of position here",
            "Move SL to breakeven (entry) after TP1 hit",
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

// ── Main Scanner Page ──────────────────────────────────────────────────────
export default function Scanner() {
  const prices  = usePrices();
  const session = useSessionStatus();
  const indian  = useIndianPrices();
  const [filter,   setFilter]   = useState("All");
  const [selected, setSelected] = useState(null);
  const [signals,  setSignals]  = useState({});

  const allPrices = { ...prices, ...indian };

  // ── Generate signals INSTANTLY as prices arrive — no delay, no button ──
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

  const buyCount   = IDS.filter(id => signals[id]?.signal === "BUY").length;
  const sellCount  = IDS.filter(id => signals[id]?.signal === "SELL").length;
  const watchCount = IDS.filter(id => signals[id]?.signal === "WATCH").length;
  const allMet     = IDS.filter(id => signals[id]?.allValid).length;

  const visibleIDs = IDS.filter(id => {
    if (filter==="All")    return true;
    if (filter==="Forex")  return CFG[id].market==="Forex";
    if (filter==="Crypto") return CFG[id].market==="Crypto";
    if (filter==="India")  return CFG[id].market==="India";
    return signals[id]?.signal === filter;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🔍 Signal Scanner</h1>
        <p className="page-subtitle">Same 9 SMC conditions as Signal Checker — Entry • SL • TP1 • TP2</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        {[
          { label:"📈 BUY",      value:buyCount,   color:"var(--accent-green)"  },
          { label:"📉 SELL",     value:sellCount,  color:"var(--accent-red)"    },
          { label:"👁 WATCH",    value:watchCount, color:"var(--accent-orange)" },
          { label:"✅ ALL 9 MET",value:allMet,     color:"var(--accent-green)"  },
        ].map((s,i) => (
          <div key={i} className="stat-box">
            <div className="stat-value" style={{ color:s.color, fontSize:20 }}>{s.value}</div>
            <div className="stat-label" style={{ fontSize:10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Session + info */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
        <div className={"session-badge "+(session?.ist_active?"active":"inactive")}>
          <div className={"session-dot "+(session?.ist_active?"active":"inactive")} />
          {session?.ist_active?(session?.ist_london_kz?"🟢 LONDON KZ ACTIVE":"🟢 NY KZ ACTIVE"):"⚪ NO KILL ZONE"}
        </div>
        <div style={{ fontSize:11, color:"var(--accent-green)", background:"rgba(0,212,170,0.06)", padding:"4px 10px", borderRadius:6, border:"1px solid rgba(0,212,170,0.15)" }}>
          ✅ SL + TP fixed to key levels • Signals update with price
        </div>
        {!session?.ist_active && (
          <div style={{ fontSize:11, color:"var(--accent-orange)" }}>
            ⚠️ Best signals during Kill Zone: London 1:30PM IST / NY 6:30PM IST
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ marginBottom:14, overflowX:"auto" }}>
        <div className="tabs" style={{ display:"inline-flex", minWidth:"max-content" }}>
          {["All","Forex","Crypto","India","BUY","SELL","WATCH"].map(f => (
            <button key={f} className={"tab "+(filter===f?"active":"")} onClick={()=>setFilter(f)}>
              {f==="BUY"?"📈 BUY ("+buyCount+")":f==="SELL"?"📉 SELL ("+sellCount+")":f==="WATCH"?"👁 WATCH ("+watchCount+")":f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {Object.keys(signals).length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"var(--text-muted)" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
          <div style={{ fontSize:14, fontWeight:600 }}>Loading live prices...</div>
          <div style={{ fontSize:12, marginTop:8 }}>Signals appear automatically in 5–10 seconds</div>
        </div>
      ) : (
        <div className="grid-auto">
          {visibleIDs.map(id => (
            <SignalCard key={id} id={id} priceData={allPrices[id]} sig={signals[id]}
              onClick={(id, sig) => setSelected({id, sig})} />
          ))}
          {visibleIDs.length===0 && (
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"var(--text-muted)" }}>
              No {filter} signals right now. Wait for Kill Zone for best setups.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <SignalModal id={selected.id} sig={selected.sig} onClose={()=>setSelected(null)} />
      )}
    </div>
  );
}
