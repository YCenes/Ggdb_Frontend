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


const COMMON_LANGS = [
  "English","Turkish","French","Italian","German","Spanish (Spain)","Portuguese (Brazil)",
  "Portuguese","Japanese","Korean","Polish","Russian","Arabic","Chinese (Simplified)",
  "Chinese (Traditional)"
];

/** Seçerek ekleyen, sade üst bar (sadece edit modunda gösteriyoruz) */
function SelectLangAdder({ options, values, onAdd, disabled, label }) {
  const [sel, setSel] = useState("");

  const add = () => {
    const v = (sel || "").trim();
    if (!v) return;
    const has = (values || []).some(x => x.toLowerCase() === v.toLowerCase());
    if (!has) onAdd(v);
    setSel("");
  };

  // seçilmişleri listeden düş
  const available = options.filter(
    o => !(values || []).some(v => v.toLowerCase() === o.toLowerCase())
  );

  return (
    <div className="lang-adder">
      <div className="la-left">
        <div className="gd-label">{label}</div>
      </div>
      <div className="la-right">
        <select
          className="la-select"
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          disabled={disabled}
        >
          <option value="">— Select language —</option>
          {available.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <button
          type="button"
          className="btn primary la-add"
          onClick={add}
          disabled={disabled || !sel}
          title="Add language"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

/** Seçilmiş dilleri gösteren chip listesi */
function ChipList({ items, onRemove, editable }) {
  if (!items || items.length === 0) {
    return <div className="gd-sub" style={{ marginTop: 6 }}>No languages selected</div>;
  }
  return (
    <div className="chipwrap">
      {items.map((lang) => (
        <span key={lang} className="chip lg">
          {lang}
          {editable && (
            <button
              type="button"
              className="chip-x"
              onClick={() => onRemove(lang)}
              aria-label={`Remove ${lang}`}
              title="Remove"
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

export default function LanguagesModal({ open, onClose, editable, data, onSave }) {
  const [draft, setDraft] = useState({
    audioLanguages: data?.audioLanguages ?? data?.audio_language ?? data?.audio ?? [],
    subtitleLanguages: data?.subtitleLanguages ?? data?.subtitles ?? [],
    interfaceLanguages: data?.interfaceLanguages ?? data?.interface_language ?? [],
  });

  useEffect(() => {
    setDraft({
      audioLanguages: data?.audioLanguages ?? data?.audio_language ?? data?.audio ?? [],
      subtitleLanguages: data?.subtitleLanguages ?? data?.subtitles ?? [],
      interfaceLanguages: data?.interfaceLanguages ?? data?.interface_language ?? [],
    });
  }, [data, open]);

  // Parent “Save” tetiklediğinde yakala
  useEffect(() => {
    const handler = () => onSave({
      audioLanguages: draft.audioLanguages,
      subtitleLanguages: draft.subtitleLanguages,
      interfaceLanguages: draft.interfaceLanguages,
    });
    window.addEventListener("ggdb:languages-save-request", handler);
    return () => window.removeEventListener("ggdb:languages-save-request", handler);
  }, [draft, onSave]);

  const removeFrom = (key, val) =>
    setDraft(s => ({ ...s, [key]: s[key].filter(x => x !== val) }));

  const addTo = (key, val) =>
    setDraft(s => ({ ...s, [key]: [...s[key], val] }));

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big" style={{ gap: 16 }}>
        {/* Header */}
        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
          <div className="col header-row">
            <h3>🌐 Language Support Management</h3>
            <div className="header-actions">
              <span className="gd-sub">
                {draft.audioLanguages.length + draft.subtitleLanguages.length + draft.interfaceLanguages.length} selections
              </span>
            </div>
          </div>
        </div>

        {/* Audio */}
        <section className="grid" style={{ gridTemplateColumns: "1fr", gap: 8 }}>
          <div className="col mt-2">
            {editable && (
              <SelectLangAdder
                label="🎙️ Audio Languages"
                options={COMMON_LANGS}
                values={draft.audioLanguages}
                onAdd={(v) => addTo("audioLanguages", v)}
                disabled={!editable}
              />
            )}
            {!editable && <div className="gd-label">🎙️ Audio Languages</div>}
            <ChipList
              items={draft.audioLanguages}
              onRemove={(v) => removeFrom("audioLanguages", v)}
              editable={editable}
            />
          </div>
        </section>

        {/* Subtitles */}
        <section className="grid" style={{ gridTemplateColumns: "1fr", gap: 8 }}>
          <div className="col mt-3">
            {editable && (
              <SelectLangAdder
                label="💬 Subtitle Languages"
                options={COMMON_LANGS}
                values={draft.subtitleLanguages}
                onAdd={(v) => addTo("subtitleLanguages", v)}
                disabled={!editable}
              />
            )}
            {!editable && <div className="gd-label">💬 Subtitle Languages</div>}
            <ChipList
              items={draft.subtitleLanguages}
              onRemove={(v) => removeFrom("subtitleLanguages", v)}
              editable={editable}
            />
          </div>
        </section>

        {/* Interface */}
        <section className="grid" style={{ gridTemplateColumns: "1fr", gap: 8 }}>
          <div className="col mt-3">
            {editable && (
              <SelectLangAdder
                label="🖥️ Interface Languages"
                options={COMMON_LANGS}
                values={draft.interfaceLanguages}
                onAdd={(v) => addTo("interfaceLanguages", v)}
                disabled={!editable}
              />
            )}
            {!editable && <div className="gd-label">🖥️ Interface Languages</div>}
            <ChipList
              items={draft.interfaceLanguages}
              onRemove={(v) => removeFrom("interfaceLanguages", v)}
              editable={editable}
            />
          </div>
        </section>
      </div>
    </BottomModal>
  );
}
