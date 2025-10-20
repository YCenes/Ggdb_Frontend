// src/pages/admin/modals/BannerMediaModal.jsx
import React, { useEffect, useMemo, useState } from "react";

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

/** ---- Helpers ---- */
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

/** ---- Bootstrap style, controlled modal ---- */
function GalleryPickerModal({ show, title, items, mode, onPick, onClose }) {
  // mode: "image" | "video"
  // items: normalized array (image: {url,title,metaDatas}, video: {url,title,youTubeId,metaDatas})
  const body = (
    <div className="container-fluid py-3">
      <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-4">
     {items.map((it, i) => {
  const isVideo = mode === "video";
  const ytId = isVideo ? (it.youTubeId || parseYouTubeId(it.url)) : null;

  // Başlangıç kapak (yüksek çözünürlük)
  const initialSrc = isVideo && ytId
    ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`
    : hiRes(it.url);

  return (
    <div className="col" key={i}>
      <div
        className="card bg-dark border-0 shadow-sm h-100 selectable-card"
        role="button"
        onClick={() => onPick(it)}
      >
        <div className="ratio ratio-16x9 card-img-top overflow-hidden position-relative">
          {initialSrc ? (
            <img
              src={initialSrc}
              alt={it.title || (isVideo ? "Video" : "Screenshot")}
              className="object-fit-cover gallery-thumb"
              draggable={false}
              onError={(e) => {
                // maxres → sd → hq fallback
                if (!isVideo || !ytId) return;
                const step = e.currentTarget.getAttribute("data-step") || "0";
                if (step === "0") {
                  e.currentTarget.src = `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`;
                  e.currentTarget.setAttribute("data-step", "1");
                } else if (step === "1") {
                  e.currentTarget.src = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
                  e.currentTarget.setAttribute("data-step", "2");
                }
              }}
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center bg-black-50">
              <span className="text-secondary small">No preview</span>
            </div>
          )}
        </div>

        <div className="card-body py-2">
          <div className="text-white fw-semibold small text-truncate">
            {it.title || (isVideo ? "Game Trailer" : "Game Screenshot")}
          </div>
          <div className="text-secondary text-uppercase" style={{ fontSize: 11 }}>
            {isVideo ? "YOUTUBE" : "SCREENSHOT"}
          </div>
        </div>
      </div>
    </div>
  );
})}
        {items.length === 0 && (
          <div className="col">
            <div className="text-secondary small">No items found.</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className={`modal fade ${show ? "show d-block" : ""}`} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content bg-dark border-light">
            <div className="modal-header border-secondary">
              <h5 className="modal-title text-white">{title}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} />
            </div>
            <div className="modal-body p-0">{body}</div>
          </div>
        </div>
      </div>
      {show && <div className="modal-backdrop fade show" onClick={onClose} />}
      <style>{`
        .selectable-card:hover { outline: 2px solid rgba(245, 158, 11, .8); }
        .object-fit-cover { object-fit: cover; width: 100%; height: 100%; }
        .bg-black-50 { background: rgba(0,0,0,.5); }
      `}</style>
    </>
  );
}

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
  }, [data, open]);

  // Parent Save → tam objeler draft’ta mevcut
  useEffect(() => {
    const handler = () => onSave(draft);
    window.addEventListener("ggdb:banner-save-request", handler);
    return () => window.removeEventListener("ggdb:banner-save-request", handler);
  }, [draft, onSave]);

  // ---- Modal state ----
  const [picker, setPicker] = useState({show:false, mode:"image", title:"", target:"featured"}); 
  // target: "featured" | "poster" | "trailer"

  // --- Render değerleri ---
  const featuredUrl = hiRes(draft.featuredBackground ?? null);
  const posterUrl   = hiRes(draft.posterImage ?? null);
  const videoUrl    = draft.trailerVideo ?? null;

  const ytId = draft.trailerVideoObj?.youTubeId || parseYouTubeId(videoUrl ?? null);

  // ---- Handlers ----
  const openPicker = (target) => {
    if (!editable) return;
    if (target === "trailer") {
      setPicker({show:true, mode:"video", title:"Select Trailer / Video", target});
    } else if (target === "poster") {
      setPicker({show:true, mode:"image", title:"Select Poster Image", target});
    } else {
      setPicker({show:true, mode:"image", title:"Select Featured Background", target});
    }
  };
  const closePicker = () => setPicker((p)=>({...p, show:false}));

  const handlePick = (obj) => {
    if (picker.mode === "image") {
      const img = normImage(obj);
      if (picker.target === "featured") {
        setDraft((d)=>({...d, featuredBackground: hiRes(img.url), featuredImageObj: img}));
      } else {
        setDraft((d)=>({...d, posterImage: hiRes(img.url), posterImageObj: img}));
      }
    } else {
      const vid = normVideo(obj);
      setDraft((d)=>({...d, trailerVideo: vid.url, trailerVideoObj: vid}));
    }
    closePicker();
  };

  return (
    <>
      {/* Ana modalın kendisi hâlihazırda projectte özel bir bottom sheet ise – bunu koruyoruz */}
      <BottomModal open={open} onClose={onClose}>
      <div className="banner-media-container">
        {/* Header */}
        <div className="d-flex align-items-center gap-2 px-4 pt-4 mb-4">
          <div className="rounded bg-purple p-2 d-flex align-items-center justify-content-center" style={{width:32,height:32,background:"#8b5cf6"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M4 3a2 2 0 0 0-2 2v1.816a14.94 14.94 0 0 0 8 2.184 14.94 14.94 0 0 0 8-2.184V5a2 2 0 0 0-2-2H4Z"/><path d="M6.447 8.894A12.95 12.95 0 0 0 10 9c1.193 0 2.37-.071 3.553-.106L18 11v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5l4.447-2.106Z"/></svg>
          </div>
          <div>
            <h2 className="m-0 fw-bold" style={{color:"var(--text)", fontSize:20}}>Banner &amp; Media Override</h2>
            <p className="m-0 small" style={{color:"var(--muted)"}}>Customize visual elements and override game media</p>
          </div>
        </div>

        {/* Available */}
        <div className="px-4 mb-4">
          <div className="d-flex align-items-center gap-2 small" style={{color:"var(--green)"}}>
            <span className="rounded-circle" style={{width:8,height:8,background:"var(--green)"}}/>
            <span>{(data?.images||[]).length} images + {(data?.videos||[]).length} videos available (from IGDB)</span>
          </div>
        </div>

        {/* Featured Section Background */}
        <div className="section-card mx-4 mb-4 p-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span>🌟</span>
              <h3 className="m-0 fw-bold" style={{color:"var(--amber)"}}>Featured Section Background</h3>
            </div>
            {editable && (
              <button className="btn btn-sm btn-outline-warning" onClick={()=>openPicker("featured")}>
                Change
              </button>
            )}
          </div>
          <p className="text-secondary small mt-2 mb-3">Background image to be used when featured on the main page</p>

          <div className="position-relative rounded overflow-hidden" style={{height:240, background:"#0b1220"}}>
            {featuredUrl ? (
              <img src={featuredUrl} alt="Featured preview" className="w-100 h-100" style={{objectFit:"contain"}} />
            ) : (
              <div className="w-100 h-100" style={{background:"linear-gradient(135deg,#1e3a8a 0%,#0f766e 100%)"}}/>
            )}
            <div className="position-absolute top-0 start-0 m-3 badge text-bg-warning text-dark fw-semibold">🎮 Featured Override</div>
          </div>
        </div>

        {/* Bottom two cards */}
        <div className="row g-4 px-4 pb-4">
          {/* Poster */}
          <div className="col-12 col-md-6">
            <div className="section-card p-4 h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span>🖼️</span>
                  <h3 className="m-0 fw-bold" style={{color:"#06b6d4"}}>Poster Image</h3>
                </div>
                {editable && (
                  <button className="btn btn-sm btn-outline-info" onClick={()=>openPicker("poster")}>
                    Change
                  </button>
                )}
              </div>
              <p className="text-secondary small mt-2 mb-3">Poster to be used in game cards and detail pages</p>

              <div className="d-flex justify-content-center mt-3">
                <div className="shadow" style={{width:140, height:196}}>
                  <div
                    className="rounded-3"
                    style={{
                      width:"100%", height:"100%",
                      backgroundImage: posterUrl ? `url(${posterUrl})` : "linear-gradient(180deg,#d97706 0%,#ea580c 100%)",
                      backgroundSize:"cover", backgroundPosition:"center"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Trailer */}
          <div className="col-12 col-md-6">
            <div className="section-card p-4 h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span>🎬</span>
                  <h3 className="m-0 fw-bold" style={{color:"var(--accent-2)"}}>Trailer / Video</h3>
                </div>
                {editable && (
                  <button className="btn btn-sm btn-outline-danger" onClick={()=>openPicker("trailer")}>
                    Change
                  </button>
                )}
              </div>
              <p className="text-secondary small mt-2 mb-3">Game trailer or gameplay footage</p>

              <div className="small mb-2" style={{color:"var(--green)"}}>
                🎥 {(data?.videos || []).length} videos available (from IGDB)
              </div>

              <div className="position-relative rounded overflow-hidden" style={{height:160, background:"#0b1220"}}>
                {ytId && (
                  <img
                    className="w-100 h-100"
                    style={{objectFit:"contain"}}
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
                <div className="position-absolute top-50 start-50 translate-middle rounded-circle d-flex align-items-center justify-content-center" style={{width:36,height:36,background:"#dc2626",boxShadow:"0 4px 12px rgba(0,0,0,.3)"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Picker modal */}
      <GalleryPickerModal
        show={picker.show}
        title={picker.title}
        items={(picker.mode === "image" ? availableImages.map(normImage) : availableVideos.map(normVideo))}
        mode={picker.mode}
        onPick={handlePick}
        onClose={closePicker}
      />
      </BottomModal>

      {/* small local styles used by this component */}
      <style>{`
        .section-card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: var(--card-radius);
          box-shadow: var(--shadow);
        }
        
      `}</style>

      
    </>
  );
}
