import React, { useMemo, useState } from "react";
import API from "../../services/api.js";

/**
 * AddGameModal (IGDB + RAWG Merge → Preview → Commit)
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onAdded: (newGameMinimal) => void   // tabloya eklemek için minimal obje
 */
export default function AddGameModal({ open, onClose, onAdded }) {
  const [igdbQ, setIgdbQ] = useState("");
  const [rawgQ, setRawgQ] = useState("");
  const [igdbLoading, setIgdbLoading] = useState(false);
  const [rawgLoading, setRawgLoading] = useState(false);
  const [igdbResults, setIgdbResults] = useState([]);
  const [rawgResults, setRawgResults] = useState([]);

  const [igdbSel, setIgdbSel] = useState(null); // { id, name }
  const [rawgSel, setRawgSel] = useState(null); // { id, name }

  const [previewLoading, setPreviewLoading] = useState(false);
  const [merged, setMerged] = useState(null); // GameMerge.MergedGameDto

  const canPreview = useMemo(() => !!(igdbSel?.id && rawgSel?.id), [igdbSel, rawgSel]);

  if (!open) return null;

  // ---- searchers ----
  const searchIGDB = async () => {
    if (!igdbQ.trim()) return;
    setIgdbLoading(true); setIgdbResults([]);
    try {
      const { data } = await API.get("/igdb/search", {
        params: { q: igdbQ, page: 1, pageSize: 20, dedupe: true, details: false }
      });
      const items = (data?.items || []).map(x => ({ id: x.id ?? x.Id, name: x.name ?? x.Name }));
      setIgdbResults(items);
    } finally { setIgdbLoading(false); }
  };

  const searchRAWG = async () => {
    if (!rawgQ.trim()) return;
    setRawgLoading(true); setRawgResults([]);
    try {
      const { data } = await API.get("/rawg/search", {
        params: { q: rawgQ, page: 1, pageSize: 20 }
      });
      const items = (data?.items || []).map(x => ({ id: x.id ?? x.Id, name: x.name ?? x.Name }));
      setRawgResults(items);
    } finally { setRawgLoading(false); }
  };

  // ---- preview merge ----
  const doPreview = async () => {
    if (!canPreview) return;
    setPreviewLoading(true); setMerged(null);
    try {
      const { data } = await API.get("/merge/preview", {
        params: { igdbId: igdbSel.id, rawgId: rawgSel.id }
      });
      setMerged(data);
    } finally { setPreviewLoading(false); }
  };

  // ---- commit (save) ----
  const doCommit = async () => {
    if (!merged) return;
    // PreviewImportController → POST /api/import/preview/one (MergedGameDto)
    const { data } = await API.post("/import/preview/one", merged);

    // Tablo için minimal obje (AdminController /admin/games dto’su ile uyumlu)
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

    if (onAdded) onAdded(minimal);
    if (onClose) onClose();
    resetModal();
  };

  const resetModal = () => {
    setIgdbQ(""); setRawgQ("");
    setIgdbResults([]); setRawgResults([]);
    setIgdbSel(null); setRawgSel(null);
    setMerged(null); setPreviewLoading(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-head">
          <h3>Add Game (Merge IGDB + RAWG)</h3>
          <button className="icon-btn" onClick={() => { resetModal(); onClose?.(); }} aria-label="Close">✕</button>
        </div>

        {/* 2 kolon: IGDB ve RAWG arama/seçim */}
        <div className="merge-grid">
          <div className="pane">
            <div className="pane-title">IGDB</div>
            <div className="search-row">
              <input
                value={igdbQ}
                onChange={e => setIgdbQ(e.target.value)}
                placeholder="Search IGDB (e.g., Sims)…"
                onKeyDown={e => { if (e.key === "Enter") searchIGDB(); }}
              />
              <button className="btn primary" onClick={searchIGDB} disabled={igdbLoading}>
                {igdbLoading ? "Searching…" : "Search"}
              </button>
            </div>

            <div className="results-list">
              {igdbResults.length === 0 ? (
                <div className="empty-hint">No results</div>
              ) : igdbResults.map(it => (
                <label key={`igdb_${it.id}`} className={`result-item ${igdbSel?.id === it.id ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="igdbPick"
                    checked={igdbSel?.id === it.id}
                    onChange={() => setIgdbSel(it)}
                  />
                  <span className="ri-name">{it.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pane">
            <div className="pane-title">RAWG</div>
            <div className="search-row">
              <input
                value={rawgQ}
                onChange={e => setRawgQ(e.target.value)}
                placeholder="Search RAWG (e.g., Sims)…"
                onKeyDown={e => { if (e.key === "Enter") searchRAWG(); }}
              />
              <button className="btn primary" onClick={searchRAWG} disabled={rawgLoading}>
                {rawgLoading ? "Searching…" : "Search"}
              </button>
            </div>

            <div className="results-list">
              {rawgResults.length === 0 ? (
                <div className="empty-hint">No results</div>
              ) : rawgResults.map(it => (
                <label key={`rawg_${it.id}`} className={`result-item ${rawgSel?.id === it.id ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="rawgPick"
                    checked={rawgSel?.id === it.id}
                    onChange={() => setRawgSel(it)}
                  />
                  <span className="ri-name">{it.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Preview & Commit */}
        <div className="preview-actions">
          <button className="btn secondary" onClick={doPreview} disabled={!canPreview || previewLoading}>
            {previewLoading ? "Merging…" : "Preview & Merge"}
          </button>
          <button className="btn primary" onClick={doCommit} disabled={!merged}>
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
      </div>
    </div>
  );
}
