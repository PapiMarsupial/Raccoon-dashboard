import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = "https://spy-alert-server-production.up.railway.app";

// ─── BREAKPOINTS ─────────────────────────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    const w = window.innerWidth;
    return w < 600 ? "phone" : w < 1100 ? "tablet" : "desktop";
  });
  useEffect(() => {
    const fn = () => {
      const w = window.innerWidth;
      setBp(w < 600 ? "phone" : w < 1100 ? "tablet" : "desktop");
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return bp;
}

// ─── DATA HOOKS ───────────────────────────────────────────────────────────────
function useQuotes(symbols) {
  const [quotes, setQuotes] = useState({});
  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/quotes?symbols=${symbols.join(",")}`);
      const d = await r.json();
      setQuotes(d);
    } catch {}
  }, [symbols.join(",")]);
  useEffect(() => {
    fetch_();
    const iv = setInterval(fetch_, 30000);
    return () => clearInterval(iv);
  }, [fetch_]);
  return { quotes };
}


function useCandles(symbol = "SPY") {
  const [candles, setCandles] = useState([]);
  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/candles?symbol=${symbol}`);
      const d = await r.json();
      setCandles(d);
    } catch {}
  }, [symbol]);
  useEffect(() => {
    fetch_();
    const iv = setInterval(fetch_, 60000);
    return () => clearInterval(iv);
  }, [fetch_]);
  return candles;
}


function useApiAlerts() {
  const [data, setData] = useState({ spy_alerts: [], screener_alerts: [], count: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/alerts`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json()); setError(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { fetch_(); const iv = setInterval(fetch_, 30000); return () => clearInterval(iv); }, [fetch_]);
  return { data, loading, error };
}

function useScorecard() {
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try { const r = await fetch(`${API_BASE}/scorecard`); setScorecard(await r.json()); } catch {}
      setLoading(false);
    })();
  }, []);
  return { scorecard, loading };
}

function useNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY,QQQ,NVDA,TSLA,AMD&region=US&lang=en-US"));
        const d = await r.json();
        const xml = new DOMParser().parseFromString(d.contents, "text/xml");
        setNews(Array.from(xml.querySelectorAll("item")).slice(0, 14).map(item => ({
          title: item.querySelector("title")?.textContent,
          link: item.querySelector("link")?.textContent,
          date: item.querySelector("pubDate")?.textContent,
          source: "Yahoo Finance",
        })));
      } catch { setNews(MOCK_NEWS); }
      setLoading(false);
    })();
  }, []);
  return { news, loading };
}

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const MOCK_NEWS = [
  { title: "Fed officials signal patience on rate cuts amid inflation uncertainty", date: new Date().toISOString(), source: "Reuters" },
  { title: "NVIDIA surges on strong data center demand ahead of earnings", date: new Date().toISOString(), source: "Bloomberg" },
  { title: "S&P 500 hovers near highs as mega-cap tech leads gains", date: new Date().toISOString(), source: "CNBC" },
  { title: "Options market pricing elevated volatility into CPI week", date: new Date().toISOString(), source: "MarketWatch" },
  { title: "Treasury yields pull back as recession fears resurface", date: new Date().toISOString(), source: "FT" },
  { title: "Tesla rallies after CEO reaffirms robotaxi timeline", date: new Date().toISOString(), source: "Yahoo Finance" },
];

const ECON_EVENTS = [
  { date: "Today",    time: "08:30", event: "Initial Jobless Claims",      importance: "HIGH", forecast: "215K",  prev: "212K",  actual: "218K" },
  { date: "Today",    time: "10:00", event: "ISM Manufacturing PMI",       importance: "HIGH", forecast: "48.5",  prev: "48.7",  actual: null   },
  { date: "Tomorrow", time: "08:30", event: "Core PCE Price Index MoM",    importance: "HIGH", forecast: "0.3%",  prev: "0.4%",  actual: null   },
  { date: "Tomorrow", time: "10:00", event: "Consumer Sentiment (Prelim)", importance: "MED",  forecast: "77.5",  prev: "76.9",  actual: null   },
  { date: "Fri",      time: "08:30", event: "Nonfarm Payrolls",            importance: "HIGH", forecast: "185K",  prev: "228K",  actual: null   },
  { date: "Fri",      time: "08:30", event: "Unemployment Rate",           importance: "HIGH", forecast: "4.1%",  prev: "4.0%",  actual: null   },
];

const EARNINGS = [
  { ticker: "AAPL",  name: "Apple",     date: "Today AMC",    eps: "$1.62", rev: "$94.5B",  imp: "HIGH" },
  { ticker: "AMZN",  name: "Amazon",    date: "Today AMC",    eps: "$1.36", rev: "$142.6B", imp: "HIGH" },
  { ticker: "META",  name: "Meta",      date: "Tomorrow BMO", eps: "$5.25", rev: "$40.2B",  imp: "HIGH" },
  { ticker: "MSFT",  name: "Microsoft", date: "Tomorrow AMC", eps: "$3.22", rev: "$68.4B",  imp: "HIGH" },
  { ticker: "GOOGL", name: "Alphabet",  date: "Thu AMC",      eps: "$2.01", rev: "$89.3B",  imp: "MED"  },
  { ticker: "AMD",   name: "AMD",       date: "Thu AMC",      eps: "$0.68", rev: "$7.1B",   imp: "MED"  },
];

const SIGNAL_TYPES = [
  { type: "ORB Break",     wins: 8,  losses: 2, wr: 80 },
  { type: "VWAP Bounce",   wins: 12, losses: 5, wr: 71 },
  { type: "EMA Signal",    wins: 9,  losses: 3, wr: 75 },
  { type: "PDH/PDL Break", wins: 7,  losses: 4, wr: 64 },
  { type: "Vol Surge",     wins: 11, losses: 6, wr: 65 },
  { type: "RSI Divergence",wins: 6,  losses: 4, wr: 60 },
];

const WATCHLIST = ["SPY", "QQQ", "^VIX", "^IXIC", "^DJI", "NVDA", "TSLA", "AMD"];

const TABS = [
  { id: "overview",  label: "Overview",     icon: "⬡" },
  { id: "premarket", label: "Pre-Market",   icon: "🌅" },
  { id: "levels",    label: "Key Levels",   icon: "🎯" },
  { id: "news",      label: "News",         icon: "📰" },
  { id: "spy",       label: "SPY Alerts",   icon: "◈" },
  { id: "screener",  label: "Screener",     icon: "◉" },
  { id: "scorecard", label: "Scorecard",    icon: "▣" },
];

// ─── CHART ────────────────────────────────────────────────────────────────────
function CandleChart({ candles, height = 180 }) {
  if (!candles.length) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.12)", fontSize: 11 }}>
      Loading chart…
    </div>
  );
  const W = 520, H = height, PAD = { t: 10, b: 24, l: 44, r: 8 };
  const slice = candles.slice(-50);
  const prices = slice.flatMap(c => [c.h, c.l]).filter(Boolean);
  const minP = Math.min(...prices), maxP = Math.max(...prices), range = maxP - minP || 1;
  const cw = (W - PAD.l - PAD.r) / slice.length;
  const py = p => PAD.t + ((maxP - p) / range) * (H - PAD.t - PAD.b);
  const vwap = slice.reduce((acc, c, i) => {
    const tp = ((c.h || 0) + (c.l || 0) + (c.c || 0)) / 3;
    return [...acc, i === 0 ? tp : (acc[i - 1] * i + tp) / (i + 1)];
  }, []);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {[0, 0.33, 0.66, 1].map((f, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={PAD.t + f * (H - PAD.t - PAD.b)} x2={W - PAD.r} y2={PAD.t + f * (H - PAD.t - PAD.b)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={PAD.l - 3} y={PAD.t + f * (H - PAD.t - PAD.b) + 4} fill="rgba(255,255,255,0.22)" fontSize="8" textAnchor="end">{(maxP - f * range).toFixed(1)}</text>
        </g>
      ))}
      {slice.map((c, i) => {
        if (!c.o || !c.c) return null;
        const x = PAD.l + i * cw + cw / 2, bull = c.c >= c.o, col = bull ? "#22d3a0" : "#f43f5e";
        const top = py(Math.max(c.o, c.c)), bh = Math.max(1.5, Math.abs(py(c.o) - py(c.c)));
        return (
          <g key={i}>
            <line x1={x} y1={py(c.h)} x2={x} y2={py(c.l)} stroke={col} strokeWidth="0.8" opacity="0.65" />
            <rect x={x - cw * 0.38} y={top} width={cw * 0.76} height={bh} fill={bull ? col : "none"} stroke={col} strokeWidth="0.8" opacity="0.9" />
          </g>
        );
      })}
      <polyline points={vwap.map((v, i) => `${PAD.l + i * cw + cw / 2},${py(v)}`).join(" ")} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.85" />
      {slice.filter((_, i) => i % Math.ceil(slice.length / 7) === 0).map((c) => {
        const idx = slice.indexOf(c);
        return <text key={idx} x={PAD.l + idx * cw + cw / 2} y={H - 3} fill="rgba(255,255,255,0.2)" fontSize="7" textAnchor="middle">{c.t}</text>;
      })}
      <text x={W - PAD.r - 2} y={py(vwap[vwap.length - 1]) - 3} fill="#f59e0b" fontSize="8" textAnchor="end">VWAP</text>
    </svg>
  );
}

// ─── KEY LEVELS ───────────────────────────────────────────────────────────────
function KeyLevels({ quotes, bp }) {
  const spy = quotes["SPY"], qqq = quotes["QQQ"], vix = quotes["^VIX"];
  const mk = (q, sym) => {
    if (!q) return null;
    const p = parseFloat(q.price), o = parseFloat(q.open), h = parseFloat(q.high), l = parseFloat(q.low), prev = parseFloat(q.prev);
    return { sym, price: p, open: o, high: h, low: l, prev, vwap: parseFloat(((h + l + p) / 3).toFixed(2)) };
  };
  const levels = [mk(spy, "SPY"), mk(qqq, "QQQ")].filter(Boolean);
  if (!levels.length) return <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 11, padding: 16 }}>Loading key levels…</div>;

  const cols = bp === "phone" ? "1fr" : "1fr 1fr";

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12 }}>
        {levels.map((lv, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.025)", borderRadius: 8, padding: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "baseline" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{lv.sym}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: parseFloat(quotes[lv.sym]?.changePct) >= 0 ? "#22d3a0" : "#f43f5e" }}>${lv.price}</span>
            </div>
            {[
              { label: "Day High",    val: lv.high,  color: "#22d3a0",               badge: "R" },
              { label: "VWAP ~",     val: lv.vwap,  color: "#f59e0b",               badge: "K" },
              { label: "Open",       val: lv.open,  color: "rgba(255,255,255,0.45)", badge: "—" },
              { label: "Day Low",    val: lv.low,   color: "#f43f5e",               badge: "S" },
              { label: "Prev Close", val: lv.prev,  color: "rgba(255,255,255,0.3)",  badge: "—" },
            ].map((row, j) => {
              const pct = (((row.val - lv.price) / lv.price) * 100).toFixed(2);
              return (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, background: `${row.color}22`, border: `1px solid ${row.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: row.color, flexShrink: 0 }}>{row.badge}</div>
                  <div style={{ flex: 1, fontSize: 10, color: "rgba(255,255,255,0.38)" }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: row.color, fontWeight: 600 }}>${row.val}</div>
                  <div style={{ fontSize: 9, color: row.val > lv.price ? "#22d3a0" : "#f43f5e", minWidth: 40, textAlign: "right" }}>{row.val > lv.price ? "+" : ""}{pct}%</div>
                </div>
              );
            })}
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#f43f5e,#f59e0b,#22d3a0)", width: `${Math.min(100, Math.max(0, ((lv.price - lv.low) / (lv.high - lv.low)) * 100))}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 7, color: "rgba(255,255,255,0.18)" }}>
                <span>L ${lv.low}</span><span>H ${lv.high}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {vix && (
        <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 8, padding: "11px 14px", border: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 20, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", letterSpacing: "0.15em" }}>VIX</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: parseFloat(vix.price) > 20 ? "#f43f5e" : parseFloat(vix.price) > 15 ? "#f59e0b" : "#22d3a0" }}>{vix.price}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
              <div style={{ height: "100%", borderRadius: 3, width: `${Math.min(100, (parseFloat(vix.price) / 50) * 100)}%`, background: "linear-gradient(90deg,#22d3a0,#f59e0b,#f43f5e)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 7, color: "rgba(255,255,255,0.18)" }}>
              <span>LOW ≤12</span><span>NORMAL 12–20</span><span>ELEVATED ≥20</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)" }}>DAY CHG</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: parseFloat(vix.changePct) > 0 ? "#f43f5e" : "#22d3a0" }}>{parseFloat(vix.changePct) > 0 ? "+" : ""}{vix.changePct}%</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PRE-MARKET BRIEF ─────────────────────────────────────────────────────────
function PremarketBrief({ quotes }) {
  const [brief, setBrief] = useState(""), [loading, setLoading] = useState(false), [generated, setGenerated] = useState(false);
  const generate = async () => {
    setLoading(true);
    const spy = quotes["SPY"], qqq = quotes["QQQ"], vix = quotes["^VIX"];
    const ctx = `SPY: $${spy?.price} (${spy?.changePct}%) H:${spy?.high} L:${spy?.low}\nQQQ: $${qqq?.price} (${qqq?.changePct}%)\nVIX: ${vix?.price} (${vix?.changePct}%)\nEarnings: AAPL AMC, AMZN AMC\nEcon: Jobless Claims 8:30, ISM PMI 10:00`;
    try {
      const resp = await fetch(`${API_BASE}/brief`);
      const d = await resp.json();
      setBrief(d?.brief || d?.error || "Error generating brief.");

    } catch { setBrief("API error — check console."); }
    setLoading(false); setGenerated(true);
  };
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#fff" }}>🌅 PRE-MARKET BRIEF</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>AI · Claude</div>
        </div>
        <button onClick={generate} disabled={loading} style={{ background: loading ? "rgba(255,255,255,0.04)" : "rgba(34,211,160,0.1)", border: `1px solid ${loading ? "rgba(255,255,255,0.08)" : "rgba(34,211,160,0.3)"}`, color: loading ? "rgba(255,255,255,0.25)" : "#22d3a0", padding: "6px 12px", borderRadius: 6, cursor: loading ? "wait" : "pointer", fontSize: 10, fontFamily: "inherit", letterSpacing: "0.06em" }}>
          {loading ? "GENERATING…" : generated ? "↺ REFRESH" : "GENERATE"}
        </button>
      </div>
      {brief
        ? <div style={{ fontSize: 11, lineHeight: 1.8, color: "rgba(255,255,255,0.72)", whiteSpace: "pre-wrap", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>{brief}</div>
        : <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.13)", fontSize: 11 }}>Tap Generate for today's AI pre-market summary</div>
      }
    </div>
  );
}

// ─── NEWS PANEL ───────────────────────────────────────────────────────────────
function NewsPanel({ news, loading }) {
  const ago = s => { try { const m = (Date.now() - new Date(s)) / 60000; return m < 60 ? `${~~m}m ago` : m < 1440 ? `${~~(m / 60)}h ago` : `${~~(m / 1440)}d ago`; } catch { return ""; } };
  if (loading) return <>{Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: 42, background: "rgba(255,255,255,0.03)", borderRadius: 6, marginBottom: 4 }} />)}</>;
  return <>{news.map((item, i) => (
    <a key={i} href={item.link || "#"} target="_blank" rel="noopener noreferrer"
      style={{ display: "block", padding: "9px 11px", borderRadius: 6, textDecoration: "none", background: "rgba(255,255,255,0.02)", borderLeft: "2px solid rgba(255,255,255,0.08)", marginBottom: 4, transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.045)"; e.currentTarget.style.borderLeftColor = "#22d3a0"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderLeftColor = "rgba(255,255,255,0.08)"; }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.78)", lineHeight: 1.4 }}>{item.title}</div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", marginTop: 3 }}>{item.source} · {ago(item.date)}</div>
    </a>
  ))}</>;
}

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function SH({ title, sub }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: "#fff" }}>{title}</div>{sub && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.26)", marginTop: 3 }}>{sub}</div>}</div>;
}
function Chip({ label, color }) {
  return <div style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 4, textAlign: "center", background: `${color}14`, color, border: `1px solid ${color}42`, whiteSpace: "nowrap" }}>{label}</div>;
}
function Stat({ label, val, valColor = "#fff" }) {
  return <div style={{ textAlign: "center" }}><div style={{ fontSize: 8, color: "rgba(255,255,255,0.24)", marginBottom: 2 }}>{label}</div><div style={{ fontSize: 11, color: valColor }}>{val}</div></div>;
}
function StatusBadge({ status }) {
  const cfg = { ACTIVE: { bg: "rgba(34,211,160,0.08)", border: "rgba(34,211,160,0.22)", color: "#22d3a0" }, TRIGGERED: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.22)", color: "#f59e0b" }, WATCHING: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.38)" } }[status] || {};
  return <div style={{ textAlign: "center", padding: "3px 7px", borderRadius: 6, background: cfg.bg, border: `1px solid ${cfg.border}` }}><div style={{ fontSize: 9, fontWeight: 700, color: cfg.color }}>{status || "—"}</div></div>;
}
function Card({ children, style = {} }) {
  return <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16, ...style }}>{children}</div>;
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function RaccoonOptions() {
  const bp = useBreakpoint();
  const [tab, setTab] = useState("overview");
  const [newsSubTab, setNST] = useState("news");
  const [scorePeriod, setSP] = useState("today");
  const [now, setNow] = useState(new Date());
  const [pulseIdx, setPulse] = useState(null);
  const tickRef = useRef(0);

  const { quotes } = useQuotes(WATCHLIST);
  const candles = useCandles("SPY");
  const { data: alertData, loading: aLoading, error: aError } = useApiAlerts();
  const { scorecard, loading: sLoading } = useScorecard();
  const { news, loading: nLoading } = useNews();

  const spy = quotes["SPY"], qqq = quotes["QQQ"], vix = quotes["^VIX"];
  const spyAlerts = alertData.spy_alerts || [];
  const screenAlerts = alertData.screener_alerts || [];
  const sc = scorecard?.[scorePeriod] || { wins: 0, losses: 0, total: 0, win_rate: 0, avg_win: 0, avg_loss: 0 };

  useEffect(() => {
    const iv = setInterval(() => {
      setNow(new Date());
      tickRef.current++;
      if (tickRef.current % 10 === 0) setPulse(Math.floor(Math.random() * 5));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const isOpen = () => {
    const h = now.getHours(), m = now.getMinutes(), day = now.getDay();
    if (!day || day === 6) return false;
    return h * 60 + m >= 570 && h * 60 + m < 960;
  };

  // Responsive layout values
  const isPhone = bp === "phone";
  const isTablet = bp === "tablet";
  const pad = isPhone ? "14px 14px" : isTablet ? "16px 20px" : "14px 28px";
  const mainPad = isPhone ? "14px" : isTablet ? "18px 20px" : "20px 28px";
  const statCols = isPhone ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(5,1fr)";
  const chartBriefCols = isPhone ? "1fr" : "1fr 340px";
  const newsCols = isPhone ? "1fr" : "1fr 1fr";

  // Phone bottom tab bar (5 most important tabs)
  const phoneTabs = TABS.filter(t => ["overview","spy","screener","news","scorecard"].includes(t.id));

  return (
    <div style={{ minHeight: "100vh", background: "#07090f", fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", color: "#b8cce0", paddingBottom: isPhone ? 64 : 0 }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 45% at 15% 0%,rgba(34,211,160,0.03) 0%,transparent 55%),radial-gradient(ellipse 50% 35% at 85% 100%,rgba(245,158,11,0.025) 0%,transparent 50%)" }} />

      {/* ── HEADER ── */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: pad, borderBottom: "1px solid rgba(255,255,255,0.055)", background: "rgba(7,9,15,0.97)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: isPhone ? 22 : 26, lineHeight: 1 }}>🦝</div>
          {!isPhone && (
            <div>
              <div style={{ fontSize: isTablet ? 12 : 14, fontWeight: 700, letterSpacing: "0.08em", color: "#fff" }}>RACCOON OPTIONS</div>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,0.24)", letterSpacing: "0.18em", marginTop: 1 }}>SIGNAL COMMAND CENTER</div>
            </div>
          )}
          {isPhone && <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.06em" }}>RACCOON OPTIONS</div>}
        </div>

                 {/* Ticker strip */}
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {[{ sym: "SPY", q: spy }, { sym: "QQQ", q: qqq }, { sym: "VIX", q: vix }].map(({ sym, q }) => (


            <div key={sym} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,0.26)", letterSpacing: "0.12em" }}>{sym}</div>
              <div style={{ fontSize: isPhone ? 12 : 13, fontWeight: 700, color: "#fff" }}>{q?.price || "—"}</div>
              <div style={{ fontSize: 9, color: parseFloat(q?.changePct) >= 0 ? "#22d3a0" : "#f43f5e" }}>{q ? `${parseFloat(q.changePct) >= 0 ? "+" : ""}${q.changePct}%` : "—"}</div>
            </div>
          ))}
        </div>

        {/* Clock + market status */}
        <div style={{ display: "flex", alignItems: "center", gap: isPhone ? 8 : 12 }}>
          {!isPhone && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,0.24)", marginTop: 1 }}>{now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: isPhone ? "3px 7px" : "4px 10px", border: `1px solid ${isOpen() ? "rgba(34,211,160,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 4, fontSize: 8, color: isOpen() ? "#22d3a0" : "rgba(255,255,255,0.25)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: isOpen() ? "#22d3a0" : "rgba(255,255,255,0.15)", ...(isOpen() ? { animation: "pulse 2s infinite" } : {}) }} />
            {isPhone ? (isOpen() ? "OPEN" : "CLOSED") : (isOpen() ? "MARKET OPEN" : "MARKET CLOSED")}
          </div>
        </div>
      </header>

      {/* ── DESKTOP/TABLET TAB NAV ── */}
      {!isPhone && (
        <nav style={{ display: "flex", padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(7,9,15,0.92)", overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: isTablet ? "10px 14px" : "11px 18px", fontSize: isTablet ? 9 : 10, letterSpacing: "0.08em", whiteSpace: "nowrap", color: tab === t.id ? "#22d3a0" : "rgba(255,255,255,0.28)", borderBottom: `2px solid ${tab === t.id ? "#22d3a0" : "transparent"}`, transition: "all 0.15s", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              {t.icon} {t.label.toUpperCase()}
            </button>
          ))}
        </nav>
      )}

      {/* ── API ERROR BANNER ── */}
      {aError && (
        <div style={{ background: "rgba(244,63,94,0.08)", borderBottom: "1px solid rgba(244,63,94,0.2)", padding: "7px 20px", fontSize: 10, color: "#f43f5e" }}>
          ⚠️ Cannot reach Railway API — update API_BASE in the code with your Railway URL.
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main style={{ padding: mainPad, maxWidth: 1440, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={{ display: "grid", gap: 14 }}>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: statCols, gap: 10 }}>
              {[
                { label: "SPY Alerts", value: aLoading ? "…" : alertData.count?.spy || 0, sub: "today · Railway", color: "#60a5fa" },
                { label: "Screener Hits", value: aLoading ? "…" : alertData.count?.screener || 0, sub: "today · Railway", color: "#f59e0b" },
                { label: "Win Rate", value: sc.win_rate != null ? `${sc.win_rate}%` : "—", sub: `${sc.wins}W / ${sc.losses}L`, color: "#22d3a0" },
                { label: "SPY", value: `$${spy?.price || "—"}`, sub: `${parseFloat(spy?.changePct) >= 0 ? "+" : ""}${spy?.changePct || 0}%`, color: parseFloat(spy?.changePct) >= 0 ? "#22d3a0" : "#f43f5e" },
                { label: "VIX", value: vix?.price || "—", sub: `${parseFloat(vix?.changePct) > 0 ? "+" : ""}${vix?.changePct || 0}%`, color: parseFloat(vix?.price) > 20 ? "#f43f5e" : parseFloat(vix?.price) > 15 ? "#f59e0b" : "#22d3a0" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: isPhone ? "12px 14px" : "14px 16px", borderTop: `2px solid ${s.color}28` }}>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", letterSpacing: "0.12em", marginBottom: 6 }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontSize: isPhone ? 22 : 24, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", marginTop: 3 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Chart + Brief */}
            <div style={{ display: "grid", gridTemplateColumns: chartBriefCols, gap: 12 }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
                  <div><div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>SPY 5-MIN · {spy?.price || "—"}</div><div style={{ fontSize: 8, color: "rgba(255,255,255,0.24)", marginTop: 1 }}>Live · 60s refresh</div></div>
                  <div style={{ display: "flex", gap: 10, fontSize: 8, color: "rgba(255,255,255,0.32)" }}>
                    <span><span style={{ color: "#22d3a0" }}>█</span> Bull</span>
                    <span><span style={{ color: "#f43f5e" }}>█</span> Bear</span>
                    <span><span style={{ color: "#f59e0b" }}>╌</span> VWAP</span>
                  </div>
                </div>
                <CandleChart candles={candles} height={isPhone ? 150 : 180} />
              </Card>
              <PremarketBrief quotes={quotes} />
            </div>

            {/* Key Levels */}
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 12 }}>🎯 KEY LEVELS</div>
              <KeyLevels quotes={quotes} bp={bp} />
            </Card>

            {/* Earnings strip */}
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 12 }}>📅 UPCOMING EARNINGS</div>
              <div style={{ display: "grid", gridTemplateColumns: isPhone ? "repeat(3,1fr)" : "repeat(6,1fr)", gap: 8 }}>
                {EARNINGS.map((e, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${e.imp === "HIGH" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 7, padding: "9px 10px" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{e.ticker}</div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{e.date}</div>
                    <div style={{ fontSize: 9, color: "#f59e0b", marginTop: 3 }}>EPS {e.eps}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* PRE-MARKET */}
        {tab === "premarket" && (
          <div style={{ display: "grid", gap: 14, maxWidth: 860 }}>
            <SH title="🌅 PRE-MARKET BRIEF" sub="AI-generated morning intelligence" />
            <PremarketBrief quotes={quotes} />
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 12 }}>WATCHLIST</div>
              <div style={{ display: "grid", gridTemplateColumns: isPhone ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10 }}>
                {["SPY", "QQQ", "NVDA", "TSLA", "AMD", "META", "^VIX", "^DJI"].map(sym => {
                  const q = quotes[sym];
                  return (
                    <div key={sym} style={{ background: "rgba(255,255,255,0.025)", borderRadius: 8, padding: "11px 12px", border: `1px solid ${parseFloat(q?.changePct) > 0 ? "rgba(34,211,160,0.12)" : parseFloat(q?.changePct) < 0 ? "rgba(244,63,94,0.12)" : "rgba(255,255,255,0.06)"}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{sym.replace("^", "")}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 3 }}>{q?.price || "—"}</div>
                      <div style={{ fontSize: 10, color: parseFloat(q?.changePct) >= 0 ? "#22d3a0" : "#f43f5e", marginTop: 2 }}>{q ? `${parseFloat(q.changePct) >= 0 ? "+" : ""}${q.changePct}%` : "loading…"}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* KEY LEVELS */}
        {tab === "levels" && (
          <div style={{ display: "grid", gap: 14 }}>
            <SH title="🎯 KEY LEVELS" sub="Live SPY & QQQ · Yahoo Finance · 30s refresh" />
            <KeyLevels quotes={quotes} bp={bp} />
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 10 }}>SPY INTRADAY</div>
              <CandleChart candles={candles} height={isPhone ? 150 : 200} />
            </Card>
          </div>
        )}

        {/* NEWS & EVENTS */}
        {tab === "news" && (
          <div style={{ display: "grid", gap: 14 }}>
            <SH title="📰 NEWS & EVENTS" />
            <div style={{ display: "flex", gap: 7 }}>
              {["news", "calendar", "earnings"].map(st => (
                <button key={st} onClick={() => setNST(st)} style={{ background: newsSubTab === st ? "rgba(34,211,160,0.1)" : "transparent", border: `1px solid ${newsSubTab === st ? "rgba(34,211,160,0.35)" : "rgba(255,255,255,0.1)"}`, color: newsSubTab === st ? "#22d3a0" : "rgba(255,255,255,0.32)", padding: "5px 13px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "inherit", letterSpacing: "0.06em" }}>{st.toUpperCase()}</button>
              ))}
            </div>

            {newsSubTab === "news" && (
              <div style={{ display: "grid", gridTemplateColumns: newsCols, gap: 12 }}>
                <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginBottom: 8, letterSpacing: "0.1em" }}>LATEST</div><NewsPanel news={news.slice(0, 7)} loading={nLoading} /></div>
                {!isPhone && <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginBottom: 8, letterSpacing: "0.1em" }}>MORE</div><NewsPanel news={news.slice(7)} loading={nLoading} /></div>}
                {isPhone && <NewsPanel news={news.slice(7)} loading={nLoading} />}
              </div>
            )}

            {newsSubTab === "calendar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {ECON_EVENTS.map((ev, i) => {
                  const ic = ev.importance === "HIGH" ? "#f43f5e" : ev.importance === "MED" ? "#f59e0b" : "rgba(255,255,255,0.25)";
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: isPhone ? "40px 44px 1fr 56px" : "48px 50px 1fr 68px 68px 68px", gap: 8, alignItems: "center", padding: "9px 12px", background: "rgba(255,255,255,0.025)", borderRadius: 6, borderLeft: `2px solid ${ic}` }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)" }}>{ev.date}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{ev.time}</div>
                      <div style={{ fontSize: 11, color: "#fff" }}>{ev.event}</div>
                      {isPhone
                        ? <div style={{ textAlign: "right" }}><div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)" }}>FCST</div><div style={{ fontSize: 10, color: "#fff" }}>{ev.forecast}</div></div>
                        : <><Stat label="FCST" val={ev.forecast} /><Stat label="PREV" val={ev.prev} /><Stat label="ACT" val={ev.actual || "—"} valColor={ev.actual ? (parseFloat(ev.actual) > parseFloat(ev.forecast) ? "#22d3a0" : "#f43f5e") : "rgba(255,255,255,0.18)"} /></>
                      }
                    </div>
                  );
                })}
              </div>
            )}

            {newsSubTab === "earnings" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {EARNINGS.map((e, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: isPhone ? "52px 1fr 80px" : "56px 1fr 120px 76px 96px 54px", gap: 10, alignItems: "center", padding: "9px 12px", background: "rgba(255,255,255,0.025)", borderRadius: 6, borderLeft: `2px solid ${e.imp === "HIGH" ? "#f59e0b" : "rgba(255,255,255,0.12)"}` }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{e.ticker}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.42)" }}>{isPhone ? e.date : e.name}</div>
                    {isPhone ? <div style={{ fontSize: 9, color: "#f59e0b", textAlign: "right" }}>EPS {e.eps}</div> : <><div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{e.date}</div><Stat label="EPS" val={e.eps} /><Stat label="REV" val={e.rev} /><Chip label={e.imp} color={e.imp === "HIGH" ? "#f59e0b" : "rgba(255,255,255,0.3)"} /></>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SPY ALERTS */}
        {tab === "spy" && (
          <div style={{ display: "grid", gap: 12 }}>
            <SH title="◈ SPY 0DTE ALERTS" sub={`Live · Railway DB · ${spyAlerts.length} alerts today`} />
            {aLoading && <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Loading from Railway…</div>}
            {!aLoading && spyAlerts.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
                No SPY alerts today yet.<br />
                <span style={{ fontSize: 10, display: "block", marginTop: 8 }}>TradingView POSTs to {API_BASE}/webhook when a signal fires.</span>
              </div>
            )}
            {spyAlerts.map((a, i) => {
              const bull = a.direction === "BULL";
              const grade = a.score >= 75 ? "A" : a.score >= 50 ? "B" : a.score >= 25 ? "C" : "D";
              const gradeColor = a.score >= 75 ? "#22d3a0" : a.score >= 50 ? "#f59e0b" : "#f43f5e";
              const time = new Date(a.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              return isPhone ? (
                // Phone: stacked card
                <div key={a.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 8, padding: "12px 14px", borderLeft: `3px solid ${bull ? "#22d3a0" : "#f43f5e"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Chip label={bull ? "▲ BULL" : "▼ BEAR"} color={bull ? "#22d3a0" : "#f43f5e"} />
                      <span style={{ fontSize: 16, fontWeight: 800, color: gradeColor }}>{grade}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{time}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>${parseFloat(a.price).toFixed(2)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>{a.note}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>RSI {a.rsi ? parseFloat(a.rsi).toFixed(1) : "—"}</div>
                    <div style={{ padding: "3px 8px", borderRadius: 5, background: a.result === "WIN" ? "rgba(34,211,160,0.1)" : a.result === "LOSS" ? "rgba(244,63,94,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${a.result === "WIN" ? "rgba(34,211,160,0.3)" : a.result === "LOSS" ? "rgba(244,63,94,0.3)" : "rgba(255,255,255,0.1)"}` }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: a.result === "WIN" ? "#22d3a0" : a.result === "LOSS" ? "#f43f5e" : "rgba(255,255,255,0.35)" }}>{a.result}</span>
                      {a.pnl_pct && <span style={{ fontSize: 9, color: a.result === "WIN" ? "#22d3a0" : "#f43f5e", marginLeft: 5 }}>{a.pnl_pct > 0 ? "+" : ""}{a.pnl_pct}%</span>}
                    </div>
                  </div>
                </div>
              ) : (
                // Tablet/Desktop: row
                <div key={a.id} style={{ display: "grid", gridTemplateColumns: isTablet ? "52px 76px 52px 1fr 72px 72px 96px" : "56px 80px 58px 1fr 78px 78px 100px", gap: 10, padding: "12px 16px", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 8, borderLeft: `3px solid ${bull ? "#22d3a0" : "#f43f5e"}` }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{time}</div>
                  <Chip label={bull ? "▲ BULL" : "▼ BEAR"} color={bull ? "#22d3a0" : "#f43f5e"} />
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)" }}>GRADE</div><div style={{ fontSize: 16, fontWeight: 800, color: gradeColor }}>{grade}</div></div>
                  <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{a.note}</div>{a.signal_type === "base" && <div style={{ fontSize: 9, color: "#f59e0b", marginTop: 2 }}>WATCH</div>}</div>
                  <Stat label="PRICE" val={`$${parseFloat(a.price).toFixed(2)}`} />
                  <Stat label="RSI" val={a.rsi ? parseFloat(a.rsi).toFixed(1) : "—"} />
                  <div style={{ textAlign: "center", padding: "4px 8px", borderRadius: 6, background: a.result === "WIN" ? "rgba(34,211,160,0.08)" : a.result === "LOSS" ? "rgba(244,63,94,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${a.result === "WIN" ? "rgba(34,211,160,0.22)" : a.result === "LOSS" ? "rgba(244,63,94,0.22)" : "rgba(255,255,255,0.1)"}` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: a.result === "WIN" ? "#22d3a0" : a.result === "LOSS" ? "#f43f5e" : "rgba(255,255,255,0.35)" }}>{a.result}</div>
                    {a.pnl_pct && <div style={{ fontSize: 10, color: a.result === "WIN" ? "#22d3a0" : "#f43f5e" }}>{a.pnl_pct > 0 ? "+" : ""}{a.pnl_pct}%</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SCREENER */}
        {tab === "screener" && (
          <div style={{ display: "grid", gap: 12 }}>
            <SH title="◉ SCREENER ALERTS" sub={`Live · Railway DB · ${screenAlerts.length} hits today`} />
            {aLoading && <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Loading from Railway…</div>}
            {!aLoading && screenAlerts.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
                No screener hits today yet.<br />
                <span style={{ fontSize: 10, display: "block", marginTop: 8 }}>Add POST to {API_BASE}/screener-alert in screener.py.</span>
              </div>
            )}
            {screenAlerts.map((a, i) => {
              const time = new Date(a.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              return isPhone ? (
                <div key={a.id} style={{ background: pulseIdx === i ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${pulseIdx === i ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.055)"}`, borderRadius: 8, padding: "12px 14px", borderLeft: `3px solid ${a.priority ? "#f59e0b" : "#60a5fa"}`, transition: "all 0.35s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{a.ticker}</span>
                      {a.priority === 1 && <span style={{ fontSize: 7, color: "#f59e0b", letterSpacing: "0.1em" }}>PRIORITY</span>}
                      <Chip label={a.signal_type} color="#60a5fa" />
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 5 }}>{a.signal_desc}</div>
                  <div style={{ display: "flex", gap: 14, fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
                    <span>{time}</span>
                    {a.price && <span>${parseFloat(a.price).toFixed(2)}</span>}
                    {a.change_pct && <span style={{ color: a.change_pct > 0 ? "#22d3a0" : "#f43f5e" }}>{a.change_pct > 0 ? "+" : ""}{parseFloat(a.change_pct).toFixed(2)}%</span>}
                  </div>
                </div>
              ) : (
                <div key={a.id} style={{ display: "grid", gridTemplateColumns: isTablet ? "50px 72px 80px 1fr 76px 68px 96px" : "56px 80px 88px 1fr 82px 72px 100px", gap: 10, padding: "12px 16px", alignItems: "center", background: pulseIdx === i ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${pulseIdx === i ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.055)"}`, borderRadius: 8, borderLeft: `3px solid ${a.priority ? "#f59e0b" : "#60a5fa"}`, transition: "all 0.35s" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{time}</div>
                  <div><div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{a.ticker}</div>{a.priority === 1 && <div style={{ fontSize: 7, color: "#f59e0b" }}>PRIORITY</div>}</div>
                  <Chip label={a.signal_type} color="#60a5fa" />
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>{a.signal_desc}</div>
                  <Stat label="PRICE" val={a.price ? `$${parseFloat(a.price).toFixed(2)}` : "—"} />
                  <Stat label="CHG" val={a.change_pct ? `${a.change_pct > 0 ? "+" : ""}${parseFloat(a.change_pct).toFixed(2)}%` : "—"} valColor={a.change_pct > 0 ? "#22d3a0" : "#f43f5e"} />
                  <StatusBadge status={a.status} />
                </div>
              );
            })}
          </div>
        )}

        {/* SCORECARD */}
        {tab === "scorecard" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SH title="▣ SCORECARD" sub="Live from Railway DB" />
              <div style={{ display: "flex", gap: 6 }}>
                {["today", "week", "month"].map(p => (
                  <button key={p} onClick={() => setSP(p)} style={{ background: scorePeriod === p ? "rgba(34,211,160,0.1)" : "transparent", border: `1px solid ${scorePeriod === p ? "rgba(34,211,160,0.35)" : "rgba(255,255,255,0.1)"}`, color: scorePeriod === p ? "#22d3a0" : "rgba(255,255,255,0.35)", padding: "5px 11px", borderRadius: 6, cursor: "pointer", fontSize: 9, fontFamily: "inherit", letterSpacing: "0.06em" }}>{p.toUpperCase()}</button>
                ))}
              </div>
            </div>

            {sLoading ? <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Loading from Railway…</div> : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: isPhone ? "repeat(3,1fr)" : "repeat(3,1fr)", gap: 12 }}>
                  {[
                    { label: "Win Rate", value: `${sc.win_rate}%`, sub: `${sc.wins}W · ${sc.losses}L`, color: "#22d3a0" },
                    { label: "Avg Win", value: `+${sc.avg_win}%`, sub: "per winning signal", color: "#f59e0b" },
                    { label: "Avg Loss", value: `${sc.avg_loss}%`, sub: "per losing signal", color: "#f43f5e" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: isPhone ? "16px 12px" : "20px", textAlign: "center" }}>
                      <div style={{ fontSize: isPhone ? 24 : 28, fontWeight: 800, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {sc.total > 0 && (
                  <Card>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 10 }}>W / L BREAKDOWN</div>
                    <div style={{ display: "flex", gap: 2, height: 36, borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ flex: sc.wins || 1, background: "linear-gradient(90deg,#22d3a0,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#000" }}>{sc.wins}W</div>
                      <div style={{ flex: sc.losses || 1, background: "linear-gradient(90deg,#f43f5e,#be123c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{sc.losses}L</div>
                    </div>
                  </Card>
                )}

                {sc.total === 0 && <div style={{ textAlign: "center", padding: "36px 0", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>No resolved alerts yet.<br /><span style={{ fontSize: 10, display: "block", marginTop: 6 }}>Mark alerts via PATCH {API_BASE}/alert/:id/result</span></div>}

                <Card>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 14 }}>SIGNAL TYPE PERFORMANCE</div>
                  {SIGNAL_TYPES.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: isPhone ? 100 : 130, fontSize: 9, color: "rgba(255,255,255,0.42)" }}>{s.type}</div>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
                        <div style={{ width: `${s.wr}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${s.wr >= 75 ? "#22d3a0" : s.wr >= 65 ? "#f59e0b" : "#f43f5e"},transparent)` }} />
                      </div>
                      <div style={{ width: 30, fontSize: 10, color: s.wr >= 75 ? "#22d3a0" : s.wr >= 65 ? "#f59e0b" : "#f43f5e", textAlign: "right" }}>{s.wr}%</div>
                      {!isPhone && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", width: 44 }}>{s.wins}W/{s.losses}L</div>}
                    </div>
                  ))}
                </Card>
              </>
            )}
          </div>
        )}

      </main>

      {/* ── PHONE BOTTOM TAB BAR ── */}
      {isPhone && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(7,9,15,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-around", padding: "8px 0 10px", zIndex: 100, backdropFilter: "blur(10px)" }}>
          {phoneTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 8px", fontFamily: "inherit" }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
              <span style={{ fontSize: 8, letterSpacing: "0.06em", color: tab === t.id ? "#22d3a0" : "rgba(255,255,255,0.3)", fontWeight: tab === t.id ? 700 : 400 }}>{t.label.split(" ")[0].toUpperCase()}</span>
              {tab === t.id && <span style={{ width: 16, height: 2, borderRadius: 1, background: "#22d3a0" }} />}
            </button>
          ))}
        </nav>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        body { margin: 0; overscroll-behavior: none; }
      `}</style>
    </div>
  );
}
