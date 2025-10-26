import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/pages/admin/_game-detail-admin.scss";
import OverviewModal from "./Modals/OverviewModal";
import CreativeStoryModal from "./Modals/CreativeStoryModal";
import AwardsModal from "./Modals/AwardsModal";
import SystemModal from "./Modals/SystemModal";
import LanguagesModal from "./Modals/LanguagesModal";
import StoreLinksModal from "./Modals/StoreLinksModal";
import MediaModal from "./Modals/MediaModal";
import CreditsModal from "./Modals/CreditsModal";
import BannerMediaModal from "./Modals/BannerMediaModal";
import { getGameById, updateGameById } from "../../services/admin.api";







  // ---- Helpers: "dolu" sayma
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isNonNullNumber = (v) => typeof v === "number" && Number.isFinite(v);
const hasItems = (arr) => Array.isArray(arr) && arr.length > 0;

// Metin/array alanlarını "dolu" kabul etmek için
const nonEmpty = (v) =>
  isNonEmptyString(v) || isNonNullNumber(v) || (Array.isArray(v) && v.length > 0);


function calculateCompletionFields(game) {
  if (!game) return { percent: 0, filled: 0, total: 0 };

  // --- Yardımcı "dolu" sayma kuralı ---
  const isFilled = (v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "number") return !isNaN(v);
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return false;
  };

  // --- Kontrol edilecek alanları topla ---
  const keys = Object.keys(game);

  let total = 0;
  let filled = 0;

  for (const key of keys) {
    // id veya sistem alanlarını dahil etme
    if (["id", "_id", "completion", "completionText"].includes(key)) continue;

    total++;
    if (isFilled(game[key])) filled++;
  }

  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
  return { percent, filled, total };
}








const parseYouTubeId = (u) => {
  if (!u) return null;
  try {
    const url = new URL(u);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.slice(1);
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2];
      if (url.pathname.startsWith("/embed/"))  return url.pathname.split("/")[2];
    }
  } catch {}
  return null;
};

// Seçilmiş (tekil) görsel/video alanlarını tek tipe indir
const normalizeSelectedImage = (x) =>
  !x ? null : ({
    url: x.url ?? x.URL ?? null,
    title: x.title ?? x.Title ?? "Image",
    metaDatas: x.metaDatas ?? x.MetaDatas ?? [],
  });

const normalizeSelectedVideo = (x) =>
  !x ? null : ({
    url: x.url ?? x.URL ?? null,
    title: x.title ?? x.Title ?? "Trailer",
    youTubeId: x.youTubeId ?? x.YouTubeId ?? parseYouTubeId(x.url ?? x.URL ?? ""),
    metaDatas: x.metaDatas ?? x.MetaDatas ?? [],
  });

// DTO’ya gidecek obje üreticileri (küçük harf alan adları!)
const toImgDto = (url, title) =>
  url ? ({ url, title: title || "Image", metaDatas: [] }) : null;

const toVidDto = (url, title) =>
  url ? ({ url, title: title || "Trailer", youTubeId: parseYouTubeId(url), metaDatas: [] }) : null;

function normalizeGallery(dto) {
  const g =
    dto?.gallery ??
    dto?.Gallery ??
    {}; // hiç yoksa boş

  // Olası image alan adları
  const imgArrRaw =
    g?.images ?? g?.Images ?? g?.image ?? g?.Image ?? [];

  // Olası video alan adları
  const vidArrRaw =
    g?.videos ?? g?.Videos ?? g?.video ?? g?.Video ?? [];

  const images = Array.isArray(imgArrRaw)
    ? imgArrRaw
        .filter(Boolean)
        .map((x, i) => ({
          url: x.url ?? x.URL ?? "",
          title: x.title ?? x.Title ?? `Screenshot ${i + 1}`,
          metaDatas: x.metaDatas ?? x.MetaDatas ?? [],
        }))
        .filter((x) => x.url)
    : [];

  const videos = Array.isArray(vidArrRaw)
    ? vidArrRaw
        .filter(Boolean)
        .map((x, i) => ({
          url: x.url ?? x.URL ?? "",
          title: x.title ?? x.Title ?? `Trailer ${i + 1}`,
          youTubeId: x.youTubeId ?? x.YouTubeId ?? null,
          metaDatas: x.metaDatas ?? x.MetaDatas ?? [],
        }))
        .filter((x) => x.url || x.youTubeId)
    : [];

  // Bazı API’ler images/videos’ı direkt köke koyabilir; ekstra fallback:
  const imagesTop = Array.isArray(dto?.images ?? dto?.Images)
    ? (dto.images ?? dto.Images).map((x, i) => ({
        url: x.url ?? x.URL ?? "",
        title: x.title ?? x.Title ?? `Screenshot ${i + 1}`,
        metaDatas: x.metaDatas ?? x.MetaDatas ?? [],
      })).filter(x => x.url)
    : [];

  const videosTop = Array.isArray(dto?.videos ?? dto?.Videos)
    ? (dto.videos ?? dto.Videos).map((x, i) => ({
        url: x.url ?? x.URL ?? "",
        title: x.title ?? x.Title ?? `Trailer ${i + 1}`,
        youTubeId: x.youTubeId ?? x.YouTubeId ?? null,
        metaDatas: x.metaDatas ?? x.MetaDatas ?? [],
      })).filter(x => x.url || x.youTubeId)
    : [];

  return {
    images: images.length ? images : imagesTop,
    videos: videos.length ? videos : videosTop,
  };
}




export default function GameDetailAdmin() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [openOverview, setOpenOverview] = useState(true);
  const [openCreative, setOpenCreative] = useState(false);
  const [openAwards, setOpenAwards] = useState(false);
  const [openSystem, setOpenSystem] = useState(false);
  const [openLanguages, setOpenLanguages] = useState(false);
  const [openStores, setOpenStores] = useState(false);
  const [openMedia, setOpenMedia] = useState(false);
  const [openCredits, setOpenCredits] = useState(false);
  const [openBanner, setOpenBanner] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
 

 

  

  useEffect(() => {
  let alive = true;
  (async () => {
    try {
      setLoading(true);
      setError(null);

      const id = routeId || "6865a8e1c32780d4b5b981cd";
      const dto = await getGameById(id);
      console.log("[ADMIN] raw dto:", dto);
      console.log("[ADMIN] dto.gallery:", dto?.gallery ?? dto?.Gallery);

      // >>> BURADA dto hazır, normalize edebiliriz
      const { images, videos } = normalizeGallery(dto);

      console.log("[ADMIN] normalized images/videos:", { images, videos, ilen: images.length, vlen: videos.length });

      const viewModel = {
        ...dto,
        franchise:  dto.franchise  ?? dto.Franchise  ?? "",
        director:   dto.director   ?? dto.Director   ?? "",
        composer:   dto.composer   ?? dto.Composer   ?? "",
        inspiredBy: dto.inspiredBy ?? dto.InspiredBy ?? "",
        story:      dto.story      ?? dto.Story      ?? "",
        engines:    Array.isArray(dto.engines    ?? dto.Engines)    ? (dto.engines    ?? dto.Engines)    : [],
        soundtrack: Array.isArray(dto.soundtrack ?? dto.Soundtrack) ? (dto.soundtrack ?? dto.Soundtrack) : [],
        cast:       Array.isArray(dto.cast       ?? dto.Cast)       ? (dto.cast       ?? dto.Cast)       : [],
        dlcs:       Array.isArray(dto.dlcs       ?? dto.Dlcs)       ? (dto.dlcs       ?? dto.Dlcs)       : [],
        source: "IGDB",
        completion: 56,
        completionText: "56/100 fields completed",
        metaScore: dto.metacriticRating,
        ggdbRating: dto.ggdbRating,
        images,
        videos,
        crew: dto.crew ?? dto.Crew ?? [],
        timeToBeat_Hastily: dto.timeToBeat_Hastily ?? dto.TimeToBeat_Hastily ?? null,
        timeToBeat_Normally: dto.timeToBeat_Normally ?? dto.TimeToBeat_Normally ?? null, 
        timeToBeat_Completely: dto.timeToBeat_Completely ?? dto.TimeToBeat_Completely ?? null,
        gameDirector: dto.gameDirector ?? dto.GameDirector ?? "",
        writers: dto.writers ?? dto.Writers ?? [],
        artDirector: dto.artDirector ?? dto.ArtDirector ?? "",
        leadActors: dto.leadActors ?? dto.LeadActors ?? [],
        voiceActors: dto.voiceActors ?? dto.VoiceActors ?? [],
        musicComposer: dto.musicComposer ?? dto.MusicComposer ?? "",
        cinematicsVfxTeam: dto.cinematicsVfxTeam ?? dto.CinematicsVfxTeam ?? [],
        Featured_Section_Background: normalizeSelectedImage(dto.featured_Section_Background ?? dto.Featured_Section_Background),
        Poster_Image: normalizeSelectedImage(dto.poster_Image ?? dto.Poster_Image),
        Poster_Video: normalizeSelectedVideo(dto.poster_Video ?? dto.Poster_Video),
       
      };

const comp = calculateCompletionFields(viewModel);
viewModel.completion = comp.percent;
viewModel.completionText = `${comp.filled}/${comp.total} fields filled`;

      if (alive) setGame(viewModel);
    } catch (err) {
      if (alive) setError(err?.response?.data?.message || err?.message || "Load failed");
    } finally {
      if (alive) setLoading(false);
    }
  })();
  return () => {
    alive = false;
  };
}, [routeId]);




  const handlePersist = useCallback(
    async (partialDraft) => {
      if (!game) return;
      const id = routeId || game.id;
      const merged = { ...game, ...partialDraft };

      // draft string URL gönderebilir → objeye çevir
     const toImgObj = (url, title) =>
       url ? { URL: url, Title: title, MetaDatas: [] } : null;
     const toVidObj = (url, title) =>
       url ? { URL: url, Title: title, MetaDatas: [] } : null;

     const byUrl = (url) =>
      (merged.images || []).find(i => (i.url ?? i.URL) === url) ||
      (url ? { url, title: "", metaDatas: [] } : null);

      const dto = {
        id,
        title: merged.title,
        releaseDate: merged.releaseDate,
        studio: merged.studio || null,
        ggdbRating: Number.isFinite(+merged.ggdbRating) ? +merged.ggdbRating : merged.ggdbRating ?? null,
        metacriticRating: Number.isFinite(+merged.metaScore) ? +merged.metaScore : merged.metaScore ?? null,
        cover: merged.cover || null,
        video: merged.video || null,

        franchise:  merged.franchise || null,
        director:   merged.director  || null,
        composer:   merged.MusicComposer  || null,
        inspiredBy: merged.inspiredBy|| null,
        story:      merged.story     || null, // Story'yi burada gönderiyoruz (ayrıca yukarıda da story var, tek olsun)

        engines:    Array.isArray(merged.engines)    ? merged.engines    : [],
        soundtrack: Array.isArray(merged.soundtrack) ? merged.soundtrack : [],
        cast:       Array.isArray(merged.cast)       ? merged.cast       : [],
        dlcs:       Array.isArray(merged.dlcs)       ? merged.dlcs       : [],

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

        soundtrack: Array.isArray(merged.soundtrack) ? merged.soundtrack : [],

        storeLinks: Array.isArray(merged.storeLinks) ? merged.storeLinks : [],

        images: Array.isArray(merged.images) ? merged.images : [],
        videos: Array.isArray(merged.videos) ? merged.videos : [],

        crew: Array.isArray(merged.crew) ? merged.crew : [], 

        timeToBeat_Hastily:    merged.timeToBeat_Hastily    !== "" && merged.timeToBeat_Hastily    != null ? Number(merged.timeToBeat_Hastily)    : null,
        timeToBeat_Normally:   merged.timeToBeat_Normally   !== "" && merged.timeToBeat_Normally   != null ? Number(merged.timeToBeat_Normally)   : null,
        timeToBeat_Completely: merged.timeToBeat_Completely !== "" && merged.timeToBeat_Completely != null ? Number(merged.timeToBeat_Completely) : null,
        
        gameDirector: merged.gameDirector ?? "",
        writers: Array.isArray(merged.writers) ? merged.writers : [],
        artDirector: merged.artDirector ?? "",
        leadActors: Array.isArray(merged.leadActors) ? merged.leadActors : [],
        voiceActors: Array.isArray(merged.voiceActors) ? merged.voiceActors : [],
        musicComposer: merged.musicComposer ?? "",
        cinematicsVfxTeam: Array.isArray(merged.cinematicsVfxTeam) ? merged.cinematicsVfxTeam : [],

        Featured_Section_Background: 
        (Object.prototype.hasOwnProperty.call(partialDraft, "featuredImageObj") || 
         Object.prototype.hasOwnProperty.call(partialDraft, "featuredBackground"))
          ? (partialDraft.featuredImageObj || byUrl(partialDraft.featuredBackground) || null)
          : (merged.Featured_Section_Background ?? null),

      Poster_Image:
        (Object.prototype.hasOwnProperty.call(partialDraft, "posterImageObj") || 
         Object.prototype.hasOwnProperty.call(partialDraft, "posterImage"))
          ? (partialDraft.posterImageObj || byUrl(partialDraft.posterImage) || null)
          : (merged.Poster_Image ?? null),

      Poster_Video:
        (Object.prototype.hasOwnProperty.call(partialDraft, "trailerVideoObj") || 
         Object.prototype.hasOwnProperty.call(partialDraft, "trailerVideo"))
          ? (partialDraft.trailerVideoObj || (partialDraft.trailerVideo ? { url: partialDraft.trailerVideo, title: "Trailer 1", metaDatas: [] } : null))
          : (merged.Poster_Video ?? null),
        
      };

      try {
        setSaving(true);
        setError(null);
        await updateGameById(id, dto);
        const after = {
  ...merged,
  Featured_Section_Background: dto.Featured_Section_Background,
  Poster_Image: dto.Poster_Image,
  Poster_Video: dto.Poster_Video,
};

const comp2 = calculateCompletionFields(after);
after.completion = comp2.percent;
after.completionText = `${comp2.filled}/${comp2.total} fields filled`;

setGame(after);
        setIsEditing(false);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [game, routeId]
  );

  

  if (loading) {
    return (
      <div className="gd-page">
        <div className="gd-hero skeleton" />
        <div className="gd-strip">
          <div className="skeleton bar" />
        </div>
        <div className="gd-title-row">
          <div className="skeleton chip" />
        </div>
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
    { key: "system", label: "System", open: () => setOpenSystem(true) },
    { key: "languages", label: "Languages", open: () => setOpenLanguages(true) },
    { key: "stores", label: "Store Links", open: () => setOpenStores(true) },
    { key: "media", label: "Media", open: () => setOpenMedia(true) },
    { key: "credits", label: "Credits", open: () => setOpenCredits(true) },
    { key: "review", label: "Review" },
    { key: "trivia", label: "Trivia" },
    { key: "banner", label: "Banner / Trailer", open: () => setOpenBanner(true) },
  ];

  return (
    <div className="gd-page">
      {/* HERO */}
      <div className="gd-hero">
        <div className="gd-hero-bg" style={{ backgroundImage: `url(${game.cover})` }} aria-hidden />
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
          <button className="btn ghost" onClick={() => navigate(`/admin/games`)}>
            ← Back
          </button>
          <button className="btn primary outline">🌐 View Game Page</button>

          {!isEditing ? (
            <button
              className="btn warning"
              onClick={() => {
                switch (activeTab) {
                  case "creative":
                    setOpenCreative(true);
                    setOpenOverview(false);
                    setOpenAwards(false);
                    setOpenSystem(false);
                    setOpenLanguages(false);
                    setOpenStores(false);
                    setOpenMedia(false);
                    setOpenCredits(false);
                    setOpenBanner(false);
                    break;
                  case "awards":
                    setOpenAwards(true);
                    setOpenOverview(false);
                    setOpenCreative(false);
                    setOpenSystem(false);
                    setOpenLanguages(false);
                    setOpenStores(false);
                    setOpenMedia(false);
                    setOpenCredits(false);
                    setOpenBanner(false);
                    break;
                  case "system":
                    setOpenSystem(true);
                    setOpenOverview(false);
                    setOpenCreative(false);
                    setOpenAwards(false);
                    setOpenLanguages(false);
                    setOpenStores(false);
                    setOpenMedia(false);
                    setOpenCredits(false);
                    setOpenBanner(false);
                    break;
                  case "languages":
                    setOpenLanguages(true);
                    setOpenSystem(false);
                    setOpenOverview(false);
                    setOpenCreative(false);
                    setOpenAwards(false);
                    setOpenStores(false);
                    setOpenMedia(false);
                    setOpenCredits(false);
                    setOpenBanner(false);
                    break;
                  case "stores":
                    setOpenStores(true);
                    setOpenOverview(false);
                    setOpenCreative(false);
                    setOpenAwards(false);
                    setOpenSystem(false);
                    setOpenLanguages(false);
                    setOpenMedia(false);
                    setOpenCredits(false);
                    setOpenBanner(false);
                    break;
                  case "media":
                    setOpenMedia(true);
                    setOpenOverview(false);
                    setOpenCreative(false);
                    setOpenAwards(false);
                    setOpenSystem(false);
                    setOpenLanguages(false);
                    setOpenStores(false);
                    setOpenCredits(false);
                    setOpenBanner(false);
                    break;

                  case "credits":
                    setOpenCredits(true);
                    setOpenOverview(false);
                    setOpenCreative(false);
                    setOpenAwards(false);
                    setOpenSystem(false);
                    setOpenLanguages(false);
                    setOpenStores(false);
                    setOpenMedia(false);
                    setOpenBanner(false);
                    break;
                  case "banner":
                    setOpenBanner(true);
                    setOpenOverview(false);
                    setOpenCreative(false);
                    setOpenAwards(false);
                    setOpenSystem(false);
                    setOpenLanguages(false);
                    setOpenStores(false);
                    setOpenMedia(false);
                    setOpenCredits(false);
                    break;
                  default:
                    setOpenOverview(true);
                    setOpenCreative(false);
                    setOpenAwards(false);
                    setOpenSystem(false);
                    setOpenLanguages(false);
                    setOpenStores(false);
                    setOpenMedia(false);
                    setOpenCredits(false);
                    setOpenBanner(false);
                    break;
                }
                setIsEditing(true);
              }}
              disabled={saving}
            >
              {`✏️ Edit ${
                activeTab === "creative"
                  ? "Creative & Story"
                  : activeTab === "awards"
                  ? "Awards"
                  : activeTab === "system"
                  ? "System"
                  : activeTab === "languages"
                  ? "Languages"
                  : activeTab === "stores"
                  ? "Store Links"
                  : activeTab === "media"
                  ? "Media"
                  : activeTab === "credits"
                  ? "Credits"
                  : activeTab === "banner"
                  ? "Banner"
                  : "Overview"
              }`}
            </button>
          ) : (
            <button
              className="btn success"
              onClick={() => {
                const evName =
                  activeTab === "creative"
                    ? "ggdb:creative-save-request"
                    : activeTab === "awards"
                    ? "ggdb:awards-save-request"
                    : activeTab === "system"
                    ? "ggdb:system-save-request"
                    : activeTab === "languages"
                    ? "ggdb:languages-save-request"
                    : activeTab === "stores"
                    ? "ggdb:stores-save-request"
                    : activeTab === "media"
                    ? "ggdb:media-save-request"
                    : activeTab === "credits"
                    ? "ggdb:credits-save-request"
                    : activeTab === "banner"
                    ? "ggdb:banner-save-request"
                    : "ggdb:overview-save-request";
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

              setOpenOverview(false);
              setOpenCreative(false);
              setOpenAwards(false);
              setOpenSystem(false);
              setOpenLanguages(false);
              setOpenStores(false);
              setOpenMedia(false);
              setOpenCredits(false);
              setOpenBanner(false);

              if (t.open) t.open();
              setIsEditing(false);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MODALS */}
      <OverviewModal open={openOverview} onClose={() => setOpenOverview(false)} editable={isEditing} data={game} onSave={handlePersist} />
      <CreativeStoryModal open={openCreative} onClose={() => setOpenCreative(false)} editable={isEditing} data={game} onSave={handlePersist} />
      <AwardsModal open={openAwards} onClose={() => setOpenAwards(false)} editable={isEditing} data={game} onSave={handlePersist} />
      <SystemModal open={openSystem} onClose={() => setOpenSystem(false)} editable={isEditing} data={game} onSave={handlePersist} />
      <LanguagesModal open={openLanguages} onClose={() => setOpenLanguages(false)} editable={isEditing} data={game} onSave={handlePersist} />
      <StoreLinksModal open={openStores} onClose={() => setOpenStores(false)} editable={isEditing} data={game} onSave={handlePersist} />
      <MediaModal open={openMedia} onClose={() => setOpenMedia(false)} editable={isEditing} data={game} onSave={handlePersist} />
      <CreditsModal
        open={openCredits}
        onClose={() => setOpenCredits(false)}
        editable={isEditing}
        data={game}
        onSave={handlePersist}
      />
      <BannerMediaModal
  open={openBanner}
  onClose={() => setOpenBanner(false)}
  editable={isEditing}
  data={game}
  onSave={handlePersist}
/>
    </div>
  );
}
