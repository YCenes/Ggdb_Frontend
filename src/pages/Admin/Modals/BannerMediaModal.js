// src/pages/admin/modals/BannerMediaModal.jsx
import React, { useEffect, useState } from "react";
import "../../../styles/pages/admin/_game-detail-admin.scss";

/** Basit bottom modal (header actions YOK) */
function BottomModal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="bm-wrap" role="dialog" aria-modal="true">
      <div className="bm-backdrop" onClick={onClose} />
      <div className="bm-sheet full">
        <div className="bm-body">{children}</div>
      </div>
    </div>
  );
}

const hiRes = (u) => {
  if (!u) return u;
  return u.replace(
    /\/t_(thumb|cover_small|cover_big|logo_med|screenshot_med|720p|screenshot_big|cover_big)\//,
    "/t_1080p/"
  );
};

// Objeleri tek tipe indir (url/title/metaDatas / youTubeId)
const normImage = (obj) => {
  if (!obj) return null;
  const url = obj.url ?? obj.URL ?? null;
  if (!url) return null;
  return {
    url,
    title: obj.title ?? obj.Title ?? "",
    metaDatas: (obj.metaDatas ?? obj.MetaDatas ?? []).map((m) => ({
      label: m?.label ?? m?.Label ?? null,
      value: m?.value ?? m?.Value ?? null,
    })),
  };
};
const normVideo = (obj) => {
  if (!obj) return null;
  const url = obj.url ?? obj.URL ?? null;
  return {
    url,
    title: obj.title ?? obj.Title ?? "",
    youTubeId: obj.youTubeId ?? obj.YouTubeId ?? null,
    metaDatas: (obj.metaDatas ?? obj.MetaDatas ?? []).map((m) => ({
      label: m?.label ?? m?.Label ?? null,
      value: m?.value ?? m?.Value ?? null,
    })),
  };
};

// Sadece YouTube id çekmek için
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

export default function BannerMediaModal({ open, onClose, editable, data, onSave }) {
  // Bilgi amaçlı listeler (render/grid için)
  const availableImages = data?.images || [];
  const availableVideos = data?.videos || [];

  // Mevcut seçili objeleri normalize et
  const initialFeatObj   = normImage(data?.Featured_Section_Background ?? data?.featured_Section_Background);
  const initialPosterObj = normImage(data?.Poster_Image ?? data?.poster_Image);
  const initialVideoObj  = normVideo(data?.Poster_Video ?? data?.poster_Video);

  // --- Taslak: render için URL + SAVE için tam obje ---
  const [draft, setDraft] = useState(() => ({
    featuredBackground: initialFeatObj?.url ?? null, // sadece önizleme
    featuredImageObj:   initialFeatObj ?? null,      // SAVE → tam obje
    posterImage:        initialPosterObj?.url ?? null,
    posterImageObj:     initialPosterObj ?? null,
    trailerVideo:       initialVideoObj?.url ?? null,
    trailerVideoObj:    initialVideoObj ?? null,
  }));

  // Grid seçim highlight
  const initialIdx = Math.max(
    (data?.images || []).findIndex((i) => (i?.url ?? i?.URL) === (initialFeatObj?.url ?? null)),
    0
  );
  const [selectedBackgroundIndex, setSelectedBackgroundIndex] = useState(initialIdx);

  // data/open değişince draft’ı yenile
  useEffect(() => {
    const feat   = normImage(data?.Featured_Section_Background ?? data?.featured_Section_Background);
    const poster = normImage(data?.Poster_Image ?? data?.poster_Image);
    const video  = normVideo(data?.Poster_Video ?? data?.poster_Video);

    setDraft({
      featuredBackground: feat?.url ?? null,
      featuredImageObj:   feat ?? null,
      posterImage:        poster?.url ?? null,
      posterImageObj:     poster ?? null,
      trailerVideo:       video?.url ?? null,
      trailerVideoObj:    video ?? null,
    });

    setSelectedBackgroundIndex(
      Math.max(
        (data?.images || []).findIndex((i) => (i?.url ?? i?.URL) === (feat?.url ?? null)),
        0
      )
    );
  }, [data, open]);

  // Parent Save → tam objeler draft’ta mevcut
  useEffect(() => {
    const handler = () => onSave(draft);
    window.addEventListener("ggdb:banner-save-request", handler);
    return () => window.removeEventListener("ggdb:banner-save-request", handler);
  }, [draft, onSave]);

  // Grid’den seçim: önizleme için hiRes, SAVE için tam obje
  const handleBackgroundSelect = (image, index) => {
    // availableImages normalizeGallery’den geliyor (url/title/metaDatas)
    // yine de güvenli olmak için normImage’tan geçir
    const imgObj = normImage(image);
    setSelectedBackgroundIndex(index);
    setDraft((d) => ({
      ...d,
      featuredBackground: hiRes(imgObj.url), // sadece gösterim
      featuredImageObj: imgObj,              // SAVE’te bu gidecek (title/metaDatas dahil)
    }));
  };

  // ---- DEBUG
  console.log("[Banner] Featured obj (incoming):", data?.Featured_Section_Background || data?.featured_Section_Background);
  console.log("[Banner] Poster_Image obj (incoming):", data?.Poster_Image || data?.poster_Image);
  console.log("[Banner] Poster_Video obj (incoming):", data?.Poster_Video || data?.poster_Video);

  // --- Render değerleri ---
  const featuredUrl = hiRes(draft.featuredBackground ?? null);
  const posterUrl   = hiRes(draft.posterImage ?? null);
  const videoUrl    = draft.trailerVideo ?? null;

  const ytId = draft.trailerVideoObj?.youTubeId || parseYouTubeId(videoUrl ?? null);
  const videoThumb = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="banner-media-container">
        {/* Header */}
        <div className="banner-header">
          <div className="header-info">
            <div className="modal-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="modal-icon">
                <path d="M4 3a2 2 0 00-2 2v1.816a14.94 14.94 0 008 2.184 14.94 14.94 0 008-2.184V5a2 2 0 00-2-2H4z"/>
                <path d="M6.447 8.894A12.95 12.95 0 0010 9a12.95 12.95 0 003.553-.106L18 11v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5l4.447-2.106z"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title">Banner & Media Override</h2>
              <p className="modal-subtitle">Customize visual elements and override game media</p>
            </div>
          </div>
        </div>

        {/* Media Info */}
        <div className="media-availability">
          <div className="availability-indicator">
            <div className="status-dot-green"></div>
            <span>{availableImages.length} images + {availableVideos.length} videos available (from IGDB)</span>
          </div>
        </div>

        {/* Featured Section Background */}
        <div className="section-card featured-bg-section">
          <div className="section-title">
            <span className="title-icon">🌟</span>
            <h3 className="section-heading featured-heading">Featured Section Background</h3>
          </div>
          <p className="section-desc">Background image to be used when featured on the main page</p>

          <div className="selection-hint">
            <span>💡</span>
            <span>{availableImages.length} images available - click to select</span>
          </div>

          <div className="featured-preview">
            {featuredUrl ? (
              <img
                src={featuredUrl}
                alt="Featured preview"
                draggable={false}
                className="featured-img"
              />
            ) : (
              <div className="featured-placeholder" />
            )}
            <div className="featured-badge">🎮 Featured Override</div>
          </div>

          {/* Image Selection Grid */}
          {editable && availableImages.length > 0 && (
            <div className="image-grid">
              {availableImages.slice(0, 6).map((image, index) => (
                <div
                  key={index}
                  className={`image-thumb ${selectedBackgroundIndex === index ? "selected" : ""}`}
                  onClick={() => handleBackgroundSelect(image, index)}
                  title={image.title || `Image ${index + 1}`}
                >
                  <img src={image.url ?? image.URL} alt={image.title || `Image ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Sections Grid */}
        <div className="sections-grid">
          {/* Poster Image */}
          <div className="section-card poster-section">
            <div className="section-title">
              <span className="title-icon">🖼️</span>
              <h3 className="section-heading poster-heading">Poster Image</h3>
            </div>
            <p className="section-desc">Poster to be used in game cards and detail pages</p>

            <div className="poster-wrapper">
              <div className="poster-card">
                <div
                  className="poster-bg"
                  style={{ backgroundImage: posterUrl ? `url(${posterUrl})` : null }}
                >
                  <div className="poster-gradient">
                    <div className="poster-text">
                      <div className="poster-title-1">{data?.title?.split(" ")[0] || ""}</div>
                      <div className="poster-title-2">{data?.title?.split(" ").slice(1).join(" ") || ""}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trailer/Video */}
          <div className="section-card trailer-section">
            <div className="section-title">
              <span className="title-icon">🎬</span>
              <h3 className="section-heading trailer-heading">Trailer / Video</h3>
            </div>
            <p className="section-desc">Game trailer or gameplay footage</p>

            <div className="video-availability">
              <span>🎥</span>
              <span>{(data?.videos || []).length} videos available (from IGDB)</span>
            </div>

            <div className="video-wrapper">
              <a
                className="video-preview"
                href={videoUrl || undefined}
                target="_blank"
                rel="noreferrer"
                aria-label="Open trailer"
              >
                {ytId && (
                  <img
                    className="video-thumb"
                    src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                    alt="Trailer thumbnail"
                    onError={(e) => {
                      if (ytId && e.currentTarget.dataset.fallback !== "1") {
                        e.currentTarget.dataset.fallback = "1";
                        e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                      }
                    }}
                  />
                )}
                <div className="play-btn" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .banner-media-container { padding: 0; background: transparent; }
        .banner-header { padding: 24px 24px 0 24px; margin-bottom: 32px; }
        .header-info { display: flex; align-items: center; gap: 12px; }
        .modal-icon-wrapper { width: 32px; height: 32px; background: #8b5cf6; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .modal-icon { color: white; }
        .modal-title { font-size: 20px; font-weight: 700; margin: 0; color: var(--text); }
        .modal-subtitle { font-size: 14px; color: var(--muted); margin: 4px 0 0 0; }

        .media-availability { padding: 0 24px; margin-bottom: 32px; }
        .availability-indicator { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--green); }
        .status-dot-green { width: 8px; height: 8px; background: var(--green); border-radius: 50%; }

        .section-card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--card-radius); box-shadow: var(--shadow); padding: 32px; }
        .featured-bg-section { margin: 0 24px 32px 24px; }
        .section-title { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .section-heading { font-size: 18px; font-weight: 700; margin: 0; }
        .featured-heading { color: var(--amber); }
        .poster-heading { color: #06b6d4; }
        .trailer-heading { color: var(--accent-2); }
        .section-desc { font-size: 14px; color: var(--muted); margin: 0 0 16px 0; }

        .selection-hint { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--amber); margin-bottom: 20px; }

        .featured-preview { height: 240px; border-radius: 12px; background: #0b1220; position: relative; overflow: hidden; }
        .featured-img { width: 100%; height: 100%; object-fit: contain; display: block; image-rendering: auto; }
        .featured-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%); }
        .featured-badge { position: absolute; top: 16px; left: 16px; background: #f97316; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; }

        .image-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
        .image-thumb { aspect-ratio: 16/9; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s; }
        .image-thumb:hover { border-color: var(--line); }
        .image-thumb.selected { border-color: var(--amber); }
        .image-thumb img { width: 100%; height: 100%; object-fit: cover; }

        .sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 0 24px 24px 24px; }

        .video-availability { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--green); margin-bottom: 20px; }

        .poster-wrapper { display: flex; justify-content: center; margin-top: 24px; }
        .poster-card { width: 140px; height: 196px; }
        .poster-bg { width: 100%; height: 100%; border-radius: 12px; background: linear-gradient(180deg, #d97706 0%, #ea580c 100%); background-size: cover; background-position: center; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .poster-gradient { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 16px; border-radius: 0 0 12px 12px; }
        .poster-text { text-align: center; color: white; }
        .poster-title-1 { font-size: 14px; font-weight: bold; letter-spacing: 1px; }
        .poster-title-2 { font-size: 18px; font-weight: bold; letter-spacing: 2px; }

        .video-wrapper { margin-top: 20px; }
        .video-preview { height: 160px; border-radius: 12px; background: #0b1220; position: relative; overflow: hidden; display: block; text-decoration: none; }
        .video-thumb { width: 100%; height: 100%; object-fit: contain; display: block; image-rendering: auto; }
        .play-btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 36px; height: 36px; background: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .play-btn:hover { background: #b91c1c; }
      `}</style>
    </BottomModal>
  );
}
