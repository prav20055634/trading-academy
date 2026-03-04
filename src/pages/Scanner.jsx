import React, { useState, useEffect, useCallback } from "react";
import { usePrices, useSessionStatus } from "../hooks/usePrices";
import { useAutoTrader, readAutoLog } from "../hooks/useAutoTrader";

const STORAGE_KEY = "signal_history_v1";
function loadHistory() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); } catch { return []; } }
function saveToHistory(trade) {
  try {
    const h = loadHistory();
    const recent = h.find(t => t.pair===trade.pair && t.status==="OPEN" && Date.now()-new Date(t.openTime).getTime() < 4*60*60*1000);
    if (recent) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([trade,...h].slice(0,300)));
    return true;
  } catch { return false; }
}

const CFG = {
  EURUSD:    { pip:0.0001,dec:5,label:"pips",sl:15,tp1:30,tp2:55,  market:"Forex", color:"#00d4aa",icon:"🇪🇺",name:"EUR/USD",   bullMin:1.04, bullMax:1.16, keys:[1.0400,1.0450,1.0500,1.0550,1.0600,1.0650,1.0700,1.0750,1.0800,1.0850,1.0900,1.0950,1.1000,1.1050,1.1100,1.1200] },
  GBPUSD:    { pip:0.0001,dec:5,label:"pips",sl:18,tp1:36,tp2:65,  market:"Forex", color:"#4fc3f7",icon:"🇬🇧",name:"GBP/USD",   bullMin:1.24, bullMax:1.36, keys:[1.2400,1.2500,1.2600,1.2700,1.2750,1.2800,1.2900,1.3000,1.3100,1.3200] },
  USDJPY:    { pip:0.01,  dec:3,label:"pips",sl:20,tp1:40,tp2:75,  market:"Forex", color:"#f7931a",icon:"🇯🇵",name:"USD/JPY",   bullMin:145,  bullMax:162,  keys:[145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,162] },
  GBPJPY:    { pip:0.01,  dec:3,label:"pips",sl:25,tp1:50,tp2:90,  market:"Forex", color:"#f44336",icon:"🇬🇧",name:"GBP/JPY",   bullMin:183,  bullMax:204,  keys:[183,185,187,189,190,192,195,197,200,202,204] },
  USDCAD:    { pip:0.0001,dec:5,label:"pips",sl:15,tp1:30,tp2:55,  market:"Forex", color:"#ab47bc",icon:"🇨🇦",name:"USD/CAD",   bullMin:1.34, bullMax:1.43, keys:[1.3400,1.3500,1.3600,1.3700,1.3800,1.3900,1.4000,1.4100,1.4200,1.4300] },
  NZDUSD:    { pip:0.0001,dec:5,label:"pips",sl:15,tp1:30,tp2:55,  market:"Forex", color:"#26a69a",icon:"🇳🇿",name:"NZD/USD",   bullMin:0.575,bullMax:0.645,keys:[0.5750,0.5800,0.5850,0.5900,0.5950,0.6000,0.6050,0.6100,0.6150,0.6200,0.6250,0.6300] },
  XAUUSD:    { pip:0.1,   dec:2,label:"pts", sl:6, tp1:12,tp2:22,  market:"Forex", color:"#ffd700",icon:"🥇", name:"XAU/USD",   bullMin:2100, bullMax:2750, keys:[2100,2150,2200,2250,2300,2350,2400,2450,2500,2550,2600,2650,2700,2750] },
  BTCUSDT:   { pip:1,     dec:0,label:"pts", sl:150,tp1:300,tp2:550,market:"Crypto",color:"#f7931a",icon:"₿",  name:"BTC/USDT",  bullMin:54000,bullMax:115000,keys:[55000,58000,60000,62000,65000,68000,70000,72000,75000,78000,80000,82000,85000,88000,90000,95000,100000] },
  ETHUSDT:   { pip:0.1,   dec:2,label:"pts", sl:18, tp1:36,tp2:65, market:"Crypto",color:"#627eea",icon:"Ξ",  name:"ETH/USDT",  bullMin:2100, bullMax:4500, keys:[2100,2200,2300,2400,2500,2600,2700,2800,2900,3000,3200,3400,3500,3800,4000,4200,4500] },
  SOLUSDT:   { pip:0.01,  dec:2,label:"pts", sl:2,  tp1:4, tp2:7,  market:"Crypto",color:"#9945ff",icon:"◎",  name:"SOL/USDT",  bullMin:100,  bullMax:280,  keys:[100,110,120,130,140,150,160,170,180,190,200,210,220,240,260,280] },
  XRPUSDT:   { pip:0.001, dec:4,label:"pts", sl:0.04,tp1:0.08,tp2:0.14,market:"Crypto",color:"#00aae4",icon:"✕",name:"XRP/USDT",bullMin:0.45,bullMax:1.50,keys:[0.45,0.50,0.55,0.60,0.65,0.70,0.75,0.80,0.90,1.00,1.10,1.20,1.30,1.40,1.50] },
  BNBUSDT:   { pip:0.1,   dec:2,label:"pts", sl:4,  tp1:8, tp2:14, market:"Crypto",color:"#f3ba2f",icon:"⬡",  name:"BNB/USDT",  bullMin:370,  bullMax:740,  keys:[380,400,420,440,460,480,500,520,540,560,580,600,640,680,720,740] },
  NIFTY50:   { pip:1,     dec:2,label:"pts", sl:40, tp1:80,tp2:150,market:"India",  color:"#ff6b35",icon:"🇮🇳",name:"NIFTY 50",  bullMin:20500,bullMax:27500,keys:[20500,21000,21500,22000,22500,23000,23500,24000,24500,25000,25500,26000,26500,27000,27500] },
  SENSEX:    { pip:1,     dec:2,label:"pts", sl:120,tp1:240,tp2:450,market:"India", color:"#e91e63",icon:"📈", name:"SENSEX",    bullMin:68000,bullMax:90000,keys:[68000,70000,71000,72000,73000,74000,75000,76000,77000,78000,79000,80000,82000,84000,86000,88000,90000] },
  BANKNIFTY: { pip:1,     dec:2,label:"pts", sl:45, tp1:90,tp2:170,market:"India",  color:"#00bcd4",icon:"🏦", name:"BANK NIFTY",bullMin:43000,bullMax:56000,keys:[43000,44000,45000,46000,47000,48000,49000,50000,51000,52000,53000,54000,55000,56000] },
};
const IDS = Object.keys(CFG);

function nearestKey(price, keys, above) {
  const f = above ? keys.filter(k=>k>price) : keys.filter(k=>k<price);
  if (!f.length) return above ? price*1.005 : price*0.995;
  return above ? Math.min(...f) : Math.max(...f);
}

function getSignal(id, priceStr, session) {
  const cfg = CFG[id];
  if (!cfg||!priceStr) return null;
  const p = parseFloat(priceStr);
  if (!p||p<=0) return null;

  const rangeSize  = cfg.bullMax - cfg.bullMin;
  const posInRange = rangeSize>0 ? Math.max(0,Math.min(1,(p-cfg.bullMin)/rangeSize)) : 0.5;

  const inDiscount = posInRange <= 0.42;
  const inPremium  = posInRange >= 0.58;
  const inNeutral  = !inDiscount && !inPremium;
  const direction  = inDiscount ? "BUY" : "SELL";
  const isBuy      = direction === "BUY";

  const roundStep    = cfg.pip * 250;
  const nearestRound = Math.round(p/roundStep)*roundStep;
  const distRound    = Math.abs(p-nearestRound);
  const nearRound    = distRound < roundStep*0.18;

  const c1 = !inNeutral;
  const c2 = inDiscount||inPremium;
  const c3 = nearRound;
  const c4 = posInRange>=0.28 && posInRange<=0.72;
  const c5 = posInRange<=0.06 || posInRange>=0.94;
  const c6 = distRound > roundStep*0.04;
  const c7 = session?.ist_active||false;
  const c8 = nearRound && (inDiscount||inPremium);
  const c9 = true;

  const conds = {c1,c2,c3,c4,c5,c6,c7,c8,c9};
  const met   = Object.values(conds).filter(Boolean).length;

  let signal = "WAIT";
  if (!inNeutral) {
    if      (met===9)       signal=direction;
    else if (met>=7&&c7)    signal=direction;
    else if (met>=7)        signal=direction;
    else if (met>=5)        signal="WATCH";
  }
  if (inNeutral) signal="WAIT";

  const slKey      = nearestKey(p,cfg.keys,!isBuy);
  const slDist     = Math.abs(p-slKey);
  const maxSL      = cfg.sl*cfg.pip*2;
  const effSL      = slDist>maxSL ? (isBuy?p-maxSL:p+maxSL) : slKey;
  const actSLDist  = Math.abs(p-effSL);

  const minTP1 = isBuy?p+actSLDist*2  :p-actSLDist*2;
  const minTP2 = isBuy?p+actSLDist*3.5:p-actSLDist*3.5;
  const tp1k = cfg.keys.filter(k=>isBuy?k>=minTP1:k<=minTP1);
  const tp2k = cfg.keys.filter(k=>isBuy?k>=minTP2:k<=minTP2);
  const tp1  = tp1k.length?(isBuy?Math.min(...tp1k):Math.max(...tp1k)):minTP1;
  const tp2  = tp2k.length?(isBuy?Math.min(...tp2k):Math.max(...tp2k)):minTP2;

  const slPts  = Math.round(actSLDist/cfg.pip);
  const tp1Pts = Math.round(Math.abs(p-tp1)/cfg.pip);
  const rr     = slPts>0?(tp1Pts/slPts).toFixed(1):"2.0";

  let strat="OB+CHoCH";
  if (c5&&c6)      strat="CRT+Sweep";
  else if (c3&&c8) strat="Breaker+FVG";
  else if (c4)     strat="PO3";

  return { signal,direction,met,allValid:met===9,
    entry:p.toFixed(cfg.dec), sl:effSL.toFixed(cfg.dec),
    tp1:tp1.toFixed(cfg.dec), tp2:tp2.toFixed(cfg.dec),
    rr,strat,label:cfg.label,sl_pts:slPts,tp1_pts:tp1Pts,
    conditions:conds, zone:inDiscount?"DISCOUNT":inPremium?"PREMIUM":"NEUTRAL",
  };
}

function useIndianPrices() {
  const [indian,setIndian] = useState({});
  useEffect(()=>{
    const syms=[{key:"NIFTY50",y:"%5ENSEI"},{key:"SENSEX",y:"%5EBSESN"},{key:"BANKNIFTY",y:"%5ENSEBANK"}];
    const go=async()=>{
      for(const s of syms){
        try{
          const url="https://api.allorigins.win/get?url="+encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/"+s.y+"?interval=1m&range=1d");
          const res=await fetch(url); const data=await res.json();
          const json=JSON.parse(data.contents);
          const price=json?.chart?.result?.[0]?.meta?.regularMarketPrice;
          const prev =json?.chart?.result?.[0]?.meta?.previousClose;
          if(price){const chg=prev?(((price-prev)/prev)*100).toFixed(2):"0.00";
            setIndian(p=>({...p,[s.key]:{price:price.toFixed(2),change:chg}}));}
        }catch(_){}
      }
    };
    go(); const t=setInterval(go,60000); return()=>clearInterval(t);
  },[]);
  return indian;
}

const COND_LABELS=[
  {icon:"📊",label:"HTF Trend Confirmed — not in neutral zone"},
  {icon:"💰",label:"Discount (BUY) or Premium (SELL) zone"},
  {icon:"📦",label:"Order Block at institutional key level"},
  {icon:"🌀",label:"Golden Zone — 0.382 to 0.618 of range"},
  {icon:"🎯",label:"Liquidity sweep at range extreme"},
  {icon:"🔄",label:"CHoCH — displaced from key level (15min)"},
  {icon:"⏰",label:"Kill Zone active — London / NY (IST)"},
  {icon:"⚡",label:"FVG aligns with Order Block + trend"},
  {icon:"🛡️",label:"R:R minimum 1:2 — enforced automatically"},
];

function SignalCard({id,priceData,sig,saved,onClick}){
  const cfg=CFG[id];
  if(!priceData?.price) return(
    <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:14,opacity:0.3}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:18}}>{cfg.icon}</span>
        <span style={{color:cfg.color,fontWeight:700,fontSize:13}}>{cfg.name}</span>
        <span style={{fontSize:10,color:"var(--text-muted)"}}>Loading...</span>
      </div>
    </div>
  );
  if(!sig) return null;
  const show=sig.signal==="BUY"||sig.signal==="SELL";
  const sigBg=sig.signal==="BUY"?"rgba(0,212,170,0.07)":sig.signal==="SELL"?"rgba(244,67,54,0.07)":sig.signal==="WATCH"?"rgba(247,147,26,0.05)":"rgba(50,50,50,0.03)";
  const sigBdr=sig.signal==="BUY"?"rgba(0,212,170,0.40)":sig.signal==="SELL"?"rgba(244,67,54,0.40)":sig.signal==="WATCH"?"rgba(247,147,26,0.30)":"var(--border)";
  const btnBg=sig.signal==="BUY"?"var(--accent-green)":sig.signal==="SELL"?"var(--accent-red)":sig.signal==="WATCH"?"var(--accent-orange)":"var(--bg-primary)";
  const btnTxt=sig.signal==="WAIT"?"var(--text-muted)":"#000";
  return(
    <div onClick={()=>show&&onClick(id,sig)} style={{background:sigBg,border:"1px solid "+sigBdr,borderRadius:12,padding:14,cursor:show?"pointer":"default",position:"relative"}}>
      {saved&&<div style={{position:"absolute",top:8,right:8,fontSize:9,color:"var(--accent-blue)",background:"rgba(79,195,247,0.12)",padding:"2px 6px",borderRadius:4}}>💾 Saved</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>{cfg.icon}</span>
          <div>
            <div style={{fontFamily:"var(--font-display)",fontSize:13,fontWeight:700,color:cfg.color}}>{cfg.name}</div>
            <div style={{display:"flex",gap:4,alignItems:"center",marginTop:2}}>
              <span style={{fontSize:9,color:"var(--text-muted)"}}>{cfg.market}</span>
              {show&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:sig.zone==="DISCOUNT"?"rgba(0,212,170,0.12)":"rgba(244,67,54,0.12)",color:sig.zone==="DISCOUNT"?"var(--accent-green)":"var(--accent-red)"}}>{sig.zone}</span>}
            </div>
          </div>
        </div>
        <div style={{padding:"4px 10px",borderRadius:7,fontFamily:"var(--font-display)",fontSize:12,fontWeight:800,background:btnBg,color:btnTxt,border:"1px solid "+sigBdr}}>
          {sig.signal==="BUY"?"📈 BUY":sig.signal==="SELL"?"📉 SELL":sig.signal==="WATCH"?"👁 WATCH":"⏸ WAIT"}
        </div>
      </div>
      <div style={{fontFamily:"var(--font-mono)",fontSize:17,fontWeight:700,color:"var(--text-primary)",marginBottom:6}}>
        {priceData.price}
        {priceData.change&&<span style={{fontSize:10,marginLeft:8,color:parseFloat(priceData.change)>=0?"var(--accent-green)":"var(--accent-red)"}}>{parseFloat(priceData.change)>=0?"▲":"▼"}{Math.abs(parseFloat(priceData.change))}%</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
        <div style={{flex:1,height:3,background:"var(--bg-primary)",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:(sig.met/9*100)+"%",borderRadius:2,background:sig.met===9?"var(--accent-green)":sig.met>=7?"var(--accent-orange)":sig.met>=5?"#f7931a":"var(--accent-red)"}}/>
        </div>
        <span style={{fontSize:9,color:"var(--text-muted)",fontFamily:"var(--font-mono)",minWidth:28}}>{sig.met}/9</span>
      </div>
      {show&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4,marginBottom:8}}>
          {[{label:"ENTRY",value:sig.entry,color:"var(--accent-blue)"},{label:"SL",value:sig.sl,color:"var(--accent-red)"},{label:"TP1",value:sig.tp1,color:"var(--accent-green)"},{label:"TP2",value:sig.tp2,color:"var(--accent-gold)"}].map((r,i)=>(
            <div key={i} style={{background:"var(--bg-primary)",borderRadius:6,padding:"4px 4px",textAlign:"center"}}>
              <div style={{fontSize:8,color:"var(--text-muted)",marginBottom:1}}>{r.label}</div>
              <div style={{fontFamily:"var(--font-mono)",fontSize:9,fontWeight:700,color:r.color}}>{r.value}</div>
            </div>
          ))}
        </div>
      )}
      {show&&(
        <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
          <span className="badge badge-purple" style={{fontSize:9}}>{sig.strat}</span>
          <span className="badge badge-green"  style={{fontSize:9}}>R:R 1:{sig.rr}</span>
          <span style={{fontSize:9,color:"var(--text-muted)",marginLeft:"auto"}}>SL {sig.sl_pts} {sig.label}</span>
          {sig.allValid&&<span style={{fontSize:9,color:"#000",background:"var(--accent-green)",padding:"1px 6px",borderRadius:4,fontWeight:800}}>✅ ALL 9</span>}
        </div>
      )}
      {sig.signal==="WAIT"&&<div style={{fontSize:10,color:"var(--text-muted)",marginTop:4}}>{sig.met}/9 — {sig.zone==="NEUTRAL"?"Neutral zone — wait.":"Conditions forming."}</div>}
      {sig.signal==="WATCH"&&<div style={{fontSize:10,color:"var(--accent-orange)",marginTop:4}}>{sig.met}/9 — setup forming, wait for Kill Zone</div>}
      {show&&<div style={{fontSize:9,color:"var(--text-muted)",marginTop:5}}>Tap for full trade plan →</div>}
    </div>
  );
}

function SignalModal({ id, sig, session, onClose }) {
  if (!id || !sig) return null;
  const cfg   = CFG[id];
  const isBuy = sig.signal === "BUY";
  const [saveStatus, setSaveStatus] = React.useState("idle"); // idle | saved | already

  const handleSave = () => {
    const result = saveToJournal(id, sig, session);
    setSaveStatus(result === "already" ? "already" : "saved");
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"var(--bg-card)",border:"2px solid "+cfg.color,borderRadius:16,padding:20,maxWidth:460,width:"100%",maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:26}}>{cfg.icon}</span>
            <div>
              <div style={{fontFamily:"var(--font-display)",fontSize:16,fontWeight:800,color:cfg.color}}>{cfg.name}</div>
              <div style={{fontSize:11,color:"var(--text-muted)"}}>{sig.strat} • R:R 1:{sig.rr} • {sig.met}/9 • {sig.zone}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={handleSave} disabled={saveStatus==="saved"}
              style={{ padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:700, cursor:saveStatus==="saved"?"default":"pointer",
                border:"1px solid "+(saveStatus==="saved"?"var(--accent-green)":saveStatus==="already"?"var(--accent-orange)":"var(--accent-green)"),
                background:saveStatus==="saved"?"rgba(0,212,170,0.15)":saveStatus==="already"?"rgba(247,147,26,0.1)":"rgba(0,212,170,0.08)",
                color:saveStatus==="saved"?"var(--accent-green)":saveStatus==="already"?"var(--accent-orange)":"var(--accent-green)",
              }}>
              {saveStatus==="saved"?"✅ Saved!":saveStatus==="already"?"⚠️ Already Open":"📌 Save to Journal"}
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding:"3px 9px", fontSize:12 }}>✕</button>
          </div>
        </div>
        <div style={{textAlign:"center",padding:12,borderRadius:10,marginBottom:14,background:isBuy?"rgba(0,212,170,0.08)":"rgba(244,67,54,0.08)",border:"2px solid "+(isBuy?"var(--accent-green)":"var(--accent-red)")}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:24,fontWeight:800,color:isBuy?"var(--accent-green)":"var(--accent-red)"}}>{isBuy?"📈 BUY SIGNAL":"📉 SELL SIGNAL"}</div>
          <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:3}}>
            <strong style={{color:"var(--accent-purple)"}}>{sig.strat}</strong>
            {sig.allValid&&<span style={{marginLeft:8,color:"var(--accent-green)",fontWeight:700}}>✅ All 9 passed</span>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {[
            {label:"📍 ENTRY PRICE",  value:sig.entry,color:"var(--accent-blue)", desc:"Enter at this price"},
            {label:"🛑 STOP LOSS",    value:sig.sl,   color:"var(--accent-red)",  desc:sig.sl_pts+" "+sig.label+" — tight OB stop"},
            {label:"🎯 TAKE PROFIT 1",value:sig.tp1,  color:"var(--accent-green)",desc:sig.tp1_pts+" "+sig.label+" — close 50%"},
            {label:"🏆 TAKE PROFIT 2",value:sig.tp2,  color:"var(--accent-gold)", desc:"Full target — move SL to BE after TP1"},
          ].map((r,i)=>(
            <div key={i} style={{background:"var(--bg-primary)",borderRadius:8,padding:10}}>
              <div style={{fontSize:9,color:"var(--text-muted)",marginBottom:3}}>{r.label}</div>
              <div style={{fontFamily:"var(--font-mono)",fontSize:17,fontWeight:700,color:r.color}}>{r.value}</div>
              <div style={{fontSize:9,color:"var(--text-muted)",marginTop:2}}>{r.desc}</div>
            </div>
          ))}
        </div>
        {!alreadySaved?(
          <button className="btn btn-primary" style={{width:"100%",marginBottom:14}} onClick={()=>onSave(id,sig)}>💾 Save to Signal History</button>
        ):(
          <div style={{textAlign:"center",padding:"8px",marginBottom:14,background:"rgba(0,212,170,0.08)",borderRadius:8,fontSize:12,color:"var(--accent-green)",border:"1px solid rgba(0,212,170,0.2)"}}>✅ Saved — check Signal History to manage</div>
        )}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--text-primary)",marginBottom:6}}>SMC Conditions — {sig.met}/9</div>
          {COND_LABELS.map((c,i)=>{
            const key="c"+(i+1); const ok=sig.conditions[key];
            return(<div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 0",borderBottom:"1px solid var(--border)"}}>
              <span>{ok?"✅":"❌"}</span>
              <span style={{fontSize:11,color:ok?"var(--text-primary)":"var(--text-muted)"}}>{c.icon} {c.label}</span>
            </div>);
          })}
        </div>
        <div style={{background:"rgba(0,212,170,0.04)",border:"1px solid rgba(0,212,170,0.2)",borderRadius:8,padding:12}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--accent-green)",marginBottom:8}}>📋 Execution Steps</div>
          {["Open "+cfg.name+" on TradingView","Confirm "+(isBuy?"bullish":"bearish")+" structure on Daily + 4H","Find fresh Order Block near entry "+sig.entry,"Wait for 15min CHoCH after liquidity sweep","Enter at "+sig.entry+" — set SL at "+sig.sl+" immediately","TP1 at "+sig.tp1+" — close 50% of position","Move SL to breakeven ("+sig.entry+") after TP1 hit","Let remaining 50% run to TP2 at "+sig.tp2].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:6,fontSize:11,color:"var(--text-secondary)",padding:"3px 0"}}>
              <span style={{color:"var(--accent-green)",fontWeight:700,minWidth:14}}>{i+1}.</span>{s}
            </div>
          ))}
        </div>
        <div style={{marginTop:10,fontSize:10,color:"var(--accent-red)",textAlign:"center"}}>⚠️ Confirm on your chart before entering. Educational tool only.</div>
      </div>
    </div>
  );
}

// ── Save signal to Portfolio Journal ─────────────────────────────────────
function saveToJournal(id, sig, session) {
  const KEY = "trading_journal_v2";
  try {
    const existing = JSON.parse(localStorage.getItem(KEY) || "[]");
    const alreadyOpen = existing.find(t => t.pair===id && t.entry===parseFloat(sig.entry) && t.status==="OPEN");
    if (alreadyOpen) return "already";
    const trade = {
      id:        Date.now(),
      pair:      id,
      direction: sig.signal,
      entry:     parseFloat(sig.entry),
      sl:        parseFloat(sig.sl),
      tp1:       parseFloat(sig.tp1),
      tp2:       parseFloat(sig.tp2) || null,
      strategy:  sig.strat,
      session:   session?.ist_london_kz?"London Open KZ":session?.ist_active?"NY Open KZ":"Manual",
      notes:     "From Scanner — "+sig.met+"/9 conditions met",
      status:    "OPEN",
      openTime:  new Date().toISOString(),
      closeTime: null,
      exitPrice: null,
      pnl:       null,
      source:    "scanner",
    };
    localStorage.setItem(KEY, JSON.stringify([trade, ...existing]));
    return "saved";
  } catch { return "error"; }
}

export default function Scanner(){
  const prices  = usePrices();
  const session = useSessionStatus();
  const indian  = useIndianPrices();
  const [filter,setFilter]         = useState("All");
  const [selected,setSelected]     = useState(null);
  const [signals,setSignals]       = useState({});
  const [actLog,  setActLog]       = useState([]);

  const allPrices = {...prices,...indian};

  // ── FULLY AUTOMATIC: detect signal → save → monitor → auto-close ──────
  useAutoTrader(allPrices, session);

  // Update activity log when auto trader fires
  useEffect(() => {
    const handler = () => setActLog(readAutoLog());
    window.addEventListener("autotrader_update", handler);
    setActLog(readAutoLog());
    return () => window.removeEventListener("autotrader_update", handler);
  }, []);

  useEffect(()=>{
    const next={}; let count=0;
    IDS.forEach(id=>{const pd=allPrices[id]; if(pd?.price){next[id]=getSignal(id,pd.price,session);count++;}});
    if(count>0){setSignals(next);setLastUpdate(new Date());}
  },[JSON.stringify(allPrices),session?.ist_active]);

  const handleSave=useCallback((id,sig)=>{
    const trade={id:Date.now(),pair:id,direction:sig.signal,entry:parseFloat(sig.entry),sl:parseFloat(sig.sl),tp1:parseFloat(sig.tp1),tp2:parseFloat(sig.tp2),strategy:sig.strat,session:session?.ist_london_kz?"London KZ":session?.ist_active?"NY KZ":"Off-session",notes:sig.met+"/9 conditions",status:"OPEN",openTime:new Date().toISOString(),closeTime:null,exitPrice:null,pnl:null,source:"scanner"};
    if(saveToHistory(trade)) setSavedIds(s=>new Set([...s,id]));
  },[session]);

  const buyCount  =IDS.filter(id=>signals[id]?.signal==="BUY").length;
  const sellCount =IDS.filter(id=>signals[id]?.signal==="SELL").length;
  const watchCount=IDS.filter(id=>signals[id]?.signal==="WATCH").length;
  const allMet    =IDS.filter(id=>signals[id]?.allValid).length;

  const visible=IDS.filter(id=>{
    if(filter==="All")    return true;
    if(filter==="Forex")  return CFG[id].market==="Forex";
    if(filter==="Crypto") return CFG[id].market==="Crypto";
    if(filter==="India")  return CFG[id].market==="India";
    return signals[id]?.signal===filter;
  });

  return(
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🔍 Signal Scanner</h1>
        <p className="page-subtitle">9 SMC conditions • Tight OB SL • Min 1:2 R:R • Saves to History</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[{label:"📈 BUY",value:buyCount,color:"var(--accent-green)"},{label:"📉 SELL",value:sellCount,color:"var(--accent-red)"},{label:"👁 WATCH",value:watchCount,color:"var(--accent-orange)"},{label:"✅ ALL 9",value:allMet,color:"var(--accent-green)"}].map((s,i)=>(
          <div key={i} className="stat-box">
            <div className="stat-value" style={{color:s.color,fontSize:20}}>{s.value}</div>
            <div className="stat-label" style={{fontSize:10}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
        <div className={"session-badge "+(session?.ist_active?"active":"inactive")}>
          <div className={"session-dot "+(session?.ist_active?"active":"inactive")}/>
          {session?.ist_active?(session?.ist_london_kz?"🟢 LONDON KZ":"🟢 NY KZ"):"⚪ NO KILL ZONE"}
        </div>
        {lastUpdate&&<span style={{fontSize:10,color:"var(--text-muted)",fontFamily:"var(--font-mono)"}}>Updated {lastUpdate.toLocaleTimeString("en-IN")} IST</span>}
        {!session?.ist_active&&<span style={{fontSize:10,color:"var(--accent-orange)"}}>Best: London 1:30PM / NY 6:30PM IST</span>}
      </div>
      <div style={{background:"rgba(0,212,170,0.04)",border:"1px solid rgba(0,212,170,0.15)",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:11,color:"var(--text-secondary)"}}>
        <strong style={{color:"var(--accent-green)"}}>Tight SL:</strong> ETH ~18pts • BTC ~150pts • NIFTY ~40pts • EUR/USD ~15pips • SENSEX ~120pts • BANKNIFTY ~45pts
        <span style={{color:"var(--accent-blue)",marginLeft:8}}>• R:R minimum 1:2 enforced on all signals</span>
      </div>
      <div style={{marginBottom:14,overflowX:"auto"}}>
        <div className="tabs" style={{display:"inline-flex",minWidth:"max-content"}}>
          {["All","Forex","Crypto","India","BUY","SELL","WATCH"].map(f=>(
            <button key={f} className={"tab "+(filter===f?"active":"")} onClick={()=>setFilter(f)}>
              {f==="BUY"?"📈 BUY ("+buyCount+")":f==="SELL"?"📉 SELL ("+sellCount+")":f==="WATCH"?"👁 WATCH ("+watchCount+")":f}
            </button>
          ))}
        </div>
      </div>
      {Object.keys(signals).length===0?(
        <div style={{textAlign:"center",padding:60,color:"var(--text-muted)"}}>
          <div style={{fontSize:36,marginBottom:12}}>⏳</div>
          <div style={{fontSize:14,fontWeight:600}}>Loading live prices...</div>
          <div style={{fontSize:12,marginTop:8}}>Signals appear in 5–10 seconds</div>
        </div>
      ):(
        <div className="grid-auto">
          {visible.map(id=>(
            <SignalCard key={id} id={id} priceData={allPrices[id]} sig={signals[id]} saved={savedIds.has(id)} onClick={(id,sig)=>setSelected({id,sig})}/>
          ))}
          {visible.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:"var(--text-muted)"}}>No {filter} signals now. Wait for Kill Zone.</div>}
        </div>
      )}

      {/* ── Auto-Trader Activity Log ─────────────────────────────────── */}
      <div style={{ marginTop:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>
            🤖 Auto-Trader Activity
          </div>
          <div style={{ fontSize:11, color:"var(--text-muted)" }}>
            {session?.ist_active ? "🟢 Monitoring live" : "⚪ Waiting for Kill Zone"}
          </div>
        </div>

        {actLog.length === 0 ? (
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:20, textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>🤖</div>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:6 }}>Auto-Trader is Running</div>
            <div style={{ fontSize:11, color:"var(--text-muted)", lineHeight:1.6 }}>
              Watching all 15 pairs every 5 seconds.<br/>
              When {">"}=7/9 conditions met during Kill Zone → auto-saves to Journal.<br/>
              Monitors price → auto-closes at TP1, TP2 or SL.<br/>
              <span style={{ color:"var(--accent-orange)" }}>No activity yet — starts during London/NY Kill Zone.</span>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {actLog.slice(0,15).map((entry,i) => {
              const bgColor = entry.type==="win"?"rgba(0,212,170,0.07)":entry.type==="loss"?"rgba(244,67,54,0.07)":entry.type==="open"?"rgba(79,195,247,0.07)":"rgba(80,80,80,0.05)";
              const bdColor = entry.type==="win"?"rgba(0,212,170,0.3)":entry.type==="loss"?"rgba(244,67,54,0.3)":entry.type==="open"?"rgba(79,195,247,0.3)":"var(--border)";
              const timeStr = new Date(entry.time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
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

      {selected && <SignalModal id={selected.id} sig={selected.sig} session={session} onClose={()=>setSelected(null)} />}
    </div>
  );
}
