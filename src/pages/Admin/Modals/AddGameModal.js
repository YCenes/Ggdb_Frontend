import React, { useState } from "react";
import API from "../../../services/api.js";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AddGameModal({ open, onClose, onAdded }) {
  const [mode, setMode] = useState("auto");

  // ====== AUTO state ======
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [merged, setMerged] = useState(null);

  // ====== MANUAL state ======
  const [mName, setMName] = useState("");
  const [mRelease, setMRelease] = useState("");
  const [mCover, setMCover] = useState("");
  const [mDeveloper, setMDeveloper] = useState("");
  const [mPublisher, setMPublisher] = useState("");

  const [mMetacritic, setMMetacritic] = useState("");
  const [mGgDbRating, setMGgDbRating] = useState("");
  const [mPopularity, setMPopularity] = useState("");

  const [mGenres, setMGenres] = useState("");
  const [mPlatforms, setMPlatforms] = useState("");
  const [mAbout, setMAbout] = useState("");

  const [mAgeRatings, setMAgeRatings] = useState("");
  const [mDlcs, setMDlcs] = useState("");
  const [mTags, setMTags] = useState("");

  const [mAudioLangs, setMAudioLangs] = useState("");
  const [mSubtitles, setMSubtitles] = useState("");
  const [mIfaceLangs, setMIfaceLangs] = useState("");
  const [mContentWarnings, setMContentWarnings] = useState("");

  const [mImages, setMImages] = useState("");

  const [mMinReqText, setMMinReqText] = useState("");
  const [mRecReqText, setMRecReqText] = useState("");

  const [mEngines, setMEngines] = useState("");
  const [mAwards, setMAwards] = useState("");

  const [mCast, setMCast] = useState("");
  const [mCrew, setMCrew] = useState("");

  const [mTtbH, setMTtbH] = useState("");
  const [mTtbN, setMTtbN] = useState("");
  const [mTtbC, setMTtbC] = useState("");

  const [mStoreLinks, setMStoreLinks] = useState("");

  const [mScreenshots, setMScreenshots] = useState("");
  const [mTrailers, setMTrailers] = useState("");

  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState(null);

  if (!open) return null;

  // ---------- utils (aynı) ----------
  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/[™®©]/g, "")
      .replace(/\[(.*?)]/g, " ")
      .replace(/[:\-–_|]/g, " ")
      .replace(/\b(remaster(ed)?|remake|definitive|complete|deluxe|ultimate|goty|hd|edition|bundle|pack)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const titleSim = (a, b) => {
    const A = normalize(a), B = normalize(b);
    if (!A || !B) return 0;
    if (A === B) return 1;
    if (A.includes(B) || B.includes(A)) return 0.96;
    const d = lev(A, B);
    const maxLen = Math.max(A.length, B.length);
    return 1 - d / Math.max(1, maxLen);
  };
  const jaccard = (a = [], b = []) => {
    const A = new Set(a.map(s => s.toLowerCase()));
    const B = new Set(b.map(s => s.toLowerCase()));
    const inter = [...A].filter(x => B.has(x)).length;
    const union = new Set([...A, ...B]).size || 1;
    return inter / union;
  };

  const yearClose = (ya, yb) => (ya == null || yb == null) ? true : Math.abs(ya - yb) <= 1;
  const slugEqual = (a, b) => !!a && !!b && normalize(a) === normalize(b);

  const pairScore = (g, r) => {
    let s = similarity(g.name, r.name);
    if (g.year && r.year && Math.abs(g.year - r.year) <= 1) s += 0.03;
    if (g.platforms?.length && r.platforms?.length) s += 0.02 * jaccard(g.platforms, r.platforms);
    return Math.min(1, s);
  };

  const isStrongMatch = (g, r, s) => {
    const nameEq = normalize(g.name) === normalize(r.name);
    const yearOk = (!g.year || !r.year) || Math.abs(g.year - r.year) <= 1;
    return (s >= 0.94 && yearOk) || (nameEq && s >= 0.90);
  };

  const dedupeByKey = (arr, keyFn) => {
    const seen = new Set(); const out = [];
    for (const x of arr) { const k = keyFn(x); if (seen.has(k)) continue; seen.add(k); out.push(x); }
    return out;
  };

  const lev = (a, b) => {
    a = a || ""; b = b || "";
    const n = a.length, m = b.length;
    if (n === 0) return m;
    if (m === 0) return n;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) dp[i][0] = i;
    for (let j = 0; j <= m; j++) dp[0][j] = j;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[n][m];
  };

  const similarity = (a, b) => {
    const A = normalize(a);
    const B = normalize(b);
    if (!A || !B) return 0;
    if (A === B) return 1;
    if (A.includes(B) || B.includes(A)) return 0.95;
    const d = lev(A, B);
    const maxLen = Math.max(A.length, B.length);
    return 1 - d / Math.max(1, maxLen);
  };

  const parseCsv = (s) => (s || "").split(",").map(x => x.trim()).filter(Boolean);
  const parseYear = (y) => (Number.isFinite(+y) ? +y : null);
  const parseLines = (s) => (s || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);

  const toIntOrNull = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };

  const safeIsoDateTime = (s) => {
    const v = (s || "").trim();
    if (!v) return null;
    const isoLike = /^\d{4}-\d{2}-\d{2}(T.*)?$/i.test(v) ? v : null;
    const dt = new Date((isoLike || v));
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  };

  const parseStoreLinks = (s) => {
    const rows = parseLines(s);
    const out = [];
    for (const row of rows) {
      const [left, right] = row.split("|").map(x => (x || "").trim());
      if (!left && !right) continue;
      const name = left || "Store";
      const url = right || "";
      if (!url) continue;
      out.push({ Store: name, Name: name, Url: url });
    }
    return out;
  };

  const extractApiError = (err) => {
    const d = err?.response?.data;
    if (typeof d === "string") return d;
    if (d?.message) return d.message;
    if (d?.errors && typeof d.errors === "object") {
      const parts = [];
      for (const [k, arr] of Object.entries(d.errors)) {
        const line = Array.isArray(arr) ? arr.join(" • ") : String(arr);
        parts.push(`${k}: ${line}`);
      }
      if (parts.length) return parts.join(" | ");
    }
    if (d?.title || d?.detail) return `${d.title ?? "Error"}${d.detail ? `: ${d.detail}` : ""}`;
    if (err?.message) return err.message;
    try { return JSON.stringify(d ?? err); } catch { return "Unknown error"; }
  };

  const extractYouTubeId = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
      if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
      return null;
    } catch { return null; }
  };

  const parseTrailersLines = (s) =>
    (s || "")
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(Boolean)
      .map(url => {
        const ytId = extractYouTubeId(url);
        return { Platform: ytId ? "youtube" : "generic", Url: url, YouTubeId: ytId };
      });

  // ---------- AUTO: search ----------
  const runSearch = async () => {
    const term = q.trim();
    if (!term) return;
    setLoading(true); setResults([]); setPicked(null); setMerged(null);

    try {
      const [igdbRes, rawgRes] = await Promise.all([
        API.get("/igdb/search", {
          params: { q: term, page: 1, pageSize: 20, dedupe: true, details: true, useSearch: true },
        }),
        API.get("/rawg/search", { params: { q: term, page: 1, pageSize: 20 } }),
      ]);

      const igdbItems = (igdbRes?.data?.items || []).map(x => ({
        id: x.id ?? x.Id,
        name: x.name ?? x.Name,
        year: parseYear(x.year ?? x.Year),
        platforms: x.platforms ?? x.Platforms ?? [],
        cover: x.cover ?? x.Cover ?? null,
      }));

      const rawgItems = (rawgRes?.data?.items || []).map(x => ({
        id: x.id ?? x.Id,
        name: x.name ?? x.Name,
        year: parseYear(x.year ?? x.Year),
        platforms: x.platforms ?? x.Platforms ?? [],
        cover: x.backgroundImage ?? x.BackgroundImage ?? x.image ?? x.Image ?? null,
      }));

      const pairs = [];
      const THRESH = 0.94;

      for (const g of igdbItems) {
        for (const r of rawgItems) {
          const s = pairScore(g, r);
          if (isStrongMatch(g, r, s) && s >= THRESH) {
            const labelBase = (g.name?.length || 0) >= (r.name?.length || 0) ? g.name : r.name;
            const label = g.year ? `${labelBase} (${g.year})` : (r.year ? `${labelBase} (${r.year})` : labelBase);
            pairs.push({
              label, igdbId: g.id, rawgId: r.id, score: s,
              year: g.year ?? r.year ?? null, cover: g.cover || r.cover || null,
            });
          }
        }
      }

      const key = p => `${p.igdbId}-${p.rawgId}`;
      const seen = new Set();
      const uniqPairs = [];
      for (const p of pairs.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))) {
        if (seen.has(key(p))) continue;
        seen.add(key(p));
        uniqPairs.push(p);
      }

      const matchedIgdb = new Set(uniqPairs.map(p => p.igdbId));
      for (const g of igdbItems) {
        if (!matchedIgdb.has(g.id)) {
          uniqPairs.push({
            label: g.year ? `${g.name} (${g.year})` : g.name,
            igdbId: g.id, rawgId: null, score: 0.5, year: g.year ?? null, cover: g.cover || null,
          });
        }
      }

      setResults(uniqPairs);
    } finally {
      setLoading(false);
    }
  };

  // ---------- AUTO: preview/commit ----------
  const doPreview = async () => {
    if (!picked?.igdbId || !picked?.rawgId) return;
    setPreviewLoading(true); setMerged(null);
    try {
      const { data } = await API.get("/merge/preview", {
        params: { igdbId: picked.igdbId, rawgId: picked.rawgId }
      });
      setMerged(data);
    } finally {
      setPreviewLoading(false);
    }
  };

  const doCommitAuto = async () => {
    if (!picked?.igdbId || !picked?.rawgId) return;
    if (!merged) { await doPreview(); if (!merged) return; }

    try {
      const { data } = await API.post("/import/preview/one", merged, {
        headers: { "Content-Type": "application/json" },
      });

      const minimal = {
        id: data?.id ?? merged.Id ?? "temp",
        cover: merged.MainImage || null,
        title: merged.Name || "",
        release: merged.ReleaseDate || null,
        developer: merged.Developer || merged.Publisher || "",
        genres: merged.Genres || [],
        platforms: merged.Platforms || [],
        story: merged.About || ""
      };

      onAdded?.(minimal);
      handleClose();
    } catch (e) {
      alert(extractApiError(e));
      console.error("Auto commit error:", e?.response?.data ?? e);
    }
  };

  // ---------- MANUAL: commit ----------
  const doCommitManual = async () => {
    setManualError(null);
    if (!mName.trim()) { setManualError("Name zorunlu."); return; }

    const dto = {
      Name: mName.trim(),
      ReleaseDate: safeIsoDateTime(mRelease),
      Metacritic: toIntOrNull(mMetacritic),
      GgDbRating: toIntOrNull(mGgDbRating),
      MainImage: mCover || null,
      Popularity: toIntOrNull(mPopularity),
      Developer: mDeveloper || null,
      Publisher: mPublisher || null,
      About: mAbout || null,

      AgeRatings: parseCsv(mAgeRatings),
      Dlcs: parseCsv(mDlcs),
      Tags: parseCsv(mTags),
      Genres: parseCsv(mGenres),
      Platforms: parseCsv(mPlatforms),
      Images: parseCsv(mImages),

      MinRequirement: mMinReqText.trim() ? { Text: mMinReqText.trim() } : null,
      RecRequirement: mRecReqText.trim() ? { Text: mRecReqText.trim() } : null,

      AudioLanguages: parseCsv(mAudioLangs),
      Subtitles: parseCsv(mSubtitles),
      InterfaceLanguages: parseCsv(mIfaceLangs),
      ContentWarnings: parseCsv(mContentWarnings),

      StoreLinks: parseStoreLinks(mStoreLinks),

      TimeToBeat: {
        Hastily: toIntOrNull(mTtbH),
        Normally: toIntOrNull(mTtbN),
        Completely: toIntOrNull(mTtbC),
      },

      Engines: parseCsv(mEngines),
      Awards: parseLines(mAwards),

      Cast: parseLines(mCast),
      Crew: parseLines(mCrew),

      Screenshots: parseCsv(mScreenshots),
      Trailers: parseTrailersLines(mTrailers)
    };

    try {
      setManualSaving(true);
      const { data } = await API.post("/import/preview/one", dto, {
        headers: { "Content-Type": "application/json" },
      });

      const minimal = {
        id: data?.id ?? "temp",
        cover: dto.MainImage || null,
        title: dto.Name || "",
        release: dto.ReleaseDate || null,
        developer: dto.Developer || dto.Publisher || "",
        genres: dto.Genres || [],
        platforms: dto.Platforms || [],
        story: dto.About || ""
      };

      onAdded?.(minimal);
      handleClose();
    } catch (e) {
      setManualError(extractApiError(e));
      console.error("Manual commit error:", e?.response?.data ?? e);
    } finally {
      setManualSaving(false);
    }
  };

  const handleClose = () => {
    setMode("auto");
    setQ(""); setLoading(false); setResults([]); setPicked(null);
    setPreviewLoading(false); setMerged(null);

    setMName(""); setMRelease(""); setMCover("");
    setMDeveloper(""); setMPublisher("");
    setMScreenshots(""); setMTrailers("");

    setMMetacritic(""); setMGgDbRating(""); setMPopularity("");
    setMGenres(""); setMPlatforms(""); setMAbout("");
    setMAgeRatings(""); setMDlcs(""); setMTags("");
    setMAudioLangs(""); setMSubtitles(""); setMIfaceLangs(""); setMContentWarnings("");
    setMImages("");

    setMMinReqText(""); setMRecReqText("");
    setMEngines(""); setMAwards("");
    setMCast(""); setMCrew("");
    setMStoreLinks("");

    setMTtbH(""); setMTtbN(""); setMTtbC("");
    setManualSaving(false); setManualError(null);
    onClose?.();
  };

  return (
    <div className="gg-backdrop">
      <div className="modal-card">
        <div className="modal-head">
          <h3>Add Game</h3>

          {/* Tabs – görselin aynı kalması için kendi .tab CSS’in duruyor */}
          <div className="tabs">
            <button className={`tab ${mode === "auto" ? "active" : ""}`} onClick={() => setMode("auto")}>
              Auto-merge (IGDB + RAWG)
            </button>
            <button className={`tab ${mode === "manual" ? "active" : ""}`} onClick={() => setMode("manual")}>
              Manual
            </button>
          </div>

          <button className="icon-btn" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {mode === "auto" ? (
          <>
            {/* Search row → Bootstrap form-control + btn  */}
            <div className="d-flex gap-3 my-2">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Type a game name (e.g., The Sims 4)…"
                onKeyDown={e => { if (e.key === "Enter") runSearch(); }}
                className="form-control input-dark border-1"
              />
              <button className="btn btn-primary fw-bold" onClick={runSearch} disabled={loading}>
                {loading ? "Searching…" : "Search"}
              </button>
            </div>

            {/* RESULTS → Bootstrap row/col + card + ratio */}
            <div className="rounded-3 p-3">
              {loading ? (
                <div className="text-center py-3 text-secondary">Searching…</div>
              ) : results.length === 0 ? (
                <div className="text-center py-3 text-secondary">
                  {q.trim() ? "No strict matches (need IGDB+RAWG pair ≥ 0.93)" : "No results"}
                </div>
              ) : (
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
                  {results.map((row, i) => {
                    const active = picked?.igdbId === row.igdbId && picked?.rawgId === row.rawgId;
                    return (
                      <label
                        key={`${row.label}_${row.igdbId}_${row.rawgId}_${i}`}
                        className="col"
                        title={row.label}
                        onClick={() => { setPicked(row); setMerged(null); }}
                        style={{ cursor: "pointer" }}
                      >
                        <input type="radio" name="gamePick" checked={active} onChange={() => {}} className="d-none" />
                        <div className={`card h-100 bg-body-tertiary ${active ? "border-primary shadow" : "border-secondary"} border-1`}>
                          <div className="position-relative">
                            <div className="ratio ratio-16x9 bg-black">
                              {row.cover ? (
                                <img src={row.cover} alt={row.label} loading="lazy" className="card-img-top object-fit" />
                              ) : (
                                <div className="d-flex align-items-center justify-content-center text-secondary">No Image</div>
                              )}
                            </div>
                            <div className="position-absolute top-0 start-0 p-2 d-flex gap-2 w-100 justify-content-between">
                              
                              {typeof row.score === "number" && (
                                <span className="badge text-bg-dark border border-light-subtle">
                                  {Math.round(row.score * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="card-body py-2">
                            <div className="fw-bold text-light" style={{ lineHeight: 1.2, minHeight: "2.4em" }}>
                              {row.label}
                            </div>
                            {row.year && <div className="text-secondary small">{row.year}</div>}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-end gap-2 my-3">
              <button className="btn btn-secondary" onClick={doPreview} disabled={!picked || previewLoading}>
                {previewLoading ? "Merging…" : "Preview & Merge"}
              </button>
              <button className="btn btn-primary fw-bold" onClick={doCommitAuto} disabled={!picked}>
                Add (Commit)
              </button>
            </div>

            {/* Merge preview → Bootstrap grid */}
            {merged && (
              <div className="border border-secondary rounded-3 p-3">
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    {merged.mainImage ? (
                      <img src={merged.mainImage} alt="cover" className="w-100 rounded-2 object-fit-cover" style={{ aspectRatio: "16/9" }} />
                    ) : (
                      <div className="no-cover">No Cover</div>
                    )}
                  </div>
                  <div className="col-12 col-md-8">
                    <div className="mp-title">{merged.name}</div>
                    <div className="mp-row"><b>Release:</b> {merged.releaseDate ? new Date(merged.releaseDate).toISOString().slice(0,10) : "—"}</div>
                    <div className="mp-row"><b>Developer:</b> {merged.developer || "—"}</div>
                    <div className="mp-row"><b>Publisher:</b> {merged.publisher || "—"}</div>
                    <div className="mp-row"><b>Genres:</b> {(merged.genres || []).join(", ") || "—"}</div>
                    <div className="mp-row"><b>Platforms:</b> {(merged.platforms || []).join(", ") || "—"}</div>
                    <div className="mp-row"><b>About:</b> {merged.about || "—"}</div>

                    {Array.isArray(merged.screenshots) && merged.screenshots.length > 0 && (
                      <>
                        <div className="mp-subtitle">Screenshots</div>
                        <div className="row g-2">
                          {merged.screenshots.slice(0, 8).map((u, i) => (
                            <div className="col-6 col-md-3" key={i}>
                              <img src={u} alt={`ss-${i}`} className="w-100 rounded-2 object-fit-cover" style={{ height: 80 }} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* MANUAL FORM → Bootstrap grid + form-control */}
            <div className="bg-dark border border-secondary rounded-3 p-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Name *</label>
                  <input className="form-control bg-body-tertiary" value={mName} onChange={e => setMName(e.target.value)} placeholder="The Witcher 3: Wild Hunt" />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Release (YYYY-MM-DD or ISO)</label>
                  <input className="form-control bg-body-tertiary" value={mRelease} onChange={e => setMRelease(e.target.value)} placeholder="2015-05-19" />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Cover URL (MainImage)</label>
                  <input className="form-control bg-body-tertiary" value={mCover} onChange={e => setMCover(e.target.value)} placeholder="https://..." />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-secondary">Developer</label>
                  <input className="form-control bg-body-tertiary" value={mDeveloper} onChange={e => setMDeveloper(e.target.value)} placeholder="CD Projekt RED" />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-secondary">Publisher</label>
                  <input className="form-control bg-body-tertiary" value={mPublisher} onChange={e => setMPublisher(e.target.value)} placeholder="CD Projekt RED" />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-secondary">Metacritic</label>
                  <input className="form-control bg-body-tertiary" value={mMetacritic} onChange={e => setMMetacritic(e.target.value)} placeholder="91" />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-secondary">GgDbRating</label>
                  <input className="form-control bg-body-tertiary" value={mGgDbRating} onChange={e => setMGgDbRating(e.target.value)} placeholder="88" />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-secondary">Popularity</label>
                  <input className="form-control bg-body-tertiary" value={mPopularity} onChange={e => setMPopularity(e.target.value)} placeholder="1200" />
                </div>

                <div className="col-md-9">
                  <label className="form-label small fw-bold text-secondary">Genres (comma-separated)</label>
                  <input className="form-control bg-body-tertiary" value={mGenres} onChange={e => setMGenres(e.target.value)} placeholder="RPG, Adventure" />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Platforms (comma-separated)</label>
                  <input className="form-control bg-body-tertiary" value={mPlatforms} onChange={e => setMPlatforms(e.target.value)} placeholder="PC, PS5, Xbox Series" />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary">About / Story</label>
                  <textarea rows={3} className="form-control bg-body-tertiary" value={mAbout} onChange={e => setMAbout(e.target.value)} placeholder="Short summary..." />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Age Ratings (comma-separated)</label>
                  <input className="form-control bg-body-tertiary" value={mAgeRatings} onChange={e => setMAgeRatings(e.target.value)} placeholder="PEGI 18, M" />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">DLCs (comma-separated)</label>
                  <input className="form-control bg-body-tertiary" value={mDlcs} onChange={e => setMDlcs(e.target.value)} placeholder="Hearts of Stone, Blood and Wine" />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Tags (comma-separated)</label>
                  <input className="form-control bg-body-tertiary" value={mTags} onChange={e => setMTags(e.target.value)} placeholder="Open World, Fantasy, Story Rich" />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Interface Languages</label>
                  <input className="form-control bg-body-tertiary" value={mIfaceLangs} onChange={e => setMIfaceLangs(e.target.value)} placeholder="English, Turkish" />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Audio Languages</label>
                  <input className="form-control bg-body-tertiary" value={mAudioLangs} onChange={e => setMAudioLangs(e.target.value)} placeholder="English" />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Subtitles</label>
                  <input className="form-control bg-body-tertiary" value={mSubtitles} onChange={e => setMSubtitles(e.target.value)} placeholder="English, Turkish" />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary">Content Warnings</label>
                  <input className="form-control bg-body-tertiary" value={mContentWarnings} onChange={e => setMContentWarnings(e.target.value)} placeholder="Violence, Mature" />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary">Images (comma-separated URLs)</label>
                  <input className="form-control bg-body-tertiary" value={mImages} onChange={e => setMImages(e.target.value)} placeholder="https://img1.jpg, https://img2.jpg" />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">MinRequirement Text</label>
                  <input className="form-control bg-body-tertiary" value={mMinReqText} onChange={e => setMMinReqText(e.target.value)} placeholder="Minimum: ..." />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">RecRequirement Text</label>
                  <input className="form-control bg-body-tertiary" value={mRecReqText} onChange={e => setMRecReqText(e.target.value)} placeholder="Recommended: ..." />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Engines</label>
                  <input className="form-control bg-body-tertiary" value={mEngines} onChange={e => setMEngines(e.target.value)} placeholder="REDengine 3, Unreal" />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Awards (each line)</label>
                  <textarea rows={3} className="form-control bg-body-tertiary" value={mAwards} onChange={e => setMAwards(e.target.value)} placeholder={"GOTY 2015\nBest RPG 2015"} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Cast (each line)</label>
                  <textarea rows={3} className="form-control bg-body-tertiary" value={mCast} onChange={e => setMCast(e.target.value)} placeholder={"Voice Actor 1\nVoice Actor 2"} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Crew (each line)</label>
                  <textarea rows={3} className="form-control bg-body-tertiary" value={mCrew} onChange={e => setMCrew(e.target.value)} placeholder={"John Doe - Director\nJane Doe - Composer"} />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary">Screenshots (comma-separated URLs)</label>
                  <input className="form-control bg-body-tertiary" value={mScreenshots} onChange={e => setMScreenshots(e.target.value)} placeholder="https://img1.jpg, https://img2.png" />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary">Trailers (each line: full URL)</label>
                  <textarea rows={3} className="form-control bg-body-tertiary" value={mTrailers} onChange={e => setMTrailers(e.target.value)} placeholder={"https://youtu.be/VIDEOID\nhttps://www.youtube.com/watch?v=VIDEOID"} />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary">Store Links (one per line: Name | URL)</label>
                  <textarea rows={3} className="form-control bg-body-tertiary" value={mStoreLinks} onChange={e => setMStoreLinks(e.target.value)} placeholder={"Steam | https://store.steampowered.com/app/...\nGOG | https://www.gog.com/game/..."} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">TimeToBeat (H / N / C)</label>
                  <div className="d-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <input className="form-control bg-body-tertiary" value={mTtbH} onChange={e => setMTtbH(e.target.value)} placeholder="25" />
                    <input className="form-control bg-body-tertiary" value={mTtbN} onChange={e => setMTtbN(e.target.value)} placeholder="60" />
                    <input className="form-control bg-body-tertiary" value={mTtbC} onChange={e => setMTtbC(e.target.value)} placeholder="90" />
                  </div>
                </div>
              </div>

              {manualError && (
                <div className="card border-1 mt-2" style={{ padding: 10, borderColor: "var(--line)" }}>
                  {manualError}
                </div>
              )}

              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-primary fw-bold" onClick={doCommitManual} disabled={manualSaving}>
                  {manualSaving ? "Saving…" : "Add (Manual)"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
