import "../../../styles/pages/admin/Modal/MediaModal.scss";
import React, { useEffect, useState } from "react";

/** Basit bottom sheet */
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

// URL'den YouTube ID çıkar (youtu.be, watch?v=, shorts, embed)
function parseYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.split("/").filter(Boolean)[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex(p => ["embed", "shorts", "live"].includes(p.toLowerCase()));
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch { /* noop */ }
  return null;
}

function youtubeThumb(id, quality = "hqdefault") {
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
}

// Metadata label seçenekleri
const LABEL_OPTIONS = [
  { value: "",           text: "Select Label" },
  { value: "Scene",      text: "Scene" },
  { value: "Date",       text: "Date" },
  { value: "Photographer", text: "Photographer" },
  { value: "Note",       text: "Note" },
  { value: "Character(s)", text: "Character(s)" },
  { value: "Copyright",  text: "Copyright" },
  { value: "Location",   text: "Location" },
  { value: "Description", text: "Description" },
  { value: "Episode",    text: "Episode" },
  { value: "Artist",     text: "Artist" },
];

export default function MediaModal({ open, onClose, editable = true, data = {}, onSave }) {
  const [shots, setShots] = useState([]); // images
  const [vids, setVids]   = useState([]); // videos

  // Modal açıldığında data'dan yükle
  useEffect(() => {
    if (!open) return;

    const mappedImages = Array.isArray(data?.images)
      ? data.images
          .filter(Boolean)
          .map((x, i) => ({
            url: x.url ?? x.Url ?? "",
            title: x.title ?? x.Title ?? `Screenshot ${i + 1}`,
            metaDatas: Array.isArray(x.metaDatas || x.MetaDatas) ? [...(x.metaDatas || x.MetaDatas)] : [],
          }))
          .filter(x => true) // yeni eklemelerde url boş olabilir
      : [];

    const mappedVideos = Array.isArray(data?.videos)
      ? data.videos
          .filter(Boolean)
          .map((x, i) => {
            const url = x.url ?? x.Url ?? "";
            const derivedId = (x.youTubeId ?? x.YouTubeId) || parseYouTubeId(url);
            return {
              url,
              youTubeId: derivedId,
              title: x.title ?? x.Title ?? `Trailer ${i + 1}`,
              metaDatas: Array.isArray(x.metaDatas || x.MetaDatas) ? [...(x.metaDatas || x.MetaDatas)] : [],
            };
          })
          .filter(x => true)
      : [];

    setShots(mappedImages);
    setVids(mappedVideos);
  }, [data, open]);

  // ---- Kart ekleme (Add Image / Add Video) ----
  const addNewImage = () => {
    if (!editable) return;
    setShots(prev => [
      ...prev,
      { url: "", title: "", metaDatas: [], _isNew: true }
    ]);
  };
  const addNewVideo = () => {
    if (!editable) return;
    setVids(prev => [
      ...prev,
      { url: "", youTubeId: null, title: "", metaDatas: [], _isNew: true }
    ]);
  };

  // --- KART SİLME (Hover X) ---
  const removeImage = (idx) => {
    if (!editable) return;
    setShots(prev => prev.filter((_, i) => i !== idx));
  };
  const removeVideo = (idx) => {
    if (!editable) return;
    setVids(prev => prev.filter((_, i) => i !== idx));
  };

  // --- Field değişimleri ---
  const handleImageTitleChange = (idx, value) => {
    setShots(prev => {
      const next = prev.slice(); next[idx] = { ...next[idx], title: value }; return next;
    });
  };
  const handleImageUrlChange = (idx, value) => {
    setShots(prev => {
      const next = prev.slice(); next[idx] = { ...next[idx], url: value }; return next;
    });
  };

  const handleVideoTitleChange = (idx, value) => {
    setVids(prev => {
      const next = prev.slice(); next[idx] = { ...next[idx], title: value }; return next;
    });
  };
  const handleVideoUrlChange = (idx, value) => {
    setVids(prev => {
      const next = prev.slice();
      next[idx] = { ...next[idx], url: value, youTubeId: parseYouTubeId(value) };
      return next;
    });
  };

  // ---- Metadata helpers (Images) ----
  const addImageMeta = (i) => {
    if (!editable) return;
    setShots(prev => {
      const next = prev.slice();
      const list = Array.isArray(next[i].metaDatas) ? next[i].metaDatas.slice() : [];
      list.push({ label: "", value: "" });
      next[i] = { ...next[i], metaDatas: list };
      return next;
    });
  };
  const removeImageMeta = (i, mIdx) => {
    if (!editable) return;
    setShots(prev => {
      const next = prev.slice();
      const list = (next[i].metaDatas || []).slice();
      list.splice(mIdx, 1);
      next[i] = { ...next[i], metaDatas: list };
      return next;
    });
  };
  const changeImageMetaLabel = (i, mIdx, label) => {
    if (!editable) return;
    setShots(prev => {
      const next = prev.slice();
      const list = (next[i].metaDatas || []).slice();
      list[mIdx] = { ...list[mIdx], label };
      next[i] = { ...next[i], metaDatas: list };
      return next;
    });
  };
  const changeImageMetaValue = (i, mIdx, value) => {
    if (!editable) return;
    setShots(prev => {
      const next = prev.slice();
      const list = (next[i].metaDatas || []).slice();
      list[mIdx] = { ...list[mIdx], value };
      next[i] = { ...next[i], metaDatas: list };
      return next;
    });
  };

  // ---- Metadata helpers (Videos) ----
  const addVideoMeta = (i) => {
    if (!editable) return;
    setVids(prev => {
      const next = prev.slice();
      const list = Array.isArray(next[i].metaDatas) ? next[i].metaDatas.slice() : [];
      list.push({ label: "", value: "" });
      next[i] = { ...next[i], metaDatas: list };
      return next;
    });
  };
  const removeVideoMeta = (i, mIdx) => {
    if (!editable) return;
    setVids(prev => {
      const next = prev.slice();
      const list = (next[i].metaDatas || []).slice();
      list.splice(mIdx, 1);
      next[i] = { ...next[i], metaDatas: list };
      return next;
    });
  };
  const changeVideoMetaLabel = (i, mIdx, label) => {
    if (!editable) return;
    setVids(prev => {
      const next = prev.slice();
      const list = (next[i].metaDatas || []).slice();
      list[mIdx] = { ...list[mIdx], label };
      next[i] = { ...next[i], metaDatas: list };
      return next;
    });
  };
  const changeVideoMetaValue = (i, mIdx, value) => {
    if (!editable) return;
    setVids(prev => {
      const next = prev.slice();
      const list = (next[i].metaDatas || []).slice();
      list[mIdx] = { ...list[mIdx], value };
      next[i] = { ...next[i], metaDatas: list };
      return next;
    });
  };

  // ---- Kaydet ----
  const handleSave = () => {
    const payload = {
      images: shots.map((s, i) => ({
        url: (s.url ?? "").trim(),
        title: (s.title ?? "").trim() || `Screenshot ${i + 1}`,
        metaDatas: (s.metaDatas || [])
          .filter(m => (m?.label ?? "") !== "" || (m?.value ?? "") !== "")
          .map(m => ({ label: m.label ?? "", value: m.value ?? "" })),
      })).filter(x => x.url || x.title), // boş tamamen at
      videos: vids.map((v, i) => {
        const id = v.youTubeId || parseYouTubeId(v.url || "");
        return {
          url: id ? `https://youtu.be/${id}` : (v.url ?? ""),
          title: (v.title ?? "").trim() || `Trailer ${i + 1}`,
          youTubeId: id ?? null,
          metaDatas: (v.metaDatas || [])
            .filter(m => (m?.label ?? "") !== "" || (m?.value ?? "") !== "")
            .map(m => ({ label: m.label ?? "", value: m.value ?? "" })),
        };
      }).filter(x => x.url || x.youTubeId || x.title),
    };
    onSave?.(payload);
  };

  useEffect(() => {
    const onGlobalSave = () => {
      if (!open) return;
      handleSave();
    };
    window.addEventListener("ggdb:media-save-request", onGlobalSave);
    return () => window.removeEventListener("ggdb:media-save-request", onGlobalSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shots, vids]);

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big" style={{ gap: 16 }}>

        {/* Header */}
        <div className="grid" style={{ gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
          <div className="col header-row">
            <h3>🖼️ Gallery &amp; Videos</h3>
            <span className="gd-sub">Manage game media, screenshots, artworks, and videos</span>
          </div>

          {/* YENİ: Add butonları */}
          {editable && (
            <div className="header-actions flex gap-2">
              <button type="button" className="btn gradient blue big" onClick={addNewImage}>
                <span role="img" aria-label="camera">📷</span>&nbsp; Add Image
              </button>
              <button type="button" className="btn gradient pink big" onClick={addNewVideo}>
                <span role="img" aria-label="clapper">🎬</span>&nbsp; Add Video
              </button>
            </div>
          )}
        </div>

        {/* IMAGES */}
        <div className="media-grid three-fixed">
          {shots.map((it, i) => (
            <div className="media-card" key={`img-${i}`}>
              <div className="media-preview">
                {/* Hover’da sol üst kırmızı X */}
                {editable && (
                  <button
                    type="button"
                    className="kill-btn"
                    onClick={() => removeImage(i)}
                    aria-label="Remove image"
                    title="Remove image"
                  >
                    ✕
                  </button>
                )}

                {it.url ? (
                  <img src={it.url} alt={it.title || "image"} className="media-img" />
                ) : (
                  <div className="media-img placeholder">
                    <span className="emoji">🖼️</span>
                    <div className="muted">No Preview</div>
                  </div>
                )}
                <span className="tag purple">Image</span>
              </div>

              <div className="media-fields">
                <label>Media URL</label>
                <input
                  type="text"
                  value={it.url}
                  onChange={(e) => handleImageUrlChange(i, e.target.value)}
                  placeholder="Paste image URL"
                  disabled={!editable}
                />

                <label>Title</label>
                <input
                  type="text"
                  value={it.title}
                  onChange={(e) => handleImageTitleChange(i, e.target.value)}
                  placeholder="Media title"
                  disabled={!editable}
                />

                <label className="meta-label">Metadata</label>

                {(it.metaDatas || []).length === 0 && (
                  <div className="muted">No metadata</div>
                )}

                {(it.metaDatas || []).map((m, mIdx) => (
                  <div
                    className="meta-row"
                    style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 10, marginBottom: 8 }}
                    key={`img-${i}-m-${mIdx}`}
                  >
                    <select
                      value={m.label ?? ""}
                      onChange={(e) => changeImageMetaLabel(i, mIdx, e.target.value)}
                      disabled={!editable}
                    >
                      {LABEL_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.text}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={m.value ?? ""}
                      onChange={(e) => changeImageMetaValue(i, mIdx, e.target.value)}
                      placeholder="Enter value"
                      disabled={!editable}
                    />
                    {editable && (
                      <button type="button" className="btn danger ghost" onClick={() => removeImageMeta(i, mIdx)}>✕</button>
                    )}
                  </div>
                ))}

                {editable && (
                  <button type="button" className="btn small" onClick={() => addImageMeta(i)}>＋ Add Meta</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* VIDEOS */}
        {vids.length > 0 && (
          <>
            <div style={{ marginTop: 24 }}>
              <h4 style={{ margin: "8px 0 12px" }}>🎬 Videos</h4>
            </div>

            <div className="media-grid three-fixed">
              {vids.map((it, i) => (
                <div className="media-card" key={`vid-${i}`}>
                  <div className="media-preview">
                    {/* Hover’da sol üst kırmızı X */}
                    {editable && (
                      <button
                        type="button"
                        className="kill-btn"
                        onClick={() => removeVideo(i)}
                        aria-label="Remove video"
                        title="Remove video"
                      >
                        ✕
                      </button>
                    )}

                    {it.youTubeId ? (
                      <div
                        className="media-img"
                        onClick={() => window.open(`https://youtu.be/${it.youTubeId}`,"_blank")}
                        style={{ position:"relative", cursor:"pointer" }}
                        title="Open in YouTube"
                      >
                        <img
                          src={youtubeThumb(it.youTubeId)}
                          alt={it.title || "video"}
                          className="media-img"
                          style={{ objectFit:"cover", borderRadius: 12 }}
                        />
                        {/* Play overlay */}
                        <div style={{
                          position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center"
                        }}>
                          <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: "rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center",
                            backdropFilter:"blur(2px)"
                          }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden>
                              <path d="M8 5v14l11-7z"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="media-img placeholder">
                        <span className="emoji">🎬</span>
                        <div className="muted">No Preview</div>
                      </div>
                    )}
                    <span className="tag purple">{it.youTubeId ? "YouTube" : "Video"}</span>
                  </div>

                  <div className="media-fields">
                    <label>Media URL</label>
                    <input
                      type="text"
                      value={it.url}
                      onChange={(e) => handleVideoUrlChange(i, e.target.value)}
                      placeholder="Paste YouTube link"
                      disabled={!editable}
                    />

                    <label>Title</label>
                    <input
                      type="text"
                      value={it.title}
                      onChange={(e) => handleVideoTitleChange(i, e.target.value)}
                      placeholder="Media title"
                      disabled={!editable}
                    />

                    <label className="meta-label">Metadata</label>

                    {(it.metaDatas || []).length === 0 && (
                      <div className="muted">No metadata</div>
                    )}

                    {(it.metaDatas || []).map((m, mIdx) => (
                      <div
                        className="meta-row"
                        style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 10, marginBottom: 8 }}
                        key={`vid-${i}-m-${mIdx}`}
                      >
                        <select
                          value={m.label ?? ""}
                          onChange={(e) => changeVideoMetaLabel(i, mIdx, e.target.value)}
                          disabled={!editable}
                        >
                          {LABEL_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.text}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={m.value ?? ""}
                          onChange={(e) => changeVideoMetaValue(i, mIdx, e.target.value)}
                          placeholder="Enter value"
                          disabled={!editable}
                        />
                        {editable && (
                          <button type="button" className="btn danger ghost" onClick={() => removeVideoMeta(i, mIdx)}>✕</button>
                        )}
                      </div>
                    ))}

                    {editable && (
                      <button type="button" className="btn small" onClick={() => addVideoMeta(i)}>＋ Add Meta</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </BottomModal>
  );
}
