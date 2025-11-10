import "../../../styles/pages/admin/Modal/DictionaryModal.scss";
import React, { useEffect, useState, useCallback } from "react";

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

/* helpers */
const toCsv = (arr) => Array.isArray(arr) ? arr.join(", ") : (arr ?? "");
const toList = (s) =>
  (s || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

function Section({ emoji, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 8px" }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <h4 style={{ margin: 0 }}>{title}</h4>
    </div>
  );
}

/**
 * DictionaryModal
 * props:
 *  - open, onClose, editable
 *  - data: GameDetailDto (GET /games/{id})
 *  - onSave: (payload) => void
 *
 * Kaydederken:
 *  Dictionary: string[]
 */
export default function DictionaryModal({ open, onClose, editable = true, data = {}, onSave }) {
  // GGDB'nin field casing yapısına göre normalize et
  const mapIn = (src = {}) => ({
    dictionaryCsv: toCsv(src.dictionary ?? src.Dictionary ?? []),
  });

  const [form, setForm] = useState(mapIn(data));

  useEffect(() => {
    if (open) setForm(mapIn(data));
  }, [open, data]);

  const setVal = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  /** Kaydetme mantığı */
  const handleSave = useCallback(() => {
    if (!open) return;

    const payload = {
      dictionary: toList(form.dictionaryCsv),
    };

    onSave?.(payload);
  }, [open, form, onSave]);

  // Global Save (üstteki ana "💾 Save" butonuna basınca tetiklenir)
  useEffect(() => {
    window.addEventListener("ggdb:dictionary-save-request", handleSave);
    return () => window.removeEventListener("ggdb:dictionary-save-request", handleSave);
  }, [handleSave]);

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big" style={{ gap: 18 }}>
        <Section emoji="🧠" title="Dictionary / Synonyms" />

        <p className="gd-subtext" style={{ marginBottom: 10 }}>
          Oyunun bilinen diğer adlarını buraya virgülle ayırarak ekleyebilirsin.
          <br />
          Örnek: <code>GTA 5, GTA V, Grand Theft Auto 5</code>
        </p>

        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="col">
            <label>Synonyms</label>
            <input
              type="text"
              placeholder="örnek: GTA 5, GTA V, Grand Theft Auto 5"
              value={form.dictionaryCsv}
              onChange={(e) => setVal("dictionaryCsv", e.target.value)}
              disabled={!editable}
            />
          </div>
        </div>
      </div>
    </BottomModal>
  );
}
