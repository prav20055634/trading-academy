import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "trading_academy_portfolio_v1";

const defaultState = {
  trades: [],
  accountSize: 240,
  currency: "USD"
};

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultState;
    } catch { return defaultState; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio)); }
    catch(e) { console.log("Storage error:", e); }
  }, [portfolio]);

  const addTrade = useCallback((trade) => {
    const newTrade = {
      id: Date.now(),
      date: new Date().toISOString(),
      pair: trade.pair,
      direction: trade.direction, // BUY or SELL
      strategy: trade.strategy,
      entryPrice: parseFloat(trade.entryPrice),
      stopLoss: parseFloat(trade.stopLoss),
      takeProfit: parseFloat(trade.takeProfit),
      lotSize: parseFloat(trade.lotSize),
      riskAmount: parseFloat(trade.riskAmount),
      session: trade.session,
      status: "OPEN", // OPEN, WIN, LOSS
      exitPrice: null,
      pnl: null,
      pips: null,
      rr: null,
      notes: trade.notes || "",
      conditions: trade.conditions || []
    };
    setPortfolio(prev => ({
      ...prev,
      trades: [newTrade, ...prev.trades]
    }));
    return newTrade.id;
  }, []);

  const closeTrade = useCallback((id, exitPrice) => {
    setPortfolio(prev => ({
      ...prev,
      trades: prev.trades.map(t => {
        if (t.id !== id) return t;
        const exit = parseFloat(exitPrice);
        const isWin = t.direction === "BUY"
          ? exit > t.entryPrice
          : exit < t.entryPrice;
        const pips = Math.abs(exit - t.entryPrice) * (t.pair.includes("JPY") ? 100 : 10000);
        const slPips = Math.abs(t.stopLoss - t.entryPrice) * (t.pair.includes("JPY") ? 100 : 10000);
        const tpPips = Math.abs(t.takeProfit - t.entryPrice) * (t.pair.includes("JPY") ? 100 : 10000);
        const rr = slPips > 0 ? (pips / slPips).toFixed(2) : 0;
        const pnl = isWin ? t.riskAmount * rr : -t.riskAmount;
        return {
          ...t,
          exitPrice: exit,
          status: isWin ? "WIN" : "LOSS",
          pnl: parseFloat(pnl.toFixed(2)),
          pips: parseFloat(pips.toFixed(1)),
          rr: parseFloat(rr)
        };
      })
    }));
  }, []);

  const deleteTrade = useCallback((id) => {
    setPortfolio(prev => ({
      ...prev,
      trades: prev.trades.filter(t => t.id !== id)
    }));
  }, []);

  const updateAccountSize = useCallback((size) => {
    setPortfolio(prev => ({ ...prev, accountSize: parseFloat(size) }));
  }, []);

  // Stats calculation
  const stats = (() => {
    const closed = portfolio.trades.filter(t => t.status !== "OPEN");
    const wins = closed.filter(t => t.status === "WIN");
    const losses = closed.filter(t => t.status === "LOSS");
    const totalPnL = closed.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = closed.length > 0 ? ((wins.length / closed.length) * 100).toFixed(1) : 0;
    const avgRR = wins.length > 0 ? (wins.reduce((s, t) => s + (t.rr || 0), 0) / wins.length).toFixed(2) : 0;
    const currentBalance = portfolio.accountSize + totalPnL;

    // Equity curve
    let running = portfolio.accountSize;
    const equityCurve = closed.slice().reverse().map((t, i) => {
      running += (t.pnl || 0);
      return { trade: i + 1, balance: parseFloat(running.toFixed(2)) };
    });

    // Best pair
    const pairStats = {};
    closed.forEach(t => {
      if (!pairStats[t.pair]) pairStats[t.pair] = { wins: 0, total: 0 };
      pairStats[t.pair].total++;
      if (t.status === "WIN") pairStats[t.pair].wins++;
    });
    const bestPair = Object.entries(pairStats).sort((a,b) => (b[1].wins/b[1].total) - (a[1].wins/a[1].total))[0];

    return {
      totalTrades: closed.length,
      openTrades: portfolio.trades.filter(t => t.status === "OPEN").length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      avgRR,
      totalPnL: totalPnL.toFixed(2),
      currentBalance: currentBalance.toFixed(2),
      equityCurve,
      bestPair: bestPair ? bestPair[0] : "—",
      profitFactor: losses.length > 0
        ? (wins.reduce((s,t) => s + Math.abs(t.pnl||0), 0) / losses.reduce((s,t) => s + Math.abs(t.pnl||0), 1)).toFixed(2)
        : "∞"
    };
  })();

  return {
    portfolio,
    trades: portfolio.trades,
    stats,
    addTrade,
    closeTrade,
    deleteTrade,
    updateAccountSize
  };
}
