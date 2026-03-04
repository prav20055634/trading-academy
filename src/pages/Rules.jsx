import React from "react";

export default function Rules() {
  const rules = [
    {
      category: "⏰ TIMING RULES", color: "#f7931a",
      rules: [
        { rule: "Only trade 1:30–3:30 PM IST (London Open Kill Zone)", critical: true },
        { rule: "Only trade 6:30–8:30 PM IST (NY Open Kill Zone)", critical: true },
        { rule: "NEVER trade the Asian session (unless USDJPY specific setup)", critical: true },
        { rule: "Mark Asian session range BEFORE 1:30 PM every day", critical: false },
        { rule: "Do weekly analysis every Sunday before market opens", critical: false },
      ]
    },
    {
      category: "🎯 ENTRY RULES (ALL 9 MUST BE MET)", color: "#00d4aa",
      rules: [
        { rule: "Higher timeframe trend confirmed (Daily + 4H same direction)", critical: true },
        { rule: "Price in Discount zone for buys (below 50% of range)", critical: true },
        { rule: "Untested Order Block present with strong displacement + BOS", critical: true },
        { rule: "Golden Zone (0.618–0.786) must align with at least 2 confirmations", critical: true },
        { rule: "Liquidity sweep must have occurred BEFORE entry", critical: true },
        { rule: "CHoCH confirmed on 15min AFTER liquidity sweep", critical: true },
        { rule: "London or NY Kill Zone must be active", critical: true },
        { rule: "FVG aligns with OB + HTF structure + session", critical: false },
        { rule: "Risk = 1.5% max, R:R = minimum 1:3", critical: true },
        { rule: "IF 1 CONDITION MISSING → ABSOLUTELY NO TRADE", critical: true },
      ]
    },
    {
      category: "💰 RISK MANAGEMENT RULES", color: "#ab47bc",
      rules: [
        { rule: "Maximum risk per trade: 1.5% of account ($3.60 on $240)", critical: true },
        { rule: "Maximum 1 trade per session (London OR NY, not both)", critical: true },
        { rule: "After 1 losing trade → STOP for the entire day. No revenge.", critical: true },
        { rule: "After 2 winning trades → STOP for the day. Protect profits.", critical: true },
        { rule: "NEVER widen stop loss. Set it once. Leave it.", critical: true },
        { rule: "NEVER add to a losing position", critical: true },
        { rule: "If account drops 10% → halve position size until recovered", critical: false },
        { rule: "Maximum 2 open trades at the same time", critical: false },
        { rule: "Set SL and TP BEFORE clicking the entry button", critical: true },
      ]
    },
    {
      category: "📋 ORDER BLOCK RULES", color: "#4fc3f7",
      rules: [
        { rule: "Valid OB must have strong impulse (large displacement candle)", critical: true },
        { rule: "Valid OB must have a Break of Structure AFTER it", critical: true },
        { rule: "No deep retracement before the impulse or it is NOT valid", critical: true },
        { rule: "OB must be untested — once mitigated = no longer valid", critical: true },
        { rule: "No displacement = NOT an Order Block. Do not trade it.", critical: true },
        { rule: "Higher timeframe OB always overrides lower timeframe OB", critical: false },
      ]
    },
    {
      category: "⚡ FVG RULES", color: "#ffd700",
      rules: [
        { rule: "FVG must align with higher timeframe structure direction", critical: true },
        { rule: "FVG must be inside Discount (for buys) or Premium (for sells)", critical: true },
        { rule: "FVG must have formed during London or NY session", critical: true },
        { rule: "FVG must align with an Order Block", critical: true },
        { rule: "FVG alone is NOT a reason to enter. It is confirmation only.", critical: true },
        { rule: "If FVG conditions not met → ignore the gap completely", critical: true },
      ]
    },
    {
      category: "🔄 CHoCH RULES", color: "#e91e63",
      rules: [
        { rule: "CHoCH must break a SIGNIFICANT swing high/low (not a tiny swing)", critical: true },
        { rule: "CHoCH must occur AFTER a liquidity sweep — not before", critical: true },
        { rule: "CHoCH candle must close strongly (full-bodied candle)", critical: true },
        { rule: "CHoCH must align with higher timeframe bias direction", critical: true },
        { rule: "No HTF bias = ignore CHoCH completely. Do not trade it.", critical: true },
      ]
    },
    {
      category: "🌀 FIBONACCI RULES", color: "#ff6b35",
      rules: [
        { rule: "Golden Zone (0.618–0.786) must align with at least 2 of: OB, S/R, Round number, FVG, Session open", critical: true },
        { rule: "Golden Zone alone = NOT tradable. Never enter on Golden Zone only.", critical: true },
        { rule: "Draw Fibonacci on 4H significant swings only", critical: false },
        { rule: "TP1 = -27.2% extension, TP2 = -61.8% extension (Power Target)", critical: false },
        { rule: "Take 50% off at TP1, move SL to breakeven, let rest run to TP2", critical: false },
      ]
    },
    {
      category: "🧠 PSYCHOLOGY RULES", color: "#00bcd4",
      rules: [
        { rule: "NEVER trade when emotionally upset or stressed", critical: true },
        { rule: "NEVER trade to recover losses — revenge trading destroys accounts", critical: true },
        { rule: "A trade without SL is gambling. Always. No exceptions.", critical: true },
        { rule: "Missing a good setup is FINE. Forcing a bad one is fatal.", critical: true },
        { rule: "No trade = profit. Every bad trade costs real money.", critical: false },
        { rule: "Journal every trade — win or loss — within 30 minutes of closing", critical: false },
        { rule: "Review weekly statistics every Sunday. Fix the pattern, not the trade.", critical: false },
        { rule: "One perfect trade per week beats 20 random trades every time.", critical: false },
      ]
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📋 Trading Rules</h1>
        <p className="page-subtitle">These are non-negotiable. Print them. Read them before every session.</p>
      </div>

      <div style={{ background: "rgba(244,67,54,0.06)", border: "1px solid rgba(244,67,54,0.25)", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--accent-red)" }}>
        ⚠️ THE GOLDEN RULE: If even ONE of the 9 entry conditions is missing → DO NOT ENTER THE TRADE. No exceptions. No "almost." No "close enough."
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {rules.map((cat, i) => (
          <div key={i} className="card" style={{ borderLeftWidth: 3, borderLeftColor: cat.color }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: cat.color, marginBottom: 12 }}>
              {cat.category}
            </div>
            {cat.rules.map((r, j) => (
              <div key={j} style={{
                display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0",
                borderBottom: "1px solid var(--border)", fontSize: 13
              }}>
                <span style={{ color: r.critical ? "var(--accent-red)" : "var(--accent-green)", fontSize: 14, marginTop: 1 }}>
                  {r.critical ? "⚠️" : "✅"}
                </span>
                <span style={{ color: r.critical ? "var(--text-primary)" : "var(--text-secondary)", lineHeight: 1.5 }}>
                  {r.rule}
                </span>
                {r.critical && (
                  <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--accent-red)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>REQUIRED</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
