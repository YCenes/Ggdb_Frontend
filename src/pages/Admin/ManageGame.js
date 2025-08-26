import React, { useEffect, useState, useMemo, useRef } from "react";
import API from "../../services/api.js"
import "../../styles/pages/admin/_manage-game.scss";

const sampleGame = {
  id: "ln3",
  cover:
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop",
  title: "Little Nightmares III",
  release: "2025-10-10",
  studio: "Supermassive Games",
  genres: ["Platform", "Puzzle", "Adventure"],
  story:
    "Embark on a new adventure in the uncanny Nowhere. Face childhood fears, solve eerie puzzles, and escape together..."
};

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
  // Filtre/arama state
  const [query, setQuery] = useState("");
  const [developer, setDeveloper] = useState("All Developers");
  const [platform, setPlatform] = useState("All Platforms");
  const [genre, setGenre] = useState("All Genres");
  const [sort, setSort] = useState("Newest First");
  const [checked, setChecked] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Veri + yükleniyor/hata
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Basit sayfalama (şimdilik tek sayfa)
  const skip = 0;
  const take = 100;

  const developerOptions = useMemo(() => {
  const uniq = new Map(); // lower-case key → orijinal yazım
  for (const g of games) {
    const d = (g?.developer || "").trim();
    if (!d) continue;
    const key = d.toLowerCase();
    if (!uniq.has(key)) uniq.set(key, d);
  }
  return ["All Developers", ...Array.from(uniq.values()).sort((a, b) => a.localeCompare(b))];
}, [games]);

// Tekrarsız, alfabetik genre listesi (API’den gelen g.genres dizisine göre)
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

// Mevcut seçili değer listede yoksa All’a çek (opsiyonel)
useEffect(() => {
  if (platform !== "All Platforms" && !platformOptions.includes(platform)) {
    setPlatform("All Platforms");
  }
}, [platformOptions, platform]);

// Seçili değer listede yoksa "All ..." a geri döndür (opsiyonel güvenlik)
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

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await API.get("/admin/games", {
          params: { skip, take, q: query || undefined }
        });
        if (alive) setGames(res.data || []);
      } catch (e) {
        if (alive) {
          setErr(e);
          setGames([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // query değiştiğinde tekrar getir (istersen debounce ekleyebilirsin)
  }, [query]);

  // Ön uçta ek filtre/sort (developer/platform/genre/ sort) – backend’e taşımak istersen sonra taşırız
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
      list = [...list].sort((a,b) => new Date(b.release || 0) - new Date(a.release || 0));
    } else {
      list = [...list].sort((a,b) => new Date(a.release || 0) - new Date(b.release || 0));
    }

    return list;
  }, [games, developer, platform, genre, sort]);

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
  {/* DEVELOPER: dinamik */}
  <select value={developer} onChange={(e) => setDeveloper(e.target.value)}>
    {developerOptions.map(opt => (
      <option key={opt}>{opt}</option>
    ))}
  </select>

  {/* PLATFORM: şimdilik sabit; API’ye platform isimleri ekleyince benzer şekilde dinamik yaparız */}
  <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
  {platformOptions.map(opt => (
    <option key={opt}>{opt}</option>
  ))}
</select>

  {/* GENRE: dinamik */}
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
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    aria-label="Select row"
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
                        checked={checked}
                        onChange={(e) => setChecked(e.target.checked)}
                        aria-label="Select row"
                      />
                    </td>
                    <td className="td-cover">
                      {g.cover ? <img src={g.cover} alt={`${g.title} cover`} /> : <div className="no-cover">—</div>}
                    </td>
                    <td className="td-title">{g.title}</td>
                    <td className="td-release">
                      {g.release ? new Date(g.release).toISOString().slice(0, 10) : "—"}
                    </td>
                    <td className="td-developer">{g.developer || "—"}</td>
                    <td className="td-genres">{(g.genres || []).join(", ")}</td>
                    <td className="td-story">{g.story || "—"}</td>
                    <td className="td-actions">
                      <button className="icon-btn" title="Edit" onClick={() => alert(`Edit ${g.title}`)}>
                        <IconEdit />
                      </button>
                      <button className="icon-btn danger" title="Delete" onClick={() => alert(`Delete ${g.title}`)}>
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
            <button className="btn secondary" disabled={!checked} onClick={() => alert("Delete selected")}>
              Delete Selected
            </button>
            <button className="btn primary" onClick={() => alert("Add game")}>
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
    </div>
  );
}