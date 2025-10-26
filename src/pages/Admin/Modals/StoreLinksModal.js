import React, { useEffect, useState } from "react";
import "../../../styles/pages/admin/_game-detail-admin.scss";

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

export default function StoreLinksModal({ open, onClose, editable, data, onSave }) {
  const [draft, setDraft] = useState({ storeLinks: [] });

  // modal açıldığında / data değiştiğinde normalize et
  useEffect(() => {
    const src = Array.isArray(data?.storeLinks) ? data.storeLinks : [];
    const normalized = src.map((x) => ({
      store:  x.store  ?? x.Store  ?? "",
      domain: x.domain ?? x.Domain ?? "",
      url:    x.url    ?? x.Url    ?? "",
      price:  x.price ?? x.Price ?? null,
      ...x,
    }));
    setDraft({ storeLinks: normalized });
  }, [data, open]);

  // Parent Save tetiklenince yakala
  useEffect(() => {
    const handler = () => onSave({ storeLinks: draft.storeLinks });
    window.addEventListener("ggdb:stores-save-request", handler);
    return () => window.removeEventListener("ggdb:stores-save-request", handler);
  }, [draft, onSave]);

  const updateLink = (idx, patch) => {
    setDraft((s) => {
      const next = s.storeLinks.slice();
      const merged = { ...next[idx], ...patch };
      if ("store" in patch)  merged.store  = (merged.store  || "").trim();
      if ("domain" in patch) merged.domain = (merged.domain || "").trim();
      if ("url" in patch)    merged.url    = (merged.url    || "").trim();
      next[idx] = merged;
      return { ...s, storeLinks: next };
    });
  };

  const addLink = () => {
    setDraft((s) => ({
      ...s,
      storeLinks: [...s.storeLinks, { store: "", domain: "", url: "", price: "" }],
    }));
  };

  const removeLink = (idx) => {
    setDraft((s) => {
      const next = s.storeLinks.slice();
      next.splice(idx, 1);
      return { ...s, storeLinks: next };
    });
  };

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big" style={{ gap: 16 }}>
        {/* Başlık */}
        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
          <div className="col" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0 }}>🛒 Store Links</h3>
            <div style={{ marginLeft: "auto" }} className="gd-sub">
              {draft.storeLinks.length} link
            </div>
          </div>
        </div>

        {/* Liste */}
        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 10 }}>
          {draft.storeLinks.length === 0 && (
            <div className="gd-sub" style={{ opacity: 0.8 }}>
              Henüz link yok.
            </div>
          )}

          {draft.storeLinks.map((row, i) => (
            <div
              key={i}
              className="card"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gridTemplateColumns: "1fr 1.2fr 1.8fr 0.8fr auto",
                gap: 8,
                alignItems: "center",
              }}
            >
              {/* STORE */}
              <div>
                <label className="gd-label">Store</label>
                <input
                  type="text"
                  placeholder="e.g., Steam / Epic Games / GOG"
                  value={row.store ?? ""}
                  onChange={(e) => updateLink(i, { store: e.target.value })}
                  disabled={!editable}
                />
              </div>

              {/* DOMAIN */}
              <div>
                <label className="gd-label">Domain</label>
                <input
                  type="text"
                  placeholder="store.steampowered.com"
                  value={row.domain ?? ""}
                  onChange={(e) => updateLink(i, { domain: e.target.value })}
                  disabled={!editable}
                />
              </div>

              {/* URL */}
              <div>
                <label className="gd-label">URL</label>
                <input
                  type="url"
                  placeholder="https://store…"
                  value={row.url ?? ""}
                  onChange={(e) => updateLink(i, { url: e.target.value })}
                  disabled={!editable}
                />
              </div>

              {/* PRICE (en sonda) */}
              <div>
                <label className="gd-label">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g 19.99"
                  value={row.price ?? ""}
                  onChange={(e) => updateLink(i, { price: e.target.value })}
                  disabled={!editable}
                />
              </div>

              {/* Sil butonu sadece edit modunda */}
              {editable && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => removeLink(i)}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ekle butonu (sadece edit modunda) */}
        {editable && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="button" className="btn small primary" onClick={addLink}>
              + Add Link
            </button>
          </div>
        )}
      </div>
    </BottomModal>
  );
}
