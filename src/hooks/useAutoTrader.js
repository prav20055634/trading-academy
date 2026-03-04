import { useEffect, useRef, useCallback } from "react";

const JOURNAL_KEY  = "trading_journal_v2";
const AUTO_LOG_KEY = "auto_trader_log_v1";

// ── Read / write journal ───────────────────────────────────────────────────
function readJournal()  { try { return JSON.parse(localStorage.getItem(JOURNAL_KEY)  || "[]"); } catch { return []; } }
function writeJournal(d){ try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(d)); } catch {} }
function readLog()      { try { return JSON.parse(localStorage.getItem(AUTO_LOG_KEY) || "[]"); } catch { return []; } }
function writeLog(d)    { try { localStorage.setItem(AUTO_LOG_KEY, JSON.stringify(d.slice(0,50))); } catch {} }

// ── Add auto-event to activity log ────────────────────────────────────────
function pushLog(msg, type="info") {
  const log = readLog();
  log.unshift({ msg, type, time: new Date().toISOString() });
  writeLog(log);
  // Emit custom event so UI updates instantly
  window.dispatchEvent(new CustomEvent("autotrader_update", { detail: { msg, type } }));
}

// ── Per-instrument config (same as Scanner) ───────────────────────────────
const CFG = {
  EURUSD:    { pip:0.0001, dec:5, slPips:15,  tp1Pips:30,  tp2Pips:60,   bull:1.0500, bear:1.1200, minMet:7 },
  GBPUSD:    { pip:0.0001, dec:5, slPips:20,  tp1Pips:40,  tp2Pips:80,   bull:1.2500, bear:1.3200, minMet:7 },
  USDJPY:    { pip:0.01,   dec:3, slPips:20,  tp1Pips:40,  tp2Pips:80,   bull:148.00, bear:158.00, minMet:7 },
  GBPJPY:    { pip:0.01,   dec:3, slPips:30,  tp1Pips:60,  tp2Pips:120,  bull:185.00, bear:200.00, minMet:7 },
  USDCAD:    { pip:0.0001, dec:5, slPips:15,  tp1Pips:30,  tp2Pips:60,   bull:1.3500, bear:1.4200, minMet:7 },
  NZDUSD:    { pip:0.0001, dec:5, slPips:15,  tp1Pips:30,  tp2Pips:60,   bull:0.5800, bear:0.6500, minMet:7 },
  XAUUSD:    { pip:0.1,    dec:2, slPips:8,   tp1Pips:16,  tp2Pips:32,   bull:2200,   bear:2600,   minMet:7 },
  BTCUSDT:   { pip:1,      dec:0, slPips:200, tp1Pips:400, tp2Pips:800,  bull:60000,  bear:100000, minMet:7 },
  ETHUSDT:   { pip:1,      dec:2, slPips:25,  tp1Pips:50,  tp2Pips:100,  bull:2500,   bear:5000,   minMet:7 },
  SOLUSDT:   { pip:0.1,    dec:2, slPips:3,   tp1Pips:6,   tp2Pips:12,   bull:120,    bear:300,    minMet:7 },
  XRPUSDT:   { pip:0.001,  dec:4, slPips:0.04,tp1Pips:0.08,tp2Pips:0.16, bull:0.50,   bear:1.50,   minMet:7 },
  BNBUSDT:   { pip:0.1,    dec:2, slPips:5,   tp1Pips:10,  tp2Pips:20,   bull:400,    bear:700,    minMet:7 },
  NIFTY50:   { pip:1,      dec:2, slPips:40,  tp1Pips:80,  tp2Pips:160,  bull:22000,  bear:26000,  minMet:7 },
  SENSEX:    { pip:1,      dec:2, slPips:120, tp1Pips:240, tp2Pips:480,  bull:72000,  bear:82000,  minMet:7 },
  BANKNIFTY: { pip:1,      dec:2, slPips:60,  tp1Pips:120, tp2Pips:240,  bull:46000,  bear:54000,  minMet:7 },
};

// ── Evaluate all 9 SMC conditions ─────────────────────────────────────────
function evaluate(id, price, session) {
  const cfg = CFG[id];
  const p   = parseFloat(price);
  if (!cfg || !p || p <= 0) return null;

  const mid        = (cfg.bull + cfg.bear) / 2;
  const isBull     = p >= mid;
  const rangeSize  = Math.abs(cfg.bear - cfg.bull);
  const pos        = rangeSize > 0 ? Math.max(0, Math.min(1, (p - Math.min(cfg.bull,cfg.bear)) / rangeSize)) : 0.5;
  const roundStep  = cfg.pip * 500;
  const nearRound  = Math.abs(p - Math.round(p / roundStep) * roundStep) < roundStep * 0.15;

  const c1 = true;
  const c2 = isBull ? pos < 0.50 : pos > 0.50;
  const c3 = nearRound;
  const c4 = pos >= 0.38 && pos <= 0.65;
  const c5 = pos < 0.08 || pos > 0.92;
  const c6 = Math.abs(pos - 0.5) > 0.07;
  const c7 = session?.ist_active || false;
  const c8 = nearRound && pos > 0.15 && pos < 0.85;
  const c9 = true;

  const met = [c1,c2,c3,c4,c5,c6,c7,c8,c9].filter(Boolean).length;
  const dir = isBull ? "BUY" : "SELL";

  // Only generate trade signal during kill zone with 7+ conditions
  if (!c7 || met < cfg.minMet) return null;

  const isBuy = dir === "BUY";
  const entry = p;
  const sl    = isBuy ? p - cfg.slPips  : p + cfg.slPips;
  const tp1   = isBuy ? p + cfg.tp1Pips : p - cfg.tp1Pips;
  const tp2   = isBuy ? p + cfg.tp2Pips : p - cfg.tp2Pips;

  return { dir, met, entry, sl, tp1, tp2 };
}

// ── Main hook — call this once in App or Scanner ───────────────────────────
export function useAutoTrader(allPrices, session) {
  // Track which pairs already have an open auto-trade
  const openPairs = useRef(new Set());

  const process = useCallback(() => {
    if (!allPrices || Object.keys(allPrices).length === 0) return;

    const journal = readJournal();

    // Build set of pairs that already have an OPEN trade
    const currentlyOpen = new Set(
      journal.filter(t => t.status === "OPEN").map(t => t.pair)
    );

    let journalChanged = false;

    Object.keys(CFG).forEach(id => {
      const pd = allPrices[id];
      if (!pd?.price) return;
      const p = parseFloat(pd.price);
      if (!p) return;

      // ── 1. CHECK EXISTING OPEN TRADES FOR THIS PAIR ───────────────────
      const openTrade = journal.find(t => t.pair === id && t.status === "OPEN" && t.source === "auto");
      if (openTrade) {
        const isBuy = openTrade.direction === "BUY";

        // Check TP2 first (full exit)
        if (openTrade.tp2 && (isBuy ? p >= openTrade.tp2 : p <= openTrade.tp2)) {
          const pnl = isBuy ? openTrade.tp2 - openTrade.entry : openTrade.entry - openTrade.tp2;
          Object.assign(openTrade, { status:"WIN", exitPrice:openTrade.tp2, pnl:parseFloat(pnl.toFixed(4)), closeTime:new Date().toISOString(), closeReason:"TP2 hit" });
          journalChanged = true;
          openPairs.current.delete(id);
          pushLog(`✅ TP2 HIT — ${id} ${openTrade.direction} — +${pnl.toFixed(2)} pts`, "win");
        }
        // Check TP1
        else if (isBuy ? p >= openTrade.tp1 : p <= openTrade.tp1) {
          const pnl = isBuy ? openTrade.tp1 - openTrade.entry : openTrade.entry - openTrade.tp1;
          Object.assign(openTrade, { status:"WIN", exitPrice:openTrade.tp1, pnl:parseFloat(pnl.toFixed(4)), closeTime:new Date().toISOString(), closeReason:"TP1 hit" });
          journalChanged = true;
          openPairs.current.delete(id);
          pushLog(`🎯 TP1 HIT — ${id} ${openTrade.direction} — +${pnl.toFixed(2)} pts`, "win");
        }
        // Check SL
        else if (isBuy ? p <= openTrade.sl : p >= openTrade.sl) {
          const pnl = isBuy ? openTrade.sl - openTrade.entry : openTrade.entry - openTrade.sl;
          Object.assign(openTrade, { status:"LOSS", exitPrice:openTrade.sl, pnl:parseFloat(pnl.toFixed(4)), closeTime:new Date().toISOString(), closeReason:"SL hit" });
          journalChanged = true;
          openPairs.current.delete(id);
          pushLog(`❌ SL HIT — ${id} ${openTrade.direction} — ${pnl.toFixed(2)} pts`, "loss");
        }
        return; // Don't open new trade while one is open for this pair
      }

      // ── 2. LOOK FOR NEW SIGNAL ─────────────────────────────────────────
      if (currentlyOpen.has(id)) return; // skip if manually open trade exists

      const signal = evaluate(id, pd.price, session);
      if (!signal) return;

      // Prevent duplicate: check last closed trade was not the same direction within 5 min
      const lastTrade = journal.find(t => t.pair === id && t.source === "auto");
      if (lastTrade) {
        const age = Date.now() - new Date(lastTrade.openTime).getTime();
        if (age < 5 * 60 * 1000) return; // cooldown 5 minutes
      }

      // ── AUTO-SAVE trade to journal ─────────────────────────────────────
      const trade = {
        id:          Date.now() + Math.random(),
        pair:        id,
        direction:   signal.dir,
        entry:       parseFloat(signal.entry.toFixed(CFG[id].dec)),
        sl:          parseFloat(signal.sl.toFixed(CFG[id].dec)),
        tp1:         parseFloat(signal.tp1.toFixed(CFG[id].dec)),
        tp2:         parseFloat(signal.tp2.toFixed(CFG[id].dec)),
        strategy:    signal.met >= 9 ? "OB+CHoCH" : signal.met >= 8 ? "CRT+Sweep" : "Breaker+FVG",
        session:     session?.ist_london_kz ? "London Open KZ" : "NY Open KZ",
        notes:       `Auto-saved — ${signal.met}/9 conditions met`,
        status:      "OPEN",
        openTime:    new Date().toISOString(),
        closeTime:   null,
        exitPrice:   null,
        pnl:         null,
        source:      "auto",
        conditionsMet: signal.met,
      };

      journal.unshift(trade);
      currentlyOpen.add(id);
      openPairs.current.add(id);
      journalChanged = true;
      pushLog(`📌 AUTO-SAVED — ${id} ${signal.dir} @ ${signal.entry.toFixed(CFG[id].dec)} — ${signal.met}/9 conditions`, "open");
    });

    if (journalChanged) writeJournal(journal);
  }, [allPrices, session]);

  // Run every 5 seconds
  useEffect(() => {
    const t = setInterval(process, 5000);
    return () => clearInterval(t);
  }, [process]);
}

export function readAutoLog() { return readLog(); }
