import React, { useState } from "react";
import "./index.css";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Markets from "./pages/Markets";
import SignalChecker from "./pages/SignalChecker";
import LearningPath from "./pages/LearningPath";
import Portfolio from "./pages/Portfolio";
import News from "./pages/News";
import Scanner from "./pages/Scanner";
import { Calculator } from "./pages/Calculator";
import Strategies from "./pages/Strategies";
import Rules from "./pages/Rules";
import Backtest from "./pages/Backtest";
import Analyzer from "./pages/Analyzer";

const PAGE_TITLES = {
  scanner: "Signal Scanner",
  home: "Dashboard",
  markets: "Markets & Live Charts",
  signals: "Signal Checker",
  learning: "Learning Path",
  portfolio: "Portfolio Tracker",
  news: "Live News",
  calculator: "Position Calculator",
  strategies: "Strategy Reference",
  rules: "Trading Rules",
  analyzer: "Signal Analyzer",
};

export default function App() {
  const [page, setPage] = useState("home");
  const [marketPair, setMarketPair] = useState(null);

  const navigate = (p, data) => {
    setPage(p);
    if (p === "markets" && data) setMarketPair(data);
  };

  const renderPage = () => {
    switch (page) {
      case "scanner": return <Scanner />;
      case "home": return <Dashboard onNavigate={navigate} />;
      case "markets": return <Markets initialPair={marketPair} />;
      case "signals": return <SignalChecker />;
      case "learning": return <LearningPath />;
      case "portfolio": return <Portfolio />;
      case "news": return <News />;
      case "calculator": return <Calculator />;
      case "strategies": return <Strategies />;
      case "rules": return <Rules />;
      case "analyzer": return <Analyzer />;
      case "backtest": return <Backtest />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar active={page} onNav={setPage} />
      <div className="main-content">
        <TopBar title={PAGE_TITLES[page] || "Trading Academy Pro"} />
        {renderPage()}
      </div>
    </div>
  );
}
