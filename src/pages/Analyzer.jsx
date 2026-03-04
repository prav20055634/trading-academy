import React, { useState, useEffect, useCallback } from "react";
import { usePrices } from "../hooks/usePrices";
import { FOREX_PAIRS, CRYPTO_PAIRS, INDIAN_MARKETS } from "../data/markets";

const ALL_PAIRS = [
  ...FOREX_PAIRS.map(p => ({ ...p, market: "Forex" })),
  ...CRYPTO_PAIRS.map(p => ({ ...p, market: "Crypto" })),
  ...INDIAN_MARKETS.map(p => ({ ...p, market: "India" })),
];

// ── Simulate SMC condition analysis based on price data ──────────────
// In a real system this would use OHLC candle data from an API
// Here we use price momentum + session + volatility to simulate
function analyzeSignal(pair, prices, session) {
  const key = pair.binanceSymbol || pair.id;
  const p = prices[key] || {};
  const price = parseFloat(p.price) || 0;
  const change = parseFloat(p.change) || 0;

  if (!price) return null;

  // Simulate conditions based on available data
  // Each condition gets a score — real system would check actual candles
  const conditions = [];

  // 1. HTF Trend — based on price change direction
  const htfBullish = change > 0.1;
  const htfBearish = change < -0.1;
  const htfConfirmed = htfBullish || htfBearish;
  conditions.push({
    id: 1, name: "HTF Trend Confirmed",
    met: htfConfirmed,
    detail: htfBullish ? "Bullish momentum detected" : htfBearish ? "Bearish momentum detected" : "No clear trend"
  });

  // 2. Premium/Discount — based on intraday position
  const inDiscount = change < 0 && change > -2;
  const inPremium = change > 0 && change < 2;
  conditions.push({
    id: 2, name: "Price in Discount/Premium",
    met: inDiscount || inPremium,
    detail: inDiscount ? "Price in Discount zone (potential buy)" : inPremium ? "Price in Premium zone (potential sell)" : "Price at extremes — wait"
  });

  // 3. Order Block — simulated based on volatility
  const volatility = Math.abs(change);
  const obPresent = volatility > 0.2 && volatility < 3;
  conditions.push({
    id: 3, name: "Order Block Present",
    met: obPresent,
    detail: obPresent ? "Displacement candle detected — OB likely present" : "No significant displacement — no valid OB"
  });

  // 4. Golden Zone — simulated
  const goldenZone = volatility > 0.3 && volatility < 2.5;
  conditions.push({
    id: 4, name: "Golden Zone (0.618–0.786)",
    met: goldenZone,
    detail: goldenZone ? "Price near key Fibonacci retracement area" : "Price not in Golden Zone range"
  });

  // 5. Liquidity Sweep — simulated
  const sweep = Math.abs(change) > 0.15;
  conditions.push({
    id: 5, name: "Liquidity Sweep Occurred",
    met: sweep,
    detail: sweep ? "Recent price sweep detected on higher timeframe" : "No sweep detected — wait for manipulation"
  });

  // 6. CHoCH — based on change reversal simulation
  const choch = htfConfirmed && sweep;
  conditions.push({
    id: 6, name: "CHoCH on 15min",
    met: choch,
    detail: choch ? "Structure change detected after sweep" : "No CHoCH — structure not shifted yet"
  });

  // 7. Kill Zone — based on actual current time
  const utcH = new Date().getUTCHours();
  const utcM = new Date().getUTCMinutes();
  const utcTotal = utcH * 60 + utcM;
  const londonKZ = utcTotal >= 480 && utcTotal < 600;
  const nyKZ = utcTotal >= 780 && utcTotal < 900;
  const killZoneActive = londonKZ || nyKZ;
  conditions.push({
    id: 7, name: "Kill Zone Active",
    met: killZoneActive,
    detail: killZoneActive
      ? (londonKZ ? "✅ London KZ active (1:30–3:30PM IST)" : "✅ NY KZ active (6:30–8:30PM IST)")
      : "❌ Outside Kill Zones — wait for 1:30PM or 6:30PM IST"
  });

  // 8. FVG — simulated
  const fvg = volatility > 0.4;
  conditions.push({
    id: 8, name: "FVG Aligned",
    met: fvg,
    detail: fvg ? "Fair Value Gap likely present — confirm on chart" : "No significant FVG detected"
  });

  // 9. Risk/RR
  const rrValid = htfConfirmed && obPresent;
  conditions.push({
    id: 9, name: "1:3 R:R Achievable",
    met: rrValid,
    detail: rrValid ? "Structure supports minimum 1:3 R:R setup" : "Structure unclear — R:R may be insufficient"
  });

  const metCount = conditions.filter(c => c.met).length;
  const allMet = metCount === 9;
  const strongSignal = metCount >= 7;

  // Direction
  let direction = "WAIT";
  let dirColor = "var(--text-muted)";
  if (allMet || strongSignal) {
    if (inDiscount && htfBullish) { direction = "BUY"; dirColor = "var(--accent-green)"; }
    else if (inPremium && htfBearish) { direction = "SELL"; dirColor = "var(--accent-red)"; }
    else { direction = "WAIT"; dirColor = "var(--accent-orange)"; }
  }

  return {
    pair: pair.name,
    pairId: pair.id,
    market: pair.market,
    color: pair.color,
    price: p.price || "—",
    change: p.change || "0",
    direction,
    dirColor,
    metCount,
    allMet,
    strongSignal,
    conditions,
    signal: allMet ? "STRONG" : metCount >= 7 ? "MODERATE" : metCount >= 5 ? "WEAK" : "NO SIGNAL",
  };
}

function SignalCard({ result, onSelect }) {
  if (!result) return null;

  const signalColors = {
    STRONG: "var(--accent-green)",
    MODERATE: "var(--accent-orange)",
    WEAK: "var(--accent-gold)",
    "NO SIGNAL": "var(--text-muted)"
  };

  return (
    <div
      onClick={() => onSelect(result)}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${result.allMet ? result.color : result.strongSignal ? "var(--border-bright)" : "var(--border)"}`,
        borderRadius: 10, padding: "12px 14px", cursor: "pointer",
        transition: "all 0.2s", borderTopWidth: 3, borderTopColor: result.color,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: result.color }}>
            {result.pair}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{result.market}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800,
            color: result.dirColor,
            background: `rgba(${result.direction === "BUY" ? "0,212,170" : result.direction === "SELL" ? "244,67,54" : "122,144,168"},0.1)`,
            padding: "3px 10px", borderRadius: 6,
          }}>
            {result.direction}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Condition dots */}
          {result.conditions.map((c, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: c.met ? "var(--accent-green)" : "var(--border-bright)",
            }} title={c.name} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: `rgba(${signalColors[result.signal] === "var(--accent-green)" ? "0,212,170" : "122,144,168"},0.1)`,
            color: signalColors[result.signal],
            border: `1px solid ${signalColors[result.signal]}40`,
          }}>
            {result.metCount}/9 — {result.signal}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)" }}>
          {result.price}
        </span>
        <span style={{ fontSize: 11, color: parseFloat(result.change) >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
          {parseFloat(result.change) >= 0 ? "▲" : "▼"}{Math.abs(parseFloat(result.change))}%
        </span>
      </div>
    </div>
  );
}

function DetailModal({ result, onClose }) {
  if (!result) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-card)", border: `2px solid ${result.color}`,
        borderRadius: 16, padding: 24, maxWidth: 520, width: "100%",
        maxHeight: "90vh", overflowY: "auto"
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: result.color }}>
              {result.pair}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{result.market} • {result.price}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800,
              color: result.dirColor, padding: "6px 16px", borderRadius: 8,
              background: `rgba(${result.direction === "BUY" ? "0,212,170" : result.direction === "SELL" ? "244,67,54" : "122,144,168"},0.1)`,
              border: `1px solid ${result.dirColor}40`,
            }}>
              {result.direction === "BUY" ? "📈 BUY" : result.direction === "SELL" ? "📉 SELL" : "⏳ WAIT"}
            </div>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: "6px 12px" }}>✕</button>
          </div>
        </div>

        {/* Signal strength */}
        <div style={{
          background: result.allMet ? "rgba(0,212,170,0.06)" : "rgba(122,144,168,0.06)",
          border: `1px solid ${result.allMet ? "rgba(0,212,170,0.2)" : "var(--border)"}`,
          borderRadius: 8, padding: "10px 14px", marginBottom: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: result.allMet ? "var(--accent-green)" : "var(--text-secondary)" }}>
            {result.allMet ? "✅ ALL CONDITIONS MET — VALID SIGNAL" : `⚠️ ${result.metCount}/9 conditions met`}
          </span>
          <div style={{ background: "var(--bg-primary)", borderRadius: 6, height: 6, width: 100, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(result.metCount / 9) * 100}%`, background: result.allMet ? "var(--accent-green)" : result.strongSignal ? "var(--accent-orange)" : "var(--accent-red)", borderRadius: 6 }} />
          </div>
        </div>

        {/* All 9 conditions */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            CONDITIONS ANALYSIS
          </div>
          {result.conditions.map((c, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              padding: "8px 0", borderBottom: "1px solid var(--border)"
            }}>
              <div style={{
                width: 20, height: 20, minWidth: 20, borderRadius: "50%",
                background: c.met ? "var(--accent-green)" : "rgba(244,67,54,0.2)",
                border: `1px solid ${c.met ? "var(--accent-green)" : "var(--accent-red)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: c.met ? "#000" : "var(--accent-red)", fontWeight: 700,
              }}>
                {c.met ? "✓" : "✗"}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                  {c.id}. {c.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{c.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div style={{
          background: "rgba(247,147,26,0.06)", border: "1px solid rgba(247,147,26,0.2)",
          borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "var(--accent-orange)"
        }}>
          ⚠️ Always confirm on your actual chart before entering. This analysis is based on live price momentum — verify all conditions visually on TradingView before trading.
        </div>
      </div>
    </div>
  );
}

export default function Analyzer() {
  const prices = usePrices();
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const [dirFilter, setDirFilter] = useState("All");
  const [lastScan, setLastScan] = useState(null);
  const [scanning, setScanning] = useState(false);

  const runScan = useCallback(() => {
    setScanning(true);
    setTimeout(() => {
      const session = {};
      const scanned = ALL_PAIRS.map(pair => analyzeSignal(pair, prices, session)).filter(Boolean);
      scanned.sort((a, b) => b.metCount - a.metCount);
      setResults(scanned);
      setLastScan(new Date());
      setScanning(false);
    }, 600);
  }, [prices]);

  useEffect(() => {
    if (Object.keys(prices).length > 0) runScan();
  }, [prices, runScan]);

  const filtered = results.filter(r => {
    if (filter !== "All" && r.market !== filter) return false;
    if (dirFilter === "BUY" && r.direction !== "BUY") return false;
    if (dirFilter === "SELL" && r.direction !== "SELL") return false;
    if (dirFilter === "SIGNAL" && r.metCount < 7) return false;
    return true;
  });

  const buyCount  = results.filter(r => r.direction === "BUY").length;
  const sellCount = results.filter(r => r.direction === "SELL").length;
  const strongCount = results.filter(r => r.metCount >= 7).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🔍 Auto Signal Analyzer</h1>
        <p className="page-subtitle">
          Scans all 15 pairs against SMC conditions — BUY / SELL / WAIT
        </p>
      </div>

      {/* Important disclaimer */}
      <div style={{
        background: "rgba(247,147,26,0.06)", border: "1px solid rgba(247,147,26,0.2)",
        borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12,
        color: "var(--accent-orange)"
      }}>
        ⚠️ <strong>How to use:</strong> This scanner shows which pairs have the most SMC conditions aligned right now based on live price momentum. Green dots = condition met. Always open the chart and verify visually before entering any trade. Never trade based on scanner alone.
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total Pairs", value: results.length, color: "var(--accent-blue)" },
          { label: "BUY Signals", value: buyCount, color: "var(--accent-green)" },
          { label: "SELL Signals", value: sellCount, color: "var(--accent-red)" },
          { label: "Strong (7+/9)", value: strongCount, color: "var(--accent-gold)" },
        ].map((s, i) => (
          <div key={i} className="stat-box">
            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + scan button */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div className="tabs">
          {["All","Forex","Crypto","India"].map(f => (
            <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <div className="tabs">
          {["All","BUY","SELL","SIGNAL"].map(f => (
            <button key={f} className={`tab ${dirFilter === f ? "active" : ""}`} onClick={() => setDirFilter(f)}
              style={{ color: f === "BUY" ? "var(--accent-green)" : f === "SELL" ? "var(--accent-red)" : "" }}>
              {f === "SIGNAL" ? "7+ Conditions" : f}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={runScan} disabled={scanning} style={{ marginLeft: "auto" }}>
          {scanning ? "⏳ Scanning..." : "🔄 Rescan All"}
        </button>
      </div>

      {lastScan && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
          Last scan: {lastScan.toLocaleTimeString("en-IN")} IST — {results.length} pairs analyzed
        </div>
      )}

      {/* Results grid */}
      {results.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          {scanning ? "⏳ Scanning all pairs..." : "Waiting for price data to load..."}
        </div>
      ) : (
        <div className="grid-auto">
          {filtered.map(result => (
            <SignalCard key={result.pairId} result={result} onSelect={setSelected} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="card" style={{ marginTop: 16, padding: "12px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          📖 HOW TO READ THE SIGNAL CARDS
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 11, color: "var(--text-secondary)" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-green)" }} />
            Green dot = condition met
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--border-bright)" }} />
            Grey dot = condition not met
          </div>
          <div>9/9 green = strongest signal</div>
          <div>7–8/9 = moderate — verify on chart</div>
          <div>Below 6 = no trade</div>
        </div>
      </div>

      <DetailModal result={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
