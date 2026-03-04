import React, { useState } from "react";
import TradingViewChart from "../components/TradingViewChart";
import { FOREX_PAIRS, CRYPTO_PAIRS, INDIAN_MARKETS } from "../data/markets";
import { usePrices } from "../hooks/usePrices";

const ALL_MARKETS = [
  { label: "💱 Forex", items: FOREX_PAIRS, type: "forex" },
  { label: "🪙 Crypto", items: CRYPTO_PAIRS, type: "crypto" },
  { label: "🇮🇳 India", items: INDIAN_MARKETS, type: "indian" },
];

const TIMEFRAMES = [
  { label: "5M", value: "5" },
  { label: "15M", value: "15" },
  { label: "1H", value: "60" },
  { label: "4H", value: "240" },
  { label: "1D", value: "D" },
  { label: "1W", value: "W" },
];

export default function Markets({ initialPair }) {
  const prices = usePrices();
  const [selectedPair, setSelectedPair] = useState(initialPair || FOREX_PAIRS[0]);
  const [timeframe, setTimeframe] = useState("60");
  const [marketTab, setMarketTab] = useState("forex");

  const allItems = ALL_MARKETS.find(m => m.type === marketTab)?.items || [];
  const priceKey = selectedPair.binanceSymbol || selectedPair.id;
  const p = prices[priceKey] || {};

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📈 Live Charts</h1>
        <p className="page-subtitle">TradingView live charts — all timeframes — click any pair</p>
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: "start" }}>
        {/* LEFT: pair selector */}
        <div>
          <div className="tabs" style={{ marginBottom: 12 }}>
            {ALL_MARKETS.map(m => (
              <button key={m.type} className={`tab ${marketTab === m.type ? "active" : ""}`}
                onClick={() => setMarketTab(m.type)}>{m.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {allItems.map(item => {
              const pk = item.binanceSymbol || item.id;
              const pr = prices[pk] || {};
              const isSelected = selectedPair.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedPair(item)}
                  style={{
                    background: isSelected ? `rgba(${hexToRgb(item.color)},0.08)` : "var(--bg-card)",
                    border: `1px solid ${isSelected ? item.color : "var(--border)"}`,
                    borderRadius: 8, padding: "10px 12px", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{item.flags || item.icon}</span>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: item.color }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{item.nickname}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                      {pr.price || "—"}
                    </div>
                    {pr.change && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: parseFloat(pr.change) >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                        {parseFloat(pr.change) >= 0 ? "▲" : "▼"}{Math.abs(parseFloat(pr.change))}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Chart */}
        <div>
          <div className="chart-container">
            <div className="chart-header">
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: selectedPair.color }}>
                  {selectedPair.flags || selectedPair.icon} {selectedPair.name} — {selectedPair.nickname}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {selectedPair.tvSymbol} • {selectedPair.session || ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf.value}
                    className={`btn ${timeframe === tf.value ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "4px 10px", fontSize: 11 }}
                    onClick={() => setTimeframe(tf.value)}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
            <TradingViewChart
              symbol={selectedPair.tvSymbol}
              interval={timeframe}
              height={520}
            />
          </div>

          {/* Pair details */}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title" style={{ color: selectedPair.color }}>ℹ️ {selectedPair.name} Key Info</div>
            <div className="grid-2" style={{ marginTop: 12, gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>DESCRIPTION</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{selectedPair.description}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>KEY LEVELS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(selectedPair.keyLevels || []).map(l => (
                    <span key={l} className="badge badge-orange">{l}</span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, marginTop: 10 }}>CORRELATION</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{selectedPair.correlation}</div>
              </div>
            </div>
            {selectedPair.avoid && (
              <div style={{ marginTop: 12, background: "rgba(244,67,54,0.08)", border: "1px solid rgba(244,67,54,0.25)", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "var(--accent-red)" }}>
                ⚠️ {selectedPair.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "0,212,170";
}
