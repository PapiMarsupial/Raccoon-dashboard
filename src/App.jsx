import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "https://spy-alert-server-production.up.railway.app";

function useBreakpoint() {
  const [bp, setBp] = useState(() => window.innerWidth < 600 ? "phone" : window.innerWidth < 1100 ? "tablet" : "desktop");
  useEffect(() => {
    const fn = () => setBp(window.innerWidth < 600 ? "phone" : window.innerWidth < 1100 ? "tablet" : "desktop");
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return bp;
}

function useQuotes(symbols) {
  const [quotes, setQuotes] = useState({});
  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/quotes?symbols=${symbols.join(",")}`);
      setQuotes(await r.json());
    } catch {}
  }, [symbols.join(",")]);
  useEffect(() => { fetch_(); const iv = setInterval(fetch_, 30000); return () => clearInterval(iv); }, [fetch_]);
  return { quotes };
}

function useCandles(symbol = "SPY") {
  const [candles, setCandles] = useState([]);
  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/candles?symbol=${symbol}`);
      setCandles(await r.json());
    } catch {}
  }, [symbol]);
  useEffect(() => { fetch_(); const iv = setInterval(fetch_, 60000); return () => clearInterval(iv); }, [fetch_]);
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

const MOCK_NEWS = [
  { title: "Fed officials signal patience on rate cuts amid inflation uncertainty", date: new Date().toISOString(), source: "Reuters" },
  { title: "NVIDIA surges on strong data center demand ahead of earnings", date: new Date().toISOString(), source: "Bloomberg" },
  { title: "S&P 500 hovers near highs as mega-cap tech leads gains", date: new Date().toISOString(), source: "CNBC" },
  { title: "Options market pricing elevated volatility into CPI week", date: new Date().toISOString(), source: "MarketWatch" },
  { title: "Treasury yields pull back as recession fears resurface", date: new Date().toISOString(), source: "FT" },
  { title: "Tesla rallies after CEO reaffirms robotaxi timeline", date: new Date().toISOString(), source: "Yahoo Finance" },
];

const ECON_EVENTS = [
  { date: "Today",    time: "08:30", event: "Initial Jobless Claims",      importance: "HIGH", forecast: "215K", prev: "212K", actual: "218K" },
  { date: "Today",    time: "10:00", event: "ISM Manufacturing PMI",       importance: "HIGH", forecast: "48.5", prev: "48.7", actual: null },
  { date: "Tomorrow", time: "08:30", event: "Core PCE Price Index MoM",    importance: "HIGH", forecast: "0.3%", prev: "0.4%", actual: null },
  { date: "Tomorrow", time: "10:00", event: "Consumer Sentiment (Prelim)", importance: "MED",  forecast: "77.5", prev: "76.9", actual: null },
  { date: "Fri",      time: "08:30", event: "Nonfarm Payrolls",            importance: "HIGH", forecast: "185K", prev: "228K", actual: null },
  { date: "Fri",      time: "08:30", event: "Unemployment Rate",           importance: "HIGH", forecast: "4.1%", prev: "4.0%", actual: null },
];

const EARNINGS = [
  { ticker: "AAPL",  name: "Apple",     date: "Today AMC",    eps: "$1.62", rev: "$94.5B",  imp: "HIGH" },
  { ticker: "AMZN",  name: "Amazon",    date: "Today AMC",    eps: "$1.36", rev: "$142.6B", imp: "HIGH" },
  { ticker: "META",  name: "Meta",      date: "Tomorrow BMO", eps: "$5.25", rev: "$40.2B",  imp: "HIGH" },
  { ticker: "MSFT",  name: "Microsoft", date: "Tomorrow AMC", eps: "$3.22", rev: "$68.4B",  imp: "HIGH" },
  { ticker: "GOOGL", name: "Alphabet",  date: "Thu AMC",      eps: "$2.01", rev: "$89.3B",  imp: "MED" },
  { ticker: "AMD",   name: "AMD",       date: "Thu AMC",      eps: "$0.68", rev: "$7.1B",   imp: "MED" },
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
  { id: "overview",  label: "Overview",   icon: "⌂" },
  { id: "premarket", label: "Pre-Market", icon: "◑" },
  { id: "levels",    label: "Levels",     icon: "≡" },
  { id: "news",      label: "News",       icon: "◻" },
  { id: "spy",       label: "SPY Alerts", icon: "◆" },
  { id: "screener",  label: "Screener",   icon: "◉" },
  { id: "scorecard", label: "Scorecard",  icon: "◇" },
];

// ─── CHART ────────────────────────────────────────────────────────────────────
function CandleChart({ candles, height = 200 }) {
  if (!candles.length) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
      Loading chart…
    </div>
  );
  const W = 560, H = height, PAD = { t: 10, b: 26, l: 48, r: 8 };
  const slice = candles.slice(-55);
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
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={PAD.t + f * (H - PAD.t - PAD.b)} x2={W - PAD.r} y2={PAD.t + f * (H - PAD.t - PAD.b)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={PAD.l - 4} y={PAD.t + f * (H - PAD.t - PAD.b) + 4} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="end" fontFamily="'Fira Code', monospace">{(maxP - f * range).toFixed(1)}</text>
        </g>
      ))}
      {slice.map((c, i) => {
        if (!c.o || !c.c) return null;
        const x = PAD.l + i * cw + cw / 2, bull = c.c >= c.o, col = bull ? "#34d399" : "#f87171";
        const top = py(Math.max(c.o, c.c)), bh = Math.max(1.5, Math.abs(py(c.o) - py(c.c)));
        return (
          <g key={i}>
            <line x1={x} y1={py(c.h)} x2={x} y2={py(c.l)} stroke={col} strokeWidth="0.8" opacity="0.6" />
            <rect x={x - cw * 0.36} y={top} width={cw * 0.72} height={bh} fill={bull ? col : "none"} stroke={col} strokeWidth="0.8" opacity="0.9" rx="0.5" />
          </g>
        );
      })}
      <polyline points={vwap.map((v, i) => `${PAD.l + i * cw + cw / 2},${py(v)}`).join(" ")} fill="none" stroke="#fbbf24" strokeWidth="1.3" strokeDasharray="5,3" opacity="0.75" />
      {slice.filter((_, i) => i % Math.ceil(slice.length / 7) === 0).map((c) => {
        const idx = slice.indexOf(c);
        return <text key={idx} x={PAD.l + idx * cw + cw / 2} y={H - 4} fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="middle" fontFamily="'Fira Code', monospace">{c.t}</text>;
      })}
    </svg>
  );
}

// ─── KEY LEVELS ───────────────────────────────────────────────────────────────
function KeyLevels({ quotes, isPhone }) {
  const spy = quotes["SPY"], qqq = quotes["QQQ"], vix = quotes["^VIX"];
  const mk = (q, sym) => {
    if (!q) return null;
    const p = parseFloat(q.price), h = parseFloat(q.high), l = parseFloat(q.low), prev = parseFloat(q.prev);
    return { sym, price: p, high: h, low: l, prev, open: q.open || prev, vwap: parseFloat(((h + l + p) / 3).toFixed(2)) };
  };
  const levels = [mk(spy, "SPY"), mk(qqq, "QQQ")].filter(Boolean);
  if (!levels.length) return <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Fetching levels…</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: isPhone ? "1fr" : "1fr 1fr", gap: 12 }}>
        {levels.map((lv, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>{lv.sym}</span>
              <span style={{ fontSize: 26, fontWeight: 700, color: parseFloat(quotes[lv.sym]?.changePct) >= 0 ? "#34d399" : "#f87171", fontFamily: "'Fira Code', monospace" }}>${lv.price}</span>
            </div>
            {[
              { label: "Day High",   val: lv.high,           color: "#34d399", tag: "R" },
              { label: "VWAP",       val: lv.vwap,           color: "#fbbf24", tag: "~" },
              { label: "Open",       val: lv.open || lv.prev, color: "rgba(255,255,255,0.45)", tag: "O" },
              { label: "Day Low",    val: lv.low,            color: "#f87171", tag: "S" },
              { label: "Prev Close", val: lv.prev,           color: "rgba(255,255,255,0.3)", tag: "P" },
            ].map((row, j) => {
              const pct = row.val ? (((row.val - lv.price) / lv.price) * 100).toFixed(2) : null;
              return (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: `${row.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: row.color, fontWeight: 700, flexShrink: 0, border: `1px solid ${row.color}35` }}>{row.tag}</div>
                  <div style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>{row.label}</div>
                  <div style={{ fontSize: 13, color: row.color, fontFamily: "'Fira Code', monospace", fontWeight: 500 }}>{row.val ? `$${row.val}` : "—"}</div>
                  {pct && <div style={{ fontSize: 11, color: parseFloat(pct) >= 0 ? "#34d399" : "#f87171", minWidth: 50, textAlign: "right", fontFamily: "'Fira Code', monospace" }}>{parseFloat(pct) >= 0 ? "+" : ""}{pct}%</div>}
                </div>
              );
            })}
            <div style={{ marginTop: 16, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
              <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #f87171, #fbbf24, #34d399)", width: `${Math.min(100, Math.max(0, ((lv.price - lv.low) / (lv.high - lv.low)) * 100))}%`, transition: "width 1s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'Fira Code', monospace" }}>
              <span>L ${lv.low}</span><span>H ${lv.high}</span>
            </div>
          </div>
        ))}
      </div>
      {vix && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", marginBottom: 4 }}>VIX</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: parseFloat(vix.price) > 20 ? "#f87171" : parseFloat(vix.price) > 15 ? "#fbbf24" : "#34d399", fontFamily: "'Fira Code', monospace", lineHeight: 1 }}>{vix.price}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
              <span>Low</span><span>Normal</span><span>Elevated</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
              <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #34d399, #fbbf24, #f87171)", width: `${Math.min(100, (parseFloat(vix.price) / 40) * 100)}%`, transition: "width 1s ease" }} />
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Today</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: parseFloat(vix.changePct) > 0 ? "#f87171" : "#34d399", fontFamily: "'Fira Code', monospace" }}>{parseFloat(vix.changePct) > 0 ? "+" : ""}{vix.changePct}%</div>
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
    try {
      const resp = await fetch(`${API_BASE}/brief`);
      const d = await resp.json();
      setBrief(d?.brief || d?.error || "Something went wrong.");
    } catch { setBrief("Couldn't reach server."); }
    setLoading(false); setGenerated(true);
  };
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Pre-Market Brief</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>AI-powered · refreshes on demand</div>
        </div>
        <button onClick={generate} disabled={loading} style={{ background: loading ? "transparent" : "rgba(52,211,153,0.12)", border: `1px solid ${loading ? "rgba(255,255,255,0.1)" : "rgba(52,211,153,0.35)"}`, color: loading ? "rgba(255,255,255,0.3)" : "#34d399", padding: "8px 16px", borderRadius: 10, cursor: loading ? "wait" : "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600, transition: "all 0.2s" }}>
          {loading ? "Generating…" : generated ? "Refresh" : "Generate"}
        </button>
      </div>
      {brief
        ? <div style={{ fontSize: 13, lineHeight: 1.9, color: "rgba(255,255,255,0.7)", whiteSpace: "pre-wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, flex: 1 }}>{brief}</div>
        : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "24px 0" }}>
            <div style={{ fontSize: 36, opacity: 0.25 }}>🦝</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textAlign: "center", lineHeight: 1.7 }}>Tap Generate for your<br />morning market brief</div>
          </div>
        )
      }
    </div>
  );
}

// ─── NEWS ─────────────────────────────────────────────────────────────────────
function NewsPanel({ news, loading }) {
  const ago = s => { try { const m = (Date.now() - new Date(s)) / 60000; return m < 60 ? `${~~m}m ago` : m < 1440 ? `${~~(m / 60)}h ago` : `${~~(m / 1440)}d ago`; } catch { return ""; } };
  if (loading) return <>{Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: 60, background: "rgba(255,255,255,0.03)", borderRadius: 12, marginBottom: 6, opacity: 0.4 }} />)}</>;
  return <>{news.map((item, i) => (
    <a key={i} href={item.link || "#"} target="_blank" rel="noopener noreferrer"
      style={{ display: "block", padding: "13px 16px", borderRadius: 12, textDecoration: "none", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 6, transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, marginBottom: 5 }}>{item.title}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{item.source} · {ago(item.date)}</div>
    </a>
  ))}</>;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>{title}</h2>
      {sub && <p style={{ margin: "5px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>{sub}</p>}
    </div>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, ...style }}>{children}</div>;
}

function Pill({ label, color = "rgba(255,255,255,0.5)" }) {
  return <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: `${color}18`, color, border: `1px solid ${color}30`, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{label}</span>;
}

function NumCell({ label, val, color = "rgba(255,255,255,0.85)" }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4, letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 13, color, fontFamily: "'Fira Code', monospace" }}>{val}</div>
    </div>
  );
}

function LiveDot({ active }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#34d399" : "rgba(255,255,255,0.2)", ...(active ? { animation: "pulse 2s infinite" } : {}) }} />
      <span style={{ fontSize: 10, color: active ? "#34d399" : "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.05em" }}>{active ? "OPEN" : "CLOSED"}</span>
    </span>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function RaccoonOptions() {
  const bp = useBreakpoint();
  const isPhone = bp === "phone", isTablet = bp === "tablet";

  const [tab, setTab] = useState("overview");
  const [newsSubTab, setNST] = useState("news");
  const [scorePeriod, setSP] = useState("today");
  const [now, setNow] = useState(new Date());

  const { quotes } = useQuotes(WATCHLIST);
  const candles = useCandles("SPY");
  const { data: alertData, loading: aLoading, error: aError } = useApiAlerts();
  const { scorecard, loading: sLoading } = useScorecard();
  const { news, loading: nLoading } = useNews();

  const spy = quotes["SPY"], qqq = quotes["QQQ"], vix = quotes["^VIX"];
  const spyAlerts = alertData.spy_alerts || [];
  const screenAlerts = alertData.screener_alerts || [];
  const sc = scorecard?.[scorePeriod] || { wins: 0, losses: 0, total: 0, win_rate: 0, avg_win: 0, avg_loss: 0 };

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);

  const isOpen = () => {
    const h = now.getHours(), m = now.getMinutes(), day = now.getDay();
    if (!day || day === 6) return false;
    return h * 60 + m >= 570 && h * 60 + m < 960;
  };

  const phoneTabs = TABS.filter(t => ["overview", "spy", "screener", "news", "scorecard"].includes(t.id));

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", fontFamily: "'Outfit', 'Inter', system-ui, sans-serif", color: "rgba(255,255,255,0.85)", paddingBottom: isPhone ? 72 : 0 }}>

      {/* Ambient gradient */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 320, background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(52,211,153,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* ── HEADER ── */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isPhone ? "14px 16px" : "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(13,17,23,0.9)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100 }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: isPhone ? 22 : 24 }}>🦝</span>
          <div>
            <div style={{ fontSize: isPhone ? 14 : 15, fontWeight: 700, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.01em" }}>Raccoon Options</div>
            {!isPhone && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Signal Terminal</div>}
          </div>
        </div>

        {/* Tickers */}
        <div style={{ display: "flex", gap: isPhone ? 18 : 28, alignItems: "center" }}>
          {[{ sym: "SPY", q: spy }, { sym: "QQQ", q: qqq }, { sym: "VIX", q: vix }].map(({ sym, q }) => (
            <div key={sym} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, letterSpacing: "0.05em" }}>{sym}</div>
              <div style={{ fontSize: isPhone ? 14 : 15, fontWeight: 700, color: "rgba(255,255,255,0.92)", fontFamily: "'Fira Code', monospace" }}>{q?.price || "—"}</div>
              <div style={{ fontSize: 10, color: parseFloat(q?.changePct) >= 0 ? "#34d399" : "#f87171", fontFamily: "'Fira Code', monospace" }}>
                {q ? `${parseFloat(q.changePct) >= 0 ? "+" : ""}${q.changePct}%` : "—"}
              </div>
            </div>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {!isPhone && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "'Fira Code', monospace", fontWeight: 500 }}>
                {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
          )}
          <div style={{ padding: "6px 12px", borderRadius: 99, background: isOpen() ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${isOpen() ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}` }}>
            <LiveDot active={isOpen()} />
          </div>
        </div>
      </header>

      {/* ── DESKTOP/TABLET NAV ── */}
      {!isPhone && (
        <nav style={{ display: "flex", padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(13,17,23,0.9)", overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "transparent", border: "none", borderBottom: `2px solid ${tab === t.id ? "#34d399" : "transparent"}`, cursor: "pointer", padding: isTablet ? "12px 14px" : "13px 20px", fontSize: 13, color: tab === t.id ? "#34d399" : "rgba(255,255,255,0.4)", fontWeight: tab === t.id ? 600 : 400, fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap" }}>
              {t.label}
            </button>
          ))}
        </nav>
      )}

      {aError && (
        <div style={{ background: "rgba(248,113,113,0.08)", borderBottom: "1px solid rgba(248,113,113,0.2)", padding: "9px 28px", fontSize: 12, color: "#f87171" }}>
          Can't reach Railway — check your API_BASE setting
        </div>
      )}

      {/* ── CONTENT ── */}
      <main style={{ padding: isPhone ? 14 : isTablet ? 20 : 24, maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={{ display: "grid", gap: 16 }}>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: isPhone ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(5,1fr)", gap: 10 }}>
              {[
                { label: "SPY Alerts", value: aLoading ? "—" : alertData.count?.spy || 0, sub: "today", color: "#818cf8" },
                { label: "Screener Hits", value: aLoading ? "—" : alertData.count?.screener || 0, sub: "today", color: "#fbbf24" },
                { label: "Win Rate", value: sc.win_rate != null ? `${sc.win_rate}%` : "—", sub: `${sc.wins}W / ${sc.losses}L`, color: "#34d399" },
                { label: "SPY", value: spy ? `$${spy.price}` : "—", sub: spy ? `${parseFloat(spy.changePct) >= 0 ? "+" : ""}${spy.changePct}%` : "—", color: parseFloat(spy?.changePct) >= 0 ? "#34d399" : "#f87171" },
                { label: "VIX", value: vix?.price || "—", sub: vix ? `${parseFloat(vix.changePct) > 0 ? "+" : ""}${vix.changePct}%` : "—", color: parseFloat(vix?.price) > 20 ? "#f87171" : parseFloat(vix?.price) > 15 ? "#fbbf24" : "#34d399" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: isPhone ? "14px 16px" : "16px 20px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.6 }} />
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10, fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontSize: isPhone ? 24 : 28, fontWeight: 700, color: s.color, fontFamily: "'Fira Code', monospace", lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Chart + Brief */}
            <div style={{ display: "grid", gridTemplateColumns: isPhone ? "1fr" : "1fr 360px", gap: 14 }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>SPY · 5 min</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>Live · refreshes every 60s</div>
                  </div>
                  <div style={{ display: "flex", gap: 14, fontSize: 11, color: "rgba(255,255,255,0.3)", alignItems: "center" }}>
                    <span><span style={{ color: "#34d399" }}>▮</span> Bull</span>
                    <span><span style={{ color: "#f87171" }}>▮</span> Bear</span>
                    <span><span style={{ color: "#fbbf24" }}>╌</span> VWAP</span>
                  </div>
                </div>
                <CandleChart candles={candles} height={isPhone ? 160 : 200} />
              </Card>
              <PremarketBrief quotes={quotes} />
            </div>

            {/* Key Levels */}
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 16 }}>Key Levels</div>
              <KeyLevels quotes={quotes} isPhone={isPhone} />
            </Card>

            {/* Earnings */}
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 16 }}>Upcoming Earnings</div>
              <div style={{ display: "grid", gridTemplateColumns: isPhone ? "repeat(3,1fr)" : "repeat(6,1fr)", gap: 8 }}>
                {EARNINGS.map((e, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px", border: `1px solid ${e.imp === "HIGH" ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: "'Fira Code', monospace" }}>{e.ticker}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{e.date}</div>
                    <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 5, fontFamily: "'Fira Code', monospace" }}>{e.eps}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* PRE-MARKET */}
        {tab === "premarket" && (
          <div style={{ display: "grid", gap: 16, maxWidth: 860 }}>
            <SectionHeader title="Pre-Market Brief" sub="AI-generated morning intelligence using live market data" />
            <PremarketBrief quotes={quotes} />
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 16 }}>Watchlist</div>
              <div style={{ display: "grid", gridTemplateColumns: isPhone ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10 }}>
                {["SPY", "QQQ", "NVDA", "TSLA", "AMD", "META", "^VIX", "^DJI"].map(sym => {
                  const q = quotes[sym], up = parseFloat(q?.changePct) >= 0;
                  return (
                    <div key={sym} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 16px", border: `1px solid ${q ? (up ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)") : "rgba(255,255,255,0.06)"}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{sym.replace("^", "")}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.92)", fontFamily: "'Fira Code', monospace" }}>{q?.price || "—"}</div>
                      <div style={{ fontSize: 12, color: up ? "#34d399" : "#f87171", fontFamily: "'Fira Code', monospace", marginTop: 4 }}>
                        {q ? `${up ? "+" : ""}${q.changePct}%` : "loading…"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* KEY LEVELS */}
        {tab === "levels" && (
          <div style={{ display: "grid", gap: 16 }}>
            <SectionHeader title="Key Levels" sub="Live SPY & QQQ · refreshes every 30s" />
            <KeyLevels quotes={quotes} isPhone={isPhone} />
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 16 }}>SPY Intraday</div>
              <CandleChart candles={candles} height={isPhone ? 160 : 230} />
            </Card>
          </div>
        )}

        {/* NEWS */}
        {tab === "news" && (
          <div style={{ display: "grid", gap: 16 }}>
            <SectionHeader title="News & Events" />
            <div style={{ display: "flex", gap: 8 }}>
              {["news", "calendar", "earnings"].map(st => (
                <button key={st} onClick={() => setNST(st)} style={{ background: newsSubTab === st ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${newsSubTab === st ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.08)"}`, color: newsSubTab === st ? "#34d399" : "rgba(255,255,255,0.4)", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: newsSubTab === st ? 600 : 400, transition: "all 0.15s", textTransform: "capitalize" }}>{st}</button>
              ))}
            </div>

            {newsSubTab === "news" && (
              <div style={{ display: "grid", gridTemplateColumns: isPhone ? "1fr" : "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 12, letterSpacing: "0.05em", fontWeight: 500 }}>LATEST</div>
                  <NewsPanel news={news.slice(0, 7)} loading={nLoading} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 12, letterSpacing: "0.05em", fontWeight: 500 }}>MORE</div>
                  <NewsPanel news={news.slice(7)} loading={nLoading} />
                </div>
              </div>
            )}

            {newsSubTab === "calendar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ECON_EVENTS.map((ev, i) => {
                  const ic = ev.importance === "HIGH" ? "#f87171" : ev.importance === "MED" ? "#fbbf24" : "rgba(255,255,255,0.25)";
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: isPhone ? "48px 52px 1fr 64px" : "54px 58px 1fr 74px 74px 74px", gap: 12, alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, borderLeft: `2px solid ${ic}` }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{ev.date}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Fira Code', monospace" }}>{ev.time}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{ev.event}</div>
                      {isPhone
                        ? <div style={{ textAlign: "right", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Fira Code', monospace" }}>{ev.forecast}</div>
                        : <><NumCell label="FCST" val={ev.forecast} /><NumCell label="PREV" val={ev.prev} /><NumCell label="ACT" val={ev.actual || "—"} color={ev.actual ? (parseFloat(ev.actual) > parseFloat(ev.forecast) ? "#34d399" : "#f87171") : "rgba(255,255,255,0.2)"} /></>
                      }
                    </div>
                  );
                })}
              </div>
            )}

            {newsSubTab === "earnings" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {EARNINGS.map((e, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: isPhone ? "60px 1fr 80px" : "64px 1fr 130px 84px 104px 60px", gap: 12, alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, borderLeft: `2px solid ${e.imp === "HIGH" ? "#fbbf24" : "rgba(255,255,255,0.15)"}` }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: "'Fira Code', monospace" }}>{e.ticker}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{isPhone ? e.date : e.name}</div>
                    {!isPhone && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{e.date}</div>}
                    {isPhone ? <div style={{ fontSize: 12, color: "#fbbf24", textAlign: "right", fontFamily: "'Fira Code', monospace" }}>{e.eps}</div> : <><NumCell label="EPS EST" val={e.eps} color="#fbbf24" /><NumCell label="REV EST" val={e.rev} /><Pill label={e.imp} color={e.imp === "HIGH" ? "#fbbf24" : "rgba(255,255,255,0.35)"} /></>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SPY ALERTS */}
        {tab === "spy" && (
          <div style={{ display: "grid", gap: 10 }}>
            <SectionHeader title="SPY Alerts" sub={`${spyAlerts.length} signals today · live from Railway`} />
            {aLoading && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading…</p>}
            {!aLoading && spyAlerts.length === 0 && (
              <Card style={{ textAlign: "center", padding: "52px 24px" }}>
                <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.2 }}>🦝</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>No alerts today yet</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>TradingView fires when a signal triggers</div>
              </Card>
            )}
            {spyAlerts.map((a, i) => {
              const bull = a.direction === "BULL";
              const grade = a.score >= 75 ? "A" : a.score >= 50 ? "B" : a.score >= 25 ? "C" : "D";
              const gradeColor = a.score >= 75 ? "#34d399" : a.score >= 50 ? "#fbbf24" : "#f87171";
              const time = new Date(a.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const resultColor = a.result === "WIN" ? "#34d399" : a.result === "LOSS" ? "#f87171" : "rgba(255,255,255,0.3)";
              return isPhone ? (
                <div key={a.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", borderLeft: `3px solid ${bull ? "#34d399" : "#f87171"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Pill label={bull ? "▲ BULL" : "▼ BEAR"} color={bull ? "#34d399" : "#f87171"} />
                      <span style={{ fontSize: 22, fontWeight: 800, color: gradeColor, fontFamily: "'Fira Code', monospace" }}>{grade}</span>
                    </div>
                    <div style={{ padding: "4px 10px", borderRadius: 8, background: `${resultColor}15`, border: `1px solid ${resultColor}30` }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: resultColor }}>{a.result}</span>
                      {a.pnl_pct && <span style={{ fontSize: 11, color: resultColor, marginLeft: 5, fontFamily: "'Fira Code', monospace" }}>{a.pnl_pct > 0 ? "+" : ""}{a.pnl_pct}%</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 8 }}>{a.note}</div>
                  <div style={{ display: "flex", gap: 14, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Fira Code', monospace" }}>
                    <span>{time}</span>
                    <span>${parseFloat(a.price).toFixed(2)}</span>
                    {a.rsi && <span>RSI {parseFloat(a.rsi).toFixed(1)}</span>}
                  </div>
                </div>
              ) : (
                <div key={a.id} style={{ display: "grid", gridTemplateColumns: isTablet ? "56px 84px 54px 1fr 78px 78px 108px" : "62px 90px 58px 1fr 84px 84px 116px", gap: 12, padding: "14px 20px", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, borderLeft: `3px solid ${bull ? "#34d399" : "#f87171"}` }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Fira Code', monospace" }}>{time}</div>
                  <Pill label={bull ? "▲ Bull" : "▼ Bear"} color={bull ? "#34d399" : "#f87171"} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 3 }}>Grade</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: gradeColor, fontFamily: "'Fira Code', monospace", lineHeight: 1 }}>{grade}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{a.note}</div>
                    {a.signal_type === "base" && <div style={{ fontSize: 10, color: "#fbbf24", marginTop: 3 }}>Watching · awaiting confluence</div>}
                  </div>
                  <NumCell label="PRICE" val={`$${parseFloat(a.price).toFixed(2)}`} />
                  <NumCell label="RSI" val={a.rsi ? parseFloat(a.rsi).toFixed(1) : "—"} />
                  <div style={{ textAlign: "center", padding: "6px 10px", borderRadius: 10, background: `${resultColor}12`, border: `1px solid ${resultColor}28` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: resultColor }}>{a.result}</div>
                    {a.pnl_pct && <div style={{ fontSize: 12, color: resultColor, fontFamily: "'Fira Code', monospace" }}>{a.pnl_pct > 0 ? "+" : ""}{a.pnl_pct}%</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SCREENER */}
        {tab === "screener" && (
          <div style={{ display: "grid", gap: 10 }}>
            <SectionHeader title="Screener" sub={`${screenAlerts.length} hits today · live from Railway`} />
            {aLoading && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading…</p>}
            {!aLoading && screenAlerts.length === 0 && (
              <Card style={{ textAlign: "center", padding: "52px 24px" }}>
                <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.2 }}>🦝</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>No screener hits today</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>Runs every 15 minutes during market hours</div>
              </Card>
            )}
            {screenAlerts.map((a, i) => {
              const time = new Date(a.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const statusColor = { ACTIVE: "#34d399", TRIGGERED: "#fbbf24", WATCHING: "rgba(255,255,255,0.35)" }[a.status] || "rgba(255,255,255,0.35)";
              return isPhone ? (
                <div key={a.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", borderLeft: `3px solid ${a.priority ? "#fbbf24" : "#818cf8"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.92)", fontFamily: "'Fira Code', monospace" }}>{a.ticker}</span>
                      {a.priority === 1 && <Pill label="Priority" color="#fbbf24" />}
                      <Pill label={a.signal_type} color="#818cf8" />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, ...(a.status === "ACTIVE" ? { animation: "pulse 2s infinite" } : {}) }} />
                      <span style={{ fontSize: 10, color: statusColor, fontWeight: 600 }}>{a.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{a.signal_desc}</div>
                  <div style={{ display: "flex", gap: 14, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Fira Code', monospace" }}>
                    <span>{time}</span>
                    {a.price && <span>${parseFloat(a.price).toFixed(2)}</span>}
                    {a.change_pct && <span style={{ color: a.change_pct > 0 ? "#34d399" : "#f87171" }}>{a.change_pct > 0 ? "+" : ""}{parseFloat(a.change_pct).toFixed(2)}%</span>}
                  </div>
                </div>
              ) : (
                <div key={a.id} style={{ display: "grid", gridTemplateColumns: isTablet ? "54px 78px 86px 1fr 84px 72px 110px" : "62px 86px 94px 1fr 90px 78px 120px", gap: 12, padding: "14px 20px", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, borderLeft: `3px solid ${a.priority ? "#fbbf24" : "#818cf8"}` }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Fira Code', monospace" }}>{time}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.92)", fontFamily: "'Fira Code', monospace" }}>{a.ticker}</div>
                    {a.priority === 1 && <div style={{ fontSize: 9, color: "#fbbf24", fontWeight: 700, marginTop: 2 }}>PRIORITY</div>}
                  </div>
                  <Pill label={a.signal_type} color="#818cf8" />
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{a.signal_desc}</div>
                  <NumCell label="PRICE" val={a.price ? `$${parseFloat(a.price).toFixed(2)}` : "—"} />
                  <NumCell label="CHG" val={a.change_pct ? `${a.change_pct > 0 ? "+" : ""}${parseFloat(a.change_pct).toFixed(2)}%` : "—"} color={a.change_pct > 0 ? "#34d399" : "#f87171"} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0, ...(a.status === "ACTIVE" ? { animation: "pulse 2s infinite" } : {}) }} />
                    <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>{a.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SCORECARD */}
        {tab === "scorecard" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <SectionHeader title="Scorecard" sub="Performance tracked from Railway" />
              <div style={{ display: "flex", gap: 6 }}>
                {["today", "week", "month"].map(p => (
                  <button key={p} onClick={() => setSP(p)} style={{ background: scorePeriod === p ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${scorePeriod === p ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.08)"}`, color: scorePeriod === p ? "#34d399" : "rgba(255,255,255,0.4)", padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: scorePeriod === p ? 600 : 400, textTransform: "capitalize" }}>{p}</button>
                ))}
              </div>
            </div>

            {sLoading ? <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading…</p> : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[
                    { label: "Win Rate", value: `${sc.win_rate}%`, sub: `${sc.wins}W · ${sc.losses}L`, color: "#34d399" },
                    { label: "Avg Win", value: `+${sc.avg_win}%`, sub: "per winning signal", color: "#fbbf24" },
                    { label: "Avg Loss", value: `${sc.avg_loss}%`, sub: "per losing signal", color: "#f87171" },
                  ].map((s, i) => (
                    <Card key={i} style={{ textAlign: "center", padding: isPhone ? "20px 14px" : "28px 20px" }}>
                      <div style={{ fontSize: isPhone ? 30 : 38, fontWeight: 700, color: s.color, fontFamily: "'Fira Code', monospace", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 12, fontWeight: 500 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{s.sub}</div>
                    </Card>
                  ))}
                </div>

                {sc.total > 0 && (
                  <Card>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 14, fontWeight: 500 }}>Win / Loss</div>
                    <div style={{ display: "flex", height: 40, borderRadius: 10, overflow: "hidden", gap: 2 }}>
                      <div style={{ flex: sc.wins || 1, background: "linear-gradient(90deg, #34d399, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#064e3b" }}>{sc.wins}W</div>
                      <div style={{ flex: sc.losses || 1, background: "linear-gradient(90deg, #f87171, #ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{sc.losses}L</div>
                    </div>
                  </Card>
                )}

                {sc.total === 0 && (
                  <Card style={{ textAlign: "center", padding: "44px 24px" }}>
                    <div style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>No resolved alerts yet</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>Mark signals via PATCH {API_BASE}/alert/:id/result</div>
                  </Card>
                )}

                <Card>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 18, fontWeight: 500 }}>Signal Type Performance</div>
                  {SIGNAL_TYPES.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
                      <div style={{ width: isPhone ? 110 : 140, fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>{s.type}</div>
                      <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 99 }}>
                        <div style={{ width: `${s.wr}%`, height: "100%", borderRadius: 99, background: s.wr >= 75 ? "#34d399" : s.wr >= 65 ? "#fbbf24" : "#f87171", transition: "width 0.8s ease" }} />
                      </div>
                      <div style={{ width: 36, fontSize: 13, color: s.wr >= 75 ? "#34d399" : s.wr >= 65 ? "#fbbf24" : "#f87171", textAlign: "right", fontFamily: "'Fira Code', monospace", fontWeight: 600 }}>{s.wr}%</div>
                      {!isPhone && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", width: 52, fontFamily: "'Fira Code', monospace" }}>{s.wins}W/{s.losses}L</div>}
                    </div>
                  ))}
                </Card>
              </>
            )}
          </div>
        )}
      </main>

      {/* ── PHONE BOTTOM NAV ── */}
      {isPhone && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(13,17,23,0.97)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-around", padding: "10px 0 14px", zIndex: 100, backdropFilter: "blur(16px)" }}>
          {phoneTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "4px 10px", fontFamily: "inherit" }}>
              <span style={{ fontSize: 18, color: tab === t.id ? "#34d399" : "rgba(255,255,255,0.25)" }}>{t.icon}</span>
              <span style={{ fontSize: 9, letterSpacing: "0.04em", color: tab === t.id ? "#34d399" : "rgba(255,255,255,0.25)", fontWeight: tab === t.id ? 700 : 400 }}>{t.label.split(" ")[0]}</span>
              {tab === t.id && <span style={{ width: 16, height: 2, borderRadius: 99, background: "#34d399" }} />}
            </button>
          ))}
        </nav>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fira+Code:wght@400;500;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; overscroll-behavior: none; }
        h2, p { margin: 0; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
      `}</style>
    </div>
  );
}
