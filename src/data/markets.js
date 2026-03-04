export const FOREX_PAIRS = [
  {
    id: "EURUSD", name: "EUR/USD", nickname: "The Queen",
    flags: "🇪🇺🇺🇸", volatility: "HIGH", session: "London + NY",
    spread: "0.1–0.5 pip", beginner: true, color: "#00d4aa",
    tvSymbol: "FX:EURUSD", pipValue: 0.10,
    keyLevels: ["1.0500","1.0800","1.1000","1.1200"],
    minPips: 300, maxPips: 600,
    description: "Most liquid pair. Cleanest SMC structure. Best for beginners.",
    correlation: "Moves with GBPUSD 85% of the time",
    bestTime: "8AM–5PM GMT (1:30PM–10:30PM IST)",
    news: ["NFP","CPI","ECB Rate Decision","FOMC"],
    avoid: false
  },
  {
    id: "GBPUSD", name: "GBP/USD", nickname: "The Cable",
    flags: "🇬🇧🇺🇸", volatility: "HIGH", session: "London + NY",
    spread: "0.5–1 pip", beginner: true, color: "#4fc3f7",
    tvSymbol: "FX:GBPUSD", pipValue: 0.10,
    keyLevels: ["1.2500","1.2700","1.3000","1.3200"],
    minPips: 300, maxPips: 600,
    description: "Strong trending pair. News-sensitive. Second most popular.",
    correlation: "Moves with EURUSD 85% of the time",
    bestTime: "8AM–5PM GMT (1:30PM–10:30PM IST)",
    news: ["UK CPI","BOE Decision","NFP"],
    avoid: false
  },
  {
    id: "USDJPY", name: "USD/JPY", nickname: "The Ninja",
    flags: "🇺🇸🇯🇵", volatility: "HIGH", session: "Tokyo + NY",
    spread: "0.5–1 pip", beginner: false, color: "#ff9800",
    tvSymbol: "FX:USDJPY", pipValue: 0.07,
    keyLevels: ["145.00","148.00","150.00","152.00","155.00"],
    minPips: 300, maxPips: 600,
    description: "Driven by US interest rates and BOJ policy. 150.00 is critical BOJ level.",
    correlation: "Follows US10Y bond yields closely",
    bestTime: "12AM–9AM GMT (5:30AM–2:30PM IST) + NY",
    news: ["BOJ Statement","US10Y Yields","FOMC"],
    avoid: false
  },
  {
    id: "GBPJPY", name: "GBP/JPY", nickname: "The Dragon 🐉",
    flags: "🇬🇧🇯🇵", volatility: "VERY HIGH", session: "London + NY",
    spread: "2–3 pips", beginner: false, color: "#f44336",
    tvSymbol: "FX:GBPJPY", pipValue: 0.07,
    keyLevels: ["185.00","188.00","190.00","195.00","200.00"],
    minPips: 300, maxPips: 600,
    description: "⚠️ WIDOW MAKER. 150–250 pip daily range. $500+ account minimum.",
    correlation: "Combines GBP + JPY volatility",
    bestTime: "London + NY ONLY. NEVER on 15min chart.",
    news: ["BOE","BOJ","US NFP"],
    avoid: true
  },
  {
    id: "USDCAD", name: "USD/CAD", nickname: "The Loonie",
    flags: "🇺🇸🇨🇦", volatility: "MEDIUM", session: "NY",
    spread: "1–1.5 pips", beginner: false, color: "#ab47bc",
    tvSymbol: "FX:USDCAD", pipValue: 0.07,
    keyLevels: ["1.3000","1.3500","1.4000"],
    minPips: 300, maxPips: 600,
    description: "Inversely correlated to WTI crude oil. Check oil before every trade.",
    correlation: "Oil UP = USDCAD DOWN (inverse)",
    bestTime: "1PM–6PM GMT (6:30PM–11:30PM IST)",
    news: ["WTI Crude Oil","BOC Rate","Canada Employment"],
    avoid: false
  },
  {
    id: "NZDUSD", name: "NZD/USD", nickname: "The Kiwi",
    flags: "🇳🇿🇺🇸", volatility: "MEDIUM", session: "Sydney + London",
    spread: "1–2 pips", beginner: true, color: "#26a69a",
    tvSymbol: "FX:NZDUSD", pipValue: 0.10,
    keyLevels: ["0.5800","0.6000","0.6100","0.6300"],
    minPips: 300, maxPips: 600,
    description: "Risk barometer. Rises on optimism. Slower — good for beginners learning S&R.",
    correlation: "Moves with commodity prices and AUD",
    bestTime: "Sydney + London sessions",
    news: ["RBNZ Rate","NZ CPI","Commodity prices"],
    avoid: false
  },
  {
    id: "XAUUSD", name: "XAU/USD", nickname: "Safe Haven Gold",
    flags: "🥇🇺🇸", volatility: "VERY HIGH", session: "All Sessions",
    spread: "20–35 pips", beginner: false, color: "#ffd700",
    tvSymbol: "OANDA:XAUUSD", pipValue: 0.10,
    keyLevels: ["2280","2300","2350","2400","2500","3000"],
    minPips: 300, maxPips: 600,
    description: "⚠️ $1 gold move = 10 pips. Daily range $20–50. SMC FVGs extremely powerful.",
    correlation: "Inversely correlated to USD (DXY)",
    bestTime: "London + NY opens",
    news: ["FOMC","CPI","Geopolitical events","DXY"],
    avoid: true
  }
];

export const CRYPTO_PAIRS = [
  {
    id: "BTCUSDT", name: "BTC/USDT", nickname: "Bitcoin",
    icon: "₿", volatility: "VERY HIGH", color: "#f7931a",
    tvSymbol: "BINANCE:BTCUSDT", binanceSymbol: "BTCUSDT",
    isLeader: true, minTarget: 800, maxTarget: 800,
    keyLevels: ["$50,000","$60,000","$70,000","$80,000","$100,000"],
    description: "Market leader. BTC leads all crypto 80–90%. Always check BTC first.",
    correlation: "BTC leads ETH, SOL, XRP, BNB",
    leverage: "2x–3x MAX",
    avoid: false
  },
  {
    id: "ETHUSDT", name: "ETH/USDT", nickname: "Ethereum",
    icon: "Ξ", volatility: "VERY HIGH", color: "#627eea",
    tvSymbol: "BINANCE:ETHUSDT", binanceSymbol: "ETHUSDT",
    isLeader: false, minTarget: 50, maxTarget: 60,
    keyLevels: ["$2,000","$2,500","$3,000","$3,500"],
    description: "Second largest. Follows BTC. Strong SMC structure. FVGs very reliable.",
    correlation: "Follows BTC 80–90% of the time",
    leverage: "2x–3x MAX",
    avoid: false
  },
  {
    id: "SOLUSDT", name: "SOL/USDT", nickname: "Solana",
    icon: "◎", volatility: "EXTREME", color: "#9945ff",
    tvSymbol: "BINANCE:SOLUSDT", binanceSymbol: "SOLUSDT",
    isLeader: false, minTarget: 400, maxTarget: 800,
    keyLevels: ["$100","$150","$200","$250"],
    description: "Extremely volatile. Large pip ranges. SMC setups work well on 4H+.",
    correlation: "Follows BTC trend, more volatile",
    leverage: "2x MAX",
    avoid: false
  },
  {
    id: "XRPUSDT", name: "XRP/USDT", nickname: "Ripple XRP",
    icon: "✕", volatility: "HIGH", color: "#00aae4",
    tvSymbol: "BINANCE:XRPUSDT", binanceSymbol: "XRPUSDT",
    isLeader: false, minTarget: 400, maxTarget: 800,
    keyLevels: ["$0.50","$1.00","$1.50","$2.00","$3.00"],
    description: "News-sensitive. Legal events drive price. Large range moves on breakouts.",
    correlation: "Follows BTC but news-independent spikes",
    leverage: "2x MAX",
    avoid: false
  },
  {
    id: "BNBUSDT", name: "BNB/USDT", nickname: "BNB",
    icon: "⬡", volatility: "HIGH", color: "#f3ba2f",
    tvSymbol: "BINANCE:BNBUSDT", binanceSymbol: "BNBUSDT",
    isLeader: false, minTarget: 400, maxTarget: 800,
    keyLevels: ["$400","$500","$600","$700"],
    description: "Binance ecosystem token. Steady trends. Less erratic than SOL.",
    correlation: "Follows BTC with moderate correlation",
    leverage: "2x–3x MAX",
    avoid: false
  }
];

export const INDIAN_MARKETS = [
  {
    id: "NIFTY50", name: "NIFTY 50", nickname: "India 50 Index",
    icon: "🇮🇳", volatility: "MEDIUM", color: "#ff6b35",
    tvSymbol: "NSE:NIFTY50", yahooSymbol: "^NSEI",
    minTarget: 200, maxTarget: 800,
    keyLevels: ["22000","22500","23000","23500","24000","25000"],
    description: "Top 50 NSE companies. Most traded Indian index. SMC works on 15min+.",
    bestTime: "9:15AM–11:15AM IST + 1:30PM–3:30PM IST",
    news: ["RBI Policy","Budget","FII Data","Global cues"],
    correlation: "Correlated with global risk sentiment",
    avoid: false
  },
  {
    id: "SENSEX", name: "SENSEX", nickname: "BSE Sensex 30",
    icon: "📈", volatility: "MEDIUM", color: "#e91e63",
    tvSymbol: "BSE:SENSEX", yahooSymbol: "^BSESN",
    minTarget: 200, maxTarget: 800,
    keyLevels: ["72000","74000","76000","78000","80000"],
    description: "BSE top 30 companies. Moves in parallel with NIFTY. Confirm both.",
    bestTime: "9:15AM–11:15AM IST + 1:30PM–3:30PM IST",
    news: ["RBI Policy","FII Flows","Quarterly Results"],
    correlation: "Moves with NIFTY 95% of the time",
    avoid: false
  },
  {
    id: "BANKNIFTY", name: "BANK NIFTY", nickname: "Banking Index",
    icon: "🏦", volatility: "HIGH", color: "#00bcd4",
    tvSymbol: "NSE:BANKNIFTY", yahooSymbol: "^NSEBANK",
    minTarget: 200, maxTarget: 800,
    keyLevels: ["46000","47000","48000","49000","50000","52000"],
    description: "Banking sector index. More volatile than NIFTY. Excellent SMC setups.",
    bestTime: "9:15AM–11:15AM IST + 1:30PM–3:30PM IST",
    news: ["RBI Rate Decision","Bank Earnings","Credit Policy"],
    correlation: "Leads NIFTY on banking news",
    avoid: false
  }
];

export const ENTRY_CONDITIONS = [
  {
    id: 1, label: "Higher Timeframe Trend Confirmed",
    detail: "Daily AND 4H both showing same structure direction (both bullish = buy only, both bearish = sell only)",
    icon: "📊", critical: true
  },
  {
    id: 2, label: "Price in Discount (Buy) or Premium (Sell)",
    detail: "Below 50% of range = Discount (buy zone). Above 50% = Premium (sell zone). Use Fibonacci midpoint.",
    icon: "💰", critical: true
  },
  {
    id: 3, label: "Untested Order Block Present",
    detail: "Valid OB must have: Strong impulse candle + BOS after it + No deep retracement + Not already mitigated. No displacement = NOT an OB.",
    icon: "📦", critical: true
  },
  {
    id: 4, label: "Golden Zone Overlaps Order Block",
    detail: "0.618–0.786 Fib retracement must align with at least 2 of: OB, Previous S/R, Round Number, FVG, Session Open. Golden Zone alone = NOT tradable.",
    icon: "🌀", critical: true
  },
  {
    id: 5, label: "Liquidity Sweep Occurred",
    detail: "Price swept a swing high/low (hunted stops) before reversing. The sweep = manipulation phase complete.",
    icon: "🎯", critical: true
  },
  {
    id: 6, label: "CHoCH Confirmed on 15min",
    detail: "CHoCH valid ONLY if: breaks significant swing high/low + happens AFTER liquidity sweep + full-bodied close candle + aligns with HTF bias. No HTF bias = ignore CHoCH.",
    icon: "🔄", critical: true
  },
  {
    id: 7, label: "Kill Zone Active (IST Time)",
    detail: "Only trade 1:30PM–3:30PM IST (London Open) OR 6:30PM–8:30PM IST (NY Open). No random Asian session trades.",
    icon: "⏰", critical: true
  },
  {
    id: 8, label: "FVG Aligns with Setup",
    detail: "FVG valid only if: inside HTF structure + in discount/premium zone + formed during London/NY session + aligns with OB. FVG = confirmation, NOT primary reason.",
    icon: "⚡", critical: false
  },
  {
    id: 9, label: "Risk 1.5–2% + Minimum 1:3 R:R",
    detail: "Max 1 trade per session. After 1 loss = stop for day. After 2 wins = stop for day. Never widen SL. 1.5% risk if serious.",
    icon: "🛡️", critical: true
  }
];

export const STRATEGIES = [
  {
    id: 1, name: "OB + CHoCH", short: "OB+CHoCH",
    level: "Beginner", levelColor: "#00d4aa", levelNum: 1,
    color: "#00d4aa",
    summary: "The foundational SMC entry. Fresh Order Block confirmed by Change of Character.",
    description: "This is the first strategy every new trader must master. It requires only two things: a fresh 4H Order Block in the direction of Daily bias, and a CHoCH on the 15min chart when price enters the OB zone. Cleanest setup, most common, best for building discipline.",
    steps: [
      "Step 1 — Daily Chart: Confirm bullish (HH+HL) or bearish (LL+LH) structure",
      "Step 2 — 4H Chart: Find the last untested Order Block in the bias direction",
      "Step 3 — OB Validation: Confirm strong impulse + BOS after OB + not mitigated",
      "Step 4 — Wait for price to RETRACE back into the OB zone",
      "Step 5 — 15min Chart: Watch for CHoCH AFTER a liquidity sweep inside the OB",
      "Step 6 — Entry on CHoCH candle close. Stop below OB low (buys) / above OB high (sells)",
      "Step 7 — TP1 at -27.2% extension, TP2 at -61.8% extension"
    ],
    bestPairs: ["EURUSD","GBPUSD","NIFTY50","BTCUSD","ETHUSD"],
    timeframes: "Daily bias → 4H OB → 15min entry",
    killzone: "London Open (1:30–3:30 IST) or NY Open (6:30–8:30 IST)",
    rr: "1:3 to 1:4",
    frequency: "Daily — most common setup",
    winRate: "55–65% with discipline",
    prerequisites: ["Market Structure", "Order Blocks", "CHoCH concept"],
    avoid: "Do NOT enter if OB has been touched before. Fresh = untested only."
  },
  {
    id: 2, name: "CRT + Liquidity Sweep", short: "CRT+SWEEP",
    level: "Intermediate", levelColor: "#f7931a", levelNum: 2,
    color: "#f7931a",
    summary: "Trade the manipulation phase — fake move then true distribution.",
    description: "CRT (Candle Range Theory) teaches the three phases: Accumulation (Asian range), Manipulation (fake sweep), Distribution (true move). You trade the reversal after the fake move. Requires being present at London Open 1:30PM IST sharp.",
    steps: [
      "Step 1 — Mark Asian session HIGH and LOW on 15min chart before 1:30PM IST",
      "Step 2 — At 1:30PM IST (London Open Kill Zone) watch price closely",
      "Step 3 — Manipulation: Price sweeps BELOW Asian low OR ABOVE Asian high",
      "Step 4 — Wait for price to REVERSE back inside the Asian range",
      "Step 5 — Confirm with 5min CHoCH after the reversal back inside range",
      "Step 6 — Entry at close of reversal candle. Stop beyond the sweep wick.",
      "Step 7 — Target: Opposing end of range + previous session POI"
    ],
    bestPairs: ["EURUSD","GBPUSD","USDJPY","XAUUSD"],
    timeframes: "4H range → 15min manipulation → 5min entry",
    killzone: "London Open ONLY — 1:30PM–3:30PM IST",
    rr: "1:3 to 1:5",
    frequency: "Every London session — high frequency",
    winRate: "50–60% at London Open",
    prerequisites: ["OB+CHoCH mastered first","Session timing","Liquidity concepts"],
    avoid: "DO NOT use at random times. London Open ONLY. Invalidated if BOTH Asian high and low are swept."
  },
  {
    id: 3, name: "ICT Breaker + FVG", short: "BRK+FVG",
    level: "Intermediate", levelColor: "#f7931a", levelNum: 3,
    color: "#ab47bc",
    summary: "Failed Order Block that flipped — entry at FVG inside the Breaker zone.",
    description: "A Breaker Block is a failed OB that has changed polarity. When a bullish OB is violated (price closes through it), it becomes bearish resistance. The FVG formed during the break-through gives the precise entry. Two institutional forces combine: trapped traders + role reversal.",
    steps: [
      "Step 1 — Find an original 4H Order Block that was VIOLATED (price closed through it)",
      "Step 2 — Mark the Breaker Block zone (same candle area, now flipped direction)",
      "Step 3 — Identify the Fair Value Gap formed during the break-through move",
      "Step 4 — Confirm: FVG is inside HTF structure + in discount/premium + formed in London/NY",
      "Step 5 — Wait for price to RETRACE into the Breaker+FVG zone",
      "Step 6 — Entry at FVG level. Stop below entire Breaker zone.",
      "Step 7 — Target next liquidity pool — previous highs/lows or Daily OB"
    ],
    bestPairs: ["EURUSD","GBPUSD","BTCUSD","XAUUSD"],
    timeframes: "Daily/4H Breaker → 1H FVG → 15min entry",
    killzone: "London or NY Open",
    rr: "1:4 to 1:6",
    frequency: "2–3 times per week",
    winRate: "60–70% — higher precision entry",
    prerequisites: ["OB+CHoCH mastered","CRT+Sweep mastered","Understand role reversal"],
    avoid: "Do NOT use if the Breaker zone is near a major Daily S&R that could reject price early."
  },
  {
    id: 4, name: "Power of Three (PO3)", short: "PO3",
    level: "Advanced", levelColor: "#ffd700", levelNum: 4,
    color: "#ff6b35",
    summary: "Trade the three-phase session narrative: Accumulation → Manipulation → Distribution.",
    description: "PO3 is a macro session framework. Every day follows the same three phases. Monday = Accumulation. Tuesday/Wednesday = Manipulation (fake move). Thursday/Friday = Distribution (true move). On a daily basis: Asian = Accumulation, London Open = Manipulation, London/NY = Distribution.",
    steps: [
      "Step 1 — Weekly context: What was Monday's range? Where are buy/sell side liquidity pools?",
      "Step 2 — Mark the Asian session range HIGH and LOW precisely",
      "Step 3 — Identify which side has MORE liquidity (more stops) — that is where manipulation will go",
      "Step 4 — At London Open (1:30PM IST) wait for price to sweep the high-liquidity side",
      "Step 5 — Manipulation complete when price sweeps and immediately reverses with strong candle",
      "Step 6 — Entry in OPPOSITE direction of the sweep. This IS the Distribution phase beginning.",
      "Step 7 — Target: Weekly opposing liquidity pool. R:R of 1:5 to 1:8 possible on good setups."
    ],
    bestPairs: ["EURUSD","GBPUSD","USDJPY","XAUUSD","BTCUSD"],
    timeframes: "Weekly context → Daily range → 4H → 15min entry",
    killzone: "London Open primarily — 1:30PM–3:30PM IST",
    rr: "1:5 to 1:8",
    frequency: "Weekly — lower frequency, higher quality",
    winRate: "65–75% when full context is correct",
    prerequisites: ["All previous 3 strategies mastered","Minimum 3 months experience"],
    avoid: "Never trade PO3 without weekly context analysis done BEFORE the week starts."
  },
  {
    id: 5, name: "Breaker + FVG + OTF", short: "BRK+OTF",
    level: "Expert", levelColor: "#f44336", levelNum: 5,
    color: "#ffd700",
    summary: "Highest probability — Breaker+FVG during One Timeframe trending market.",
    description: "One Timeframe (OTF) means the market is trending so strongly in one direction that it prints ONLY BOS with no CHoCH — every pullback immediately breaks structure again. Adding Breaker+FVG inside an OTF trend creates the highest probability setup in the entire system. Rare but elite.",
    steps: [
      "Step 1 — Confirm 4H is in OTF mode: Only BOS in one direction, zero CHoCH, strong momentum",
      "Step 2 — 15min must ALSO be OTF confirming same direction — double confirmation",
      "Step 3 — Find the most recent Breaker Block at a key pullback level within the OTF trend",
      "Step 4 — Identify FVG within the Breaker zone (the precision entry area)",
      "Step 5 — Confirm all 9 entry conditions are met — this setup requires FULL confluence",
      "Step 6 — Entry at FVG inside Breaker. Stop below entire Breaker zone (wider stop needed).",
      "Step 7 — Target: Next major liquidity pool — equal highs/lows, Daily OB, or Weekly level"
    ],
    bestPairs: ["BTCUSD","EURUSD","BANKNIFTY"],
    timeframes: "Daily OTF → 4H OTF → 15min Breaker+FVG entry",
    killzone: "London or NY Open",
    rr: "1:5 to 1:10",
    frequency: "Rare — highest quality only",
    winRate: "70–80% when OTF is genuine",
    prerequisites: ["All 4 previous strategies fully mastered","Minimum 6 months experience","100+ demo trades"],
    avoid: "The moment a CHoCH appears on 4H, OTF is BROKEN. Exit the setup immediately. Do not force OTF when the trend pauses."
  }
];

export const LEARNING_PATH = [
  {
    phase: 1, title: "Foundation — The Language of Price",
    duration: "Week 1–2", icon: "🏗️", color: "#00d4aa",
    strategy: null,
    goal: "Read market structure fluently on any chart before looking at anything else.",
    topics: [
      { name: "Higher High (HH) and Higher Low (HL)", detail: "What they look like on a real chart" },
      { name: "Lower Low (LL) and Lower High (LH)", detail: "Identifying downtrend structure" },
      { name: "Break of Structure (BOS)", detail: "Trend continuation confirmed" },
      { name: "Change of Character (CHoCH)", detail: "The first reversal signal" },
      { name: "Bullish vs Bearish structure rules", detail: "Only buy in bullish, only sell in bearish" }
    ],
    dailyTask: "Open EURUSD 4H chart on TradingView. Mark EVERY HH, HL, LH, LL going back 6 months. Find every BOS and CHoCH. Do this every day for 14 days.",
    pair: "EURUSD only",
    platform: "TradingView Free",
    doNot: "Do NOT look at any other pair. Do NOT place any trades. Structure first.",
    quiz: ["What is the difference between BOS and CHoCH?","In a bullish structure, what should you NEVER do?","If price breaks a Higher Low for the first time, what is that called?"]
  },
  {
    phase: 2, title: "Support & Resistance Zones",
    duration: "Week 3–4", icon: "🧱", color: "#4fc3f7",
    strategy: null,
    goal: "Draw zones like a bank trader — areas, not lines.",
    topics: [
      { name: "Drawing zones correctly (body to wick)", detail: "Never just a single line" },
      { name: "Role Reversal Rule", detail: "Old support becomes new resistance — most profitable concept" },
      { name: "Big Figures / Round numbers", detail: "1.0800, 1.1000, 150.00 — where banks place orders" },
      { name: "Dynamic S&R — EMA 20/50/200", detail: "Moving average as support in uptrends" },
      { name: "Psychological levels in crypto", detail: "$2000, $50,000, $100,000" }
    ],
    dailyTask: "Draw every major S&R zone on EURUSD + BTCUSD on 4H. Find 5 examples of role reversal on each. Mark all round numbers.",
    pair: "EURUSD + BTCUSD",
    platform: "TradingView Free",
    doNot: "Do NOT draw lines. Zones only. Test every zone for role reversal before marking it.",
    quiz: ["What happens when a support level breaks?","Why are round numbers (1.1000, $50,000) so important?","What is the difference between static and dynamic S&R?"]
  },
  {
    phase: 3, title: "Fibonacci Golden Zone",
    duration: "Week 5–6", icon: "🌀", color: "#f7931a",
    strategy: null,
    goal: "Use Fibonacci as a precision entry filter, not a standalone signal.",
    topics: [
      { name: "How to draw Fibonacci correctly", detail: "Swing LOW to swing HIGH in uptrend (and reverse)" },
      { name: "The Golden Zone 0.618–0.786", detail: "Where smart money enters pullbacks" },
      { name: "50% Equilibrium level", detail: "Premium vs Discount divider" },
      { name: "Extension targets -27.2% and -61.8%", detail: "TP1 and TP2 placement" },
      { name: "Golden Zone validation rules", detail: "Must align with 2+ of: OB, S&R, Round number, FVG, Session open" }
    ],
    dailyTask: "Draw Fib on every major swing on EURUSD + ETHUSD (4H). Mark every Golden Zone. Find where price bounced from the zone. Note what session the bounce occurred in.",
    pair: "EURUSD + ETHUSD",
    platform: "TradingView Free",
    doNot: "Never trade Golden Zone alone. It MUST combine with at least one other confirmation.",
    quiz: ["What are the two levels of the Golden Zone?","What is the TP2 Power Target extension level?","If Golden Zone has no Order Block or S&R alignment, do you trade it?"]
  },
  {
    phase: 4, title: "Order Blocks — OB + CHoCH Strategy",
    duration: "Week 7–8", icon: "📦", color: "#ab47bc",
    strategy: "OB + CHoCH",
    goal: "Identify and trade the first complete SMC strategy end-to-end.",
    topics: [
      { name: "What creates an Order Block", detail: "Last opposing candle before a strong impulse" },
      { name: "OB Validation Rules", detail: "Strong impulse + BOS + no deep retracement + not mitigated" },
      { name: "Fresh vs Mitigated OB", detail: "Once touched = no longer valid" },
      { name: "Breaker Blocks (Failed OBs)", detail: "When OB is violated it flips direction" },
      { name: "Higher TF OB > Lower TF OB", detail: "Daily OB beats 4H OB beats 1H OB" }
    ],
    dailyTask: "Find the 5 most recent OBs on 1H EURUSD. Check if fresh or mitigated. Paper trade Strategy 1 (OB+CHoCH) during London Open only. Log every trade in a journal.",
    pair: "EURUSD + GBPUSD",
    platform: "TradingView Paper Trading",
    doNot: "Do NOT trade real money yet. No OB without displacement candle. No entry without CHoCH.",
    quiz: ["What is the last red candle before a bullish impulse called?","When does an Order Block become a Breaker Block?","Can you trade an OB that has already been touched once?"]
  },
  {
    phase: 5, title: "Sessions, Kill Zones & CRT",
    duration: "Week 9–10", icon: "⏰", color: "#ff6b35",
    strategy: "CRT + Liquidity Sweep",
    goal: "Trade only at the right time. Add CRT strategy to your toolkit.",
    topics: [
      { name: "4 Forex sessions and their characteristics", detail: "Sydney, Tokyo, London, New York" },
      { name: "IST Kill Zones", detail: "1:30–3:30PM IST (London) + 6:30–8:30PM IST (NY)" },
      { name: "Asian range marking", detail: "The range that will be swept" },
      { name: "CRT — Candle Range Theory", detail: "Accumulation → Manipulation → Distribution" },
      { name: "PO3 weekly framework", detail: "Which day is manipulation vs distribution" }
    ],
    dailyTask: "Watch London Open LIVE for 10 days (1:30PM IST). Mark Asian range before 1:30PM every day. Write every liquidity sweep you observe. Paper trade CRT setups only.",
    pair: "EURUSD + GBPUSD",
    platform: "TradingView Paper + Broker Demo",
    doNot: "NEVER trade the Asian session. No trade outside 1:30–3:30PM or 6:30–8:30PM IST.",
    quiz: ["What are the three phases of PO3?","If London sweeps the Asian LOW, which direction is the true move?","What time is London Open in IST?"]
  },
  {
    phase: 6, title: "SMC Deep Dive — All Concepts",
    duration: "Week 11–12", icon: "🧠", color: "#e91e63",
    strategy: "ICT Breaker + FVG",
    goal: "Master all SMC concepts and add Breaker+FVG to your strategy.",
    topics: [
      { name: "Liquidity pools — buy side and sell side", detail: "Where stops cluster above highs and below lows" },
      { name: "Fair Value Gaps (FVG)", detail: "3-candle inefficiency that price fills magnetically" },
      { name: "Premium and Discount zones", detail: "Above 50% = Premium (sell). Below = Discount (buy)" },
      { name: "Breaker Blocks — full mechanics", detail: "Failed OB + FVG combination" },
      { name: "Correlation rules", detail: "EURUSD/GBPUSD 85%, BTC leads crypto 80–90%" }
    ],
    dailyTask: "Hunt for FVGs on 1H EURUSD and BTCUSD after every news event. Mark every liquidity sweep. Identify premium vs discount zones on all your traded pairs. Add Breaker+FVG paper trades.",
    pair: "EURUSD + BTCUSD + BANKNIFTY",
    platform: "TradingView Paper + Demo Broker",
    doNot: "FVG alone is NOT an entry reason. It must align with OB, structure, session, and HTF bias.",
    quiz: ["Where does buy-side liquidity sit?","What are the conditions for a valid FVG entry?","When is price in the Discount zone?"]
  },
  {
    phase: 7, title: "Full System — Top Down Analysis",
    duration: "Week 13–14", icon: "🎯", color: "#ffd700",
    strategy: "PO3 + All Strategies",
    goal: "Execute complete top-down analysis from Weekly to 5min and apply all strategies.",
    topics: [
      { name: "Weekly bias setting", detail: "Every Sunday, set the weekly directional bias" },
      { name: "Daily structure and POI identification", detail: "Where will price react this week?" },
      { name: "4H trade direction and CHoCH watching", detail: "The confirmation timeframe" },
      { name: "1H entry zone and FVG hunting", detail: "Narrowing to the exact entry area" },
      { name: "15min/5min precise entry execution", detail: "The trigger — CHoCH, sweep, OB touch" }
    ],
    dailyTask: "Every Sunday: Weekly analysis for EURUSD, GBPUSD, BTCUSD, BANKNIFTY. Every morning: Daily structure update. Every session: 4H confirmation before any entry. Trade only during kill zones.",
    pair: "EURUSD + GBPUSD + BTCUSD + BANKNIFTY",
    platform: "TradingView Demo Account",
    doNot: "No trading without full top-down analysis completed first. Never skip Weekly or Daily.",
    quiz: ["What is the purpose of the Weekly analysis?","Which timeframe gives you trade direction?","Which timeframe gives you the precise entry trigger?"]
  },
  {
    phase: 8, title: "Risk Management & Real Money",
    duration: "Week 15–16 (After 60+ Demo Days Profitable)",
    icon: "💰", color: "#00d4aa",
    strategy: "Breaker + FVG + OTF",
    goal: "Go live with iron-clad risk rules. Protect capital first.",
    topics: [
      { name: "Position sizing formula", detail: "Lots = (Account × 1.5%) ÷ (SL pips × pip value × 100)" },
      { name: "Session trade limits", detail: "Max 1 trade per session. 1 loss = stop. 2 wins = stop." },
      { name: "Drawdown protocol", detail: "-10% account = halve position size until recovered" },
      { name: "The 9-condition checklist", detail: "If 1 condition missing = NO TRADE. No exceptions." },
      { name: "Psychology and discipline", detail: "Trade management after entry = do nothing" }
    ],
    dailyTask: "Use the Signal Checker in this app before EVERY trade. Log every trade in Portfolio Tracker. Review weekly statistics. Reduce size after losing week. Never widen stop loss.",
    pair: "EURUSD only to start (30 days), then add GBPUSD",
    platform: "Real broker — 0.01 micro lots ONLY",
    doNot: "NEVER trade without completing the 9-condition checklist. NEVER widen a stop loss. NEVER add to a losing trade.",
    quiz: ["What do you do after 1 losing trade in a session?","What is the maximum risk per trade?","If the 4H CHoCH appears during an OTF setup, what do you do?"]
  }
];
