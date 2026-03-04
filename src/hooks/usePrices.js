import { useState, useEffect, useRef, useCallback } from "react";

const BINANCE_SYMBOLS = ["btcusdt", "ethusdt", "solusdt", "xrpusdt", "bnbusdt"];

export function usePrices() {
  const [prices, setPrices] = useState({});
  const wsRef = useRef(null);
  const retryRef = useRef(null);

  useEffect(() => {
    const streams = BINANCE_SYMBOLS.map(s => s + "@ticker").join("/");
    const url = "wss://stream.binance.com:9443/stream?streams=" + streams;

    const connect = () => {
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;
        ws.onopen = () => { clearTimeout(retryRef.current); };
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (!msg.data) return;
            const d = msg.data;
            const sym = d.s;
            const price = parseFloat(d.c);
            const change = parseFloat(d.P);
            if (!sym || isNaN(price)) return;
            const decimals = (sym === "XRPUSDT" || sym === "BNBUSDT") ? 4 : 2;
            setPrices(prev => ({
              ...prev,
              [sym]: { price: price.toFixed(decimals), change: change.toFixed(2), source: "binance" }
            }));
          } catch (_) {}
        };
        ws.onerror = () => { try { ws.close(); } catch(_) {} };
        ws.onclose = () => { retryRef.current = setTimeout(connect, 5000); };
      } catch (_) {
        retryRef.current = setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      clearTimeout(retryRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, []);

  useEffect(() => {
    const fetchForex = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.rates) return;
        const r = data.rates;
        const pairs = [
          { sym: "EURUSD", price: (1 / r.EUR).toFixed(5) },
          { sym: "GBPUSD", price: (1 / r.GBP).toFixed(5) },
          { sym: "USDJPY", price: (r.JPY).toFixed(3) },
          { sym: "GBPJPY", price: (r.JPY / r.GBP).toFixed(3) },
          { sym: "USDCAD", price: (r.CAD).toFixed(5) },
          { sym: "NZDUSD", price: (1 / r.NZD).toFixed(5) },
        ];
        const updates = {};
        pairs.forEach(p => { updates[p.sym] = { price: p.price, change: "0.00", source: "openex" }; });
        setPrices(prev => ({ ...prev, ...updates }));
      } catch (_) {}
    };
    fetchForex();
    const t = setInterval(fetchForex, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchGold = async () => {
      try {
        const res = await fetch("https://api.metals.live/v1/spot/gold");
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.price) return;
        setPrices(prev => ({
          ...prev,
          XAUUSD: { price: parseFloat(data.price).toFixed(2), change: "0.00", source: "metals" }
        }));
      } catch (_) {}
    };
    fetchGold();
    const t = setInterval(fetchGold, 60000);
    return () => clearInterval(t);
  }, []);

  return prices;
}

export function useSessionStatus() {
  const [status, setStatus] = useState({});

  const check = useCallback(() => {
    const now = new Date();
    const utcTotal = now.getUTCHours() * 60 + now.getUTCMinutes();
    const inRange = (s, e) => utcTotal >= s && utcTotal < e;

    const result = {
      asian:       { label: "Asian Session",       ist: "5:30AM-2:30PM IST",  active: inRange(0,   540) },
      london_open: { label: "London Open KZ",      ist: "1:30-3:30PM IST",    active: inRange(480, 600) },
      london_full: { label: "London Session",      ist: "1:30-10:30PM IST",   active: inRange(480, 1020) },
      ny_open:     { label: "NY Open KZ",          ist: "6:30-8:30PM IST",    active: inRange(780, 900) },
      ny_full:     { label: "NY Session",          ist: "6:30PM-3:30AM IST",  active: inRange(780, 1320) },
      overlap:     { label: "London-NY Overlap",   ist: "6:30-10:30PM IST",   active: inRange(780, 1020) },
    };

    const ist_london_kz = inRange(480, 600);
    const ist_ny_kz     = inRange(780, 900);
    result.ist_london_kz = ist_london_kz;
    result.ist_ny_kz     = ist_ny_kz;
    result.ist_active    = ist_london_kz || ist_ny_kz;
    result.ist_label     = ist_london_kz ? "LONDON KZ ACTIVE" : ist_ny_kz ? "NY KZ ACTIVE" : "NO KILL ZONE";
    setStatus(result);
  }, []);

  useEffect(() => {
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [check]);

  return status;
}
