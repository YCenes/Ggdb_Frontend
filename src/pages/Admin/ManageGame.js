import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../services/api.js";
import "../../styles/pages/admin/_manage-game.scss";
import AddGameModal from "./Modals/AddGameModal.js";

const IconEdit = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
    <path
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04a1 1 0 000-1.41l-2.5-2.5a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.99-1.67z"
      fill="currentColor"
    />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
    <path
      d="M6 19c0 1.1.9 2 2 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      fill="currentColor"
    />
  </svg>
);

export default function ManageGame() {
  const navigate = useNavigate();
  // Filtre/arama state
  const [query, setQuery] = useState("");
  const [developer, setDeveloper] = useState("All Developers");
  const [platform, setPlatform] = useState("All Platforms");
  const [genre, setGenre] = useState("All Genres");
  const [sort, setSort] = useState("Newest First");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  // Seçimler (satır bazlı)
  const [selected, setSelected] = useState(new Set());

  // Veri + yükleniyor/hata
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Basit sayfalama (şimdilik tek sayfa)
  const skip = 0;
  const take = 100;

  // ----- REFETCH -----
  const refetch = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await API.get("/admin/games", {
        params: { skip, take, q: query || undefined }
      });
      setGames(res.data || []);
    } catch (e) {
      setErr(e);
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [query]); // skip/take sabit, dependency gerekmiyor

  // İlk yükleme + query değişince listeyi çek
  useEffect(() => {
    refetch();
  }, [refetch]);

  // --- OPTION listeleri ---
  const developerOptions = useMemo(() => {
    const uniq = new Map();
    for (const g of games) {
      const d = (g?.developer || "").trim();
      if (!d) continue;
      const key = d.toLowerCase();
      if (!uniq.has(key)) uniq.set(key, d);
    }
    return ["All Developers", ...Array.from(uniq.values()).sort((a, b) => a.localeCompare(b))];
  }, [games]);

  const genreOptions = useMemo(() => {
    const uniq = new Set();
    for (const g of games) {
      if (Array.isArray(g?.genres)) {
        for (const gn of g.genres) {
          const name = (gn || "").trim();
          if (name) uniq.add(name);
        }
      }
    }
    return ["All Genres", ...Array.from(uniq).sort((a, b) => a.localeCompare(b))];
  }, [games]);

  const platformOptions = useMemo(() => {
    const uniq = new Set();
    for (const g of games) {
      for (const p of (g.platforms || [])) {
        const name = (p || "").trim();
        if (name) uniq.add(name);
      }
    }
    return ["All Platforms", ...Array.from(uniq).sort((a, b) => a.localeCompare(b))];
  }, [games]);

  // Geçerli seçimin listede olmaması durumunda All'a çek
  useEffect(() => {
    if (platform !== "All Platforms" && !platformOptions.includes(platform)) {
      setPlatform("All Platforms");
    }
  }, [platformOptions, platform]);

  useEffect(() => {
    if (developer !== "All Developers" && !developerOptions.includes(developer)) {
      setDeveloper("All Developers");
    }
  }, [developerOptions, developer]);

  useEffect(() => {
    if (genre !== "All Genres" && !genreOptions.includes(genre)) {
      setGenre("All Genres");
    }
  }, [genreOptions, genre]);

  // --- ÖNCE shown ---
  const shown = useMemo(() => {
    let list = games;

    if (developer !== "All Developers") {
      list = list.filter(x => (x.developer || "").toLowerCase() === developer.toLowerCase());
    }
    if (platform !== "All Platforms") {
      list = list.filter(x => x.platforms?.includes(platform));
    }
    if (genre !== "All Genres") {
      list = list.filter(x => (x.genres || []).includes(genre));
    }
    if (sort === "Newest First") {
      list = [...list].sort((a, b) => new Date(b.release || 0) - new Date(a.release || 0));
    } else {
      list = [...list].sort((a, b) => new Date(a.release || 0) - new Date(b.release || 0));
    }
    return list;
  }, [games, developer, platform, genre, sort]);

  // --- SONRA allSelected ---
  const allSelected = useMemo(() => {
    if (shown.length === 0) return false;
    return shown.every(x => selected.has(x.id));
  }, [shown, selected]);

  // --- Seçim yardımcıları ---
  const toggleRow = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(shown.map(x => x.id)));
  };

  // Başlık checkbox'ı için indeterminate
  const headChkRef = useRef(null);
  useEffect(() => {
    if (!headChkRef.current) return;
    headChkRef.current.indeterminate = selected.size > 0 && !allSelected;
  }, [selected, allSelected]);

  // --- Silme işlemleri ---
  const deleteOne = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;

    // Optimistic UI
    setGames(prev => prev.filter(x => x.id !== id));
    try {
      await API.delete(`/admin/games/${id}`);
    } catch {
      // opsiyonel: geri al veya toast
    }
  };

  const onDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected game(s)?`)) return;

    const ids = Array.from(selected);
    setGames(prev => prev.filter(x => !selected.has(x.id)));
    setSelected(new Set());

    try {
      await Promise.all(ids.map(id =>
        API.delete(`/admin/games/${id}`).catch(() => null)
      ));
    } catch {
      // opsiyonel: toast
    }
  };

  const totalText = `${shown.length} game${shown.length !== 1 ? "s" : ""}`;

  return (
    <div className="manage-game-page mt-5">
      <h1 className="page-title">Game Database</h1>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title..."
          />
        </div>

        <div className="filters">
          {/* DEVELOPER */}
          <select value={developer} onChange={(e) => setDeveloper(e.target.value)}>
            {developerOptions.map(opt => (
              <option key={opt}>{opt}</option>
            ))}
          </select>

          {/* PLATFORM */}
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {platformOptions.map(opt => (
              <option key={opt}>{opt}</option>
            ))}
          </select>

          {/* GENRE */}
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            {genreOptions.map(opt => (
              <option key={opt}>{opt}</option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Newest First</option>
            <option>Oldest First</option>
          </select>

          <div className="total">{loading ? "Loading..." : totalText}</div>
        </div>
      </div>

      {/* Hata mesajı */}
      {err && (
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          API error: {String(err?.response?.data || err.message || err)}
        </div>
      )}

      {/* Table */}
      <div className="card table-card">
        <div className="table-wrapper">
          <table className="game-table">
            <thead>
              <tr>
                <th className="th-check">
                  <input
                    type="checkbox"
                    ref={headChkRef}
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
                <th>Cover</th>
                <th>Title</th>
                <th>Release</th>
                <th>Developer</th>
                <th>Genres</th>
                <th>Story</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr className="empty"><td colSpan={8}>Loading...</td></tr>
              ) : shown.length === 0 ? (
                <tr className="empty"><td colSpan={8}>No games found</td></tr>
              ) : (
                shown.slice(0, rowsPerPage).map((g) => (
                  <tr key={g.id}>
                    <td className="td-check">
                      <input
                        type="checkbox"
                        checked={selected.has(g.id)}
                        onChange={() => toggleRow(g.id)}
                        aria-label={`Select ${g.title}`}
                      />
                    </td>
                    <td className="td-cover">
                      {g.cover ? <img src={g.cover} alt={`${g.title} cover`} /> : <div className="no-cover">—</div>}
                    </td>
                    <td className="td-title"><Link to={`/admin/game/${g.id}`}>{g.title}</Link></td>
                    <td className="td-release">
                      {g.release ? new Date(g.release).toISOString().slice(0, 10) : "—"}
                    </td>
                    <td className="td-developer">{g.developer || "—"}</td>
                    <td className="td-genres">{(g.genres || []).join(", ")}</td>
                    <td className="td-story">{g.story || "—"}</td>
                    <td className="td-actions">
                      <button className="icon-btn" title="Edit" onClick={() => navigate(`/admin/game/${g.id}`)}>
                        <IconEdit />
                      </button>
                      <button
                        className="icon-btn danger"
                        title="Delete"
                        onClick={() => deleteOne(g.id, g.title)}
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls */}
        <div className="table-footer">
          <div className="rows">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>

          <div className="bulk-actions">
            <button
              className="btn secondary"
              disabled={selected.size === 0}
              onClick={onDeleteSelected}
            >
              Delete Selected
            </button>
            <button className="btn primary" onClick={() => setAddOpen(true)}>
              Add Game
            </button>
          </div>

          <div className="pager">
            <button className="btn small" disabled>Prev</button>
            <span className="page-indicator">Page 1 of 1</span>
            <button className="btn small" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AddGameModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={async () => {
          await refetch();         // ekledikten sonra listeyi tazele
          setSelected(new Set());  // seçimleri temizle
          setAddOpen(false);       // modal kapat
        }}
      />
    </div>
  );
}
