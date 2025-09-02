import "../../../styles/pages/admin/Modal/MediaModal.scss";
import React, { useEffect, useMemo, useState } from "react";

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

export default function MediaModal({ open, onClose, editable = true, data = {}, onSave }) {
  const [draft, setDraft] = useState(data);

  // Screenshot kartları için local state (title düzenlenebilsin diye)
  const [shots, setShots] = useState([]);

  useEffect(() => {
    setDraft(data);
    const urls = (data?.screenshots || data?.Screenshots || []); // camel/pascal olasılığı
    const initial = urls.map((url, i) => ({
      url,
      title: `Screenshot ${i + 1}`,
      meta: { type: "Screenshot", source: "RAWG", orientation: "Landscape", quality: "High Resolution" }
    }));
    setShots(initial);
  }, [data, open]);

  const handleTitleChange = (idx, value) => {
    setShots(prev => {
      const next = prev.slice();
      next[idx] = { ...next[idx], title: value };
      return next;
    });
  };

  const handleSave = () => {
    const payload = {
      urls: shots.map(s => s.url),
      titles: shots.map(s => s.title),
      raw: shots
    };
    onSave?.(payload);
    onClose?.();
  };

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big" style={{ gap: 16 }}>
        {/* Header */}
        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
          <div className="col header-row">
            <h3>🖼️ Gallery &amp; Videos</h3>
            
            <div className="header-actions">
              <span className="gd-sub">{shots.length} selections</span>
            </div>
          </div>
          <span className="">Manage game media, screenshots, artworks, and videos</span>
        </div>

        {/* SCREENSHOTS LISTESİ */}
<div className="media-grid three-fixed">
  {shots.map((it, i) => (
    <div className="media-card" key={i}>
      <div className="media-preview">
        <img src={it.url} alt={it.title} className="media-img" />
        <span className="tag purple">Image</span>
      </div>

      <div className="media-fields">
        <label>Media URL</label>
        <input type="text" value={it.url} readOnly />

        <label>Title</label>
        <input
          type="text"
          value={it.title}
          onChange={(e) => handleTitleChange(i, e.target.value)}
          disabled={!editable}
        />

        <label className="meta-label">Metadata</label>
        <div className="meta-grid">
          <select value="Screenshot" disabled><option>Screenshot</option></select>
          <select value="RAWG" disabled><option>RAWG</option></select>
          <select value="Landscape" disabled><option>Landscape</option></select>
          <select value="High Resolution" disabled><option>High Resolution</option></select>
        </div>
      </div>
    </div>
  ))}
</div>

        {/* FOOTER ACTIONS */}
      
      </div>
    </BottomModal>
  );
}
