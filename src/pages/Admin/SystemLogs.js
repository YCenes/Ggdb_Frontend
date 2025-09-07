import React, { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCcw, Download, Search, ShieldAlert, CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";
import API from "../../services/api"; // axios.create({ baseURL: "http://localhost:5201/api" })
import "../../styles/pages/admin/_system-logs.scss";

// UI etiketleri
const LEVELS = ["All Levels", "Error", "Warning", "Info", "Success"];
const CATEGORIES = ["All Categories", "Auth", "User", "System", "Game", "Security"];
const RANGES = [
  { label: "Last 24 Hours", hours: 24 },
  { label: "Last 7 Days", hours: 24 * 7 },
  { label: "Last 30 Days", hours: 24 * 30 },
  { label: "All Time", hours: null },
];

// Frontend -> Backend param eşlemesi
const LEVEL_VALUE = { Error: "Error", Warning: "Warning", Info: "Info", Success: "Success" };
const CATEGORY_VALUE = {
  Auth: "Authentication",
  User: "UserActions",
  System: "System",
  Game: "GameManagement",
  Security: "Security",
};

// Backend’ten gelebilecek değerleri UI’a normalize et
const levelToUi = (val) => {
  // string enum adı
  if (typeof val === "string") {
    const v = val.trim();
    if (["Error", "Warning", "Info", "Success"].includes(v)) return v;
    // sayı string’i gelebilir
    if (/^\d+$/.test(v)) return levelToUi(parseInt(v, 10));
    return "Info";
  }
  // sayı -> label
  // 1:Error, 2:Warning, 3:Info, 4:Success (örnek eşleme)
  if (typeof val === "number") {
    return { 1: "Error", 2: "Warning", 3: "Info", 4: "Success" }[val] || "Info";
  }
  return "Info";
};

const categoryToUi = (val) => {
  if (typeof val === "string") {
    const v = val.trim();
    // Backend enum adları:
    if (v === "Authentication") return "Auth";
    if (v === "UserActions") return "User";
    if (v === "GameManagement") return "Game";
    if (v === "System") return "System";
    if (v === "Security") return "Security";
    // UI kısaltmaları zaten geldiyse:
    if (["Auth", "User", "System", "Game", "Security"].includes(v)) return v;
    // sayı string'i olabilir
    if (/^\d+$/.test(v)) return categoryToUi(parseInt(v, 10));
    return "System";
  }
  if (typeof val === "number") {
    // tahmini eşleme: 1:Auth, 2:User, 3:System, 4:Game, 5:Security
    return { 1: "Auth", 2: "User", 3: "System", 4: "Game", 5: "Security" }[val] || "System";
  }
  return "System";
};

function LevelBadge({ level }) {
  const map = {
    Error: { icon: <XCircle size={16} />, cls: "lv lv-error" },
    Warning: { icon: <AlertTriangle size={16} />, cls: "lv lv-warning" },
    Info: { icon: <Info size={16} />, cls: "lv lv-info" },
    Success: { icon: <CheckCircle2 size={16} />, cls: "lv lv-success" },
  };
  const it = map[level] || map.Info;
  return (
    <span className={it.cls}>
      {it.icon}
      <span>{level}</span>
    </span>
  );
}

function CatBadge({ cat }) {
  const icons = { Auth: "🛡️", User: "👤", System: "ℹ️", Game: "🎮", Security: "🔒" };
  return (
    <span className="cat">
      <span className="i">{icons[cat] || "•"}</span>
      {cat}
    </span>
  );
}

export default function SystemLogs() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [range, setRange] = useState(RANGES[0]);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [loading, setLoading] = useState(false);

  // StrictMode - tek sefer guard
  const didMount = useRef(false);
  // Son istek için AbortController (filtre değişiminde eskisini iptal et)
  const abortRef = useRef(null);

  const { fromISO, toISO } = useMemo(() => {
    if (!range.hours) return { fromISO: null, toISO: null };
    const to = new Date();
    const from = new Date(Date.now() - range.hours * 3600_000);
    return { fromISO: from.toISOString(), toISO: to.toISOString() };
  }, [range]);

  async function fetchLogs(p = 1) {
    // önceki isteği iptal et
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    try {
      const params = {
        page: p,
        pageSize,
        q: q || undefined,
        levels: level !== "All Levels" ? LEVEL_VALUE[level] : undefined,
        categories: cat !== "All Categories" ? CATEGORY_VALUE[cat] : undefined,
        from: fromISO || undefined,
        to: toISO || undefined,
      };

      const res = await API.get("/logs", { params, signal: ctrl.signal });
      const data = res.data || {};
      setRows(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setPage(typeof data.page === "number" ? data.page : p);
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.message !== "canceled") {
        console.error("fetchLogs error:", err);
        setRows([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }

  // İlk render: sadece 1 kez
  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtre değişiminde getir
  useEffect(() => {
    if (!didMount.current) return;
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, cat, range]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const onExport = () => {
    const params = new URLSearchParams({
      q,
      page: "1",
      pageSize: "10000",
      ...(level !== "All Levels" ? { levels: LEVEL_VALUE[level] } : {}),
      ...(cat !== "All Categories" ? { categories: CATEGORY_VALUE[cat] } : {}),
      ...(fromISO ? { from: fromISO } : {}),
      ...(toISO ? { to: toISO } : {}),
    }).toString();
    window.open(`${API.defaults.baseURL}/logs/export?${params}`, "_blank");
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="syslogs mt-5">
      <div className="head">
        <div className="title">System Logs</div>
        <div className="actions">
          <button className="btn ghost" onClick={() => fetchLogs(page)} disabled={loading}>
            <RefreshCcw size={16} />
            Refresh
          </button>
          <button className="btn primary" onClick={onExport} disabled={loading}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="toolbar">
        <form onSubmit={onSearchSubmit} className="search">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search logs..." />
        </form>

        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          {LEVELS.map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>

        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          {CATEGORIES.map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>

        <select
          value={range.label}
          onChange={(e) => setRange(RANGES.find((r) => r.label === e.target.value) || RANGES[0])}
        >
          {RANGES.map((r) => (
            <option key={r.label} value={r.label}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="logs">
          <thead>
            <tr>
              <th>Time</th>
              <th>Level</th>
              <th>Category</th>
              <th>Message</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.map((row) => {
              const uiLevel = levelToUi(row.level);
              const uiCat = categoryToUi(row.category);
              return (
                <tr key={row.id || `${row.time}-${row.message}`}>
                  <td>{new Date(row.time).toLocaleString()}</td>
                  <td><LevelBadge level={uiLevel} /></td>
                  <td><CatBadge cat={uiCat} /></td>
                  <td className="msg">{row.message}</td>
                  <td className="user">{row.user}</td>
                </tr>
              );
            })}
            {loading && (
              <tr>
                <td colSpan="5" className="loading">
                  <ShieldAlert size={16} /> Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan="5" className="empty">No logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span>
          {rows.length ? (page - 1) * pageSize + 1 : 0}–{(page - 1) * pageSize + rows.length} / {total}
        </span>
        <div className="pg-buttons">
          <button disabled={page <= 1 || loading} onClick={() => fetchLogs(page - 1)}>Prev</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages || loading} onClick={() => fetchLogs(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
