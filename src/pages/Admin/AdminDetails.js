// src/pages/admin/GameDetailAdmin.jsx
import React, { useState } from "react";
import "../../styles/pages/admin/_game-detail-admin.scss";
import OverviewModal from "./Modals/OverviewModal";
import CreativeStoryModal from "./Modals/CreativeStoryModal";

/**
 * GGDB – Game Detail Admin Page
 * - Tek başlık/aksiyon bölgesi
 * - Overview modal varsayılan açık
 * - Edit/Save toggle ile formu düzenlenebilir/readonly yapar
 */
export default function GameDetailAdmin() {
  // oyun verisini güncelleyebilmek için state
  const [game, setGame] = useState({
    id: "6865a8e1c32780d4b5b981cd",
    title: "Little Nightmares III",
    cover:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop",
    source: "IGDB",
    completion: 56,
    completionText: "56/100 fields completed",
    publisher: "Bandai Namco Entertainment",
    developer: "Supermassive Games",
    studio: "Supermassive Games",
    releaseDate: "2025-10-10",
    platforms: [
      "Xbox Series X|S",
      "PlayStation 4",
      "PC (Microsoft Windows)",
      "PlayStation 5",
      "Xbox One",
      "Nintendo Switch",
    ],
    genres: ["Platform", "Puzzle", "Adventure"],
    tags: ["seksi"],
    metaScore: 60,
    ggdbRating: 8.7,
    mainStory: "",
    extras: "",
    completionist: "",
    gameEngine: ["Unreal Engine 5"],
  cast: ["Actor 1", "Actor 2"],
  dlcs: ["DLC Pack 1"],
  story: "Some story text here...",
  });

  const [openOverview, setOpenOverview] = useState(true);  // sayfa açılışında açık
  const [isEditing, setIsEditing] = useState(false);       // Edit/Save toggle

  const [openCreative, setOpenCreative] = useState(false);
const [creativeEditing, setCreativeEditing] = useState(false);

const [activeTab, setActiveTab] = useState("overview");


  const handleEditToggle = () => setIsEditing(true);

  const handleSave = (draft) => {
    // mock “persist” — gerçek projede API çağrısı yaparsın
    setGame(draft);
    setIsEditing(false);
  };

  const tabs = [
  { key: "overview", label: "Overview", open: () => setOpenOverview(true) },
  { key: "creative", label: "Creative & Story", open: () => setOpenCreative(true) },
  { key: "awards", label: "Awards" },
  { key: "system", label: "System" },
  { key: "languages", label: "Languages" },
  { key: "stores", label: "Store Links" },
  { key: "media", label: "Media" },
  { key: "credits", label: "Credits" },
  { key: "review", label: "Review" },
  { key: "trivia", label: "Trivia" },
  { key: "banner", label: "Banner / Trailer" },
];


  return (
    <div className="gd-page">
      {/* HERO */}
      <div className="gd-hero">
        <img src={game.cover} alt="Cover" className="gd-hero-img" />
      </div>

      {/* INFO STRIP */}
      <div className="gd-strip">
        <div className="gd-strip-col">
          <div className="gd-field">
            <div className="gd-label">Game ID</div>
            <div className="gd-value id">
              <span className="dot purple" /> {game.id}
            </div>
          </div>
        </div>
        <div className="gd-strip-col">
          <div className="gd-field">
            <div className="gd-label">Data Source</div>
            <div className="gd-value">
              <span className="ico">🎮</span> {game.source}
            </div>
            <div className="gd-sub">Data imported from IGDB database</div>
          </div>
        </div>
        <div className="gd-strip-col">
          <div className="gd-field">
            <div className="gd-label">Completion Progress</div>
            <div className="gd-progress">
              <div
                className="bar"
                style={{ width: `${game.completion}%` }}
                aria-label={`${game.completion}%`}
              />
              <span className="pct">{game.completion}%</span>
            </div>
            <div className="gd-sub">{game.completionText}</div>
          </div>
        </div>
      </div>

      {/* TITLE + ACTIONS (TEK) */}
      <div className="gd-title-row">
        <div className="left">
          <span className="game-ico">🎮</span>
          <h1>{game.title}</h1>
        </div>
        <div className="right">
          <button className="btn ghost">← Back</button>
          <button className="btn primary outline">🌐 View Game Page</button>

       {!isEditing ? (
  <button
    className="btn warning"
    onClick={() => {
      if (activeTab === "creative") {
        setOpenCreative(true);
        setOpenOverview(false);
      } else {
        setOpenOverview(true);
        setOpenCreative(false);
      }
      setIsEditing(true);
    }}
  >
    ✏️ Edit {activeTab === "creative" ? "Creative & Story" : "Overview"}
  </button>
) : (
  <button
    className="btn success"
    onClick={() => {
      const evName =
        activeTab === "creative"
          ? "ggdb:creative-save-request"
          : "ggdb:overview-save-request";
      window.dispatchEvent(new CustomEvent(evName));
      setIsEditing(false);
    }}
  >
    💾 Save
  </button>
)}

        </div>
      </div>

      {/* TABS (Overview varsayılan “aktif” görünür) */}
     <div className="gd-tabs">
  {tabs.map((t) => (
    <button
      key={t.key}
      className={`tab ${activeTab === t.key ? "active" : ""}`}
      onClick={() => {
        setActiveTab(t.key);
        // sadece ilgili modal açık kalsın
        if (t.key === "overview") {
          setOpenOverview(true);
          setOpenCreative(false);
        } else if (t.key === "creative") {
          setOpenCreative(true);
          setOpenOverview(false);
        } else {
          // diğer sekmelerde şimdilik ikisini de kapat
          setOpenOverview(false);
          setOpenCreative(false);
        }
        // sekme değişince edit modu kapansın (istersen)
        setIsEditing(false);
      }}
    >
      {t.label}
    </button>
  ))}
</div>


      {/* OVERVIEW MODAL: header yok; editability parent'tan gelir */}
     {/* OVERVIEW */}
<OverviewModal
  open={openOverview}
  onClose={() => setOpenOverview(false)}
  editable={isEditing}
  data={game}
  onSave={handleSave}
/>

{/* CREATIVE & STORY */}
<CreativeStoryModal
  open={openCreative}
  onClose={() => setOpenCreative(false)}
  editable={isEditing}
  data={game}
  onSave={(draft) => setGame({ ...game, ...draft })}
/>

    </div>
  );
}
