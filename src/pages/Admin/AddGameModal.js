import React, { useState } from "react";
import API from "../../services/api.js";

/**
 * AddGameModal
 *  - Mode "auto": Single search → strict pair IGDB+RAWG → Preview → Commit
 *  - Mode "manual": Full form → Commit as MergedGameDto (tüm alanlar, Createdat YOK)
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onAdded: (newGameMinimal) => void
 */
export default function AddGameModal({ open, onClose, onAdded }) {
  const [mode, setMode] = useState("auto"); // "auto" | "manual"

  // ====== AUTO (strict) state ======
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); // [{label, igdbId, rawgId, score}]
  const [picked, setPicked] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [merged, setMerged] = useState(null);

  // ====== MANUAL state (DTO'daki tüm alanlar; Createdat hariç) ======
  const [mName, setMName] = useState("");
  const [mRelease, setMRelease] = useState(""); // yyyy-mm-dd veya ISO
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

  // TimeToBeat
  const [mTtbH, setMTtbH] = useState(""); // Hastily
  const [mTtbN, setMTtbN] = useState(""); // Normally
  const [mTtbC, setMTtbC] = useState(""); // Completely

  // StoreLinks: her satır "Name | URL"
  const [mStoreLinks, setMStoreLinks] = useState("");

  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState(null);

  if (!open) return null;

  // ---------- utils ----------
  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/[™®©]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

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

  const parseCsv = (s) =>
    (s || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);

  const parseLines = (s) =>
    (s || "")
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(Boolean);

  const toIntOrNull = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };

  // YYYY-MM-DD veya ISO → ISO string (DateTime?), yoksa null
  const safeIsoDateTime = (s) => {
    const v = (s || "").trim();
    if (!v) return null;
    const isoLike = /^\d{4}-\d{2}-\d{2}(T.*)?$/i.test(v) ? v : null;
    const dt = new Date((isoLike || v));
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  };

  // "Name | URL" satırları → { Store, Name, Url }
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
    if (d?.title || d?.detail)
      return `${d.title ?? "Error"}${d.detail ? `: ${d.detail}` : ""}`;
    if (err?.message) return err.message;
    try { return JSON.stringify(d ?? err); } catch { return "Unknown error"; }
  };

  // ---------- AUTO: search (STRICT) ----------
  const runSearch = async () => {
    const term = q.trim();
    if (!term) return;
    setLoading(true);
    setResults([]);
    setPicked(null);
    setMerged(null);

    try {
      const [igdbRes, rawgRes] = await Promise.all([
        API.get("/igdb/search", { params: { q: term, page: 1, pageSize: 20, dedupe: true, details: false } }),
        API.get("/rawg/search", { params: { q: term, page: 1, pageSize: 20 } }),
      ]);

      const igdbItems = (igdbRes?.data?.items || []).map(x => ({ id: x.id ?? x.Id, name: x.name ?? x.Name }));
      const rawgItems = (rawgRes?.data?.items || []).map(x => ({ id: x.id ?? x.Id, name: x.name ?? x.Name }));

      const pairs = [];
      for (const g of igdbItems) {
        let best = null, maxS = 0;
        for (const r of rawgItems) {
          const s = similarity(g.name, r.name);
          if (s > maxS) { maxS = s; best = r; }
        }
        if (best && maxS >= 0.93) {
          const label = (g.name?.length || 0) >= (best.name?.length || 0) ? g.name : best.name;
          pairs.push({ label, igdbId: g.id, rawgId: best.id, score: maxS });
        }
      }

      pairs.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
      const seen = new Set();
      const uniq = [];
      for (const p of pairs) {
        const key = normalize(p.label);
        if (seen.has(key)) continue;
        seen.add(key);
        uniq.push(p);
      }

      setResults(uniq);
    } finally {
      setLoading(false);
    }
  };

  // ---------- AUTO: preview ----------
  const doPreview = async () => {
    if (!picked?.igdbId || !picked?.rawgId) return;
    setPreviewLoading(true);
    setMerged(null);
    try {
      const { data } = await API.get("/merge/preview", {
        params: { igdbId: picked.igdbId, rawgId: picked.rawgId }
      });
      setMerged(data);
    } finally {
      setPreviewLoading(false);
    }
  };

  // ---------- AUTO: commit (preview şart) ----------
  const doCommitAuto = async () => {
    if (!picked?.igdbId || !picked?.rawgId) return;
    if (!merged) {
      await doPreview();
      if (!merged) return;
    }

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

  // ---------- MANUAL: commit (MergedGameDto birebir, Createdat göndermiyoruz) ----------
  const doCommitManual = async () => {
    setManualError(null);

    if (!mName.trim()) {
      setManualError("Name zorunlu.");
      return;
    }

    const dto = {
      Name: mName.trim(),
      ReleaseDate: safeIsoDateTime(mRelease),          // DateTime?
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
      Images: parseCsv(mImages), // URL list

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

      // Createdat YOK — backend SetOnInsert ile otomatik DateTime.UtcNow yazacak
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
    // reset all
    setMode("auto");

    setQ(""); setLoading(false); setResults([]); setPicked(null);
    setPreviewLoading(false); setMerged(null);

    setMName(""); setMRelease(""); setMCover("");
    setMDeveloper(""); setMPublisher("");

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
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-head">
          <h3>Add Game</h3>
          <div className="tabs">
            <button
              className={`tab ${mode === "auto" ? "active" : ""}`}
              onClick={() => setMode("auto")}
            >
              Auto-merge (IGDB + RAWG)
            </button>
            <button
              className={`tab ${mode === "manual" ? "active" : ""}`}
              onClick={() => setMode("manual")}
            >
              Manual
            </button>
          </div>
          <button className="icon-btn" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {mode === "auto" ? (
          <>
            <div className="single-search">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Type a game name (e.g., The Sims 4)…"
                onKeyDown={e => { if (e.key === "Enter") runSearch(); }}
              />
              <button className="btn primary" onClick={runSearch} disabled={loading}>
                {loading ? "Searching…" : "Search"}
              </button>
            </div>

            <div className="results-list">
              {loading ? (
                <div className="empty-hint">Searching…</div>
              ) : results.length === 0 ? (
                <div className="empty-hint">
                  {q.trim() ? "No strict matches (need IGDB+RAWG pair ≥ 0.93)" : "No results"}
                </div>
              ) : (
                results.map((row, i) => (
                  <label
                    key={`${row.label}_${row.igdbId}_${row.rawgId}_${i}`}
                    className={`result-item ${picked?.igdbId === row.igdbId && picked?.rawgId === row.rawgId ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="gamePick"
                      checked={picked?.igdbId === row.igdbId && picked?.rawgId === row.rawgId}
                      onChange={() => { setPicked(row); setMerged(null); }}
                    />
                    <span className="ri-name">{row.label}</span>
                    <span className="badge ok">Match {(row.score * 100).toFixed(0)}%</span>
                  </label>
                ))
              )}
            </div>

            <div className="preview-actions">
              <button className="btn secondary" onClick={doPreview} disabled={!picked || previewLoading}>
                {previewLoading ? "Merging…" : "Preview & Merge"}
              </button>
              <button className="btn primary" onClick={doCommitAuto} disabled={!picked}>
                Add (Commit)
              </button>
            </div>

            {merged && (
              <div className="merge-preview">
                <div className="mp-left">
                  {merged.MainImage
                    ? <img src={merged.MainImage} alt="cover" />
                    : <div className="no-cover">No Cover</div>}
                </div>
                <div className="mp-right">
                  <div className="mp-title">{merged.Name}</div>
                  <div className="mp-row"><b>Release:</b> {merged.ReleaseDate ? new Date(merged.ReleaseDate).toISOString().slice(0,10) : "—"}</div>
                  <div className="mp-row"><b>Developer:</b> {merged.Developer || "—"}</div>
                  <div className="mp-row"><b>Publisher:</b> {merged.Publisher || "—"}</div>
                  <div className="mp-row"><b>Genres:</b> {(merged.Genres || []).join(", ") || "—"}</div>
                  <div className="mp-row"><b>Platforms:</b> {(merged.Platforms || []).join(", ") || "—"}</div>
                  <div className="mp-row"><b>About:</b> {merged.About || "—"}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* MANUAL FORM — DTO'daki tüm alanlar (Createdat hariç) */}
            <div className="form-grid">
              <div className="field">
                <label>Name *</label>
                <input value={mName} onChange={e => setMName(e.target.value)} placeholder="The Witcher 3: Wild Hunt" />
              </div>

              <div className="field">
                <label>Release (YYYY-MM-DD or ISO)</label>
                <input value={mRelease} onChange={e => setMRelease(e.target.value)} placeholder="2015-05-19" />
              </div>

              <div className="field">
                <label>Cover URL (MainImage)</label>
                <input value={mCover} onChange={e => setMCover(e.target.value)} placeholder="https://..." />
              </div>

              <div className="field">
                <label>Developer</label>
                <input value={mDeveloper} onChange={e => setMDeveloper(e.target.value)} placeholder="CD Projekt RED" />
              </div>

              <div className="field">
                <label>Publisher</label>
                <input value={mPublisher} onChange={e => setMPublisher(e.target.value)} placeholder="CD Projekt RED" />
              </div>

              <div className="field">
                <label>Metacritic</label>
                <input value={mMetacritic} onChange={e => setMMetacritic(e.target.value)} placeholder="91" />
              </div>

              <div className="field">
                <label>GgDbRating</label>
                <input value={mGgDbRating} onChange={e => setMGgDbRating(e.target.value)} placeholder="88" />
              </div>

              <div className="field">
                <label>Popularity</label>
                <input value={mPopularity} onChange={e => setMPopularity(e.target.value)} placeholder="1200" />
              </div>

              <div className="field">
                <label>Genres (comma-separated)</label>
                <input value={mGenres} onChange={e => setMGenres(e.target.value)} placeholder="RPG, Adventure" />
              </div>

              <div className="field">
                <label>Platforms (comma-separated)</label>
                <input value={mPlatforms} onChange={e => setMPlatforms(e.target.value)} placeholder="PC, PS5, Xbox Series" />
              </div>

              <div className="field col-span-2">
                <label>About / Story</label>
                <textarea rows={3} value={mAbout} onChange={e => setMAbout(e.target.value)} placeholder="Short summary..." />
              </div>

              <div className="field">
                <label>Age Ratings (comma-separated)</label>
                <input value={mAgeRatings} onChange={e => setMAgeRatings(e.target.value)} placeholder="PEGI 18, M" />
              </div>

              <div className="field">
                <label>DLCs (comma-separated)</label>
                <input value={mDlcs} onChange={e => setMDlcs(e.target.value)} placeholder="Hearts of Stone, Blood and Wine" />
              </div>

              <div className="field">
                <label>Tags (comma-separated)</label>
                <input value={mTags} onChange={e => setMTags(e.target.value)} placeholder="Open World, Fantasy, Story Rich" />
              </div>

              <div className="field">
                <label>Interface Languages (comma-separated)</label>
                <input value={mIfaceLangs} onChange={e => setMIfaceLangs(e.target.value)} placeholder="English, Turkish" />
              </div>

              <div className="field">
                <label>Audio Languages (comma-separated)</label>
                <input value={mAudioLangs} onChange={e => setMAudioLangs(e.target.value)} placeholder="English" />
              </div>

              <div className="field">
                <label>Subtitles (comma-separated)</label>
                <input value={mSubtitles} onChange={e => setMSubtitles(e.target.value)} placeholder="English, Turkish" />
              </div>

              <div className="field">
                <label>Content Warnings (comma-separated)</label>
                <input value={mContentWarnings} onChange={e => setMContentWarnings(e.target.value)} placeholder="Violence, Mature" />
              </div>

              <div className="field col-span-2">
                <label>Images (comma-separated URLs)</label>
                <input value={mImages} onChange={e => setMImages(e.target.value)} placeholder="https://img1.jpg, https://img2.jpg" />
              </div>

              <div className="field">
                <label>MinRequirement Text</label>
                <input value={mMinReqText} onChange={e => setMMinReqText(e.target.value)} placeholder="Minimum: ..." />
              </div>

              <div className="field">
                <label>RecRequirement Text</label>
                <input value={mRecReqText} onChange={e => setMRecReqText(e.target.value)} placeholder="Recommended: ..." />
              </div>

              <div className="field">
                <label>Engines (comma-separated)</label>
                <input value={mEngines} onChange={e => setMEngines(e.target.value)} placeholder="REDengine 3, Unreal" />
              </div>

              <div className="field">
                <label>Awards (each line)</label>
                <textarea rows={3} value={mAwards} onChange={e => setMAwards(e.target.value)} placeholder={"GOTY 2015\nBest RPG 2015"} />
              </div>

              <div className="field">
                <label>Cast (each line)</label>
                <textarea rows={3} value={mCast} onChange={e => setMCast(e.target.value)} placeholder={"Voice Actor 1\nVoice Actor 2"} />
              </div>

              <div className="field">
                <label>Crew (each line)</label>
                <textarea rows={3} value={mCrew} onChange={e => setMCrew(e.target.value)} placeholder={"John Doe - Director\nJane Doe - Composer"} />
              </div>

              <div className="field col-span-2">
                <label>Store Links (one per line: Name | URL)</label>
                <textarea rows={3} value={mStoreLinks} onChange={e => setMStoreLinks(e.target.value)} placeholder={"Steam | https://store.steampowered.com/app/...\nGOG | https://www.gog.com/game/..."} />
              </div>

              <div className="field">
                <label>TimeToBeat (Hastily / Normally / Completely)</label>
                <div className="ttb-row">
                  <input value={mTtbH} onChange={e => setMTtbH(e.target.value)} placeholder="25" />
                  <input value={mTtbN} onChange={e => setMTtbN(e.target.value)} placeholder="60" />
                  <input value={mTtbC} onChange={e => setMTtbC(e.target.value)} placeholder="90" />
                </div>
              </div>
            </div>

            {manualError && (
              <div className="card" style={{ marginTop: 8, padding: 10, border: "1px solid var(--line)" }}>
                {manualError}
              </div>
            )}

            <div className="preview-actions">
              <button className="btn primary" onClick={doCommitManual} disabled={manualSaving}>
                {manualSaving ? "Saving…" : "Add (Manual)"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
