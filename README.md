# 🎓 Trading Academy Pro

**SMC-Based Trading App — Forex | Crypto | Indian Markets**
Free. 24/7. Accessible from anywhere in the world.

---

## 📁 FOLDER STRUCTURE

```
trading-academy/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── TopBar.jsx
│   │   └── TradingViewChart.jsx
│   ├── data/
│   │   └── markets.js
│   ├── hooks/
│   │   ├── usePrices.js
│   │   ├── useNews.js
│   │   └── usePortfolio.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Markets.jsx
│   │   ├── SignalChecker.jsx
│   │   ├── LearningPath.jsx
│   │   ├── Portfolio.jsx
│   │   ├── News.jsx
│   │   ├── Calculator.jsx
│   │   ├── Strategies.jsx
│   │   ├── Rules.jsx
│   │   └── Backtest.jsx
│   ├── App.jsx
│   ├── index.js
│   └── index.css
└── package.json
```

---

## 🚀 SETUP INSTRUCTIONS (Step by Step)

### STEP 1 — Install Node.js (if not installed)
1. Go to: https://nodejs.org
2. Download the LTS version (green button)
3. Install it (click Next → Next → Install)
4. Open terminal/command prompt and type: `node --version`
5. You should see something like: v18.17.0

### STEP 2 — Create the Project
Open terminal in any folder you want, then run:
```bash
npx create-react-app trading-academy
cd trading-academy
```

### STEP 3 — Install Dependencies
```bash
npm install react-router-dom recharts lucide-react
```

### STEP 4 — Replace Files
Delete everything inside the `src/` folder, then paste all the provided files:
- Copy `src/index.js` → into `src/index.js`
- Copy `src/index.css` → into `src/index.css`
- Copy `src/App.jsx` → into `src/App.jsx`
- Create folder `src/components/` and paste the 3 component files
- Create folder `src/data/` and paste `markets.js`
- Create folder `src/hooks/` and paste the 3 hook files
- Create folder `src/pages/` and paste all 10 page files

Also replace `public/index.html` with the provided version.

### STEP 5 — Run Locally
```bash
npm start
```
App opens at: http://localhost:3000

---

## 🌐 DEPLOY TO VERCEL (Free — 24/7 Global Access)

### Option A — Direct Upload (Easiest)
1. Go to: https://vercel.com
2. Sign up free (use GitHub or Google)
3. Click "New Project" → "Import Git Repository"
4. OR: Click "Deploy" → drag and drop your project folder
5. Vercel auto-detects React and deploys
6. Your app is live at: yourappname.vercel.app

### Option B — Via GitHub (Recommended for Updates)
1. Create free account at: https://github.com
2. Create new repository named `trading-academy`
3. Upload your project files to GitHub
4. Go to: https://vercel.com
5. Connect GitHub → select your repository
6. Click Deploy
7. App is live in 2 minutes at: yourappname.vercel.app

**Every time you update a file and push to GitHub → Vercel auto-redeploys.**

---

## ✅ FEATURES INCLUDED

| Feature | Status | Source |
|---------|--------|--------|
| Live Crypto Prices | ✅ Real-time | Binance WebSocket (free) |
| Live Forex Prices | ✅ ~1min delay | Open Exchange Rates (free) |
| Live Gold Price | ✅ ~1min delay | metals.live (free) |
| Indian Market | ✅ Chart live | TradingView widget (free) |
| TradingView Charts | ✅ All pairs | TradingView embed (free) |
| Live News | ✅ 15min refresh | RSS feeds (free) |
| Signal Checker | ✅ All 9 conditions | Built-in logic (free) |
| Position Calculator | ✅ Full formula | Built-in (free) |
| Portfolio Tracker | ✅ Local storage | Browser (free) |
| Learning Path | ✅ 8 phases | Built-in (free) |
| 5 Strategies | ✅ Full details | Built-in (free) |
| Rules Page | ✅ Complete | Built-in (free) |
| Backtester | ✅ Simulation | Built-in (free) |
| Kill Zone Timer | ✅ IST based | Built-in (free) |
| 24/7 Global Access | ✅ | Vercel hosting (free) |

---

## 📊 MARKETS COVERED

**Forex (7 pairs):** EURUSD, GBPUSD, USDJPY, GBPJPY, USDCAD, NZDUSD, XAUUSD

**Crypto (5):** BTC, ETH, SOL, XRP, BNB

**Indian (3):** NIFTY 50, SENSEX, BANK NIFTY

---

## ⚠️ DISCLAIMER

This app is for educational purposes only. Not financial advice.
Forex and crypto trading involves substantial risk of loss.
Never trade with money you cannot afford to lose.
Always practice on demo for 60+ days before real money.

---

## 📱 ACCESS FROM ANYWHERE

Once deployed on Vercel:
- Open on phone: yourappname.vercel.app
- Open on laptop: yourappname.vercel.app
- Share with anyone: same URL
- Works on any network in any country
- No installation needed on other devices — just open the URL
