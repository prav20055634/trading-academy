import React, { useState, useEffect } from "react";

const STORAGE_KEY = "trading_journal_v2";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const MARKETS = {
  FOREX:  ["EURUSD","GBPUSD","USDJPY","GBPJPY","USDCAD","NZDUSD","XAUUSD"],
  CRYPTO: ["BTCUSDT","ETHUSDT","SOLUSDT","XRPUSDT","BNBUSDT"],
  INDIA:  ["NIFTY50","SENSEX","BANKNIFTY"],
};
const ALL_PAIRS = [...MARKETS.FOREX, ...MARKETS.CRYPTO, ...MARKETS.INDIA];

const sym = (pair) => MARKETS.INDIA.includes(pair) ? "₹" : "$";

const BADGE = {
  WIN:  { background:"rgba(0,212,170,0.12)",  color:"var(--accent-green)",  border:"1px solid rgba(0,212,170,0.3)"  },
  LOSS: { background:"rgba(244,67,54,0.12)",  color:"var(--accent-red)",    border:"1px solid rgba(244,67,54,0.3)"  },
  OPEN: { background:"rgba(247,147,26,0.12)", color:"var(--accent-orange)", border:"1px solid rgba(247,147,26,0.3)" },
  BUY:  { background:"rgba(0,212,170,0.10)",  color:"var(--accent-green)",  border:"1px solid rgba(0,212,170,0.25)" },
  SELL: { background:"rgba(244,67,54,0.10)",  color:"var(--accent-red)",    border:"1px solid rgba(244,67,54,0.25)" },
};

const STRATEGIES = ["OB+CHoCH","CRT+Sweep","Breaker+FVG","PO3","Breaker+FVG+OTF"];
const SESSIONS   = ["London Open KZ","NY Open KZ","London Full","Asian","India Market"];

export default function Portfolio() {
  const [trades,   setTrades]   = useState(load);
  const [tab,      setTab]      = useState("journal");  // journal | stats | add
  const [filter,   setFilter]   = useState("All");
  const [closing,  setClosing]  = useState(null);
  const [exitPrice,setExitPrice]= useState("");
  const [form,     setForm]     = useState({
    pair:"EURUSD", direction:"BUY", entry:"", sl:"", tp1:"", tp2:"",
    strategy:"OB+CHoCH", session:"London Open KZ", notes:"",
  });

  useEffect(() => save(trades), [trades]);

  // ── Add trade ──────────────────────────────────────────────────────────
  const addTrade = () => {
    if (!form.entry || !form.sl || !form.tp1) return;
    const t = {
      id:        Date.now(),
      pair:      form.pair,
      direction: form.direction,
      entry:     parseFloat(form.entry),
      sl:        parseFloat(form.sl),
      tp1:       parseFloat(form.tp1),
      tp2:       parseFloat(form.tp2) || null,
      strategy:  form.strategy,
      session:   form.session,
      notes:     form.notes,
      status:    "OPEN",
      openTime:  new Date().toISOString(),
      closeTime: null,
      exitPrice: null,
      pnl:       null,
    };
    setTrades(h => [t, ...h]);
    setTab("journal");
    setForm({ pair:"EURUSD", direction:"BUY", entry:"", sl:"", tp1:"", tp2:"", strategy:"OB+CHoCH", session:"London Open KZ", notes:"" });
  };

  // ── Close with exit price ──────────────────────────────────────────────
  const closeTrade = (id) => {
    const exit = parseFloat(exitPrice);
    if (!exit) return;
    setTrades(h => h.map(t => {
      if (t.id !== id) return t;
      const pnlPts = t.direction==="BUY" ? exit - t.entry : t.entry - exit;
      return { ...t, status:pnlPts>=0?"WIN":"LOSS", exitPrice:exit, pnl:parseFloat(pnlPts.toFixed(4)), closeTime:new Date().toISOString() };
    }));
    setClosing(null);
    setExitPrice("");
  };

  // ── Mark TP/SL hit ─────────────────────────────────────────────────────
  const markHit = (id, type) => {
    setTrades(h => h.map(t => {
      if (t.id !== id) return t;
      const hit  = type==="TP1"?t.tp1:type==="TP2"?t.tp2:t.sl;
      const pnl  = t.direction==="BUY"?hit-t.entry:t.entry-hit;
      return { ...t, status:type==="SL"?"LOSS":"WIN", exitPrice:hit, pnl:parseFloat(pnl.toFixed(4)), closeTime:new Date().toISOString() };
    }));
  };

  const deleteTrade = (id) => { if (window.confirm("Delete this trade?")) setTrades(h => h.filter(t => t.id!==id)); };

  // ── Stats ──────────────────────────────────────────────────────────────
  const closed    = trades.filter(t => t.status!=="OPEN");
  const wins      = closed.filter(t => t.status==="WIN").length;
  const losses    = closed.filter(t => t.status==="LOSS").length;
  const winRate   = closed.length>0 ? ((wins/closed.length)*100).toFixed(1) : 0;
  const openCount = trades.filter(t => t.status==="OPEN").length;
  const totalPnl  = closed.reduce((s,t) => s+(t.pnl||0), 0);

  // Best / worst pair
  const pairMap = {};
  closed.forEach(t => {
    if (!pairMap[t.pair]) pairMap[t.pair] = { wins:0, losses:0, pnl:0 };
    if (t.status==="WIN") pairMap[t.pair].wins++;
    else pairMap[t.pair].losses++;
    pairMap[t.pair].pnl += (t.pnl||0);
  });
  const pairList   = Object.entries(pairMap);
  const bestPair   = pairList.sort((a,b)=>b[1].wins-a[1].wins)[0]?.[0] || "—";
  const bestPnlPair= pairList.sort((a,b)=>b[1].pnl-a[1].pnl)[0]?.[0] || "—";

  // Strategy performance
  const stratMap = {};
  closed.forEach(t => {
    if (!stratMap[t.strategy]) stratMap[t.strategy] = { wins:0, total:0 };
    stratMap[t.strategy].total++;
    if (t.status==="WIN") stratMap[t.strategy].wins++;
  });

  // Win/loss streak
  let streak = 0, streakType = "";
  if (closed.length > 0) {
    const last = closed[0].status;
    streakType = last;
    for (let i=0; i<closed.length; i++) {
      if (closed[i].status === last) streak++;
      else break;
    }
  }

  // Monthly breakdown
  const monthMap = {};
  closed.forEach(t => {
    const m = new Date(t.closeTime).toLocaleString("en-IN",{month:"short",year:"2-digit"});
    if (!monthMap[m]) monthMap[m] = { wins:0, losses:0, pnl:0 };
    if (t.status==="WIN") monthMap[m].wins++;
    else monthMap[m].losses++;
    monthMap[m].pnl += (t.pnl||0);
  });

  const filtered = trades.filter(t => {
    if (filter==="All")  return true;
    if (filter==="Open") return t.status==="OPEN";
    if (filter==="WIN")  return t.status==="WIN";
    if (filter==="LOSS") return t.status==="LOSS";
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h1 className="page-title">📒 Trade Journal</h1>
            <p className="page-subtitle">Log every trade — track win rate, P&L, best pairs • Auto-saves</p>
          </div>
          <button className="btn btn-primary" onClick={()=>setTab(tab==="add"?"journal":"add")} style={{ marginTop:4 }}>
            {tab==="add"?"✕ Cancel":"+ Log Trade"}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
        {[
          { label:"Total Trades", value:trades.length,              color:"var(--accent-blue)"   },
          { label:"Win Rate",     value:winRate+"%",                color:wins>losses?"var(--accent-green)":"var(--accent-red)" },
          { label:"Open Trades",  value:openCount,                  color:"var(--accent-orange)" },
          { label:"Wins",         value:wins,                       color:"var(--accent-green)"  },
          { label:"Losses",       value:losses,                     color:"var(--accent-red)"    },
          { label:"Best Pair",    value:bestPair,                   color:"var(--accent-gold)"   },
        ].map((s,i) => (
          <div key={i} className="stat-box">
            <div className="stat-value" style={{ color:s.color, fontSize:18 }}>{s.value}</div>
            <div className="stat-label" style={{ fontSize:10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:14 }}>
        {[
          { id:"journal", label:"📋 Journal" },
          { id:"stats",   label:"📊 Stats"   },
        ].map(t => (
          <button key={t.id} className={"tab "+(tab===t.id?"active":"")} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── ADD TRADE FORM ─────────────────────────────────────────────── */}
      {tab==="add" && (
        <div className="card" style={{ marginBottom:16, background:"rgba(0,212,170,0.03)", border:"1px solid rgba(0,212,170,0.2)" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--accent-green)", marginBottom:14 }}>➕ Log New Trade</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
            {/* Pair */}
            <div>
              <label style={{ fontSize:10, color:"var(--text-muted)", display:"block", marginBottom:4 }}>PAIR</label>
              <select className="select" style={{ width:"100%" }} value={form.pair} onChange={e=>setForm(p=>({...p,pair:e.target.value}))}>
                <optgroup label="Forex">{MARKETS.FOREX.map(p=><option key={p}>{p}</option>)}</optgroup>
                <optgroup label="Crypto">{MARKETS.CRYPTO.map(p=><option key={p}>{p}</option>)}</optgroup>
                <optgroup label="India">{MARKETS.INDIA.map(p=><option key={p}>{p}</option>)}</optgroup>
              </select>
            </div>
            {/* Direction */}
            <div>
              <label style={{ fontSize:10, color:"var(--text-muted)", display:"block", marginBottom:4 }}>DIRECTION</label>
              <div style={{ display:"flex", gap:6 }}>
                {["BUY","SELL"].map(d=>(
                  <button key={d} onClick={()=>setForm(p=>({...p,direction:d}))}
                    style={{ flex:1, padding:"8px 0", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700,
                      border:"1px solid "+(form.direction===d?(d==="BUY"?"var(--accent-green)":"var(--accent-red)"):"var(--border)"),
                      background:form.direction===d?(d==="BUY"?"rgba(0,212,170,0.15)":"rgba(244,67,54,0.15)"):"var(--bg-primary)",
                      color:form.direction===d?(d==="BUY"?"var(--accent-green)":"var(--accent-red)"):"var(--text-muted)",
                    }}>{d==="BUY"?"📈 BUY":"📉 SELL"}</button>
                ))}
              </div>
            </div>
            {/* Strategy */}
            <div>
              <label style={{ fontSize:10, color:"var(--text-muted)", display:"block", marginBottom:4 }}>STRATEGY</label>
              <select className="select" style={{ width:"100%" }} value={form.strategy} onChange={e=>setForm(p=>({...p,strategy:e.target.value}))}>
                {STRATEGIES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:10 }}>
            {[
              { label:"ENTRY PRICE", key:"entry", ph:"e.g. 1.08500" },
              { label:"STOP LOSS",   key:"sl",    ph:"e.g. 1.08300" },
              { label:"TAKE PROFIT 1",key:"tp1",  ph:"e.g. 1.09000" },
              { label:"TAKE PROFIT 2",key:"tp2",  ph:"Optional"      },
            ].map(f=>(
              <div key={f.key}>
                <label style={{ fontSize:10, color:"var(--text-muted)", display:"block", marginBottom:4 }}>{f.label}</label>
                <input className="input" value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={{ width:"100%" }} />
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:10, color:"var(--text-muted)", display:"block", marginBottom:4 }}>SESSION</label>
              <select className="select" style={{ width:"100%" }} value={form.session} onChange={e=>setForm(p=>({...p,session:e.target.value}))}>
                {SESSIONS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, color:"var(--text-muted)", display:"block", marginBottom:4 }}>NOTES</label>
              <input className="input" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Optional notes" style={{ width:"100%" }} />
            </div>
          </div>

          <button className="btn btn-primary" onClick={addTrade} style={{ width:"100%" }}>💾 Save Trade to Journal</button>
        </div>
      )}

      {/* ── JOURNAL TAB ───────────────────────────────────────────────── */}
      {tab==="journal" && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
            <div className="tabs" style={{ display:"inline-flex" }}>
              {[
                { id:"All",  label:"All"              },
                { id:"Open", label:"🟡 Open ("+openCount+")" },
                { id:"WIN",  label:"✅ WIN"            },
                { id:"LOSS", label:"❌ LOSS"           },
              ].map(f=>(
                <button key={f.id} className={"tab "+(filter===f.id?"active":"")} onClick={()=>setFilter(f.id)} style={{ fontSize:11 }}>
                  {f.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize:11, color:"var(--text-muted)" }}>{filtered.length} trades</span>
          </div>

          {filtered.length===0 ? (
            <div style={{ textAlign:"center", padding:60, color:"var(--text-muted)" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📒</div>
              <div style={{ fontSize:14, fontWeight:600 }}>No trades logged yet</div>
              <div style={{ fontSize:12, marginTop:8 }}>Tap "+ Log Trade" to record your first trade</div>
              <div style={{ fontSize:11, marginTop:4, color:"var(--accent-orange)" }}>Every trade teaches you something — log them all</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filtered.map(t => (
                <div key={t.id} style={{
                  background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:14,
                  borderLeft:"3px solid "+(t.status==="WIN"?"var(--accent-green)":t.status==="LOSS"?"var(--accent-red)":"var(--accent-orange)"),
                }}>
                  {/* Trade header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:700 }}>{t.pair}</span>
                      <span style={{ padding:"2px 7px", borderRadius:5, fontSize:10, fontWeight:700, ...BADGE[t.direction] }}>{t.direction}</span>
                      <span style={{ padding:"2px 7px", borderRadius:5, fontSize:10, fontWeight:700, ...BADGE[t.status] }}>
                        {t.status==="OPEN"?"🟡 OPEN":t.status==="WIN"?"✅ WIN":"❌ LOSS"}
                      </span>
                      <span style={{ fontSize:10, color:"var(--text-muted)", background:"var(--bg-primary)", padding:"2px 6px", borderRadius:4 }}>{t.strategy}</span>
                    </div>
                    <button onClick={()=>deleteTrade(t.id)} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:14 }}>🗑</button>
                  </div>

                  {/* Price levels */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5, marginBottom:8 }}>
                    {[
                      { label:"ENTRY", value:t.entry,    color:"var(--accent-blue)"  },
                      { label:"SL",    value:t.sl,       color:"var(--accent-red)"   },
                      { label:"TP1",   value:t.tp1,      color:"var(--accent-green)" },
                      { label:"TP2",   value:t.tp2||"—", color:"var(--accent-gold)"  },
                    ].map((r,i)=>(
                      <div key={i} style={{ background:"var(--bg-primary)", borderRadius:6, padding:"5px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:9, color:"var(--text-muted)", marginBottom:2 }}>{r.label}</div>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, color:r.color }}>{r.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* P&L result */}
                  {t.status!=="OPEN" && t.pnl!==null && (
                    <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:6, padding:"6px 10px", background:t.pnl>=0?"rgba(0,212,170,0.06)":"rgba(244,67,54,0.06)", borderRadius:6, border:"1px solid "+(t.pnl>=0?"rgba(0,212,170,0.2)":"rgba(244,67,54,0.2)") }}>
                      <span style={{ fontSize:14, fontWeight:800, color:t.pnl>=0?"var(--accent-green)":"var(--accent-red)" }}>
                        {t.pnl>=0?"▲ +":"▼ "}{sym(t.pair)}{Math.abs(t.pnl).toFixed(2)} pts
                      </span>
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>Exit: {t.exitPrice}</span>
                      <span style={{ fontSize:10, color:"var(--text-muted)", marginLeft:"auto" }}>
                        {new Date(t.closeTime).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  )}

                  {/* Open trade actions */}
                  {t.status==="OPEN" && (
                    closing===t.id ? (
                      <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:6 }}>
                        <input className="input" value={exitPrice} onChange={e=>setExitPrice(e.target.value)} placeholder="Enter exit price" style={{ flex:1, padding:"6px 10px", fontSize:12 }} />
                        <button className="btn btn-primary" style={{ padding:"6px 14px", fontSize:11 }} onClick={()=>closeTrade(t.id)}>Close</button>
                        <button className="btn btn-secondary" style={{ padding:"6px 10px", fontSize:11 }} onClick={()=>setClosing(null)}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
                        <button onClick={()=>markHit(t.id,"TP1")} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid var(--accent-green)", background:"rgba(0,212,170,0.1)", color:"var(--accent-green)", cursor:"pointer", fontSize:11, fontWeight:600 }}>✅ TP1 Hit</button>
                        {t.tp2 && <button onClick={()=>markHit(t.id,"TP2")} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid var(--accent-gold)", background:"rgba(255,215,0,0.1)", color:"var(--accent-gold)", cursor:"pointer", fontSize:11, fontWeight:600 }}>🏆 TP2 Hit</button>}
                        <button onClick={()=>markHit(t.id,"SL")} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid var(--accent-red)", background:"rgba(244,67,54,0.1)", color:"var(--accent-red)", cursor:"pointer", fontSize:11, fontWeight:600 }}>❌ SL Hit</button>
                        <button onClick={()=>setClosing(t.id)} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-primary)", color:"var(--text-muted)", cursor:"pointer", fontSize:11 }}>Close manually</button>
                      </div>
                    )
                  )}

                  <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:6 }}>
                    {t.session} • {new Date(t.openTime).toLocaleDateString("en-IN")} {new Date(t.openTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
                    {t.notes && <span style={{ marginLeft:6 }}>• {t.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── STATS TAB ─────────────────────────────────────────────────── */}
      {tab==="stats" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {closed.length===0 ? (
            <div style={{ textAlign:"center", padding:60, color:"var(--text-muted)" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
              <div style={{ fontSize:14, fontWeight:600 }}>No closed trades yet</div>
              <div style={{ fontSize:12, marginTop:8 }}>Stats will appear after you close your first trade</div>
            </div>
          ) : (
            <>
              {/* Performance summary */}
              <div className="card">
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:12 }}>📈 Performance Summary</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    { label:"Win Rate",        value:winRate+"%",                      color:parseFloat(winRate)>=50?"var(--accent-green)":"var(--accent-red)"  },
                    { label:"Total P&L",        value:(totalPnl>=0?"+":"")+totalPnl.toFixed(2)+" pts", color:totalPnl>=0?"var(--accent-green)":"var(--accent-red)" },
                    { label:"Total Closed",     value:closed.length+" trades",          color:"var(--accent-blue)"   },
                    { label:"Current Streak",   value:streak+(streakType==="WIN"?" W":" L"), color:streakType==="WIN"?"var(--accent-green)":"var(--accent-red)" },
                    { label:"Best Pair (Wins)", value:bestPair,                          color:"var(--accent-gold)"   },
                    { label:"Best P&L Pair",    value:bestPnlPair,                       color:"var(--accent-gold)"   },
                  ].map((s,i)=>(
                    <div key={i} style={{ background:"var(--bg-primary)", borderRadius:8, padding:"10px 12px" }}>
                      <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:3 }}>{s.label}</div>
                      <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:700, color:s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy breakdown */}
              {Object.keys(stratMap).length > 0 && (
                <div className="card">
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:12 }}>🧠 Strategy Breakdown</div>
                  {Object.entries(stratMap).map(([strat,d],i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                      <span style={{ fontSize:12, color:"var(--text-primary)", flex:1 }}>{strat}</span>
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>{d.total} trades</span>
                      <span style={{ fontSize:12, fontWeight:700, color:d.wins/d.total>=0.5?"var(--accent-green)":"var(--accent-red)" }}>
                        {((d.wins/d.total)*100).toFixed(0)}% WR
                      </span>
                      <div style={{ width:60, height:6, background:"var(--bg-primary)", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:((d.wins/d.total)*100)+"%", background:d.wins/d.total>=0.5?"var(--accent-green)":"var(--accent-red)", borderRadius:3 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Monthly breakdown */}
              {Object.keys(monthMap).length > 0 && (
                <div className="card">
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:12 }}>📅 Monthly P&L</div>
                  {Object.entries(monthMap).reverse().map(([month,d],i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                      <span style={{ fontSize:12, color:"var(--text-primary)", width:60 }}>{month}</span>
                      <span style={{ fontSize:11, color:"var(--accent-green)" }}>✅ {d.wins}W</span>
                      <span style={{ fontSize:11, color:"var(--accent-red)" }}>❌ {d.losses}L</span>
                      <span style={{ fontSize:12, fontWeight:700, marginLeft:"auto", color:d.pnl>=0?"var(--accent-green)":"var(--accent-red)" }}>
                        {d.pnl>=0?"+":""}{d.pnl.toFixed(1)} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pair breakdown */}
              {pairList.length > 0 && (
                <div className="card">
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:12 }}>📊 Pair Performance</div>
                  {Object.entries(pairMap).sort((a,b)=>b[1].wins-a[1].wins).map(([pair,d],i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                      <span style={{ fontSize:12, color:"var(--text-primary)", width:80, fontFamily:"var(--font-mono)" }}>{pair}</span>
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>{d.wins+d.losses}T</span>
                      <span style={{ fontSize:11, fontWeight:600, color:(d.wins/(d.wins+d.losses))>=0.5?"var(--accent-green)":"var(--accent-red)" }}>
                        {(d.wins/(d.wins+d.losses)*100).toFixed(0)}% WR
                      </span>
                      <span style={{ marginLeft:"auto", fontSize:12, fontWeight:700, color:d.pnl>=0?"var(--accent-green)":"var(--accent-red)" }}>
                        {d.pnl>=0?"+":""}{d.pnl.toFixed(1)} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
