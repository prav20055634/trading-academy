import React, { useState } from "react";
import { LEARNING_PATH } from "../data/markets";

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// ── Visual lesson cards from Instagram PDF ────────────────────────────────
const VISUAL_LESSONS = [
  {
    id:"bos1",
    title:"Break of Structure — The Rule",
    color:"#00d4aa",
    icon:"📊",
    tag:"BOS Basics",
    points:[
      { icon:"❌", label:"Wrong BOS", desc:"Price wicks above structure but candle does NOT close above — this is NOT a BOS. It's a trap." },
      { icon:"✅", label:"Real BOS",  desc:"Price breaks AND CLOSES above the previous high (or below previous low). Candle body must close beyond the level." },
    ],
    rule:"✅ RULE: A Break of Structure is ONLY confirmed when the candle CLOSES above/below the structure level. Wicks do not count.",
    ruleColor:"#00d4aa",
  },
  {
    id:"bos2",
    title:"BOS — Uptrend (Higher Highs & Higher Lows)",
    color:"#00d4aa",
    icon:"📈",
    tag:"BOS Uptrend",
    points:[
      { icon:"📈", label:"BOS in uptrend", desc:"Each time price breaks the previous Higher High with a candle close — that is a BOS. This creates Higher Highs (HH) and Higher Lows (HL). Mark UP trend confirmed." },
      { icon:"🔄", label:"Pattern", desc:"HH → HL → BOS → HH → HL → BOS. Each BOS confirms the uptrend is continuing. This is where you look for BUY setups only." },
    ],
    rule:"📌 In an uptrend: only look for BUY setups. Every BOS above confirms the trend. Never try to sell against it.",
    ruleColor:"#00d4aa",
  },
  {
    id:"bos3",
    title:"BOS — Downtrend (Lower Highs & Lower Lows)",
    color:"#f44336",
    icon:"📉",
    tag:"BOS Downtrend",
    points:[
      { icon:"📉", label:"BOS in downtrend", desc:"Each time price breaks the previous Lower Low with a candle close — that is a BOS. Creates Lower Highs (LH) and Lower Lows (LL). Down trend confirmed." },
      { icon:"🔄", label:"Pattern", desc:"LH → LL → BOS → LH → LL → BOS. Each BOS below confirms the downtrend. This is where you look for SELL setups only." },
    ],
    rule:"📌 In a downtrend: only look for SELL setups. Every BOS below confirms the trend. Never try to buy against it.",
    ruleColor:"#f44336",
  },
  {
    id:"choch1",
    title:"Change of Character (CHoCH) — To the Upside",
    color:"#ffd700",
    icon:"🔄",
    tag:"CHoCH",
    points:[
      { icon:"🔄", label:"What is CHoCH?", desc:"CHoCH happens when price breaks THROUGH two or more Lower Highs. This signals the downtrend may be ending and a new uptrend starting. NOT just one Lower High — needs two or more." },
      { icon:"⚡", label:"Entry trigger", desc:"After CHoCH to the upside (breaks two LH levels), the next BOS above confirms trend change to bullish. This is your entry signal for BUY." },
    ],
    rule:"🎯 CHoCH = first sign of reversal. Wait for it to break through 2+ Supply/Demand zones for highest probability. Best found on 4H and 1H charts.",
    ruleColor:"#ffd700",
  },
  {
    id:"choch2",
    title:"Change of Character — To the Downside",
    color:"#f44336",
    icon:"🔄",
    tag:"CHoCH Bearish",
    points:[
      { icon:"📉", label:"Bearish CHoCH", desc:"Price was making Higher Highs. CHoCH to downside = price breaks through two or more Higher Lows (HL). This signals the uptrend may be ending." },
      { icon:"⛔", label:"Confirmation", desc:"After breaking 2+ HL levels, the next BOS below confirms the downtrend. Close all BUY positions. Switch to looking for SELL setups only." },
    ],
    rule:"⚠️ CHoCH alone is not an entry. You need: CHoCH + break of 2+ zones + session active. CHoCH on 4H is most reliable.",
    ruleColor:"#f44336",
  },
  {
    id:"struct",
    title:"3 Market Structures — Know Which One You're In",
    color:"#4fc3f7",
    icon:"🧠",
    tag:"Market Structure",
    points:[
      { icon:"📈", label:"Uptrend", desc:"Higher Highs + Higher Lows. Mark Up phase. Smart money is accumulating and distributing. Only look for BUY entries on pullbacks." },
      { icon:"📉", label:"Downtrend", desc:"Lower Highs + Lower Lows. Mark Down phase. Smart money is selling into every rally. Only SELL on pullbacks to resistance." },
      { icon:"↔️", label:"Ranging", desc:"Equal Highs and Lows. Accumulation or Distribution phase. No directional bias — wait at extremes of the range, not in the middle." },
    ],
    rule:"🏗️ Accumulation (ranging) → Mark Up (uptrend) → Distribution (ranging at top) → Mark Down (downtrend). Know which phase you are in BEFORE trading.",
    ruleColor:"#4fc3f7",
  },
  {
    id:"supply",
    title:"Supply & Demand Zones",
    color:"#ab47bc",
    icon:"⚖️",
    tag:"Supply & Demand",
    points:[
      { icon:"🔴", label:"Supply Zone", desc:"Area where there are excess SELLERS. Supply exceeds demand. Price drops from here. This is where selling interest is highest. Look for SELL setups when price returns to supply." },
      { icon:"🟢", label:"Demand Zone", desc:"Area where there are excess BUYERS. Demand exceeds supply. Price rises from here. Buying interest is highest here. Look for BUY setups when price returns to demand." },
    ],
    rule:"📦 Supply zone = SELL zone (resistance). Demand zone = BUY zone (support). Mark these on Daily and 4H charts. Enter when price returns to test the zone + CHoCH confirmation.",
    ruleColor:"#ab47bc",
  },
  {
    id:"crt",
    title:"CRT Entry — Candle Range Theory (4H)",
    color:"#f7931a",
    icon:"🕯️",
    tag:"CRT Entry",
    points:[
      { icon:"1️⃣", label:"Step 1 — Find the 4H candle", desc:"Identify the current 4H candle. Mark its HIGH and LOW (the candle range). This becomes your reference candle." },
      { icon:"2️⃣", label:"Step 2 — Identify Liquidity Sweep", desc:"On 4H: look for a candle wick that sweeps above the previous candle high (bearish CRT) or below the previous candle low (bullish CRT). The wick hunts stop losses." },
      { icon:"3️⃣", label:"Step 3 — Mark the Break Closing Level", desc:"Mark the CLOSING level of the candle where the sweep happened. This is your key level to watch for breakout." },
      { icon:"4️⃣", label:"Step 4 — Go to 5 min chart", desc:"Drop to 5 min. Watch price return to the Break Closing Level. Look for a 5min CHoCH at that level as entry trigger." },
      { icon:"5️⃣", label:"Step 5 — Enter the trade", desc:"Full CRT sequence: 4H sweep → Break Closing Level marked → 5min CHoCH → ENTER. SL below the sweep candle low (bullish) or above the sweep candle high (bearish)." },
    ],
    rule:"⏰ CRT works best during Kill Zones: London Open (1:30 PM IST) and NY Open (6:30 PM IST). The Asian range (4:30 AM – 1:30 PM IST) provides the liquidity that gets swept.",
    ruleColor:"#f7931a",
  },
  {
    id:"tf",
    title:"Know Your Trading Style — Timeframes",
    color:"#26a69a",
    icon:"⏱️",
    tag:"Timeframes",
    points:[
      { icon:"⚡", label:"Scalper (1min–15min)", desc:"Looking for quick small moves. In and out in minutes. Needs fast execution. High frequency. Most stressful. Not recommended for beginners." },
      { icon:"📅", label:"Day Trader (15min–1H)", desc:"Holds trades for hours, same day. Looks for bigger moves. Uses Kill Zones. The style this app teaches. Best for learning SMC." },
      { icon:"🌙", label:"Swing Trader (1H–4H–1D)", desc:"Holds trades overnight or for days. Larger SL, larger TP. Less screen time. Good once you have 6+ months experience." },
      { icon:"📆", label:"Position Trader (1D–1W–1M)", desc:"Long-term trends. Weeks to months. Minimal screen time. Needs deep capital and patience." },
    ],
    rule:"🎯 This app is designed for Day Trading style: 15min–1H entries during London and NY Kill Zones. Master this before moving to other styles.",
    ruleColor:"#26a69a",
  },
  {
    id:"sr",
    title:"Support & Resistance — How to Draw It Correctly",
    color:"#4fc3f7",
    icon:"🧱",
    tag:"Support & Resistance",
    points:[
      { icon:"🔴", label:"Resistance", desc:"A price level where there are SELLERS (Supply). Price drops from resistance. A broken resistance becomes new SUPPORT. Use for SELL setups or TP levels on BUY trades." },
      { icon:"🟢", label:"Support", desc:"A price level where there are BUYERS (Demand). Price bounces from support. A broken support becomes new RESISTANCE (Role Reversal). Use for BUY setups or TP levels on SELL trades." },
      { icon:"🔄", label:"Role Reversal", desc:"When support breaks it flips to resistance. When resistance breaks it flips to support. This is one of the most profitable concepts in trading — trade the retest." },
    ],
    rule:"📐 Draw ZONES not lines. Mark where price has CLOSED multiple times — not just wicked. The more times price respects a level, the stronger it is.",
    ruleColor:"#4fc3f7",
  },
  {
    id:"candle1",
    title:"Candlestick Basics — What Every Candle Tells You",
    color:"#ffd700",
    icon:"🕯️",
    tag:"Candlesticks",
    points:[
      { icon:"🟢", label:"Bullish Candle", desc:"Open at bottom, close at top. Body = the move. Upper wick = sellers tried to push down but failed. Lower wick = buyers stepped in. Green candle = buyers won that period." },
      { icon:"🔴", label:"Bearish Candle", desc:"Open at top, close at bottom. Red candle = sellers won. Lower wick = buyers tried but failed. Upper wick = sellers stepped in at resistance." },
      { icon:"➖", label:"Doji / Neutral", desc:"Open and close at same level. Indecision. Neither buyers nor sellers won. After a trend = possible reversal. After range = continuation. Marubozu = no wicks, strong conviction." },
    ],
    rule:"🕯️ Never look at one candle in isolation. Context is everything — a doji at resistance after a rally = very different to a doji in the middle of a range.",
    ruleColor:"#ffd700",
  },
  {
    id:"candle2",
    title:"Key Candlestick Patterns — BUY Signals",
    color:"#00d4aa",
    icon:"📈",
    tag:"Bullish Patterns",
    points:[
      { icon:"🔨", label:"Hammer", desc:"Small body at top, long lower wick. At support or demand zone = BUY. Buyers rejected the lower prices violently." },
      { icon:"⭐", label:"Morning Star", desc:"3-candle: big red → small body → big green. Reversal at support. Strong BUY signal, especially at demand zone or Golden Zone." },
      { icon:"↑", label:"Three Inside Up", desc:"Bullish engulfing that forms inside the previous red candle. Continuation of reversal. Look for this after CHoCH on 15min." },
      { icon:"🚀", label:"Bullish Breakaway / Engulfing", desc:"Large green candle that engulfs previous red. Displacement candle — often marks the start of a BOS. Entry on retest." },
    ],
    rule:"✅ Bullish patterns are only valid at: Support zones, Demand zones, Golden Zone (0.618), or after CHoCH confirmation. Never in the middle of a range.",
    ruleColor:"#00d4aa",
  },
  {
    id:"candle3",
    title:"Key Candlestick Patterns — SELL Signals",
    color:"#f44336",
    icon:"📉",
    tag:"Bearish Patterns",
    points:[
      { icon:"🪝", label:"Hanging Man / Shooting Star", desc:"At resistance or supply zone — small body, long upper wick. Sellers rejected higher prices. SELL signal when at key supply zone." },
      { icon:"🌟", label:"Evening Star", desc:"3-candle: big green → small body → big red. Reversal at resistance. Strong SELL signal at supply zone or Premium zone." },
      { icon:"↓", label:"Three Outside Down", desc:"Bearish engulfing continuation. Strong SELL momentum. Enter after the third candle closes." },
      { icon:"📉", label:"Three Black Crows", desc:"3 consecutive red candles with lower closes each time. Strong downtrend beginning. Sell the pullback to the first crow's close level." },
    ],
    rule:"❌ Bearish patterns only valid at: Resistance zones, Supply zones, Premium zone (above 50% of range), or after bearish CHoCH. Never buy these patterns alone.",
    ruleColor:"#f44336",
  },
  {
    id:"priceaction",
    title:"Price Action — Rally-Base-Drop & Drop-Base-Rally",
    color:"#ab47bc",
    icon:"🎯",
    tag:"Price Action",
    points:[
      { icon:"🔴", label:"Rally-Base-Drop (Supply)", desc:"Price RALLIES up → forms a BASE (consolidation/small candles) → DROPS hard. The Base = Supply zone. Mark it. When price returns to the base, SELL." },
      { icon:"🟢", label:"Drop-Base-Rally (Demand)", desc:"Price DROPS → forms a BASE → RALLIES hard. The Base = Demand zone / Order Block. When price returns to the base, BUY." },
      { icon:"📦", label:"Drop-OB-Drop / Rally-OB-Rally", desc:"If the base has an Order Block inside it, it's even stronger. The OB within the base is your precise entry zone." },
    ],
    rule:"🎯 The BASE is where institutional orders were placed. Price always comes back to test the base. That retest = your entry. This IS what an Order Block is.",
    ruleColor:"#ab47bc",
  },
  {
    id:"fullentry",
    title:"Complete 5-Step Entry Checklist",
    color:"#ffd700",
    icon:"✅",
    tag:"Entry System",
    points:[
      { icon:"1️⃣", label:"Market Structure", desc:"Identify the trend — uptrend (HH+HL) or downtrend (LH+LL). Only trade WITH the trend. Ranging = wait at extremes only." },
      { icon:"2️⃣", label:"Psychological Level", desc:"Is price near a round number (1.0800, 1.1000, 24000, 50000)? These are high-probability reversal levels where banks have orders." },
      { icon:"3️⃣", label:"Fibonacci", desc:"Draw from swing low to swing high (uptrend). Is price at 0.382–0.618 Golden Zone? This is your entry area." },
      { icon:"4️⃣", label:"Trendline / Structure", desc:"Is there a trendline or demand/supply zone aligning with the Fib level? Three-point trendlines are tradeable on the third touch." },
      { icon:"5️⃣", label:"Candlestick Confirmation", desc:"After all above align — wait for a confirmation candle: Bullish Engulfing, Hammer, Morning Star (BUY) or Shooting Star, Evening Star (SELL). THEN enter." },
    ],
    rule:"🏆 ALL 5 MUST ALIGN: Structure + Psychological level + Fibonacci + Trendline/Zone + Candlestick. If only 3/5 align = DO NOT ENTER. Patience is the edge.",
    ruleColor:"#ffd700",
  },
  {
    id:"trading101",
    title:"Trading Language — Know These Terms",
    color:"#4fc3f7",
    icon:"📖",
    tag:"Basics",
    points:[
      { icon:"📈", label:"Bullish vs Bearish", desc:"Bullish = you think price will go UP. Bearish = you think price will go DOWN. That's it. Simple." },
      { icon:"⬆️", label:"Long vs Short", desc:"Long = BUY trade (profit when price goes up). Short = SELL trade (profit when price goes down). You can profit in both directions." },
      { icon:"🛑", label:"Stop Loss (SL)", desc:"Your maximum loss — the trade closes automatically. No SL = gambling. Always set SL before entry, never after." },
      { icon:"💰", label:"Risk 1–2%", desc:"Risk only 1–2% of your capital per trade. You control your risk through lot size. Bigger account = bigger lot. Never risk more than 2%." },
      { icon:"📏", label:"Pip = Price movement unit", desc:"Forex: EUR/USD 1.1000 → 1.1001 = 1 pip. Your profit/loss is measured in pips × lot size × pip value." },
    ],
    rule:"📚 Master the language before trading. Most beginners lose not because of bad strategy but because they don't understand what they're doing.",
    ruleColor:"#4fc3f7",
  },
  {
    id:"expectation",
    title:"Expectation vs Reality in Trading",
    color:"#f44336",
    icon:"🎭",
    tag:"Psychology",
    points:[
      { icon:"💭", label:"Expectation", desc:"Smooth staircase up. Every trade wins. Consistent profits every week. Growing account in a straight line." },
      { icon:"📊", label:"Reality", desc:"Choppy, messy, volatile. Wins AND losses mixed together. The EQUITY CURVE goes up over time but individual trades are unpredictable." },
      { icon:"🧠", label:"The Mindset Shift", desc:"Your edge plays out over 100+ trades, not 1–2. A losing trade is not failure — it's part of the system. Never judge a strategy on 5 trades." },
    ],
    rule:"🧘 Trading is a probability game. Even the best strategy loses 35–40% of trades. Focus on: correct execution, not individual trade outcomes. The process creates the profit.",
    ruleColor:"#f44336",
  },
];

// ── Lesson Card Component ──────────────────────────────────────────────────
function LessonCard({ lesson, done, onDone }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid "+(done?"rgba(0,212,170,0.3)":"var(--border)"), borderLeft:"3px solid "+lesson.color, borderRadius:12, marginBottom:10, overflow:"hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", cursor:"pointer" }}>
        <span style={{ fontSize:22 }}>{lesson.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", fontFamily:"var(--font-display)" }}>{lesson.title}</div>
          <div style={{ fontSize:10, color:lesson.color, fontWeight:600, marginTop:2 }}>{lesson.tag}</div>
        </div>
        {done && <span style={{ fontSize:10, background:"rgba(0,212,170,0.12)", color:"var(--accent-green)", padding:"2px 8px", borderRadius:10, fontWeight:700 }}>✓ READ</span>}
        <span style={{ color:"var(--text-muted)", fontSize:13 }}>{open?"▲":"▼"}</span>
      </div>

      {open && (
        <div style={{ padding:"0 16px 16px" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
            {lesson.points.map((p,i) => (
              <div key={i} style={{ display:"flex", gap:10, background:"var(--bg-primary)", borderRadius:8, padding:"10px 12px" }}>
                <span style={{ fontSize:18, minWidth:26 }}>{p.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{p.label}</div>
                  <div style={{ fontSize:11, color:"var(--text-secondary)", lineHeight:1.6 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:"rgba(0,0,0,0.25)", border:"1px solid "+lesson.color+"44", borderRadius:8, padding:"10px 14px", fontSize:12, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:12 }}>
            {lesson.rule}
          </div>
          {!done && (
            <button onClick={() => { onDone(lesson.id); setOpen(false); }}
              style={{ padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:700, background:"rgba(0,212,170,0.1)", border:"1px solid var(--accent-green)", color:"var(--accent-green)", cursor:"pointer" }}>
              ✅ Mark as Read
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Phase Card ─────────────────────────────────────────────────────────────
function PhaseCard({ phase, isExpanded, onToggle, isCompleted, onComplete }) {
  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid "+(isCompleted?"rgba(0,212,170,0.3)":"var(--border)"), borderLeft:"3px solid "+phase.color, borderRadius:12, marginBottom:12, overflow:"hidden" }}>
      <div onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}>
        <span style={{ fontSize:24 }}>{phase.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ background:phase.color, color:"#000", borderRadius:4, padding:"2px 8px", fontSize:10, fontWeight:700 }}>Phase {phase.phase}</span>
            <span style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{phase.title}</span>
          </div>
          <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>⏱ {phase.duration}</div>
        </div>
        {isCompleted && <span style={{ fontSize:10, background:"rgba(0,212,170,0.12)", color:"var(--accent-green)", padding:"2px 8px", borderRadius:10, fontWeight:700 }}>✓ DONE</span>}
        {phase.strategy && <span style={{ fontSize:9, background:"rgba(247,147,26,0.1)", color:"var(--accent-orange)", padding:"2px 8px", borderRadius:6, fontWeight:600 }}>{phase.strategy}</span>}
        <span style={{ color:"var(--text-muted)", fontSize:13 }}>{isExpanded?"▲":"▼"}</span>
      </div>

      {isExpanded && (
        <div style={{ padding:"0 16px 16px" }}>
          <div style={{ fontSize:12, color:"var(--accent-green)", fontWeight:600, marginBottom:12, padding:"8px 12px", background:"rgba(0,212,170,0.05)", borderRadius:8 }}>
            🎯 Goal: {phase.goal}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <div>
              <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Topics</div>
              {phase.topics.map((t,i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
                  <span style={{ color:phase.color, fontWeight:700, minWidth:16, fontSize:12 }}>▸</span>
                  <div>
                    <div style={{ fontSize:12, color:"var(--text-primary)", fontWeight:500 }}>{t.name}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:1 }}>{t.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Daily Task</div>
              <div style={{ background:"rgba(0,212,170,0.04)", border:"1px solid rgba(0,212,170,0.12)", borderRadius:8, padding:10, fontSize:11, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:10 }}>
                📋 {phase.dailyTask}
              </div>
              <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:4 }}>PLATFORM</div>
              <div style={{ fontSize:11, color:"var(--accent-blue)", marginBottom:10 }}>🖥 {phase.platform}</div>
              <div style={{ background:"rgba(244,67,54,0.05)", border:"1px solid rgba(244,67,54,0.15)", borderRadius:8, padding:8, fontSize:11, color:"var(--accent-red)" }}>⛔ {phase.doNot}</div>
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Self-Check Questions</div>
            {phase.quiz.map((q,i) => (
              <div key={i} style={{ background:"var(--bg-primary)", borderRadius:6, padding:"7px 12px", marginBottom:5, fontSize:11, color:"var(--text-secondary)", borderLeft:"2px solid "+phase.color }}>
                Q{i+1}: {q}
              </div>
            ))}
          </div>

          <button onClick={() => onComplete(phase.phase)}
            style={{ padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:700, background:isCompleted?"rgba(0,212,170,0.15)":"rgba(0,212,170,0.08)", border:"1px solid var(--accent-green)", color:"var(--accent-green)", cursor:"pointer" }}>
            {isCompleted ? "✅ Phase Complete" : "Mark Phase Complete →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Lesson categories ──────────────────────────────────────────────────────
const LESSON_TABS = [
  { id:"all",       label:"All Lessons" },
  { id:"structure", label:"Structure"   },
  { id:"entry",     label:"Entry"       },
  { id:"candles",   label:"Candles"     },
  { id:"basics",    label:"Basics"      },
];

const LESSON_TAGS = {
  structure: ["BOS Basics","BOS Uptrend","BOS Downtrend","CHoCH","CHoCH Bearish","Market Structure","Supply & Demand"],
  entry:     ["CRT Entry","Price Action","Entry System","Support & Resistance"],
  candles:   ["Candlesticks","Bullish Patterns","Bearish Patterns"],
  basics:    ["Timeframes","Basics","Psychology"],
};

// ── Main Page ──────────────────────────────────────────────────────────────
export default function LearningPath() {
  const [completed,    setCompleted]    = useState(() => { try { return JSON.parse(localStorage.getItem("phases_done")||"[]"); } catch { return []; }});
  const [expanded,     setExpanded]     = useState(null);
  const [lessonsDone,  setLessonsDone]  = useState(() => { try { return JSON.parse(localStorage.getItem("lessons_done")||"[]"); } catch { return []; }});
  const [tab,          setTab]          = useState("learning");
  const [lessonTab,    setLessonTab]    = useState("all");

  const togglePhase    = (p) => setExpanded(e => e===p?null:p);
  const completePhase  = (p) => { const n = [...new Set([...completed, p])]; setCompleted(n); localStorage.setItem("phases_done", JSON.stringify(n)); };
  const completeLesson = (id) => { const n = [...new Set([...lessonsDone, id])]; setLessonsDone(n); localStorage.setItem("lessons_done", JSON.stringify(n)); };

  const phaseDone    = completed.length;
  const lessonsDoneN = lessonsDone.length;

  const filteredLessons = VISUAL_LESSONS.filter(l => {
    if (lessonTab === "all") return true;
    return LESSON_TAGS[lessonTab]?.includes(l.tag);
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🎓 Learning Path</h1>
        <p className="page-subtitle">Complete SMC course + Instagram lessons — BOS, CHoCH, CRT, Candlesticks, Entry System</p>
      </div>

      {/* Progress */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        <div className="stat-box">
          <div className="stat-value" style={{ color:"var(--accent-green)", fontSize:22 }}>{phaseDone}/8</div>
          <div className="stat-label" style={{ fontSize:10 }}>Phases Done</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color:"var(--accent-blue)", fontSize:22 }}>{lessonsDoneN}/{VISUAL_LESSONS.length}</div>
          <div className="stat-label" style={{ fontSize:10 }}>Lessons Read</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color:"var(--accent-orange)", fontSize:22 }}>{Math.round((phaseDone/8+lessonsDoneN/VISUAL_LESSONS.length)/2*100)}%</div>
          <div className="stat-label" style={{ fontSize:10 }}>Overall Progress</div>
        </div>
      </div>

      {/* Main tabs */}
      <div className="tabs" style={{ marginBottom:16 }}>
        <button className={"tab "+(tab==="learning"?"active":"")} onClick={() => setTab("learning")}>📚 8-Phase Course</button>
        <button className={"tab "+(tab==="lessons"?"active":"")} onClick={() => setTab("lessons")}>🎓 Quick Lessons ({VISUAL_LESSONS.length})</button>
        <button className={"tab "+(tab==="entry"?"active":"")} onClick={() => setTab("entry")}>✅ Entry Checklist</button>
      </div>

      {/* ── 8 Phase Course ────────────────────────────────────────────────── */}
      {tab === "learning" && (
        <div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:14, padding:"10px 14px", background:"var(--bg-card)", borderRadius:8, border:"1px solid var(--border)" }}>
            📌 Work through all 8 phases in order. Don't skip. Each phase builds on the last. Complete 60+ paper trading days in Phase 7 before going live.
          </div>
          {LEARNING_PATH.map(phase => (
            <PhaseCard key={phase.phase} phase={phase}
              isExpanded={expanded===phase.phase}
              onToggle={() => togglePhase(phase.phase)}
              isCompleted={completed.includes(phase.phase)}
              onComplete={completePhase} />
          ))}
        </div>
      )}

      {/* ── Quick Lessons (from Instagram PDF) ───────────────────────────── */}
      {tab === "lessons" && (
        <div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:14, padding:"10px 14px", background:"var(--bg-card)", borderRadius:8, border:"1px solid var(--border)" }}>
            📱 These lessons come from proven trading education posts. Read them all — each one teaches a concept you WILL see on your chart.
          </div>

          {/* Lesson filter tabs */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {LESSON_TABS.map(t => (
              <button key={t.id} onClick={() => setLessonTab(t.id)}
                style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer",
                  background:lessonTab===t.id?"var(--accent-green)":"var(--bg-card)",
                  color:lessonTab===t.id?"#000":"var(--text-muted)",
                  border:"1px solid "+(lessonTab===t.id?"var(--accent-green)":"var(--border)") }}>
                {t.label}
              </button>
            ))}
          </div>

          {filteredLessons.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson}
              done={lessonsDone.includes(lesson.id)}
              onDone={completeLesson} />
          ))}
        </div>
      )}

      {/* ── Entry Checklist ───────────────────────────────────────────────── */}
      {tab === "entry" && (
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:12 }}>✅ Complete 5-Step Entry System</div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:16, lineHeight:1.7 }}>
            Before entering ANY trade, all 5 steps must align. If even one is missing — wait. Patience is the edge.
          </div>

          {[
            { step:1, title:"Market Structure", color:"#00d4aa", icon:"📊",
              details:["Identify if price is in Uptrend (HH+HL), Downtrend (LH+LL), or Range","In uptrend → only look for BUY setups","In downtrend → only look for SELL setups","Ranging → wait for price to reach extremes only","Look for CHoCH to confirm potential reversal before switching bias"],
              check:"Can you clearly identify the current structure on Daily and 4H chart?" },
            { step:2, title:"Psychological Level (Round Number)", color:"#4fc3f7", icon:"🎯",
              details:["Is price near a major round number? (1.0800, 1.1000, 24000, 50000, etc.)","Round numbers = where banks and institutions place orders","More significant: 00 levels (1.1000) > 50 levels (1.1050) > 20/80 levels","Combine: round number + supply/demand zone = high probability"],
              check:"Is price within 20 pips / 50 pts of a major round number?" },
            { step:3, title:"Fibonacci Golden Zone", color:"#f7931a", icon:"🌀",
              details:["Draw Fib from SWING LOW to SWING HIGH (in uptrend looking for buy)","Draw Fib from SWING HIGH to SWING LOW (in downtrend looking for sell)","Wait for price to reach 0.382 to 0.618 zone (the Golden Zone)","Best entries: 0.5 (50%) or 0.618 (Golden ratio) levels","The Fib zone must overlap with a supply/demand zone or round number"],
              check:"Is price currently inside the 0.382–0.618 Fibonacci zone?" },
            { step:4, title:"Trendline or Supply/Demand Zone", color:"#ab47bc", icon:"🧱",
              details:["Draw trendline connecting 3+ swing lows (uptrend) or 3+ swing highs (downtrend)","Third touch of trendline = tradeable entry","OR: price returning to a marked Supply zone (sell) or Demand zone (buy)","Rally-Base-Drop pattern at top = Supply zone","Drop-Base-Rally pattern at bottom = Demand zone","The Base IS the Order Block — this is your precise entry area"],
              check:"Is there a trendline touch or supply/demand zone at this price level?" },
            { step:5, title:"Candlestick Confirmation", color:"#ffd700", icon:"🕯️",
              details:["After all 4 steps above align — wait for ONE confirmation candle","BUY confirmations: Hammer, Morning Star, Bullish Engulfing, Three Inside Up","SELL confirmations: Shooting Star, Evening Star, Bearish Engulfing, Hanging Man","The confirmation candle must CLOSE — never enter on a wick","Enter after candle closes. SL below the confirmation candle low (buy) or above high (sell)"],
              check:"Has a confirmation candlestick pattern formed and CLOSED?" },
          ].map((s,i) => (
            <div key={i} style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderLeft:"3px solid "+s.color, borderRadius:12, padding:16, marginBottom:12 }}>
              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
                <span style={{ background:s.color, color:"#000", borderRadius:6, padding:"4px 10px", fontSize:13, fontWeight:800, fontFamily:"var(--font-display)" }}>Step {s.step}</span>
                <span style={{ fontSize:20 }}>{s.icon}</span>
                <span style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{s.title}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:12 }}>
                {s.details.map((d,j) => (
                  <div key={j} style={{ display:"flex", gap:8, fontSize:12, color:"var(--text-secondary)" }}>
                    <span style={{ color:s.color, fontWeight:700, minWidth:12 }}>▸</span>{d}
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(0,0,0,0.25)", border:"1px solid "+s.color+"33", borderRadius:8, padding:"8px 12px", fontSize:11, color:s.color, fontWeight:600 }}>
                ✅ Check: {s.check}
              </div>
            </div>
          ))}

          <div style={{ background:"rgba(255,215,0,0.05)", border:"2px solid rgba(255,215,0,0.3)", borderRadius:12, padding:16, textAlign:"center" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:800, color:"var(--accent-gold)", marginBottom:8 }}>🏆 The Golden Rule</div>
            <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.8 }}>
              ALL 5 must align → <strong style={{ color:"var(--accent-green)" }}>ENTER</strong><br/>
              4/5 aligned → <strong style={{ color:"var(--accent-orange)" }}>WAIT for step 5</strong><br/>
              3 or less → <strong style={{ color:"var(--accent-red)" }}>DO NOT TRADE</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
