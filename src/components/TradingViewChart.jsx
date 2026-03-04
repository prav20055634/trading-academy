import React, { memo } from "react";

const TradingViewChart = memo(({ symbol, height = 500, interval = "60" }) => {
  const src = [
    "https://s.tradingview.com/widgetembed/?",
    `symbol=${encodeURIComponent(symbol)}`,
    `&interval=${interval}`,
    "&theme=dark",
    "&style=1",
    "&timezone=Asia%2FKolkata",
    "&locale=en",
    "&toolbar_bg=%230d1421",
    "&withdateranges=1",
    "&hide_side_toolbar=0",
    "&allow_symbol_change=1",
    "&studies=MASimple%40tv-basicstudies%1FRSI%40tv-basicstudies",
    "&hidevolume=0"
  ].join("");

  return (
    <div style={{ height, width: "100%", background: "#070b14" }}>
      <iframe
        src={src}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allowTransparency="true"
        allowFullScreen={true}
        title={`TradingView ${symbol}`}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
});

TradingViewChart.displayName = "TradingViewChart";
export default TradingViewChart;
