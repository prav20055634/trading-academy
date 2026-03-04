import React, { memo } from "react";

const TradingViewChart = memo(({ symbol, height = 500, interval = "60" }) => {
  // key forces remount when symbol/interval changes
  const src = [
    "https://s.tradingview.com/widgetembed/?",
    "symbol=" + encodeURIComponent(symbol),
    "&interval=" + interval,
    "&theme=dark",
    "&style=1",
    "&timezone=Asia%2FKolkata",
    "&locale=en",
    "&toolbar_bg=%230d1421",
    "&withdateranges=1",
    "&hide_side_toolbar=0",
    "&allow_symbol_change=1",
    "&hidevolume=0",
  ].join("");

  return (
    <div style={{ height: height, width: "100%", background: "#070b14" }}>
      <iframe
        key={symbol + "_" + interval}
        src={src}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allowTransparency="true"
        allowFullScreen={true}
        title={"Chart " + symbol}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
      />
    </div>
  );
});

TradingViewChart.displayName = "TradingViewChart";
export default TradingViewChart;
