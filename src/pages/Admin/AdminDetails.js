import React, { useEffect, useState, useCallback } from "react";
import { useParams,useNavigate, Link } from "react-router-dom";
import "../../styles/pages/admin/_game-detail-admin.scss";
import OverviewModal from "./Modals/OverviewModal";
import CreativeStoryModal from "./Modals/CreativeStoryModal";
import AwardsModal from "./Modals/AwardsModal"
import SystemModal from "./Modals/SystemModal";
import LanguagesModal from "./Modals/LanguagesModal";
import { getGameById, updateGameById } from "../../services/admin.api";

export default function GameDetailAdmin() {
    const navigate = useNavigate();

  const params = useParams();
  const routeId = params?.id;

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [openOverview, setOpenOverview] = useState(true);
  const [openCreative, setOpenCreative] = useState(false);
  const [openAwards, setOpenAwards] = useState(false);
  const [openSystem, setOpenSystem] = useState(false);
  const [openLanguages, setOpenLanguages] = useState(false)

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // İlk yükleme: oyunu çek
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Fallback: eğer route id yoksa bir default id kullanılabilir
        const id = routeId || "6865a8e1c32780d4b5b981cd";
        const dto = await getGameById(id);

        // Progress gibi frontend-only alanları derive ediyoruz
        const viewModel = {
          ...dto,
          source: "IGDB",
          completion: 56,
          completionText: "56/100 fields completed",
          metaScore: dto.metacriticRating,   // modal’da metaScore key’i kullanılıyor
          ggdbRating: dto.ggdbRating,        // tutarlılık için
        };

        if (alive) setGame(viewModel);
      } catch (err) {
        if (alive) setError(err?.response?.data?.message || err?.message || "Load failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [routeId]);

  // Tek bir persist noktası: her iki modal da bunu çağıracak
  const handlePersist = useCallback(async (partialDraft) => {
    if (!game) return;
    const id = routeId || game.id;
    const merged = { ...game, ...partialDraft };

    // DTO’ya normalize (backend’in beklediği isimler)
    const dto = {
      id,
      title: merged.title,
      releaseDate: merged.releaseDate,
      studio: merged.studio || null,
      ggdbRating: Number.isFinite(+merged.ggdbRating) ? +merged.ggdbRating : merged.ggdbRating ?? null,
      metacriticRating: Number.isFinite(+merged.metaScore) ? +merged.metaScore : merged.metaScore ?? null,
      cover: merged.cover || null,
      video: merged.video || null,

      developer: merged.developer || null,
      publisher: merged.publisher || null,
      genres: Array.isArray(merged.genres) ? merged.genres : [],
      platforms: Array.isArray(merged.platforms) ? merged.platforms : [],
      story: merged.story || null,
      tags: Array.isArray(merged.tags) ? merged.tags : [],
      dlcs: Array.isArray(merged.dlcs) ? merged.dlcs : [],
      cast: Array.isArray(merged.cast) ? merged.cast : [],
      awards: merged.awards ?? null,
      gameEngine: Array.isArray(merged.gameEngine) ? merged.gameEngine : [],

      contentWarnings: merged.contentWarnings ?? [],
      ageRatings: merged.ageRatings ?? [],
      minRequirements: merged.minRequirements || null,
      recRequirements: merged.recRequirements || null,
      audioLanguages: Array.isArray(merged.audioLanguages) ? merged.audioLanguages : [],
      subtitleLanguages: Array.isArray(merged.subtitleLanguages) ? merged.subtitleLanguages : [],
      interfaceLanguages: Array.isArray(merged.interfaceLanguages) ? merged.interfaceLanguages : [],
    };

    try {
      setSaving(true);
      setError(null);
      await updateGameById(id, dto);
      setGame(merged);         // optimistic update
      setIsEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }, [game, routeId]);

  // UI durumları
  if (loading) {
    return (
      <div className="gd-page">
        <div className="gd-hero skeleton" />
        <div className="gd-strip"><div className="skeleton bar" /></div>
        <div className="gd-title-row"><div className="skeleton chip" /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="gd-page">
        <div className="error-box">Hata: {String(error)}</div>
      </div>
    );
  }
  if (!game) return null;

  const tabs = [
    { key: "overview", label: "Overview", open: () => setOpenOverview(true) },
    { key: "creative", label: "Creative & Story", open: () => setOpenCreative(true) },
    { key: "awards", label: "Awards", open: () => setOpenAwards(true) },
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
  <div
    className="gd-hero-bg"
    style={{ backgroundImage: `url(${game.cover})` }}
    aria-hidden
  />
  <div className="gd-hero-fore">
    <img src={game.cover} alt="Cover" />
  </div>
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
              <div className="bar" style={{ width: `${game.completion}%` }} aria-label={`${game.completion}%`} />
              <span className="pct">{game.completion}%</span>
            </div>
            <div className="gd-sub">{game.completionText}</div>
          </div>
        </div>
      </div>

      {/* TITLE + ACTIONS */}
      <div className="gd-title-row">
        <div className="left">
          <span className="game-ico">🎮</span>
          <h1>{game.title}</h1>
        </div>
        <div className="right">
          <button className="btn ghost" onClick={() => navigate(`/admin/games`)} >← Back</button>
          <button className="btn primary outline">🌐 View Game Page</button>

          {!isEditing ? (
  <button
    className="btn warning"
    onClick={() => {
      // Aktif sekmeye göre sadece ilgili modalı aç
      switch (activeTab) {
        case "creative":
          setOpenCreative(true);
          setOpenOverview(false);
          setOpenAwards(false);
          setOpenSystem(false);
          setOpenLanguages(false);
          break;
        case "awards":
          setOpenAwards(true);
          setOpenOverview(false);
          setOpenCreative(false);
          setOpenSystem(false);
          setOpenLanguages(false);
          break;
        case "system":
          setOpenSystem(true);
          setOpenOverview(false);
          setOpenCreative(false);
          setOpenAwards(false);
          setOpenLanguages(false);
          break;
        case "languages":
          setOpenLanguages(true);
          setOpenSystem(false);
          setOpenOverview(false);
          setOpenCreative(false);
          setOpenAwards(false);
          break;
        default: // overview
          setOpenOverview(true);
          setOpenCreative(false);
          setOpenAwards(false);
          setOpenSystem(false);
          setOpenLanguages(false);
          break;
      }
      setIsEditing(true);
    }}
    disabled={saving}
  >
    {`✏️ Edit ${
      activeTab === "creative"   ? "Creative & Story" :
      activeTab === "awards"     ? "Awards" :
      activeTab === "system"     ? "System" :
      activeTab === "languages"  ? "Languages" :
                                   "Overview"
    }`}
  </button>
) : (
  <button
    className="btn success"
    onClick={() => {
      const evName =
        activeTab === "creative"   ? "ggdb:creative-save-request" :
  activeTab === "awards"     ? "ggdb:awards-save-request"   :
  activeTab === "system"     ? "ggdb:system-save-request"   :
 activeTab === "languages"  ? "ggdb:languages-save-request" :
  "ggdb:overview-save-request";
      window.dispatchEvent(new CustomEvent(evName));
      setIsEditing(false);
    }}
    disabled={saving}
  >
    {saving ? "⏳ Saving..." : "💾 Save"}
  </button>
)}
        </div>
      </div>

      {/* TABS */}
      <div className="gd-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => {
              setActiveTab(t.key);
              if (t.key === "overview") {
                setOpenOverview(true);
                setOpenCreative(false);
                setOpenAwards(false);
                setOpenSystem(false);
                setOpenLanguages(false);
              } else if (t.key === "creative") {
                setOpenCreative(true);
                setOpenOverview(false);
                setOpenAwards(false);
                setOpenSystem(false);
                setOpenLanguages(false);
              } else if (t.key === "awards") {
                setOpenAwards(true);
                setOpenOverview(false);
                setOpenCreative(false);
                setOpenSystem(false);
                setOpenLanguages(false);
              }
              else if (t.key === "system") {
  setOpenSystem(true);
  setOpenOverview(false);
  setOpenCreative(false);
  setOpenAwards(false);
  setOpenLanguages(false);
}
else if (t.key === "languages") {
  setOpenLanguages(true);
  setOpenOverview(false);
  setOpenCreative(false);
  setOpenAwards(false);
  setOpenSystem(false);
}
              else {
                setOpenOverview(false);
                setOpenCreative(false);
                setOpenAwards(false);
                setOpenSystem(false);
                setOpenLanguages(false);
              }
              setIsEditing(false);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MODALS */}
      <OverviewModal
        open={openOverview}
        onClose={() => setOpenOverview(false)}
        editable={isEditing}
        data={game}
        onSave={handlePersist}       // tek yerden persist
      />

      <CreativeStoryModal
        open={openCreative}
        onClose={() => setOpenCreative(false)}
        editable={isEditing}
        data={game}
        onSave={handlePersist}       // tek yerden persist
      />

 <AwardsModal
  open={openAwards}
  onClose={() => setOpenAwards(false)}
  editable={isEditing}
  data={game}
  onSave={handlePersist}
/>

<SystemModal
  open={openSystem}
  onClose={() => setOpenSystem(false)}
  editable={isEditing}
  data={game}
  onSave={handlePersist}
/>

<LanguagesModal
  open={openLanguages}
  onClose={() => setOpenLanguages(false)}
  editable={isEditing}
  data={game}
  onSave={handlePersist}
/>
    </div>
  );
}
