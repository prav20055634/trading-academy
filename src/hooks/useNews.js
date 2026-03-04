import { useState, useEffect, useCallback } from "react";

const FEEDS = [
  { name: "CoinDesk", tag: "Crypto", color: "#f7931a", url: "https://api.allorigins.win/get?url=" + encodeURIComponent("https://feeds.feedburner.com/CoinDesk"), fallbackUrl: "https://api.allorigins.win/get?url=" + encodeURIComponent("https://coindesk.com/feed") },
  { name: "MoneyControl", tag: "India", color: "#ff6b35", url: "https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.moneycontrol.com/rss/latestnews.xml"), fallbackUrl: null },
  { name: "LiveMint", tag: "India", color: "#e91e63", url: "https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.livemint.com/rss/markets"), fallbackUrl: null },
  { name: "FX Empire", tag: "Forex", color: "#00d4aa", url: "https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.fxempire.com/api/v1/en/articles?category=analysis&limit=10"), fallbackUrl: null },
];

function parseRSS(xmlString, sourceName, tag, color) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "text/xml");
    const items = doc.querySelectorAll("item");
    const results = [];
    items.forEach(item => {
      const title = item.querySelector("title")?.textContent?.trim();
      const link = item.querySelector("link")?.textContent?.trim();
      const pubDate = item.querySelector("pubDate")?.textContent;
      if (!title || title.length < 5) return;
      results.push({ title, link: link || "#", date: pubDate ? new Date(pubDate) : new Date(), source: sourceName, tag, color });
    });
    return results;
  } catch (_) { return []; }
}

const FALLBACK_NEWS = [
  { title: "Bitcoin holds above key support as market eyes next resistance level", link: "https://coindesk.com", date: new Date(), source: "CoinDesk", tag: "Crypto", color: "#f7931a" },
  { title: "Ethereum ETF flows continue as institutional demand grows", link: "https://coindesk.com", date: new Date(), source: "CoinDesk", tag: "Crypto", color: "#f7931a" },
  { title: "EURUSD faces key resistance at 1.0900 ahead of ECB decision", link: "https://fxstreet.com", date: new Date(), source: "FX Street", tag: "Forex", color: "#00d4aa" },
  { title: "US Dollar Index DXY retreats after mixed employment data", link: "https://fxstreet.com", date: new Date(), source: "FX Street", tag: "Forex", color: "#00d4aa" },
  { title: "GBPUSD traders eye Bank of England minutes for rate clues", link: "https://fxstreet.com", date: new Date(), source: "FX Street", tag: "Forex", color: "#00d4aa" },
  { title: "Nifty 50 rallies past 23,000 on strong FII buying", link: "https://moneycontrol.com", date: new Date(), source: "MoneyControl", tag: "India", color: "#ff6b35" },
  { title: "Bank Nifty outperforms as RBI keeps rates steady", link: "https://moneycontrol.com", date: new Date(), source: "MoneyControl", tag: "India", color: "#ff6b35" },
  { title: "Sensex gains 400 points; auto and banking stocks lead rally", link: "https://livemint.com", date: new Date(), source: "LiveMint", tag: "India", color: "#e91e63" },
  { title: "Solana network activity surges to all-time high", link: "https://coindesk.com", date: new Date(), source: "CoinDesk", tag: "Crypto", color: "#f7931a" },
  { title: "XRP legal clarity boosts institutional interest", link: "https://coindesk.com", date: new Date(), source: "CoinDesk", tag: "Crypto", color: "#f7931a" },
  { title: "Gold XAUUSD approaches 2400 as safe haven demand rises", link: "https://fxstreet.com", date: new Date(), source: "FX Street", tag: "Forex", color: "#00d4aa" },
  { title: "USDJPY holds above 150.00 despite BOJ intervention warnings", link: "https://fxstreet.com", date: new Date(), source: "FX Street", tag: "Forex", color: "#00d4aa" },
  { title: "India GDP growth forecast revised upward by IMF", link: "https://livemint.com", date: new Date(), source: "LiveMint", tag: "India", color: "#e91e63" },
  { title: "BNB consolidates ahead of Binance quarterly burn event", link: "https://coindesk.com", date: new Date(), source: "CoinDesk", tag: "Crypto", color: "#f7931a" },
  { title: "NFP report due Friday — traders reduce risk exposure", link: "https://fxstreet.com", date: new Date(), source: "FX Street", tag: "Forex", color: "#00d4aa" },
];

export function useNews() {
  const [news, setNews] = useState(FALLBACK_NEWS);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [usingFallback, setUsingFallback] = useState(true);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    const allNews = [];
    let fetchedAny = false;
    for (const feed of FEEDS) {
      try {
        const res = await fetch(feed.url);
        if (!res.ok) continue;
        const data = await res.json();
        const contents = data.contents || data.data || "";
        if (!contents || contents.length < 100) continue;
        const articles = parseRSS(contents, feed.name, feed.tag, feed.color);
        if (articles.length > 0) { allNews.push(...articles); fetchedAny = true; }
      } catch (_) {}
    }
    if (fetchedAny && allNews.length > 3) {
      allNews.sort((a, b) => b.date - a.date);
      setNews(allNews.slice(0, 40));
      setUsingFallback(false);
    } else {
      setNews([...FALLBACK_NEWS].sort(() => Math.random() - 0.5));
      setUsingFallback(true);
    }
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNews();
    const t = setInterval(fetchNews, 15 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchNews]);

  return { news, loading, lastUpdate, refetch: fetchNews, usingFallback };
}

export function useEconomicCalendar() {
  const [events] = useState([
    { time: "1:30 PM IST", currency: "USD", impact: "HIGH", event: "Non-Farm Payrolls (NFP)", forecast: "185K", previous: "175K" },
    { time: "3:30 PM IST", currency: "EUR", impact: "HIGH", event: "ECB Interest Rate Decision", forecast: "4.25%", previous: "4.25%" },
    { time: "6:30 PM IST", currency: "USD", impact: "MEDIUM", event: "ISM Manufacturing PMI", forecast: "51.2", previous: "50.9" },
    { time: "7:00 PM IST", currency: "GBP", impact: "HIGH", event: "BOE Rate Statement", forecast: "5.25%", previous: "5.25%" },
    { time: "8:30 PM IST", currency: "USD", impact: "HIGH", event: "FOMC Meeting Minutes", forecast: "—", previous: "—" },
    { time: "11:00 AM IST", currency: "INR", impact: "HIGH", event: "RBI Policy Decision", forecast: "6.50%", previous: "6.50%" },
  ]);
  return events;
}