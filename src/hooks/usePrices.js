import { useState, useEffect, useRef, useCallback } from "react";

const BINANCE_SYMBOLS = ["btcusdt", "ethusdt", "solusdt", "xrpusdt", "bnbusdt"];

export function usePrices() {
  const [prices, setPrices] = useState({});
  const wsRef   = useRef(null);
  const retryRef= useRef(null);

  // ── Binance WebSocket — Crypto live prices ─────────────────────────────
  useEffect(() => {
    const streams = BINANCE_SYMBOLS.map(s => s + "@ticker").join("/");
    const url = "wss://stream.binance.com:9443/stream?streams=" + streams;

    const connect = () => {
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;
        ws.onopen  = () => { clearTimeout(retryRef.current); };
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (!msg.data) return;
            const d   = msg.data;
            const sym = d.s;
            const price  = parseFloat(d.c);
            const change = parseFloat(d.P);
            if (!sym || isNaN(price)) return;
            const decimals = (sym === "XRPUSDT") ? 4 : (sym === "BNBUSDT") ? 2 : 2;
            setPrices(prev => ({
              ...prev,
              [sym]: { price: price.toFixed(decimals), change: change.toFixed(2), source:"binance" }
            }));
          } catch (_) {}
        };
        ws.onerror = () => { try { ws.close(); } catch(_) {} };
        ws.onclose = () => { retryRef.current = setTimeout(connect, 5000); };
      } catch (_) { retryRef.current = setTimeout(connect, 5000); }
    };

    connect();
    return () => {
      clearTimeout(retryRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, []);

  // ── Forex prices ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchForex = async () => {
      try {
        const res  = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.rates) return;
        const r = data.rates;
        const pairs = [
          { sym:"EURUSD", price:(1/r.EUR).toFixed(5) },
          { sym:"GBPUSD", price:(1/r.GBP).toFixed(5) },
          { sym:"USDJPY", price:(r.JPY).toFixed(3)    },
          { sym:"GBPJPY", price:(r.JPY/r.GBP).toFixed(3) },
          { sym:"USDCAD", price:(r.CAD).toFixed(5)    },
          { sym:"NZDUSD", price:(1/r.NZD).toFixed(5)  },
        ];
        const updates = {};
        pairs.forEach(p => { updates[p.sym] = { price:p.price, change:"0.00", source:"openex" }; });
        setPrices(prev => ({ ...prev, ...updates }));
      } catch (_) {}
    };
    fetchForex();
    const t = setInterval(fetchForex, 60000);
    return () => clearInterval(t);
  }, []);

  // ── Gold ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchGold = async () => {
      try {
        const res  = await fetch("https://api.metals.live/v1/spot/gold");
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.price) return;
        setPrices(prev => ({
          ...prev,
          XAUUSD: { price: parseFloat(data.price).toFixed(2), change:"0.00", source:"metals" }
        }));
      } catch (_) {}
    };
    fetchGold();
    const t = setInterval(fetchGold, 60000);
    return () => clearInterval(t);
  }, []);

  return prices;
}

// ── Session status — ALL sessions including Indian market ─────────────────
// All times in UTC. IST = UTC + 5:30 (330 minutes)
export function useSessionStatus() {
  const [status, setStatus] = useState({});

  const check = useCallback(() => {
    const now     = new Date();
    const utcMins = now.getUTCHours() * 60 + now.getUTCMinutes();

    // Wrap-around range helper (handles midnight crossing)
    const inRange = (startUTC, endUTC) => {
      if (endUTC > startUTC) return utcMins >= startUTC && utcMins < endUTC;
      return utcMins >= startUTC || utcMins < endUTC; // crosses midnight
    };

    // ── Sessions in UTC ────────────────────────────────────────────────
    // Asian:         23:00–08:00 UTC  (4:30 AM – 1:30 PM IST)
    // Indian Market: 03:45–10:00 UTC  (9:15 AM – 3:30 PM IST)
    // India KZ:      03:45–04:45 UTC  (9:15 AM – 10:15 AM IST) — opening hour
    // London Open:   08:00–10:00 UTC  (1:30 PM – 3:30 PM IST)
    // London Full:   08:00–16:30 UTC  (1:30 PM – 10:00 PM IST)
    // NY Open KZ:    13:00–15:00 UTC  (6:30 PM – 8:30 PM IST)
    // NY Full:       13:00–21:30 UTC  (6:30 PM – 3:00 AM IST)
    // Overlap:       13:00–16:30 UTC  (6:30 PM – 10:00 PM IST)

    const asian_active    = inRange(1350, 480);  // 23:00–08:00 UTC
    const india_active    = inRange(225,  600);  // 03:45–10:00 UTC
    const india_kz        = inRange(225,  285);  // 03:45–04:45 UTC (9:15–10:15 AM IST)
    const london_kz       = inRange(480,  600);  // 08:00–10:00 UTC (1:30–3:30 PM IST)
    const london_active   = inRange(480,  990);  // 08:00–16:30 UTC
    const ny_kz           = inRange(780,  900);  // 13:00–15:00 UTC (6:30–8:30 PM IST)
    const ny_active       = inRange(780, 1290);  // 13:00–21:30 UTC
    const overlap_active  = inRange(780,  990);  // 13:00–16:30 UTC

    // Any kill zone active
    const ist_active = london_kz || ny_kz || india_kz || asian_active;

    setStatus({
      asian_active, india_active, india_kz,
      london_kz, london_active,
      ny_kz, ny_active, overlap_active,
      ist_active,
      ist_london_kz: london_kz,
      ist_ny_kz:     ny_kz,
      ist_india_kz:  india_kz,
      ist_asian:     asian_active,
      ist_label: india_kz   ? "🇮🇳 INDIA OPEN KZ"
               : london_kz  ? "🇬🇧 LONDON OPEN KZ"
               : ny_kz      ? "🗽 NY OPEN KZ"
               : asian_active? "🌏 ASIAN SESSION"
               : india_active? "🇮🇳 INDIA MARKET"
               : london_active?"🇬🇧 LONDON SESSION"
               : ny_active   ? "🗽 NY SESSION"
               : "😴 MARKET CLOSED",
      ist_color: india_kz   ? "#ff6b35"
               : london_kz  ? "#00d4aa"
               : ny_kz      ? "#f44336"
               : asian_active? "#4fc3f7"
               : "#666",
    });
  }, []);

  useEffect(() => {
    check();
    const t = setInterval(check, 15000); // check every 15s
    return () => clearInterval(t);
  }, [check]);

  return status;
}
